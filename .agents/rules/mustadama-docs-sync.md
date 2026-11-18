---
trigger: always_on
description: Mandatory anti-hallucination living-documentation sync rule for Mustadama (PROJECT.md, ARCHITECTURE.md, DECISIONS.md, TASKS.md, CHANGELOG.md).
---

# Mustadama Living Documentation & Anti-Hallucination Rule

Always follow the protocol in [AGENTS.md](file:///d:/Mustadam%20Project/AGENTS.md):

1. **Before coding or writing SQL:** Read [PROJECT.md](file:///d:/Mustadam%20Project/PROJECT.md), [ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md), [DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md), and [TASKS.md](file:///d:/Mustadam%20Project/TASKS.md).
2. **During implementation:**
   - Strictly adhere to the 23 PostgreSQL tables, 8 clean DB RBAC roles (`Customer` paired with `Individual` | `Company`, plus 7 operational/admin roles) vs. 12 Demo Toolbar personas, 7-day (168h) Auto-Reject offer decision window (`FR-12`), `Decommissioned_Aged` state transition (`FR-19`), equal batch logistics cost split (`FR-08`/`FR-17`), and harvested spare part `estimated_cost` rollup (`FR-14`/`FR-15`/`FR-17`).
   - Maintain bilingual **English (`en`, LTR)** and **Arabic (`ar`, RTL)** support on all UI screens.
   - Never store card numbers/CVVs (`NFR-01`), always enforce row-level locking on serialized item checkout (`NFR-04`), and always log state transitions in `item_status_history` (`NFR-02`).
3. **After completing any task:** Update [TASKS.md](file:///d:/Mustadam%20Project/TASKS.md) and [CHANGELOG.md](file:///d:/Mustadam%20Project/CHANGELOG.md) (plus [ARCHITECTURE.md](file:///d:/Mustadam%20Project/ARCHITECTURE.md) and [DECISIONS.md](file:///d:/Mustadam%20Project/DECISIONS.md) if any schema or design evolved) before reporting completion to the user.
