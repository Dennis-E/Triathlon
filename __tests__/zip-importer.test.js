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
  extractGpsAndPowerFromZip,
  extractMediaFromZip,
  importTrainingPeaksZips
} = require('../src/zip-importer');
const {
  POWER_DURATIONS,
  calculateRollingPowerEfforts
} = require('../src/power-pb-utils');
const { createMediaZipFixture } = require('./fixtures/strava-media-export');

describe('extractMediaFromZip', () => {
  it('reconciles exact activity references with manifest filenames and archive entries', async () => {
    const fixture = createMediaZipFixture({
      activityRows: [
        { id: 'run-1', sport: 'Run', date: '2025-03-01', media: 'photo-1.jpg' },
        { id: 'run-2', sport: 'Run', date: '2025-03-02', media: '' }
      ],
      mediaRows: [{ filename: 'photo-1.jpg', caption: 'Synthetic caption' }],
      mediaFiles: { 'media/photo-1.jpg': { content: 'synthetic-image' } }
    });

    const result = await extractMediaFromZip(fixture.zip, fixture.activityCsv);

    expect(result.references).toEqual([expect.objectContaining({
      activityId: 'run-1', sourceToken: 'photo-1.jpg', status: 'matched'
    })]);
    expect(result.assets).toEqual([expect.objectContaining({
      filename: 'photo-1.jpg', caption: 'Synthetic caption', status: 'readable'
    })]);
    expect(result.activityOptions.map(activity => activity.id)).toEqual(['run-1']);
    expect(result.hasReadableMedia).toBe(true);
  });

  it('reports missing files and duplicate manifest references without guessing', async () => {
    const fixture = createMediaZipFixture({
      activityRows: [{ id: 'run-1', sport: 'Run', date: '2025-03-01', media: 'missing.jpg;duplicate.jpg' }],
      mediaRows: [
        { filename: 'missing.jpg' },
        { filename: 'duplicate.jpg' },
        { filename: 'duplicate.jpg' }
      ],
      mediaFiles: { 'media/duplicate.jpg': { content: 'synthetic-image' } }
    });

    const result = await extractMediaFromZip(fixture.zip, fixture.activityCsv);

    expect(result.references.map(reference => reference.status)).toEqual(['missing', 'ambiguous']);
    expect(result.assets).toEqual(expect.arrayContaining([
      expect.objectContaining({ filename: 'missing.jpg', status: 'missing' }),
      expect.objectContaining({ filename: 'duplicate.jpg', status: 'ambiguous' })
    ]));
  });

  it('keeps corrupt and unsupported media isolated from readable entries', async () => {
    const fixture = createMediaZipFixture({
      activityRows: [{ id: 'run-1', sport: 'Run', date: '2025-03-01', media: 'good.jpg;broken.jpg;unsupported.gif' }],
      mediaRows: [
        { filename: 'good.jpg' },
        { filename: 'broken.jpg' },
        { filename: 'unsupported.gif' }
      ],
      mediaFiles: {
        'media/good.jpg': { content: 'synthetic-image' },
        'media/broken.jpg': { content: 'corrupt', corrupt: true },
        'media/unsupported.gif': { content: 'unsupported' }
      }
    });

    const result = await extractMediaFromZip(fixture.zip, fixture.activityCsv);
    const broken = result.assets.find(asset => asset.filename === 'broken.jpg');
    const unsupported = result.assets.find(asset => asset.filename === 'unsupported.gif');

    expect(result.hasReadableMedia).toBe(true);
    expect(unsupported.status).toBe('unsupported');
    await expect(broken.readContent()).rejects.toThrow('Synthetic corrupt entry');
    expect(broken.status).toBe('corrupt');
    expect(result.hasReadableMedia).toBe(true);
  });

  it('releases cached URLs and archive readers when the media session ends', async () => {
    const fixture = createMediaZipFixture({
      activityRows: [{ id: 'run-1', sport: 'Run', date: '2025-03-01', media: 'photo.jpg' }],
      mediaRows: [{ filename: 'photo.jpg' }],
      mediaFiles: { 'media/photo.jpg': { content: 'synthetic-image' } }
    });
    const library = await extractMediaFromZip(fixture.zip, fixture.activityCsv);
    const asset = library.assets[0];

    library.release();

    expect(asset.readContent).toBeNull();
    expect(library.hasReadableMedia).toBe(false);
  });

  describe('independent export sources', () => {
    let validUrls;
    let createUrl;
    let revokeUrl;

    beforeEach(() => {
      validUrls = new Set();
      createUrl = jest.spyOn(URL, 'createObjectURL').mockImplementation(() => {
        const url = `blob:export-${createUrl.mock.calls.length}`;
        validUrls.add(url);
        return url;
      });
      revokeUrl = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(url => validUrls.delete(url));
    });

    afterEach(() => jest.restoreAllMocks());

    async function makeLibrary(count = 1) {
      const filenames = Array.from({ length: count }, (_, index) => `photo-${index}.jpg`);
      const fixture = createMediaZipFixture({
        activityRows: [{ id: 'run', sport: 'Run', media: filenames.join(';') }],
        mediaRows: filenames.map(filename => ({ filename })),
        mediaFiles: Object.fromEntries(filenames.map(filename => [`media/${filename}`, { content: filename }]))
      });
      return { fixture, library: await extractMediaFromZip(fixture.zip, fixture.activityCsv) };
    }

    it.each(['release', 'eviction'])('owns sources independently of live %s and replacement B', async mode => {
      const { library } = await makeLibrary(49);
      const asset = library.assets[0];
      const oldUrl = await library.getObjectUrl(asset);
      const lease = library.acquireExportSources([asset.key, asset.key]);
      if (mode === 'eviction') {
        for (const other of library.assets.slice(1)) await library.getObjectUrl(other);
      }
      library.release();
      expect(validUrls.has(oldUrl)).toBe(false);
      expect(library.assets.every(item => item.readContent === null)).toBe(true);
      const { library: replacement } = await makeLibrary();
      const replacementUrl = await replacement.getObjectUrl(replacement.assets[0]);
      const [source, duplicate] = await Promise.all([lease.getObjectUrl(asset.key), lease.getObjectUrl(asset.key)]);
      expect(source).toBe(duplicate);
      expect(source).not.toBe(oldUrl);
      expect(validUrls.has(source)).toBe(true);
      lease.release();
      lease.release();
      expect(revokeUrl.mock.calls.filter(([url]) => url === source)).toHaveLength(1);
      expect(validUrls.has(replacementUrl)).toBe(true);
      expect(revokeUrl).not.toHaveBeenCalledWith(replacementUrl);
      await expect(lease.getObjectUrl(asset.key)).rejects.toThrow(/released/i);
    });

    it('does not create URLs for a reader resolving after cancellation', async () => {
      const { fixture, library } = await makeLibrary();
      let finishRead;
      fixture.zip.files['media/photo-0.jpg'].async = jest.fn(() => new Promise(resolve => { finishRead = resolve; }));
      const lease = library.acquireExportSources([library.assets[0].key]);
      const pending = lease.getObjectUrl(library.assets[0].key);
      const rejected = expect(pending).rejects.toThrow(/released/i);
      library.release();
      lease.release();
      lease.release();
      finishRead(new Uint8Array([1]));
      await rejected;
      expect(createUrl).not.toHaveBeenCalled();
      expect(revokeUrl).not.toHaveBeenCalled();
    });

    it('cleans earlier owned URLs once on reader failure without mutating the released library', async () => {
      const { fixture, library } = await makeLibrary(2);
      fixture.zip.files['media/photo-1.jpg'].async = jest.fn().mockRejectedValue(new Error('export read failed'));
      const keys = library.assets.map(asset => asset.key);
      const lease = library.acquireExportSources(keys);
      library.release();
      const owned = await lease.getObjectUrl(keys[0]);
      await expect(lease.getObjectUrl(keys[1])).rejects.toThrow('export read failed');
      lease.release();
      lease.release();
      expect(validUrls.has(owned)).toBe(false);
      expect(revokeUrl.mock.calls.filter(([url]) => url === owned)).toHaveLength(1);
      expect(library.assets.every(asset => asset.status === 'readable')).toBe(true);
    });
  });
});

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

function makeStandaloneSwim({ german = false, compressed = false, start = '1970-01-01 02:00:00', duration = 120, timestamps = true } = {}) {
  const filename = `activities/swim.fit${compressed ? '.gz' : ''}`;
  const records = [0, 60, 120].map((seconds, index) => ({
    timestamp: timestamps ? new Date(seconds * 1000) : undefined,
    position_lat: [48, 48.002, 48.001][index],
    position_long: 11 + index * 0.002
  }));
  const headers = german
    ? 'Aktivitäts-ID,Aktivitätsdatum,Aktivitätsart,Bewegungszeit,Dateiname'
    : 'Activity ID,Activity Date,Activity Type,Moving Time,Filename';
  return {
    records,
    csv: `${headers}\nswim,${start},${german ? 'Schwimmen' : 'Swim'},${duration},${filename}`,
    zip: { files: { [filename]: { dir: false, async: jest.fn().mockResolvedValue(new Uint8Array([1])) } } },
    sports: new Map([['swim', 'Swim']]),
    deps: makeFakeFitDeps(records)
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
  const timedRecords = [0, 10, 20, 30, 40, 50].map(seconds => ({ timestamp: new Date(seconds * 1000), marker: seconds }));
  const windowFor = (activityId, start, end) => ({ activityId, startTime: new Date(start * 1000), endTime: new Date(end * 1000) });

  it.each([
    ['overlap', [windowFor('swim', 0, 30), windowFor('bike', 20, 50)], { swim: [0, 10], bike: [40, 50] }],
    ['adjacent endpoints', [windowFor('swim', 0, 20), windowFor('bike', 20, 50)], { swim: [0, 10], bike: [30, 40, 50] }],
    ['three disciplines and gaps', [windowFor('swim', 0, 5), windowFor('bike', 20, 25), windowFor('run', 40, 50)], { swim: [0], bike: [20], run: [40, 50] }]
  ])('assigns records to exactly one shared owner for %s', (_name, sessions, expected) => {
    const records = [...timedRecords, { marker: 'missing' }, { timestamp: new Date(NaN), marker: 'invalid' }];
    const result = segmentFitRecordsByActivity(records, sessions);
    for (const [activityId, markers] of Object.entries(expected)) {
      expect(result[activityId]).toEqual(markers.map(marker => timedRecords.find(record => record.marker === marker)));
    }
  });

  it.each([
    ['missing start', { startTime: null }],
    ['missing end', { endTime: null }],
    ['invalid start', { startTime: new Date(NaN) }],
    ['invalid end', { endTime: new Date(NaN) }],
    ['reversed bounds', { endTime: new Date(-1) }],
    ['equal bounds', { endTime: new Date(0) }],
    ['duplicate activity IDs', { activityId: 'bike' }]
  ])('rejects the entire shared interval set with %s', (_name, changes) => {
    const sessions = [{ ...windowFor('swim', 0, 20), ...changes }, windowFor('bike', 30, 50)];
    expect(segmentFitRecordsByActivity(timedRecords, sessions)).toEqual(Object.fromEntries(sessions.map(session => [session.activityId, []])));
  });

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

  it.each([
    ['summary timezone mismatch', {}],
    ['short moving duration', { start: '1970-01-01 00:00:00', duration: 30 }],
    ['missing point timestamps', { start: '1970-01-01 00:00:00', timestamps: false }],
    ['invalid point timestamps', { start: '1970-01-01 00:00:00', invalidTimestamps: true }],
    ['German summary mismatch', { german: true, start: '01.01.1970 02:00:00' }],
    ['compressed FIT mismatch', { compressed: true }]
  ])('retains a standalone Swim route despite %s', async (_name, options) => {
    const input = makeStandaloneSwim(options);
    if (options.invalidTimestamps) input.records.forEach(record => { record.timestamp = new Date(NaN); });

    const result = await extractGpsAndPowerFromZip(input.zip, input.csv, input.sports, undefined, input.deps);

    expect(result.gpsTracksByActivityId.swim).toEqual({
      sport: 'Swim', points: [[48, 11], [48.002, 11.002], [48.001, 11.004]]
    });
    expect(result.fitBestEffortsByActivityId).toEqual({});
    expect(input.deps.parseFitRecords).toHaveBeenCalledTimes(1);
    expect(input.deps.gunzipUint8Array).toHaveBeenCalledTimes(options.compressed ? 1 : 0);
  });

  it('preserves standalone Swim endpoints and the 2000-point cap with full summary fields', async () => {
    const input = makeStandaloneSwim();
    const records = Array.from({ length: 2100 }, (_, index) => ({
      timestamp: new Date(index * 1000),
      position_lat: 48 + (index % 2) * 0.001,
      position_long: 11 + index * 0.0001
    }));
    const result = await extractGpsAndPowerFromZip(input.zip, input.csv, input.sports, undefined, makeFakeFitDeps(records));
    const expected = simplifyTrackPoints(extractFitTrackpoints(records), { toleranceMeters: 3, maxPoints: 2000 });

    expect(result.gpsTracksByActivityId.swim.points).toEqual(expected.map(point => [point.lat, point.lon]));
    expect(result.gpsTracksByActivityId.swim.points).toHaveLength(2000);
  });

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

  it('does not assign an untimed shared FIT file to the first activity', async () => {
    const input = makeStandaloneSwim();
    const csv = 'Activity ID,Filename\nswim,activities/swim.fit\nbike,activities/swim.fit';
    const result = await extractGpsAndPowerFromZip(input.zip, csv, new Map([['swim', 'Swim'], ['bike', 'Bike']]), undefined, input.deps);
    expect(result.gpsTracksByActivityId).toEqual({});
    expect(result.fitBestEffortsByActivityId).toEqual({});
    expect(input.deps.parseFitRecords).toHaveBeenCalledTimes(1);
  });

  it('omits ambiguous shared GPS points rather than leaking them across sports', async () => {
    const input = makeStandaloneSwim();
    const csv = 'Activity ID,Activity Date,Moving Time,Filename\nswim,1970-01-01 00:00:00,90,activities/swim.fit\nbike,1970-01-01 00:00:30,120,activities/swim.fit';
    const result = await extractGpsAndPowerFromZip(input.zip, csv, new Map([['swim', 'Swim'], ['bike', 'Bike']]), undefined, input.deps);
    expect(result.gpsTracksByActivityId).toEqual({
      swim: { sport: 'Swim', points: [[48, 11]] },
      bike: { sport: 'Bike', points: [[48.001, 11.004]] }
    });
  });

  it.each(['Run', 'Bike'])('preserves standalone %s GPS and power despite summary mismatch', async sport => {
    const input = makeStandaloneSwim();
    const records = makeBikeFitRecords(361);
    const result = await extractGpsAndPowerFromZip(input.zip, input.csv, new Map([['swim', sport]]), undefined, makeFakeFitDeps(records));
    const previous = await extractGpsTracksFromZip(input.zip, input.csv, new Map([['swim', sport]]), undefined, makeFakeFitDeps(records));
    expect(result.gpsTracksByActivityId).toEqual(previous);
    expect(result.fitBestEffortsByActivityId).toEqual(sport === 'Bike' ? { swim: { powerEfforts: buildFitPowerEfforts(records) } } : {});
  });

  it('preserves power without GPS and isolates a corrupt Strava neighbor', async () => {
    const input = makeStandaloneSwim();
    const records = makeBikeFitRecords(361).map(({ timestamp, distance, power }) => ({ timestamp, distance, power }));
    input.zip.files['activities/broken.fit'] = { async: jest.fn().mockRejectedValue(new Error('corrupt neighbor')) };
    const result = await extractGpsAndPowerFromZip(input.zip, `${input.csv}\nbroken,1970-01-01 02:00:00,Swim,120,activities/broken.fit`, new Map([['swim', 'Bike'], ['broken', 'Swim']]), undefined, makeFakeFitDeps(records));
    expect(result.gpsTracksByActivityId).toEqual({});
    expect(result.fitBestEffortsByActivityId.swim.powerEfforts).toEqual(buildFitPowerEfforts(records));
  });

  it('retains a valid Swim route when a neighboring Strava FIT fails', async () => {
    const input = makeStandaloneSwim();
    input.zip.files['activities/broken.fit'] = { async: jest.fn().mockRejectedValue(new Error('corrupt neighbor')) };
    const result = await extractGpsAndPowerFromZip(input.zip, `${input.csv}\nbroken,1970-01-01 02:00:00,Swim,120,activities/broken.fit`, input.sports, undefined, input.deps);
    expect(result.gpsTracksByActivityId.swim.points).toHaveLength(3);
    expect(result.gpsTracksByActivityId.broken).toBeUndefined();
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

function makeTrainingPeaksZipEntry(bytes) {
  return { dir: false, async: jest.fn().mockResolvedValue(new Uint8Array(bytes)) };
}

function makeTrainingPeaksFitDeps(archivesByName, dataByMarker) {
  return {
    loadZipArchive: jest.fn(async file => {
      if (!archivesByName[file.name]) throw new Error('unreadable archive');
      return archivesByName[file.name];
    }),
    gunzipUint8Array: jest.fn(async bytes => bytes),
    ensureFitParserLoaded: jest.fn().mockResolvedValue(function FakeFitParser() {}),
    parseFitData: jest.fn(async (_Parser, bytes) => {
      const parsed = dataByMarker[bytes[0]];
      if (!parsed) throw new Error('corrupt FIT data');
      return parsed;
    })
  };
}

function makeFitSession({ start, end, sport, distance, duration, heartRate, cadence, ascent } = {}) {
  return {
    start_time: start ? new Date(start) : undefined,
    timestamp: end ? new Date(end) : undefined,
    sport,
    total_distance: distance,
    total_timer_time: duration,
    avg_heart_rate: heartRate,
    avg_cadence: cadence,
    total_ascent: ascent
  };
}

describe('importTrainingPeaksZips', () => {
  it('retains a drawable standalone TrainingPeaks Swim route', async () => {
    const records = [0, 60, 120].map((seconds, index) => ({
      timestamp: new Date(Date.parse('2026-07-19T10:00:00Z') + seconds * 1000),
      position_lat: [48, 48.002, 48.001][index], position_long: 11 + index * 0.002
    }));
    const deps = makeTrainingPeaksFitDeps({ 'swim.zip': { files: { 'swim.fit.gz': makeTrainingPeaksZipEntry([1]) } } }, {
      1: { records, sessions: [makeFitSession({ start: '2026-07-19T10:00:00Z', end: '2026-07-19T10:02:00Z', duration: 120, distance: 400, sport: 'swimming' })] }
    });
    const result = await importTrainingPeaksZips([{ name: 'swim.zip', size: 1 }], undefined, deps);
    expect(result.activities[0].sport).toBe('Swim');
    expect(result.gpsTracksByActivityId[result.activities[0].id]).toEqual({ sport: 'Swim', points: [[48, 11], [48.002, 11.002], [48.001, 11.004]] });
  });

  it('combines archives chronologically and segments GPS by FIT session sport', async () => {
    const archives = {
      'later.zip': { files: { 'run.fit.gz': makeTrainingPeaksZipEntry([2]) } },
      'earlier.zip': { files: { 'tri.fit.gz': makeTrainingPeaksZipEntry([1]) } }
    };
    const records = [
      { timestamp: new Date('2025-05-01T09:01:00Z'), position_lat: 48.1, position_long: 11.5 },
      { timestamp: new Date('2025-05-01T09:09:00Z'), position_lat: 48.2, position_long: 11.6 },
      { timestamp: new Date('2025-05-01T09:10:30Z'), position_lat: 48.25, position_long: 11.65 },
      { timestamp: new Date('2025-05-01T09:12:00Z'), position_lat: 48.3, position_long: 11.7 }
    ];
    const fitDeps = makeTrainingPeaksFitDeps(archives, {
      1: {
        sessions: [
          makeFitSession({ start: '2025-05-01T09:00:00Z', end: '2025-05-01T09:10:00Z', sport: 'swimming', distance: 400, duration: 600, heartRate: 140 }),
          makeFitSession({ start: '2025-05-01T09:11:00Z', end: '2025-05-01T09:20:00Z', sport: 'cycling', distance: 5000, duration: 540, cadence: 85 })
        ],
        records
      },
      2: { sessions: [makeFitSession({ start: '2026-05-01T09:00:00Z', end: '2026-05-01T10:00:00Z', sport: 'running', distance: 10000, duration: 3600 })], records: [] }
    });
    const progress = [];

    const result = await importTrainingPeaksZips(
      [{ name: 'later.zip', size: 1 }, { name: 'earlier.zip', size: 1 }],
      update => progress.push(update),
      fitDeps
    );

    expect(result.activities.map(activity => activity.sport)).toEqual(['Swim', 'Bike', 'Run']);
    expect(result.activities.map(activity => activity.startTime.toISOString())).toEqual([
      '2025-05-01T09:00:00.000Z', '2025-05-01T09:11:00.000Z', '2026-05-01T09:00:00.000Z'
    ]);
    expect(result.gpsTracksByActivityId[result.activities[0].id].points).toEqual([[48.1, 11.5], [48.2, 11.6]]);
    expect(result.gpsTracksByActivityId[result.activities[1].id].points).toEqual([[48.3, 11.7]]);
    expect(fitDeps.loadZipArchive).toHaveBeenCalledTimes(4);
    expect(progress[progress.length - 1]).toEqual(expect.objectContaining({ percent: 100, processed: 2, total: 2 }));
    expect(JSON.stringify(result.activities)).not.toMatch(/later\.zip|earlier\.zip|tri\.fit|run\.fit/);
  });

  it('deduplicates renamed duplicate workouts while retaining different same-day sessions', async () => {
    const repeated = makeFitSession({ start: '2026-06-10T07:00:00Z', end: '2026-06-10T08:00:00Z', sport: 'running', distance: 10000, duration: 3600 });
    const archives = {
      'period-a.zip': { files: { 'workout-a.fit.gz': makeTrainingPeaksZipEntry([1]), 'second-run.fit.gz': makeTrainingPeaksZipEntry([2]) } },
      'period-b.zip': { files: { 'renamed-copy.fit.gz': makeTrainingPeaksZipEntry([3]) } }
    };
    const fitDeps = makeTrainingPeaksFitDeps(archives, {
      1: { sessions: [repeated], records: [] },
      2: { sessions: [makeFitSession({ start: '2026-06-10T07:00:00Z', end: '2026-06-10T07:30:00Z', sport: 'running', distance: 5000, duration: 1800 })], records: [] },
      3: { sessions: [repeated], records: [] }
    });

    const result = await importTrainingPeaksZips([{ name: 'period-a.zip', size: 1 }, { name: 'period-b.zip', size: 1 }], undefined, fitDeps);

    expect(result.activities).toHaveLength(2);
    expect(result.activities.map(activity => activity.distance).sort((a, b) => a - b)).toEqual([5, 10]);
  });

  it('keeps missing metrics unavailable and counts unknown sports without reclassifying them', async () => {
    const archive = { files: { 'unknown.fit.gz': makeTrainingPeaksZipEntry([1]), 'minimal.fit.gz': makeTrainingPeaksZipEntry([2]) } };
    const fitDeps = makeTrainingPeaksFitDeps({ 'mixed.zip': archive }, {
      1: { sessions: [makeFitSession({ start: '2026-07-01T10:00:00Z', end: '2026-07-01T10:05:00Z', sport: 'transition', distance: 20, duration: 300 })], records: [] },
      2: { sessions: [makeFitSession({ start: '2026-07-02T10:00:00Z', end: '2026-07-02T10:05:00Z', sport: 'running' })], records: [] }
    });

    const result = await importTrainingPeaksZips([{ name: 'mixed.zip', size: 1 }], undefined, fitDeps);

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].sport).toBe('Run');
    expect(result.activities[0]).toEqual(expect.objectContaining({ distance: 0, distanceAvailable: false, duration: 0, durationAvailable: false, avgHeartRate: null }));
    expect(result.skippedUnsupportedSportCount).toBe(1);
  });

  it('rejects the complete multi-ZIP operation with the failing archive and entry named', async () => {
    const archives = {
      'good.zip': { files: { 'good.fit.gz': makeTrainingPeaksZipEntry([1]) } },
      'bad.zip': { files: { 'activities/broken.FIT.gz': makeTrainingPeaksZipEntry([2]) } }
    };
    const fitDeps = makeTrainingPeaksFitDeps(archives, {
      1: { sessions: [makeFitSession({ start: '2026-01-01T10:00:00Z', end: '2026-01-01T11:00:00Z', sport: 'cycling', distance: 1000, duration: 60 })], records: [] }
    });

    await expect(importTrainingPeaksZips([{ name: 'good.zip', size: 1 }, { name: 'bad.zip', size: 1 }], undefined, fitDeps))
      .rejects.toThrow(/bad\.zip.*activities\/broken\.FIT\.gz/);
  });

  it('explains GZIP decompression failures with the archive and entry context', async () => {
    const archives = { 'broken-gzip.zip': { files: { 'activities/broken.FIT.gz': makeTrainingPeaksZipEntry([2]) } } };
    const fitDeps = makeTrainingPeaksFitDeps(archives, {});
    fitDeps.gunzipUint8Array.mockRejectedValue(new Error('stream failed'));

    await expect(importTrainingPeaksZips([{ name: 'broken-gzip.zip', size: 1 }], undefined, fitDeps))
      .rejects.toThrow(/broken-gzip\.zip.*activities\/broken\.FIT\.gz.*decompress GZIP/i);
  });

  it('rejects empty file selections and archives without FIT workout entries', async () => {
    const fitDeps = makeTrainingPeaksFitDeps({ 'empty.zip': { files: { 'notes.txt': makeTrainingPeaksZipEntry([1]) } } }, {});
    await expect(importTrainingPeaksZips([], undefined, fitDeps)).rejects.toThrow(/select/i);
    await expect(importTrainingPeaksZips([{ name: 'empty.zip', size: 1 }], undefined, fitDeps)).rejects.toThrow(/empty\.zip.*FIT/i);
  });

  it('attaches a timestamped GPX.GZ route only when exactly one FIT session matches', async () => {
    const gpx = '<gpx><trk><trkseg><trkpt lat="48.1" lon="11.5"><time>2026-07-01T10:01:00Z</time></trkpt><trkpt lat="48.2" lon="11.6"><time>2026-07-01T10:04:00Z</time></trkpt></trkseg></trk></gpx>';
    const archives = {
      'workout.zip': { files: { 'workout.fit.gz': makeTrainingPeaksZipEntry([1]) } },
      'route.zip': { files: {
        'separate-route.gpx.gz': makeTrainingPeaksZipEntry(new TextEncoder().encode(gpx)),
        'other-workout.fit.gz': makeTrainingPeaksZipEntry([2])
      } }
    };
    const fitDeps = makeTrainingPeaksFitDeps(archives, {
      1: { sessions: [makeFitSession({ start: '2026-07-01T10:00:00Z', end: '2026-07-01T10:05:00Z', sport: 'running', distance: 1000, duration: 300 })], records: [] },
      2: { sessions: [makeFitSession({ start: '2026-08-01T10:00:00Z', end: '2026-08-01T11:00:00Z', sport: 'cycling', distance: 10000, duration: 3600 })], records: [] }
    });

    const result = await importTrainingPeaksZips([{ name: 'workout.zip', size: 1 }, { name: 'route.zip', size: 1 }], undefined, fitDeps);

    expect(result.gpsTracksByActivityId[result.activities[0].id].points).toEqual([[48.1, 11.5], [48.2, 11.6]]);
    expect(result.skippedGpxRouteCount).toBe(0);
  });

  it('calculates bike power efforts from records belonging to each session only', async () => {
    const records = [];
    for (let index = 0; index <= 6; index += 1) {
      records.push({ timestamp: new Date(10000 + index * 1000), distance: index * 10, power: 100 });
      records.push({ timestamp: new Date(30000 + index * 1000), distance: index * 10, power: 300 });
    }
    const archive = { files: { 'multisport.fit.gz': makeTrainingPeaksZipEntry([1]) } };
    const fitDeps = makeTrainingPeaksFitDeps({ 'power.zip': archive }, {
      1: { sessions: [
        makeFitSession({ start: '1970-01-01T00:00:10Z', end: '1970-01-01T00:00:16Z', sport: 'cycling', distance: 60, duration: 6 }),
        makeFitSession({ start: '1970-01-01T00:00:30Z', end: '1970-01-01T00:00:36Z', sport: 'cycling', distance: 60, duration: 6 })
      ], records }
    });

    const result = await importTrainingPeaksZips([{ name: 'power.zip', size: 1 }], undefined, fitDeps);
    const firstEffort = result.fitBestEffortsByActivityId[result.activities[0].id].powerEfforts.find(effort => effort.targetSeconds === 5);
    const secondEffort = result.fitBestEffortsByActivityId[result.activities[1].id].powerEfforts.find(effort => effort.targetSeconds === 5);

    expect(firstEffort.avgPower).toBe(100);
    expect(secondEffort.avgPower).toBe(300);
  });

  it('omits a timestamped GPX route when more than one FIT session matches it', async () => {
    const gpx = '<gpx><trk><trkseg><trkpt lat="48.1" lon="11.5"><time>2026-07-01T10:01:00Z</time></trkpt><trkpt lat="48.2" lon="11.6"><time>2026-07-01T10:04:00Z</time></trkpt></trkseg></trk></gpx>';
    const archives = { 'ambiguous.zip': { files: {
      'workout.fit.gz': makeTrainingPeaksZipEntry([1]),
      'separate-route.gpx.gz': makeTrainingPeaksZipEntry(new TextEncoder().encode(gpx))
    } } };
    const fitDeps = makeTrainingPeaksFitDeps(archives, {
      1: { sessions: [
        makeFitSession({ start: '2026-07-01T10:00:00Z', end: '2026-07-01T10:05:00Z', sport: 'running', distance: 1000, duration: 300 }),
        makeFitSession({ start: '2026-07-01T10:00:00Z', end: '2026-07-01T10:05:00Z', sport: 'cycling', distance: 2000, duration: 300 })
      ], records: [] }
    });

    const result = await importTrainingPeaksZips([{ name: 'ambiguous.zip', size: 2 }], undefined, fitDeps);

    expect(Object.keys(result.gpsTracksByActivityId)).toHaveLength(0);
    expect(result.skippedGpxRouteCount).toBe(1);
    expect(result.activities).toHaveLength(2);
  });
});
