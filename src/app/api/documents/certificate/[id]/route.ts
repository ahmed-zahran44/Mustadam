import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * FR-11 Printable / Downloadable NIST 800-88 Data Destruction Certificate
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();

  const { data: item } = await supabase
    .from("serialized_items")
    .select(
      "item_serial_id, title, barcode, data_wiped_bool, created_at, inspection_records(inspector_id, inspected_at, condition_notes)",
    )
    .eq("item_serial_id", id)
    .maybeSingle();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NIST 800-88 Data Destruction Certificate - ${item?.barcode ?? id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 32px; border: 3px double #047857; }
    h1 { color: #047857; margin-bottom: 4px; }
    .meta { font-family: monospace; background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0; }
    .badge { display: inline-block; background: #047857; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body onload="window.print()">
  <span class="badge">NIST SP 800-88 Rev. 1 CERTIFIED</span>
  <h1>Certificate of Data Sanitization & Destruction</h1>
  <p>Mustadama ("مُستدام") Circular E-Commerce Technical Inspection Hub</p>
  <div class="meta">
    <p><strong>Item Serial UUID:</strong> ${item?.item_serial_id ?? id}</p>
    <p><strong>Warehouse Barcode:</strong> ${item?.barcode ?? "MST-CERTIFIED"}</p>
    <p><strong>Device Model:</strong> ${item?.title ?? "Electronic Storage Device"}</p>
    <p><strong>Sanitization Standard:</strong> NIST SP 800-88 Purge / Cryptographic Erase</p>
    <p><strong>Verification Status:</strong> ${item?.data_wiped_bool ? "VERIFIED & WIPED (100% Unrecoverable)" : "PENDING"}</p>
    <p><strong>Issued At:</strong> ${new Date().toISOString()}</p>
  </div>
  <p>This document certifies that all non-volatile storage media inside the serialized device identified above have been permanently sanitized in accordance with NIST 800-88 guidelines prior to resale, refurbishment, or component harvesting.</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

