# Research: Optimized Bike Power PB Import

## Decision 1: Replace repeated full scans with prepared sliding windows

**Decision**: Normalize the records once, then evaluate each of the eight fixed power
durations with monotonic start/end indices, a valid-sample count, and a running power
sum. Track only the best effort instead of allocating every candidate window.

**Rationale**: The current calculation filters the complete point list for every start
point and repeats normalization/sorting for every duration. That is approximately
$O(Dn^2)$ and allocates many temporary arrays. One preparation pass plus one monotonic
sweep per duration reduces the normal FIT-power path to $O(n \log n + Dn)$, where
$D=8$ is fixed. `buildFitPowerEfforts` can reuse the prepared list across all durations.

**Alternatives considered**:

- Binary-search each window boundary but rescan its values: fewer boundary comparisons,
  but summation remains quadratic for long windows.
- Prefix sums: also linear after preparation, but subtraction changes floating-point
  accumulation behavior and complicates exact compatibility.
- Parallelize the existing calculation: consumes more CPU while preserving the
  quadratic root cause.

## Decision 2: Preserve the existing function contract through a batch helper

**Decision**: Keep
`calculateRollingPowerEfforts(records, targetSeconds, coverageThreshold)` unchanged as
the public single-duration entry point. Add a batch calculation used by
`buildFitPowerEfforts` so normalization and sorting happen once for all durations.
Expose the new reusable helper through both CommonJS and `window.powerPbUtils` in the
same style as the existing module.

**Rationale**: Existing tests and callers continue to work, while the import path gains
the full optimization. The helper remains a pure function and is directly testable in
the Node Jest environment.

**Alternatives considered**:

- Change `calculateRollingPowerEfforts` to accept multiple durations: rejected because
  it breaks the existing signature and return shape.
- Put all optimization inside `zip-importer.js`: rejected because rolling-power logic
  belongs to the reusable utility and would become harder to test independently.

## Decision 3: Treat current window semantics as the executable baseline

**Decision**: Differential tests will retain a test-only reference implementation of
the current algorithm. The optimized result must exactly match it for inclusive end
bounds, observed-span calculation, the combined 80% coverage formula, valid-sample
averaging, output boundaries, and first-candidate tie selection.

The fast running-sum path is used when normalized power samples are positive safe
integers, as expected from FIT power records. If a public caller supplies usable
non-integer power values, use an exact-compatibility path whose accumulation order
matches the reference behavior. This prevents tiny IEEE-754 differences from changing
`avgPower` or a tie decision.

Raw FIT normalization and rolling-helper preparation remain separate layers. Existing
raw FIT normalization may collapse duplicate timestamps to the latest accepted
distance/power record. The public `calculateRollingPowerEfforts` input currently keeps
same-timestamp records after stable sorting, so its preparation must not deduplicate
them; differential tests preserve that behavior.

**Rationale**: The specification requires identical output, not merely numerically
close output. FIT watt samples normally allow the linear integer path, while the
fallback protects the wider public utility contract.

**Alternatives considered**:

- Compare averages with an epsilon: rejected because it changes ranking and tie
  semantics.
- Accept tiny decimal differences: rejected by FR-004 and SC-003.
- Use compensated summation: numerically better, but intentionally differs from the
  current output.

## Decision 4: Skip no-power activities after one preparation pass

**Decision**: Record preparation returns a usable-power count. If it is zero, the batch
calculation returns immediately without sweeping any duration.

**Rationale**: This gives no-power bike files negligible power-processing overhead and
directly satisfies FR-008/SC-004. The records still remain available to unchanged GPS
processing.

**Alternatives considered**:

- Inspect raw records for a `power` property before normalization: faster in some cases,
  but can disagree with the established normalization rules.

## Decision 5: Add opt-in phase timing at existing orchestration boundaries

**Decision**: Extend the existing optional `fitDeps` object accepted by
`extractGpsAndPowerFromZip` with an injected monotonic `now()` function and an
`onTiming(timing)` callback. Measure per-activity FIT read/parse, GPS extraction and
simplification, and power-PB processing. Emit only activity ID, source type, record
count, and elapsed durations; do not include activity content.

**Rationale**: These are the boundaries users need to distinguish under FR-012 and
SC-008. Optional dependencies keep production behavior and the function signature
unchanged, while enabling deterministic integration tests and local benchmark reports.

**Alternatives considered**:

- Permanent `console.time` calls: noisy, difficult to aggregate, and not testable.
- A global metrics singleton: unnecessary mutable state and poor Node/browser parity.
- Add required callback parameters: a breaking API change.

## Decision 6: Separate stable automated checks from wall-clock acceptance

**Decision**: Jest covers differential correctness, no-power fast exit, monotonic
progress, failure isolation, and a repeated median scaling comparison using three
warm-up runs and seven measured runs. A root benchmark script generates the four-hour
and 100-activity synthetic workloads and reports phase timings. A static browser
benchmark page runs the same synthetic profiles in the application environment. The
hard two-second criterion is validated manually there, not asserted in CI.

**Rationale**: Absolute timings on shared CI runners are unstable. Relative growth and
exact results provide reliable automated regression signals, while the browser run
validates the user-facing target on the actual platform.

**Alternatives considered**:

- Hard two-second Jest assertion: rejected as hardware-sensitive and flaky.
- Only manual testing: rejected because it would not prevent algorithmic regressions.

## Decision 7: Defer Web Worker integration unless profiling requires it

**Decision**: Implement the linear core and measure SC-007 first. Introduce no worker
unless the optimized synchronous calculation still creates a measured progress gap
longer than two seconds. If it does, implementation is not complete until cooperative
yielding or a static Web Worker reduces the measured gap to at most two seconds.

**Rationale**: A worker improves scheduling responsiveness but does not remove
quadratic work. It also adds record serialization, cancellation, error propagation,
and another static script boundary. The measured escalation condition keeps scope
proportional to the actual remaining problem.

**Alternatives considered**:

- Add a worker immediately: rejected as premature complexity.
- Ignore responsiveness after optimization: rejected because SC-007 remains binding.
