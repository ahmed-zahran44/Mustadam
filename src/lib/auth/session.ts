import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile, UserRole } from "@/types/domain";

export interface ActiveSessionProfile {
  userId: string;
  email: string;
  role: UserRole;
  profile: UserProfile | null;
}

export async function getActiveSessionProfile(): Promise<ActiveSessionProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const role = ((user.app_metadata?.role as UserRole | undefined) ??
    (profile?.role as UserRole | undefined) ??
    "Customer") as UserRole;

  return {
    userId: user.id,
    email: user.email ?? profile?.email ?? "",
    role,
    profile: profile ?? null,
  };
}

