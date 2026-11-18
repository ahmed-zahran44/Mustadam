-- 0001_core_schema.sql
-- Mustadama Core Schema: 23 tables defined in ARCHITECTURE.md & SRS Section 5

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums / Check constraints are implemented directly on table definitions per ARCHITECTURE.md

-- ============================================================================
-- 1. Identity, Catalog & Partner Infrastructure
-- ============================================================================

-- 1. users
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('Customer', 'Partner_Inspector', 'Partner_Refurb_Tech', 'Partner_Dismantle_Tech', 'Partner_Warehouse_Mgr', 'Courier', 'Customer_Service', 'Admin')),
    account_type TEXT NOT NULL CHECK (account_type IN ('Individual', 'Company')),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    tax_id TEXT,
    commercial_reg TEXT,
    segment TEXT NOT NULL DEFAULT 'Individual' CHECK (segment IN ('Individual', 'Startup', 'Enterprise')),
    company_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. categories
CREATE TABLE IF NOT EXISTS public.categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    parent_id UUID REFERENCES public.categories(category_id) ON DELETE SET NULL,
    base_reference_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    warranty_days INTEGER NOT NULL DEFAULT 30,
    diagnostic_questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_bulky BOOLEAN NOT NULL DEFAULT false,
    requires_data_wipe BOOLEAN NOT NULL DEFAULT false
);

-- 11. partner_hubs
CREATE TABLE IF NOT EXISTS public.partner_hubs (
    hub_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    city TEXT NOT NULL,
    zone TEXT NOT NULL,
    address TEXT NOT NULL,
    is_dropoff BOOLEAN NOT NULL DEFAULT true,
    is_warehouse BOOLEAN NOT NULL DEFAULT false
);

-- 12. pickup_manifests
CREATE TABLE IF NOT EXISTS public.pickup_manifests (
    manifest_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transport_user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    zone TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    total_batch_logistics_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- ============================================================================
-- 2. Sourcing, Logistics & Serialized Item Core
-- ============================================================================

-- 3. acquisition_requests
CREATE TABLE IF NOT EXISTS public.acquisition_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    submission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    handover_method TEXT CHECK (handover_method IN ('Courier', 'Partner_Dropoff', 'Batch_Truck')),
    dropoff_partner_id UUID REFERENCES public.partner_hubs(hub_id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'awaiting_handover', 'in_transit', 'received', 'completed', 'cancelled')),
    request_type TEXT NOT NULL DEFAULT 'single' CHECK (request_type IN ('single', 'bulk')),
    manifest_id UUID REFERENCES public.pickup_manifests(manifest_id) ON DELETE SET NULL,
    tracking_code TEXT UNIQUE NOT NULL,
    pickup_address TEXT,
    pickup_slot TEXT,
    preverification_status TEXT NOT NULL DEFAULT 'not_required' CHECK (preverification_status IN ('not_required', 'pending', 'approved', 'rejected')),
    preverified_by UUID REFERENCES public.users(user_id) ON DELETE SET NULL
);

-- 4. serialized_items
CREATE TABLE IF NOT EXISTS public.serialized_items (
    item_serial_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.acquisition_requests(request_id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(category_id) ON DELETE RESTRICT,
    estimated_min_price NUMERIC(12,2) NOT NULL,
    estimated_max_price NUMERIC(12,2) NOT NULL,
    final_purchase_price NUMERIC(12,2),
    logistics_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    refurbishment_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12,2),
    condition_grade TEXT CHECK (condition_grade IN ('A', 'B', 'C')),
    current_status TEXT NOT NULL DEFAULT 'Submitted' CHECK (current_status IN (
        'Submitted', 'Awaiting_Handover', 'Received_At_Dropoff_Hub', 'In_Transit_To_Warehouse',
        'Received_Pending_Inspection', 'Awaiting_Seller_Decision', 'Return_In_Progress',
        'Listed_In_Store', 'Under_Refurbishment', 'Pending_Dismantling', 'Sold',
        'Decommissioned_Aged', 'Scrap_Ready_For_Recycling', 'Recycled_Closed'
    )),
    data_wiped_bool BOOLEAN NOT NULL DEFAULT false,
    listed_date TIMESTAMPTZ,
    aging_tier TEXT CHECK (aging_tier IN ('0_30', '31_60', '61_90', '91_plus')),
    title TEXT NOT NULL,
    title_ar TEXT,
    diagnostic_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    barcode TEXT UNIQUE,
    weight_kg NUMERIC(8,2),
    target_selling_price NUMERIC(12,2),
    total_unit_cost NUMERIC(12,2),
    seller_decision TEXT CHECK (seller_decision IN ('pending', 'accepted', 'rejected', 'auto_rejected')),
    offer_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. item_photos
CREATE TABLE IF NOT EXISTS public.item_photos (
    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('seller', 'inspection', 'listing')),
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- 14. item_status_history (Immutable audit log)
CREATE TABLE IF NOT EXISTS public.item_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE RESTRICT,
    changed_by UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    note TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. Inspection, Payouts, Returns & Circular Engine
-- ============================================================================

-- 5. inspection_records
CREATE TABLE IF NOT EXISTS public.inspection_records (
    inspection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
    technical_classification TEXT NOT NULL CHECK (technical_classification IN ('Ready_For_Sale', 'Repairable', 'Irreparable')),
    condition_notes TEXT NOT NULL,
    data_wipe_certificate_url TEXT,
    inspected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. return_tasks
CREATE TABLE IF NOT EXISTS public.return_tasks (
    return_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE CASCADE,
    fee_amount NUMERIC(12,2) NOT NULL,
    fee_status TEXT NOT NULL DEFAULT 'pending' CHECK (fee_status IN ('pending', 'paid')),
    fee_payment_ref TEXT,
    status TEXT NOT NULL DEFAULT 'awaiting_fee_payment' CHECK (status IN ('awaiting_fee_payment', 'ready_for_dispatch', 'dispatched', 'returned_to_seller')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. payouts
CREATE TABLE IF NOT EXISTS public.payouts (
    payout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid')),
    payout_ref TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. refurbishment_logs
CREATE TABLE IF NOT EXISTS public.refurbishment_logs (
    refurb_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE CASCADE,
    technician_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    work_description TEXT,
    labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    parts_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    closed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    final_grade TEXT CHECK (final_grade IN ('A', 'B', 'C')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. dismantling_tickets
CREATE TABLE IF NOT EXISTS public.dismantling_tickets (
    dismantle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE CASCADE,
    technician_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    trigger TEXT NOT NULL CHECK (trigger IN ('irreparable', 'aged_out')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at TIMESTAMPTZ
);

-- 7. spare_parts_inventory
CREATE TABLE IF NOT EXISTS public.spare_parts_inventory (
    part_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE CASCADE,
    part_name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(category_id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Consumed')),
    consumed_in_refurb_id UUID REFERENCES public.refurbishment_logs(refurb_id) ON DELETE SET NULL,
    estimated_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    internal_cost NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- 8. recycling_batches
CREATE TABLE IF NOT EXISTS public.recycling_batches (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recycler_entity_name TEXT NOT NULL,
    material_type TEXT NOT NULL CHECK (material_type IN ('E-waste', 'Metal', 'Wood', 'Plastic', 'Mixed')),
    total_weight_kg NUMERIC(10,2) NOT NULL,
    revenue_amount NUMERIC(12,2) NOT NULL,
    handover_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT
);

-- 18. scrap_entries
CREATE TABLE IF NOT EXISTS public.scrap_entries (
    scrap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dismantle_id UUID NOT NULL REFERENCES public.dismantling_tickets(dismantle_id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.recycling_batches(batch_id) ON DELETE SET NULL,
    material_type TEXT NOT NULL CHECK (material_type IN ('E-waste', 'Metal', 'Wood', 'Plastic')),
    weight_kg NUMERIC(8,2) NOT NULL
);

-- ============================================================================
-- 4. Storefront, Quotes, Checkout, Warranty & Notifications
-- ============================================================================

-- 20. quote_requests
CREATE TABLE IF NOT EXISTS public.quote_requests (
    quote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'quoted', 'accepted', 'expired')),
    discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. quote_items
CREATE TABLE IF NOT EXISTS public.quote_items (
    quote_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quote_requests(quote_id) ON DELETE CASCADE,
    item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE CASCADE
);

-- 9. orders
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
    total_amount NUMERIC(12,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Card', 'Wallet', 'InstaPay')),
    payment_transaction_ref TEXT,
    payment_status TEXT NOT NULL DEFAULT 'Pending_Payment' CHECK (payment_status IN ('Pending_Payment', 'SUCCESS', 'FAILED', 'Expired')),
    invoice_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    quote_id UUID REFERENCES public.quote_requests(quote_id) ON DELETE SET NULL,
    reserved_until TIMESTAMPTZ NOT NULL,
    delivery_address TEXT NOT NULL,
    paid_at TIMESTAMPTZ
);

-- 10. order_items_warranty
CREATE TABLE IF NOT EXISTS public.order_items_warranty (
    order_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    item_serial_id UUID NOT NULL REFERENCES public.serialized_items(item_serial_id) ON DELETE RESTRICT,
    sold_price NUMERIC(12,2) NOT NULL,
    delivery_date DATE,
    warranty_end_date DATE
);

-- 19. payment_events
CREATE TABLE IF NOT EXISTS public.payment_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
    outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILED')),
    source TEXT NOT NULL DEFAULT 'simulator',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. warranty_claims
CREATE TABLE IF NOT EXISTS public.warranty_claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items_warranty(order_item_id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'rejected')),
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
    type TEXT NOT NULL CHECK (type IN ('otp', 'status', 'price_offer', 'campaign', 'warranty')),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'simulated',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Foreign Key Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_pickup_manifests_transport ON public.pickup_manifests(transport_user_id);
CREATE INDEX IF NOT EXISTS idx_acquisition_requests_seller ON public.acquisition_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_acquisition_requests_dropoff ON public.acquisition_requests(dropoff_partner_id);
CREATE INDEX IF NOT EXISTS idx_acquisition_requests_manifest ON public.acquisition_requests(manifest_id);
CREATE INDEX IF NOT EXISTS idx_serialized_items_request ON public.serialized_items(request_id);
CREATE INDEX IF NOT EXISTS idx_serialized_items_category ON public.serialized_items(category_id);
CREATE INDEX IF NOT EXISTS idx_serialized_items_status ON public.serialized_items(current_status);
CREATE INDEX IF NOT EXISTS idx_item_photos_item ON public.item_photos(item_serial_id);
CREATE INDEX IF NOT EXISTS idx_item_status_history_item ON public.item_status_history(item_serial_id);
CREATE INDEX IF NOT EXISTS idx_inspection_records_item ON public.inspection_records(item_serial_id);
CREATE INDEX IF NOT EXISTS idx_inspection_records_inspector ON public.inspection_records(inspector_id);
CREATE INDEX IF NOT EXISTS idx_return_tasks_item ON public.return_tasks(item_serial_id);
CREATE INDEX IF NOT EXISTS idx_payouts_item ON public.payouts(item_serial_id);
CREATE INDEX IF NOT EXISTS idx_payouts_seller ON public.payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_refurbishment_logs_item ON public.refurbishment_logs(item_serial_id);
CREATE INDEX IF NOT EXISTS idx_refurbishment_logs_tech ON public.refurbishment_logs(technician_id);
CREATE INDEX IF NOT EXISTS idx_dismantling_tickets_item ON public.dismantling_tickets(item_serial_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_source ON public.spare_parts_inventory(source_item_serial_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_refurb ON public.spare_parts_inventory(consumed_in_refurb_id);
CREATE INDEX IF NOT EXISTS idx_recycling_batches_recorder ON public.recycling_batches(recorded_by);
CREATE INDEX IF NOT EXISTS idx_scrap_entries_dismantle ON public.scrap_entries(dismantle_id);
CREATE INDEX IF NOT EXISTS idx_scrap_entries_batch ON public.scrap_entries(batch_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_buyer ON public.quote_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_item ON public.quote_items(item_serial_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_quote ON public.orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items_warranty(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item ON public.order_items_warranty(item_serial_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_order ON public.payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_item ON public.warranty_claims(order_item_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_buyer ON public.warranty_claims(buyer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);

