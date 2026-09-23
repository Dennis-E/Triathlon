# Quickstart: Validate Optimized Bike Power PB Import

## Prerequisites

- Node.js and root dependencies installed with `npm install`.
- A current desktop browser for the manual absolute-time check.
- No personal Strava export is required; use generated synthetic data.

## 1. Establish the correctness baseline

Before implementation, run the focused suites:

```powershell
npx jest __tests__/power-pb-utils.test.js __tests__/zip-importer.test.js --runInBand
```

Expected: all existing tests pass. Preserve a test-only reference implementation of the
current rolling calculation before replacing it; this is the oracle for differential
fixtures.

Baseline recorded 2026-09-23:

- Focused Jest suites: 2 passed, 39 tests passed.
- Synthetic four-hour activity: 14,401 one-second records, eight efforts, 4,005.83 ms
  in the local Node.js environment before optimization.

## 2. Validate exact power semantics

Run the focused suites again after implementation:

```powershell
npx jest __tests__/power-pb-utils.test.js __tests__/zip-importer.test.js --runInBand
```

Expected differential coverage:

- regular one-second records;
- irregular and sparse timestamps;
- exact duration end boundaries;
- duplicate timestamps and backward time/distance records;
- missing, zero, negative, non-numeric, and non-finite power;
- activities shorter than requested durations;
- tied best windows where the first candidate must win;
- non-integer usable power values exercising exact compatibility;
- no-power activities returning no efforts;
- unchanged GPS/non-bike results and continued import after one corrupt activity.

Every returned field must equal the reference result; approximate numeric assertions are
not sufficient for the compatibility suite.

## 3. Run automated scaling validation

After the benchmark script and package command are added by implementation, run:

```powershell
npm run benchmark:power-pb
```

The report must include:

- three warm-up runs followed by seven measured runs for each workload;
- median timings for a workload and its doubled record count;
- a growth ratio no greater than 2.5;
- a four-hour no-power workload completing power processing within 100 ms in the
  documented local environment;
- baseline-versus-optimized power processing showing at least 75% reduction;
- the 100-activity workload: two hours per activity, one record per second, 720,000
  records total;
- separate parse, GPS, and power-PB timing totals when running the import benchmark.

Do not enforce the hard two-second browser target in Jest or shared CI.

## 4. Run the manual browser benchmark

Serve the repository:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/docs/test-power-pb-performance.html` in a current desktop
browser and run the static synthetic benchmark harness. Record:

- browser name and version;
- operating system and processor model;
- warm-up count and measured run count;
- median time for all eight durations over one four-hour activity with one-second
  records (14,401 inclusive samples if starting at second zero);
- median phase timings for parse, GPS, and power processing;
- longest gap between progress updates for the 100-activity workload.

Expected outcomes:

- all eight durations complete within 2 seconds after records are available;
- progress never decreases and has no gap longer than 2 seconds;
- timing output contains counts and durations only, never activity contents.

If the optimized calculation still produces a progress gap over 2 seconds, implement
cooperative yielding or the optional static Web Worker path and repeat the benchmark;
SC-007 is incomplete until the measured gap is at most 2 seconds.

## 5. Run the full regression suite

```powershell
npm test -- --runInBand
```

Expected: all root suites pass. No API-service test run is required because this feature
does not modify `services/api`.

## Final validation evidence (2026-09-23)

Environment:

- Browser: VS Code integrated browser, Chromium 148 / Electron 42.8.1 on Windows 10
- Logical processors reported by browser: 28
- Benchmark method: 3 warm-up runs, 7 measured runs, median reported

Browser benchmark (`docs/test-power-pb-performance.html`):

- Four-hour workload: 14,401 records, 3.2 ms median for all eight durations
- History workload: 100 two-hour activities, 720,000 records, 612.6 ms total
- Longest progress gap: 9 ms; no Web Worker or cooperative-yielding escalation needed
- Phase sample: parse 0.9 ms, GPS 0.4 ms, power 3.2 ms

Automated benchmark (`npm run benchmark:power-pb`):

- Doubling ratio: 2.14 (limit 2.5)
- Four-hour no-power median: 1.4 ms (limit 100 ms)
- Legacy median for 3,601 records: 290.14 ms
- Optimized median for 3,601 records: 0.81 ms
- Reduction: 99.72% (minimum 75%)
- Import phase totals for 100 synthetic activities: parse 0.82 ms, GPS 32.52 ms,
  power 191.28 ms; longest progress gap 6.16 ms

Success-criteria evidence:

- **SC-001**: PASS - browser median 3.2 ms, below 2 seconds.
- **SC-002**: PASS - automated doubling ratio 2.14.
- **SC-003**: PASS - exact differential fixtures and focused integration tests pass.
- **SC-004**: PASS - no-power median 1.4 ms.
- **SC-005**: PASS - measured reduction 99.72%.
- **SC-006**: PASS - corrupt-file continuation test passes.
- **SC-007**: PASS - browser progress gap 9 ms; worker escalation not required.
- **SC-008**: PASS - parse, GPS, and power timings are reported separately.

Final regression gate: 17 Jest suites passed, 416 tests passed.
