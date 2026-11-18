import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type NotificationChannel = "sms" | "email";
export type NotificationType =
  | "otp"
  | "status"
  | "price_offer"
  | "campaign"
  | "warranty";

export interface SendNotificationInput {
  recipientId: string;
  channel: NotificationChannel;
  type: NotificationType;
  message: string;
}

export interface NotificationServiceAdapter {
  send(input: SendNotificationInput): Promise<{ notificationId: string }>;
}

/**
 * SimulatedNotificationAdapter (SRS Section 6.2, ADR-004)
 * Logs simulated SMS/Email notifications into `public.notifications`
 * so they appear immediately in the Graduation Demo Toolbar inbox.
 */
export class SimulatedNotificationAdapter
  implements NotificationServiceAdapter
{
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async send(
    input: SendNotificationInput,
  ): Promise<{ notificationId: string }> {
    const { data, error } = await this.supabase
      .from("notifications")
      .insert({
        recipient_id: input.recipientId,
        channel: input.channel,
        type: input.type,
        message: input.message,
        status: "simulated",
      })
      .select("notification_id")
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to record simulated notification: ${error?.message ?? "unknown"}`,
      );
    }

    return { notificationId: data.notification_id };
  }
}

