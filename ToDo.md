# To-Do

## Completed

### UI
- [x] "Start a workout" action from the athlete page should start a workout with only that athlete, not go to a tile selection with multiple athletes.
  - *Implemented `StartWorkoutButton` component that directly creates workout session*
- [x] Need option to cancel workout in progress.
  - *Added `CancelWorkoutButton` for single workouts and cancel option in group sessions*
- [x] Program selection only shows women's programs.
  - *Fixed gender filter: female athletes see female programs, male athletes see all non-female programs*

### Logic
#### Additional columns for `athletes` table ✅
- [x] head_size: [small, medium, large]. The size of respirator mask that fits the athlete.
- [x] chest_size: [small, medium, large]. The size of heart rate monitor strap that fits the athlete.
  - *Added via migration `003_schema_updates_v2.sql`, UI in athlete forms*

#### Changes to pre-test steps logic ✅

**IMPORTANT**: Both the metabolic test results and the outcome of the pre-test determine the athlete's assigned program (logic below). The metabolic test and the pre-test are two independent tests.

##### Recovery heart rate ✅
- [x] Implemented as database trigger on `metabolic_results` table
- Logic:
  - If `recovery_at_percent` < 85%: max_hr × 82%
  - If 85% ≤ `recovery_at_percent` < 92%: max_hr × 80%  
  - If `recovery_at_percent` ≥ 92%: max_hr × 77%
  - Exceptionally fit (trainer determined): max_hr × 75%

##### Metabolic test logic ✅
- [x] Implemented in `pretest-flow.ts` and server actions
- Logic:
  - If `at_mx_percent` < 88%: high lactic acid program (`_la`)
  - If 88% ≤ `at_mx_percent` < 94%: standard program (`_standard`)
  - If `at_mx_percent` ≥ 94%: low metabolic program (`_low`)

##### Pre-test branching flow ✅
- [x] Implemented non-sequential step flow via `calculateFlowState()` in `pretest-flow.ts`
- [x] Gate steps (6, 7, 8) determine branching based on pass/fail
- [x] Program recommendations based on outcome + pretest type + metabolic category
- [x] Human-readable program names in UI (no database codes shown)

##### Program adjustment after workout #3 ✅
- [x] Implemented in `workout-adjustment.ts`
- [x] Speed column analysis displayed on workout #3 results page
- Logic:
  - ≥50% column 1 (lower speeds) → recommend downgrade
  - ≥50% column 3 (higher speeds) → recommend upgrade
  - Otherwise → no adjustment needed

---

## Pending

*No pending items at this time.*

---

## Reference Documentation

### Pre-test Gate Instructions (for reference)
- Step 6 fail → Steps 10 & 11 → Developmental program (dev_line/dev_standard) or Reduced (red_standard for ret/ret_female)
- Step 7 fail → Step 12
  - Step 12 fail → Step 10 (Developmental)
  - Step 12 pass → Reduced/Standard (red_line, red_standard, ii_standard, ii_female)
- Step 8 fail → Step 13
  - Step 13 fail → Step 12
  - Step 13 pass → Standard/Advanced (standard_line, standard_standard, adv_standard)
- Step 8 pass → Advanced/Elite (adv_line, adv_standard, iii_standard, iii_female)

### Program Hierarchy (for adjustments)
1. dev_leg (lowest)
2. dev_line / dev_standard
3. red_line / red_standard
4. standard_line / standard_standard
5. adv_line / adv_standard
6. ii_standard / ii_female
7. iii_standard / iii_female (highest)


## Bugs
HR is 2 minute recovery heart rate, not recovery heart rate
Finished athlete with col 1 speeds for 4/7 exercises and cancelled workouts for 4 athletes. No feedback for downgrading program on group workout screen or athlete screen.
Program organization: need developmental, separate advanced from standard