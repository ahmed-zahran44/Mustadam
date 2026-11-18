## 2026-11-05T23:59:01Z

You are worker_m1 (Role Simulation Dropdown Implementer).
Your working directory is: d:\Mustadam Project\.agents\teamwork\worker_m1

MANDATORY: You MUST read d:\Mustadam Project\.agents\teamwork\ORIGINAL_REQUEST.md before starting work. Do NOT summarize or filter it.
Also read the detailed Explorer findings:
- d:\Mustadam Project\.agents\teamwork\explorer_survey_1\survey_report.md
- d:\Mustadam Project\.agents\teamwork\explorer_survey_1\handoff.md
Consult d:\Mustadam Project\AGENTS.md, d:\Mustadam Project\PROJECT.md, and d:\Mustadam Project\ARCHITECTURE.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Objective (Milestone 1 — Consolidated Role Simulation Dropdown, Requirement R1):
1. Files you own exclusively:
   - src/components/demo/graduation-demo-toolbar.tsx
   - src/components/demo/demo-toolbar-wrapper.tsx
   - messages/en.json (DemoToolbar section)
   - messages/ar.json (DemoToolbar section)
   - src/app/[locale]/layout.tsx (if toolbar positioning adjustments are required)
2. Requirements:
   - Replace the 12 individual persona buttons with a single compact <select id="persona-select" data-testid="persona-select">.
   - Group the 12 personas into 3 clean <optgroup> categories: Customers, Partner Operations, Platform Administration.
   - Display each persona with its clear, production-quality label (supporting English and Arabic).
   - When a persona is selected from the dropdown:
     * Call switchDemoPersonaAction(personaId)
     * Update the active session and navigate (router.push) to the associated portal route preserving current locale.
   - House the toolbar in a compact docked (e.g. sticky top-0 z-50, ~38px height) or floating control accessible across all pages while scrolling.
   - Refactor the notification drawer into a clean floating popover to prevent shifting page layout.
   - Scrub academic demonstration tags ("GRADUATION DEMO TOOLBAR", "12 SRS Personas", "SRS 6.2") into production copy ("Role Simulator", "Quick Persona Switcher") in both messages/en.json and messages/ar.json.
3. Verification:
   - Run `npm test` (or `cmd /c npm test`) to confirm that all existing unit tests pass and messages parity is 100% maintained.
   - Document commands executed and exact test output in your handoff report.
4. Output:
   - Write d:\Mustadam Project\.agents\teamwork\worker_m1\handoff.md following the Handoff Protocol.
   - Notify parent via send_message when done.
