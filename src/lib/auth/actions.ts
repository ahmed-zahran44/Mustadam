"use server";

import { revalidatePath } from "next/cache";
import { SimulatedNotificationAdapter } from "@/lib/adapters/notification-service";
import {
  DEMO_DEFAULT_PASSWORD,
  DEMO_PERSONAS,
  validateCorporateCredentials,
} from "@/lib/auth/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountType, CustomerSegment } from "@/types/domain";

export async function switchDemoPersonaAction(personaId: string) {
  const persona = DEMO_PERSONAS.find((p) => p.id === personaId);
  if (!persona) {
    return { ok: false, error: "Unknown persona" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: persona.email,
    password: DEMO_DEFAULT_PASSWORD,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    defaultRoute: persona.defaultRoute,
    role: persona.role,
    email: persona.email,
  };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return { ok: true };
}

export async function loginWithEmailPasswordAction(input: {
  email: string;
  password: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Invalid credentials" };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminLoginAction(input: {
  email: string;
  password: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Invalid credentials" };
  }

  const role = data.user.app_metadata?.role as string | undefined;
  if (role !== "Admin") {
    await supabase.auth.signOut();
    return { ok: false, error: "ACCESS_DENIED_NON_ADMIN" };
  }

  return { ok: true };
}

export async function registerCustomerAction(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
  taxId?: string;
  commercialReg?: string;
  segment?: CustomerSegment;
  companyAddress?: string;
}) {
  const corpCheck = validateCorporateCredentials({
    accountType: input.accountType,
    taxId: input.taxId,
    commercialReg: input.commercialReg,
  });

  if (!corpCheck.valid) {
    return { ok: false, error: corpCheck.errorKey ?? "Invalid corporate data" };
  }

  const segment: CustomerSegment =
    input.accountType === "Individual"
      ? "Individual"
      : (input.segment ?? "Startup");

  // Server-side registration: use elevated admin client to bypass RLS safely and assign role in app_metadata
  const supabaseAdmin = createAdminClient();

  // 1. Create or ensure user exists in auth with Customer role in app_metadata
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: input.email.trim(),
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name.trim(),
      },
      app_metadata: {
        role: "Customer",
      },
    });

  const userId = authData?.user?.id;

  if (authError) {
    // If user already exists in auth, return the specific message
    return { ok: false, error: authError.message };
  }

  if (!userId) {
    return { ok: false, error: "Registration failed: User ID missing" };
  }

  // 2. Insert into public.users using admin client (bypasses RLS)
  const { error: profileError } = await supabaseAdmin.from("users").upsert(
    {
      user_id: userId,
      role: "Customer",
      account_type: input.accountType,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      tax_id: input.accountType === "Company" ? input.taxId?.trim() : null,
      commercial_reg:
        input.accountType === "Company" ? input.commercialReg?.trim() : null,
      segment,
      company_address:
        input.accountType === "Company" ? input.companyAddress?.trim() : null,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  // 3. Immediately establish session cookie on server client so redirect to /seller is authenticated
  const supabase = await createSupabaseServerClient();
  await supabase.auth
    .signInWithPassword({
      email: input.email.trim(),
      password: input.password,
    })
    .catch(() => {});

  // Send simulated welcome OTP / verification notification (FR-01, Section 6.2)
  const notifier = new SimulatedNotificationAdapter(supabase);
  await notifier.send({
    recipientId: userId,
    channel: "sms",
    type: "otp",
    message: `Welcome to Mustadama, ${input.name.trim()}! Your verification code is 482910.`,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function triggerInventoryAgingAndExpiryAction() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("rpc_run_inventory_aging");

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, summary: data };
}

