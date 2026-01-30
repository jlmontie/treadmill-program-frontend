# Program Assignment Logic - Implementation Plan

## Overview

This document outlines the implementation plan for the updated program assignment logic based on client feedback. The changes affect database schema, pre-test flow, metabolic test integration, and program recommendations.

---

## Execution Plan

### Phase 1: Database Schema Updates ✅ COMPLETED
**Priority: HIGH** (Foundation for all other changes)

| Task | Table | Change | Notes |
|------|-------|--------|-------|
| 1.1 | `athletes` | Add `head_size` enum | Values: small, medium, large |
| 1.2 | `athletes` | Add `chest_size` enum | Values: small, medium, large |
| 1.3 | `metabolic_results` | Add `recovery_hr` integer | Calculated from recovery_at_percent × max_hr |

**SQL Migration:**
```sql
-- Add equipment sizing columns
ALTER TABLE athletes 
ADD COLUMN head_size TEXT CHECK (head_size IN ('small', 'medium', 'large')),
ADD COLUMN chest_size TEXT CHECK (chest_size IN ('small', 'medium', 'large'));

-- Add recovery heart rate
ALTER TABLE metabolic_results
ADD COLUMN recovery_hr INTEGER;
```

### Phase 2: Recovery HR Calculation ✅ COMPLETED
**Priority: HIGH** (Required for workout flow)

*Implemented via database trigger in `003_schema_updates_v2.sql`*

Implement automatic calculation when saving metabolic results:

| recovery_at_percent | Multiplier | Formula |
|---------------------|------------|---------|
| < 85% | 82% | CEIL(max_hr × 0.82) |
| 85% - 91% | 80% | CEIL(max_hr × 0.80) |
| ≥ 92% | 77% | CEIL(max_hr × 0.77) |
| Exceptionally fit (trainer override) | 75% | CEIL(max_hr × 0.75) |

### Phase 3: Pre-Test Flow Refactor ✅ COMPLETED
**Priority: HIGH** (Core logic change)

*Implemented in `src/lib/pretest-flow.ts` and updated pretest session UI*

Current: Steps 1→2→3→...→13 sequential
New: Branching flow based on `gate_instruction` on failure

See **Flow Diagram** below.

### Phase 4: Program Recommendation Engine ✅ COMPLETED
**Priority: HIGH** (Depends on Phase 3)

*Implemented in `src/lib/pretest-flow.ts` with functions: `getProgramPrefix()`, `getMetabolicSuffix()`, `buildProgramCodes()`*

Build recommendation logic that combines:
1. Pre-test type (line, standard, ret, ret_female)
2. Pre-test outcome (which step failed/passed)
3. Metabolic category (la, standard, low)
4. Athlete gender

### Phase 5: Workout #3 Adjustment Logic ⏳ PENDING
**Priority: MEDIUM** (Post-assignment feature)

After workout #3 completion, analyze speed column usage:
- ≥50% left column → Recommend downgrade
- ≥50% right column → Recommend upgrade
- Otherwise → No change

### Phase 6: UI Fixes ⏳ PENDING
**Priority: MEDIUM**

| Issue | Fix |
|-------|-----|
| Athlete page "Start Workout" goes to group selection | Navigate directly to single-athlete workout |
| No cancel workout option | Add cancel button with confirmation |
| Program selection only shows women | Fix gender filter in program query |

---

## Pre-Test Flow Diagram (Steps Only, No Metabolic)

```
                              ┌─────────────────┐
                              │   START TEST    │
                              │  Steps 1 → 5    │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │     STEP 6      │
                              │  Gate Exercise  │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
               ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
               │  FAIL   │        │  PASS   │        │         │
               └────┬────┘        └────┬────┘        └─────────┘
                    │                  │
           ┌────────▼────────┐   ┌────▼────┐
           │  Steps 10 & 11  │   │ STEP 7  │
           │  (Performed)    │   └────┬────┘
           └────────┬────────┘        │
                    │         ┌───────┼───────┐
                    │         │               │
                    │    ┌────▼────┐    ┌─────▼─────┐
                    │    │  FAIL   │    │   PASS    │
                    │    └────┬────┘    └─────┬─────┘
                    │         │               │
                    │    ┌────▼────┐    ┌─────▼─────┐
                    │    │ STEP 12 │    │  STEP 8   │
                    │    └────┬────┘    └─────┬─────┘
                    │         │               │
                    │    ┌────┼────┐    ┌─────┼─────┐
                    │    │         │    │           │
                    │ ┌──▼──┐  ┌───▼───┐ ┌──▼──┐ ┌───▼───┐
                    │ │FAIL │  │ PASS  │ │FAIL │ │ PASS  │
                    │ └──┬──┘  └───┬───┘ └──┬──┘ └───┬───┘
                    │    │         │        │        │
                    │    │         │   ┌────▼────┐   │
                    │    │         │   │ STEP 13 │   │
                    │    │         │   └────┬────┘   │
                    │    │         │        │        │
                    │    │         │   ┌────┼────┐   │
                    │    │         │   │         │   │
                    │    │         │ ┌─▼──┐  ┌───▼───┐
                    │    │         │ │FAIL│  │ PASS  │
                    │    │         │ └─┬──┘  └───┬───┘
                    │    │         │   │         │
                    ▼    ▼         ▼   ▼         ▼        ▼
              ┌──────────────────────────────────────────────────┐
              │              PROGRAM ASSIGNMENT                   │
              └──────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         OUTCOME → PROGRAM MAPPING
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│ OUTCOME A: Step 6 Failed (or Step 12 Failed after Step 7 Failed)       │
│ → Developmental Programs                                                │
├─────────────────┬───────────────────────────────────────────────────────┤
│ Pre-test Type   │ Assigned Program                                      │
├─────────────────┼───────────────────────────────────────────────────────┤
│ line            │ dev_line_*         + optional dev_leg_* supplement    │
│ standard        │ dev_standard_*     + optional dev_leg_* supplement    │
│ ret             │ red_standard_*                                        │
│ ret_female      │ red_standard_*                                        │
└─────────────────┴───────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ OUTCOME B: Step 7 Failed → Step 12 Passed                              │
│ → Reduced Speed / Level II Programs                                    │
├─────────────────┬───────────────────────────────────────────────────────┤
│ Pre-test Type   │ Assigned Program                                      │
├─────────────────┼───────────────────────────────────────────────────────┤
│ line            │ red_line_*                                            │
│ standard        │ red_standard_*                                        │
│ ret             │ ii_standard_*                                         │
│ ret_female      │ ii_female_*                                           │
└─────────────────┴───────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ OUTCOME C: Step 8 Failed → Step 13 Passed                              │
│ → Standard / Level III Programs                                        │
├─────────────────┬───────────────────────────────────────────────────────┤
│ Pre-test Type   │ Assigned Program                                      │
├─────────────────┼───────────────────────────────────────────────────────┤
│ line            │ standard_line_*                                       │
│ standard        │ standard_standard_*                                   │
│ ret             │ adv_standard_*                                        │
│ ret_female      │ adv_standard_*                                        │
└─────────────────┴───────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ OUTCOME D: Step 8 Passed                                               │
│ → Advanced / Elite Programs                                            │
├─────────────────┬───────────────────────────────────────────────────────┤
│ Pre-test Type   │ Assigned Program                                      │
├─────────────────┼───────────────────────────────────────────────────────┤
│ line            │ adv_line_*                                            │
│ standard        │ adv_standard_*                                        │
│ ret             │ iii_standard_*                                        │
│ ret_female      │ iii_female_*                                          │
└─────────────────┴───────────────────────────────────────────────────────┘

Note: The * suffix is determined by the metabolic test (not shown):
  - *_la = High lactic acid (at_max_percent < 88%)
  - *_standard = Standard metabolic (at_max_percent 88-93%)
  - *_low = Low metabolic need (at_max_percent ≥ 94%)

═══════════════════════════════════════════════════════════════════════════
```

---

## Simplified Decision Tree (Text Version)

```
START → Complete Steps 1-5 → STEP 6

STEP 6:
  ├─ FAIL → Do Steps 10,11 → [OUTCOME A: Developmental]
  └─ PASS → STEP 7

STEP 7:
  ├─ FAIL → STEP 12
  │           ├─ FAIL → [OUTCOME A: Developmental]
  │           └─ PASS → [OUTCOME B: Reduced/Level II]
  └─ PASS → STEP 8

STEP 8:
  ├─ FAIL → STEP 13
  │           ├─ FAIL → STEP 12 → (same as Step 7 fail)
  │           └─ PASS → [OUTCOME C: Standard/Level III]
  └─ PASS → [OUTCOME D: Advanced/Elite]
```

---

## Implementation Order

1. ✅ **Database migrations** - `003_schema_updates_v2.sql`
2. ✅ **Update TypeScript types** - `src/lib/types/database.ts`
3. ✅ **Recovery HR calculation** - DB trigger auto-calculates on insert/update
4. ✅ **Pre-test step flow engine** - `src/lib/pretest-flow.ts`
   - Gate instruction parser
   - Non-sequential step navigation
   - Outcome determination (A, B, C, D)
5. ✅ **Program recommendation engine** - `src/lib/pretest-flow.ts`
   - Map outcomes to program prefixes
   - Combine with metabolic suffix (_la, _standard, _low)
   - Dev leg supplement option for Outcome A
6. ⏳ **Workout #3 adjustment logic**
7. ⏳ **UI fixes**

**Completed: Phases 1-5**

---

## Questions for Client Confirmation

1. **Step 10 & 11**: Are these always performed together when Step 6 fails, or can they fail independently?

2. **Trainer Override**: For "exceptionally fit" athletes, is there a specific field/flag to mark this, or is it a manual selection?

3. **Program Suffixes**: Confirm the exact program naming convention matches the database:
   - `dev_line_la`, `dev_line_standard`, `dev_line_low`
   - `red_standard_la`, etc.

4. **Developmental + Leg Strength**: When both `dev_*` and `dev_leg_*` are assigned, are these:
   - Two separate programs assigned simultaneously?
   - Or a combined/alternating program?

5. **Step 13 → Step 12 → Step 10**: If Step 13 fails, does the athlete also perform Steps 10 & 11, or just get the developmental assignment?
