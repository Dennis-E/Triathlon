const {
  PIE_MAX_SLICES,
  PIE_OTHER_COLOR,
  computePieSlices,
  getPieSliceColors,
  formatPieMeasureValue
} = require('../src/pie-chart-utils');
const { getFireGradientColor } = require('../src/distribution-utils');

const activity = overrides => ({
  sport: 'Run',
  distance: 10,
  duration: 3000,
  avgWatts: null,
  equipment: '',
  ...overrides
});

const mixedActivities = [
  activity({ sport: 'Run', distance: 10, duration: 3000, equipment: 'Shoe A' }),
  activity({ sport: 'Run', distance: 5, duration: 1500, equipment: 'Shoe A' }),
  activity({ sport: 'Bike', distance: 60, duration: 7200, avgWatts: 200, equipment: 'Road Bike' }),
  activity({ sport: 'Swim', distance: 2, duration: 2400, equipment: '' }),
  activity({ sport: null, distance: 99, duration: 9999 })
];

const sumPercentages = slices => slices.reduce((sum, slice) => sum + slice.percentage, 0);

describe('computePieSlices – dimensions and measures', () => {
  it('groups by sport in Run, Bike, Swim order and ignores unsupported sports', () => {
    const result = computePieSlices(mixedActivities, { dimension: 'sport', measure: 'count' });
    expect(result.slices.map(slice => slice.label)).toEqual(['Run', 'Bike', 'Swim']);
    expect(result.slices.map(slice => slice.value)).toEqual([2, 1, 1]);
    expect(result.total).toBe(4);
    expect(result.activityCount).toBe(4);
    expect(result.excludedCount).toBe(0);
    expect(sumPercentages(result.slices)).toBeCloseTo(100, 6);
  });

  it('sums moving time and distance for the time and distance measures', () => {
    const time = computePieSlices(mixedActivities, { dimension: 'sport', measure: 'time' });
    expect(time.slices.map(slice => slice.value)).toEqual([4500, 7200, 2400]);

    const distance = computePieSlices(mixedActivities, { dimension: 'sport', measure: 'distance' });
    expect(distance.slices.map(slice => slice.value)).toEqual([15, 60, 2]);
    expect(distance.slices[1].percentage).toBeCloseTo((60 / 77) * 100, 6);
  });

  it('lets non-positive time or distance contribute nothing and drops empty groups', () => {
    const activities = [
      activity({ sport: 'Run', distance: 0, duration: 600 }),
      activity({ sport: 'Bike', distance: 20, duration: 0 })
    ];
    const distance = computePieSlices(activities, { dimension: 'sport', measure: 'distance' });
    expect(distance.slices.map(slice => slice.label)).toEqual(['Bike']);
    expect(distance.slices[0].percentage).toBe(100);

    const time = computePieSlices(activities, { dimension: 'sport', measure: 'time' });
    expect(time.slices.map(slice => slice.label)).toEqual(['Run']);
  });

  it('orders numeric ranges ascending and keeps at most the maximum slice count', () => {
    const activities = Array.from({ length: 60 }, (_, index) => activity({ distance: 1 + index }));
    const result = computePieSlices(activities, { dimension: 'length', measure: 'count' });
    expect(result.slices.length).toBeGreaterThan(1);
    expect(result.slices.length).toBeLessThanOrEqual(PIE_MAX_SLICES);
    expect(result.slices.reduce((sum, slice) => sum + slice.value, 0)).toBe(60);
    const starts = result.slices.map(slice => parseFloat(slice.label.replace('> ', '')));
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
    expect(sumPercentages(result.slices)).toBeCloseTo(100, 6);
  });

  it('still yields at most 8 slices for durations spanning more than 7 days', () => {
    const activities = Array.from({ length: 200 }, (_, index) => activity({ duration: 3600 + index * 3600 }));
    const result = computePieSlices(activities, { dimension: 'duration', measure: 'count' });
    expect(result.slices.length).toBeLessThanOrEqual(PIE_MAX_SLICES);
    expect(result.slices.reduce((sum, slice) => sum + slice.value, 0)).toBe(200);
  });

  it('counts activities without power as excluded for the power dimension', () => {
    const result = computePieSlices(mixedActivities, { dimension: 'power', measure: 'count' });
    expect(result.activityCount).toBe(1);
    expect(result.excludedCount).toBe(3);
    expect(result.slices[0].label).toMatch(/W$/);
  });

  it('groups equipment with a No equipment slice, descending by value', () => {
    const result = computePieSlices(mixedActivities, { dimension: 'equipment', measure: 'distance' });
    expect(result.slices.map(slice => slice.label)).toEqual(['Road Bike', 'Shoe A', 'No equipment']);
  });

  it('merges equipment beyond the limit into a final Other slice and breaks ties alphabetically', () => {
    const activities = ['B', 'A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
      .map(name => activity({ equipment: `Gear ${name}` }));
    const result = computePieSlices(activities, { dimension: 'equipment', measure: 'count' });
    expect(result.slices).toHaveLength(PIE_MAX_SLICES);
    expect(result.slices.slice(0, 7).map(slice => slice.label))
      .toEqual(['Gear A', 'Gear B', 'Gear C', 'Gear D', 'Gear E', 'Gear F', 'Gear G']);
    const other = result.slices[7];
    expect(other).toMatchObject({ label: 'Other', isOther: true, value: 3, activityCount: 3, color: PIE_OTHER_COLOR });
  });

  it('returns an empty result for unknown options or invalid input without throwing', () => {
    const empty = { slices: [], total: 0, activityCount: 0, excludedCount: 0 };
    expect(computePieSlices(null, { dimension: 'sport', measure: 'count' })).toEqual(empty);
    expect(computePieSlices(mixedActivities, { dimension: 'mood', measure: 'count' })).toEqual(empty);
    expect(computePieSlices(mixedActivities, { dimension: 'sport', measure: 'calories' })).toEqual(empty);
    expect(computePieSlices([], { dimension: 'sport', measure: 'count' })).toEqual(empty);
  });
});

describe('computePieSlices – sport filter', () => {
  it('only counts activities of the selected sport', () => {
    const result = computePieSlices(mixedActivities, { dimension: 'equipment', measure: 'count', sport: 'Run' });
    expect(result.slices.map(slice => slice.label)).toEqual(['Shoe A']);
    expect(result.activityCount).toBe(2);
  });

  it('shows a single 100% slice for the sport dimension with a single-sport filter', () => {
    const result = computePieSlices(mixedActivities, { dimension: 'sport', measure: 'count', sport: 'Bike' });
    expect(result.slices).toHaveLength(1);
    expect(result.slices[0]).toMatchObject({ label: 'Bike', percentage: 100 });
  });

  it('returns no slices for Swim with Power', () => {
    const result = computePieSlices(mixedActivities, { dimension: 'power', measure: 'count', sport: 'Swim' });
    expect(result.slices).toEqual([]);
    expect(result.excludedCount).toBe(1);
  });

  it('labels pace ranges with sport-appropriate units', () => {
    const runs = [activity({ distance: 10, duration: 3000 }), activity({ distance: 10, duration: 3600 })];
    const swims = [activity({ sport: 'Swim', distance: 1, duration: 1200 }), activity({ sport: 'Swim', distance: 2, duration: 2000 })];
    const bikes = [activity({ sport: 'Bike', distance: 30, duration: 3600 }), activity({ sport: 'Bike', distance: 40, duration: 3600 })];

    computePieSlices(runs, { dimension: 'pace', measure: 'count', sport: 'Run' }).slices
      .forEach(slice => expect(slice.label).toMatch(/min\/km$/));
    computePieSlices(swims, { dimension: 'pace', measure: 'count', sport: 'Swim' }).slices
      .forEach(slice => expect(slice.label).toMatch(/min\/100m$/));
    computePieSlices(bikes, { dimension: 'pace', measure: 'count', sport: 'Bike' }).slices
      .forEach(slice => expect(slice.label).toMatch(/km\/h$/));
    computePieSlices(runs.concat(swims, bikes), { dimension: 'pace', measure: 'count', sport: 'All' }).slices
      .forEach(slice => expect(slice.label).toMatch(/km\/h$/));
  });
});

describe('getPieSliceColors', () => {
  it('returns the requested number of distinct colors for both schemes', () => {
    ['fire', 'monochrome-blue'].forEach(scheme => {
      const colors = getPieSliceColors(8, scheme);
      expect(colors).toHaveLength(8);
      expect(new Set(colors).size).toBe(8);
      colors.forEach(color => expect(color).toMatch(/^#[0-9A-F]{6}$/));
    });
  });

  it('samples the fire gradient and the blue gradient end points', () => {
    expect(getPieSliceColors(3, 'fire')).toEqual([0, 0.5, 1].map(getFireGradientColor));
    expect(getPieSliceColors(3, 'monochrome-blue')).toEqual(['#BFDBFE', '#3B82F6', '#1E3A8A']);
  });

  it('uses the gradient middle for a single slice and nothing for zero', () => {
    expect(getPieSliceColors(1, 'monochrome-blue')).toEqual(['#3B82F6']);
    expect(getPieSliceColors(0, 'fire')).toEqual([]);
  });

  it('keeps slice sizes and order when the colour scheme changes', () => {
    const fire = computePieSlices(mixedActivities, { dimension: 'sport', measure: 'count', colorScheme: 'fire' });
    const blue = computePieSlices(mixedActivities, { dimension: 'sport', measure: 'count', colorScheme: 'monochrome-blue' });
    expect(blue.slices.map(slice => [slice.label, slice.value])).toEqual(fire.slices.map(slice => [slice.label, slice.value]));
    expect(blue.slices.map(slice => slice.color)).not.toEqual(fire.slices.map(slice => slice.color));
  });
});

describe('formatPieMeasureValue', () => {
  it('formats counts, times and distances', () => {
    expect(formatPieMeasureValue('count', 12)).toBe('12 activities');
    expect(formatPieMeasureValue('count', 1)).toBe('1 activity');
    expect(formatPieMeasureValue('time', 2700)).toBe('45m');
    expect(formatPieMeasureValue('time', 19200)).toBe('5h 20m');
    expect(formatPieMeasureValue('distance', 123.4)).toBe('123.4 km');
  });
});

describe('computePieSlices performance', () => {
  it('handles 5,000 activities within 1 second per combination', () => {
    const sports = ['Run', 'Bike', 'Swim'];
    const activities = Array.from({ length: 5000 }, (_, index) => activity({
      sport: sports[index % 3],
      distance: 1 + (index % 100),
      duration: 600 + (index % 500) * 30,
      avgWatts: index % 3 === 1 ? 100 + (index % 200) : null,
      equipment: `Gear ${index % 12}`
    }));

    ['sport', 'duration', 'pace', 'equipment', 'length', 'power'].forEach(dimension => {
      ['count', 'time', 'distance'].forEach(measure => {
        const started = Date.now();
        const result = computePieSlices(activities, { dimension, measure });
        expect(Date.now() - started).toBeLessThan(1000);
        expect(result.slices.length).toBeGreaterThan(0);
        expect(result.slices.length).toBeLessThanOrEqual(PIE_MAX_SLICES);
      });
    });
  });
});
