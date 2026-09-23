const {
  extractRelevantColumns,
  parseCsvBasic,
  parseGpsFileIdToActivityId,
  parseGpsFileEntries,
  segmentFitRecordsByActivity,
  extractGpxTrackpoints,
  extractFitTrackpoints,
  normalizeFitRecords,
  buildFitPowerEfforts,
  downsampleTrack,
  simplifyTrackPoints,
  extractGpsTracksFromZip,
  extractFitPowerEffortsFromZip,
  extractGpsAndPowerFromZip
} = require('../src/zip-importer');
const {
  POWER_DURATIONS,
  calculateRollingPowerEfforts
} = require('../src/power-pb-utils');

function makeBikeFitRecords(count = 3601) {
  return Array.from({ length: count }, (_, index) => ({
    timestamp: new Date(index * 1000),
    distance: index * 20,
    power: 220,
    position_lat: 48.1 + index * 0.00001,
    position_long: 11.5 + index * 0.00001
  }));
}

function makeFakeFitDeps(records) {
  return {
    ensureFitParserLoaded: jest.fn().mockResolvedValue(function FakeFitParser() {}),
    parseFitRecords: jest.fn().mockResolvedValue(records),
    gunzipUint8Array: jest.fn(bytes => Promise.resolve(bytes))
  };
}

describe('zip importer relevant column extraction', () => {
  it('keeps Average Watts when present in original ZIP activities.csv headers', () => {
    const csv = [
      ['Activity ID', 'Activity Date', 'Activity Name', 'Activity Type', 'Moving Time', 'Distance', 'Average Heart Rate', 'Average Watts', 'Distance'].join(','),
      ['1', '2026-07-19 14:52:02', 'Bike workout', 'Bike', '3600', '40.00', '145', '232', '40000'].join(',')
    ].join('\n');

    const reducedCsv = extractRelevantColumns(csv);
    const rows = parseCsvBasic(reducedCsv);

    expect(rows[0]).toEqual([
      'Aktivitäts-ID',
      'Aktivitätsdatum',
      'Name der Aktivität',
      'Aktivitätsart',
      'Aktivitätsausrüstung',
      'Bewegungszeit',
      'Distanz',
      'Durchschnittliche Herzfrequenz',
      'Durchschnittliche Wattzahl',
      'Distanz'
    ]);
    expect(rows[1][8]).toBe('232');
  });

  it('keeps power column slot empty when Average Watts/Power is missing', () => {
    const csv = [
      ['Activity ID', 'Activity Date', 'Activity Name', 'Activity Type', 'Moving Time', 'Distance', 'Average Heart Rate', 'Distance'].join(','),
      ['1', '2026-07-19 14:52:02', 'Run', 'Run', '3600', '10.00', '152', '10000'].join(',')
    ].join('\n');

    const reducedCsv = extractRelevantColumns(csv);
    const rows = parseCsvBasic(reducedCsv);

    expect(rows[0][8]).toBe('Durchschnittliche Wattzahl');
    expect(rows[1][8]).toBe('');
  });
});

describe('parseGpsFileIdToActivityId', () => {
  it('maps activities/<id>.gpx and .fit(.gz) filenames to activity IDs', () => {
    const csv = [
      ['Activity ID', 'Filename'].join(','),
      ['111', 'activities/111.gpx'].join(','),
      ['222', 'activities/222.fit.gz'].join(','),
      ['333', 'activities/333.fit'].join(','),
      ['444', ''].join(','),
      ['', 'activities/555.gpx'].join(',')
    ].join('\n');

    const result = parseGpsFileIdToActivityId(csv);

    expect(result.get('activities/111.gpx')).toEqual({ activityId: '111', ext: 'gpx' });
    expect(result.get('activities/222.fit.gz')).toEqual({ activityId: '222', ext: 'fit' });
    expect(result.get('activities/333.fit')).toEqual({ activityId: '333', ext: 'fit' });
    expect(result.size).toBe(3);
  });

  it('returns an empty map when required columns are missing', () => {
    const csv = ['Activity ID,Activity Name', '1,Run'].join('\n');
    expect(parseGpsFileIdToActivityId(csv).size).toBe(0);
  });
});

describe('FIT multisport GPS segmentation', () => {
  it('keeps only records inside each child activity session range', () => {
    const records = [0, 10, 20, 30, 40, 50].map((seconds, index) => ({
      timestamp: new Date(seconds * 1000),
      position_lat: 48 + index,
      position_long: 11 + index
    }));
    const sessions = [
      { activityId: 'swim', startTime: new Date(0), endTime: new Date(20000) },
      { activityId: 'bike', startTime: new Date(30000), endTime: new Date(50000) }
    ];

    expect(segmentFitRecordsByActivity(records, sessions)).toEqual({
      swim: records.slice(0, 3),
      bike: records.slice(3)
    });
  });

  it('retains repeated FIT filename rows as separate activity sessions', () => {
    const csv = [
      'Activity ID,Activity Date,Activity Type,Moving Time,Filename',
      'swim,2026-07-19 14:00:00,Swim,600,activities/tri.fit',
      'bike,2026-07-19 14:10:00,Bike,3600,activities/tri.fit'
    ].join('\n');

    expect(parseGpsFileEntries(csv).get('activities/tri.fit')).toEqual([
      expect.objectContaining({ activityId: 'swim', ext: 'fit' }),
      expect.objectContaining({ activityId: 'bike', ext: 'fit' })
    ]);
  });
});

describe('extractGpxTrackpoints', () => {
  it('extracts lat/lon pairs from trkpt elements', () => {
    const gpx = `<?xml version="1.0"?>
      <gpx><trk><trkseg>
        <trkpt lat="48.1351" lon="11.5820"><ele>520</ele></trkpt>
        <trkpt lat="48.1360" lon="11.5830"></trkpt>
      </trkseg></trk></gpx>`;

    expect(extractGpxTrackpoints(gpx)).toEqual([
      { lat: 48.1351, lon: 11.5820 },
      { lat: 48.1360, lon: 11.5830 }
    ]);
  });

  it('returns an empty array for missing or non-matching input', () => {
    expect(extractGpxTrackpoints('')).toEqual([]);
    expect(extractGpxTrackpoints(null)).toEqual([]);
    expect(extractGpxTrackpoints('<gpx></gpx>')).toEqual([]);
  });
});

describe('extractFitTrackpoints', () => {
  it('extracts lat/lon pairs from FIT records with position fields', () => {
    const records = [
      { position_lat: 48.1, position_long: 11.5, timestamp: new Date() },
      { position_lat: null, position_long: 11.6 },
      { position_lat: 48.2, position_long: 11.7 }
    ];

    expect(extractFitTrackpoints(records)).toEqual([
      { lat: 48.1, lon: 11.5 },
      { lat: 48.2, lon: 11.7 }
    ]);
  });

  it('returns an empty array for non-array input', () => {
    expect(extractFitTrackpoints(null)).toEqual([]);
  });
});

describe('downsampleTrack', () => {
  it('returns the original track when within the limit', () => {
    const points = [{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }];
    expect(downsampleTrack(points, 180)).toBe(points);
  });

  it('reduces long tracks to at most maxPoints, keeping first and last point', () => {
    const points = Array.from({ length: 1000 }, (_, i) => ({ lat: i, lon: i }));
    const sampled = downsampleTrack(points, 100);

    expect(sampled.length).toBe(100);
    expect(sampled[0]).toEqual(points[0]);
    expect(sampled[sampled.length - 1]).toEqual(points[points.length - 1]);
  });

  it('handles empty input', () => {
    expect(downsampleTrack([])).toEqual([]);
    expect(downsampleTrack(null)).toEqual([]);
  });
});

describe('simplifyTrackPoints', () => {
  it('always keeps the first and last point verbatim', () => {
    const points = [
      { lat: 48.00000, lon: 11.0000 },
      { lat: 48.00025, lon: 11.0025 },
      { lat: 48.00050, lon: 11.0050 },
      { lat: 48.00025, lon: 11.0075 },
      { lat: 48.00000, lon: 11.0100 }
    ];
    const simplified = simplifyTrackPoints(points, { toleranceMeters: 3 });
    expect(simplified[0]).toEqual(points[0]);
    expect(simplified[simplified.length - 1]).toEqual(points[points.length - 1]);
  });

  it('drops a point within tolerance of the straight chord between its neighbors', () => {
    // p1 lies exactly on the straight chord p0-p2, and p3 exactly on chord p2-p4, so once
    // the sharp turn at p2 splits the search, both must be dropped (0m deviation).
    const points = [
      { lat: 48.00000, lon: 11.0000 },
      { lat: 48.00025, lon: 11.0025 },
      { lat: 48.00050, lon: 11.0050 },
      { lat: 48.00025, lon: 11.0075 },
      { lat: 48.00000, lon: 11.0100 }
    ];
    const simplified = simplifyTrackPoints(points, { toleranceMeters: 3 });
    expect(simplified).not.toContainEqual(points[1]);
    expect(simplified).not.toContainEqual(points[3]);
  });

  it('retains a point whose deviation from the chord exceeds the tolerance (a sharp turn)', () => {
    // p2 is offset ~55m in latitude from the direct start-to-end chord, far beyond a 3m tolerance.
    const points = [
      { lat: 48.00000, lon: 11.0000 },
      { lat: 48.00025, lon: 11.0025 },
      { lat: 48.00050, lon: 11.0050 },
      { lat: 48.00025, lon: 11.0075 },
      { lat: 48.00000, lon: 11.0100 }
    ];
    const simplified = simplifyTrackPoints(points, { toleranceMeters: 3 });
    expect(simplified).toContainEqual(points[2]);
  });

  it('never invents a point that was not in the input (FR-005)', () => {
    const points = [
      { lat: 48.00000, lon: 11.0000 },
      { lat: 48.00025, lon: 11.0025 },
      { lat: 48.00050, lon: 11.0050 },
      { lat: 48.00025, lon: 11.0075 },
      { lat: 48.00000, lon: 11.0100 }
    ];
    const simplified = simplifyTrackPoints(points, { toleranceMeters: 3 });
    simplified.forEach(point => expect(points).toContainEqual(point));
  });

  it('falls back to bounded reduction when the tolerance-based result still exceeds maxPoints', () => {
    // A jagged zig-zag where every point deviates well beyond tolerance, so RDP alone
    // would keep (nearly) all points; the safety-maximum fallback must still bound the result.
    const points = Array.from({ length: 500 }, (_, i) => ({
      lat: 48.0000 + (i % 2 === 0 ? 0.001 : 0),
      lon: 11.0000 + i * 0.0002
    }));
    const simplified = simplifyTrackPoints(points, { toleranceMeters: 3, maxPoints: 50 });
    expect(simplified.length).toBeLessThanOrEqual(50);
    expect(simplified[0]).toEqual(points[0]);
    expect(simplified[simplified.length - 1]).toEqual(points[points.length - 1]);
  });

  it('returns the input unchanged for two or fewer points', () => {
    const points = [{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }];
    expect(simplifyTrackPoints(points)).toEqual(points);
    expect(simplifyTrackPoints([{ lat: 1, lon: 1 }])).toEqual([{ lat: 1, lon: 1 }]);
  });

  it('handles empty input', () => {
    expect(simplifyTrackPoints([])).toEqual([]);
    expect(simplifyTrackPoints(null)).toEqual([]);
  });
});

describe('extractGpsTracksFromZip', () => {
  function makeZipFile(content) {
    return { dir: false, async: jest.fn().mockResolvedValue(content) };
  }

  it('extracts and simplifies GPX tracks keyed by activity ID', async () => {
    const gpx = `<gpx><trkpt lat="48.1" lon="11.5"></trkpt><trkpt lat="48.2" lon="11.6"></trkpt></gpx>`;
    const zip = { files: { 'activities/111.gpx': makeZipFile(gpx) } };
    const rawCsv = ['Activity ID,Filename', '111,activities/111.gpx'].join('\n');
    const activitySportById = new Map([['111', 'Run']]);

    const result = await extractGpsTracksFromZip(zip, rawCsv, activitySportById);

    expect(result['111']).toEqual({
      sport: 'Run',
      points: [[48.1, 11.5], [48.2, 11.6]]
    });
  });

  it('uses curve-preserving simplification (not fixed-180 stride downsampling) for long tracks', async () => {
    // A winding path: RDP-based simplification should retain the sharp turn's point even
    // though it is not among the first/last 180 evenly-strided points.
    const trkpts = [];
    for (let i = 0; i < 400; i++) {
      trkpts.push(`<trkpt lat="48.0000" lon="${(11.0000 + i * 0.0001).toFixed(6)}"></trkpt>`);
    }
    // Sharp turn point inserted in the middle, ~55m off the straight chord.
    trkpts.splice(200, 0, '<trkpt lat="48.0005" lon="11.0200"></trkpt>');
    const gpx = `<gpx>${trkpts.join('')}</gpx>`;
    const zip = { files: { 'activities/333.gpx': makeZipFile(gpx) } };
    const rawCsv = ['Activity ID,Filename', '333,activities/333.gpx'].join('\n');

    const result = await extractGpsTracksFromZip(zip, rawCsv, new Map());

    expect(result['333'].points).toContainEqual([48.0005, 11.0200]);
    expect(result['333'].points.length).toBeLessThan(401);
  });

  it('skips activities whose GPS file cannot be read without failing the whole import', async () => {
    const zip = {
      files: {
        'activities/111.gpx': { dir: false, async: jest.fn().mockRejectedValue(new Error('corrupt')) },
        'activities/222.gpx': makeZipFile('<gpx><trkpt lat="1" lon="2"></trkpt></gpx>')
      }
    };
    const rawCsv = ['Activity ID,Filename', '111,activities/111.gpx', '222,activities/222.gpx'].join('\n');

    const result = await extractGpsTracksFromZip(zip, rawCsv, new Map());

    expect(result['111']).toBeUndefined();
    expect(result['222']).toEqual({ sport: null, points: [[1, 2]] });
  });

  it('reports progress while processing entries', async () => {
    const zip = { files: { 'activities/111.gpx': makeZipFile('<gpx><trkpt lat="1" lon="2"></trkpt></gpx>') } };
    const rawCsv = ['Activity ID,Filename', '111,activities/111.gpx'].join('\n');
    const onProgress = jest.fn();

    await extractGpsTracksFromZip(zip, rawCsv, new Map(), onProgress);

    expect(onProgress).toHaveBeenCalled();
  });
});

describe('FIT power effort helpers', () => {
  it('creates all eight supported duration efforts from Bike FIT records', () => {
    const rawRecords = Array.from({ length: 3601 }, (_, index) => ({
      timestamp: new Date(index * 1000),
      distance: index * 20,
      power: 220
    }));

    expect(buildFitPowerEfforts(rawRecords).map(effort => effort.targetSeconds)).toEqual([
      5, 30, 60, 120, 300, 600, 1200, 3600
    ]);
  });

  it('normalizes power records and creates a qualifying 5-minute effort', () => {
    const rawRecords = Array.from({ length: 11 }, (_, index) => ({
      timestamp: new Date(index * 30000),
      distance: index * 500,
      power: 220 + index
    }));

    expect(normalizeFitRecords(rawRecords)).toHaveLength(11);
    expect(buildFitPowerEfforts(rawRecords)).toEqual(expect.arrayContaining([
      expect.objectContaining({ targetSeconds: 300, avgPower: 226, startSec: 60, endSec: 300 })
    ]));
  });

  it('does not create duration efforts from invalid power samples alone', () => {
    const rawRecords = Array.from({ length: 11 }, (_, index) => ({
      timestamp: new Date(index * 30000),
      distance: index * 500,
      power: index === 10 ? 0 : null
    }));

    expect(buildFitPowerEfforts(rawRecords)).toEqual([]);
  });

  it('matches the compatible per-duration API in duration order', () => {
    const rawRecords = Array.from({ length: 3601 }, (_, index) => ({
      timestamp: new Date(index * 1000),
      distance: index * 20,
      power: index % 13 === 0 ? null : 200 + (index % 80)
    }));
    const normalized = normalizeFitRecords(rawRecords);
    const expected = POWER_DURATIONS
      .map(duration => calculateRollingPowerEfforts(normalized, duration.seconds)[0])
      .filter(Boolean);

    expect(buildFitPowerEfforts(rawRecords)).toEqual(expected);
  });
});

describe('extractGpsAndPowerFromZip (spec 021 - faster bike power import)', () => {
  function makeZipFile(content) {
    return { dir: false, async: jest.fn().mockResolvedValue(content) };
  }

  it('parses each bike activity FIT file only once for both GPS tracks and power efforts (FR-001/FR-006)', async () => {
    const records = makeBikeFitRecords();
    const fitDeps = makeFakeFitDeps(records);
    const zip = { files: { 'activities/999.fit': makeZipFile(new Uint8Array([1, 2, 3])) } };
    const rawCsv = ['Activity ID,Filename', '999,activities/999.fit'].join('\n');
    const activitySportById = new Map([['999', 'Bike']]);

    const result = await extractGpsAndPowerFromZip(zip, rawCsv, activitySportById, undefined, fitDeps);

    expect(fitDeps.parseFitRecords).toHaveBeenCalledTimes(1);
    expect(result.gpsTracksByActivityId['999'].points.length).toBeGreaterThan(0);
    expect(result.fitBestEffortsByActivityId['999'].powerEfforts.length).toBeGreaterThan(0);
  });

  it('creates independent GPS tracks for child activities sharing one multisport FIT file', async () => {
    const records = [0, 10, 20, 30].map((seconds, index) => ({
      timestamp: new Date(seconds * 1000),
      position_lat: [48, 49.1, 48.2, 51][index],
      position_long: 11 + index,
      distance: index * 20,
      power: 220
    }));
    const fitDeps = makeFakeFitDeps(records);
    const zip = { files: { 'activities/tri.fit': makeZipFile(new Uint8Array([1, 2, 3])) } };
    const rawCsv = [
      'Activity ID,Activity Date,Activity Type,Moving Time,Filename',
      'swim,1970-01-01 00:00:00,Swim,20,activities/tri.fit',
      'run,1970-01-01 00:00:30,Run,10,activities/tri.fit'
    ].join('\n');
    const sports = new Map([['swim', 'Swim'], ['run', 'Run']]);

    const result = await extractGpsAndPowerFromZip(zip, rawCsv, sports, undefined, fitDeps);

    expect(result.gpsTracksByActivityId.swim.points).toEqual([
      [48, 11], [49.1, 12], [48.2, 13]
    ]);
    expect(result.gpsTracksByActivityId.run.points).toEqual([[51, 14]]);
    expect(Object.keys(result.gpsTracksByActivityId)).toHaveLength(2);
    expect(fitDeps.parseFitRecords).toHaveBeenCalledTimes(1);
  });

  it('produces GPS tracks identical to extractGpsTracksFromZip for the same bike FIT input (FR-002/SC-003)', async () => {
    const records = makeBikeFitRecords();
    const zip = { files: { 'activities/999.fit': makeZipFile(new Uint8Array([1, 2, 3])) } };
    const rawCsv = ['Activity ID,Filename', '999,activities/999.fit'].join('\n');
    const activitySportById = new Map([['999', 'Bike']]);

    const combined = await extractGpsAndPowerFromZip(zip, rawCsv, activitySportById, undefined, makeFakeFitDeps(records));
    const separate = await extractGpsTracksFromZip(zip, rawCsv, activitySportById, undefined, makeFakeFitDeps(records));

    expect(combined.gpsTracksByActivityId).toEqual(separate);
  });

  it('produces power efforts identical to extractFitPowerEffortsFromZip for the same bike FIT input (FR-002/SC-003)', async () => {
    const records = makeBikeFitRecords();
    const zip = { files: { 'activities/999.fit': makeZipFile(new Uint8Array([1, 2, 3])) } };
    const rawCsv = ['Activity ID,Filename', '999,activities/999.fit'].join('\n');
    const activitySportById = new Map([['999', 'Bike']]);

    const combined = await extractGpsAndPowerFromZip(zip, rawCsv, activitySportById, undefined, makeFakeFitDeps(records));
    const separate = await extractFitPowerEffortsFromZip(zip, rawCsv, activitySportById, undefined, makeFakeFitDeps(records));

    expect(combined.fitBestEffortsByActivityId).toEqual(separate);
  });

  it('does no FIT parsing when there are no bike activities or no power data (FR-003/FR-005/SC-004)', async () => {
    const fitDeps = makeFakeFitDeps([]);
    const gpx = '<gpx><trkpt lat="48.1" lon="11.5"></trkpt></gpx>';
    const zip = {
      files: {
        'activities/111.gpx': makeZipFile(gpx),
        'activities/222.fit': { dir: false, async: jest.fn().mockRejectedValue(new Error('corrupt')) }
      }
    };
    const rawCsv = ['Activity ID,Filename', '111,activities/111.gpx', '222,activities/222.fit'].join('\n');
    const activitySportById = new Map([['111', 'Run'], ['222', 'Run']]);

    const result = await extractGpsAndPowerFromZip(zip, rawCsv, activitySportById, undefined, fitDeps);

    expect(result.fitBestEffortsByActivityId).toEqual({});
    expect(result.gpsTracksByActivityId['111']).toEqual({ sport: 'Run', points: [[48.1, 11.5]] });
    expect(result.gpsTracksByActivityId['222']).toBeUndefined();
  });

  it('reports monotonically increasing progress that reaches completion (FR-004)', async () => {
    const records = makeBikeFitRecords();
    const fitDeps = makeFakeFitDeps(records);
    const zip = {
      files: {
        'activities/1.fit': makeZipFile(new Uint8Array([1])),
        'activities/2.fit': makeZipFile(new Uint8Array([2])),
        'activities/3.gpx': makeZipFile('<gpx><trkpt lat="1" lon="2"></trkpt></gpx>')
      }
    };
    const rawCsv = [
      'Activity ID,Filename',
      '1,activities/1.fit',
      '2,activities/2.fit',
      '3,activities/3.gpx'
    ].join('\n');
    const activitySportById = new Map([['1', 'Bike'], ['2', 'Bike'], ['3', 'Run']]);
    const progressCalls = [];
    const onProgress = update => progressCalls.push(update.percent);

    await extractGpsAndPowerFromZip(zip, rawCsv, activitySportById, onProgress, fitDeps);

    expect(progressCalls.length).toBe(3);
    for (let i = 1; i < progressCalls.length; i++) {
      expect(progressCalls[i]).toBeGreaterThanOrEqual(progressCalls[i - 1]);
    }
    expect(progressCalls[progressCalls.length - 1]).toBe(90);
  });

  it('handles a large synthetic set of bike activities without introducing a blocking pattern (US3 regression guard)', async () => {
    const records = makeBikeFitRecords(20);
    const fitDeps = makeFakeFitDeps(records);
    const files = {};
    const csvRows = ['Activity ID,Filename'];
    const activitySportById = new Map();
    for (let i = 0; i < 60; i++) {
      files[`activities/${i}.fit`] = makeZipFile(new Uint8Array([i]));
      csvRows.push(`${i},activities/${i}.fit`);
      activitySportById.set(String(i), 'Bike');
    }
    const zip = { files };
    const rawCsv = csvRows.join('\n');
    const progressCalls = [];

    const result = await extractGpsAndPowerFromZip(zip, rawCsv, activitySportById, update => progressCalls.push(update.percent), fitDeps);

    expect(Object.keys(result.gpsTracksByActivityId).length).toBe(60);
    expect(Object.keys(result.fitBestEffortsByActivityId).length).toBe(60);
    expect(progressCalls.length).toBe(60);
  });

  it('reports privacy-safe non-negative phase timings with an injected clock', async () => {
    const records = makeBikeFitRecords(20);
    const clockValues = [0, 5, 5, 8, 8, 12];
    const onTiming = jest.fn();
    const fitDeps = {
      ...makeFakeFitDeps(records),
      now: jest.fn(() => clockValues.shift()),
      onTiming
    };
    const zip = { files: { 'activities/999.fit': makeZipFile(new Uint8Array([1, 2, 3])) } };
    const rawCsv = ['Activity ID,Filename', '999,activities/999.fit'].join('\n');

    await extractGpsAndPowerFromZip(zip, rawCsv, new Map([['999', 'Bike']]), undefined, fitDeps);

    expect(onTiming).toHaveBeenCalledWith({
      activityId: '999',
      sourceType: 'fit',
      recordCount: records.length,
      parseMs: 5,
      gpsMs: 3,
      powerMs: 4
    });
    expect(Object.keys(onTiming.mock.calls[0][0]).sort()).toEqual([
      'activityId', 'gpsMs', 'parseMs', 'powerMs', 'recordCount', 'sourceType'
    ]);
  });

  it('isolates timing callback failures from import results', async () => {
    const records = makeBikeFitRecords(20);
    const fitDeps = {
      ...makeFakeFitDeps(records),
      now: jest.fn(() => 0),
      onTiming: jest.fn(() => { throw new Error('observer failed'); })
    };
    const zip = { files: { 'activities/999.fit': makeZipFile(new Uint8Array([1])) } };
    const rawCsv = ['Activity ID,Filename', '999,activities/999.fit'].join('\n');

    const result = await extractGpsAndPowerFromZip(zip, rawCsv, new Map([['999', 'Bike']]), undefined, fitDeps);

    expect(result.gpsTracksByActivityId['999']).toBeDefined();
    expect(result.fitBestEffortsByActivityId['999']).toBeDefined();
  });

  it('gunzips a compressed FIT once and continues after another FIT fails', async () => {
    const records = makeBikeFitRecords(20);
    const fitDeps = makeFakeFitDeps(records);
    const zip = {
      files: {
        'activities/1.fit': { dir: false, async: jest.fn().mockRejectedValue(new Error('corrupt')) },
        'activities/2.fit.gz': makeZipFile(new Uint8Array([2]))
      }
    };
    const rawCsv = [
      'Activity ID,Filename',
      '1,activities/1.fit',
      '2,activities/2.fit.gz'
    ].join('\n');
    const sports = new Map([['1', 'Bike'], ['2', 'Bike']]);

    const result = await extractGpsAndPowerFromZip(zip, rawCsv, sports, undefined, fitDeps);

    expect(result.gpsTracksByActivityId['1']).toBeUndefined();
    expect(result.gpsTracksByActivityId['2']).toBeDefined();
    expect(result.fitBestEffortsByActivityId['2']).toBeDefined();
    expect(fitDeps.gunzipUint8Array).toHaveBeenCalledTimes(1);
  });
});
