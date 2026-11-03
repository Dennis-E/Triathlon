function escapeMediaGalleryHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

const mediaLibraryUtils = typeof window !== 'undefined' ? window.mediaUtils : null;
let mediaGallerySession = null;
const MEDIA_GALLERY_PAGE_SIZE = 48;

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
    mediaGallerySession = {
      library: mediaLibrary,
      filters: { year: 'all', sport: 'all' },
      visibleCount: MEDIA_GALLERY_PAGE_SIZE
    };
  }
  const session = mediaGallerySession;
  const yearFilter = doc.getElementById('mediaGalleryYearFilter');
  const sportFilter = doc.getElementById('mediaGallerySportFilter');
  const loadMoreButton = doc.getElementById('mediaGalleryLoadMore');
  const createRecapButton = doc.getElementById('mediaGalleryCreateRecap');
  const createCollageButton = doc.getElementById('mediaGalleryCreateCollage');
  const exportArea = doc.getElementById('mediaGalleryExportArea');

  const years = Array.from(new Set(assets.map(asset => {
    const date = asset.date || asset.capturedAt;
    return date && Number.isFinite(new Date(date).getTime()) ? new Date(date).getFullYear() : null;
  }).filter(year => year !== null))).sort((first, second) => second - first);
  if (assets.some(asset => !asset.date && !asset.capturedAt)) years.push('undated');
  const sports = Array.from(new Set(assets.map(asset => asset.sport).filter(Boolean))).sort();
  setMediaGallerySelectOptions(yearFilter, years.map(year => ({ value: year, label: year === 'undated' ? 'Undated' : String(year) })), session.filters.year, 'All years');
  setMediaGallerySelectOptions(sportFilter, sports.map(sport => ({ value: sport, label: sport })), session.filters.sport, 'All sports');

  const renderGrid = () => {
    const filteredAssets = mediaLibraryUtils.filterMediaAssets(assets, session.filters);
    const orderedAssets = mediaLibraryUtils.sortMediaAssetsChronologically(filteredAssets);
    const visibleAssets = orderedAssets.slice(0, session.visibleCount);
    status.textContent = orderedAssets.length
      ? ''
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
    const unlistedBadge = asset.status === 'unreferenced' ? '<span class="block px-3 pb-2 text-xs text-amber-300">Unlisted in media manifest</span>' : '';
    return `<article class="overflow-hidden rounded-lg border border-slate-800 bg-slate-950"><button type="button" data-media-key="${escapeMediaGalleryHtml(asset.key)}" aria-label="${previewLabel}" class="block w-full overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-cyan-400"><img data-media-thumb-key="${escapeMediaGalleryHtml(asset.key)}" alt="${caption}" loading="lazy" class="aspect-square w-full bg-slate-900 object-cover">${unassigned ? '<span class="block px-3 pb-3 text-xs text-slate-400">Unassigned</span>' : ''}${unlistedBadge}</button></article>`;
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
  };

  const updateFilters = () => {
    window.dashboardTooltips?.invalidate?.();
    session.filters = {
      year: yearFilter ? yearFilter.value : 'all',
      sport: sportFilter ? sportFilter.value : 'all'
    };
    session.visibleCount = MEDIA_GALLERY_PAGE_SIZE;
    renderGrid();
  };
  if (yearFilter) yearFilter.onchange = updateFilters;
  if (sportFilter) sportFilter.onchange = updateFilters;
  if (createRecapButton) createRecapButton.onclick = () => createMediaExport('annual', { document: doc });
  if (createCollageButton) createCollageButton.onclick = () => createMediaExport('collage', { document: doc });
  renderGrid();
  const preview = doc.getElementById('mediaGalleryPreview');
  const previewContent = doc.getElementById('mediaGalleryPreviewContent');
  const closeButton = doc.getElementById('mediaGalleryPreviewClose');
  const closePreview = () => {
    if (preview) preview.classList.add('hidden');
    if (previewContent) previewContent.replaceChildren();
  };
  if (closeButton) closeButton.onclick = closePreview;
  grid.onclick = async event => {
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

  const library = session.library;
  const filtered = mediaLibraryUtils.filterMediaAssets(library.assets, session.filters);
  let assets = filtered;
  if (kind === 'annual' && (!Number.isInteger(Number(session.filters.year)) || session.filters.year === 'all')) {
    doc.getElementById('mediaGalleryStatus').textContent = 'Choose a year before creating an annual recap.';
    return;
  }
  assets = mediaLibraryUtils.sortMediaAssetsChronologically(assets)
    .filter(asset => asset.status === 'readable').slice(0, 12);
  if (!assets.length) {
    doc.getElementById('mediaGalleryStatus').textContent = 'Choose media with readable files before exporting.';
    return;
  }

  const title = kind === 'annual' ? `${session.filters.year} Annual Recap` : 'Training Media Collage';
  const cards = [];
  try {
    for (const asset of assets) {
      const src = asset.mediaType === 'video'
        ? await createVideoPreview(asset, library, doc)
        : await library.getObjectUrl(asset);
      if (mediaGallerySession !== session) return;
      cards.push(`<figure><img data-export-asset-key="${escapeMediaGalleryHtml(asset.key)}" src="${escapeMediaGalleryHtml(src)}" alt="${escapeMediaGalleryHtml(asset.caption || asset.mediaType)}" style="width:100%;height:200px;object-fit:cover;"/></figure>`);
    }
  } catch (error) {
    if (mediaGallerySession !== session) return;
    doc.getElementById('mediaGalleryStatus').textContent = 'A selected media file could not be prepared for export.';
    return;
  }

  area.innerHTML = `<section data-media-export="true" style="width:960px;background:#020617;color:#f8fafc;font-family:Arial,sans-serif;padding:32px;"><h1 style="font-size:30px;margin:0 0 8px;">${escapeMediaGalleryHtml(title)}</h1><p style="margin:0 0 24px;color:#94a3b8;">${assets.length} selected media items</p><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">${cards.join('')}</div></section>`;
  session.exportContext = [
    { label: 'Year', value: kind === 'annual' ? String(session.filters.year) : '' },
    { label: 'Items', value: String(assets.length) }
  ];
  doc.getElementById('mediaGalleryStatus').textContent = '';
  if (typeof window !== 'undefined' && typeof window.exportVisualizationTab === 'function') {
    window.exportVisualizationTab('mediaGallery');
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

function createMediaExportCapture(sources, sourceLease) {
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    sourceLease?.release();
    sourceLease = null;
    sources.length = 0;
  };
  return {
    prepare: async clonedTarget => {
      try {
        if (released) throw new Error('Media export capture has been released.');
        const images = Array.from(clonedTarget.querySelectorAll('img[data-export-asset-key]'));
        const replacements = await Promise.all(sources.map(async source => {
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
  if (mediaGallerySession && mediaGallerySession.thumbnailObserver) {
    mediaGallerySession.thumbnailObserver.disconnect();
  }
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
    getExportContext: getMediaGalleryExportContext,
    acquireExportCapture: acquireMediaExportCapture,
    clear: clearMediaGallery
  };
}