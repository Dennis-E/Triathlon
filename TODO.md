# TODO - Youth Training Dashboard Features

## Visualization Enhancements

### 1. Aggregation Level Toggle (Daily / Weekly / Monthly)
**Status:** ⏳ Pending  
**Priority:** High  
**Description:** Add a toggle control to switch between daily, weekly, and monthly aggregation levels for the training volume chart.

**Requirements:**
- Add toggle buttons/dropdown next to timeframe selector
- Allow user to switch between:
  - **Daily**: Show individual activity days
  - **Weekly**: Current default (Monday-based weeks)
  - **Monthly**: Group activities by calendar month
- Update chart aggregation logic to recalculate based on selected level
- Preserve selected sport filter when changing aggregation level
- Chart should refresh automatically when toggling

**Files to modify:**
- `index.html` - Add toggle UI
- `dashboard-utils.js` - Add aggregation functions for daily/monthly

**Test requirements:**
- Unit tests for `aggregateByDay()` function
- Unit tests for `aggregateByMonth()` function
- Integration test verifying toggle updates chart

---

### 2. Tab System for Visualizations
**Status:** ⏳ Pending  
**Priority:** High  
**Description:** Add tabs to switch between different chart visualizations.

**Requirements:**
- Create tab navigation at the top of main chart area
- Tab 1: "Training Volume" (current bar chart)
- Tab 2: "Performance Analysis" (for scatter plot)
- Only one tab active at a time
- Tabs should be styled consistently with dashboard theme
- Sport filter applies to all tabs
- Timeframe filter applies to all tabs

**Files to modify:**
- `index.html` - Add tab UI structure
- Dashboard script - Add tab switching logic

**Test requirements:**
- Integration test for tab switching
- Verify correct chart renders for each tab

---

### 3. Scatter Plot: Distance vs Speed Analysis
**Status:** ⏳ Pending  
**Priority:** High  
**Description:** Create second visualization showing the relationship between activity length (distance) and speed (pace/avg speed).

**Requirements:**

#### Chart Design:
- **X-axis:** Distance (km)
- **Y-axis:** Average Speed (km/h) or Pace (min/km)
- **Points:** Individual activities as dots
- **Colors:** By sport (Run=Red, Bike=Teal, Swim=Cyan)
- **Size:** Optional - bubble size could represent duration
- **Tooltip:** Show activity name, date, distance, speed, duration on hover

#### Functionality:
- Include sport type selector (All, Run, Bike, Swim)
- Respect timeframe filter (12 weeks, 6 months, 1 year, 2 years, all)
- Show activity count in header
- Highlight outliers (unusually fast/slow or long/short activities)
- Optional: Add trend line per sport type

#### Data Requirements:
- Need to calculate speed from distance and moving time
- Handle cases where duration is 0 (avoid div by zero)
- Only include activities with valid distance and duration data

**Calculations needed:**
```javascript
// Average speed (km/h)
avgSpeed = (distance / duration) * 3.6  // if duration in seconds

// Or pace (min/km)
pace = duration / 60 / distance  // minutes per km
```

**Files to modify:**
- `index.html` - Add scatter plot canvas/container
- `dashboard-utils.js` - Add speed calculation functions
- Chart.js integration for scatter plot

**Test requirements:**
- Unit test for speed calculation: `calculateSpeed(distance, duration)`
- Unit test for pace calculation: `calculatePace(distance, duration)`
- Unit test filtering by sport on scatter plot
- Integration test: load CSV → display scatter plot with correct points

---

## Summary

| Feature | Status | Priority | Effort |
|---------|--------|----------|--------|
| Aggregation Toggle (Daily/Weekly/Monthly) | ⏳ Pending | High | Medium |
| Tab System | ⏳ Pending | High | Medium |
| Scatter Plot (Distance vs Speed) | ⏳ Pending | High | Medium-High |

**Total Estimated Effort:** ~2-3 sprints (depends on design refinement)

**Testing Strategy:**
1. Write tests first (TDD approach)
2. Unit tests for new utility functions
3. Integration tests for complete workflows
4. All tests must pass before commits

---

## Implementation Notes

### Order of Implementation:
1. **First:** Add aggregation functions (Daily/Weekly/Monthly) and tests
2. **Second:** Add toggle UI and integrate with existing chart
3. **Third:** Create tab system
4. **Fourth:** Add scatter plot visualization with speed calculations

### Design Consistency:
- Use same color scheme as existing chart (Run=#EF4444, Bike=#14B8A6, Swim=#06B6D4)
- Match button styling (sport filters, timeframe controls)
- Keep dark theme (Tailwind: bg-slate-900, text-slate-100)
- Responsive design (mobile-friendly)

### Performance Considerations:
- Cache calculations for different aggregation levels
- Lazy-load second visualization only when tab is active
- Limit scatter plot to max 1000 points for performance
- Consider pagination or data sampling for very large datasets

---

## Done ✅

- [x] TDD Setup with Jest (77 tests passing)
- [x] CSV parsing and data processing utilities
- [x] Weekly aggregation for training volume
- [x] Weekly training volume bar chart with filters
- [x] Sport category filtering (Run, Bike, Swim)
- [x] Timeframe filtering (12 weeks, 6 months, 1 year, 2 years, all)
- [x] Remove Recent Activities widget
- [x] Dashboard theme and styling

---

## Backlog / Future Ideas

- Heart rate trends over time
- Elevation gain analysis
- Training load distribution (easy vs hard sessions)
- Gear usage tracking (shoe/bike mileage)
- Season/build-up comparison
- Coach view (multiple athletes)
- Data export (CSV, PDF)
