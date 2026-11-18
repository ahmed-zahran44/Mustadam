## 2026-11-06T00:37:59Z
You are auditor_m2 (Forensic Auditor M2).
Your working directory is: d:\Mustadam Project\.agents\teamwork\auditor_m2

MANDATORY: You MUST read d:\Mustadam Project\.agents\teamwork\ORIGINAL_REQUEST.md before starting work. Do NOT summarize or filter it.
Also read:
- Worker Handoff: d:\Mustadam Project\.agents\teamwork\worker_m2\handoff.md
- Survey Inventory: d:\Mustadam Project\.agents\teamwork\explorer_survey_2\survey_report.md
- Project Scope: d:\Mustadam Project\.agents\teamwork\orchestrator\PROJECT.md
- Project Rules: d:\Mustadam Project\AGENTS.md

Your Objective:
Conduct forensic integrity auditing of Milestone 2 (UI Sanitization & Academic Label Scrubbing, Requirement R2):
1. Integrity Forensics:
   - Check all modified files:
     * `messages/en.json` & `messages/ar.json`
     * `src/components/seller/seller-portal-client.tsx`
     * `src/components/partner/partner-portal-client.tsx`
     * `src/components/store/storefront-client.tsx`
     * `src/components/admin/admin-portal-client.tsx`
     * `src/app/api/documents/invoice/[id]/route.ts`
     * `src/app/api/documents/certificate/[id]/route.ts`
     * `src/lib/domain/seller-actions.ts`
     * `src/lib/domain/store-actions.ts`
     * `tests/unit/ui-sanitization.test.ts`
   - Verify that:
     * Modifications are authentic and genuine.
     * `tests/unit/ui-sanitization.test.ts` contains real assertions scanning files and verifying zero occurrences of requirement tags, rather than trivial pass-throughs.
     * No underlying domain calculations, state transitions, or business rules were broken or bypassed.
     * No fake or mock shortcuts were created.
2. Run audit commands:
   - Run `npm test`
   - Run `npx tsc --noEmit`
3. Output:
   - Write your forensic audit report with explicit verdict (`CLEAN` or `INTEGRITY VIOLATION`) in `d:\Mustadam Project\.agents\teamwork\auditor_m2\handoff.md`.
   - Message parent via send_message with your verdict.
