# UI Contract: Personal Bests Grid & Profile Tile

## 1. Row-grid block markup (index.html)

Applies to the Distance records, Elevation and Longest blocks.

```html
<div class="pb-row-block col-span-full grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-3">
  <div data-pb-col="3" class="order-1 lg:order-none lg:contents space-y-2">   <!-- Run -->
    <h4 data-pb-mobile-sport="Run" class="lg:hidden ...">Run</h4>
    <div id="pbRunContainer" class="space-y-4 lg:space-y-0 lg:contents"></div>
  </div>
  <div data-pb-col="2" class="order-2 lg:order-none lg:contents space-y-2">…Bike…</div>
  <div data-pb-col="1" class="order-3 lg:order-none lg:contents space-y-2">…Swim…</div>
</div>
```

- Keep the DOM order Run → Bike → Swim (the mobile order).
- Remove `lg:col-start-*` from wrappers; `data-pb-col` replaces it.
- Static items (for example the Swim "Not applicable" note) carry `pb-grid-item`.

## 2. Desktop placement CSS (index.html `<style>`)

```css
@media (min-width: 1024px) {
  .pb-row-block .pb-grid-item { grid-row: var(--pb-row, 1); }
  .pb-row-block [data-pb-col="1"] .pb-grid-item { grid-column: 1; }
  .pb-row-block [data-pb-col="2"] .pb-grid-item { grid-column: 2; }
  .pb-row-block [data-pb-col="3"] .pb-grid-item { grid-column: 3; }
}
```

## 3. Row assignment (src/dashboard-power-pb.js)

- After a sport container in a row-grid block is rendered, every direct child gets the class `pb-grid-item` and `style.setProperty('--pb-row', index + 1)`.
- Applies to: `pbRunContainer`, `pbBikeContainer`, `pbSwimContainer`, `pbRunElevationContainer`, `pbBikeElevationContainer`, `pbRunLongestContainer`, `pbBikeLongestContainer`, `pbSwimLongestContainer`.
- `pbBikePowerContainer` (Watt) is not part of the row grid.

## 4. All-time power profile tile

| Aspect | Contract |
|---|---|
| Card | `bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5` |
| Header | `flex items-center`, title span `text-xs font-semibold text-slate-300`, enlarge button via `appendPbDetailButton` (model unchanged) |
| SVG | `viewBox 0 0 VB_W SVG_H`, `width=100%`, `preserveAspectRatio=xMidYMid meet`, `display:block`, `overflow:visible`, no fixed height |
| Axes | Same colours and stroke as `appendTimelineAxes` baseline and y-axis (`#1E293B`, 1) |
| Y labels | `appendYAxisLabel`: max `N W` (top), `0 W` (bottom) |
| X labels | Duration labels where `showLabel` is true, font-size 8.5, monospace, `#CBD5E1`, y = `SVG_H - 0.5` |
| Line/markers | Polyline stroke 1.8. Measurement lines stroke 1.8, opacity 0.75 (1 on hover). Point circles r 2.5 |
| Captions | No "Power (W)" or "Duration" text inside the tile SVG |
| Footer | `<p class="text-[10px] text-slate-600">N durations</p>` |
| Interaction | Hover tooltip via `showPowerPbTooltip(e, point.record, 1, 1, color, point.durationLabel)`. `profile-measurement-hit-area` hit targets kept. Enlarge/detail and export unchanged |
