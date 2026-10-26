(function attachMediaUtils(root) {
  const SUPPORTED_MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.mp4']);

  function normalizeMediaPath(value) {
    return String(value || '').trim().replace(/\\/g, '/').replace(/^\.\//, '');
  }

  function getMediaFilename(value) {
    const normalized = normalizeMediaPath(value);
    return normalized.slice(normalized.lastIndexOf('/') + 1);
  }

  function getMediaType(filename) {
    const extension = getMediaFilename(filename).match(/\.[^.]+$/)?.[0].toLowerCase();
    if (!SUPPORTED_MEDIA_EXTENSIONS.has(extension)) return 'unsupported';
    return extension === '.mp4' ? 'video' : 'photo';
  }

  function parseMediaDate(value) {
    if (value instanceof Date && Number.isFinite(value.getTime())) return new Date(value.getTime());
    if (value === null || value === undefined || value === '') return null;
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  function getActivityDate(activityDates, activityId) {
    const value = activityDates instanceof Map
      ? activityDates.get(String(activityId))
      : activityDates && activityDates[String(activityId)];
    return parseMediaDate(value);
  }

  function resolveMediaDate(asset, activityDates = new Map()) {
    const capturedAt = parseMediaDate(asset && asset.capturedAt);
    if (capturedAt) return { date: capturedAt, source: 'media' };

    const activityIds = Array.isArray(asset && asset.activityIds) ? asset.activityIds : [];
    if (activityIds.length === 1) {
      const activityDate = getActivityDate(activityDates, activityIds[0]);
      if (activityDate) return { date: activityDate, source: 'activity-derived' };
    }

    return { date: null, source: null };
  }

  function createReference(activity, sourceToken, status, asset) {
    return {
      activityId: String(activity.id),
      sourceToken,
      candidateKeys: asset ? [asset.key] : [],
      status,
      resolvedAssetKey: status === 'matched' ? asset.key : null,
      reason: status === 'matched' ? null : status
    };
  }

  function reconcileMediaReferences({ activities = [], manifestRows = [], archiveEntries = [] } = {}) {
    const manifestByFilename = new Map();
    manifestRows.forEach((row, index) => {
      const filename = getMediaFilename(row && row.filename);
      if (!filename) return;
      if (!manifestByFilename.has(filename)) manifestByFilename.set(filename, []);
      manifestByFilename.get(filename).push({ ...row, filename, manifestIndex: index });
    });

    const archiveByFilename = new Map();
    archiveEntries.forEach((entry, index) => {
      const filename = getMediaFilename(entry && entry.path);
      if (!filename) return;
      if (!archiveByFilename.has(filename)) archiveByFilename.set(filename, []);
      archiveByFilename.get(filename).push({ ...entry, filename, archiveIndex: index });
    });

    const assets = [];
    const assetByFilename = new Map();
    for (const [filename, entries] of archiveByFilename) {
      const manifestMatches = manifestByFilename.get(filename) || [];
      for (const entry of entries) {
        const mediaType = getMediaType(filename);
        const key = normalizeMediaPath(entry.path) || `archive:${entry.archiveIndex}`;
        let status = 'readable';
        if (mediaType === 'unsupported') status = 'unsupported';
        else if (entry.readable === false) status = 'corrupt';
        else if (manifestMatches.length > 1 || entries.length > 1) status = 'ambiguous';
        else if (manifestMatches.length === 0) status = 'unreferenced';

        const asset = {
          key,
          filename,
          mediaType,
          contentType: mediaType === 'photo' ? 'image' : mediaType === 'video' ? 'video' : null,
          byteLength: Number.isFinite(entry.byteLength) ? entry.byteLength : null,
          caption: manifestMatches.length === 1 ? manifestMatches[0].caption || null : null,
          capturedAt: parseMediaDate(manifestMatches.length === 1 ? manifestMatches[0].capturedAt : null),
          dateSource: null,
          activityIds: [],
          status,
          readContent: entry.readContent || null
        };
        assets.push(asset);
        if (!assetByFilename.has(filename)) assetByFilename.set(filename, []);
        assetByFilename.get(filename).push(asset);
      }
    }

    for (const [filename, rows] of manifestByFilename) {
      if (archiveByFilename.has(filename)) continue;
      assets.push({
        key: `manifest:${rows[0].manifestIndex}`,
        filename,
        mediaType: getMediaType(filename),
        contentType: null,
        byteLength: null,
        caption: rows.length === 1 ? rows[0].caption || null : null,
        capturedAt: parseMediaDate(rows.length === 1 ? rows[0].capturedAt : null),
        dateSource: null,
        activityIds: [],
        status: rows.length > 1 ? 'ambiguous' : 'missing',
        readContent: null
      });
    }

    const references = [];
    for (const activity of activities) {
      const activityId = activity && activity.id;
      if (activityId === null || activityId === undefined) continue;
      const tokens = Array.isArray(activity.mediaReferences) ? activity.mediaReferences : [];
      for (const rawToken of tokens) {
        const sourceToken = String(rawToken || '').trim();
        const filename = getMediaFilename(sourceToken);
        const manifestMatches = manifestByFilename.get(filename) || [];
        const archiveMatches = assetByFilename.get(filename) || [];
        if (manifestMatches.length > 1 || archiveMatches.length > 1) {
          references.push(createReference(activity, sourceToken, 'ambiguous'));
          continue;
        }
        if (manifestMatches.length !== 1 || archiveMatches.length !== 1) {
          references.push(createReference(activity, sourceToken, 'missing'));
          continue;
        }
        const asset = archiveMatches[0];
        if (asset.status !== 'readable') {
          references.push(createReference(activity, sourceToken, 'missing', asset));
          continue;
        }
        asset.activityIds.push(String(activityId));
        references.push(createReference(activity, sourceToken, 'matched', asset));
      }
    }

    const activityDates = new Map(activities
      .filter(activity => activity && activity.id !== null && activity.id !== undefined)
      .map(activity => [String(activity.id), activity.date]));
    const activitiesById = new Map(activities
      .filter(activity => activity && activity.id !== null && activity.id !== undefined)
      .map(activity => [String(activity.id), activity]));
    assets.forEach(asset => {
      const uniqueActivity = asset.activityIds.length === 1 ? activitiesById.get(asset.activityIds[0]) : null;
      asset.sport = uniqueActivity ? uniqueActivity.sport || null : null;
      const resolvedDate = resolveMediaDate(asset, activityDates);
      asset.date = resolvedDate.date;
      asset.dateSource = resolvedDate.source;
    });

    const assetCount = status => assets.filter(asset => asset.status === status).length;
    return {
      assets,
      references,
      counts: {
        manifestRows: manifestRows.length,
        archiveMediaEntries: archiveEntries.filter(entry => getMediaType(entry && entry.path) !== 'unsupported').length,
        references: references.length,
        matchedReferences: references.filter(reference => reference.status === 'matched').length,
        missingReferences: references.filter(reference => reference.status === 'missing').length,
        ambiguousReferences: references.filter(reference => reference.status === 'ambiguous').length,
        readable: assetCount('readable'),
        unsupported: assetCount('unsupported'),
        missing: assetCount('missing') + references.filter(reference => reference.status === 'missing').length,
        corrupt: assetCount('corrupt'),
        ambiguous: assetCount('ambiguous'),
        unreferenced: assetCount('unreferenced')
      },
      hasReadableMedia: assets.some(asset => asset.status === 'readable' || asset.status === 'unreferenced')
    };
  }

  function filterMediaAssets(assets, filters = {}) {
    const records = Array.isArray(assets) ? assets : [];
    return records.filter(asset => {
      const activityIds = Array.isArray(asset.activityIds) ? asset.activityIds.map(String) : [];
      const date = parseMediaDate(asset.date || asset.capturedAt);
      if (filters.year === 'undated' && date) return false;
      if (filters.year !== undefined && filters.year !== null && filters.year !== 'all' && filters.year !== 'undated') {
        if (!date || date.getFullYear() !== Number(filters.year)) return false;
      }
      if (filters.sport && filters.sport !== 'all' && asset.sport !== filters.sport) return false;
      if (filters.activityId === 'unassigned' && activityIds.length > 0) return false;
      if (filters.activityId && filters.activityId !== 'all' && filters.activityId !== 'unassigned' &&
          !activityIds.includes(String(filters.activityId))) return false;
      return true;
    });
  }

  function sortMediaAssetsChronologically(assets) {
    return (Array.isArray(assets) ? assets : [])
      .map((asset, index) => ({ asset, index, date: parseMediaDate(asset.date || asset.capturedAt) }))
      .sort((first, second) => {
        if (first.date && second.date) return second.date.getTime() - first.date.getTime() || first.index - second.index;
        if (first.date) return -1;
        if (second.date) return 1;
        return first.index - second.index;
      })
      .map(entry => entry.asset);
  }

  const mediaUtils = { reconcileMediaReferences, resolveMediaDate, filterMediaAssets, sortMediaAssetsChronologically, getMediaType };
  if (typeof module !== 'undefined' && module.exports) module.exports = mediaUtils;
  if (root) root.mediaUtils = mediaUtils;
})(typeof window !== 'undefined' ? window : null);