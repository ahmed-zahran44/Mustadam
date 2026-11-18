## 2026-11-06T00:37:38Z
You are reviewer_m2_2 (Code Reviewer M2_2).
Your working directory is: d:\Mustadam Project\.agents\teamwork\reviewer_m2_2

MANDATORY: You MUST read d:\Mustadam Project\.agents\teamwork\ORIGINAL_REQUEST.md before starting work. Do NOT summarize or filter it.
Also read:
- Worker Handoff: d:\Mustadam Project\.agents\teamwork\worker_m2\handoff.md
- Survey Inventory: d:\Mustadam Project\.agents\teamwork\explorer_survey_2\survey_report.md
- Project Scope: d:\Mustadam Project\.agents\teamwork\orchestrator\PROJECT.md
- Project Rules: d:\Mustadam Project\AGENTS.md

Your Objective:
Conduct an independent UX and localization review of Milestone 2 (Authentic Production UI & Academic Label Scrubbing, Requirement R2):
1. Focus on:
   - Natural Arabic (RTL) phrasing and natural English (LTR) phrasing across all 4 portals.
   - Verification of printable document endpoints: `src/app/api/documents/invoice/[id]/route.ts` and `src/app/api/documents/certificate/[id]/route.ts`.
   - Verification of domain action user-facing error messages in `src/lib/domain/seller-actions.ts` and `src/lib/domain/store-actions.ts`.
   - Toast notifications and feedback banners across portals.
2. Run verification commands:
   - Run `npm test`
   - Run `npx tsc --noEmit`
3. Output:
   - Write your verdict (`APPROVE` or `REQUEST_CHANGES`) in `d:\Mustadam Project\.agents\teamwork\reviewer_m2_2\handoff.md`.
   - Message parent via send_message with your verdict.
