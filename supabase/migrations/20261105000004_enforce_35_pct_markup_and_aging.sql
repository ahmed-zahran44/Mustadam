-- 0004_enforce_35_pct_markup_and_aging.sql
-- Enforces ADR-009: 35% Markup on Cost for Tier 1 Pricing (Target_Selling_Price = round(Total_Unit_Cost * 1.35, 2))
-- and cascades through Tiers 1-4 in rpc_run_inventory_aging and fn_consume_harvested_spare_part.

CREATE OR REPLACE FUNCTION public.fn_consume_harvested_spare_part()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item_serial_id UUID;
BEGIN
    IF OLD.status = 'Available' AND NEW.status = 'Consumed' AND NEW.consumed_in_refurb_id IS NOT NULL THEN
        UPDATE public.refurbishment_logs
        SET parts_cost = parts_cost + NEW.estimated_cost
        WHERE refurb_id = NEW.consumed_in_refurb_id
        RETURNING item_serial_id INTO v_item_serial_id;

        IF v_item_serial_id IS NOT NULL THEN
            UPDATE public.serialized_items
            SET
                refurbishment_cost = refurbishment_cost + NEW.estimated_cost,
                total_unit_cost = COALESCE(final_purchase_price, 0) + COALESCE(logistics_cost, 0) + (refurbishment_cost + NEW.estimated_cost),
                target_selling_price = round((COALESCE(final_purchase_price, 0) + COALESCE(logistics_cost, 0) + (refurbishment_cost + NEW.estimated_cost)) * 1.35, 2)
            WHERE item_serial_id = v_item_serial_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_run_inventory_aging(
    p_reference_time TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item RECORD;
    v_days_listed INTEGER;
    v_target_price NUMERIC(12,2);
    v_aged_decommissioned INTEGER := 0;
    v_markdown_20_count INTEGER := 0;
    v_clearance_count INTEGER := 0;
    v_auto_rejected_offers INTEGER := 0;
BEGIN
    -- 1. 30-60-90 Inventory Aging Engine with 35% Tier 1 Markup on Cost (FR-17, FR-19, ADR-009)
    FOR v_item IN
        SELECT item_serial_id, listed_date, target_selling_price, total_unit_cost, current_status
        FROM public.serialized_items
        WHERE current_status = 'Listed_In_Store' AND listed_date IS NOT NULL
        FOR UPDATE
    LOOP
        v_days_listed := EXTRACT(DAY FROM (p_reference_time - v_item.listed_date));
        v_target_price := CASE
            WHEN COALESCE(v_item.total_unit_cost, 0) > 0 THEN round(v_item.total_unit_cost * 1.35, 2)
            ELSE COALESCE(v_item.target_selling_price, 0)
        END;

        IF v_days_listed <= 30 THEN
            UPDATE public.serialized_items
            SET
                aging_tier = '0_30',
                target_selling_price = v_target_price,
                selling_price = v_target_price
            WHERE item_serial_id = v_item.item_serial_id;

        ELSIF v_days_listed BETWEEN 31 AND 60 THEN
            UPDATE public.serialized_items
            SET
                aging_tier = '31_60',
                target_selling_price = v_target_price,
                selling_price = round(v_target_price * 0.80, 2)
            WHERE item_serial_id = v_item.item_serial_id;
            v_markdown_20_count := v_markdown_20_count + 1;

        ELSIF v_days_listed BETWEEN 61 AND 90 THEN
            UPDATE public.serialized_items
            SET
                aging_tier = '61_90',
                target_selling_price = v_target_price,
                selling_price = v_item.total_unit_cost
            WHERE item_serial_id = v_item.item_serial_id;
            v_clearance_count := v_clearance_count + 1;

        ELSE -- Day 91+ Decommissioned_Aged
            UPDATE public.serialized_items
            SET
                aging_tier = '91_plus',
                target_selling_price = v_target_price,
                current_status = 'Decommissioned_Aged'
            WHERE item_serial_id = v_item.item_serial_id;

            INSERT INTO public.dismantling_tickets (
                item_serial_id, trigger, status
            ) VALUES (
                v_item.item_serial_id, 'aged_out', 'open'
            );

            v_aged_decommissioned := v_aged_decommissioned + 1;
        END IF;
    END LOOP;

    -- 2. 7-Day (168-Hour) Offer Decision Auto-Reject (FR-12)
    FOR v_item IN
        SELECT item_serial_id, seller_decision, offer_expires_at, request_id
        FROM public.serialized_items
        WHERE current_status = 'Awaiting_Seller_Decision'
          AND offer_expires_at < p_reference_time
          AND (seller_decision IS NULL OR seller_decision = 'pending')
        FOR UPDATE
    LOOP
        UPDATE public.serialized_items
        SET
            seller_decision = 'auto_rejected',
            current_status = 'Return_In_Progress'
        WHERE item_serial_id = v_item.item_serial_id;

        INSERT INTO public.return_tasks (
            item_serial_id, fee_amount, fee_status, status
        ) VALUES (
            v_item.item_serial_id, 150.00, 'pending', 'awaiting_fee_payment'
        );

        INSERT INTO public.notifications (
            recipient_id, channel, type, message, status
        )
        SELECT
            ar.seller_id, 'sms', 'price_offer',
            'Offer expired after 7 days. Your item has been scheduled for return.', 'simulated'
        FROM public.acquisition_requests ar
        WHERE ar.request_id = v_item.request_id;

        v_auto_rejected_offers := v_auto_rejected_offers + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'markdown_20_count', v_markdown_20_count,
        'clearance_count', v_clearance_count,
        'aged_decommissioned_count', v_aged_decommissioned,
        'auto_rejected_offers_count', v_auto_rejected_offers
    );
END;
$$;

-- Align existing listed items with 35% Tier 1 markup and run aging cascade
UPDATE public.serialized_items
SET
    target_selling_price = round(total_unit_cost * 1.35, 2),
    selling_price = CASE
        WHEN aging_tier = '0_30' THEN round(total_unit_cost * 1.35, 2)
        WHEN aging_tier = '31_60' THEN round(round(total_unit_cost * 1.35, 2) * 0.80, 2)
        WHEN aging_tier = '61_90' THEN total_unit_cost
        ELSE selling_price
    END
WHERE total_unit_cost IS NOT NULL AND total_unit_cost > 0;

