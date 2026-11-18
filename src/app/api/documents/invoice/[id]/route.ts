import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * FR-22 Automated Tax Invoice Generator (Includes Corporate Buyer Tax ID & CR)
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, users(name, email, account_type, tax_id, commercial_reg, company_address), order_items_warranty(item_serial_id, sold_price, warranty_end_date)",
    )
    .eq("order_id", id)
    .maybeSingle();

  const buyer = order?.users as {
    name?: string;
    email?: string;
    account_type?: string;
    tax_id?: string | null;
    commercial_reg?: string | null;
    company_address?: string | null;
  } | null;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice - Order ${id.slice(0, 8)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 32px; border: 1px solid #d1d5db; }
    h1 { color: #047857; margin-bottom: 4px; }
    .box { background: #f9fafb; padding: 14px; border-radius: 6px; margin: 14px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; font-size: 13px; }
  </style>
</head>
<body onload="window.print()">
  <h1>MUSTADAMA ("مُستدام") — OFFICIAL TAX INVOICE</h1>
  <p>Invoice Reference: <strong>INV-${id.slice(0, 8).toUpperCase()}</strong> • Paid At: ${order?.paid_at ?? new Date().toISOString()}</p>
  <div class="box">
    <p><strong>Buyer Name:</strong> ${buyer?.name ?? "Valued Customer"} (${buyer?.account_type ?? "Individual"})</p>
    <p><strong>Delivery Address:</strong> ${order?.delivery_address ?? "N/A"}</p>
    ${
      buyer?.account_type === "Company"
        ? `<p><strong>Corporate Tax ID:</strong> ${buyer?.tax_id ?? "N/A"} • <strong>Commercial Registration (CR):</strong> ${buyer?.commercial_reg ?? "N/A"}</p>`
        : ""
    }
    <p><strong>Payment Channel:</strong> ${order?.payment_method ?? "Card"} • <strong>Transaction Ref:</strong> ${order?.payment_transaction_ref ?? "SIMULATED"}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Serialized Unit UUID</th>
        <th>Warranty End Date</th>
        <th>Sold Price (EGP)</th>
      </tr>
    </thead>
    <tbody>
      ${(order?.order_items_warranty ?? [])
        .map(
          (oi) => `<tr>
        <td style="font-family:monospace">${oi.item_serial_id}</td>
        <td>${oi.warranty_end_date ?? "Active upon delivery confirmation"}</td>
        <td style="font-family:monospace">${Number(oi.sold_price).toLocaleString()} EGP</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <h3 style="text-align:right; margin-top:20px;">Total Paid (Incl. VAT): ${Number(order?.total_amount ?? 0).toLocaleString()} EGP</h3>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

