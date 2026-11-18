import { getActiveSessionProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  GraduationDemoToolbar,
  type NotificationItem,
} from "./graduation-demo-toolbar";

export async function DemoToolbarWrapper() {
  const session = await getActiveSessionProfile();
  let notifications: NotificationItem[] = [];

  if (session?.userId) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("notifications")
      .select("notification_id, channel, type, message, created_at")
      .eq("recipient_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(10);

    notifications = data ?? [];
  }

  return (
    <GraduationDemoToolbar
      activeUserId={session?.userId ?? null}
      activeEmail={session?.email ?? null}
      activeRole={session?.role ?? null}
      activeAccountType={session?.profile?.account_type ?? null}
      notifications={notifications}
    />
  );
}

