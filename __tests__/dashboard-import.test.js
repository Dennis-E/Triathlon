const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dashboardImportSource = fs.readFileSync(
  path.join(__dirname, '../src/dashboard-import.js'),
  'utf8'
);

function loadRuntimeProcessData() {
  const context = {
    parseGermanDate(value) {
      const match = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})?$/);
      if (!match) return null;
      return new Date(
        Number(match[3]),
        Number(match[2]) - 1,
        Number(match[1]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6] || 0)
      );
    },
    getMonday(date) {
      return new Date(date.getTime());
    },
    window: {
      scatterUtils: {
        parseLocalizedNumber: value => Number(value)
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(`${dashboardImportSource}\nthis.__processData = processData;`, context, {
    filename: 'src/dashboard-import.js'
  });
  return context.__processData;
}

const processRuntimeData = loadRuntimeProcessData();
const headers = ['Activity Date', 'Activity Type', 'Activity Name', 'Moving Time', 'Distance', 'Distance'];

function activityRow(name, duration, km, meters) {
  return ['19.07.2026, 14:52:02', 'Run', name, duration, km, meters];
}

describe('runtime dashboard-import metric availability', () => {
  it('marks positive and zero source values available without changing existing numeric fields', () => {
    const result = processRuntimeData([
      headers,
      activityRow('Positive values', '3600', '10', '10000'),
      activityRow('Recorded zeroes', '0', '0', '0')
    ]);

    expect(result.map(activity => activity.distance)).toEqual([10, 0]);
    expect(result.map(activity => activity.duration)).toEqual([3600, 0]);
    expect(result.map(activity => activity.distanceAvailable)).toEqual([true, true]);
    expect(result.map(activity => activity.durationAvailable)).toEqual([true, true]);
  });

  it('marks missing, invalid, and negative source values unavailable', () => {
    const result = processRuntimeData([
      headers,
      activityRow('Missing', '', '10', ''),
      activityRow('Invalid', 'not-a-number', '10', 'not-a-number'),
      activityRow('Negative', '-60', '10', '-1000')
    ]);

    expect(result.map(activity => activity.distanceAvailable)).toEqual([false, false, false]);
    expect(result.map(activity => activity.durationAvailable)).toEqual([false, false, false]);
    expect(result[0].distance).toBe(0);
    expect(result[0].duration).toBe(0);
    expect(result[2].distance).toBe(-1);
    expect(result[2].duration).toBe(-60);
  });

  it('marks a metric unavailable when its source column is absent', () => {
    const result = processRuntimeData([
      ['Activity Date', 'Activity Type', 'Activity Name'],
      ['19.07.2026, 14:52:02', 'Run', 'No optional metrics']
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].distanceAvailable).toBe(false);
    expect(result[0].durationAvailable).toBe(false);
    expect(result[0].distance).toBe(0);
    expect(result[0].duration).toBe(0);
  });
});
