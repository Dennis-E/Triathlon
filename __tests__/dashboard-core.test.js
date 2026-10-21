const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadDashboardCore() {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-core.js'), 'utf8'), sandbox);
  return sandbox;
}

describe('dashboard core visualization readiness', () => {
  it('applies complete distance views with candidate aggregation periods and one render', () => {
    const dashboard = loadDashboardCore();
    dashboard.window = { dashboardTabNavigation: require('../src/tab-navigation') };
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-state.js'), 'utf8'), dashboard);
    dashboard.document = { querySelectorAll: () => [], getElementById: () => null };
    dashboard.renderDashboard = jest.fn();
    const adapter = dashboard.getTotalDistanceKeyboardAdapter();
    expect(adapter.getDomainProvider(adapter.readSnapshot())([{ id: 'aggregation', value: 'yearly' }, { id: 'sport', value: 'All' }]).values).toEqual(['3y', '5y', '10y', 'all']);
    adapter.applySelection([{ id: 'aggregation', value: 'yearly' }, { id: 'sport', value: 'Run' }, { id: 'timeframe', value: '3y' }]);
    expect(adapter.readSnapshot().selection.map(choice => choice.value)).toEqual(['yearly', 'Run', '3y']);
    expect(dashboard.renderDashboard).toHaveBeenCalledTimes(1);
  });

  it('requires a valid date, supported sport, and positive distance for total distance', () => {
    const dashboard = loadDashboardCore();

    expect(dashboard.hasRenderableDistanceData([
      { date: new Date('2025-01-01T00:00:00Z'), sport: 'Run', distance: 5 }
    ])).toBe(true);
    expect(dashboard.hasRenderableDistanceData([
      { date: new Date('2025-01-01T00:00:00Z'), sport: 'Other', distance: 5 },
      { date: new Date('2025-01-01T00:00:00Z'), sport: 'Bike', distance: 0 },
      { sport: 'Swim', distance: 2 }
    ])).toBe(false);
    expect(dashboard.hasRenderableDistanceData([])).toBe(false);
  });
});
