-- 0003_rls_and_storage.sql
-- Enable Row Level Security and setup storage buckets

-- ============================================================================
-- 1. Enable RLS on all 23 public tables
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acquisition_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serialized_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refurbishment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dismantling_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycling_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrap_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items_warranty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Core Policies for Customer & Operational Roles
-- ============================================================================

-- Categories: Read-only for all, write for Admin
CREATE POLICY "Categories are readable by everyone"
ON public.categories FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Categories writable by admin"
ON public.categories FOR ALL
TO authenticated
USING ((SELECT public.current_user_role()) = 'Admin')
WITH CHECK ((SELECT public.current_user_role()) = 'Admin');

-- Partner Hubs: Readable by everyone
CREATE POLICY "Partner hubs readable by all"
ON public.partner_hubs FOR SELECT
TO anon, authenticated
USING (true);

-- Users: Users read and update their own record; Admin reads all
CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service'));

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Acquisition Requests: Seller views and creates own requests; Logistics & Admin view all
CREATE POLICY "Sellers view own requests"
ON public.acquisition_requests FOR SELECT
TO authenticated
USING (seller_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Courier', 'Partner_Warehouse_Mgr', 'Partner_Inspector'));

CREATE POLICY "Sellers create requests"
ON public.acquisition_requests FOR INSERT
TO authenticated
WITH CHECK (seller_id = (SELECT auth.uid()));

CREATE POLICY "Sellers update own requests"
ON public.acquisition_requests FOR UPDATE
TO authenticated
USING (seller_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Courier', 'Partner_Warehouse_Mgr'))
WITH CHECK (seller_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Courier', 'Partner_Warehouse_Mgr'));

-- Serialized Items: Public can view Listed_In_Store items; Seller views own; Partners & Admin full access
CREATE POLICY "Public views listed items in store"
ON public.serialized_items FOR SELECT
TO anon, authenticated
USING (
    current_status = 'Listed_In_Store' OR
    request_id IN (SELECT request_id FROM public.acquisition_requests WHERE seller_id = (SELECT auth.uid())) OR
    (SELECT public.current_user_role()) IN ('Admin', 'Courier', 'Partner_Warehouse_Mgr', 'Partner_Inspector', 'Partner_Refurb_Tech', 'Partner_Dismantle_Tech', 'Customer_Service')
);

CREATE POLICY "Staff can update serialized items"
ON public.serialized_items FOR UPDATE
TO authenticated
USING (
    (SELECT public.current_user_role()) IN ('Admin', 'Courier', 'Partner_Warehouse_Mgr', 'Partner_Inspector', 'Partner_Refurb_Tech', 'Partner_Dismantle_Tech') OR
    request_id IN (SELECT request_id FROM public.acquisition_requests WHERE seller_id = (SELECT auth.uid()))
)
WITH CHECK (
    (SELECT public.current_user_role()) IN ('Admin', 'Courier', 'Partner_Warehouse_Mgr', 'Partner_Inspector', 'Partner_Refurb_Tech', 'Partner_Dismantle_Tech') OR
    request_id IN (SELECT request_id FROM public.acquisition_requests WHERE seller_id = (SELECT auth.uid()))
);

-- Item Photos: Public views photos for listed items; Sellers and staff view all
CREATE POLICY "View item photos"
ON public.item_photos FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Upload item photos"
ON public.item_photos FOR INSERT
TO authenticated
WITH CHECK (true);

-- Item Status History: Select only
CREATE POLICY "View item history"
ON public.item_status_history FOR SELECT
TO authenticated
USING (
    (SELECT public.current_user_role()) IN ('Admin', 'Partner_Warehouse_Mgr', 'Partner_Inspector', 'Partner_Refurb_Tech', 'Partner_Dismantle_Tech', 'Customer_Service') OR
    item_serial_id IN (
        SELECT si.item_serial_id FROM public.serialized_items si
        JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
        WHERE ar.seller_id = (SELECT auth.uid())
    )
);

-- Orders: Buyer can view and create own orders; Admin and CS can view all
CREATE POLICY "Buyers view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (buyer_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service'));

CREATE POLICY "Buyers insert own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (buyer_id = (SELECT auth.uid()));

CREATE POLICY "Staff update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (buyer_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service'))
WITH CHECK (buyer_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service'));

-- Order Items Warranty:
CREATE POLICY "View order items"
ON public.order_items_warranty FOR SELECT
TO authenticated
USING (
    order_id IN (SELECT order_id FROM public.orders WHERE buyer_id = (SELECT auth.uid())) OR
    (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service', 'Partner_Refurb_Tech')
);

-- Notifications: User reads their own notifications
CREATE POLICY "Read own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (recipient_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) = 'Admin');

CREATE POLICY "Insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Payment Events: Buyer reads own order payment events; Admin reads all
CREATE POLICY "View payment events"
ON public.payment_events FOR SELECT
TO authenticated
USING (
    order_id IN (SELECT order_id FROM public.orders WHERE buyer_id = (SELECT auth.uid())) OR
    (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service')
);

-- Serialized Items INSERT policy for Sellers and Staff
CREATE POLICY "Sellers and staff insert serialized items"
ON public.serialized_items FOR INSERT
TO authenticated
WITH CHECK (
    request_id IN (SELECT request_id FROM public.acquisition_requests WHERE seller_id = (SELECT auth.uid())) OR
    (SELECT public.current_user_role()) IN ('Admin', 'Partner_Warehouse_Mgr', 'Partner_Inspector')
);

-- Operational tables (Pickup Manifests, Inspection, Refurbishment, Dismantling, Spare Parts, Scrap, Recycling)
CREATE POLICY "Staff operations access"
ON public.pickup_manifests FOR ALL
TO authenticated
USING ((SELECT public.current_user_role()) IN ('Admin', 'Courier', 'Partner_Warehouse_Mgr'))
WITH CHECK ((SELECT public.current_user_role()) IN ('Admin', 'Courier', 'Partner_Warehouse_Mgr'));

CREATE POLICY "Inspection staff access"
ON public.inspection_records FOR ALL
TO authenticated
USING ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Inspector', 'Partner_Warehouse_Mgr'))
WITH CHECK ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Inspector', 'Partner_Warehouse_Mgr'));

CREATE POLICY "Refurbishment staff access"
ON public.refurbishment_logs FOR ALL
TO authenticated
USING ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Refurb_Tech', 'Partner_Warehouse_Mgr'))
WITH CHECK ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Refurb_Tech', 'Partner_Warehouse_Mgr'));

CREATE POLICY "Dismantling staff access"
ON public.dismantling_tickets FOR ALL
TO authenticated
USING ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Dismantle_Tech', 'Partner_Warehouse_Mgr'))
WITH CHECK ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Dismantle_Tech', 'Partner_Warehouse_Mgr'));

CREATE POLICY "Spare parts access"
ON public.spare_parts_inventory FOR ALL
TO authenticated
USING ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Dismantle_Tech', 'Partner_Refurb_Tech', 'Partner_Warehouse_Mgr'))
WITH CHECK ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Dismantle_Tech', 'Partner_Refurb_Tech', 'Partner_Warehouse_Mgr'));

CREATE POLICY "Recycling batches access"
ON public.recycling_batches FOR ALL
TO authenticated
USING ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Warehouse_Mgr'))
WITH CHECK ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Warehouse_Mgr'));

CREATE POLICY "Scrap entries access"
ON public.scrap_entries FOR ALL
TO authenticated
USING ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Dismantle_Tech', 'Partner_Warehouse_Mgr'))
WITH CHECK ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Dismantle_Tech', 'Partner_Warehouse_Mgr'));

CREATE POLICY "Warranty claims access"
ON public.warranty_claims FOR ALL
TO authenticated
USING (buyer_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service'))
WITH CHECK (buyer_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service'));

CREATE POLICY "Quote requests access"
ON public.quote_requests FOR ALL
TO authenticated
USING (buyer_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service'))
WITH CHECK (buyer_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service'));

CREATE POLICY "Quote items access"
ON public.quote_items FOR ALL
TO authenticated
USING (
    quote_id IN (SELECT quote_id FROM public.quote_requests WHERE buyer_id = (SELECT auth.uid())) OR
    (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service')
)
WITH CHECK (
    quote_id IN (SELECT quote_id FROM public.quote_requests WHERE buyer_id = (SELECT auth.uid())) OR
    (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service')
);

CREATE POLICY "Payouts access"
ON public.payouts FOR ALL
TO authenticated
USING (seller_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) = 'Admin')
WITH CHECK ((SELECT public.current_user_role()) = 'Admin');

CREATE POLICY "Return tasks access"
ON public.return_tasks FOR ALL
TO authenticated
USING (
    item_serial_id IN (
        SELECT si.item_serial_id FROM public.serialized_items si
        JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
        WHERE ar.seller_id = (SELECT auth.uid())
    ) OR
    (SELECT public.current_user_role()) IN ('Admin', 'Partner_Warehouse_Mgr', 'Customer_Service')
)
WITH CHECK ((SELECT public.current_user_role()) IN ('Admin', 'Partner_Warehouse_Mgr', 'Customer_Service'));

-- ============================================================================
-- 3. Storage Buckets Setup
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('item-photos', 'item-photos', true),
    ('certificates', 'certificates', true),
    ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public item photos access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'item-photos');

CREATE POLICY "Authenticated users can upload item photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-photos');

CREATE POLICY "Public certificates access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'certificates');

CREATE POLICY "Inspectors upload certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Invoice access"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');

