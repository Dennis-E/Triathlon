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
  logo: 'assets/logo.png'
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
  footer: true,
  headerIncludesDomain: false,
  headerIncludesQrCode: false,
  pbContentMargin: 48
};

const EXPORT_FORMATS = Object.freeze({
  square: Object.freeze({ key: 'square', width: 1080, height: 1080 }),
  portrait: Object.freeze({ key: 'portrait', width: 1080, height: 1350 }),
  story: Object.freeze({ key: 'story', width: 1080, height: 1920 })
});

const SOCIAL_EXPORT_STYLE = Object.freeze({
  safeMargin: 48,
  typography: Object.freeze({
    headline: Object.freeze({ min: 56, max: 72 }),
    centralValue: Object.freeze({ min: 88, max: 120 }),
    essential: 36,
    axis: 36,
    context: 36,
    branding: 36
  }),
  colors: Object.freeze({
    background: '#071719',
    surface: '#10292b',
    headline: '#f8fafc',
    secondary: '#d1e5e3',
    accent: '#20c9b2',
    grid: '#244346',
    rank: '#fbbf24'
  })
});

function getSocialExportStyleConfig() {
  return {
    safeMargin: SOCIAL_EXPORT_STYLE.safeMargin,
    typography: Object.fromEntries(Object.entries(SOCIAL_EXPORT_STYLE.typography).map(([key, value]) => [
      key,
      value && typeof value === 'object' ? { ...value } : value
    ])),
    colors: { ...SOCIAL_EXPORT_STYLE.colors }
  };
}

function getContrastRatio(foreground, background) {
  const toRgb = color => {
    const hex = String(color || '').replace(/^#/, '');
    if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) throw new TypeError('Contrast colors must be 3- or 6-digit hex values');
    const fullHex = hex.length === 3 ? [...hex].map(character => character + character).join('') : hex;
    return [0, 2, 4].map(offset => parseInt(fullHex.slice(offset, offset + 2), 16) / 255);
  };
  const luminance = color => {
    const [red, green, blue] = toRgb(color).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function wrapExportText(text, maxWidth, measureText, maxLines = 2) {
  if (!(maxWidth > 0) || typeof measureText !== 'function' || !(maxLines > 0)) {
    throw new TypeError('Text wrapping requires a positive width, line limit, and measureText function');
  }
  const lines = [];
  let current = '';
  const pushCurrent = () => {
    if (current) lines.push(current);
    current = '';
    if (lines.length > maxLines) throw new RangeError('Export text exceeds its line limit');
  };
  const appendWord = word => {
    if (measureText(word) <= maxWidth) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureText(candidate) <= maxWidth) current = candidate;
      else { pushCurrent(); current = word; }
      return;
    }
    pushCurrent();
    for (const character of Array.from(word)) {
      if (measureText(character) > maxWidth) throw new RangeError('A character cannot fit in the export text width');
      if (current && measureText(current + character) > maxWidth) pushCurrent();
      current += character;
    }
  };
  String(text || '').trim().split(/\s+/).filter(Boolean).forEach(appendWord);
  pushCurrent();
  return lines;
}

function getExportFormatConfig(format = 'square') {
  const config = EXPORT_FORMATS[String(format || '').toLowerCase()];
  return config ? { ...config } : null;
}

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

function computeSocialExportLayout(format = 'square', options = {}) {
  const formatConfig = getExportFormatConfig(format);
  if (!formatConfig) throw new RangeError(`Unsupported export format: ${format}`);

  const {
    safeMargin = 48,
    footerHeight = 48,
    ...layoutOptions
  } = options;
  if (!(safeMargin >= 48) || !(footerHeight >= 0)) {
    throw new RangeError('Social export layout requires a 48 px safe margin and a nonnegative footer height');
  }

  if (formatConfig.key === 'story') {
    const contentBounds = { x: 72, y: 240, width: 888, height: 1320 };
    const relative = computeExportContentLayout({
      ...layoutOptions,
      canvasWidth: contentBounds.width,
      canvasHeight: contentBounds.height,
      marginX: 0,
      headerHeight: Math.max(0, Number(layoutOptions.headerHeight ?? 190)),
      topGap: Math.max(0, Number(layoutOptions.topGap ?? 15)),
      contextGap: Math.max(0, Number(layoutOptions.contextGap ?? 12)),
      bottomMargin: Math.max(footerHeight, Number(layoutOptions.bottomMargin ?? footerHeight))
    });
    const translated = {};
    for (const [name, rect] of Object.entries(relative)) {
      if (!rect) { translated[name] = null; continue; }
      if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
          || rect.x < 0 || rect.y < 0 || rect.width <= 0 || rect.height < 0
          || rect.x + rect.width > contentBounds.width
          || rect.y + rect.height > contentBounds.height
          || (name === 'visualization' && rect.height === 0)) {
        throw new RangeError('Export content cannot fit in the story safe area');
      }
      translated[name] = { ...rect, x: rect.x + contentBounds.x, y: rect.y + contentBounds.y };
    }
    return { format: formatConfig.key, width: formatConfig.width, height: formatConfig.height,
      safeMargin, footerHeight, contentBounds, ...translated };
  }

  const layout = computeExportContentLayout({
    canvasWidth: formatConfig.width,
    canvasHeight: formatConfig.height,
    marginX: safeMargin,
    bottomMargin: safeMargin + footerHeight,
    ...layoutOptions
  });
  return {
    format: formatConfig.key,
    width: formatConfig.width,
    height: formatConfig.height,
    safeMargin,
    footerHeight,
    ...layout
  };
}

function getPbExportSourceLabel(record = {}) {
  const source = record.source || {};
  const kind = source.kind || record.sourceType;
  const labels = { modeled: 'Estimated from activity average', 'full-activity': 'Whole activity',
    'fit-rolling': 'Measured activity segment (FIT)' };
  const label = labels[kind] || (source.estimated ? 'Estimated value' : 'Activity record');
  return Number.isFinite(source.sourceDistanceKm)
    ? `${label}; ${source.sourceDistanceKm.toLocaleString('en-US', { maximumFractionDigits: 2 })} km activity` : label;
}

function getPbExportRecordLines(record, data = {}) {
  const timestamp = record.date ?? record.source?.activityDate;
  const date = timestamp === null || timestamp === undefined || timestamp === '' ? null : new Date(timestamp);
  const prefix = data.xAxisMode === 'duration' ? record.durationLabel || `${record.durationSeconds}s`
    : date && Number.isFinite(date.getTime())
      ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date unavailable';
  const value = record.displayValue || String(record.value);
  const unit = data.unit && !(data.unit === 's' && value.includes(':')) && !value.includes(data.unit) ? data.unit : '';
  const source = getPbExportSourceLabel(record);
  return [[prefix, [value, unit].filter(Boolean).join(' ')].join(' · '), record.source?.workoutTitle || 'Workout',
    source === 'Activity record' ? null : source].filter(Boolean);
}

function wrapExportPunchlineText(input, maxWidth, measureText) {
  const text = typeof input === 'string' ? input.trim() : '';
  if (!text || Array.from(text).length > 120) throw new RangeError('A punchline must contain 1 to 120 characters.');
  const lines = [];
  const addLine = line => {
    lines.push(line);
    if (lines.length > 2) throw new RangeError('This punchline does not fit in two readable lines. Shorten it or choose another format.');
  };
  for (const paragraph of text.split(/\r\n|\r|\n/)) {
    let line = '';
    for (const character of Array.from(paragraph)) {
      if (measureText(line + character) <= maxWidth) {
        line += character;
        continue;
      }
      if (!line) throw new RangeError('This punchline does not fit at readable size.');
      const breakAt = line.lastIndexOf(' ');
      if (breakAt > 0) {
        addLine(line.slice(0, breakAt + 1));
        line = line.slice(breakAt + 1) + character;
      } else {
        addLine(line);
        line = character;
      }
      if (measureText(line) > maxWidth) throw new RangeError('This punchline does not fit at readable size.');
    }
    addLine(line);
  }
  return lines;
}

function planExportPages(snapshot, options = {}, measurements = {}) {
  const format = getExportFormatConfig(options.format || 'square');
  if (!format) throw new RangeError('Unsupported export format');
  const families = { totalDistance: 'periods', paceMetrics: 'scatter', equipment: 'ranking',
    equipmentTimeline: 'timeline', personalBests: 'records', heatmap: 'map', distributions: 'distribution',
    workoutTime: 'pattern', trainingCalendar: 'calendar', wordcloud: 'words', pieCharts: 'pie',
    lifetimeStatistics: 'statistics', mediaGallery: 'media' };
  const layoutKind = families[snapshot?.targetKey];
  if (!layoutKind) throw new RangeError('Unknown export target family');
  const data = snapshot.familyData || {};
  const bounds = format.key === 'story' ? { x: 72, y: 240, width: 888, height: 1320 }
    : { x: 48, y: 48, width: format.width - 96, height: format.height - 96 };
  const measure = measurements.measureText || ((text, size = 36) => String(text).length * size * 0.55);
  const linesFor = (text, width, size = 36, maxLines = Infinity) => wrapExportText(String(text || ''), width,
    value => measure(value, size), maxLines);
  const presentation = options.presentation || {};
  const headline = options.headline || presentation.headline || data.title || 'My training';
  const context = options.contextText ?? presentation.contextText ?? presentation.summary ?? (presentation.context?.length
    ? [...new Set(presentation.context.map(item => item.value).filter(Boolean))].join(' · ')
    : [snapshot.period || data.period, snapshot.metric || data.metricLabel, snapshot.units || data.unit].filter(Boolean).join(' · '));
  const textBlocks = [];
  let cursor = bounds.y + 16;
  const addText = (role, text, size, lineHeight, weight = 500) => {
    if (!text) return;
    const lines = linesFor(text, bounds.width, size);
    textBlocks.push({ role, lines, x: bounds.x, y: cursor, fontSize: size, lineHeight, weight });
    cursor += lines.length * lineHeight + 12;
  };
  addText('headline', headline, 64, 74, 700);
  if (Number.isFinite(presentation.centralValue)) {
    addText('centralValue', presentation.centralDisplayValue || [presentation.centralValue.toLocaleString('en-US', { maximumFractionDigits: 1 }),
      presentation.unit || data.unit].filter(Boolean).join(' '), 88, 100, 700);
  }
  let captionHeight = 0;
  if (options.humorEnabled) {
    const caption = options.caption || presentation.secondaryLine;
    if (!caption) throw new Error('Enabled export humour requires one relevant caption');
    const lines = wrapExportPunchlineText(caption, bounds.width, value => measure(value, 45));
    captionHeight = lines.length * 54 + 12;
    textBlocks.push({ role: 'caption', lines, x: bounds.x, y: cursor, fontSize: 45, lineHeight: 54, weight: 700 });
    cursor += captionHeight;
  }
  addText('context', context, 36, 44);
  if (snapshot.provenance?.synthetic) addText('provenance', 'Synthetic sample training data', 36, 44);
  const attribution = Array.isArray(snapshot.attribution) ? snapshot.attribution.join(' · ') : snapshot.attribution;
  addText('attribution', attribution, 36, 44);
  if (options.reservePageIndicator && layoutKind !== 'records') addText('page', 'Page 999999 of 999999', 36, 44);
  const footerHeight = format.key === 'story' ? 128 : 104;
  const footer = { x: bounds.x, y: bounds.y + bounds.height - footerHeight, width: bounds.width, height: footerHeight };
  if (options.reservePageIndicator && layoutKind === 'records') {
    textBlocks.push({ role: 'page', lines: ['Page 999999 of 999999'], x: footer.x + footer.width - measure('Page 999999 of 999999', 36),
      y: footer.y + 4, fontSize: 36, lineHeight: 44, weight: 500 });
  }
  const legendItems = layoutKind === 'pie' ? [] : options.legendItems || data.legend?.items || data.series || snapshot.legend?.items || [];
  const legendRows = [];
  let row = [];
  let rowWidth = 0;
  let rowHeight = 0;
  for (const item of legendItems) {
    const label = String(item.label || '');
    if (!label) continue;
    const lines = linesFor(label, bounds.width - 48);
    const width = Math.min(bounds.width, measure(label, 36) + 60);
    if (row.length && rowWidth + width > bounds.width) {
      legendRows.push({ entries: row, height: rowHeight }); row = []; rowWidth = 0; rowHeight = 0;
    }
    row.push({ label, lines, color: item.color || item.borderColor || '#20c9b2', line: item.line === true, offsetX: rowWidth });
    rowWidth += width;
    rowHeight = Math.max(rowHeight, lines.length * 44);
  }
  if (row.length) legendRows.push({ entries: row, height: rowHeight });
  const legendHeight = legendRows.reduce((total, entry) => total + entry.height + 8, 0);
  const visualization = { x: bounds.x, y: cursor + 12, width: bounds.width,
    height: footer.y - 20 - legendHeight - (cursor + 12) };
  if (visualization.height < 160) throw new RangeError('Export content has insufficient readable space');
  let legendY = visualization.y + visualization.height + 12;
  for (const entry of legendRows) { entry.y = legendY; legendY += entry.height + 8; }
  const numericValues = Array.isArray(data.items) ? data.items.map(item => item.value).filter(Number.isFinite) : [];
  const totals = (data.periodLabels || []).map((_label, index) => (data.series || []).reduce((total, series) => total + (Number(series.values?.[index]) || 0), 0));
  const scale = Object.freeze({ min: 0, max: Math.max(0, ...numericValues, ...totals) });
  const pages = [];
  const addPage = (itemIndexes, extra = {}) => pages.push({ pageIndex: pages.length,
    visualization: { ...visualization }, itemIndexes, scale, ...extra });
  const pack = (indexes, heightFor, extra = {}) => {
    let indexesOnPage = [];
    let used = 0;
    for (const index of indexes) {
      const height = heightFor(index);
      if (!(height > 0) || height > visualization.height) throw new RangeError('Export item cannot fit at readable size');
      if (indexesOnPage.length && used + height > visualization.height) {
        addPage(indexesOnPage, { rowHeights: indexesOnPage.map(heightFor), ...extra }); indexesOnPage = []; used = 0;
      }
      indexesOnPage.push(index); used += height;
    }
    if (indexesOnPage.length) addPage(indexesOnPage, { rowHeights: indexesOnPage.map(heightFor), ...extra });
  };
  const indexesOf = items => (items || []).map((_item, index) => index);
  if (layoutKind === 'ranking' || layoutKind === 'timeline') {
    if (!data.items?.length) throw new Error('No equipment data to export');
    const domain = layoutKind === 'timeline' ? { min: data.scaleStart ?? Math.min(...data.items.map(item => item.firstDate)),
      max: data.scaleEnd ?? Math.max(...data.items.map(item => item.lastDate)) } : scale;
    if (layoutKind === 'timeline') {
      const axisHeight = 104;
      const rowHeights = data.items.map(item => 44 * Math.max(1, linesFor(item.name, bounds.width).length) + 88);
      let selected = [];
      let used = axisHeight;
      const finish = () => {
        if (!selected.length) return;
        const values = [domain.min, domain.min + (domain.max - domain.min) / 4,
          domain.min + (domain.max - domain.min) / 2,
          domain.min + (domain.max - domain.min) * 3 / 4, domain.max];
        addPage(selected, { scale: domain, axisHeight, rowHeights: selected.map(index => rowHeights[index]),
          axisTicks: values.map(value => ({ value, date: new Date(value).getTime() })) });
        selected = []; used = axisHeight;
      };
      for (let index = 0; index < data.items.length; index += 1) {
        if (rowHeights[index] + axisHeight > visualization.height) throw new RangeError('Timeline row cannot fit at readable size');
        if (selected.length && used + rowHeights[index] > visualization.height) finish();
        selected.push(index); used += rowHeights[index];
      }
      finish();
    } else pack(indexesOf(data.items), index => 44 * Math.max(1, linesFor(data.items[index].name, bounds.width - 96).length) + 112, { scale: domain });
  } else if (layoutKind === 'periods') {
    if (!data.periodLabels?.length || !data.series?.length) throw new Error('No period data to export');
    const axisWidth = Math.max(...Array.from({ length: 5 }, (_unused, tick) => measure(`${Math.round(Math.max(1, scale.max) * tick / 4)} km`, 36))) + 30;
    const yearWidth = Math.max(88, ...data.periodLabels.map(label => measure(String(label).split(/\s+/)[0], 36) + 24));
    const capacities = { daily: 366, weekly: 104, monthly: 48,
      yearly: Math.max(1, Math.floor((bounds.width - axisWidth) / yearWidth)) };
    const capacity = capacities[data.aggregation] || capacities.yearly;
    for (let start = 0; start < data.periodLabels.length; start += capacity) addPage(indexesOf(data.periodLabels).slice(start, start + capacity));
  } else if (layoutKind === 'pie') {
    if (!data.slices?.length) throw new Error('No pie data to export');
    const circleSize = Math.min(bounds.width, Math.max(220, Math.min(560, visualization.height * 0.56)));
    const legendSpace = visualization.height - circleSize - 24;
    const denominator = Number.isFinite(data.denominator) ? data.denominator : data.slices.reduce((total, slice) => total + slice.value, 0);
    let selected = [];
    let used = 0;
    const finish = () => {
      if (!selected.length) return;
      addPage(selected, { repeatFullChart: true, denominator, circleSize,
        chartBounds: { x: bounds.x + (bounds.width - circleSize) / 2, y: visualization.y, width: circleSize, height: circleSize },
        legendBounds: { x: bounds.x, y: visualization.y + circleSize + 24, width: bounds.width, height: legendSpace } });
      selected = []; used = 0;
    };
    for (const index of indexesOf(data.slices)) {
      const slice = data.slices[index];
      const height = Math.max(1, linesFor(`${slice.label}  ${slice.displayValue || slice.value}  ${Number(slice.percentage || slice.value / denominator * 100).toFixed(1)}%`, bounds.width - 48).length) * 44 + 12;
      if (height > legendSpace) throw new RangeError('Pie legend item cannot fit at readable size');
      if (selected.length && used + height > legendSpace) finish();
      selected.push(index); used += height;
    }
    finish();
  } else if (layoutKind === 'calendar') {
    if (!data.years?.length) throw new Error('No calendar data to export');
    const monthKeys = data.years.flatMap(year => Array.from({ length: 12 }, (_unused, month) => `${year.year}-${String(month + 1).padStart(2, '0')}`));
    const columns = 2;
    const monthHeight = 48 + 8 + 44 + 6 * 52;
    const capacity = columns * Math.floor((visualization.height + 24) / (monthHeight + 24));
    if (!capacity) throw new RangeError('Calendar month cannot fit at readable size');
    for (let start = 0; start < monthKeys.length; start += capacity) addPage([], { monthKeys: monthKeys.slice(start, start + capacity), columns, monthHeight });
  } else if (layoutKind === 'statistics') {
    if (!data.groups?.length) throw new Error('No statistics data to export');
    pack(indexesOf(data.groups), index => {
      const item = data.groups[index];
      return 44 * Math.max(1, linesFor(item.label, bounds.width).length)
        + 56 * Math.max(1, linesFor(item.displayValue, bounds.width, 48).length)
        + 44 * linesFor(item.context, bounds.width).length + 24;
    });
  } else if (layoutKind === 'media') {
    if (!data.items?.length) throw new Error('No selected media to export');
    const columns = data.mediaKind === 'annual' || data.items.length === 1 ? 1 : 2;
    const itemWidth = (bounds.width - 24 * (columns - 1)) / columns;
    const singleCaptionHeight = data.items.length === 1 ? 44 * Math.max(1, linesFor(
      `${data.items[0].date !== null ? '04/01/2025 ' : ''}${data.items[0].caption || ''}`, itemWidth).length)
      + (data.includeRoutes && data.items[0].routeSvgs ? itemWidth / 2 : 0) : 0;
    const imageHeight = data.items.length === 1 ? Math.max(160, visualization.height - singleCaptionHeight - 24)
      : Math.min(300, Math.max(160, visualization.height * 0.36));
    let chosen = [];
    let used = 0;
    for (let index = 0; index < data.items.length; index += columns) {
      const indexes = indexesOf(data.items).slice(index, index + columns);
      const height = Math.max(...indexes.map(itemIndex => imageHeight + 44 * Math.max(1, linesFor(
        `${data.items[itemIndex].date !== null ? '04/01/2025 ' : ''}${data.items[itemIndex].caption || ''}`, itemWidth).length)
        + (data.includeRoutes && data.items[itemIndex].routeSvgs ? itemWidth / 2 : 0))) + 24;
      if (height > visualization.height) throw new RangeError('Media item cannot fit at readable size');
      if (chosen.length && used + height > visualization.height) { addPage(chosen, { imageHeight, columns }); chosen = []; used = 0; }
      chosen.push(...indexes); used += height;
    }
    if (chosen.length) addPage(chosen, { imageHeight, columns });
  } else if (layoutKind === 'words') {
    if (!data.words?.length) throw new Error('No word data to export');
    const domain = data.weightDomain || { minCount: Math.min(...data.words.map(word => word.count)), maxCount: Math.max(...data.words.map(word => word.count)) };
    let chosen = [];
    let used = 0;
    const budget = visualization.width * visualization.height * 0.45;
    for (const index of indexesOf(data.words)) {
      const word = data.words[index];
      const ratio = domain.maxCount > domain.minCount ? (Math.log(word.count) - Math.log(domain.minCount)) / (Math.log(domain.maxCount) - Math.log(domain.minCount)) : 0.4666666667;
      const size = 36 + ratio * 60;
      const width = measure(word.text, size);
      if (width > visualization.width) throw new RangeError('Selected word cannot fit at readable size');
      const area = (width + 24) * (size + 24);
      if (chosen.length && used + area > budget) { addPage(chosen, { weightDomain: domain }); chosen = []; used = 0; }
      chosen.push(index); used += area;
    }
    if (chosen.length) addPage(chosen, { weightDomain: domain });
  } else if (layoutKind === 'records') {
    const addRecordPages = (group, groupIndex = null) => {
      if (!group.records?.length) return;
      const overview = groupIndex !== null;
      const headerLines = overview ? linesFor(group.title || group.definitionKey, bounds.width) : [];
      const headerHeight = overview ? headerLines.length * 44 + (group.best?.displayValue ? 64 : 0) + 12 : 0;
      const recordTextLines = group.records.map(record => getPbExportRecordLines(record, group)
        .flatMap(text => linesFor(text, bounds.width)));
      const rowHeights = recordTextLines.map(lines => lines.length * 44 + 12);
      const hasChart = group.xAxisMode === 'duration' || group.records.some(record => {
        const date = record.date ?? record.source?.activityDate;
        return date !== null && date !== undefined && date !== '' && Number.isFinite(new Date(date).getTime());
      });
      const largestRow = Math.max(...rowHeights);
      let chartHeight = hasChart ? Math.max(180, Math.min(360, (visualization.height - headerHeight) * 0.45)) : 0;
      const chartGap = hasChart ? 24 : 0;
      if (hasChart && headerHeight + chartHeight + chartGap + largestRow > visualization.height) {
        chartHeight = Math.max(180, visualization.height - headerHeight - chartGap - largestRow);
      }
      const available = visualization.height - headerHeight - chartHeight - chartGap;
      if (largestRow > available) throw new RangeError('Record source and chart cannot fit at readable size');
      let selected = [];
      let used = 0;
      const finish = () => {
        if (!selected.length) return;
        const selectedHeights = selected.map(index => rowHeights[index]);
        addPage(overview ? [groupIndex] : selected, { overview, headerLines, headerHeight, chartHeight,
          recordIndexes: selected, recordRowHeights: selectedHeights,
          recordTextLines: selected.map(index => recordTextLines[index]),
          rowHeights: overview ? [headerHeight + chartHeight + chartGap + used] : selectedHeights,
          repeatFullChart: true });
        selected = []; used = 0;
      };
      for (const index of indexesOf(group.records)) {
        if (selected.length && used + rowHeights[index] > available) finish();
        selected.push(index); used += rowHeights[index];
      }
      finish();
    };
    if (data.groups?.length) data.groups.forEach((group, index) => addRecordPages(group, index));
    else if (data.records?.length) addRecordPages(data);
    else throw new Error('No record data to export');
  } else {
    const items = data.points || data.bins || data.groups || data.chartInput?.data?.datasets?.flatMap(dataset => dataset.data || []) || [];
    if (layoutKind !== 'map' && !items.length) throw new Error('No chart data to export');
    const extra = {};
    if (layoutKind === 'map') {
      const viewport = data.viewport;
      if (!viewport) throw new Error('Selected map viewport is unavailable');
      const fit = computeContainFit(viewport.width || viewport.aspectRatio || 1, viewport.height || 1, visualization.width, visualization.height);
      extra.mapBounds = { x: visualization.x + fit.offsetX, y: visualization.y + fit.offsetY, width: fit.drawWidth, height: fit.drawHeight };
    }
    addPage(indexesOf(items), extra);
  }
  if (!pages.length) throw new Error('No export page data');
  if (pages.length > 1 && !options.reservePageIndicator) {
    return planExportPages(snapshot, { ...options, reservePageIndicator: true }, measurements);
  }
  pages.forEach(page => { page.pageCount = pages.length; page.scopeLabel = `Page ${page.pageIndex + 1} of ${pages.length}`; });
  return { format: format.key, width: format.width, height: format.height, contentBounds: bounds,
    minFontSize: 36, layoutKind, textBlocks, captionHeight, footer, legendRows, pages };
}

function createSocialExportMetadata(input = {}) {
  const headline = String(input.headline || '').trim().replace(/\s+/g, ' ');
  const headlineWordCount = headline ? headline.split(' ').length : 0;
  if (!headlineWordCount) throw new TypeError('Social export requires a factual headline');
  if (headlineWordCount > 7) throw new RangeError('Social export headline must contain at most seven words');

  const providedContext = input.context === undefined ? [] : input.context;
  if (!Array.isArray(providedContext)) throw new TypeError('Social export context must be a list');
  const context = providedContext
    .filter(item => item && String(item.label || '').trim() && String(item.value || '').trim())
    .map(item => ({ label: String(item.label).trim(), value: String(item.value).trim() }));

  const secondaryLine = String(input.secondaryLine || '').trim().replace(/\s+/g, ' ');
  if (secondaryLine && secondaryLine.split(' ').length > 10) {
    throw new RangeError('Social export secondary line must contain at most ten words');
  }

  return {
    headline,
    context,
    secondaryLine: secondaryLine || null
  };
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
    ...(input.sampleProvenance ? { sampleProvenance: copyExportMetadata(input.sampleProvenance) } : {}),
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
    getExportFormatConfig,
    getSocialExportStyleConfig,
    getContrastRatio,
    wrapExportText,
    computeSocialExportLayout,
    planExportPages,
    getPbExportSourceLabel,
    getPbExportRecordLines,
    createSocialExportMetadata,
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
    getExportFormatConfig,
    getSocialExportStyleConfig,
    getContrastRatio,
    wrapExportText,
    computeSocialExportLayout,
    planExportPages,
    getPbExportSourceLabel,
    getPbExportRecordLines,
    createSocialExportMetadata,
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
