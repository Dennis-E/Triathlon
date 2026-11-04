function escapeMediaGalleryHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function invalidatePreparedMediaExport(session, area) {
  if (!session) return;
  session.exportPreparationVersion = (session.exportPreparationVersion || 0) + 1;
  session.exportData = null;
  session.preparedLease?.release();
  session.preparedLease = null;
  if (area) area.innerHTML = '';
}
const mediaLibraryUtils = typeof window !== 'undefined' ? window.mediaUtils : null;
let mediaGallerySession = null;
let mediaTooltipAdapter = null;
const MEDIA_GALLERY_PAGE_SIZE = 48;

function getMediaTooltipAnchor(key, target, label) {
  const rect = target?.getBoundingClientRect?.();
  return { kind: 'media-item', itemId: String(key), normalizedPoint: {
    x: Number.isFinite(rect?.left) ? (rect.left + (rect.width || 0) / 2) / (window.innerWidth || 800) : 0.5,
    y: Number.isFinite(rect?.top) ? (rect.top + (rect.height || 0) / 2) / (window.innerHeight || 600) : 0.5
  }, visibility: 'visible', associationLabel: label };
}

function registerMediaTooltipAdapter(grid, library) {
  const api = window.dashboardTooltips;
  if (!api?.registerAdapter) return;
  const inspect = (button, pinned) => {
    const asset = library.assets.find(item => item.key === button?.dataset.mediaPinKey);
    if (!asset) return;
    const title = asset.caption || asset.filename || 'Media';
    const dateLabel = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleDateString() : 'Date unavailable';
    const rows = [{ label: 'Filename', value: asset.filename || '' },
      { label: 'Type', value: asset.mediaType === 'video' ? 'Video' : 'Photo' },
      { label: 'Date', value: dateLabel(asset.date || asset.capturedAt) }];
    if (asset.sport) rows.push({ label: 'Sport', value: asset.sport });
    const sections = [{ heading: '', rows }];
    (asset.activityIds || []).forEach(id => {
      const activity = getMediaGalleryActivityOptions(library).find(item => String(item.id) === String(id));
      if (activity) sections.push({ heading: activity.name || String(activity.id), rows: [
        { label: 'Date', value: dateLabel(activity.date) }, { label: 'Sport', value: activity.sport || 'Sport unavailable' }
      ] });
    });
    const notes = [];
    if (!asset.activityIds?.length) notes.push('Unassigned');
    if (asset.status === 'unreferenced') notes.push('Unlisted in media manifest');
    api.show('mediaGallery', { selectionKey: `mediaGallery:${asset.key}`,
      content: { title, itemLabel: title, sections, footerLines: [], notes },
      anchor: getMediaTooltipAnchor(asset.key, button, title) }, pinned, button);
  };
  if (!mediaTooltipAdapter) {
    const adapter = {
      readContext: () => api.readContext('mediaGallery'),
      resolveExportAnchor(selection, captureContext) {
        const target = Array.from(captureContext.element.querySelectorAll?.('[data-export-asset-key]') || []).find(item => item.dataset.exportAssetKey === selection.anchor.itemId);
        return target ? api.resolveCaptureAnchor(selection, captureContext, target)
          : { ...selection.anchor, visibility: 'not-in-export', capturePoint: null, associationLabel: `${selection.content.itemLabel}: not included in this collage` };
      },
      projectAnchor: selection => {
        const target = Array.from(grid.querySelectorAll?.('[data-media-pin-key]') || []).find(button => button.dataset.mediaPinKey === selection.anchor.itemId);
        return target ? getMediaTooltipAnchor(selection.anchor.itemId, target, selection.content.itemLabel) : selection.anchor;
      },
      dispose() {
        grid.onpointerover = grid.onpointerout = grid.onfocusin = grid.onfocusout = null;
        grid.onclick = grid.onchange = null;
        mediaTooltipAdapter = null;
      }
    };
    api.registerAdapter('mediaGallery', adapter);
    mediaTooltipAdapter = adapter;
  }
  grid.onpointerover = grid.onfocusin = event => {
    const button = event.target?.closest?.('[data-media-pin-key]');
    if (button?.dataset.mediaPinKey) inspect(button, false);
  };
  grid.onpointerout = grid.onfocusout = () => api.send?.({ type: 'leave' });
  return inspect;
}

function getMediaGalleryActivityOptions(mediaLibrary) {
  if (Array.isArray(mediaLibrary && mediaLibrary.activityOptions)) return mediaLibrary.activityOptions;
  const ids = new Set();
  (mediaLibrary && mediaLibrary.assets || []).forEach(asset => {
    (asset.activityIds || []).forEach(id => ids.add(String(id)));
  });
  return Array.from(ids, id => ({ id, name: id }));
}

function setMediaGallerySelectOptions(select, choices, value, allLabel) {
  if (!select) return;
  select.innerHTML = `<option value="all">${escapeMediaGalleryHtml(allLabel)}</option>` + choices
    .map(choice => `<option value="${escapeMediaGalleryHtml(choice.value)}">${escapeMediaGalleryHtml(choice.label)}</option>`)
    .join('');
  select.value = value;
}

function renderMediaGallery(mediaLibrary, options = {}) {
  const doc = options.document || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;
  const grid = doc.getElementById('mediaGalleryGrid');
  const status = doc.getElementById('mediaGalleryStatus');
  if (!grid || !status) return;

  const assets = Array.isArray(mediaLibrary && mediaLibrary.assets) ? mediaLibrary.assets : [];
  if (mediaGallerySession && mediaGallerySession.library !== mediaLibrary) {
    window.dashboardTooltips?.invalidate?.();
  }
  const readableAssets = assets.filter(asset => asset.status === 'readable' || asset.status === 'unreferenced');
  if (!readableAssets.length) {
    grid.innerHTML = '';
    status.textContent = 'No readable media was found in this Strava export.';
    return;
  }

  if (!mediaGallerySession || mediaGallerySession.library !== mediaLibrary) {
    invalidatePreparedMediaExport(mediaGallerySession, doc.getElementById('mediaGalleryExportArea'));
    mediaGallerySession = {
      library: mediaLibrary,
      filters: { year: 'all', sport: 'all', activityId: 'all' },
      visibleCount: MEDIA_GALLERY_PAGE_SIZE,
      selectedKeys: new Set(),
      includeRoutes: false
    };
  }
  const session = mediaGallerySession;
  const yearFilter = doc.getElementById('mediaGalleryYearFilter');
  const sportFilter = doc.getElementById('mediaGallerySportFilter');
  const activityFilter = doc.getElementById('mediaGalleryActivityFilter');
  const loadMoreButton = doc.getElementById('mediaGalleryLoadMore');
  const createRecapButton = doc.getElementById('mediaGalleryCreateRecap');
  const createCollageButton = doc.getElementById('mediaGalleryCreateCollage');
  const includeRoutesControl = doc.getElementById('mediaGalleryIncludeRoutes');
  const exportArea = doc.getElementById('mediaGalleryExportArea');

  const years = Array.from(new Set(assets.map(asset => {
    const date = asset.date || asset.capturedAt;
    return date && Number.isFinite(new Date(date).getTime()) ? new Date(date).getFullYear() : null;
  }).filter(year => year !== null))).sort((first, second) => second - first);
  if (assets.some(asset => !asset.date && !asset.capturedAt)) years.push('undated');
  const sports = Array.from(new Set(assets.map(asset => asset.sport).filter(Boolean))).sort();
  const activities = getMediaGalleryActivityOptions(mediaLibrary)
    .slice().sort((first, second) => String(first.name || first.id).localeCompare(String(second.name || second.id)));

  setMediaGallerySelectOptions(yearFilter, years.map(year => ({ value: year, label: year === 'undated' ? 'Undated' : String(year) })), session.filters.year, 'All years');
  setMediaGallerySelectOptions(sportFilter, sports.map(sport => ({ value: sport, label: sport })), session.filters.sport, 'All sports');
  setMediaGallerySelectOptions(activityFilter, [
    { value: 'unassigned', label: 'Unassigned' },
    ...activities.map(activity => ({ value: activity.id, label: activity.name || activity.id }))
  ], session.filters.activityId, 'All activities');

  const renderGrid = () => {
    const filteredAssets = mediaLibraryUtils.filterMediaAssets(assets, session.filters);
    const orderedAssets = mediaLibraryUtils.sortMediaAssetsChronologically(filteredAssets);
    const visibleAssets = orderedAssets.slice(0, session.visibleCount);
    const counts = mediaLibrary.counts || {};
    const reconciliationSummary = Number.isFinite(counts.references)
      ? ` ${counts.matchedReferences || 0} references matched; ${counts.missingReferences || 0} references missing; ${counts.ambiguousReferences || 0} references ambiguous.`
      : '';
    status.textContent = orderedAssets.length
      ? `Showing ${visibleAssets.length} of ${orderedAssets.length} matching media items.${reconciliationSummary}`
      : 'No media match the selected filters.';
    grid.innerHTML = visibleAssets.map(asset => {
    const filename = escapeMediaGalleryHtml(asset.filename);
    const caption = escapeMediaGalleryHtml(asset.caption || filename);
    const unassigned = !Array.isArray(asset.activityIds) || asset.activityIds.length === 0;
    if (asset.status !== 'readable' && asset.status !== 'unreferenced') {
      return `<div class="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400" data-media-status="${escapeMediaGalleryHtml(asset.status)}">${filename}: ${escapeMediaGalleryHtml(asset.status)}</div>`;
    }
    const previewLabel = `Open ${caption}`;
    const previewType = asset.mediaType === 'video' ? 'Video' : 'Photo';
    const selected = session.selectedKeys.has(asset.key) ? ' checked' : '';
    const unlistedBadge = asset.status === 'unreferenced' ? '<span class="block px-3 pb-2 text-xs text-amber-300">Unlisted in media manifest</span>' : '';
    return `<article class="overflow-hidden rounded-lg border border-slate-800 bg-slate-950"><label class="flex items-center gap-2 px-3 pt-3 text-xs text-slate-400"><input type="checkbox" data-media-select-key="${escapeMediaGalleryHtml(asset.key)}" aria-label="Select ${caption}"${selected}>Select</label><button type="button" data-media-pin-key="${escapeMediaGalleryHtml(asset.key)}" data-tooltip-inspector="true" aria-label="Pin details for ${caption}" title="Pin details" class="m-3 inline-flex h-7 w-7 items-center justify-center rounded border border-slate-600 text-slate-200"><i data-lucide="pin" class="h-4 w-4" aria-hidden="true"></i></button><button type="button" data-media-key="${escapeMediaGalleryHtml(asset.key)}" aria-label="${previewLabel}" class="block w-full overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-cyan-400"><img data-media-thumb-key="${escapeMediaGalleryHtml(asset.key)}" alt="${caption}" loading="lazy" class="aspect-square w-full bg-slate-900 object-cover"><span class="block truncate p-3 text-sm text-slate-200">${caption}</span>${unassigned ? '<span class="block px-3 pb-3 text-xs text-slate-400">Unassigned</span>' : ''}${unlistedBadge}</button></article>`;
    }).join('');
    if (session.thumbnailObserver) session.thumbnailObserver.disconnect();
    const thumbnailImages = grid.querySelectorAll ? Array.from(grid.querySelectorAll('[data-media-thumb-key]')) : [];
    const loadThumbnail = image => {
      if (image.dataset.mediaLoaded) return;
      image.dataset.mediaLoaded = 'true';
      const asset = visibleAssets.find(item => item.key === image.dataset.mediaThumbKey);
      if (!asset || typeof mediaLibrary.getObjectUrl !== 'function') return;
      const source = asset.mediaType === 'video'
        ? createVideoPreview(asset, mediaLibrary, doc)
        : mediaLibrary.getObjectUrl(asset);
      Promise.resolve(source).then(url => { if (mediaGallerySession === session) image.src = url; }).catch(() => {
        if (mediaGallerySession !== session) return;
        window.dashboardTooltips?.invalidate?.();
        asset.status = 'corrupt';
        image.alt = 'Media could not be read';
        image.classList.add('hidden');
        status.textContent = 'Some media files could not be read. Other activities remain available.';
      });
    };
    if (typeof IntersectionObserver !== 'undefined') {
      session.thumbnailObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          loadThumbnail(entry.target);
          session.thumbnailObserver.unobserve(entry.target);
        });
      });
      thumbnailImages.forEach(image => session.thumbnailObserver.observe(image));
    } else {
      thumbnailImages.slice(0, 8).forEach(loadThumbnail);
    }
    if (loadMoreButton) {
      loadMoreButton.classList.toggle('hidden', visibleAssets.length >= orderedAssets.length);
      loadMoreButton.onclick = () => {
        session.visibleCount += MEDIA_GALLERY_PAGE_SIZE;
        renderGrid();
      };
    }
    window.lucide?.createIcons?.();
    window.dashboardTooltips?.refreshAnchor?.();
  };

  const updateFilters = () => {
    window.dashboardTooltips?.invalidate?.();
    invalidatePreparedMediaExport(session, exportArea);
    session.filters = {
      year: yearFilter ? yearFilter.value : 'all',
      sport: sportFilter ? sportFilter.value : 'all',
      activityId: activityFilter ? activityFilter.value : 'all'
    };
    session.visibleCount = MEDIA_GALLERY_PAGE_SIZE;
    renderGrid();
  };
  if (yearFilter) yearFilter.onchange = updateFilters;
  if (sportFilter) sportFilter.onchange = updateFilters;
  if (activityFilter) activityFilter.onchange = updateFilters;
  if (includeRoutesControl) includeRoutesControl.onchange = () => {
    window.dashboardTooltips?.invalidate?.();
    invalidatePreparedMediaExport(session, exportArea);
    session.includeRoutes = includeRoutesControl.checked;
  };
  if (createRecapButton) createRecapButton.onclick = () => createMediaExport('annual', { document: doc });
  if (createCollageButton) createCollageButton.onclick = () => createMediaExport('collage', { document: doc });
  renderGrid();
  const inspectMedia = registerMediaTooltipAdapter(grid, mediaLibrary);

  const preview = doc.getElementById('mediaGalleryPreview');
  const previewContent = doc.getElementById('mediaGalleryPreviewContent');
  const closeButton = doc.getElementById('mediaGalleryPreviewClose');
  const closePreview = () => {
    if (preview) preview.classList.add('hidden');
    if (previewContent) previewContent.replaceChildren();
  };
  if (closeButton) closeButton.onclick = closePreview;
  grid.onchange = event => {
    const checkbox = event.target && event.target.closest ? event.target.closest('[data-media-select-key]') : null;
    if (!checkbox) return;
    window.dashboardTooltips?.invalidate?.();
    invalidatePreparedMediaExport(session, exportArea);
    if (checkbox.checked) session.selectedKeys.add(checkbox.dataset.mediaSelectKey);
    else session.selectedKeys.delete(checkbox.dataset.mediaSelectKey);
  };
  grid.onclick = async event => {
    const pinButton = event.target?.closest?.('[data-media-pin-key]');
    if (pinButton?.dataset.mediaPinKey) {
      inspectMedia?.(pinButton, true);
      return;
    }
    const button = event.target && event.target.closest ? event.target.closest('[data-media-key]') : null;
    if (!button || !mediaLibrary || typeof mediaLibrary.getObjectUrl !== 'function' || !previewContent || !preview) return;
    const asset = assets.find(item => item.key === button.dataset.mediaKey);
    if (!asset) return;
    status.textContent = 'Loading media preview...';
    try {
      const source = await mediaLibrary.getObjectUrl(asset);
      if (mediaGallerySession !== session) return;
      const media = doc.createElement(asset.mediaType === 'video' ? 'video' : 'img');
      media.src = source;
      media.className = 'max-h-[85vh] max-w-[90vw] object-contain';
      if (asset.mediaType === 'video') {
        media.controls = true;
        media.preload = 'metadata';
      } else {
        media.alt = asset.caption || 'Imported Strava photo';
      }
      previewContent.replaceChildren(media);
      const activityOptions = getMediaGalleryActivityOptions(mediaLibrary);
      (asset.activityIds || []).forEach(activityId => {
        const activity = activityOptions.find(item => String(item.id) === String(activityId));
        if (!activity) return;
        const details = doc.createElement('p');
        const dateLabel = activity.date && Number.isFinite(new Date(activity.date).getTime())
          ? new Date(activity.date).toLocaleDateString() : 'Date unavailable';
        details.textContent = `${activity.name || activity.id} · ${dateLabel} · ${activity.sport || 'Sport unavailable'}`;
        previewContent.appendChild(details);
        if (activity.hasRoute) {
          const routeButton = doc.createElement('button');
          routeButton.type = 'button';
          routeButton.textContent = 'View route';
          routeButton.setAttribute('aria-label', `View route for ${activity.name || activity.id}`);
          routeButton.onclick = () => {
            if (typeof window !== 'undefined' && typeof window.openDashboardTab === 'function') {
              window.openDashboardTab('heatmap');
            }
          };
          previewContent.appendChild(routeButton);
        }
      });
      preview.classList.remove('hidden');
      status.textContent = 'Media preview opened.';
    } catch (error) {
      if (mediaGallerySession !== session) return;
      window.dashboardTooltips?.invalidate?.();
      asset.status = 'corrupt';
      mediaLibrary.hasReadableMedia = assets.some(item => item.status === 'readable');
      status.textContent = 'This media file could not be read. Other activities remain available.';
      button.disabled = true;
      if (!mediaLibrary.hasReadableMedia && typeof window !== 'undefined' && typeof window.refreshVisualizationTabs === 'function') {
        window.refreshVisualizationTabs();
      }
    }
  };
}

function createMediaRouteSvg(points) {
  const valid = Array.isArray(points) ? points.filter(point => Array.isArray(point) && point.length >= 2 && point.every(Number.isFinite)) : [];
  if (valid.length < 2) return '';
  const lats = valid.map(point => point[0]);
  const lons = valid.map(point => point[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const width = maxLon - minLon || 1;
  const height = maxLat - minLat || 1;
  const routePoints = valid.map(point => {
    const x = 12 + ((point[1] - minLon) / width) * 256;
    const y = 12 + (1 - (point[0] - minLat) / height) * 116;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg viewBox="0 0 280 140" role="img" aria-label="Activity route"><polyline points="${routePoints}" fill="none" stroke="#22d3ee" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

async function createVideoPreview(asset, library, doc) {
  const source = await library.getObjectUrl(asset);
  const video = doc.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.src = source;
  try {
    await new Promise((resolve, reject) => {
      video.addEventListener('loadeddata', resolve, { once: true });
      video.addEventListener('error', reject, { once: true });
      video.load();
    });
    const canvas = doc.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (error) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="#0f172a"/><text x="320" y="190" text-anchor="middle" fill="#e2e8f0" font-size="28">Video preview</text></svg>');
  }
}

async function createMediaExport(kind, options = {}) {
  const doc = options.document || (typeof document !== 'undefined' ? document : null);
  const session = mediaGallerySession;
  const area = doc && doc.getElementById('mediaGalleryExportArea');
  if (!session || !area) return;
  invalidatePreparedMediaExport(session, area);
  const preparationVersion = session.exportPreparationVersion;
  const isCurrent = () => mediaGallerySession === session && session.exportPreparationVersion === preparationVersion;
  const library = session.library;
  const filtered = mediaLibraryUtils.filterMediaAssets(library.assets, session.filters);
  let assets = kind === 'collage' && session.selectedKeys.size
    ? library.assets.filter(asset => session.selectedKeys.has(asset.key))
    : filtered;
  if (kind === 'annual' && (!Number.isInteger(Number(session.filters.year)) || session.filters.year === 'all')) {
    doc.getElementById('mediaGalleryStatus').textContent = 'Choose a year before creating an annual recap.';
    return;
  }
  assets = mediaLibraryUtils.sortMediaAssetsChronologically(assets).filter(asset => asset.status === 'readable');
  const eligibleCount = assets.length;
  assets = assets.slice(0, 12).map(asset => ({ ...asset, activityIds: (asset.activityIds || []).slice() }));
  if (!assets.length) {
    doc.getElementById('mediaGalleryStatus').textContent = 'Select or filter readable media before exporting.';
    return;
  }

  const includeRoutes = session.includeRoutes || !!(doc.getElementById('mediaGalleryIncludeRoutes') || {}).checked;
  const title = kind === 'annual' ? `${session.filters.year} Annual Recap` : 'Training Media Collage';
  const cards = [];
  const items = [];
  const filters = { ...session.filters };
  let sourceLease = null;
  try {
    sourceLease = typeof library.acquireExportSources === 'function' ? library.acquireExportSources(assets.map(asset => asset.key)) : null;
    const isolatedLibrary = sourceLease ? { getObjectUrl: asset => sourceLease.getObjectUrl(asset.key) } : library;
    for (const asset of assets) {
      const src = asset.mediaType === 'video'
        ? await createVideoPreview(asset, isolatedLibrary, doc)
        : await isolatedLibrary.getObjectUrl(asset);
      if (!isCurrent()) return;
      const captions = `<figcaption>${escapeMediaGalleryHtml(asset.caption || asset.filename)}</figcaption>`;
      const routeSvgs = includeRoutes ? (asset.activityIds || []).map(activityId => {
        const track = library.gpsTracksByActivityId && library.gpsTracksByActivityId[String(activityId)];
        return track ? createMediaRouteSvg(track.points) : '';
      }).join('') : '';
      const date = asset.date || asset.capturedAt;
      items.push({ assetKey: asset.key, mediaType: asset.mediaType, src, caption: asset.caption || '',
        date: date && Number.isFinite(new Date(date).getTime()) ? new Date(date).getTime() : null, routeSvgs });
      cards.push(`<figure><img data-export-asset-key="${escapeMediaGalleryHtml(asset.key)}" src="${escapeMediaGalleryHtml(src)}" alt="${escapeMediaGalleryHtml(asset.caption || asset.mediaType)}" style="width:100%;height:200px;object-fit:cover;"/>${captions}${routeSvgs}</figure>`);
    }
    session.preparedLease = sourceLease;
    sourceLease = null;
  } catch (error) {
    if (!isCurrent()) return;
    doc.getElementById('mediaGalleryStatus').textContent = 'A selected media file could not be prepared for export.';
    return;
  } finally {
    sourceLease?.release();
  }
  const dates = items.map(item => item.date).filter(Number.isFinite);
  session.exportData = {
    mediaKind: kind, preparationVersion, title, filters,
    sport: filters.sport === 'all' ? 'All' : filters.sport,
    period: filters.year !== 'all' ? String(filters.year) : dates.length
      ? `${new Date(Math.min(...dates)).getFullYear()}-${new Date(Math.max(...dates)).getFullYear()}` : 'Undated media',
    metricLabel: 'Selected media', includeRoutes, eligibleCount, displayedCount: items.length,
    selectedAssetKeys: items.map(item => item.assetKey), items
  };
  area.innerHTML = `<section data-media-export="true" style="width:960px;background:#020617;color:#f8fafc;font-family:Arial,sans-serif;padding:32px;"><h1 style="font-size:30px;margin:0 0 8px;">${escapeMediaGalleryHtml(title)}</h1><p style="margin:0 0 24px;color:#94a3b8;">${assets.length} selected media items${includeRoutes ? ' · routes included' : ''}</p><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">${cards.join('')}</div></section>`;
  const activityFilter = doc.getElementById('mediaGalleryActivityFilter');
  session.exportContext = [
    { label: 'Year', value: kind === 'annual' ? String(session.filters.year) : '' },
    { label: 'Items', value: String(assets.length) },
    { label: 'Routes', value: includeRoutes ? 'Included' : 'Excluded' },
    { label: 'Activity', value: activityFilter && activityFilter.selectedOptions && activityFilter.selectedOptions[0]
      ? activityFilter.selectedOptions[0].textContent : '' }
  ];
  doc.getElementById('mediaGalleryStatus').textContent = `${title} ready for local preview. Review it before downloading.`;
  if (typeof window !== 'undefined' && typeof window.exportVisualizationTab === 'function') {
    return window.exportVisualizationTab('mediaGallery');
  }
}

function createMediaAnnualRecap() {
  return createMediaExport('annual');
}

function createMediaCollage() {
  return createMediaExport('collage');
}

function getMediaGalleryExportContext() {
  return mediaGallerySession && Array.isArray(mediaGallerySession.exportContext)
    ? mediaGallerySession.exportContext : [];
}

function acquirePreparedMediaExportSources(data) {
  if (!mediaGallerySession || mediaGallerySession.exportData?.preparationVersion !== data?.preparationVersion) throw new Error('Prepared media selection is no longer available');
  const sources = data.items.map(item => ({ key: item.assetKey, src: item.src, ready: item.src.startsWith('data:') }));
  const keys = sources.filter(source => !source.ready).map(source => source.key);
  const lease = keys.length ? mediaGallerySession.library.acquireExportSources(keys) : null;
  return createMediaExportCapture(sources, lease, { allowSubset: true });
}

function createMediaExportPage(data, page, ownerDocument = document) {
  const element = ownerDocument.createElement('div');
  const columns = page.columns || (data.mediaKind === 'annual' ? 1 : 2);
  Object.assign(element.style, { width: `${page.visualization.width}px`, display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: '24px',
    fontFamily: 'system-ui, sans-serif', color: '#f8fafc', background: 'transparent' });
  for (const index of page.itemIndexes) {
    const item = data.items[index];
    if (!item) throw new Error('Media export item is unavailable');
    const figure = ownerDocument.createElement('figure');
    figure.style.margin = '0';
    figure.innerHTML = `<img data-export-asset-key="${escapeMediaGalleryHtml(item.assetKey)}" src="${escapeMediaGalleryHtml(item.src)}" alt="${escapeMediaGalleryHtml(item.mediaType)}" style="display:block;width:100%;height:${page.imageHeight || 240}px;object-fit:contain;"/><figcaption style="font-size:36px;line-height:42px;overflow-wrap:anywhere;">${item.date !== null ? escapeMediaGalleryHtml(new Date(item.date).toLocaleDateString('en-GB')) : ''}${item.caption ? ` ${escapeMediaGalleryHtml(item.caption)}` : ''}</figcaption>${data.includeRoutes ? item.routeSvgs : ''}`;
    element.appendChild(figure);
  }
  let released = false;
  return { element,
    async prepare(sources) {
      if (released) throw new Error('Media export page has been released');
      Object.assign(element.style, { position: 'fixed', left: '-100000px', top: '0' });
      ownerDocument.body.appendChild(element);
      if (sources) await sources.prepare(element);
      await Promise.all(Array.from(element.querySelectorAll('img')).map(image => typeof image.decode === 'function' ? image.decode() : Promise.resolve()));
    },
    release() { if (released) return; released = true; element.remove(); } };
}

function createMediaExportCapture(sources, sourceLease, options = {}) {
  let released = false;
  let releaseRequested = false;
  let activePreparations = 0;
  const dispose = () => {
    if (released || !releaseRequested || activePreparations > 0) return;
    released = true;
    sourceLease?.release();
    sourceLease = null;
    sources.length = 0;
  };
  const release = () => {
    releaseRequested = true;
    dispose();
  };
  return {
    prepare: async clonedTarget => {
      if (released || releaseRequested) throw new Error('Media export capture has been released.');
      activePreparations++;
      try {
        const images = Array.from(clonedTarget.querySelectorAll('img[data-export-asset-key]'));
        if (options.allowSubset && (!images.length || images.some(image => !sources.some(source => source.key === image.dataset.exportAssetKey)))) {
          throw new Error('Media export page contains an unknown or unselected image');
        }
        const selectedSources = options.allowSubset ? sources.filter(source => images.some(image => image.dataset.exportAssetKey === source.key)) : sources;
        const replacements = await Promise.all(selectedSources.map(async source => {
          const matches = images.filter(image => image.dataset.exportAssetKey === source.key);
          if (!matches.length) throw new Error('Media export clone is missing a captured image.');
          const url = source.ready ? source.src : await sourceLease.getObjectUrl(source.key);
          return { images: matches, url };
        }));
        if (released) throw new Error('Media export capture has been released.');
        replacements.forEach(replacement => {
          replacement.images.forEach(image => { image.src = replacement.url; });
        });
      } catch (error) {
        release();
        throw error;
      } finally {
        activePreparations--;
        dispose();
      }
    },
    release
  };
}

function acquireMediaExportCapture(targetEl) {
  const sources = Array.from(targetEl.querySelectorAll('img[data-export-asset-key]'), image => {
    const src = image.getAttribute('src') || image.src || '';
    return { key: image.dataset.exportAssetKey, src, ready: src.startsWith('data:') };
  });
  const assetKeys = Array.from(new Set(sources.filter(source => !source.ready).map(source => source.key)));
  const sourceLease = assetKeys.length
    ? mediaGallerySession.library.acquireExportSources(assetKeys) : null;
  return createMediaExportCapture(sources, sourceLease);
}

function clearMediaGallery() {
  if (typeof window !== 'undefined') window.dashboardTooltips?.invalidate?.();
  mediaTooltipAdapter?.dispose?.();
  if (mediaGallerySession && mediaGallerySession.thumbnailObserver) {
    mediaGallerySession.thumbnailObserver.disconnect();
  }
  invalidatePreparedMediaExport(mediaGallerySession);
  mediaGallerySession = null;
  if (typeof document !== 'undefined') {
    const preview = document.getElementById('mediaGalleryPreview');
    preview?.classList?.add('hidden');
    document.getElementById('mediaGalleryPreviewContent')?.replaceChildren?.();
    const area = document.getElementById('mediaGalleryExportArea');
    if (area) area.innerHTML = '';
  }
}

if (typeof window !== 'undefined') {
  window.mediaGalleryDashboard = {
    render: renderMediaGallery,
    createAnnualRecap: createMediaAnnualRecap,
    createCollage: createMediaCollage,
    getExportData: () => mediaGallerySession?.exportData ? JSON.parse(JSON.stringify(mediaGallerySession.exportData)) : null,
    acquirePreparedExportSources: acquirePreparedMediaExportSources,
    createExportPage: createMediaExportPage,
    setIncludeRoutes: include => {
      if (mediaGallerySession && mediaGallerySession.includeRoutes !== (include === true)) {
        window.dashboardTooltips?.invalidate?.();
        invalidatePreparedMediaExport(mediaGallerySession, document.getElementById('mediaGalleryExportArea'));
        mediaGallerySession.includeRoutes = include === true;
      }
    },
    getExportContext: getMediaGalleryExportContext,
    acquireExportCapture: acquireMediaExportCapture,
    clear: clearMediaGallery
  };
}