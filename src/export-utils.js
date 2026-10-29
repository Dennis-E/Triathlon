// Pure, DOM-free helpers for the Instagram-ready visualization export feature.
// See specs/007-instagram-export-button for the feature spec/plan/tasks.

const TAB_DISPLAY_TITLES = {
  totalDistance: 'Distance',
  paceMetrics: 'Pace vs ...',
  equipment: 'Equipment mileage',
  equipmentTimeline: 'Equipment Timeline',
  personalBests: 'Personal Bests',
  heatmap: 'GPS Heatmap',
  distributions: 'Distributions',
  workoutTime: 'Workout Time',
  trainingCalendar: 'Training Calendar',
  wordcloud: 'Workout Title Wordcloud',
  pieCharts: 'Pie Charts',
  lifetimeStatistics: 'Lifetime Statistics',
  mediaGallery: 'Media Gallery'
};

const TAB_FILENAME_SLUGS = {
  totalDistance: 'distance',
  paceMetrics: 'pace-metrics',
  equipment: 'equipment',
  equipmentTimeline: 'equipment-timeline',
  personalBests: 'personal-bests',
  heatmap: 'heatmap',
  distributions: 'distributions',
  workoutTime: 'workout-time',
  trainingCalendar: 'training-calendar',
  wordcloud: 'wordcloud',
  pieCharts: 'pie-charts',
  lifetimeStatistics: 'lifetime-statistics',
  mediaGallery: 'media-gallery'
};

const EXPORT_ASSET_PATHS = {
  logo: 'assets/logo.png',
  strava: 'assets/Strava_Logo.svg',
  instagram: 'assets/Instagram_logo_2016.svg',
  qrCode: 'assets/QR Code webpage.png'
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

function computeExportContentFit(sourceWidth, sourceHeight, boxWidth, boxHeight) {
  const fit = computeContainFit(sourceWidth, sourceHeight, boxWidth, boxHeight);
  return {
    ...fit,
    widthUtilization: boxWidth > 0 ? fit.drawWidth / boxWidth : 0,
    heightUtilization: boxHeight > 0 ? fit.drawHeight / boxHeight : 0
  };
}

function computeExportContentLayout({
  canvasWidth = 1080,
  canvasHeight = 1080,
  headerHeight = 190,
  marginX = 60,
  topGap = 15,
  bottomMargin = 24,
  contextGap = 12,
  contextHeight = 0,
  annotationHeight = 0
} = {}) {
  const width = Math.max(0, canvasWidth - marginX * 2);
  const contextY = headerHeight + topGap;
  const safeContextHeight = Math.max(0, contextHeight);
  const context = safeContextHeight > 0
    ? { x: marginX, y: contextY, width, height: safeContextHeight }
    : null;
  const visualizationY = context
    ? context.y + context.height + contextGap
    : contextY;
  const availableHeight = Math.max(0, canvasHeight - bottomMargin - visualizationY);
  const safeAnnotationHeight = Math.max(0, annotationHeight);
  if (safeAnnotationHeight > availableHeight) {
    throw new RangeError('Export annotation cannot fit below the visualization and context');
  }

  const layout = {
    context,
    visualization: {
      x: marginX,
      y: visualizationY,
      width,
      height: availableHeight - safeAnnotationHeight
    }
  };
  if (safeAnnotationHeight > 0) {
    layout.annotation = {
      x: marginX,
      y: visualizationY + layout.visualization.height,
      width,
      height: safeAnnotationHeight
    };
  }
  return layout;
}

function computeTooltipAnnotationLayout({
  content,
  maxWidth,
  maxHeight,
  measureText,
  fontSize = 18,
  lineHeight = 24,
  padding = 12,
  associationNote
}) {
  const safeFontSize = Math.max(18, fontSize);
  const safeLineHeight = Math.max(safeFontSize, lineHeight);
  const safePadding = Math.max(0, padding);
  const availableWidth = maxWidth - safePadding * 2;
  const text = value => String(value ?? '').trim();
  const title = text(content.title) || text(content.itemLabel) || 'Selected item';
  const itemLabel = text(content.itemLabel);
  const association = text(associationNote);
  const headline = [title, ...(association ? [association] : [])];
  const full = [
    title,
    ...(itemLabel && itemLabel !== title ? [itemLabel] : []),
    ...(content.sections || []).flatMap(section => [
      text(section.heading),
      ...(section.rows || []).map(row => {
        const label = text(row.label);
        const value = [text(row.value), text(row.unit)].filter(Boolean).join(' ');
        return [label, value].filter(Boolean).join(': ');
      })
    ]),
    ...(content.footerLines || []).map(text),
    ...(content.notes || []).map(text),
    ...(association ? [association] : [])
  ].filter(Boolean);
  const widthOf = value => {
    const measured = measureText(value, safeFontSize);
    const width = typeof measured === 'number' ? measured : measured.width;
    if (!Number.isFinite(width) || width < 0) {
      throw new TypeError('Tooltip annotation measureText must return a finite nonnegative width');
    }
    return width;
  };
  const wrap = entries => {
    const lines = [];
    for (const entry of entries) {
      for (const paragraph of entry.split(/\r\n|\r|\n/)) {
        let line = '';
        for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
          const candidate = line ? `${line} ${word}` : word;
          if (widthOf(candidate) <= availableWidth) {
            line = candidate;
            continue;
          }
          if (line) lines.push(line);
          line = '';
          for (const character of Array.from(word)) {
            if (widthOf(character) > availableWidth) return null;
            if (line && widthOf(line + character) > availableWidth) {
              lines.push(line);
              line = character;
            } else {
              line += character;
            }
          }
        }
        lines.push(line);
        if (lines.length * safeLineHeight + safePadding * 2 > maxHeight) return null;
      }
    }
    return lines;
  };
  for (const [mode, entries] of [['full', full], ['headline', headline]]) {
    const lines = wrap(entries);
    if (lines && availableWidth >= 0) {
      return {
        mode,
        lines,
        width: Math.max(...lines.map(widthOf)) + safePadding * 2,
        height: lines.length * safeLineHeight + safePadding * 2,
        fontSize: safeFontSize,
        lineHeight: safeLineHeight,
        padding: safePadding
      };
    }
  }
  throw new RangeError('Tooltip annotation cannot fit the complete headline and required association');
}

function computeTooltipCalloutLayout({ content, anchor, visualizationRect, bounds, protectedRects = [], measureText }) {
  const finiteRect = rect => rect && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(rect[key])) && rect.width > 0 && rect.height > 0;
  if (!finiteRect(bounds) || !finiteRect(visualizationRect)) throw new RangeError('Tooltip callout cannot fit invalid bounds');
  const visible = anchor?.visibility === 'visible';
  if (!anchor || !['visible', 'outside-view', 'not-in-export'].includes(anchor.visibility)
    || (visible && (!anchor.capturePoint || !['x', 'y'].every(key => Number.isFinite(anchor.capturePoint[key]) && anchor.capturePoint[key] >= 0 && anchor.capturePoint[key] <= 1)))) {
    throw new TypeError('Tooltip callout requires a resolved export anchor');
  }
  const associationNote = visible ? '' : anchor.associationLabel;
  if (!visible && !String(associationNote || '').trim()) throw new TypeError('Tooltip callout requires an anchor association');
  const point = visible ? {
    x: visualizationRect.x + anchor.capturePoint.x * visualizationRect.width,
    y: visualizationRect.y + anchor.capturePoint.y * visualizationRect.height
  } : null;
  const overlaps = (first, second) => first.x < second.x + second.width && first.x + first.width > second.x
    && first.y < second.y + second.height && first.y + first.height > second.y;
  const inside = rect => rect.x >= bounds.x && rect.y >= bounds.y
    && rect.x + rect.width <= bounds.x + bounds.width && rect.y + rect.height <= bounds.y + bounds.height;
  const blocked = protectedRects.filter(finiteRect);
  if (point) blocked.push({ x: point.x - 9, y: point.y - 9, width: 18, height: 18 });
  let candidateChecks = 0;
  for (const mode of ['full', 'headline']) {
    let textLayout;
    try {
      textLayout = computeTooltipAnnotationLayout({
        content: mode === 'full' ? content : { title: String(content.title || '').trim() || content.itemLabel || 'Selected item' },
        maxWidth: Math.min(360, bounds.width), maxHeight: Math.min(280, bounds.height), measureText, associationNote
      });
    } catch (error) {
      if (error instanceof RangeError) continue;
      throw error;
    }
    const width = Math.max(64, textLayout.width);
    const height = textLayout.height;
    if (width > bounds.width || height > bounds.height) continue;
    const clampX = value => Math.max(bounds.x, Math.min(value, bounds.x + bounds.width - width));
    const clampY = value => Math.max(bounds.y, Math.min(value, bounds.y + bounds.height - height));
    const candidates = point ? [
      { side: 'above', x: clampX(point.x - width / 2), y: point.y - 24 - height },
      { side: 'below', x: clampX(point.x - width / 2), y: point.y + 24 },
      { side: 'left', x: point.x - 24 - width, y: clampY(point.y - height / 2) },
      { side: 'right', x: point.x + 24, y: clampY(point.y - height / 2) }
    ] : [
      { side: 'unanchored', x: bounds.x + bounds.width - width, y: bounds.y },
      { side: 'unanchored', x: bounds.x, y: bounds.y },
      { side: 'unanchored', x: bounds.x + bounds.width - width, y: bounds.y + bounds.height - height },
      { side: 'unanchored', x: bounds.x, y: bounds.y + bounds.height - height }
    ];
    const valid = [];
    for (const candidate of candidates) {
      candidateChecks += 1;
      const body = { x: candidate.x, y: candidate.y, width, height };
      if (!inside(body) || blocked.some(rect => overlaps(body, rect))) continue;
      let tail = null;
      let distance = 0;
      if (point) {
        const horizontal = ['above', 'below'].includes(candidate.side);
        const base = horizontal ? {
          x: Math.max(body.x + 20, Math.min(point.x, body.x + width - 20)),
          y: candidate.side === 'above' ? body.y + height : body.y
        } : {
          x: candidate.side === 'left' ? body.x + width : body.x,
          y: Math.max(body.y + 16, Math.min(point.y, body.y + height - 16))
        };
        distance = Math.hypot(base.x - point.x, base.y - point.y);
        if (distance <= 10) continue;
        tail = {
          start: { x: base.x - (horizontal ? 10 : 0), y: base.y - (horizontal ? 0 : 10) },
          end: { x: base.x + (horizontal ? 10 : 0), y: base.y + (horizontal ? 0 : 10) },
          tip: { x: point.x + (base.x - point.x) * 10 / distance, y: point.y + (base.y - point.y) * 10 / distance }
        };
        const tailBounds = {
          x: Math.min(tail.start.x, tail.end.x, tail.tip.x), y: Math.min(tail.start.y, tail.end.y, tail.tip.y),
          width: Math.max(tail.start.x, tail.end.x, tail.tip.x) - Math.min(tail.start.x, tail.end.x, tail.tip.x),
          height: Math.max(tail.start.y, tail.end.y, tail.tip.y) - Math.min(tail.start.y, tail.end.y, tail.tip.y)
        };
        if (!inside(tailBounds) || blocked.some(rect => overlaps(tailBounds, rect))) continue;
      }
      valid.push({ body, tail, side: candidate.side, distance });
    }
    if (valid.length) {
      valid.sort((first, second) => first.distance - second.distance);
      const best = valid[0];
      return { ...textLayout, mode: mode === 'headline' ? 'headline' : textLayout.mode, body: best.body, tail: best.tail, side: best.side, candidateChecks };
    }
    if (textLayout.mode === 'headline') break;
  }
  throw new RangeError('Tooltip callout cannot fit the complete headline and required association');
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
  return null;
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

function copyExportMetadata(value) {
  if (Array.isArray(value)) return value.map(copyExportMetadata);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, copyExportMetadata(entry)]));
  }
  return value;
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
    legend: input.legend ? copyExportMetadata(input.legend) : null,
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

function getExportPngDimensions(bytes) {
  const invalid = () => { throw new Error('Could not prepare a valid PNG image. Please export again.'); };
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!bytes || bytes.length < 45 || !signature.every((value, index) => bytes[index] === value)) invalid();
  const readLength = offset => bytes[offset] * 16777216 + bytes[offset + 1] * 65536 + bytes[offset + 2] * 256 + bytes[offset + 3];
  if (readLength(8) !== 13 || String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') invalid();
  const width = readLength(16);
  const height = readLength(20);
  if (!(width > 0 && width <= 2147483647 && height > 0 && height <= 2147483647)) invalid();
  let offset = 8;
  let hasImageData = false;
  while (offset + 12 <= bytes.length) {
    const length = readLength(offset);
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (offset + length + 12 > bytes.length) invalid();
    if (type === 'IDAT') hasImageData = hasImageData || length > 0;
    offset += length + 12;
    if (type === 'IEND') {
      if (length !== 0 || offset !== bytes.length || !hasImageData) invalid();
      return { width, height };
    }
  }
  return invalid();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computeSquareFit,
    computeContainFit,
    computeExportContentFit,
    computeExportContentLayout,
    computeTooltipAnnotationLayout,
    computeTooltipCalloutLayout,
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
    getExportTargetSlug,
    getExportPngDimensions
  };
}

if (typeof window !== 'undefined') {
  window.exportUtils = {
    computeSquareFit,
    computeContainFit,
    computeExportContentFit,
    computeExportContentLayout,
    computeTooltipAnnotationLayout,
    computeTooltipCalloutLayout,
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
    getExportTargetSlug,
    getExportPngDimensions
  };
}
