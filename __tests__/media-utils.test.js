const {
  filterMediaAssets,
  reconcileMediaReferences,
  resolveMediaDate,
  sortMediaAssetsChronologically
} = require('../src/media-utils');
const { createMediaZipFixture } = require('./fixtures/strava-media-export');

describe('Strava media utilities', () => {
  it('builds synthetic CSV and ZIP entries without private export data', async () => {
    const fixture = createMediaZipFixture({
      activityRows: [{ id: 'run-1', sport: 'Run', date: '2025-03-01', media: 'photo-1.jpg' }],
      mediaRows: [{ filename: 'photo-1.jpg', caption: 'Synthetic caption, quoted' }],
      mediaFiles: { 'media/photo-1.jpg': { content: 'synthetic-image' } }
    });

    expect(fixture.activityCsv).toContain('photo-1.jpg');
    expect(fixture.mediaCsv).toContain('"Synthetic caption, quoted"');
    await expect(fixture.zip.files['media/photo-1.jpg'].async('string')).resolves.toBe('synthetic-image');
  });

  it('only matches complete, unique manifest filenames to archive entries', () => {
    const result = reconcileMediaReferences({
      activities: [{ id: 'run-1', date: '2025-03-01', sport: 'Run', mediaReferences: ['photo-1.jpg', 'missing.jpg', 'duplicate.jpg', 'broken.jpg'] }],
      manifestRows: [
        { filename: 'photo-1.jpg', caption: 'Synthetic' },
        { filename: 'duplicate.jpg' },
        { filename: 'duplicate.jpg' },
        { filename: 'broken.jpg' }
      ],
      archiveEntries: [
        { path: 'media/photo-1.jpg', readable: true },
        { path: 'media/duplicate.jpg', readable: true },
        { path: 'media/broken.jpg', readable: false },
        { path: 'media/unreferenced.jpg', readable: true }
      ]
    });

    expect(result.references.map(reference => reference.status)).toEqual([
      'matched', 'missing', 'ambiguous', 'missing'
    ]);
    expect(result.assets.find(asset => asset.filename === 'photo-1.jpg')).toEqual(expect.objectContaining({
      date: new Date('2025-03-01'), dateSource: 'activity-derived', sport: 'Run'
    }));
    expect(result.assets.find(asset => asset.filename === 'broken.jpg').status).toBe('corrupt');
    expect(result.assets.find(asset => asset.filename === 'unreferenced.jpg').status).toBe('unreferenced');
    expect(result.counts.references).toBe(4);
    expect(result.counts.ambiguous).toBe(1);
    expect(result.counts.matchedReferences).toBe(1);
    expect(result.counts.missingReferences).toBe(2);
    expect(result.counts.ambiguousReferences).toBe(1);
    expect(result.counts.unreferenced).toBe(1);
    expect(result.hasReadableMedia).toBe(true);
  });

  it('does not infer matches from partial names or captions', () => {
    const result = reconcileMediaReferences({
      activities: [{ id: 'run-1', mediaReferences: ['photo-1.jpg'] }],
      manifestRows: [{ filename: 'prefix-photo-1.jpg', caption: 'photo-1.jpg' }],
      archiveEntries: [{ path: 'media/prefix-photo-1.jpg', readable: true }]
    });

    expect(result.references[0]).toMatchObject({ status: 'missing', resolvedAssetKey: null });
  });

  it('keeps a readable archive file without a manifest row available but unassigned', () => {
    const result = reconcileMediaReferences({
      activities: [],
      manifestRows: [],
      archiveEntries: [{ path: 'media/unlisted.jpg', readable: true }]
    });

    expect(result.assets[0]).toMatchObject({ filename: 'unlisted.jpg', status: 'unreferenced', activityIds: [] });
    expect(result.hasReadableMedia).toBe(true);
    expect(result.counts.unreferenced).toBe(1);
  });

  it('uses the associated activity date only when capture date is absent', () => {
    const activityDates = new Map([['run-1', new Date('2025-03-01T08:00:00Z')]]);

    expect(resolveMediaDate({ capturedAt: '2024-12-31T23:00:00Z', activityIds: ['run-1'] }, activityDates))
      .toEqual({ date: new Date('2024-12-31T23:00:00Z'), source: 'media' });
    expect(resolveMediaDate({ capturedAt: null, activityIds: ['run-1'] }, activityDates))
      .toEqual({ date: new Date('2025-03-01T08:00:00Z'), source: 'activity-derived' });
    expect(resolveMediaDate({ capturedAt: null, activityIds: [] }, activityDates))
      .toEqual({ date: null, source: null });
  });

  it('filters by year, sport, activity, and unassigned state', () => {
    const assets = [
      { capturedAt: '2025-03-01T08:00:00Z', sport: 'Run', activityIds: ['run-1'] },
      { capturedAt: '2024-06-01T08:00:00Z', sport: 'Bike', activityIds: ['bike-1'] },
      { capturedAt: null, sport: null, activityIds: [] }
    ];

    expect(filterMediaAssets(assets, { year: 2025, sport: 'Run', activityId: 'run-1' })).toEqual([assets[0]]);
    expect(filterMediaAssets(assets, { activityId: 'unassigned' })).toEqual([assets[2]]);
    expect(filterMediaAssets(assets, { year: 'undated' })).toEqual([assets[2]]);
  });

  it('sorts newest first, keeps equal dates stable, and places undated assets last', () => {
    const assets = [
      { key: 'older', date: '2024-06-01T08:00:00Z' },
      { key: 'new-first', date: '2025-03-01T08:00:00Z' },
      { key: 'new-second', date: '2025-03-01T08:00:00Z' },
      { key: 'undated', date: null }
    ];

    expect(sortMediaAssetsChronologically(assets).map(asset => asset.key)).toEqual([
      'new-first', 'new-second', 'older', 'undated'
    ]);
    expect(assets.map(asset => asset.key)).toEqual(['older', 'new-first', 'new-second', 'undated']);
  });
});