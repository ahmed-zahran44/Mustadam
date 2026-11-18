import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type PaymentChannel = "Card" | "Wallet" | "InstaPay";
export type PaymentOutcome = "SUCCESS" | "FAILED";

export interface InitiatePaymentInput {
  orderId: string;
  amountEgp: number;
  channel: PaymentChannel;
  simulatedOutcome: PaymentOutcome;
}

export interface PaymentGatewayAdapter {
  initiatePayment(input: InitiatePaymentInput): Promise<{
    transactionRef: string;
    webhookDispatched: boolean;
  }>;
}

/**
 * SimulatedPaymentGatewayAdapter (SRS Section 6.2, FR-21, NFR-01, ADR-004)
 * Strictly PCI-safe: Never accepts, logs, or stores credit card PANs or CVVs.
 * Invokes `rpc_process_payment_webhook` to record `payment_events` (`source = 'simulator'`)
 * and atomically transition the order and serialized items (`Sold` on `SUCCESS`, or
 * immediate lock release on `FAILED`).
 */
export class SimulatedPaymentGatewayAdapter implements PaymentGatewayAdapter {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async initiatePayment(input: InitiatePaymentInput): Promise<{
    transactionRef: string;
    webhookDispatched: boolean;
  }> {
    const transactionRef = `SIM-${input.channel.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const { error } = await this.supabase.rpc("rpc_process_payment_webhook", {
      p_order_id: input.orderId,
      p_outcome: input.simulatedOutcome,
      p_transaction_ref: transactionRef,
      p_payload: {
        channel: input.channel,
        amountEgp: input.amountEgp,
        pciCompliant: true,
        timestamp: new Date().toISOString(),
      },
    });

    if (error) {
      throw new Error(`Payment webhook failed: ${error.message}`);
    }

    return {
      transactionRef,
      webhookDispatched: true,
    };
  }
}

