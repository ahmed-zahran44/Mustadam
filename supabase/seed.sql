-- seed.sql: Demo Dataset for Mustadama Presentation
-- Sets up 12 SRS Persona accounts, Categories, Partner Hubs, and serialized item demo states

-- 1. Create Pre-Seeded Auth Users & Identities
-- Passwords for all accounts: 'Mustadama2026!'
DO $$
DECLARE
    v_pwd TEXT := extensions.crypt('Mustadama2026!', extensions.gen_salt('bf'));
    v_u1 UUID := '11111111-1111-1111-1111-111111111101'; -- Individual Seller (Customer)
    v_u2 UUID := '11111111-1111-1111-1111-111111111102'; -- Corporate Seller (Customer)
    v_u3 UUID := '11111111-1111-1111-1111-111111111103'; -- Individual Buyer (Customer)
    v_u4 UUID := '11111111-1111-1111-1111-111111111104'; -- Corporate Buyer (Customer)
    v_u5 UUID := '11111111-1111-1111-1111-111111111105'; -- Courier / Drop-off Hub Agent
    v_u6 UUID := '11111111-1111-1111-1111-111111111106'; -- Transport Team (Bulky)
    v_u7 UUID := '11111111-1111-1111-1111-111111111107'; -- Partner Inspection Officer
    v_u8 UUID := '11111111-1111-1111-1111-111111111108'; -- Partner Refurbishment Tech
    v_u9 UUID := '11111111-1111-1111-1111-111111111109'; -- Partner Dismantling Tech
    v_u10 UUID := '11111111-1111-1111-1111-111111111110'; -- Partner Warehouse Manager
    v_u11 UUID := '11111111-1111-1111-1111-111111111111'; -- Customer Service Agent
    v_u12 UUID := '11111111-1111-1111-1111-111111111112'; -- Platform Admin
BEGIN
    -- Auth Users insertion
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
    )
    VALUES
        ('00000000-0000-0000-0000-000000000000', v_u1, 'authenticated', 'authenticated', 'seller.individual@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Customer"}'::jsonb, '{"name":"Ahmed Mansour"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u2, 'authenticated', 'authenticated', 'seller.corporate@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Customer"}'::jsonb, '{"name":"NileTech Solutions"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u3, 'authenticated', 'authenticated', 'buyer.individual@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Customer"}'::jsonb, '{"name":"Sarah Ibrahim"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u4, 'authenticated', 'authenticated', 'buyer.corporate@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Customer"}'::jsonb, '{"name":"Cairo Coworking Space"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u5, 'authenticated', 'authenticated', 'courier@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Courier"}'::jsonb, '{"name":"Mahmoud Courier"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u6, 'authenticated', 'authenticated', 'transport@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Courier"}'::jsonb, '{"name":"Bulky Transport Team"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u7, 'authenticated', 'authenticated', 'inspector@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Partner_Inspector"}'::jsonb, '{"name":"Eng. Tarek Inspector"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u8, 'authenticated', 'authenticated', 'refurb.tech@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Partner_Refurb_Tech"}'::jsonb, '{"name":"Hassan Refurb Tech"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u9, 'authenticated', 'authenticated', 'dismantle.tech@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Partner_Dismantle_Tech"}'::jsonb, '{"name":"Kareem Dismantle Tech"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u10, 'authenticated', 'authenticated', 'warehouse.mgr@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Partner_Warehouse_Mgr"}'::jsonb, '{"name":"Amr Warehouse Manager"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u11, 'authenticated', 'authenticated', 'customer.service@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Customer_Service"}'::jsonb, '{"name":"Layla Customer Service"}'::jsonb, now(), now(), false, false),
        ('00000000-0000-0000-0000-000000000000', v_u12, 'authenticated', 'authenticated', 'admin@mustadama.eg', v_pwd, now(), '', '', '', '', '{"provider":"email","providers":["email"],"role":"Admin"}'::jsonb, '{"name":"Platform Administrator"}'::jsonb, now(), now(), false, false)
    ON CONFLICT (id) DO NOTHING;

    -- Auth Identities insertion (Required for email/password signInWithPassword)
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    SELECT
        u.id::text,
        u.id,
        jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
        'email',
        now(),
        now(),
        now()
    FROM auth.users u
    WHERE u.id IN (v_u1, v_u2, v_u3, v_u4, v_u5, v_u6, v_u7, v_u8, v_u9, v_u10, v_u11, v_u12)
      AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email');

    -- Public Users Profile insertion
    INSERT INTO public.users (user_id, role, account_type, name, email, phone, tax_id, commercial_reg, segment, company_address)
    VALUES
        (v_u1, 'Customer', 'Individual', 'Ahmed Mansour', 'seller.individual@mustadama.eg', '+201001111101', NULL, NULL, 'Individual', NULL),
        (v_u2, 'Customer', 'Company', 'NileTech Solutions', 'seller.corporate@mustadama.eg', '+201001111102', '123-456-789', 'CR-987654', 'Startup', 'Smart Village, Building B4, Giza'),
        (v_u3, 'Customer', 'Individual', 'Sarah Ibrahim', 'buyer.individual@mustadama.eg', '+201001111103', NULL, NULL, 'Individual', NULL),
        (v_u4, 'Customer', 'Company', 'Cairo Coworking Space', 'buyer.corporate@mustadama.eg', '+201001111104', '987-654-321', 'CR-123456', 'Enterprise', '5th Settlement, New Cairo'),
        (v_u5, 'Courier', 'Individual', 'Mahmoud Courier', 'courier@mustadama.eg', '+201001111105', NULL, NULL, 'Individual', NULL),
        (v_u6, 'Courier', 'Individual', 'Bulky Transport Team', 'transport@mustadama.eg', '+201001111106', NULL, NULL, 'Individual', NULL),
        (v_u7, 'Partner_Inspector', 'Individual', 'Eng. Tarek Inspector', 'inspector@mustadama.eg', '+201001111107', NULL, NULL, 'Individual', NULL),
        (v_u8, 'Partner_Refurb_Tech', 'Individual', 'Hassan Refurb Tech', 'refurb.tech@mustadama.eg', '+201001111108', NULL, NULL, 'Individual', NULL),
        (v_u9, 'Partner_Dismantle_Tech', 'Individual', 'Kareem Dismantle Tech', 'dismantle.tech@mustadama.eg', '+201001111109', NULL, NULL, 'Individual', NULL),
        (v_u10, 'Partner_Warehouse_Mgr', 'Individual', 'Amr Warehouse Manager', 'warehouse.mgr@mustadama.eg', '+201001111110', NULL, NULL, 'Individual', NULL),
        (v_u11, 'Customer_Service', 'Individual', 'Layla Customer Service', 'customer.service@mustadama.eg', '+201001111111', NULL, NULL, 'Individual', NULL),
        (v_u12, 'Admin', 'Individual', 'Platform Administrator', 'admin@mustadama.eg', '+201001111112', NULL, NULL, 'Individual', NULL)
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- 2. Partner Hubs (Drop-off & Warehouses)
INSERT INTO public.partner_hubs (hub_id, name, name_ar, city, zone, address, is_dropoff, is_warehouse)
VALUES
    ('22222222-2222-2222-2222-222222222201', 'Mustadama Central Warehouse', 'مستودع مستدام المركزي', 'Cairo', 'Nasr City', 'Zone 1, Auto-Market St., Nasr City', false, true),
    ('22222222-2222-2222-2222-222222222202', 'Maadi Partner Drop-off Hub', 'نقطة تسليم شركاء المعادي', 'Cairo', 'Maadi', 'Degla St. 213, Maadi', true, false),
    ('22222222-2222-2222-2222-222222222203', 'Dokki Partner Drop-off Hub', 'نقطة تسليم شركاء الدقي', 'Giza', 'Dokki', 'Mosaddak St. 45, Dokki', true, false),
    ('22222222-2222-2222-2222-222222222204', 'Alexandria Smouha Hub', 'نقطة تسليم سموحة الإسكندرية', 'Alexandria', 'Smouha', 'Victor Emanuel Square, Smouha', true, true)
ON CONFLICT (hub_id) DO NOTHING;

-- 3. Categories with Dynamic Diagnostic Questionnaire (NFR-05)
INSERT INTO public.categories (category_id, name, name_ar, parent_id, base_reference_price, warranty_days, is_bulky, requires_data_wipe, diagnostic_questions_json)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'Laptops & Computers', 'أجهزة الكمبيوتر المحمول', NULL, 15000.00, 90, false, true, '[
        {"id":"screen","question_en":"Is the screen free of cracks or dead pixels?","question_ar":"هل الشاشة خالية من الكسور أو النقاط الميتة؟","type":"boolean","deduction_pct":0.20},
        {"id":"battery","question_en":"Does the battery hold charge for > 1 hour?","question_ar":"هل تصمد البطارية لأكثر من ساعة؟","type":"boolean","deduction_pct":0.10},
        {"id":"charger","question_en":"Original charger included?","question_ar":"هل الشاحن الأصلي متوفر؟","type":"boolean","deduction_pct":0.05}
    ]'::jsonb),
    ('33333333-3333-3333-3333-333333333302', 'Smartphones & Tablets', 'الهواتف الذكية والأجهزة اللوحية', NULL, 8000.00, 90, false, true, '[
        {"id":"screen","question_en":"Is the glass screen intact?","question_ar":"هل زجاج الشاشة سليم دون كسر؟","type":"boolean","deduction_pct":0.25},
        {"id":"face_id","question_en":"Does FaceID/Fingerprint sensor work?","question_ar":"هل مستشعر البصمة/الوجه يعمل؟","type":"boolean","deduction_pct":0.15}
    ]'::jsonb),
    ('33333333-3333-3333-3333-333333333303', 'Office Furniture', 'الأثاث المكتبي', NULL, 4000.00, 30, true, false, '[
        {"id":"structural","question_en":"Is the frame/structural integrity solid?","question_ar":"هل الهيكل سليم ومستقر؟","type":"boolean","deduction_pct":0.30},
        {"id":"upholstery","question_en":"Fabric or leather free of tears?","question_ar":"هل القماش أو الجلد خالٍ من التمزقات؟","type":"boolean","deduction_pct":0.15}
    ]'::jsonb)
ON CONFLICT (category_id) DO NOTHING;

-- 4. Sample Bulky Pickup Manifest
INSERT INTO public.pickup_manifests (manifest_id, transport_user_id, zone, scheduled_date, total_batch_logistics_cost, status)
VALUES
    ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111106', 'New Cairo & 5th Settlement', CURRENT_DATE + 1, 600.00, 'scheduled')
ON CONFLICT (manifest_id) DO NOTHING;

-- 5. Sample Acquisition Requests & Serialized Items (Across Lifecycle States)
DO $$
DECLARE
    v_req1 UUID := '55555555-5555-5555-5555-555555555501';
    v_req2 UUID := '55555555-5555-5555-5555-555555555502';
    v_item1 UUID := '66666666-6666-6666-6666-666666666601';
    v_item2 UUID := '66666666-6666-6666-6666-666666666602';
    v_item3 UUID := '66666666-6666-6666-6666-666666666603';
BEGIN
    -- Request 1: Individual Seller laptop
    INSERT INTO public.acquisition_requests (request_id, seller_id, handover_method, status, tracking_code, pickup_address)
    VALUES (v_req1, '11111111-1111-1111-1111-111111111101', 'Courier', 'received', 'MST-TRK-1001', '14 Abbas El Akkad, Nasr City, Cairo')
    ON CONFLICT (request_id) DO NOTHING;

    -- Item 1: Listed in Store (ThinkPad T480) — Tier 1 (0_30): Target_Selling_Price = 9000 * 1.35 = 12150.00
    INSERT INTO public.serialized_items (
        item_serial_id, request_id, category_id, estimated_min_price, estimated_max_price,
        final_purchase_price, logistics_cost, refurbishment_cost, selling_price, target_selling_price,
        total_unit_cost, condition_grade, current_status, data_wiped_bool, listed_date, aging_tier,
        title, title_ar, barcode
    ) VALUES (
        v_item1, v_req1, '33333333-3333-3333-3333-333333333301', 8000.00, 9500.00,
        8500.00, 150.00, 350.00, 12150.00, 12150.00,
        9000.00, 'A', 'Listed_In_Store', true, now() - interval '10 days', '0_30',
        'Lenovo ThinkPad T480 (Core i7, 16GB, 512GB SSD)', 'لينوفو ثينك باد تي 480 (كور اي 7، 16 جيجا)', 'MST-2026-00001'
    ) ON CONFLICT (item_serial_id) DO NOTHING;

    -- Request 2: Corporate liquidation
    INSERT INTO public.acquisition_requests (request_id, seller_id, handover_method, status, tracking_code, manifest_id)
    VALUES (v_req2, '11111111-1111-1111-1111-111111111102', 'Batch_Truck', 'received', 'MST-TRK-2002', '44444444-4444-4444-4444-444444444401')
    ON CONFLICT (request_id) DO NOTHING;

    -- Item 2: Pending Inspection (Dell Latitude)
    INSERT INTO public.serialized_items (
        item_serial_id, request_id, category_id, estimated_min_price, estimated_max_price,
        logistics_cost, current_status, title, title_ar, barcode
    ) VALUES (
        v_item2, v_req2, '33333333-3333-3333-3333-333333333301', 7000.00, 8500.00,
        300.00, 'Received_Pending_Inspection', 'Dell Latitude 5490 (Core i5, 8GB)', 'ديل لاتيتيود 5490', 'MST-2026-00002'
    ) ON CONFLICT (item_serial_id) DO NOTHING;

    -- Item 3: Herman Miller Office Chair (Aged Clearance Demo) — Tier 1 Target = 4000 * 1.35 = 5400.00, Tier 3 (61_90) Selling = 4000.00
    INSERT INTO public.serialized_items (
        item_serial_id, request_id, category_id, estimated_min_price, estimated_max_price,
        final_purchase_price, logistics_cost, refurbishment_cost, selling_price, target_selling_price,
        total_unit_cost, condition_grade, current_status, listed_date, aging_tier,
        title, title_ar, barcode
    ) VALUES (
        v_item3, v_req2, '33333333-3333-3333-3333-333333333303', 3000.00, 4200.00,
        3500.00, 300.00, 200.00, 4000.00, 5400.00,
        4000.00, 'B', 'Listed_In_Store', now() - interval '65 days', '61_90',
        'Ergonomic Mesh Office Chair', 'كرسي مكتب شبكي مريح', 'MST-2026-00003'
    ) ON CONFLICT (item_serial_id) DO NOTHING;
END $$;
