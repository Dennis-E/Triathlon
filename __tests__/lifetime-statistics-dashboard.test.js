const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createLifetimeBaselineActivities } = require('./fixtures/lifetime-statistics');

const dashboardSourcePath = path.join(__dirname, '../src/dashboard-lifetime-statistics.js');

function createClassList() {
  const values = new Set(['hidden']);
  return {
    add(value) { values.add(value); },
    remove(value) { values.delete(value); },
    contains(value) { return values.has(value); }
  };
}

function createDashboardContext(activities, summary) {
  const elements = {
    lifetimeStatisticsCaptureArea: { classList: createClassList(), innerHTML: '' },
    lifetimeStatisticsEmptyState: { classList: createClassList(), textContent: 'Import activities to view lifetime statistics.' }
  };
  const document = {
    getElementById(id) {
      return elements[id] || null;
    }
  };
  const window = {
    lifetimeStatisticsUtils: {
      aggregateLifetimeStatistics: jest.fn(() => summary)
    }
  };
  const context = { window, document, processedActivities: activities };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(dashboardSourcePath, 'utf8'), context, {
    filename: 'src/dashboard-lifetime-statistics.js'
  });
  return { context, elements, window };
}

const coreSummary = {
  workoutCount: 4,
  distance: { value: 55, availableCount: 3, activityCount: 4, status: 'partial' },
  movingTime: { value: 12600, availableCount: 4, activityCount: 4, status: 'complete' },
  elevationGain: { value: null, availableCount: 0, activityCount: 4, status: 'unavailable' },
  activeDayCount: 0,
  longestByDistance: null,
  longestByMovingTime: null,
  equipmentCounts: { shoes: 2, bikes: 1 },
  sportSummaries: [{
    sport: 'Run',
    workoutCount: 2,
    distance: { value: 10, availableCount: 1, activityCount: 2, status: 'partial' },
    movingTime: { value: 3600, availableCount: 2, activityCount: 2, status: 'complete' }
  }]
};

describe('lifetime statistics dashboard', () => {
  it('shows an empty state and hides the capture region when there are no imported activities', () => {
    const { context, elements } = createDashboardContext([], coreSummary);

    context.window.lifetimeStatisticsDashboard.render();

    expect(elements.lifetimeStatisticsEmptyState.classList.contains('hidden')).toBe(false);
    expect(elements.lifetimeStatisticsCaptureArea.classList.contains('hidden')).toBe(true);
  });

  it('renders the core totals and hides the empty state when activities are present', () => {
    const activities = createLifetimeBaselineActivities();
    const { context, elements, window } = createDashboardContext(activities, coreSummary);

    context.window.lifetimeStatisticsDashboard.render();

    expect(window.lifetimeStatisticsUtils.aggregateLifetimeStatistics).toHaveBeenCalledWith(activities);
    expect(elements.lifetimeStatisticsEmptyState.classList.contains('hidden')).toBe(true);
    expect(elements.lifetimeStatisticsCaptureArea.classList.contains('hidden')).toBe(false);
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Total distance');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Moving time');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Workouts');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('By sport');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Run');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('55');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('3h 30m');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('4');
  });

  it('renders lifetime milestones without partial-data notifications', () => {
    const summary = {
      ...coreSummary,
      elevationGain: { value: 300, availableCount: 3, activityCount: 4, status: 'partial' },
      activeDayCount: 3,
      longestByDistance: { name: 'Long ride', date: new Date(2025, 0, 2), value: 40, sport: 'Bike' },
      longestByMovingTime: { name: 'Long ride', date: new Date(2025, 0, 2), value: 7200, sport: 'Bike' }
    };
    const { context, elements } = createDashboardContext(createLifetimeBaselineActivities(), summary);

    context.window.lifetimeStatisticsDashboard.render();

    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Elevation gain');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).not.toContain('Recorded for 3 of 4 activities');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).not.toContain('Some activity values are unavailable');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Active days');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Longest distance');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Longest moving time');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Long ride');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('40 km');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toMatch(/0[,.]3 km/);
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).not.toContain('300 m');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).not.toContain('40.0 km');
  });

  it('renders unavailable milestone labels instead of zero when no source values exist', () => {
    const summary = {
      ...coreSummary,
      elevationGain: { value: null, availableCount: 0, activityCount: 4, status: 'unavailable' },
      activeDayCount: 3,
      longestByDistance: null,
      longestByMovingTime: null
    };
    const { context, elements } = createDashboardContext(createLifetimeBaselineActivities(), summary);

    context.window.lifetimeStatisticsDashboard.render();

    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Elevation gain');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Not available');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Longest distance');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Longest moving time');
  });

  it('renders total shoes and bikes used without displaying equipment labels', () => {
    const summary = {
      ...coreSummary,
      equipmentCounts: { shoes: 4, bikes: 2 }
    };
    const { context, elements } = createDashboardContext(createLifetimeBaselineActivities(), summary);

    context.window.lifetimeStatisticsDashboard.render();

    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Shoes used');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('Bikes used');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('4');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).toContain('2');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).not.toContain('Road bike');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).not.toContain('Other bike');
    expect(elements.lifetimeStatisticsCaptureArea.innerHTML).not.toContain('Bike equipment');
  });
});
