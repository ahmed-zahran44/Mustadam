-- 0005_demo_rls_and_workflow_fixes.sql
-- Additive permissive RLS policies ensuring all 12 Graduation Demo Personas have full access for end-to-end live workflows:
-- 1. Sellers accepting/rejecting offers (reading inspection_records, inserting payouts, return_tasks, refurbishment_logs, dismantling_tickets)
-- 2. Buyers confirming delivery on order_items_warranty (FR-23)
-- 3. Partner portal roles viewing operational queues cleanly

CREATE POLICY "Sellers and partner roles read inspection records"
ON public.inspection_records FOR SELECT
TO authenticated
USING (
    (SELECT public.current_user_role()) IN ('Admin', 'Partner_Inspector', 'Partner_Warehouse_Mgr', 'Partner_Refurb_Tech', 'Partner_Dismantle_Tech', 'Courier') OR
    item_serial_id IN (
        SELECT si.item_serial_id FROM public.serialized_items si
        JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
        WHERE ar.seller_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Sellers insert own payouts on offer acceptance"
ON public.payouts FOR INSERT
TO authenticated
WITH CHECK (seller_id = (SELECT auth.uid()) OR (SELECT public.current_user_role()) = 'Admin');

CREATE POLICY "Sellers insert and update own return tasks"
ON public.return_tasks FOR ALL
TO authenticated
USING (
    item_serial_id IN (
        SELECT si.item_serial_id FROM public.serialized_items si
        JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
        WHERE ar.seller_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    item_serial_id IN (
        SELECT si.item_serial_id FROM public.serialized_items si
        JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
        WHERE ar.seller_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Sellers and partner roles read and open refurbishment tickets"
ON public.refurbishment_logs FOR ALL
TO authenticated
USING (
    (SELECT public.current_user_role()) IN ('Admin', 'Partner_Refurb_Tech', 'Partner_Warehouse_Mgr', 'Partner_Inspector', 'Partner_Dismantle_Tech', 'Courier') OR
    item_serial_id IN (
        SELECT si.item_serial_id FROM public.serialized_items si
        JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
        WHERE ar.seller_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    (SELECT public.current_user_role()) IN ('Admin', 'Partner_Refurb_Tech', 'Partner_Warehouse_Mgr', 'Partner_Inspector') OR
    item_serial_id IN (
        SELECT si.item_serial_id FROM public.serialized_items si
        JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
        WHERE ar.seller_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Sellers and partner roles read and open dismantling tickets"
ON public.dismantling_tickets FOR ALL
TO authenticated
USING (
    (SELECT public.current_user_role()) IN ('Admin', 'Partner_Dismantle_Tech', 'Partner_Warehouse_Mgr', 'Partner_Inspector', 'Partner_Refurb_Tech', 'Courier') OR
    item_serial_id IN (
        SELECT si.item_serial_id FROM public.serialized_items si
        JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
        WHERE ar.seller_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    (SELECT public.current_user_role()) IN ('Admin', 'Partner_Dismantle_Tech', 'Partner_Warehouse_Mgr', 'Partner_Inspector') OR
    item_serial_id IN (
        SELECT si.item_serial_id FROM public.serialized_items si
        JOIN public.acquisition_requests ar ON si.request_id = ar.request_id
        WHERE ar.seller_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Buyers and staff update order items delivery and warranty"
ON public.order_items_warranty FOR UPDATE
TO authenticated
USING (
    order_id IN (SELECT order_id FROM public.orders WHERE buyer_id = (SELECT auth.uid())) OR
    (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service', 'Courier', 'Partner_Warehouse_Mgr')
)
WITH CHECK (
    order_id IN (SELECT order_id FROM public.orders WHERE buyer_id = (SELECT auth.uid())) OR
    (SELECT public.current_user_role()) IN ('Admin', 'Customer_Service', 'Courier', 'Partner_Warehouse_Mgr')
);
