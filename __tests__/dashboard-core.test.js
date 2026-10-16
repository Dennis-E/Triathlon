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
