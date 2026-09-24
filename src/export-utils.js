// Pure, DOM-free helpers for the Instagram-ready visualization export feature.
// See specs/007-instagram-export-button for the feature spec/plan/tasks.

const TAB_DISPLAY_TITLES = {
  totalDistance: 'Total distance',
  heartratePace: 'Heartrate vs Pace',
  equipment: 'Equipment mileage',
  equipmentTimeline: 'Equipment Timeline',
  personalBests: 'Personal Bests',
  heatmap: 'GPS Heatmap',
  workoutTime: 'Workout Time'
};

const TAB_FILENAME_SLUGS = {
  totalDistance: 'total-distance',
  heartratePace: 'heart-rate-pace',
  equipment: 'equipment',
  equipmentTimeline: 'equipment-timeline',
  personalBests: 'personal-bests',
  heatmap: 'heatmap',
  workoutTime: 'workout-time'
};

const EXPORT_ASSET_PATHS = {
  logo: 'assets/logo.png',
  strava: 'assets/Strava_Logo.svg',
  instagram: 'assets/Instagram_logo_2016.svg',
  qrCode: 'assets/QR Code webpage.png'
};

const EXPORT_LEGENDS = {
  heartratePace: {
    title: 'Measures',
    items: [
      { label: 'Heart rate', color: '#EF4444' },
      { label: 'Pace', color: '#06B6D4' }
    ]
  }
};

const EXPORT_BRAND_CONFIG = {
  domain: 'https://dennis-e.github.io/Triathlon/'
};

const EXPORT_CONTROL_CONFIG = {
  label: 'Export for Insta / Strava',
  stravaIcon: EXPORT_ASSET_PATHS.strava,
  instagramIcon: EXPORT_ASSET_PATHS.instagram
};

const EXPORT_LAYOUT_CONFIG = {
  footer: false,
  headerIncludesDomain: true,
  headerIncludesQrCode: true,
  pbContentMargin: 24
};

function computeContainFit(sourceWidth, sourceHeight, boxWidth, boxHeight) {
  if (!(sourceWidth > 0) || !(sourceHeight > 0) || !(boxWidth > 0) || !(boxHeight > 0)) {
    return { drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 };
  }

  const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;

  return {
    drawWidth,
    drawHeight,
    offsetX: (boxWidth - drawWidth) / 2,
    offsetY: (boxHeight - drawHeight) / 2
  };
}

// "Contain"/letterbox fit: scales the source to fully fit inside a
// targetSize x targetSize square, centered, without cropping or distortion.
function computeSquareFit(sourceWidth, sourceHeight, targetSize) {
  return computeContainFit(sourceWidth, sourceHeight, targetSize, targetSize);
}

function computeFilterRowLayout({
  widths = [],
  availableWidth = 0,
  rowHeight = 0,
  rowPaddingBottom = 0,
  gap = 0
} = {}) {
  const rows = [];
  const safeWidth = Math.max(0, availableWidth);
  const safeRowHeight = Math.max(0, rowHeight);
  const safePadding = Math.max(0, rowPaddingBottom);
  let rowStart = 0;
  let rowWidth = 0;

  widths.forEach(width => {
    const itemWidth = Math.max(0, width);
    const nextWidth = rowWidth ? rowWidth + gap + itemWidth : itemWidth;
    if (rowWidth && nextWidth > safeWidth) {
      rows.push({ start: rowStart, bottom: rowStart + safeRowHeight + safePadding });
      rowStart += safeRowHeight + safePadding + gap;
      rowWidth = itemWidth;
    } else {
      rowWidth = nextWidth;
    }
  });

  if (widths.length || safeRowHeight || safePadding) {
    rows.push({ start: rowStart, bottom: rowStart + safeRowHeight + safePadding });
  }

  return {
    rows,
    totalHeight: rows.length ? rows[rows.length - 1].bottom : 0
  };
}

function computeExportMetadataLayout({
  startY = 0,
  filterHeight = 0,
  controlsHeight = 0,
  legendHeight = 0,
  footerStart = 0,
  spacing = 0
} = {}) {
  const filters = { y: startY, height: Math.max(0, filterHeight) };
  const controls = {
    y: filters.y + filters.height + spacing,
    height: Math.max(0, controlsHeight)
  };
  const legend = {
    y: controls.y + controls.height + spacing,
    height: Math.max(0, legendHeight)
  };
  const rawBottom = legend.y + legend.height;
  const contentBottom = Math.min(rawBottom, Math.max(startY, footerStart));

  return {
    filters,
    controls,
    legend,
    contentBottom,
    overflow: rawBottom > footerStart
  };
}

// Human-readable title for a tab, reusing the same labels shown on the tab buttons.
function getTabDisplayTitle(tabName) {
  return TAB_DISPLAY_TITLES[tabName] || null;
}

function summarizeFilters(filters) {
  if (!Array.isArray(filters)) return [];

  return filters
    .filter(filter => filter && String(filter.label || '').trim() && String(filter.value || '').trim())
    .map(filter => ({
      label: String(filter.label).trim(),
      value: String(filter.value).trim()
    }));
}

function summarizeAvailableControls(groups) {
  if (!Array.isArray(groups)) return [];

  return groups
    .filter(group => group && String(group.label || '').trim() && Array.isArray(group.controls))
    .map(group => ({
      label: String(group.label).trim(),
      controls: group.controls
        .filter(control => control && control.available !== false && String(control.label || '').trim())
        .map(control => ({
          label: String(control.label).trim(),
          selected: control.selected === true
        }))
    }))
    .filter(group => group.controls.length > 0);
}

function getExportLegend(tabName) {
  const legend = EXPORT_LEGENDS[tabName];
  if (!legend) return null;
  return {
    title: legend.title,
    items: legend.items.map(item => ({ ...item }))
  };
}

function getExportAssetPaths() {
  return { ...EXPORT_ASSET_PATHS };
}

function getExportBrandConfig() {
  return { ...EXPORT_BRAND_CONFIG };
}

function getExportControlConfig() {
  return { ...EXPORT_CONTROL_CONFIG };
}

function getExportLayoutConfig() {
  return { ...EXPORT_LAYOUT_CONFIG };
}

function getExportTargetSlug(targetOrTabName) {
  const kind = typeof targetOrTabName === 'object' && targetOrTabName !== null
    ? targetOrTabName.kind
    : 'tab';
  const key = typeof targetOrTabName === 'object' && targetOrTabName !== null
    ? targetOrTabName.key
    : targetOrTabName;

  if (kind === 'pb-tile') {
    const tileKey = String(key || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return tileKey ? `pb-${tileKey}` : null;
  }

  return TAB_FILENAME_SLUGS[key] || null;
}

function createExportTarget(input) {
  if (!input || (input.kind !== 'tab' && input.kind !== 'pb-tile')) {
    throw new Error('Unsupported export target');
  }
  if (!input.key || (input.kind === 'tab' && !TAB_DISPLAY_TITLES[input.key])) {
    throw new Error('Unsupported export target');
  }
  if (!input.targetElementId) {
    throw new Error('Export target requires a DOM element id');
  }
  if (!input.title || typeof input.hasData !== 'boolean') {
    throw new Error('Export target requires a title and hasData flag');
  }

  return {
    kind: input.kind,
    key: String(input.key),
    title: String(input.title),
    targetElementId: String(input.targetElementId),
    hasData: input.hasData,
    filters: summarizeFilters(input.filters),
    availableControls: summarizeAvailableControls(input.availableControls),
    legend: input.legend || null,
    metricLabel: input.metricLabel ? String(input.metricLabel) : null,
    detailKey: input.detailKey ? String(input.detailKey) : null,
    contentFit: input.contentFit || (input.kind === 'pb-tile' ? 'pb-tight' : 'standard')
  };
}

function pad(value, length) {
  return String(value).padStart(length, '0');
}

// trianalytica-<tab-slug>-<yyyyMMdd-HHmmss>.png
function generateExportFilename(tabName, date) {
  const slug = getExportTargetSlug(tabName);
  if (!slug || !(date instanceof Date) || isNaN(date.getTime())) return null;

  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}`;
  const timePart = `${pad(date.getHours(), 2)}${pad(date.getMinutes(), 2)}${pad(date.getSeconds(), 2)}`;

  return `trianalytica-${slug}-${datePart}-${timePart}.png`;
}

// Pure "has data to export" check: delegates to each tab's own empty-state signal,
// passed in as a flags object (e.g. { heatmap: false } when heatmapEmptyState is visible).
function hasExportableContent(tabName, flags) {
  if (!flags || typeof flags[tabName] !== 'boolean') return false;
  return flags[tabName];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computeSquareFit,
    computeContainFit,
    computeExportMetadataLayout,
    computeFilterRowLayout,
    getTabDisplayTitle,
    generateExportFilename,
    hasExportableContent,
    createExportTarget,
    summarizeFilters,
    summarizeAvailableControls,
    getExportLegend,
    getExportAssetPaths,
    getExportBrandConfig,
    getExportControlConfig,
    getExportLayoutConfig,
    getExportTargetSlug
  };
}

if (typeof window !== 'undefined') {
  window.exportUtils = {
    computeSquareFit,
    computeContainFit,
    computeExportMetadataLayout,
    computeFilterRowLayout,
    getTabDisplayTitle,
    generateExportFilename,
    hasExportableContent,
    createExportTarget,
    summarizeFilters,
    summarizeAvailableControls,
    getExportLegend,
    getExportAssetPaths,
    getExportBrandConfig,
    getExportControlConfig,
    getExportLayoutConfig,
    getExportTargetSlug
  };
}
