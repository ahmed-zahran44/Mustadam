-- Migration: Ensure Users Registration RLS Fallback Policy
-- Enforces self-insert profile creation for authenticated context

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

