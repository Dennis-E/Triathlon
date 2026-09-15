const {
  extractRelevantColumns,
  parseCsvBasic,
  parseGpsFileIdToActivityId,
  extractGpxTrackpoints,
  extractFitTrackpoints,
  downsampleTrack,
  extractGpsTracksFromZip
} = require('../src/zip-importer');

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

describe('extractGpsTracksFromZip', () => {
  function makeZipFile(content) {
    return { dir: false, async: jest.fn().mockResolvedValue(content) };
  }

  it('extracts and downsamples GPX tracks keyed by activity ID', async () => {
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
