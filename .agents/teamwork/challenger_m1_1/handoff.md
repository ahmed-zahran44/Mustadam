# Empirical Verification & Adversarial Challenge Report: Milestone 1

- **Agent**: `challenger_m1_1` (Empirical Challenger)
- **Recipient**: `aa8e9444-643b-42e4-aaa4-cc5204480e27` (Parent / Orchestrator)
- **Milestone**: Milestone 1 — Consolidated Role Simulation Dropdown (Requirement R1)
- **Verdict**: **`APPROVE`**
- **Date**: 2026-11-06T00:13:00Z

---

## 1. Observation

1. **Toolbar Component Structure (`src/components/demo/graduation-demo-toolbar.tsx`)**:
   - Lines 30–55: `PERSONA_GROUPS` defines exactly 3 categories:
     * `groupCustomers` (4 IDs: `seller-individual`, `seller-corporate`, `buyer-individual`, `buyer-corporate`)
     * `groupPartners` (6 IDs: `courier-hub`, `transport-bulky`, `inspector`, `refurb-tech`, `dismantle-tech`, `warehouse-mgr`)
     * `groupAdmin` (2 IDs: `customer-service`, `admin`)
   - Lines 57–59: `formatPersonaLabel(rawLabel)` uses `rawLabel.replace(/^[\d١-٩٠-٩]+\.\s*/, "").trim()`, stripping both Western and Eastern Arabic academic enumeration prefixes.
   - Lines 113–114: Toolbar docked via `sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-xs min-h-[38px] py-1`, ensuring persistent visibility across scrolling with minimal vertical height.
   - Lines 129–157: Consolidated `<select id="persona-select" data-testid="persona-select">` with disabled placeholder `<option value="" disabled>`, rendering all 12 personas partitioned across the 3 `<optgroup>`s.
   - Lines 133, 158–162: `<select ... disabled={isPending}>` prevents concurrent/re-entrant submissions while switching.
   - Lines 220–279: Notification popover rendered inside a `relative` container using `absolute top-full end-0 mt-1.5 w-80 sm:w-96 max-h-80 overflow-y-auto rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl p-3 z-50`, dismissed via `<div className="fixed inset-0 z-40 bg-transparent" onClick={() => setDrawerOpen(false)} />` and close button. Completely outside normal document flow.
   - Lines 296–301: Inventory aging toast notification rendered via `absolute top-full start-1/2 -translate-x-1/2 mt-1.5 ... pointer-events-none z-50`, also outside normal document flow.

2. **Session and Routing Contracts (`src/lib/auth/rbac.ts` & `src/lib/auth/actions.ts`)**:
   - `DEMO_PERSONAS` contains exactly 12 items, each having valid UUID `userId`, `@mustadama.eg` email, clean role in the 8 clean DB RBAC roles, and designated `defaultRoute` (`/seller`, `/store`, `/partner`, `/admin`).
   - Every persona's `defaultRoute` is verified against `PORTAL_ALLOWED_ROLES` via `canAccessPortal()`:
     * `Customer` -> permitted on `/seller` and `/store`
     * `Courier`, `Partner_Inspector`, `Partner_Refurb_Tech`, `Partner_Dismantle_Tech`, `Partner_Warehouse_Mgr` -> permitted on `/partner`
     * `Customer_Service`, `Admin` -> permitted on `/admin`
   - `switchDemoPersonaAction(personaId)` handles invalid persona IDs by returning `{ ok: false, error: "Unknown persona" }`.

3. **Empirical Test Suite Execution**:
   - Authored adversarial stress test suite in `tests/unit/challenger-role-simulation.test.ts` (13 tests) covering:
     1. Oracle integrity of all 12 personas, UUIDs, emails, and route permissions.
     2. Static DOM markup rendering in English with 3 `<optgroup>`s and 12 clean `<option>`s.
     3. Static DOM markup rendering in Arabic (RTL) with Arabic optgroup labels and Eastern Arabic numerals stripped.
     4. Guest session corner case (`activeUserId = null`): placeholder selected, "Guest Session" displayed, aging disabled, sign-out hidden.
     5. Non-demo / unknown authenticated user corner case: displays role chip and email, falls back to prompt option, renders sign-out, does not crash.
     6. Long localized names and emails: verified CSS `max-w-[160px] truncate` and `title` attributes prevent toolbar overflow.
     7. Case-insensitive email matching: verified `INSPECTOR@MUSTADAMA.EG` resolves to `inspector` when `userId` is absent.
     8. Notification count and list markup rendering.
     9. Architectural proof of zero document reflow for popover (`absolute top-full end-0`) and dismissal backdrop (`fixed inset-0`).
     10. Regex sanitization stress test against irregular numeric prefixes.
     11. Concurrency stress test: 5 concurrent rapid switch actions resolve deterministically.
     12. Rejection of unknown and empty persona IDs.

4. **Command Execution Results**:
   - Command: `cmd /c npm test`
     ```
      RUN  v5.0.5 D:/Mustadam Project

      ✓ tests/unit/role-simulation.test.ts (3 tests) 11ms
      ✓ tests/unit/aging.test.ts (5 tests) 10ms
      ✓ tests/unit/messages-parity.test.ts (1 test) 8ms
      ✓ tests/unit/pricing.test.ts (5 tests) 8ms
      ✓ tests/unit/rbac.test.ts (4 tests) 9ms
      ✓ tests/unit/graduation-demo-scenarios.test.ts (7 tests) 14ms
      ✓ tests/unit/domain-engines.test.ts (7 tests) 13ms
      ✓ tests/unit/routing.test.ts (2 tests) 5ms
      ✓ tests/unit/challenger-role-simulation.test.ts (13 tests) 29ms

      Test Files  9 passed (9)
           Tests  47 passed (47)
        Duration  652ms
     ```
   - Command: `cmd /c npx tsc --noEmit`
     * Result: Exited with code 0 (zero TypeScript errors).

---

## 2. Logic Chain

1. **Observation 1 & 3 $\rightarrow$ Dropdown & Persona Completeness**:
   `PERSONA_GROUPS` explicitly accounts for all 12 IDs present in `DEMO_PERSONAS`. Static HTML rendering in both English (`en`) and Arabic (`ar`) proves that all 12 `<option>` elements are rendered inside the 3 semantic `<optgroup>`s with sanitized text labels.
2. **Observation 2 & 3 $\rightarrow$ Route & RBAC Compliance**:
   Every persona's `defaultRoute` corresponds to its allowed portal as defined in `PORTAL_ALLOWED_ROLES`. Switching to any persona guarantees access to that portal without 403 or redirect loops.
3. **Observation 1 & 3 $\rightarrow$ Zero Reflow & Accessibility**:
   The toolbar's `sticky top-0 z-50` keeps the switcher docked at the top during scrolling. Floating the notification drawer via `absolute top-full end-0 z-50` and the aging alert via `absolute top-full start-1/2` removes them from the page flow, guaranteeing zero layout shift upon opening or closing. The click-outside transparent backdrop (`fixed inset-0 z-40 bg-transparent`) ensures smooth dismissal.
4. **Observation 1, 3 $\rightarrow$ Robustness Under Corner Cases**:
   Testing with `null` sessions (guests), unlisted user accounts, case-insensitive emails, and rapid asynchronous invocations demonstrated that the component does not crash, gracefully displays appropriate fallback states, and locks the select control (`disabled={isPending}`) to prevent re-entrant race conditions.
5. **Observation 4 $\rightarrow$ Zero Regressions & Type Integrity**:
   The full suite of 47 tests across 9 files passes with zero failures, and `tsc --noEmit` verifies strict TypeScript compatibility.

---

## 3. Caveats

- End-to-end browser automation (Playwright test run with live browser clicks) is scheduled for Milestone 4 (E2E Track). The empirical verification here tested server component static markup, DOM option generation, routing matrix contracts, and action concurrency.

---

## 4. Conclusion

**Verdict: `APPROVE`**

Milestone 1 satisfies all requirements of R1:
1. Replaces separate buttons with a single, compact `<select id="persona-select" data-testid="persona-select">`.
2. Groups all 12 personas across 3 clean categories (Customers, Partner Operations, Platform Administration).
3. Connects selection to `switchDemoPersonaAction` and locale-preserving navigation.
4. Eliminates document reflow by converting notifications to an absolutely positioned floating popover with backdrop dismissal.
5. Handles guest sessions, unknown accounts, and rapid switching safely and deterministically.
6. 100% of unit tests (47 tests across 9 suites) and TypeScript compilation pass with zero warnings or errors.

---

## 5. Verification Method

To independently verify these empirical results, run:

1. **Unit Test Suite**:
   ```powershell
   cmd /c npm test
   ```
   *Expected*: 9 test files passed, 47 tests passed.

2. **TypeScript Compilation Check**:
   ```powershell
   cmd /c npx tsc --noEmit
   ```
   *Expected*: Exits with code 0.

3. **Code & Layout Inspection**:
   - Inspect `src/components/demo/graduation-demo-toolbar.tsx` for `<select id="persona-select" data-testid="persona-select">` and `PERSONA_GROUPS`.
   - Inspect `tests/unit/challenger-role-simulation.test.ts` for full stress test coverage.
