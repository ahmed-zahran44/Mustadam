-- 0002_lifecycle_triggers_and_rpcs.sql
-- State transitions, audit logging, spare parts rollup, batch logistics & checkout concurrency

-- ============================================================================
-- 1. Helper Function: Current User Role from app_metadata / users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'),
        (SELECT role FROM public.users WHERE user_id = (SELECT auth.uid()))
    );
$$;

-- ============================================================================
-- 2. State Transition & Audit Trigger for Serialized Items
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_enforce_and_audit_item_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_req_data_wipe BOOLEAN;
    v_open_refurbs INTEGER;
    v_actor UUID;
BEGIN
    v_actor := auth.uid();

    -- On INSERT: Initial state defaults to 'Submitted' if not explicitly seeded
    IF TG_OP = 'INSERT' THEN
        IF NEW.current_status IS NULL THEN
            NEW.current_status := 'Submitted';
        END IF;
        RETURN NEW;
    END IF;

    -- If status hasn't changed, continue
    IF OLD.current_status = NEW.current_status THEN
        RETURN NEW;
    END IF;

    -- ------------------------------------------------------------------------
    -- State Transition Validation Matrix (SRS Section 4 & PROJECT.md Section 5)
    -- ------------------------------------------------------------------------
    IF NOT (
        (OLD.current_status = 'Submitted' AND NEW.current_status = 'Awaiting_Handover') OR
        (OLD.current_status = 'Awaiting_Handover' AND NEW.current_status IN ('Received_At_Dropoff_Hub', 'In_Transit_To_Warehouse')) OR
        (OLD.current_status = 'Received_At_Dropoff_Hub' AND NEW.current_status = 'In_Transit_To_Warehouse') OR
        (OLD.current_status = 'In_Transit_To_Warehouse' AND NEW.current_status = 'Received_Pending_Inspection') OR
        (OLD.current_status = 'Received_Pending_Inspection' AND NEW.current_status = 'Awaiting_Seller_Decision') OR
        (OLD.current_status = 'Awaiting_Seller_Decision' AND NEW.current_status IN ('Return_In_Progress', 'Listed_In_Store', 'Under_Refurbishment', 'Pending_Dismantling')) OR
        (OLD.current_status = 'Under_Refurbishment' AND NEW.current_status = 'Listed_In_Store') OR
        (OLD.current_status = 'Listed_In_Store' AND NEW.current_status IN ('Sold', 'Decommissioned_Aged')) OR
        (OLD.current_status = 'Decommissioned_Aged' AND NEW.current_status = 'Scrap_Ready_For_Recycling') OR
        (OLD.current_status = 'Pending_Dismantling' AND NEW.current_status = 'Scrap_Ready_For_Recycling') OR
        (OLD.current_status = 'Scrap_Ready_For_Recycling' AND NEW.current_status = 'Recycled_Closed')
    ) THEN
        RAISE EXCEPTION 'Illegal state transition from % to % for item %', OLD.current_status, NEW.current_status, OLD.item_serial_id;
    END IF;

    -- ------------------------------------------------------------------------
    -- Gate 1: Mandatory NIST 800-88 Data Wipe (FR-11)
    -- ------------------------------------------------------------------------
    IF OLD.current_status = 'Received_Pending_Inspection' AND NEW.current_status = 'Awaiting_Seller_Decision' THEN
        SELECT requires_data_wipe INTO v_req_data_wipe
        FROM public.categories
        WHERE category_id = NEW.category_id;

        IF v_req_data_wipe = true AND (NEW.data_wiped_bool IS NOT TRUE) THEN
            RAISE EXCEPTION 'Mandatory NIST 800-88 Data Wipe certification required before leaving inspection (FR-11)';
        END IF;

        -- Set 7-day (168h) offer expiry if not already set (FR-12)
        IF NEW.offer_expires_at IS NULL THEN
            NEW.offer_expires_at := now() + interval '7 days';
        END IF;
    END IF;

    -- ------------------------------------------------------------------------
    -- Gate 2: Refurbishment Ticket Closure (FR-13)
    -- ------------------------------------------------------------------------
    IF OLD.current_status = 'Under_Refurbishment' AND NEW.current_status = 'Listed_In_Store' THEN
        IF NEW.condition_grade IS NULL OR NEW.condition_grade NOT IN ('A', 'B', 'C') THEN
            RAISE EXCEPTION 'Condition Grade (A/B/C) is required when completing refurbishment';
        END IF;

        SELECT count(*) INTO v_open_refurbs
        FROM public.refurbishment_logs
        WHERE item_serial_id = NEW.item_serial_id AND status = 'open';

        IF v_open_refurbs > 0 THEN
            RAISE EXCEPTION 'Cannot list item in store with open refurbishment tickets';
        END IF;

        IF NEW.listed_date IS NULL THEN
            NEW.listed_date := now();
        END IF;
    END IF;

    -- ------------------------------------------------------------------------
    -- Append Immutable Audit Log (NFR-02)
    -- ------------------------------------------------------------------------
    INSERT INTO public.item_status_history (
        item_serial_id, changed_by, from_status, to_status, note, changed_at
    ) VALUES (
        NEW.item_serial_id, v_actor, OLD.current_status, NEW.current_status,
        CASE
            WHEN NEW.current_status = 'Decommissioned_Aged' THEN 'Auto-decommissioned after 90+ days unsold (FR-19)'
            WHEN NEW.current_status = 'Return_In_Progress' AND NEW.seller_decision = 'auto_rejected' THEN 'Auto-rejected after 7-day decision window expired (FR-12)'
            ELSE 'Lifecycle transition'
        END,
        now()
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_serialized_item_status
BEFORE INSERT OR UPDATE OF current_status ON public.serialized_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_and_audit_item_status();

CREATE OR REPLACE FUNCTION public.fn_log_initial_item_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.item_status_history (
        item_serial_id, changed_by, from_status, to_status, note, changed_at
    ) VALUES (
        NEW.item_serial_id, auth.uid(), NULL, NEW.current_status, 'Initial creation', now()
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_initial_serialized_item_status
AFTER INSERT ON public.serialized_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_initial_item_status();

-- Revoke mutation rights on item_status_history to guarantee immutability (NFR-02)
REVOKE UPDATE, DELETE ON public.item_status_history FROM PUBLIC;
REVOKE UPDATE, DELETE ON public.item_status_history FROM anon, authenticated;

-- ============================================================================
-- 3. Trigger: Harvested Spare Parts Valuation Rollup (FR-14, FR-15, FR-17)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_consume_harvested_spare_part()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item_serial_id UUID;
BEGIN
    -- Trigger when part transitions to Consumed with a linked refurbishment log
    IF OLD.status = 'Available' AND NEW.status = 'Consumed' AND NEW.consumed_in_refurb_id IS NOT NULL THEN
        -- Add estimated_cost to the refurbishment log
        UPDATE public.refurbishment_logs
        SET parts_cost = parts_cost + NEW.estimated_cost
        WHERE refurb_id = NEW.consumed_in_refurb_id
        RETURNING item_serial_id INTO v_item_serial_id;

        -- Update the item's refurbishment_cost, total_unit_cost, and Tier 1 target_selling_price (35% markup)
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

DROP TRIGGER IF EXISTS trg_consume_spare_part ON public.spare_parts_inventory;
CREATE TRIGGER trg_consume_spare_part
AFTER UPDATE OF status ON public.spare_parts_inventory
FOR EACH ROW
EXECUTE FUNCTION public.fn_consume_harvested_spare_part();

-- ============================================================================
-- 4. RPC: Equal Bulky Batch Logistics Split (FR-08, FR-17)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_allocate_batch_logistics_cost(
    p_manifest_id UUID,
    p_total_batch_cost NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item_count INTEGER;
    v_allocated NUMERIC(12,2);
BEGIN
    IF (SELECT public.current_user_role()) NOT IN ('Admin', 'Courier', 'Partner_Warehouse_Mgr') AND auth.uid() IS NOT NULL THEN
        RAISE EXCEPTION 'Unauthorized role for batch cost allocation';
    END IF;

    -- Update manifest total cost
    UPDATE public.pickup_manifests
    SET total_batch_logistics_cost = p_total_batch_cost
    WHERE manifest_id = p_manifest_id;

    -- Count serialized items linked to this manifest
    SELECT count(si.item_serial_id) INTO v_item_count
    FROM public.serialized_items si
    JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
    WHERE ar.manifest_id = p_manifest_id;

    IF v_item_count > 0 THEN
        v_allocated := round(p_total_batch_cost / v_item_count, 2);

        -- Distribute equally to each item
        UPDATE public.serialized_items si
        SET
            logistics_cost = v_allocated,
            total_unit_cost = COALESCE(si.final_purchase_price, 0) + v_allocated + COALESCE(si.refurbishment_cost, 0)
        FROM public.acquisition_requests ar
        WHERE si.request_id = ar.request_id AND ar.manifest_id = p_manifest_id;
    ELSE
        v_allocated := 0;
    END IF;

    RETURN jsonb_build_object(
        'manifest_id', p_manifest_id,
        'total_cost', p_total_batch_cost,
        'item_count', v_item_count,
        'allocated_per_item', v_allocated
    );
END;
$$;

-- ============================================================================
-- 5. RPC: Atomic Serialized Order Checkout with 15-Minute Lock (NFR-04, FR-21)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_create_order_with_reservation(
    p_buyer_id UUID,
    p_item_serial_ids UUID[],
    p_payment_method TEXT,
    p_delivery_address TEXT,
    p_quote_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item RECORD;
    v_total_amount NUMERIC(12,2) := 0;
    v_order_id UUID;
    v_reserved_until TIMESTAMPTZ := now() + interval '15 minutes';
    v_locked_count INTEGER := 0;
    v_active_conflict INTEGER;
BEGIN
    IF auth.uid() IS NOT NULL AND auth.uid() != p_buyer_id AND (SELECT public.current_user_role()) != 'Admin' THEN
        RAISE EXCEPTION 'Unauthorized: buyer_id must match authenticated user';
    END IF;

    IF array_length(p_item_serial_ids, 1) IS NULL OR array_length(p_item_serial_ids, 1) = 0 THEN
        RAISE EXCEPTION 'Item array cannot be empty';
    END IF;

    -- Pessimistic Lock on all target serialized items
    -- Fails immediately if locked by another transaction
    FOR v_item IN
        SELECT item_serial_id, selling_price, current_status
        FROM public.serialized_items
        WHERE item_serial_id = ANY(p_item_serial_ids)
        FOR UPDATE NOWAIT
    LOOP
        v_locked_count := v_locked_count + 1;

        -- Check item is listed in store
        IF v_item.current_status != 'Listed_In_Store' THEN
            RAISE EXCEPTION 'Item % is not listed in store (current status: %)', v_item.item_serial_id, v_item.current_status;
        END IF;

        -- Check for conflicting unexpired reservation in orders
        SELECT count(*) INTO v_active_conflict
        FROM public.order_items_warranty oiw
        JOIN public.orders o ON oiw.order_id = o.order_id
        WHERE oiw.item_serial_id = v_item.item_serial_id
          AND o.payment_status = 'Pending_Payment'
          AND o.reserved_until > now();

        IF v_active_conflict > 0 THEN
            RAISE EXCEPTION 'Item % is currently reserved by another pending checkout', v_item.item_serial_id;
        END IF;

        v_total_amount := v_total_amount + COALESCE(v_item.selling_price, 0);
    END LOOP;

    IF v_locked_count != array_length(p_item_serial_ids, 1) THEN
        RAISE EXCEPTION 'Could not lock all requested items';
    END IF;

    -- Apply quote discount if present (FR-20)
    IF p_quote_id IS NOT NULL THEN
        DECLARE
            v_discount NUMERIC(5,2);
        BEGIN
            SELECT discount_pct INTO v_discount
            FROM public.quote_requests
            WHERE quote_id = p_quote_id AND buyer_id = p_buyer_id AND status = 'quoted' AND valid_until >= now();

            IF v_discount IS NOT NULL AND v_discount > 0 THEN
                v_total_amount := round(v_total_amount * (1 - (v_discount / 100.0)), 2);
            END IF;
        END;
    END IF;

    -- Insert Order
    INSERT INTO public.orders (
        buyer_id, total_amount, payment_method, payment_status,
        reserved_until, delivery_address, quote_id
    ) VALUES (
        p_buyer_id, v_total_amount, p_payment_method, 'Pending_Payment',
        v_reserved_until, p_delivery_address, p_quote_id
    ) RETURNING order_id INTO v_order_id;

    -- Insert Order Items with warranty end date configured per category (FR-23)
    INSERT INTO public.order_items_warranty (
        order_id, item_serial_id, sold_price, delivery_date, warranty_end_date
    )
    SELECT
        v_order_id,
        si.item_serial_id,
        COALESCE(si.selling_price, 0),
        NULL,
        NULL -- Calculated when delivery confirmed
    FROM public.serialized_items si
    WHERE si.item_serial_id = ANY(p_item_serial_ids);

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'total_amount', v_total_amount,
        'reserved_until', v_reserved_until,
        'status', 'Pending_Payment'
    );
END;
$$;

-- ============================================================================
-- 6. RPC: Process Simulated Payment Webhook Callback (FR-21)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.rpc_process_payment_webhook(
    p_order_id UUID,
    p_outcome TEXT,
    p_transaction_ref TEXT,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_item_id UUID;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE order_id = p_order_id FOR UPDATE;

    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    IF auth.uid() IS NOT NULL AND auth.uid() != v_order.buyer_id AND (SELECT public.current_user_role()) != 'Admin' THEN
        RAISE EXCEPTION 'Unauthorized payment webhook invocation';
    END IF;

    -- Record Payment Event
    INSERT INTO public.payment_events (
        order_id, outcome, source, payload
    ) VALUES (
        p_order_id, p_outcome, 'simulator', p_payload
    );

    IF p_outcome = 'SUCCESS' THEN
        -- Update order status
        UPDATE public.orders
        SET
            payment_status = 'SUCCESS',
            payment_transaction_ref = p_transaction_ref,
            paid_at = now()
        WHERE order_id = p_order_id;

        -- Transition all items to 'Sold'
        FOR v_item_id IN
            SELECT item_serial_id FROM public.order_items_warranty WHERE order_id = p_order_id
        LOOP
            UPDATE public.serialized_items
            SET current_status = 'Sold'
            WHERE item_serial_id = v_item_id;
        END LOOP;

    ELSE
        -- Mark failed and release reservation immediately
        UPDATE public.orders
        SET
            payment_status = 'FAILED',
            payment_transaction_ref = p_transaction_ref,
            reserved_until = now()
        WHERE order_id = p_order_id;
    END IF;

    RETURN jsonb_build_object(
        'order_id', p_order_id,
        'outcome', p_outcome,
        'transaction_ref', p_transaction_ref
    );
END;
$$;

-- ============================================================================
-- 7. RPC: 30-60-90 Day Inventory Aging & 7-Day Offer Auto-Reject (FR-12, FR-19)
-- ============================================================================
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

            -- Auto-generate dismantling ticket (FR-19)
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

        -- Create return task with calculated inspection/transport fee (FR-12)
        INSERT INTO public.return_tasks (
            item_serial_id, fee_amount, fee_status, status
        ) VALUES (
            v_item.item_serial_id, 150.00, 'pending', 'awaiting_fee_payment'
        );

        -- Send simulated notification to seller
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
