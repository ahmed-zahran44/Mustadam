## 2026-11-06T00:20:43Z
You are worker_m2 (UI Sanitization & Academic Label Scrubbing Implementer).
Your working directory is: d:\Mustadam Project\.agents\teamwork\worker_m2

MANDATORY: You MUST read d:\Mustadam Project\.agents\teamwork\ORIGINAL_REQUEST.md before starting work. Do NOT summarize or filter it.
Also read the detailed Explorer findings:
- d:\Mustadam Project\.agents\teamwork\explorer_survey_2\survey_report.md
- d:\Mustadam Project\.agents\teamwork\explorer_survey_2\handoff.md
Consult d:\Mustadam Project\AGENTS.md, d:\Mustadam Project\PROJECT.md, and d:\Mustadam Project\ARCHITECTURE.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Objective (Milestone 2 — Authentic Production UI & Academic Label Scrubbing, Requirement R2):
1. Files you own exclusively:
   - messages/en.json
   - messages/ar.json
   - src/components/seller/seller-portal-client.tsx
   - src/components/partner/partner-portal-client.tsx
   - src/components/store/storefront-client.tsx
   - src/components/admin/admin-portal-client.tsx
   - src/app/api/documents/invoice/[id]/route.ts
   - src/app/api/documents/certificate/[id]/route.ts
   - src/lib/domain/seller-actions.ts
   - src/lib/domain/store-actions.ts
2. Requirements:
   - Scrub all exposed requirement codes (such as "FR-01", "FR-02", ..., "FR-26", "NFR-01", ..., "NFR-05"), spec tags ("SRS"), and academic demo phrases across headings, tabs, badges, cards, tooltips, toast notifications, PDF documents, and domain server action user error messages.
   - Use the exact replacements and recommendations cataloged in explorer_survey_2/survey_report.md.
   - Maintain authentic, professional, commercial tone and styling for Mustadama in both English (LTR) and Arabic (RTL).
   - Preserve 100% exact key parity between messages/en.json and messages/ar.json.
   - Preserve bidirectional alignment and Tailwind logical utility classes (ms-*, me-*, ps-*, pe-*, text-start, text-end).
3. Verification:
   - Add a unit test in tests/unit/ (or update tests/unit/messages-parity.test.ts) to verify that no "FR-" or "NFR-" strings exist in messages/en.json or messages/ar.json.
   - Run `npm test` and verify that all test suites pass.
   - Run `npx tsc --noEmit` and confirm 0 type errors.
4. Output:
   - Write d:\Mustadam Project\.agents\teamwork\worker_m2\handoff.md following the Handoff Protocol.
   - Notify parent via send_message when done.
