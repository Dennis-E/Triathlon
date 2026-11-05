const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6XcAAAAASUVORK5CYII=';
const PNG_DATA_URL = `data:image/png;base64,${PNG_BASE64}`;

function createSizedPngDataUrl(width, height) {
  const chunk = (type, data) => {
    const name = Buffer.from(type);
    const bytes = Buffer.concat([name, data]);
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([size, name, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const pixels = Buffer.alloc((width * 4 + 1) * height);
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header),
    chunk('IDAT', require('zlib').deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

function deferredValue() {
  let resolve;
  const promise = new Promise(complete => { resolve = complete; });
  return { promise, resolve };
}

const dashboardExportSource = fs.readFileSync(
  path.join(__dirname, '../src/dashboard-export.js'),
  'utf8'
);

function createDownloadRuntime({ showSaveFilePicker, decodeError, imageWidth = 1, imageHeight = 1, pngDataUrl = PNG_DATA_URL, anchorError, onDownload } = {}) {
  const toast = {
    textContent: '',
    classList: {
      classes: new Set(['hidden']),
      add(name) { this.classes.add(name); },
      remove(name) { this.classes.delete(name); },
      contains(name) { return this.classes.has(name); }
    }
  };
  const anchors = [];
  const downloadLinks = [];
  const pickerCalls = [];
  const canvasCalls = { text: [], textFonts: [], textPositions: [], images: [], fills: [], canvases: [], paths: [] };
  const canvasContext = {
    beginPath() { canvasCalls.paths.push(['begin']); },
    moveTo(...args) { canvasCalls.paths.push(['move', ...args]); },
    lineTo(...args) { canvasCalls.paths.push(['line', ...args]); },
    quadraticCurveTo(...args) { canvasCalls.paths.push(['curve', ...args]); },
    closePath() { canvasCalls.paths.push(['close']); },
    fill() { canvasCalls.paths.push(['fill']); },
    stroke() { canvasCalls.paths.push(['stroke']); },
    measureText(text) { return { width: String(text).length * 12 }; },
    fillText(text, x, y) {
      canvasCalls.text.push(String(text)); canvasCalls.textFonts.push(this.font);
      canvasCalls.textPositions.push({ text: String(text), x, y, align: this.textAlign });
    },
    drawImage(...args) { canvasCalls.images.push(args); },
    fillRect(...args) { canvasCalls.fills.push(args); }
  };
  const elements = { exportToast: toast };
  let focused = null;
  for (const id of ['exportPreviewModal', 'exportPreviewImage', 'exportPreviewError', 'exportPreviewDownloadBtn', 'exportPreviewSeriesControls', 'exportPreviewSeriesPrevious', 'exportPreviewSeriesNext', 'exportPreviewSeriesStatus', 'exportHumorEnabled', 'pbDetailOverlay', 'pbDetailTitle', 'pbDetailSubtitle', 'pbDetailExport', 'pbDetailClose']) {
    elements[id] = {
      src: '', disabled: false,
      focus() { focused = id; },
      classList: {
        classes: new Set(id === 'exportPreviewModal' ? ['flex'] : ['hidden']),
        add(name) { this.classes.add(name); },
        remove(name) { this.classes.delete(name); },
        contains(name) { return this.classes.has(name); },
        toggle(name, force) { if (force) this.add(name); else this.remove(name); }
      }
    };
  }
  const timers = new Map();
  let timerId = 0;
  const context = {
    console: { error: jest.fn() },
    Date,
    Blob,
    atob,
    Uint8Array,
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    Image: class {
      constructor() { this.naturalWidth = imageWidth; this.naturalHeight = imageHeight; }
      decode() { return decodeError ? Promise.reject(decodeError) : Promise.resolve(); }
    },
    window: {
      powerPbUtils: { POWER_DURATIONS: [] },
      exportPunchlineUtils: require('../src/export-punchline-utils'),
      exportUtils: {
        ...require('../src/export-utils'),
        getExportBrandConfig: () => ({ domain: 'https://example.test/' }),
        generateExportFilename: (target, date) => `trianalytica-${target}-${date.getTime()}.png`
      },
      ...(showSaveFilePicker ? {
        showSaveFilePicker(options) {
          pickerCalls.push(options);
          return showSaveFilePicker(options);
        }
      } : {})
    },
    document: {
      body: {
        style: {},
        appendChild(element) {
          anchors.push(element);
          downloadLinks.push(element);
        },
        removeChild(element) {
          const index = anchors.indexOf(element);
          if (index !== -1) anchors.splice(index, 1);
        }
      },
      createElement(tagName) {
        if (tagName === 'canvas') {
          const canvas = {
            width: 0,
            height: 0,
            getContext() { return canvasContext; },
            toDataURL() { return pngDataUrl; }
          };
          canvasCalls.canvases.push(canvas);
          return canvas;
        }
        if (tagName !== 'a') throw new Error(`Unexpected element: ${tagName}`);
        return {
          click() {
            const failure = typeof anchorError === 'function' ? anchorError() : anchorError;
            if (failure) throw failure;
            this.clicked = true;
            if (onDownload) onDownload();
          },
          href: '',
          download: ''
        };
      },
      getElementById(id) { return elements[id] || null; }
    }
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/dashboard-power-pb.js'), 'utf8'), context);
  vm.runInContext('renderPbDetailChart = () => {}; this.__openPb = openPbDetail; this.__closePb = closePbDetail; this.__pbOpening = () => typeof pbDetailOpening === "undefined" ? null : pbDetailOpening;', context);
  vm.runInContext(
    `${dashboardExportSource}\nthis.__exportTargetIds = EXPORT_CAPTURE_TARGET_IDS; this.__socialPresentation = getSocialExportPresentation; this.__exportPresentationData = getExportPresentationData; this.__exportTargetPages = getExportTargetPages; this.__exportActivePbDetail = exportActivePbDetail; this.__setExportFormat = setExportFormat; this.__setExportHumorEnabled = setExportHumorEnabled; this.__getExportFormat = () => selectedExportFormat; this.__downloadExportedImage = downloadExportedImage; this.__setLastExportedImage = value => { lastExportedImage = value; }; this.__prepare = (...args) => prepareExportImage(...args); this.__close = closeExportPreviewModal; this.__show = showExportPreviewModal; this.__image = () => lastExportedImage; this.__capture = exportVisualizationTarget; this.__targetForTest = getTabExportTarget; this.__composeExportImages = composeCurrentExportImages; this.__setAvailableTabs = tabs => { globalThis.availableVisualizationTabs = tabs; }; this.__setDashboardDataRevision = revision => { globalThis.dashboardDataRevision = revision; }; this.__drawExportComposition = drawExportComposition; this.__drawComposition = drawExportComposition; this.__mockCapture = dataUrl => { waitForChartRenderSettle = () => Promise.resolve(); loadExportAssets = () => Promise.resolve({}); drawExportComposition = () => dataUrl; };`,
    context,
    { filename: 'src/dashboard-export.js' }
  );
  context.__setLastExportedImage({
    dataUrl: PNG_DATA_URL,
    blob: new Blob([Buffer.from(PNG_BASE64, 'base64')], { type: 'image/png' }),
    target: 'paceMetrics'
  });

  return {
    context,
    download: context.__downloadExportedImage,
    anchors,
    downloadLinks,
    pickerCalls,
    toast,
    elements,
    timers,
    canvasCalls,
    context,
    prepare: context.__prepare,
    closePreview: context.__close,
    showPreview: context.__show,
    setImage: context.__setLastExportedImage,
    getImage: context.__image,
    openPb: context.__openPb,
    closePb: context.__closePb,
    getPbOpening: context.__pbOpening,
    capture: context.__capture,
    mockCapture(dataUrl) {
      elements.captureTarget = {};
      context.html2canvas = jest.fn().mockResolvedValue({});
      context.__mockCapture(dataUrl);
      vm.runInContext('initializeStructuredExportTarget = target => target;', context);
    },
    getFocus: () => focused
  };
}

describe('F080 T005 punchline runtime integration', () => {
  it('makes the pure helper available in the existing export runtime', () => {
    const runtime = createDownloadRuntime();
    expect(typeof runtime.context.window.exportPunchlineUtils?.buildPunchlineSuggestions).toBe('function');
  });
});

describe('dashboard export target inventory', () => {
  const expectedTargets = {
    totalDistance: 'totalDistanceChartWrapper',
    paceMetrics: 'paceMetricsChartWrapper',
    heartRate: 'heartRateChartWrapper',
    equipment: 'equipmentChartWrapper',
    equipmentTimeline: 'equipmentTimelineWrapper',
    personalBests: 'pbColumnsContainer',
    heatmap: 'heatmapMapContainer',
    distributions: 'distributionsChartWrapper',
    workoutTime: 'workoutTimeChartWrapper',
    trainingCalendar: 'trainingCalendarYears',
    wordcloud: 'wordcloudCanvas',
    pieCharts: 'pieChartsCaptureArea',
    lifetimeStatistics: 'lifetimeStatisticsExportArea',
    mediaGallery: 'mediaGalleryExportArea'
  };

  it.each(Object.entries(expectedTargets))('maps the %s tab to its existing capture target', (tab, targetId) => {
    const runtime = createDownloadRuntime();
    expect(runtime.context.__exportTargetIds[tab]).toBe(targetId);
  });

  it('refuses a chart target omitted from current visualization availability', () => {
    const runtime = createDownloadRuntime();
    runtime.context.document.querySelectorAll = () => [];
    runtime.context.chartInstance = {};
    runtime.elements.totalDistanceChartWrapper = {};
    runtime.context.__setAvailableTabs(['paceMetrics']);

    expect(runtime.context.__targetForTest('totalDistance')).toBeNull();
    runtime.context.__setAvailableTabs(['totalDistance']);
    expect(runtime.context.__targetForTest('totalDistance')).not.toBeNull();
  });

  it('exports only a current nonempty heart-rate model through the structured target', () => {
    const runtime = createDownloadRuntime();
    runtime.context.chartInstance = null;
    runtime.context.document.querySelectorAll = () => [];
    runtime.elements.heartRateChartWrapper = {};
    runtime.context.__setAvailableTabs(['heartRate']);
    let data = null;
    runtime.context.window.heartRateDashboard = { getExportData: () => data, getRevision: () => 1 };
    expect(runtime.context.__targetForTest('heartRate')).toBeNull();
    data = { sport: 'All', metric: 'heartRate', unit: 'bpm', period: '2026-10-01 - 2026-11-04',
      activityCount: 1, points: [{ x: 1, y: 180 }], series: [{ label: 'Maximum', color: '#fb7185' }] };
    expect(runtime.context.__targetForTest('heartRate')).toMatchObject({ key: 'heartRate', hasData: true, targetElementId: 'heartRateChartWrapper' });
    expect(runtime.context.__socialPresentation('heartRate', data).headline).toBe('Heart-rate minimum and maximum');
  });

  it('rejects changed heart-rate capture revisions but keeps already published snapshots valid', () => {
    const runtime = createDownloadRuntime();
    let revision = 1;
    runtime.context.window.heartRateDashboard = { getRevision: () => revision };
    const pending = { heartRateRevision: 1 };
    expect(runtime.context.isCurrentExportCapture(pending)).toBe(true);
    revision = 2;
    expect(runtime.context.isCurrentExportCapture(pending)).toBe(false);
    expect(runtime.context.isCurrentExportCapture({ ...pending, heartRateSnapshotPublished: true })).toBe(true);
  });

  it('preserves heart-rate calendar count, grouping and requested bounds through snapshot copying', () => {
    const runtime = createDownloadRuntime();
    runtime.context.snapshotTarget={kind:'tab',key:'heartRate',hasData:true};
    runtime.context.snapshotData={sport:'Run',aggregation:'weekly',activityCount:12,periodCount:7,periodLabels:['2025-12-29 - 2026-01-04'],
      periodStart:1,periodEnd:10,viewBounds:{min:1,max:10},points:[{x:5,y:75}],unit:'bpm'};
    const snapshot=vm.runInContext('captureExportSelection(snapshotTarget,snapshotData)',runtime.context);
    expect(snapshot.familyData).toMatchObject({periodCount:7,aggregation:'weekly',periodLabels:['2025-12-29 - 2026-01-04'],periodStart:1,periodEnd:10,viewBounds:{min:1,max:10}});
    const presentation=runtime.context.__socialPresentation('heartRate',runtime.context.snapshotData);
    expect(presentation.headline).toMatch(/weekly/i);
  });

  it('invalidates heart-rate preview downloads only for empty filters or unpublished captures', () => {
    const runtime = createDownloadRuntime();
    vm.runInContext("lastExportCaptureState = { snapshot: { targetKey: 'heartRate' }, heartRateSnapshotPublished: true };", runtime.context);
    runtime.context.invalidateHeartRateExport(true);
    expect(runtime.getImage()).not.toBeNull();
    runtime.context.invalidateHeartRateExport(false);
    expect(runtime.getImage()).toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(true);
    runtime.setImage({ dataUrl: PNG_DATA_URL, target: 'equipment' });
    vm.runInContext("lastExportCaptureState = { snapshot: { targetKey: 'equipment' } };", runtime.context);
    runtime.context.invalidateHeartRateExport(false);
    expect(runtime.getImage()).not.toBeNull();
  });

  it.each([
    ['totalDistance', { sport: 'Run', aggregation: 'yearly', period: '2024-2026', metricLabel: 'Distance', unit: 'km' }, 'Run distance by year'],
    ['paceMetrics', { sport: 'Bike', metricLabel: 'Heart rate', period: '2024-2026', unit: 'bpm' }, 'My heart rate vs speed'],
    ['equipment', { equipmentFilter: 'Shoes', metric: 'distance' }, 'Shoe distance ranking'],
    ['equipmentTimeline', { equipmentFilter: 'Shoes', mode: 'continuous', periodMeaning: 'Usage span' }, 'Shoe usage timeline'],
    ['personalBests', {}, 'My personal bests'],
    ['heatmap', { sport: 'Run', period: '2024-2026' }, 'Run route heatmap'],
    ['distributions', {}, 'training distribution'],
    ['workoutTime', { sport: 'Run', metric: 'duration', granularity: 'week' }, 'Run duration by weekday'],
    ['trainingCalendar', {}, 'training frequency calendar'],
    ['wordcloud', {}, 'Workout title frequency: selected words'],
    ['pieCharts', { groupBy: 'sport' }, 'Activities by sport'],
    ['lifetimeStatistics', {}, 'Lifetime training summary'],
    ['mediaGallery', {}, 'Training media collage']
  ])('builds concise, relevant social context for %s', (key, data, headline) => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation(key, data);

    expect(presentation.headline).toBe(headline);
    expect(presentation.headline.trim().split(/\s+/).length).toBeLessThanOrEqual(7);
    expect(presentation.context).toEqual(expect.any(Array));
    expect(presentation.context).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ label: expect.stringMatching(/filter|colour scheme|color scheme/i) })
    ]));
  });

  it('uses the selected equipment metric and mode in neutral factual headlines', () => {
    const runtime = createDownloadRuntime();
    expect(runtime.context.__socialPresentation('equipment', {
      sport: 'Run', equipmentFilter: 'Shoes', metric: 'pace', metricLabel: 'Pace', unit: 'min/km', period: '2025'
    })).toMatchObject({ headline: 'Shoe pace ranking', period: '2025', unit: 'min/km' });
    expect(runtime.context.__socialPresentation('equipment', {
      equipmentFilter: 'All', metric: 'count', metricLabel: 'Activity count', unit: 'activities', period: null
    })).toMatchObject({ headline: 'Equipment activity count ranking', period: null, unit: 'activities' });
    expect(runtime.context.__socialPresentation('equipmentTimeline', {
      equipmentFilter: 'All', mode: 'activities', periodMeaning: 'Individual activities'
    })).toMatchObject({ headline: 'Equipment activity timeline' });
  });

  it('does not turn a dataset extent into a selected-filter period or record comparison', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('totalDistance', { sport: 'Bike', aggregation: 'yearly', unit: 'km' });
    expect(presentation.headline).toBe('Bike distance by year');
    expect(presentation.period).toBeNull();
    expect(presentation.summary).toBeNull();
  });

  it('adds named scatter axes and point-size meaning to social context', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('paceMetrics', {
      sport: 'Bike',
      metric: 'heartRate',
      xAxisTitle: 'Speed (km/h)',
      yAxisTitle: 'Average heart rate (bpm)',
      pointSizeMeaning: 'Duration'
    });

    expect(presentation.headline).toBe('My heart rate vs speed');
    expect(presentation.context).toEqual(expect.arrayContaining([
      { label: 'X axis', value: 'Speed (km/h)' },
      { label: 'Y axis', value: 'Average heart rate (bpm)' },
      { label: 'Point size', value: 'Duration' }
    ]));
  });

  it.each([
    ['Run', 'heartRate', 'Pace (min/km)', 'Average heart rate (bpm)', 'Duration', 'All', 'Run. Heart rate vs. Pace. Size = Duration'],
    ['Bike', 'heartRate', 'Speed (km/h)', 'Average heart rate (bpm)', 'Duration', '2024-2026', 'Bike. Heart rate vs. Speed. Size = Duration. 2024-2026'],
    ['Swim', 'distance', 'Pace (min/100m)', 'Distance (m)', null, 'All time', 'Swim. Distance vs. Pace']
  ])('builds a concise %s comparison summary with truthful performance terminology', (sport, metric, xAxisTitle, yAxisTitle, pointSizeMeaning, period, expectedSummary) => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('paceMetrics', {
      sport, metric, metricLabel: metric === 'distance' ? 'Distance' : 'Average heart rate',
      xAxisTitle, yAxisTitle, pointSizeMeaning, period
    });

    expect(presentation.summary).toBe(expectedSummary);
    expect(presentation.context).toEqual(expect.arrayContaining([
      { label: 'X axis', value: xAxisTitle },
      { label: 'Y axis', value: yAxisTitle }
    ]));
  });

  it('renders only the concise Pace vs summary instead of redundant field prefixes', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('paceMetrics', {
      sport: 'Run', metric: 'heartRate', xAxisTitle: 'Pace (min/km)',
      yAxisTitle: 'Average heart rate (bpm)', pointSizeMeaning: 'Duration', period: 'All'
    });
    runtime.context.__drawComposition({ width: 960, height: 500 }, {
      kind: 'tab', key: 'paceMetrics', title: presentation.headline, format: 'square', presentation
    }, { logo: { naturalWidth: 100, naturalHeight: 50 } });

    const text = runtime.canvasCalls.text.join(' ');
    expect(text).toContain('Run. Heart rate vs. Pace. Size = Duration');
    expect(text).not.toMatch(/Sport:|Metric:|Unit:|X axis:|Y axis:/);
  });

  it('uses the formatted PB result and available source in social presentation', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('pb-tile', {
      title: 'Run 5 km',
      metricLabel: 'Time',
      recordCount: 3,
      firstRecord: { value: 3134, displayValue: '52:14', date: new Date('2024-01-01') },
      currentRecord: { value: 2700, displayValue: '45:00', date: new Date('2026-03-01') },
      best: { value: 850, displayValue: '14:10', sourceType: 'official race' },
      milestones: [{ kind: 'current', value: 850, displayValue: '14:10', title: 'City race' }]
    });

    expect(presentation).toMatchObject({
      headline: 'PB: Run 5 km',
      centralValue: 850,
      centralDisplayValue: '14:10',
      best: { sourceType: 'official race' },
      summary: 'From 52:14 to 45:00 since 2024',
      sourceAttribution: 'official race',
      milestones: [{ kind: 'current', title: 'City race' }]
    });
    expect(presentation.context).not.toContainEqual({ label: 'Source', value: 'official race' });
    runtime.context.__drawComposition({ width: 1200, height: 680 }, {
      kind: 'pb-tile', key: 'run-5km', title: presentation.headline,
      format: 'square', presentation
    }, { logo: { naturalWidth: 100, naturalHeight: 50 } });
    const compositionText = runtime.canvasCalls.text.join(' ');
    expect(compositionText).toContain('From 52:14 to 45:00 since 2024');
    expect(compositionText).toContain('Source: official race');
    expect(compositionText).not.toContain('largestImprovement');
    expect(compositionText).not.toContain('City race');
  });

  it('omits PB trend copy for one record and omits unavailable first-record years', () => {
    const runtime = createDownloadRuntime();
    const single = runtime.context.__socialPresentation('pb-tile', {
      title: 'Run 5 km', recordCount: 1,
      firstRecord: { value: 2700, displayValue: '45:00' },
      currentRecord: { value: 2700, displayValue: '45:00' },
      best: { value: 2700, displayValue: '45:00' }
    });
    const noYear = runtime.context.__socialPresentation('pb-tile', {
      title: 'Run 5 km', recordCount: 2,
      firstRecord: { value: 3134, displayValue: '52:14' },
      currentRecord: { value: 2700, displayValue: '45:00' },
      best: { value: 2700, displayValue: '45:00' }
    });

    expect(single.summary).toBeNull();
    expect(noYear.summary).toBe('From 52:14 to 45:00');
  });

  it('supports a personal-best detail as a distinct export target', () => {
    const runtime = createDownloadRuntime();
    const target = runtime.context.window.exportUtils.createExportTarget({
      kind: 'pb-tile',
      key: 'run-5km',
      title: 'Run 5 km',
      targetElementId: 'pbDetailCaptureTarget',
      hasData: true,
      detailKey: 'run-5km'
    });

    expect(target).toMatchObject({
      kind: 'pb-tile',
      key: 'run-5km',
      targetElementId: 'pbDetailCaptureTarget',
      detailKey: 'run-5km',
      hasData: true
    });
  });

  it('splits long square equipment timelines into numbered pages on one shared scale', () => {
    const runtime = createDownloadRuntime();
    const items = Array.from({ length: 7 }, (_, index) => ({
      name: `Shoe ${index + 1}`,
      firstDate: new Date(2020 + index, 0, 1),
      lastDate: new Date(2021 + index, 0, 1)
    }));
    const pages = runtime.context.__exportTargetPages({
      kind: 'tab',
      key: 'equipmentTimeline',
      format: 'square',
      exportData: { items }
    });

    expect(pages).toHaveLength(2);
    expect(pages.map(page => page.exportData.items.length)).toEqual([5, 2]);
    expect(pages.map(page => [page.exportData.pageNumber, page.exportData.pageCount])).toEqual([[1, 2], [2, 2]]);
    expect(pages[0].exportData.scaleStart).toBe(pages[1].exportData.scaleStart);
    expect(pages[0].exportData.scaleEnd).toBe(pages[1].exportData.scaleEnd);
  });

  it('renders the same global date axis on every structured equipment timeline page', () => {
    const runtime = createDownloadRuntime();
    const year = 365 * 24 * 60 * 60 * 1000;
    const scaleStart = Date.UTC(2015, 0, 1);
    const scaleEnd = Date.UTC(2025, 11, 31);
    const items = Array.from({ length: 18 }, (_unused, index) => ({
      id: `shoe-${index + 1}`, name: `Shoe ${index + 1}`, type: 'Shoes',
      firstDate: scaleStart + index * year / 2,
      lastDate: Math.min(scaleEnd, scaleStart + (index + 1) * year / 2), activities: []
    }));
    const snapshot = { targetKey: 'equipmentTimeline', period: '2015-2025', metric: 'Usage span', units: null,
      filters: [], familyData: { mode: 'continuous', items, scaleStart, scaleEnd } };
    const plan = runtime.context.window.exportUtils.planExportPages(snapshot,
      { format: 'story', headline: 'Shoe usage timeline', humorEnabled: false },
      { measureText: text => String(text).length * 18 });
    const expectedTicks = plan.pages[0].axisTicks.map(tick => String(new Date(tick.date).getFullYear()));
    expect(plan.pages.length).toBeGreaterThan(1);
    expect(plan.pages.every(page => page.axisTicks.map(tick => tick.value).join('|')
      === plan.pages[0].axisTicks.map(tick => tick.value).join('|'))).toBe(true);

    for (const page of plan.pages) {
      const start = runtime.canvasCalls.text.length;
      runtime.context.timelineRenderInput = { context: runtime.context.document.createElement('canvas').getContext(), snapshot, page };
      vm.runInContext('EXPORT_ADAPTERS.equipmentTimeline.renderPage(timelineRenderInput)', runtime.context);
      const pageText = runtime.canvasCalls.text.slice(start);
      expect(pageText).toContain('Year');
      expect(pageText.filter(text => expectedTicks.includes(text))).toEqual(expectedTicks);
    }
  });

  it('splits overflowing Training Calendar years into a complete numbered series on one scale', () => {
    const runtime = createDownloadRuntime();
    const years = Array.from({ length: 10 }, (_unused, index) => ({ year: 2026 - index }));
    const scale = { palette: 'fire', minLevel: 0, maxLevel: 5, colors: ['#0B1220', '#FDE047', '#B91C1C'] };
    const pages = runtime.context.__exportTargetPages({
      key: 'trainingCalendar',
      format: 'square',
      exportData: { years, scale, yearSectionHeight: 240 }
    });
    const pageYears = pages.flatMap(page => page.exportData.years.map(year => year.year));

    expect(pages.length).toBeGreaterThan(1);
    expect(pageYears).toEqual(years.map(year => year.year));
    expect(new Set(pageYears).size).toBe(years.length);
    expect(pages.map(page => [page.seriesPage, page.seriesCount])).toEqual(
      pages.map((_page, index) => [index + 1, pages.length])
    );
    expect(pages.every(page => page.format === 'square' && page.exportData.format === 'square')).toBe(true);
    expect(pages.every(page => JSON.stringify(page.exportData.scale) === JSON.stringify(scale))).toBe(true);
  });

  it('keeps a readable short Training Calendar in one image', () => {
    const runtime = createDownloadRuntime();
    const target = {
      key: 'trainingCalendar',
      format: 'portrait',
      exportData: { years: [{ year: 2026 }, { year: 2025 }], scale: { palette: 'green' }, yearSectionHeight: 120 }
    };

    expect(runtime.context.__exportTargetPages(target)).toEqual([target]);
  });

  it('prints the calendar series page number in the final composition', () => {
    const runtime = createDownloadRuntime();
    runtime.context.__drawComposition({ width: 960, height: 500 }, {
      kind: 'tab',
      key: 'trainingCalendar',
      title: 'Training Calendar',
      format: 'square',
      presentation: { headline: 'Training Calendar', context: [] },
      seriesPage: 1,
      seriesCount: 3
    }, { logo: { naturalWidth: 100, naturalHeight: 50 } });

    expect(runtime.canvasCalls.text).toContain('Page 1 of 3');
  });

  it('previews, navigates, and downloads numbered timeline pages one at a time', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const target = {
      kind: 'tab',
      key: 'equipmentTimeline',
      title: 'My running shoe eras',
      targetElementId: 'captureTarget',
      hasData: true,
      format: 'square',
      exportData: {
        mode: 'continuous',
        periodMeaning: 'Usage span',
        items: Array.from({ length: 7 }, (_, index) => ({
          name: `Shoe ${index + 1}`,
          firstDate: new Date(2020 + index, 0, 1),
          lastDate: new Date(2021 + index, 0, 1),
          totalKm: 500 - index * 10,
          activityCount: 20
        }))
      }
    };
    runtime.setImage(null);
    runtime.closePreview();
    runtime.mockCapture(PNG_DATA_URL);
    vm.runInContext(`this.seriesDraws = []; drawExportComposition = (captured, page) => { this.seriesDraws.push(page.exportData.pageNumber); return '${PNG_DATA_URL}'; };`, context);

    await runtime.capture(target);

    expect(context.seriesDraws).toEqual([1, 2]);
    expect(runtime.elements.exportPreviewSeriesControls.classList.contains('hidden')).toBe(false);
    expect(runtime.elements.exportPreviewSeriesStatus.textContent).toBe('Page 1 of 2');
    context.setExportSeriesPage('next');
    expect(runtime.elements.exportPreviewSeriesStatus.textContent).toBe('Page 2 of 2');
    expect(runtime.getImage().target.exportData.pageNumber).toBe(2);
    context.setExportSeriesPage('previous');
    expect(runtime.elements.exportPreviewSeriesStatus.textContent).toBe('Page 1 of 2');
    await runtime.download();
    expect(runtime.downloadLinks[0].download).toMatch(/page-1-of-2/);
    expect(runtime.elements.exportPreviewSeriesStatus.textContent).toBe('Page 2 of 2');
  });

  it('captures the active personal-best detail with its title, metric, and identity', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const model = {
      title: 'Run 5 km',
      exportKey: 'run-5km',
      axisLabel: 'Time',
      records: [{ date: new Date('2025-05-01'), value: 1200, title: 'City race' }]
    };
    runtime.elements.pbDetailCaptureTarget = {};
    runtime.setImage(null);
    runtime.closePreview();
    runtime.mockCapture(PNG_DATA_URL);
    context.document.querySelectorAll = () => [];
    vm.runInContext(`drawExportComposition = (captured, target) => { this.pbTargetForTest = target; return '${PNG_DATA_URL}'; };`, context);
    runtime.openPb(model, { focus() {} });

    await context.__exportActivePbDetail();

    expect(context.pbTargetForTest).toMatchObject({
      kind: 'pb-tile',
      key: 'run-5km',
      title: 'PB: Run 5 km',
      detailKey: 'run-5km',
      metricLabel: 'Time'
    });
    expect(runtime.getImage().target).toMatchObject(context.pbTargetForTest);
  });

  it.each(['distributions', 'workoutTime', 'trainingCalendar', 'wordcloud', 'pieCharts', 'lifetimeStatistics', 'mediaGallery'])('provides relevant context metadata for %s exports', tabName => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    context.document.querySelectorAll = () => [];
    const data = context.__exportPresentationData(tabName);

    expect(data.metricLabel).toEqual(expect.any(String));
    expect(data.metricLabel.trim().length).toBeGreaterThan(0);
    expect(data.period).toEqual(expect.any(String));
    expect(data.period.trim().length).toBeGreaterThan(0);
    const presentation = context.__socialPresentation(tabName, data);
    expect(presentation.context.some(item => /palette|colour scheme|color scheme/i.test(item.label))).toBe(false);
  });

  it('uses the pie measure as metric context without exporting the palette selection', () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const button = (textContent, selected) => ({
      textContent,
      disabled: false,
      classList: { contains: name => selected && name === 'bg-indigo-600' },
      getAttribute: () => null
    });
    const elements = {
      pieDimensionBtnEquipment: button('Equipment', true),
      pieMeasureBtnDistance: button('Distance', true),
      pieSportBtnBike: button('Bike', true),
      pieChartsColorScheme: { selectedOptions: [{ textContent: 'Fire' }] }
    };
    const originalGetElementById = context.document.getElementById;
    context.document.getElementById = id => elements[id] || originalGetElementById(id);
    context.document.querySelectorAll = () => [];

    const data = context.__exportPresentationData('pieCharts');
    const presentation = context.__socialPresentation('pieCharts', data);

    expect(data).toMatchObject({ sport: 'Bike', metricLabel: 'Distance', groupBy: 'Equipment', unit: 'km' });
    expect(presentation.context).toEqual(expect.arrayContaining([
      { label: 'Sport', value: 'Bike' },
      { label: 'Metric', value: 'Distance' },
      { label: 'Group', value: 'Equipment' },
      { label: 'Unit', value: 'km' }
    ]));
    expect(presentation.context.some(item => /colour scheme|color scheme/i.test(item.label))).toBe(false);
  });

  it('adds only an applicable short humor line when enabled', () => {
    const runtime = createDownloadRuntime();
    const data = { sport: 'Run', centralValue: 1234, unit: 'km', period: '2024-2026' };
    const factual = runtime.context.__socialPresentation('totalDistance', data);
    const humorous = runtime.context.__socialPresentation('totalDistance', data, { humorEnabled: true });

    expect(factual.secondaryLine).toBeNull();
    expect(humorous.headline).toBe(factual.headline);
    expect(humorous.centralValue).toBe(factual.centralValue);
    expect(humorous.context).toEqual(factual.context);
    expect(humorous.secondaryLine).toBe("Apparently, I don't sit still.");
    expect(humorous.secondaryLine.trim().split(/\s+/).length).toBeLessThanOrEqual(10);
  });

  it('adds one concise, non-analytical humor line to the heart-rate-versus-performance comparison', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('paceMetrics', {
      sport: 'Bike', metricLabel: 'Heart rate'
    }, { humorEnabled: true });

    expect(presentation.secondaryLine).toBe('Dots, not destiny.');
    expect(presentation.headline).toBe('My heart rate vs speed');
  });

  it.each(['totalDistance', 'paceMetrics', 'equipment', 'equipmentTimeline', 'personalBests', 'heatmap',
    'distributions', 'workoutTime', 'trainingCalendar', 'wordcloud', 'pieCharts', 'lifetimeStatistics', 'mediaGallery'])
  ('has exactly one relevant friendly caption for %s and none when disabled', key => {
    const runtime = createDownloadRuntime();
    const data = key === 'equipment' ? { equipmentFilter: 'All', metric: 'count', metricLabel: 'Activity count' }
      : key === 'equipmentTimeline' ? { equipmentFilter: 'All', mode: 'activities' } : {};
    const enabled = runtime.context.__socialPresentation(key, data, { humorEnabled: true });
    const disabled = runtime.context.__socialPresentation(key, data, { humorEnabled: false });
    expect(enabled.secondaryLine).toEqual(expect.any(String));
    expect(enabled.secondaryLine.trim().split(/\s+/).length).toBeLessThanOrEqual(10);
    expect(disabled.secondaryLine).toBeNull();
    expect(enabled.headline).toBe(disabled.headline);
  });

  it.each([
    ['distributions', {}, 'Apparently, every workout has a chart.'],
    ['workoutTime', {}, 'Time flies. Apparently, so does training.'],
    ['trainingCalendar', {}, 'Apparently, I like showing up.'],
    ['wordcloud', {}, 'My workout names need their own chart.'],
    ['pieCharts', {}, 'Apparently, I enjoy a good slice.'],
    ['lifetimeStatistics', {}, 'A few workouts add up.'],
    ['mediaGallery', {}, 'Proof I did leave the house.']
  ])('provides a short applicable humor line for %s', (tabName, data, expectedLine) => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation(tabName, data, { humorEnabled: true });

    expect(presentation.secondaryLine).toBe(expectedLine);
    expect(presentation.secondaryLine.trim().split(/\s+/).length).toBeLessThanOrEqual(10);
  });

  it('exposes personal-best milestones and source details without inventing missing fields', () => {
    const runtime = createDownloadRuntime();
    const first = { date: new Date('2024-01-01'), value: 1100, title: 'First effort', sourceType: 'activity' };
    const improvement = { date: new Date('2024-06-01'), value: 900, title: 'Big improvement' };
    const current = { date: new Date('2025-03-01'), value: 850, title: 'Current race', sourceType: 'official race' };
    const expectedSource = record => ({ workoutTitle: record.title, activityDate: record.date.getTime(),
      kind: 'unknown', estimated: false });
    runtime.openPb({
      title: 'Run 5 km',
      axisLabel: 'Time',
      direction: 'down',
      records: [first, improvement, current]
    }, { focus() {} });

    expect(runtime.context.window.personalBestsDashboard.getActiveExportData()).toEqual({
      title: 'Run 5 km',
      definitionKey: 'Run 5 km',
      sport: 'Run',
      unit: 's',
      xAxisMode: 'time',
      sourceAttribution: 'activity, official race',
      period: '2024-2025',
      periodStart: first.date.getTime(),
      periodEnd: current.date.getTime(),
      metricLabel: 'Time',
      direction: 'down',
      recordCount: 3,
      records: [
        { value: 1100, displayValue: '1100', date: first.date, sourceType: 'activity', source: expectedSource(first) },
        { value: 900, displayValue: '900', date: improvement.date, sourceType: null, source: expectedSource(improvement) },
        { value: 850, displayValue: '850', date: current.date, sourceType: 'official race', source: expectedSource(current) }
      ],
      firstRecord: { value: 1100, displayValue: '1100', date: first.date, sourceType: 'activity', source: expectedSource(first) },
      currentRecord: { value: 850, displayValue: '850', date: current.date, sourceType: 'official race', source: expectedSource(current) },
      best: { value: 850, displayValue: '850', date: current.date, sourceType: 'official race', source: expectedSource(current) },
      milestones: [
        { kind: 'first', value: 1100, displayValue: '1100', date: first.date, sourceType: 'activity', source: expectedSource(first) },
        { kind: 'largestImprovement', value: 900, displayValue: '900', date: improvement.date, sourceType: null, source: expectedSource(improvement) },
        { kind: 'current', value: 850, displayValue: '850', date: current.date, sourceType: 'official race', source: expectedSource(current) }
      ]
    });
  });
});

describe('dashboard export composition', () => {
  it('discards a capture that finishes rendering after the dataset revision changes', async () => {
    const runtime = createDownloadRuntime();
    const captureCanvas = deferredValue();
    runtime.mockCapture(PNG_DATA_URL);
    runtime.context.html2canvas = jest.fn(() => captureCanvas.promise);
    runtime.context.__setDashboardDataRevision(1);
    const capture = runtime.capture({ kind: 'tab', key: 'totalDistance', title: 'Distance',
      targetElementId: 'captureTarget', hasData: true, exportData: {} });
    await new Promise(resolve => setImmediate(resolve));

    expect(runtime.context.html2canvas).toHaveBeenCalledTimes(1);
    runtime.context.__setDashboardDataRevision(2);
    runtime.closePreview();
    captureCanvas.resolve({ width: 900, height: 900 });
    await capture;

    expect(runtime.elements.exportPreviewImage.src).toBe('');
    expect(runtime.getImage()).toBeNull();
  });

  it('does not publish an image prepared for a previous dataset revision', async () => {
    const runtime = createDownloadRuntime();
    const pendingDecode = deferredValue();
    runtime.context.Image = class {
      constructor() { this.naturalWidth = 1; this.naturalHeight = 1; }
      decode() { return pendingDecode.promise; }
    };
    runtime.context.__setDashboardDataRevision(1);
    runtime.context.drawExportComposition = () => PNG_DATA_URL;
    const capture = runtime.context.__composeExportImages({
      captured: {},
      target: { kind: 'tab', key: 'totalDistance', title: 'Distance', exportData: {} },
      assets: {},
      dashboardDataRevision: 1,
      captureGeneration: 0
    });

    runtime.context.__setDashboardDataRevision(2);
    runtime.closePreview();
    pendingDecode.resolve();
    await capture;

    expect(runtime.elements.exportPreviewImage.src).toBe('');
    expect(runtime.getImage()).toBeNull();
  });

  it('prints the full OSM attribution URL in a sample map image', () => {
    const runtime = createDownloadRuntime();
    runtime.context.__drawComposition({ width: 960, height: 500 }, {
      kind: 'tab', key: 'heatmap', title: 'Routes', sampleProvenance: { synthetic: true }
    }, { logo: { naturalWidth: 120, naturalHeight: 60 }, qrCode: { naturalWidth: 120, naturalHeight: 120 } });
    expect(runtime.canvasCalls.text.join(' ')).toContain('https://www.openstreetmap.org/copyright');
  });

  it.each(['square', 'portrait'])('reserves synthetic attribution in %s images independently of optional context', format => {
    const runtime = createDownloadRuntime();
    runtime.context.__drawComposition({ width: 960, height: 500 }, {
      kind: 'tab', key: 'totalDistance', title: 'Distance', format,
      sampleProvenance: { synthetic: true, label: 'Synthetic sample training data' }
    }, { logo: { naturalWidth: 120, naturalHeight: 60 }, qrCode: { naturalWidth: 120, naturalHeight: 120 } });
    expect(runtime.canvasCalls.text.join(' ')).toContain('Synthetic sample training data');
  });

  it.each([['count', 'Workout number'], ['duration', 'Duration'], ['distance', 'Distance']])('captures Workout Time %s context and preserves the unavailable-state gate', (measure, label) => {
    const runtime = createDownloadRuntime();
    runtime.context.chartInstance = null;
    runtime.context.document.querySelectorAll = () => [];
    runtime.elements.workoutTimeChartWrapper = {};
    let exportable = true;
    runtime.elements.workoutTimeEmptyState = { classList: { contains: name => name === 'hidden' && exportable } };
    let selected = measure;
    for (const [key, text] of [['count', 'Workout number'], ['duration', 'Duration'], ['distance', 'Distance']]) {
      runtime.elements['workoutTimeMeasureBtn' + key[0].toUpperCase() + key.slice(1)] = {
        textContent: text, disabled: false, classList: { contains: name => name === 'bg-indigo-600' && selected === key },
        getAttribute: name => name === 'aria-selected' ? String(selected === key) : null
      };
    }

    const target = runtime.context.__targetForTest('workoutTime');
    expect(target.targetElementId).toBe('workoutTimeChartWrapper');
    expect(target.filters).toContainEqual({ label: 'Measure', value: label });
    const group = target.availableControls.find(entry => entry.label === 'Measure');
    expect(group.controls.filter(control => control.selected)).toEqual([{ label, selected: true }]);
    selected = measure === 'count' ? 'duration' : 'count';
    expect(target.filters).toContainEqual({ label: 'Measure', value: label });
    exportable = false;
    expect(runtime.context.__targetForTest('workoutTime')).toBeNull();
    exportable = true;
    expect(runtime.context.__targetForTest('workoutTime')).not.toBeNull();
  });

  it('never draws pinned inspector content into a social export', () => {
    const runtime = createDownloadRuntime();
    const captured = { width: 800, height: 400 };
    const assets = { logo: { naturalWidth: 120, naturalHeight: 60 }, qrCode: {} };
    const target = { key: 'totalDistance', title: 'Distance', pinnedSelection: {
      content: { title: 'Selected run', sections: [{ rows: [{ label: 'Distance', value: '12 km' }] }] },
      anchor: { visibility: 'visible', capturePoint: { x: 0.5, y: 0.5 } }
    } };
    target.captureProtectedRects = [{ x: 0.75, y: 0.1, width: 0.2, height: 0.4 }];
    const layoutHelper = jest.fn(runtime.context.window.exportUtils.computeTooltipCalloutLayout);
    runtime.context.window.exportUtils.computeTooltipCalloutLayout = layoutHelper;
    runtime.context.__drawComposition(captured, target, assets);
    const pinnedDraw = runtime.canvasCalls.images.find(args => args[0] === captured);
    expect(pinnedDraw).toBeDefined();
    expect(layoutHelper).not.toHaveBeenCalled();
    expect(runtime.canvasCalls.paths).toHaveLength(0);
    expect(runtime.canvasCalls.text).not.toContain('Selected run');
    expect(runtime.canvasCalls.text).not.toContain('Distance: 12 km');
    const noPin = createDownloadRuntime();
    noPin.context.__drawComposition(captured, { ...target, pinnedSelection: null }, assets);
    expect(runtime.canvasCalls.fills).toEqual(noPin.canvasCalls.fills);
    expect(noPin.canvasCalls.images.find(args => args[0] === captured)).toEqual(pinnedDraw);
    expect(noPin.canvasCalls.paths).toHaveLength(0);
  });

  it.each(['outside-view', 'not-in-export'])('omits %s inspector details from social exports', visibility => {
    const runtime = createDownloadRuntime();
    runtime.context.__drawComposition({ width: 800, height: 400 }, { title: 'View', pinnedSelection: {
      content: { title: 'Run', notes: ['Detail '.repeat(400)] },
      anchor: { visibility, associationLabel: 'Run: outside this capture' }
    } }, { logo: { naturalWidth: 120, naturalHeight: 60 }, qrCode: {} });
    expect(runtime.canvasCalls.paths).toHaveLength(0);
    expect(runtime.canvasCalls.text.join(' ')).not.toContain('Run: outside this capture');
    expect(runtime.canvasCalls.text.join(' ')).not.toContain('Detail');
  });

  it('omits filter context and expands the chart into the available square canvas', () => {
    const runtime = createDownloadRuntime();
    const captured = { width: 600, height: 900 };
    const target = {
      kind: 'tab',
      key: 'totalDistance',
      title: 'Distance',
      filters: [
        { label: 'Sport', value: 'Run' },
        { label: 'Aggregation', value: 'Yearly' },
        { label: 'Year', value: '2026' }
      ],
      availableControls: [{
        label: 'Views',
        controls: [
          { label: 'Distance option', selected: true },
          { label: 'Weekly option', selected: false }
        ]
      }]
    };

    const result = runtime.context.__drawComposition(captured, target, {
      logo: { naturalWidth: 120, naturalHeight: 60 },
      qrCode: { naturalWidth: 120, naturalHeight: 120 }
    });
    const renderedText = runtime.canvasCalls.text.join(' ');
    const chartDraw = runtime.canvasCalls.images.find(args => args[0] === captured);

    expect(result).toBe(PNG_DATA_URL);
    expect(runtime.canvasCalls.canvases[0]).toMatchObject({ width: 1080, height: 1080 });
    expect(renderedText).not.toContain('Sport: Run');
    expect(renderedText).not.toContain('Aggregation: Yearly');
    expect(renderedText).not.toContain('Year: 2026');
    expect(renderedText).not.toContain('Views');
    expect(renderedText).not.toContain('Distance option');
    expect(renderedText).not.toContain('Weekly option');
    expect(chartDraw).toBeDefined();
    expect(chartDraw[2]).toBeGreaterThanOrEqual(48);
    expect(chartDraw[4]).toBeGreaterThan(700);
    expect(chartDraw[2] + chartDraw[4]).toBeLessThanOrEqual(1032);
  });

  it('includes the active aggregation in the Distance export context', () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const originalGetElementById = context.document.getElementById;
    const button = (textContent, selected) => ({
      textContent,
      disabled: false,
      classList: { contains: name => selected && name === 'bg-indigo-600' },
      getAttribute: () => null
    });
    const elements = {
      totalDistanceChartWrapper: {},
      sportBtnRun: button('Run', true),
      aggBtnYearly: button('Yearly', true),
      timeframe2026: button('2026', true)
    };
    context.window.exportUtils = require('../src/export-utils');
    context.chartInstance = {};
    context.document.getElementById = id => elements[id] || originalGetElementById(id);
    context.document.querySelectorAll = selector => selector === '#timeframeSelector button'
      ? [{ id: 'timeframe2026' }]
      : [];
    vm.runInContext('this.__distanceTarget = () => getTabExportTarget("totalDistance");', context);

    expect(context.__distanceTarget().filters).toEqual([
      { label: 'Sport', value: 'Run' },
      { label: 'Aggregation', value: 'Yearly' },
      { label: 'Timeframe', value: '2026' }
    ]);
  });
});

describe('immutable export selection foundation', () => {
  it('copies allowlisted fields before later mutation and normalizes dates without losing zero or missing values', () => {
    const runtime = createDownloadRuntime();
    const firstDate = new Date('2025-01-02T07:00:00Z');
    const data = { period: '2025', unit: 'km', items: [{ id: 'one', name: 'Long equipment name',
      firstDate, lastDate: null, value: 0, activities: [firstDate] }],
      rawActivities: [{ name: 'PRIVATE ACTIVITY TITLE' }], sourceElement: { nodeType: 1 } };
    const filters = [{ label: 'Mode', value: 'Activities' }];
    const dataset = { activities: ['mutable dashboard data'] };
    runtime.context.snapshotTarget = { kind: 'tab', key: 'equipmentTimeline', hasData: true, filters,
      sampleProvenance: { synthetic: true } };
    runtime.context.snapshotData = data;
    runtime.context.snapshotContext = { dataset };
    const snapshot = vm.runInContext('captureExportSelection(snapshotTarget, snapshotData, snapshotContext)', runtime.context);
    data.items[0].value = 999;
    firstDate.setUTCFullYear(2030);
    filters[0].value = 'Changed';
    expect(snapshot).toMatchObject({ targetKey: 'equipmentTimeline', targetKind: 'tab',
      filters: [{ label: 'Mode', value: 'Activities' }], provenance: { synthetic: true },
      familyData: { items: [{ id: 'one', name: 'Long equipment name',
        firstDate: Date.parse('2025-01-02T07:00:00Z'), lastDate: null, value: 0,
        activities: [Date.parse('2025-01-02T07:00:00Z')] }] } });
    expect(snapshot.familyData.rawActivities).toBeUndefined();
    expect(snapshot.familyData.sourceElement).toBeUndefined();
    expect(Object.isFrozen(snapshot.familyData.items[0])).toBe(true);
    expect(Object.isFrozen(snapshot.filters)).toBe(true);
    expect(Object.isFrozen(dataset)).toBe(false);
  });

  it('gives each new capture a unique selection identity while preserving dataset identity', () => {
    const runtime = createDownloadRuntime();
    runtime.context.snapshotTarget = { kind: 'tab', key: 'totalDistance', hasData: true };
    runtime.context.snapshotData = { period: '2025', series: [{ label: 'Run', values: [0, null, 12] }] };
    runtime.context.snapshotContext = { dataset: { token: 'first' } };
    const capture = () => vm.runInContext('captureExportSelection(snapshotTarget, snapshotData, snapshotContext)', runtime.context);
    const first = capture();
    const second = capture();
    expect(first.selectionId).not.toBe(second.selectionId);
    expect(first.datasetIdentity).toBe(second.datasetIdentity);
    runtime.context.snapshotContext = { dataset: { token: 'second' } };
    expect(capture().datasetIdentity).not.toBe(first.datasetIdentity);
    expect(first.familyData.series[0].values).toEqual([0, null, 12]);
  });

  it('rejects unknown, empty and non-plain export content rather than silently capturing an unrelated view', () => {
    const runtime = createDownloadRuntime();
    runtime.context.snapshotData = { items: [{ id: 'one', value: () => 1 }] };
    for (const target of [{ kind: 'tab', key: 'unknown', hasData: true },
      { kind: 'tab', key: 'equipment', hasData: false }, { kind: 'tab', key: 'equipment', hasData: true }]) {
      runtime.context.snapshotTarget = target;
      expect(() => vm.runInContext('captureExportSelection(snapshotTarget, snapshotData)', runtime.context)).toThrow(/export|content|data|target/i);
    }
  });

  it('registers private descriptor boundaries for every capture target without advertising a generic renderer fallback', () => {
    const runtime = createDownloadRuntime();
    const descriptors = vm.runInContext('EXPORT_ADAPTERS', runtime.context);
    expect(Object.keys(descriptors).sort()).toEqual(Object.keys(runtime.context.__exportTargetIds).sort());
    for (const descriptor of Object.values(descriptors)) {
      expect(typeof descriptor.captureSelection).toBe('function');
      expect(typeof descriptor.renderPage).toBe('function');
      expect(() => descriptor.renderPage({})).toThrow(/renderer|ready|implementation/i);
    }
  });

  it('releases acquired media and partial snapshot DOM when snapshot attachment fails', () => {
    const runtime = createDownloadRuntime();
    const release = jest.fn();
    const remove = jest.fn();
    const clone = { id: '', nodeType: 1, tagName: 'DIV', style: {}, setAttribute() {}, remove,
      querySelectorAll: () => [] };
    runtime.context.sourceElement = { id: 'mediaGalleryExportArea', tagName: 'DIV',
      cloneNode: () => clone, querySelectorAll: () => [],
      getBoundingClientRect: () => ({ width: 960, height: 600 }) };
    runtime.context.window.mediaGalleryDashboard = { acquireExportCapture: () => ({ release }) };
    runtime.context.document.body.appendChild = () => { throw new Error('Synthetic snapshot attachment failure'); };
    expect(() => vm.runInContext('createExportCaptureSnapshot(sourceElement, "mediaGallery")', runtime.context)).toThrow('Synthetic snapshot attachment failure');
    expect(release).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe('F080 T007 compact insight snapshot boundaries', () => {
  function capture(runtime, data) {
    runtime.context.insightTarget = { kind: 'tab', key: 'workoutTime', hasData: true };
    runtime.context.insightData = data;
    return vm.runInContext('captureExportSelection(insightTarget, insightData)', runtime.context);
  }

  it('copies and freezes compact analysis and evidence without retaining activity objects', () => {
    const runtime = createDownloadRuntime();
    const data = {
      startTimeAnalysis: { basis: 'activity-start-count', selectedCount: 12, validStartCount: 10,
        excludedStartCount: 2, windows: [{ key: 'morning', count: 6 }, { key: 'afternoon', count: 2 },
          { key: 'evening', count: 1 }, { key: 'night', count: 1 }], dominantWindow: 'morning', status: 'supported' },
      punchlineEvidence: [{ factKey: 'starts', kind: 'start-window', metric: 'activity starts',
        value: 6, denominator: 10, labels: ['morning'], qualifiers: [], isTie: false }]
    };
    const snapshot = capture(runtime, data);
    data.startTimeAnalysis.windows[0].count = 99;
    data.punchlineEvidence[0].labels[0] = 'changed';
    expect(snapshot.familyData.startTimeAnalysis.windows[0].count).toBe(6);
    expect(snapshot.familyData.punchlineEvidence[0].labels).toEqual(['morning']);
    expect(Object.isFrozen(snapshot.familyData.startTimeAnalysis.windows)).toBe(true);
    expect(Object.isFrozen(snapshot.familyData.punchlineEvidence[0])).toBe(true);
  });

  it('does not open a title, raw-activity or precise-location disclosure path through insights', () => {
    const runtime = createDownloadRuntime();
    const snapshot = capture(runtime, { punchlineEvidence: [{ factKey: 'one', kind: 'selected-total',
      metric: 'activities', value: 0, date: null, title: 'PRIVATE', workoutTitle: 'PRIVATE',
      rawActivities: [{ name: 'PRIVATE' }], latitude: 42, longitude: 7 }] });
    expect(snapshot.familyData.punchlineEvidence[0]).toMatchObject({ value: 0 });
    expect(JSON.stringify(snapshot)).not.toMatch(/PRIVATE|latitude|longitude|rawActivities|workoutTitle/);
  });

  it('rejects invalid numeric or cyclic insight content', () => {
    const runtime = createDownloadRuntime();
    expect(() => capture(runtime, { punchlineEvidence: [{ factKey: 'bad', value: NaN }] })).toThrow(/numeric|evidence/i);
    const cyclic = {};
    cyclic.self = cyclic;
    expect(() => capture(runtime, { startTimeAnalysis: cyclic })).toThrow(/acyclic|analysis|content/i);
  });
});

describe('F080 T010 concise export context', () => {
  it('does not repeat a complete period already named in a media recap headline', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('mediaGallery', { mediaKind: 'annual', period: '2025',
      displayedCount: 12, eligibleCount: 14, metricLabel: 'Selected media' });
    expect(presentation.headline).toContain('2025');
    expect(presentation.contextText).not.toContain('2025');
    expect(presentation.contextText).toContain('12 of 14');
  });

  it('does not repeat a self-explanatory scatter relationship while retaining sport, period and point-size meaning', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('paceMetrics', { sport: 'Run', metric: 'heartRate',
      period: '2024-2025', unit: 'bpm', pointSizeMeaning: 'Duration',
      xAxisTitle: 'Pace (min/km)', yAxisTitle: 'Average heart rate (bpm)' });
    expect(presentation.contextText).not.toMatch(/heart rate|pace/i);
    expect(presentation.contextText).toContain('Run');
    expect(presentation.contextText).toContain('2024–2025');
    expect(presentation.contextText).toMatch(/Size.*Duration/);
    expect(presentation.summary).toContain('Heart rate vs. Pace');
  });

  it('keeps the existing calendar scale qualification inside the compact context without repeating the headline metric', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('trainingCalendar', { sport: 'All',
      metricLabel: 'Daily training frequency', unit: 'activities', period: '2025' });
    expect(presentation.contextText).toMatch(/yearly scale|each year/i);
    expect(presentation.contextText).toMatch(/empty.*no record/i);
    expect(presentation.contextText).not.toContain('Daily training frequency');
    expect(presentation.context.filter(item => item.label === 'Intensity')).toHaveLength(1);
  });

  it('collapses identical boundary years and avoids repeating a metric-embedded unit', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('pb-tile', { title: 'Bike power 5s',
      sport: 'Bike', metricLabel: 'Power (W)', unit: 'W', period: '2025-2025' });
    expect(presentation.contextText).not.toMatch(/2025[-–]2025/);
    expect(presentation.contextText.match(/\bW\b/g)).toHaveLength(1);
    expect(presentation.contextText).toContain('2025');
  });

  it('uses direct values and a short axis relationship without internal filter labels', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('distributions', {
      sport: 'All', metric: 'length', period: '2024-2025', unit: 'km',
      resolution: '2-hour-blocks', xAxisTitle: 'Length', yAxisTitle: 'activities'
    });
    expect(presentation.contextText).toEqual(expect.stringContaining('2024–2025'));
    expect(presentation.contextText).toContain('Length vs activities');
    expect(presentation.contextText).toContain('km');
    expect(presentation.contextText).not.toMatch(/Metric:|Period:|Unit:|X axis:|Y axis:|All sports|2-hour-blocks/);
  });

  it('keeps otherwise invisible sport restrictions and partial-period context', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('paceMetrics', {
      sport: 'Run', metric: 'heartRate', period: '2026 YTD', unit: 'bpm'
    });
    expect(presentation.contextText).toContain('Run');
    expect(presentation.contextText).toContain('2026 YTD');
    expect(presentation.contextText.match(/2026 YTD/g)).toHaveLength(1);
  });
});

describe('F080 T011 structured chart title containment', () => {
  it('wraps long rotated axis titles within the available export chart height without mutating input', () => {
    const runtime = createDownloadRuntime();
    const original = Object.freeze({ type: 'scatter', data: Object.freeze({ datasets: [] }), options: Object.freeze({
      scales: Object.freeze({ y: Object.freeze({ title: Object.freeze({ display: true,
        text: 'Average heart rate with source units (bpm)' }) }) })
    }) });
    const snapshotCapture = jest.fn(() => ({ canvas: { width: 800, height: 400 } }));
    runtime.context.chartResourcesForTest = { chartInput: original, chartAdapter: { snapshotCapture } };
    vm.runInContext("renderChartExportPage({ context: document.createElement('canvas').getContext('2d'), snapshot: {}, page: { visualization: {x:48,y:300,width:800,height:400} }, resources: chartResourcesForTest })", runtime.context);
    const title = snapshotCapture.mock.calls[0][0].chartInput.options.scales.y.title.text;
    expect(Array.isArray(title)).toBe(true);
    expect(title.join(' ')).toBe('Average heart rate with source units (bpm)');
    expect(original.options.scales.y.title.text).toBe('Average heart rate with source units (bpm)');
  });
});

describe('F080 T012 visible story branding', () => {
  it('makes the actual proportional story logo at least 50 percent taller than square', () => {
    const runtime = createDownloadRuntime();
    const source = { targetKey: 'equipment', familyData: { items: [{ name: 'Shoes', value: 1 }] } };
    const logo = { naturalWidth: 250, naturalHeight: 90 };
    const heights = [];
    for (const format of ['square', 'story']) {
      runtime.context.framePlan = runtime.context.window.exportUtils.planExportPages(source, { format });
      runtime.context.frameLogo = logo;
      vm.runInContext('drawStructuredExportFrame(framePlan, { logo: frameLogo })', runtime.context);
      heights.push(runtime.canvasCalls.images.at(-1)[4]);
    }
    expect(heights[1]).toBeGreaterThanOrEqual(heights[0] * 1.5);
  });
});

describe('F080 T013 story session default', () => {
  it('starts each new session with story while keeping explicit choices within the session', () => {
    const runtime = createDownloadRuntime();
    vm.runInContext("selectedExportFormat = 'square'; beginExportSession()", runtime.context);
    expect(runtime.context.__getExportFormat()).toBe('story');
    vm.runInContext("selectedExportFormat = 'portrait'", runtime.context);
    expect(runtime.context.__getExportFormat()).toBe('portrait');
    vm.runInContext('beginExportSession()', runtime.context);
    expect(runtime.context.__getExportFormat()).toBe('story');
  });

  it('lists story first and selected in the existing layout controls', () => {
    const markup = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    expect(markup.indexOf('id="exportFormatStory"')).toBeLessThan(markup.indexOf('id="exportFormatSquare"'));
    expect(markup.match(/<button[^>]*id="exportFormatStory"[^>]*>/)[0]).toContain('aria-pressed="true"');
  });
});

describe('F080 T020 punchline session state', () => {
  it('initializes the confirmed caption independently from drafts and resets only on a new session', () => {
    const runtime = createDownloadRuntime();
    runtime.context.punchlineSnapshot = { selectionId: 'selection-caption', targetKey: 'paceMetrics', familyData: {} };
    vm.runInContext('beginExportSession(punchlineSnapshot)', runtime.context);
    const state = vm.runInContext('exportPunchlineSelection', runtime.context);
    expect(state).toMatchObject({ enabled: true, source: 'default', selectionId: 'selection-caption',
      validationStatus: 'valid', blockedAfterApply: false, hasUnconfirmedDraft: false });
    expect(state.confirmedText).toBeTruthy();
    expect(runtime.elements.exportHumorEnabled.checked).toBe(true);
  });
});

async function preparePunchlineRuntime() {
  const runtime = createDownloadRuntime();
  runtime.closePreview();
  runtime.mockCapture(PNG_DATA_URL);
  await runtime.capture({ kind: 'tab', key: 'paceMetrics', title: 'Training', targetElementId: 'captureTarget', hasData: true });
  return runtime;
}

describe('F080 T022 confirmed punchline transitions', () => {
  it('keeps a draft out of the image until confirmed and renders exact text without HTML interpretation', async () => {
    const runtime = await preparePunchlineRuntime();
    const before = runtime.getImage();
    runtime.context.draftForTest = '  One  two <b>three</b>  ';
    vm.runInContext('setExportPunchlineDraft(draftForTest)', runtime.context);
    expect(runtime.getImage()).toBe(before);
    await vm.runInContext('applyExportPunchline()', runtime.context);
    expect(runtime.getImage().target.presentation.secondaryLine).toBe('One  two <b>three</b>');
    expect(vm.runInContext('exportPunchlineSelection.source', runtime.context)).toBe('custom');
  });

  it('retains the selected text through format and activation changes', async () => {
    const runtime = await preparePunchlineRuntime();
    vm.runInContext("setExportPunchlineDraft('My chosen training caption')", runtime.context);
    await vm.runInContext('applyExportPunchline()', runtime.context);
    await runtime.context.__setExportHumorEnabled(false);
    expect(runtime.getImage().target.presentation.secondaryLine).toBeNull();
    await runtime.context.__setExportFormat('portrait');
    await runtime.context.__setExportHumorEnabled(true);
    expect(runtime.getImage().target.presentation.secondaryLine).toBe('My chosen training caption');
    expect(runtime.context.__getExportFormat()).toBe('portrait');
  });
});

describe('F080 T023 punchline download revision guards', () => {
  it('restores the current confirmed caption when discarding an unapplied draft instead of reverting an older choice', async () => {
    const runtime = await preparePunchlineRuntime();
    vm.runInContext("setExportPunchlineDraft('Confirmed custom caption')", runtime.context);
    await vm.runInContext('applyExportPunchline()', runtime.context);
    vm.runInContext("setExportPunchlineDraft('Unapplied draft')", runtime.context);
    await vm.runInContext('restoreExportPunchline()', runtime.context);
    expect(runtime.getImage().target.presentation.secondaryLine).toBe('Confirmed custom caption');
    expect(vm.runInContext('exportPunchlineSelection.draftText', runtime.context)).toBe('Confirmed custom caption');
    expect(vm.runInContext('exportPunchlineSelection.hasUnconfirmedDraft', runtime.context)).toBe(false);
  });

  it('invalidates an in-flight composition when an invalid draft is applied without starting another render', async () => {
    const runtime = await preparePunchlineRuntime();
    const reached = deferredValue();
    const release = deferredValue();
    runtime.context.invalidRaceReached = reached;
    runtime.context.invalidRaceRelease = release;
    vm.runInContext(`const originalInvalidRacePrepare = prepareExportImage;
      prepareExportImage = async (...args) => { const result = await originalInvalidRacePrepare(...args);
        if (args[1].presentation?.secondaryLine === 'Pending caption') { invalidRaceReached.resolve(); await invalidRaceRelease.promise; }
        return result; }; setExportPunchlineDraft('Pending caption');`, runtime.context);
    const pending = vm.runInContext('applyExportPunchline()', runtime.context);
    await reached.promise;
    vm.runInContext("setExportPunchlineDraft('   ')", runtime.context);
    await vm.runInContext('applyExportPunchline()', runtime.context);
    release.resolve();
    await pending;
    expect(runtime.getImage()).toBeNull();
    expect(runtime.elements.exportPreviewDownloadBtn.disabled).toBe(true);
  });

  it('blocks an obsolete download after invalid Apply, then supports explicit restore and caption-off recovery', async () => {
    const runtime = await preparePunchlineRuntime();
    const original = runtime.getImage().target.presentation.secondaryLine;
    vm.runInContext("setExportPunchlineDraft('   ')", runtime.context);
    await vm.runInContext('applyExportPunchline()', runtime.context);
    expect(runtime.elements.exportPreviewDownloadBtn.disabled).toBe(true);
    await runtime.download();
    expect(runtime.downloadLinks).toHaveLength(0);
    await vm.runInContext('restoreExportPunchline()', runtime.context);
    expect(runtime.elements.exportPreviewDownloadBtn.disabled).toBe(false);
    expect(runtime.getImage().target.presentation.secondaryLine).toBe(original);
    vm.runInContext("setExportPunchlineDraft('x'.repeat(121))", runtime.context);
    await vm.runInContext('applyExportPunchline()', runtime.context);
    await runtime.context.__setExportHumorEnabled(false);
    expect(runtime.elements.exportPreviewDownloadBtn.disabled).toBe(false);
    expect(runtime.getImage().target.presentation.secondaryLine).toBeNull();
  });

  it('cannot let a delayed older caption overwrite the latest confirmed revision', async () => {
    const runtime = await preparePunchlineRuntime();
    const olderReached = deferredValue();
    const releaseOlder = deferredValue();
    runtime.context.olderReached = olderReached;
    runtime.context.releaseOlder = releaseOlder;
    vm.runInContext(`const originalPunchlinePrepare = prepareExportImage;
      prepareExportImage = async (...args) => { const result = await originalPunchlinePrepare(...args);
        if (args[1].presentation?.secondaryLine === 'Older caption') { olderReached.resolve(); await releaseOlder.promise; }
        return result; }; setExportPunchlineDraft('Older caption');`, runtime.context);
    const older = vm.runInContext('applyExportPunchline()', runtime.context);
    await olderReached.promise;
    vm.runInContext("setExportPunchlineDraft('Latest caption')", runtime.context);
    await vm.runInContext('applyExportPunchline()', runtime.context);
    releaseOlder.resolve();
    await older;
    expect(runtime.getImage().target.presentation.secondaryLine).toBe('Latest caption');
  });
});

describe('F080 T024 series axis label containment', () => {
  it('keeps endpoint year labels inside the export region while retaining their actual tick values', () => {
    const runtime = createDownloadRuntime();
    const start = Date.UTC(2013, 0, 4);
    const end = Date.UTC(2025, 8, 8);
    runtime.context.timelineReviewSnapshot = { targetKey: 'equipmentTimeline', familyData: {
      mode: 'activities', items: [{ name: 'Synthetic shoes', firstDate: start, lastDate: end,
        activities: [start, end] }] } };
    runtime.context.timelineReviewPlan = runtime.context.window.exportUtils.planExportPages(runtime.context.timelineReviewSnapshot,
      { format: 'square', humorEnabled: false });
    vm.runInContext("renderEquipmentExportPage({ context: document.createElement('canvas').getContext('2d'), snapshot: timelineReviewSnapshot, page: timelineReviewPlan.pages[0] })", runtime.context);
    const bounds = runtime.context.timelineReviewPlan.pages[0].visualization;
    const years = runtime.canvasCalls.textPositions.filter(item => /^\d{4}$/.test(item.text));
    expect(years.map(item => item.text)).toEqual(expect.arrayContaining(['2013', '2025']));
    for (const year of years) {
      const halfWidth = year.text.length * 12 / 2;
      expect(year.x - halfWidth).toBeGreaterThanOrEqual(bounds.x);
      expect(year.x + halfWidth).toBeLessThanOrEqual(bounds.x + bounds.width);
    }
  });
});

function reviewPbData(runtime, records, extra = {}) {
  runtime.context.pbReviewModel = { title: 'Run 5 km', exportKey: 'Run-5km', sport: 'Run', axisLabel: 'Time',
    direction: 'down', records, formatValue: value => String(value), ...extra };
  return vm.runInContext('buildPbExportData(pbReviewModel)', runtime.context);
}

function capturePbChart(runtime, data) {
  const configs = [];
  runtime.context.window.Chart = jest.fn(function (_canvas, config) {
    configs.push(config);
    return { update() {}, destroy() {} };
  });
  runtime.context.pbChartReviewData = data;
  vm.runInContext('createPbExportChart(pbChartReviewData, { width: 888, height: 400 })', runtime.context);
  return configs[0];
}

describe('F080 T029 attributed PB export records', () => {
  it('uses the already associated source and preserves values while normalizing source dates', () => {
    const runtime = createDownloadRuntime();
    const first = new Date('2024-12-31T00:00:00Z');
    const second = new Date('2025-01-01T00:00:00Z');
    const model = reviewPbData(runtime, [
      { value: 1200, date: first, title: 'Wrapper label', record: { name: 'Track morning', date: first,
        effortSource: 'modeled', isInterimEstimated: true, distance: 5, sourceDistance: 10 } },
      { value: 1100, date: null, record: { name: 'New year workout', date: second, effortSource: 'full-activity' } }
    ]);
    expect(model.records.map(record => record.value)).toEqual([1200, 1100]);
    expect(model.records[0].source).toMatchObject({ workoutTitle: 'Track morning', activityDate: first.getTime(),
      kind: 'modeled', estimated: true, sourceDistanceKm: 10 });
    expect(model.records[1].source).toMatchObject({ workoutTitle: 'New year workout', activityDate: second.getTime(),
      kind: 'full-activity', estimated: false });
    expect(model.records[1].date).toEqual(second);
    expect(model.best.source.workoutTitle).toBe('New year workout');
    expect(model.sourceAttribution).not.toMatch(/modeled|full-activity/);
  });

  it('keeps missing dates missing, retains the real epoch zero date and invents no source title', () => {
    const runtime = createDownloadRuntime();
    const model = reviewPbData(runtime, [{ value: 0, date: 0 }, { value: 1, date: 'invalid' }]);
    expect(model.records[0].date.getTime()).toBe(0);
    expect(model.records[0].source).toMatchObject({ workoutTitle: null, activityDate: 0 });
    expect(model.records[1].date).toBeNull();
    expect(model.records[1].source).toMatchObject({ workoutTitle: null, activityDate: null, kind: 'unknown' });
  });
});

describe('F080 T030 PB-only source disclosure', () => {
  it('permits a schema-valid source only at associated PB record paths', () => {
    const runtime = createDownloadRuntime();
    const source = { workoutTitle: 'Approved workout', activityDate: Date.UTC(2025, 0, 1), kind: 'modeled',
      estimated: true, rawActivity: { name: 'PRIVATE' }, latitude: 42, nested: { workoutTitle: 'PRIVATE' } };
    runtime.context.pbSourceTarget = { key: 'personalBests', kind: 'tab', hasData: true };
    runtime.context.pbSourceData = { records: [{ value: 1200, date: Date.UTC(2025, 0, 1), source }],
      groups: [{ definitionKey: 'Run-5km', title: 'Run 5 km', records: [{ value: 1200, source }] }],
      items: [{ source: { workoutTitle: 'PRIVATE' } }] };
    const snapshot = vm.runInContext('captureExportSelection(pbSourceTarget, pbSourceData)', runtime.context);
    expect(snapshot.familyData.records[0].source.workoutTitle).toBe('Approved workout');
    expect(snapshot.familyData.groups[0].records[0].source.workoutTitle).toBe('Approved workout');
    expect(JSON.stringify(snapshot)).not.toMatch(/PRIVATE|latitude|rawActivity/);
    expect(Object.isFrozen(snapshot.familyData.records[0].source)).toBe(true);
    runtime.context.pbSourceTarget.key = 'equipment';
    const other = vm.runInContext('captureExportSelection(pbSourceTarget, pbSourceData)', runtime.context);
    expect(JSON.stringify(other)).not.toContain('Approved workout');
  });

  it('rejects invalid source field types rather than broadly allowing nested personal metadata', () => {
    const runtime = createDownloadRuntime();
    runtime.context.pbSourceTarget = { key: 'personalBests', hasData: true };
    runtime.context.pbSourceData = { records: [{ value: 1200, source: { workoutTitle: { name: 'PRIVATE' },
      kind: 'modeled', estimated: 'yes' } }] };
    expect(() => vm.runInContext('captureExportSelection(pbSourceTarget, pbSourceData)', runtime.context))
      .toThrow(/source|title|schema/i);
  });
});

describe('F080 T031 understandable PB source rows', () => {
  it('renders the workout title and the estimation meaning instead of an internal source code', () => {
    const runtime = createDownloadRuntime();
    runtime.context.window.Chart = jest.fn(function () { return { update() {}, destroy() {} }; });
    runtime.context.pbRowSnapshot = { targetKey: 'personalBests', familyData: { unit: 's', xAxisMode: 'time',
      records: [{ date: Date.UTC(2025, 0, 1), value: 1200, displayValue: '20:00', sourceType: 'modeled',
        source: { workoutTitle: 'Track morning', activityDate: Date.UTC(2025, 0, 1), kind: 'modeled', estimated: true } }] } };
    runtime.context.pbRowPlan = runtime.context.window.exportUtils.planExportPages(runtime.context.pbRowSnapshot, { format: 'story' });
    vm.runInContext("renderPbExportPage({ context: document.createElement('canvas').getContext('2d'), snapshot: pbRowSnapshot, page: pbRowPlan.pages[0] })", runtime.context);
    expect(runtime.canvasCalls.text.join(' ')).toContain('Track morning');
    expect(runtime.canvasCalls.text.join(' ')).toMatch(/estimated/i);
    expect(runtime.canvasCalls.text.join(' ')).not.toContain('modeled');
  });
});

describe('F080 T032 data-bound PB calendar axes', () => {
  it('selects date ticks by real temporal spacing rather than evenly spaced record indexes', () => {
    const runtime = createDownloadRuntime();
    const dates = [Date.UTC(2013, 0, 4), Date.UTC(2013, 8, 8), Date.UTC(2016, 8, 8), Date.UTC(2025, 8, 8)];
    const config = capturePbChart(runtime, { xAxisMode: 'time', unit: 'm',
      records: dates.map((date, index) => ({ date, value: 100 + index * 10 })) });
    const axis = { ticks: [] };
    config.options.scales.x.afterBuildTicks(axis);
    const ticks = axis.ticks.map(tick => tick.value);
    expect(ticks[0]).toBe(dates[0]);
    expect(ticks.at(-1)).toBe(dates.at(-1));
    for (let index = 1; index < ticks.length; index++) {
      const spacing = (ticks[index] - ticks[index - 1]) / (dates.at(-1) - dates[0]) * (888 - 200);
      const left = config.options.scales.x.ticks.callback(ticks[index - 1]).length * 12;
      const right = config.options.scales.x.ticks.callback(ticks[index]).length * 12;
      expect(spacing).toBeGreaterThanOrEqual((left + right) / 2 + 24);
    }
  });

  it('preserves a real leap day without generating substitute observation dates', () => {
    const runtime = createDownloadRuntime();
    const leapDay = Date.UTC(2024, 1, 29);
    const nextDay = Date.UTC(2024, 2, 1);
    const config = capturePbChart(runtime, { xAxisMode: 'time', unit: 's', records: [
      { date: leapDay, value: 1300 }, { date: nextDay, value: 1200 } ] });
    expect(config.data.datasets[0].data.map(point => point.x)).toEqual([leapDay, nextDay]);
    expect(config.options.scales.x.ticks.callback(leapDay)).toBe('29 Feb 2024');
    expect(config.options.scales.x.ticks.callback(nextDay)).toBe('01 Mar 2024');
  });

  it('uses short, multiline time units rather than clipping a long rotated PB axis title', () => {
    const runtime = createDownloadRuntime();
    const config = capturePbChart(runtime, { xAxisMode: 'time', unit: 's',
      records: [{ date: Date.UTC(2025, 0, 1), value: 1200 }] });
    expect(config.options.scales.y.title.text).toEqual(['Time', '(h:m:s)']);
  });

  it('uses observation extent and unambiguous year labels rather than an unrelated dataset period', () => {
    const runtime = createDownloadRuntime();
    const first = Date.UTC(2024, 11, 31);
    const last = Date.UTC(2025, 0, 1);
    const config = capturePbChart(runtime, { xAxisMode: 'time', unit: 's', periodStart: Date.UTC(1990, 0, 1),
      periodEnd: Date.UTC(2030, 0, 1), records: [{ date: first, value: 1300 }, { date: last, value: 1200 }] });
    expect(config.options.scales.x.min).toBe(first);
    expect(config.options.scales.x.max).toBe(last);
    expect(config.options.scales.x.ticks.callback(first)).toContain('2024');
    expect(config.options.scales.x.ticks.callback(last)).toContain('2025');
  });

  it('keeps real same-day points without a trend line and does not position missing dates at epoch zero', () => {
    const runtime = createDownloadRuntime();
    const date = Date.UTC(2025, 1, 1);
    const config = capturePbChart(runtime, { xAxisMode: 'time', unit: 's',
      records: [{ date, value: 1300 }, { date, value: 1200 }, { date: null, value: 0 }] });
    expect(config.data.datasets[0].data).toEqual([{ x: date, y: 1300 }, { x: date, y: 1200 }]);
    expect(config.data.datasets[0].showLine).toBe(false);
  });
});

describe('F080 T034 independent duration-profile sources', () => {
  it('keeps undated values and their titles visible without constructing a calendar chart', () => {
    const runtime = createDownloadRuntime();
    const data = reviewPbData(runtime, [
      { value: 1200, date: null, record: { name: 'Undated workout', effortSource: 'full-activity' } },
      { value: 1100, date: null, record: { name: 'Another undated workout', effortSource: 'full-activity' } }
    ]);
    runtime.context.window.Chart = jest.fn(() => { throw new Error('Undated records must not create a time chart'); });
    runtime.context.undatedPbSnapshot = { targetKey: 'personalBests', familyData: data };
    runtime.context.undatedPbPlan = runtime.context.window.exportUtils.planExportPages(runtime.context.undatedPbSnapshot, { format: 'story' });
    vm.runInContext("renderPbExportPage({ context: document.createElement('canvas').getContext('2d'), snapshot: undatedPbSnapshot, page: undatedPbPlan.pages[0] })", runtime.context);
    expect(runtime.context.window.Chart).not.toHaveBeenCalled();
    expect(runtime.canvasCalls.text.join(' ')).toContain('Date unavailable');
    expect(runtime.canvasCalls.text.join(' ')).toContain('Undated workout');
    expect(runtime.canvasCalls.text.join(' ')).not.toContain('1970');
  });

  it('does not describe same-day values as a chronological improvement story', () => {
    const runtime = createDownloadRuntime();
    const date = new Date('2025-01-01');
    const model = reviewPbData(runtime, [{ value: 1300, date, title: 'First effort' }, { value: 1200, date, title: 'Second effort' }]);
    expect(runtime.context.__socialPresentation('pb-tile', model, { humorEnabled: false }).summary).toBeNull();
  });

  it('retains the duration axis and individual workout sources without implying chronological improvement', () => {
    const runtime = createDownloadRuntime();
    const model = reviewPbData(runtime, [
      { value: 400, date: new Date('2025-01-02'), durationSeconds: 60, durationLabel: '1m', record: { name: 'Short effort', effortSource: 'fit-rolling' } },
      { value: 250, date: new Date('2024-05-01'), durationSeconds: 300, durationLabel: '5m', record: { name: 'Long effort', effortSource: 'fit-rolling' } }
    ], { xAxisMode: 'duration-category', axisLabel: 'Power (W)', sport: 'Bike' });
    expect(model.records.map(record => record.source.workoutTitle)).toEqual(['Short effort', 'Long effort']);
    expect(model.milestones).toEqual([]);
    expect(model.firstRecord).toBeNull();
    expect(model.best).toBeNull();
    const config = capturePbChart(runtime, model);
    expect(config.options.scales.x.type).toBe('category');
    expect(config.data.labels).toEqual(['1m', '5m']);
    expect(config.data.datasets[0].data).toEqual([400, 250]);
  });
});

describe('F080 T042 quantitative family evidence projections', () => {
  it('does not present normalized equipment pace bars as actual pace or speed units', () => {
    const runtime = createDownloadRuntime();
    runtime.context.projectionSnapshot = { targetKey: 'equipment', familyData: { metric: 'pace', unit: null,
      equipmentFilter: 'All', items: [{ name: 'Shoes', value: 1 }, { name: 'Bike', value: 0.8 }] } };
    const fact = vm.runInContext('projectExportPunchlineEvidence(projectionSnapshot)', runtime.context).evidence[0];
    expect(fact).toMatchObject({ metric: 'Relative pace/speed ranking', unit: 'relative score', value: 1 });
    expect(fact.qualifiers.join(' ')).toMatch(/relative|normalized/i);
    expect(fact.qualifiers.join(' ')).toMatch(/equipment type|cross-sport/i);
  });

  it('uses a readable Pie measure rather than the internal count mode name', () => {
    const runtime = createDownloadRuntime();
    runtime.context.projectionSnapshot = { targetKey: 'pieCharts', familyData: { metric: 'count', unit: 'activities',
      slices: [{ label: 'Run', value: 2 }, { label: 'Bike', value: 1 }] } };
    expect(vm.runInContext('projectExportPunchlineEvidence(projectionSnapshot)', runtime.context).evidence[0].metric).toBe('Activities');
  });

  test.each([
    ['totalDistance', { metricLabel: 'Distance', unit: 'km', periodLabels: ['2024', '2025'],
      series: [{ values: [10, 20] }], incompleteYear: 2025 }, { value: 20, unit: 'km', labels: ['2025'] }],
    ['equipment', { metricLabel: 'Duration', unit: 'h', items: [{ name: 'Shoes A', value: 12 }, { name: 'Shoes B', value: 12 }] },
      { value: 12, unit: 'h', labels: ['Shoes A', 'Shoes B'], isTie: true }],
    ['distributions', { metricLabel: 'Length', unit: 'km', bins: [{ label: '0-5', count: 7 }, { label: '5-10', count: 3 }] },
      { value: 7, unit: 'activities', labels: ['0-5'] }],
    ['wordcloud', { words: [{ text: 'recovery', count: 7 }, { text: 'steady', count: 5 }] },
      { value: 7, labels: ['recovery'] }],
    ['pieCharts', { metric: 'distance', unit: 'km', slices: [{ label: 'Run', value: 20 }, { label: 'Bike', value: 10 }] },
      { value: 20, unit: 'km', labels: ['Run'] }],
    ['personalBests', { metricLabel: 'Time', unit: 's', best: { value: 1200, source: { estimated: true } } },
      { value: 1200, unit: 's', kind: 'record-value' }],
    ['lifetimeStatistics', { summary: { workoutCount: 12, distance: { value: 100, status: 'partial' } } },
      { value: 12, unit: 'activities', metric: 'Workouts' }]
  ])('uses only existing typed values for %s', (targetKey, familyData, expected) => {
    const runtime = createDownloadRuntime();
    runtime.context.projectionSnapshot = { selectionId: 'selection-projection', targetKey, familyData };
    const before = JSON.stringify(familyData);
    const result = vm.runInContext('projectExportPunchlineEvidence(projectionSnapshot)', runtime.context);
    expect(result.evidence[0]).toMatchObject(expected);
    expect(JSON.stringify(familyData)).toBe(before);
    if (targetKey === 'personalBests') expect(result.evidence[0].qualifiers.join(' ')).toMatch(/estimated/i);
    if (targetKey === 'totalDistance') expect(result.evidence[0].qualifiers.join(' ')).toMatch(/partial|incomplete/i);
  });

  it('does not infer a sole leader when a category value is missing', () => {
    const runtime = createDownloadRuntime();
    runtime.context.projectionSnapshot = { targetKey: 'equipment', familyData: {
      items: [{ name: 'Known', value: 12 }, { name: 'Unknown', value: null }] } };
    const result = vm.runInContext('projectExportPunchlineEvidence(projectionSnapshot)', runtime.context);
    expect(result.evidence).toEqual([]);
    expect(result.neutralReason).toBeTruthy();
  });
});

describe('F080 T043 contextual family evidence boundaries', () => {
  test.each([
    ['paceMetrics', { points: [{ x: 5, y: 140 }, { x: 6, y: 130 }] }, 2, 'observations'],
    ['equipmentTimeline', { items: [{ name: 'Shoes A', firstDate: 1, lastDate: 100 }, { name: 'Shoes B' }] }, 2, 'equipment items'],
    ['trainingCalendar', { years: [{ year: 2024, activityCount: 3 }, { year: 2025, activityCount: 2 }] }, 5, 'activities'],
    ['mediaGallery', { displayedCount: 4, eligibleCount: 10, includeRoutes: false }, 4, 'media items'],
    ['heatmap', { activityCount: 3, viewport: { width: 900, height: 600 } }, 3, 'activities']
  ])('uses the existing explicit selection count for %s without inventing performance', (targetKey, familyData, value, unit) => {
    const runtime = createDownloadRuntime();
    runtime.context.contextProjectionSnapshot = { targetKey, familyData };
    const result = vm.runInContext('projectExportPunchlineEvidence(contextProjectionSnapshot)', runtime.context);
    expect(result.evidence[0]).toMatchObject({ kind: 'selected-total', value, unit });
    expect(JSON.stringify(result)).not.toMatch(/fastest|improved|streak|healthy|PRIVATE|latitude|longitude/i);
  });

  it('does not turn map pixels or first/last usage dates into unsupported achievements', () => {
    const runtime = createDownloadRuntime();
    runtime.context.contextProjectionSnapshot = { targetKey: 'heatmap', familyData: {
      viewport: { width: 900, height: 600 }, scale: { minCount: 1, maxCount: 10 },
      latitude: 42, longitude: 7, activityTitle: 'PRIVATE' } };
    const result = vm.runInContext('projectExportPunchlineEvidence(contextProjectionSnapshot)', runtime.context);
    expect(result.evidence).toEqual([]);
    expect(result.neutralReason).toMatch(/map|route|count/i);
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|latitude|longitude|country/i);
  });
});

describe('F080 T044 visible selection-bound suggestion evidence', () => {
  it('shows valid/excluded starts and their measurement basis without changing it to distance', () => {
    const runtime = createDownloadRuntime();
    runtime.elements.exportPunchlineEvidence = { textContent: '', classList: { add: jest.fn(), toggle: jest.fn() } };
    runtime.context.evidenceSnapshot = { selectionId: 'selection-evidence', targetKey: 'workoutTime', familyData: {
      metric: 'distance', period: '2025 YTD', sport: 'Run', startTimeAnalysis: {
        basis: 'activity-start-count', selectedCount: 12, validStartCount: 10, excludedStartCount: 2,
        windows: [{ key: 'morning', count: 6 }, { key: 'afternoon', count: 4 }, { key: 'evening', count: 0 }, { key: 'night', count: 0 }]
      } } };
    vm.runInContext('beginExportSession(evidenceSnapshot)', runtime.context);
    expect(vm.runInContext('exportPunchlineSelection.confirmedText', runtime.context)).toBe('Morning bird');
    expect(runtime.elements.exportPunchlineEvidence.textContent).toMatch(/10 valid|6.*10/i);
    expect(runtime.elements.exportPunchlineEvidence.textContent).toMatch(/2 excluded/i);
    expect(runtime.elements.exportPunchlineEvidence.textContent).toMatch(/activity starts/i);
    expect(runtime.elements.exportPunchlineEvidence.textContent).toContain('2025 YTD');
    expect(runtime.elements.exportPunchlineEvidence.textContent).toContain('Run');
  });

  it('explains unavailable local-time coverage without a fabricated habit label', () => {
    const runtime = createDownloadRuntime();
    runtime.elements.exportPunchlineEvidence = { textContent: '', classList: { add: jest.fn(), toggle: jest.fn() } };
    runtime.context.evidenceSnapshot = { selectionId: 'selection-insufficient', targetKey: 'workoutTime', familyData: {
      startTimeAnalysis: { basis: 'activity-start-count', selectedCount: 9, validStartCount: 9, excludedStartCount: 0,
        status: 'insufficient-data', windows: [{ key: 'morning', count: 9 }, { key: 'afternoon', count: 0 },
          { key: 'evening', count: 0 }, { key: 'night', count: 0 }] } } };
    vm.runInContext('beginExportSession(evidenceSnapshot)', runtime.context);
    expect(runtime.elements.exportPunchlineEvidence.textContent).toMatch(/9 valid|at least 10/i);
    expect(vm.runInContext('exportPunchlineSelection.confirmedText', runtime.context)).not.toMatch(/Morning bird|Night owl/);
  });
});

describe('F080 T045 frozen suggestion selection', () => {
  it('does not rescan mutated activities or replace a confirmed custom text during presentation updates', async () => {
    const runtime = createDownloadRuntime();
    runtime.context.frozenEvidenceTarget = { key: 'workoutTime', hasData: true };
    const analysis = { basis: 'activity-start-count', selectedCount: 10, validStartCount: 10, excludedStartCount: 0,
      windows: [{ key: 'morning', count: 6 }, { key: 'afternoon', count: 4 }, { key: 'evening', count: 0 }, { key: 'night', count: 0 }] };
    runtime.context.frozenEvidenceData = { startTimeAnalysis: analysis, sport: 'Run', period: '2025' };
    vm.runInContext('this.frozenEvidenceSnapshot = captureExportSelection(frozenEvidenceTarget, frozenEvidenceData); beginExportSession(frozenEvidenceSnapshot)', runtime.context);
    analysis.windows[0].count = 0;
    analysis.windows[3].count = 10;
    expect(vm.runInContext('exportPunchlineSelection.suggestions[0].text', runtime.context)).toBe('Morning bird');
    vm.runInContext("setExportPunchlineDraft('My own statement')", runtime.context);
    await vm.runInContext('applyExportPunchline()', runtime.context);
    await runtime.context.__setExportFormat('portrait');
    vm.runInContext('updateExportPunchlineControls()', runtime.context);
    expect(vm.runInContext('exportPunchlineSelection.source', runtime.context)).toBe('custom');
    expect(vm.runInContext('exportPunchlineSelection.confirmedText', runtime.context)).toBe('My own statement');
    expect(vm.runInContext('frozenEvidenceSnapshot.familyData.startTimeAnalysis.windows[0].count', runtime.context)).toBe(6);
  });
});

describe('F080 T051 final scatter tick readability', () => {
  it.each(['paceMetrics', 'distributions', 'workoutTime'])('limits long %s export ticks without mutating chart data or dashboard options', targetKey => {
    const runtime = createDownloadRuntime();
    const ticks = Object.freeze({ autoSkip: false, maxTicksLimit: 12 });
    const chartInput = Object.freeze({ type: 'scatter', data: Object.freeze({ datasets: [] }),
      options: Object.freeze({ scales: Object.freeze({ x: Object.freeze({ type: 'linear', ticks }) }) }) });
    const snapshotCapture = jest.fn(() => ({ canvas: { width: 984, height: 400 } }));
    runtime.context.finalScatterResources = { chartInput, chartAdapter: { snapshotCapture } };
    runtime.context.finalChartTargetKey = targetKey;
    vm.runInContext("renderChartExportPage({ context: document.createElement('canvas').getContext('2d'), snapshot: {targetKey:finalChartTargetKey}, page: {visualization:{x:48,y:300,width:984,height:400}}, resources:finalScatterResources })", runtime.context);
    const prepared = snapshotCapture.mock.calls[0][0].chartInput;
    expect(prepared.options.scales.x.ticks.autoSkip).toBe(true);
    expect(prepared.options.scales.x.ticks.maxTicksLimit).toBeLessThanOrEqual(4);
    expect(prepared.data).toBe(chartInput.data);
    expect(chartInput.options.scales.x.ticks.maxTicksLimit).toBe(12);
    expect(chartInput.options.scales.x.ticks.autoSkip).toBe(false);
  });
});

describe('full social export renderer coverage', () => {
  it('samples dense date ticks by measured label width without dropping plotted periods', () => {
    const runtime = createDownloadRuntime();
    runtime.context.tickContext = runtime.context.document.createElement('canvas').getContext('2d');
    runtime.context.tickData = { aggregation: 'daily', periodLabels: Array.from({ length: 100 },
      (_, index) => `Wednesday ${String(index + 1).padStart(2, '0')} September 2025`),
      series: [{ label: 'Run', values: Array.from({ length: 100 }, () => 10), color: '#20c9b2' }] };
    expect(() => vm.runInContext('drawDistanceExportChart(tickContext, tickData, { x: 72, y: 600, width: 888, height: 700 })', runtime.context)).not.toThrow();
    expect(runtime.canvasCalls.text.join(' ')).toContain('Wednesday 01 September 2025');
    expect(runtime.canvasCalls.text.join(' ')).toContain('Wednesday 100 September 2025');
  });

  it('prepares and approves the complete structured story image at actual PNG dimensions', async () => {
    const png = createSizedPngDataUrl(1080, 1920);
    const runtime = createDownloadRuntime({ imageWidth: 1080, imageHeight: 1920, pngDataUrl: png });
    runtime.closePreview();
    runtime.mockCapture(png);
    await runtime.context.__setExportFormat('story');
    runtime.context.structuredTarget = { kind: 'tab', key: 'equipment', title: 'Equipment', hasData: true };
    runtime.context.structuredData = { metric: 'distance', unit: 'km', period: '2025', equipmentFilter: 'Shoes',
      items: [{ id: 'one', name: 'Only pair', value: 12, displayValue: '12 km' }], totalCount: 1 };
    vm.runInContext('structuredTarget.selectionSnapshot = captureExportSelection(structuredTarget, structuredData);', runtime.context);
    await runtime.capture(runtime.context.structuredTarget);
    expect(runtime.getImage()).toMatchObject({ width: 1080, height: 1920,
      target: { format: 'story', seriesPage: 1, seriesCount: 1, selectionSnapshot: { targetKey: 'equipment' } } });
    expect(runtime.elements.exportPreviewImage.src).toBe(png);
    expect(runtime.canvasCalls.text).toContain('Only pair');
    expect(runtime.canvasCalls.text).toContain('12 km');
  });

  it.each(['paceMetrics', 'distributions', 'workoutTime'])('renders %s from the isolated frozen chart source at final dimensions', key => {
    const runtime = createDownloadRuntime();
    const canvas = { width: 888, height: 600 };
    const snapshotCapture = jest.fn(() => ({ canvas }));
    runtime.context.chartPageInput = {
      snapshot: { targetKey: key, familyData: {} },
      page: { visualization: { x: 72, y: 600, width: 888, height: 600 } },
      context: runtime.context.document.createElement('canvas').getContext('2d'),
      resources: { chartAdapter: { snapshotCapture }, chartInput: { data: { datasets: [] }, visibility: [] } }
    };
    vm.runInContext(`EXPORT_ADAPTERS['${key}'].renderPage(chartPageInput)`, runtime.context);
    expect(snapshotCapture).toHaveBeenCalledWith(expect.objectContaining({
      width: 888, height: 600, minFontSize: 36, includeInspection: false,
      chartInput: runtime.context.chartPageInput.resources.chartInput
    }));
    expect(runtime.canvasCalls.images).toContainEqual([canvas, 72, 600, 888, 600]);
  });

  it('draws the measured story frame inside its central bounds at readable source size', () => {
    const runtime = createDownloadRuntime();
    const positions = [];
    const context = runtime.context.document.createElement('canvas').getContext('2d');
    context.fillText = function (text, x, y) { positions.push({ text, x, y, font: this.font }); };
    runtime.context.framePlan = runtime.context.window.exportUtils.planExportPages({ targetKey: 'equipment',
      period: '2025', metric: 'Distance', units: 'km', provenance: { synthetic: true },
      familyData: { items: [{ name: 'Only pair', value: 12 }] } },
    { format: 'story', headline: 'My equipment distance', humorEnabled: true, caption: 'They have seen things.' });
    const frame = vm.runInContext('drawStructuredExportFrame(framePlan, {})', runtime.context);
    expect(frame.canvas).toMatchObject({ width: 1080, height: 1920 });
    expect(positions.map(item => item.text)).toEqual(expect.arrayContaining([
      'My equipment distance', 'Synthetic sample training data', 'They have seen things.', 'TriAnalytica', 'https://example.test/'
    ]));
    for (const item of positions) {
      expect(item.x).toBeGreaterThanOrEqual(72);
      expect(item.y).toBeGreaterThanOrEqual(240);
      expect(item.y + Number(item.font.match(/(\d+)px/)[1])).toBeLessThanOrEqual(1560);
      expect(Number(item.font.match(/(\d+)px/)[1])).toBeGreaterThanOrEqual(36);
    }
  });

  it('keeps power-profile duration axes, FIT attribution and individually associated titles without inventing milestones', () => {
    const runtime = createDownloadRuntime();
    runtime.openPb({ title: 'All-time bike power profile', exportKey: 'Bike-power-all-time-profile',
      axisLabel: 'Power (W)', sport: 'Bike', direction: 'up', xAxisMode: 'duration',
      records: [
        { date: new Date('2025-01-04'), value: 600, durationSeconds: 5, durationLabel: '5s', effortSource: 'fit-rolling', title: 'PRIVATE TITLE ONE' },
        { date: new Date('2025-01-04'), value: 240, durationSeconds: 3600, durationLabel: '60m', effortSource: 'fit-rolling', title: 'PRIVATE TITLE TWO' }
      ] }, { focus() {} });
    const model = runtime.context.window.personalBestsDashboard.getActiveExportData();
    expect(model).toMatchObject({ xAxisMode: 'duration', sport: 'Bike', unit: 'W' });
    expect(model.records.map(record => [record.durationSeconds, record.durationLabel])).toEqual([[5, '5s'], [3600, '60m']]);
    expect(model.sourceAttribution).toMatch(/fit/i);
    expect(model.milestones).toEqual([]);
    expect(model.records.map(record => record.source.workoutTitle)).toEqual(['PRIVATE TITLE ONE', 'PRIVATE TITLE TWO']);
    expect(model.records.every(record => !record.record && !record.rawActivity && !record.activity && !record.name && !record.title)).toBe(true);
  });

  it('registers a deliberate renderer for every export target instead of a generic story screenshot fallback', () => {
    const runtime = createDownloadRuntime();
    const rendererKeys = vm.runInContext('Object.keys(EXPORT_FAMILY_RENDERERS)', runtime.context);
    expect(Array.from(rendererKeys).sort()).toEqual(Object.keys(runtime.context.__exportTargetIds).sort());
  });
});

describe('dashboard export download destination', () => {
  it('uses the visible Pace vs bubble years and their colors in the export legend', () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    context.chartInstance = null;
    const selectedButton = label => ({
      disabled: false,
      textContent: label,
      classList: { contains: value => value === 'bg-indigo-600' },
      getAttribute: () => null
    });
    const elements = {
      paceMetricsChartWrapper: { id: 'paceMetricsChartWrapper' },
      paceMetricsEmptyState: { classList: { contains: () => true } },
      paceMetricsSportBtnRun: selectedButton('Run'),
      paceMetricsMetricBtnheartRate: selectedButton('Average heart rate'),
      scatterRangeLabel: { textContent: '2023 - 2024' }
    };
    const getOriginalElement = context.document.getElementById;
    context.document.getElementById = id => elements[id] || getOriginalElement(id);
    context.document.querySelectorAll = () => [];
    context.window.paceMetricsDashboard = {
      getExportSeries: () => [
        { label: '2023', color: '#f00' },
        { label: '2024', color: '#0f0' }
      ]
    };

    expect(context.__targetForTest('paceMetrics').legend).toEqual({
      title: 'Years',
      items: [
        { label: '2023', color: '#f00' },
        { label: '2024', color: '#0f0' }
      ]
    });
  });

  it('omits filter summaries and preserves the Pace vs series legend', () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const events = [];
    const drawingContext = {
      fillRect(...args) { events.push(['fillRect', ...args]); },
      drawImage(...args) { events.push(['drawImage', ...args]); },
      fillText(...args) { events.push(['fillText', ...args]); },
      measureText: text => ({ width: String(text).length * 8 })
    };
    const canvas = {
      getContext: () => drawingContext,
      toDataURL: () => PNG_DATA_URL
    };
    const originalCreateElement = context.document.createElement;
    context.document.createElement = tagName => tagName === 'canvas' ? canvas : originalCreateElement(tagName);
    const captured = { width: 960, height: 500 };
    const target = context.window.exportUtils.createExportTarget({
      kind: 'tab',
      key: 'paceMetrics',
      title: 'Pace vs ...',
      targetElementId: 'paceMetricsChartWrapper',
      hasData: true,
      filters: [{ label: 'Sport', value: 'Run' }],
      legend: { title: 'Years', items: [{ label: '2023', color: '#f00' }] }
    });

    context.__drawExportComposition(captured, target, {
      logo: { naturalWidth: 100, naturalHeight: 100 },
      qrCode: {}
    });

    const filterIndex = events.findIndex(event => event[0] === 'fillText' && event[1] === 'Sport: Run');
    const chartIndex = events.findIndex(event => event[0] === 'drawImage' && event[1] === captured);
    expect(filterIndex).toBe(-1);
    expect(chartIndex).toBeGreaterThan(-1);
    expect(events[chartIndex][3]).toBeGreaterThanOrEqual(48);
    expect(events[chartIndex][3] + events[chartIndex][5]).toBeLessThanOrEqual(984);
    expect(events.some(event => event[0] === 'fillText' && event[1] === 'Years')).toBe(true);
    expect(events.some(event => event[0] === 'fillText' && event[1] === '2023')).toBe(true);
  });

  it('omits the QR code and generic export copy from the social composition', () => {
    const runtime = createDownloadRuntime();
    const qrCode = { id: 'qr-code' };
    const captured = { width: 960, height: 500 };
    const target = {
      kind: 'tab',
      key: 'totalDistance',
      title: 'My running years',
      presentation: runtime.context.__socialPresentation('totalDistance', { sport: 'Run', period: '2024-2026', unit: 'km' })
    };

    runtime.context.__drawComposition(captured, target, {
      logo: { naturalWidth: 120, naturalHeight: 60 },
      qrCode
    });

    const renderedText = runtime.canvasCalls.text.join(' ');
    expect(runtime.canvasCalls.images.some(args => args[0] === qrCode)).toBe(false);
    expect(renderedText).not.toContain('Shareable visualization');
    expect(renderedText).toContain('https://example.test/');
  });

  it('draws social text at the required sizes and keeps the visualization inside safe margins', () => {
    const runtime = createDownloadRuntime();
    const captured = { width: 960, height: 500 };
    runtime.context.__drawComposition(captured, {
      kind: 'tab',
      key: 'totalDistance',
      title: 'My running years',
      presentation: {
        headline: 'My running years',
        centralValue: 1234,
        unit: 'km',
        context: [{ label: 'Period', value: '2024-2026' }]
      }
    }, { logo: { naturalWidth: 120, naturalHeight: 60 } });

    const sizes = runtime.canvasCalls.textFonts.map(font => Number(String(font).match(/(\d+)px/)?.[1])).filter(Number.isFinite);
    const chart = runtime.canvasCalls.images.find(args => args[0] === captured);
    expect(sizes).toEqual(expect.arrayContaining([64, 104, 36]));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(36);
    expect(chart[1]).toBeGreaterThanOrEqual(48);
    expect(chart[2]).toBeGreaterThanOrEqual(48);
    expect(chart[1] + chart[3]).toBeLessThanOrEqual(1032);
    expect(chart[2] + chart[4]).toBeLessThanOrEqual(1032);
  });

  it('uses portrait canvas dimensions and downloads the exact preview image', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    runtime.setImage(null);
    runtime.closePreview();
    runtime.elements.captureTarget = {};
    context.html2canvas = jest.fn().mockResolvedValue({ width: 960, height: 500 });
    vm.runInContext("loadExportAssets = () => Promise.resolve({ logo: { naturalWidth: 100, naturalHeight: 50 } });", context);
    const target = {
      kind: 'tab',
      key: 'paceMetrics',
      title: 'My heart rate vs pace',
      targetElementId: 'captureTarget',
      hasData: true,
      presentation: { headline: 'My heart rate vs pace', context: [] }
    };

    await runtime.capture(target);
  await context.__setExportFormat('portrait');

    const previewDataUrl = runtime.elements.exportPreviewImage.src;
    expect(runtime.canvasCalls.canvases.at(-1)).toMatchObject({ width: 1080, height: 1350 });
    expect(previewDataUrl).toBe(PNG_DATA_URL);
    await runtime.download();
    expect(runtime.downloadLinks[0].href).toBe(previewDataUrl);
  });

  it('renders Workout Time axis annotations into the preview and downloads that exact PNG', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const chartPixels = { width: 960, height: 500 };
    const drawImage = jest.fn();
    const liveCanvas = { tagName: 'CANVAS', width: 960, height: 500, getContext: () => ({ drawImage }) };
    const clonedCanvas = { tagName: 'CANVAS', width: 0, height: 0, style: {}, getContext: () => ({ drawImage }) };
    const clonedTarget = {
      nodeType: 1,
      id: 'workoutTimeChartWrapper-export-snapshot',
      style: {},
      querySelectorAll: selector => selector === 'canvas' ? [clonedCanvas] : [],
      setAttribute: jest.fn(),
      remove: jest.fn()
    };
    const liveTarget = {
      id: 'workoutTimeChartWrapper',
      tagName: 'DIV',
      querySelectorAll: selector => selector === 'canvas' ? [liveCanvas] : [],
      cloneNode: () => clonedTarget,
      getBoundingClientRect: () => ({ width: 960, height: 500 })
    };
    const snapshotCapture = jest.fn(() => ({ canvas: chartPixels, sourceCanvas: liveCanvas }));
    runtime.elements.workoutTimeChartWrapper = liveTarget;
    context.window.dashboardTooltips = {
      getPinned: () => null,
      adapters: new Map([['workoutTime', { snapshotCapture }]])
    };
    context.document.getElementById = id => id === 'workoutTimeChartWrapper'
      ? liveTarget
      : runtime.elements[id] || null;
    context.html2canvas = jest.fn(async (_target, options) => {
      options.onclone({ getElementById: () => clonedTarget });
      return { width: 960, height: 500 };
    });
    vm.runInContext("waitForChartRenderSettle = async () => {}; loadExportAssets = async () => ({});", context);
    const target = context.window.exportUtils.createExportTarget({
      kind: 'tab', key: 'workoutTime', title: 'Workout Time',
      targetElementId: 'workoutTimeChartWrapper', hasData: true
    });

    await runtime.capture(target);

    expect(snapshotCapture).toHaveBeenCalledWith({ width: 960, height: 500, minFontSize: 30,
      axisTextColor: '#f8fafc', includeInspection: false, selection: null });
    expect(drawImage).toHaveBeenCalledWith(chartPixels, 0, 0, 960, 500);
    const previewDataUrl = runtime.elements.exportPreviewImage.src;
    expect(previewDataUrl).toBe(PNG_DATA_URL);
    await runtime.download();
    expect(runtime.downloadLinks.at(-1).href).toBe(previewDataUrl);
  });

  it('recomposes a format change from the same capture before preview and download', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    runtime.setImage(null);
    runtime.closePreview();
    const captureTarget = { id: 'captureTarget', cloneNode: () => ({}), querySelectorAll: () => [] };
    runtime.elements.captureTarget = captureTarget;
    const captureCanvas = { width: 900, height: 600 };
    context.html2canvas = jest.fn().mockResolvedValue(captureCanvas);
    vm.runInContext(`
      waitForChartRenderSettle = async () => {};
      loadExportAssets = async () => ({ logo: { naturalWidth: 100, naturalHeight: 50 } });
      this.formatDraws = [];
      drawExportComposition = (captured, target) => {
        this.formatDraws.push({ captured, format: target.format });
        return target.format === 'portrait' ? '${PNG_DATA_URL}' : '${PNG_DATA_URL}';
      };
    `, context);
    const target = {
      kind: 'tab', key: 'paceMetrics', title: 'My heart rate vs pace',
      targetElementId: 'captureTarget', hasData: true,
      presentation: { headline: 'My heart rate vs pace', context: [] }
    };

    await context.__capture(target);
    const initialCapture = context.formatDraws[0].captured;
    expect(context.formatDraws[0].format).toBe('story');
    await context.__setExportFormat('portrait');

    expect(context.formatDraws[1]).toEqual({ captured: initialCapture, format: 'portrait' });
    expect(context.__getExportFormat()).toBe('portrait');
    const previewDataUrl = runtime.elements.exportPreviewImage.src;
    await runtime.download();
    expect(runtime.downloadLinks[0].href).toBe(previewDataUrl);
  });

  it('recomposes only the optional humor line from the same capture', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    runtime.setImage(null);
    runtime.closePreview();
    const captureTarget = { id: 'captureTarget', cloneNode: () => ({}), querySelectorAll: () => [] };
    runtime.elements.captureTarget = captureTarget;
    const captureCanvas = { width: 900, height: 600 };
    context.html2canvas = jest.fn().mockResolvedValue(captureCanvas);
    vm.runInContext(`
      waitForChartRenderSettle = async () => {};
      loadExportAssets = async () => ({ logo: { naturalWidth: 100, naturalHeight: 50 } });
      this.humorDraws = [];
      drawExportComposition = (captured, target) => {
        this.humorDraws.push({ captured, headline: target.presentation.headline, line: target.presentation.secondaryLine });
        return '${PNG_DATA_URL}';
      };
    `, context);
    const data = { sport: 'Run', centralValue: 1234, unit: 'km', period: '2024-2026' };
    const target = {
      kind: 'tab', key: 'totalDistance', title: 'My running years', targetElementId: 'captureTarget', hasData: true,
      presentation: context.__socialPresentation('totalDistance', data), exportData: data
    };

    await context.__capture(target);
    const originalCapture = context.humorDraws[0].captured;
    const originalLine = context.humorDraws[0].line;
    expect(originalLine).toBeTruthy();
    await context.__setExportHumorEnabled(false);

    expect(context.humorDraws[1].captured).toBe(originalCapture);
    expect(context.humorDraws[1].headline).toBe(context.humorDraws[0].headline);
    expect(context.humorDraws[1].line).toBeNull();
    await context.__setExportHumorEnabled(true);
    expect(context.humorDraws[2].captured).toBe(originalCapture);
    expect(context.humorDraws[2].line).toBe(originalLine);
    expect(runtime.elements.exportHumorEnabled.checked).toBe(true);
    expect(context.html2canvas).toHaveBeenCalledTimes(1);
  });

  it('preserves all selected yearly periods and marks an incomplete current year', () => {
    const runtime = createDownloadRuntime();
    const years = Array.from({ length: 12 }, (_, index) => String(2015 + index));
    runtime.context.__drawComposition({ width: 960, height: 500 }, {
      kind: 'tab',
      key: 'totalDistance',
      title: 'My running years',
      presentation: { headline: 'My running years', context: [], centralValue: 520, unit: 'km' },
      exportData: {
        aggregation: 'yearly',
        periodLabels: years,
        incompleteYear: '2026',
        series: [{ label: 'Run', color: '#ef4444', values: years.map((_year, index) => (index + 1) * 10) }]
      }
    }, { logo: { naturalWidth: 100, naturalHeight: 50 } });

    const renderedText = runtime.canvasCalls.text.join(' ');
    expect(renderedText).toContain('2015');
    expect(renderedText).toContain('2017');
    expect(renderedText).toContain('2026 YTD');
  });

  it('uses only a sparse set of labels for dense daily distance series', () => {
    const runtime = createDownloadRuntime();
    const days = Array.from({ length: 30 }, (_, index) => `day${index + 1}`);
    runtime.context.__drawComposition({ width: 960, height: 500 }, {
      kind: 'tab',
      key: 'totalDistance',
      title: 'My running years',
      presentation: { headline: 'My running years', context: [] },
      exportData: {
        aggregation: 'daily',
        periodLabels: days,
        series: [{ label: 'Run', color: '#ef4444', values: days.map(() => 5) }]
      }
    }, { logo: { naturalWidth: 100, naturalHeight: 50 } });

    const labels = runtime.canvasCalls.text.join(' ').match(/day\d+/g) || [];
    expect(labels.length).toBeLessThanOrEqual(6);
  });

  it('labels capped equipment rankings and keeps first place visually distinct', () => {
    const runtime = createDownloadRuntime();
    runtime.context.__drawComposition({ width: 800, height: 500 }, {
      kind: 'tab',
      key: 'equipment',
      title: 'My most-used running shoes',
      presentation: { headline: 'My most-used running shoes', context: [] },
      exportData: {
        metric: 'distance',
        unit: 'km',
        items: Array.from({ length: 8 }, (_, index) => ({
          name: `Shoe ${index + 1}`,
          value: 100 - index * 10,
          displayValue: `${100 - index * 10}.0 km`
        }))
      }
    }, { logo: { naturalWidth: 100, naturalHeight: 50 } });

    const renderedText = runtime.canvasCalls.text.join(' ');
    expect(renderedText).toContain('Top 5 of 8');
    expect(renderedText).toContain('Shoe 1');
    expect(renderedText).toContain('Shoe 5');
    expect(renderedText).not.toContain('Shoe 6');
    expect(renderedText).toContain('#1');
  });

  it('labels equipment timeline spans and caps square exports at five rows', () => {
    const runtime = createDownloadRuntime();
    runtime.context.__drawComposition({ width: 800, height: 500 }, {
      kind: 'tab',
      key: 'equipmentTimeline',
      title: 'My running shoe eras',
      presentation: { headline: 'My running shoe eras', context: [] },
      exportData: {
        mode: 'continuous',
        periodMeaning: 'Usage span',
        items: Array.from({ length: 7 }, (_, index) => ({
          name: `Shoe ${index + 1}`,
          firstDate: new Date(2020 + index, 0, 1),
          lastDate: new Date(2021 + index, 0, 1),
          totalKm: 500 - index * 10,
          activityCount: 20
        }))
      }
    }, { logo: { naturalWidth: 100, naturalHeight: 50 } });

    const renderedText = runtime.canvasCalls.text.join(' ');
    expect(renderedText).toContain('Usage span');
    expect(renderedText).toContain('Shoe 5');
    expect(renderedText).not.toContain('Shoe 6');
  });

  it('uses the native save picker when the browser supports it', async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    const close = jest.fn().mockResolvedValue(undefined);
    const createWritable = jest.fn().mockResolvedValue({ write, close });
    const picker = jest.fn().mockResolvedValue({ createWritable });
    const runtime = createDownloadRuntime({ showSaveFilePicker: picker });

    await runtime.download();
    expect(picker).toHaveBeenCalledTimes(1);
    expect(runtime.pickerCalls[0]).toMatchObject({
      suggestedName: expect.stringMatching(/^trianalytica-paceMetrics-/),
      types: [{ description: 'PNG image', accept: { 'image/png': ['.png'] } }]
    });
    expect(write).toHaveBeenCalledWith(expect.any(Blob));
    expect(close).toHaveBeenCalledTimes(1);
    expect(runtime.downloadLinks).toHaveLength(0);
    expect(runtime.getImage()).toBeNull();
  });

  it('treats native save-picker cancellation quietly and keeps the preview retryable', async () => {
    const cancellation = Object.assign(new Error('User cancelled'), { name: 'AbortError' });
    const runtime = createDownloadRuntime({ showSaveFilePicker: jest.fn().mockRejectedValue(cancellation) });

    await runtime.download();

    expect(runtime.pickerCalls).toHaveLength(1);
    expect(runtime.downloadLinks).toHaveLength(0);
    expect(runtime.getImage()).not.toBeNull();
    expect(runtime.toast.textContent).toBe('');
  });

  it.each(['createWritable', 'write', 'close'])('recovers a post-selection context denial at %s with one complete PNG browser download', async stage => {
    const denial = Object.assign(new Error("The request is not allowed by the user agent or the platform in the current context."), { name: 'NotAllowedError' });
    const writable = { write: jest.fn().mockResolvedValue(), close: jest.fn().mockResolvedValue(), abort: jest.fn().mockResolvedValue() };
    const handle = { createWritable: jest.fn().mockResolvedValue(writable) };
    if (stage === 'createWritable') handle.createWritable.mockRejectedValue(denial);
    else writable[stage].mockRejectedValue(denial);
    const runtime = createDownloadRuntime({ showSaveFilePicker: jest.fn().mockResolvedValue(handle) });
    const image = runtime.getImage();
    await expect(runtime.download()).resolves.toBe('handed-off');
    expect(runtime.pickerCalls).toHaveLength(1);
    expect(runtime.downloadLinks).toHaveLength(1);
    const bytes = Buffer.from(runtime.downloadLinks[0].href.split(',')[1], 'base64');
    expect(bytes).toEqual(Buffer.from(await image.blob.arrayBuffer()));
    expect(bytes.length).toBeGreaterThan(0);
    expect(require('../src/export-utils').getExportPngDimensions(bytes)).toEqual({ width: 1, height: 1 });
    expect(runtime.toast.textContent).not.toContain('Could not save export image');
    expect(runtime.toast.textContent).toMatch(/empty|incomplete/i);
    expect(runtime.getImage()).toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(true);
    if (stage !== 'createWritable') expect(writable.abort).toHaveBeenCalledTimes(1);
  });

  it.each(['SecurityError', 'QuotaExceededError', 'AbortError', 'UnknownError'])('does not bypass a post-selection %s with an automatic download', async name => {
    const failure = Object.assign(new Error('Writing rejected'), { name });
    const runtime = createDownloadRuntime({ showSaveFilePicker: jest.fn().mockResolvedValue({ createWritable: jest.fn().mockRejectedValue(failure) }) });
    await expect(runtime.download()).resolves.toBe('failed');
    expect(runtime.downloadLinks).toHaveLength(0);
    expect(runtime.getImage()).not.toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(false);
    expect(runtime.toast.textContent).toContain('Could not save export image');
  });

  it.each([true, false])('captures only prepared media recap content (hasData=%s)', async hasData => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const captureTarget = { id: 'mediaGalleryExportArea', childElementCount: hasData ? 2 : 0 };
    const originalGetElementById = context.document.getElementById;
    context.chartInstance = null;
    const elements = {
      mediaGalleryExportArea: captureTarget,
      mediaGalleryYearFilter: { value: '2025', selectedOptions: [{ textContent: '2025' }] },
      mediaGallerySportFilter: { value: 'Run', selectedOptions: [{ textContent: 'Run' }] },
      mediaGalleryActivityFilter: { value: 'all', selectedOptions: [{ textContent: 'All activities' }] },
    };
    context.window.exportUtils = require('../src/export-utils');
    context.window.mediaGalleryDashboard = {
      getExportContext: () => [
        { label: 'Year', value: '2025' }, { label: 'Sport', value: 'Run' }
      ]
    };
    context.document.getElementById = id => elements[id] || originalGetElementById(id);
    context.document.querySelectorAll = () => [];
    context.html2canvas = jest.fn().mockResolvedValue({ width: 960, height: 960 });
    context.__mockCapture(PNG_DATA_URL);
    vm.runInContext(`
      showExportPreviewModal = dataUrl => { this.previewForTest = dataUrl; };
      this.exportMediaForTest = () => exportVisualizationTab('mediaGallery');
      this.mediaTargetForTest = () => getTabExportTarget('mediaGallery');
    `, context);

    const target = context.mediaTargetForTest();
    await context.exportMediaForTest();
    if (!hasData) {
      expect(target).toBeNull();
      expect(context.html2canvas).not.toHaveBeenCalled();
      expect(runtime.toast.textContent).toContain('Nothing to export');
      return;
    }
    expect(target).toMatchObject({
      targetElementId: 'mediaGalleryExportArea',
      filters: expect.arrayContaining([
        { label: 'Year', value: '2025' },
        { label: 'Sport', value: 'Run' }
      ])
    });
    expect(target.filters.map(filter => filter.label)).not.toContain('Routes');
    expect(target.availableControls.map(group => group.label)).not.toContain('Activity');
    expect(target.availableControls.map(group => group.label)).not.toContain('Include routes');
    expect(context.html2canvas).toHaveBeenCalledWith(captureTarget, expect.objectContaining({ useCORS: true }));
    expect(context.previewForTest).toBe(PNG_DATA_URL);
    await runtime.download();
    expect(runtime.downloadLinks[0].download).toMatch(/^trianalytica-media-gallery-/);
  });

  it.each([
    ['fire', true], ['monochrome-blue', true], ['fire', false], ['monochrome-blue', false]
  ])('preserves Equipment %s preview/download through the existing capture flow (hasData=%s)', async (scheme, hasData) => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const wrapper = { id: 'equipmentChartWrapper', scheme };
    const getOriginalElement = context.document.getElementById;
    const elements = {
      equipmentChartWrapper: wrapper,
      equipmentEmptyState: { classList: { contains: () => hasData } }
    };
    context.window.exportUtils = require('../src/export-utils');
    context.chartInstance = null;
    context.document.getElementById = id => elements[id] || getOriginalElement(id);
    context.document.querySelectorAll = () => [];
    context.html2canvas = jest.fn().mockResolvedValue({ width: 400, height: 300 });
    vm.runInContext(`
      waitForChartRenderSettle = async () => {};
      loadExportAssets = async () => ({});
      drawExportComposition = () => '${PNG_DATA_URL}';
      showExportPreviewModal = dataUrl => { this.previewForTest = dataUrl; };
      this.exportEquipmentForTest = () => exportVisualizationTab('equipment');
    `, context);

    await context.exportEquipmentForTest();
    if (!hasData) {
      expect(context.html2canvas).not.toHaveBeenCalled();
      expect(runtime.toast.textContent).toContain('Nothing to export');
      return;
    }
    expect(context.html2canvas).toHaveBeenCalledWith(wrapper, expect.objectContaining({ useCORS: true }));
    await runtime.download();
    expect(runtime.downloadLinks[0].href).toBe(PNG_DATA_URL);
    expect(runtime.downloadLinks[0].download).toMatch(/^trianalytica-equipment-/);
  });

  it.each([true, false])('captures only an exportable Swim heatmap and preserves its preview (hasData=%s)', async hasData => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const map = { id: 'heatmapMapContainer', style: { width: '100%', height: '480px' } };
    const getOriginalElement = context.document.getElementById;
    context.chartInstance = null;
    const elements = {
      heatmapMapContainer: map,
      heatmapEmptyState: { classList: { contains: () => hasData } },
      heatmapSportBtnSwim: { textContent: 'Swim', classList: { contains: () => true }, getAttribute: () => null },
      heatmapColorScheme: { value: 'black-fire', selectedOptions: [{ textContent: 'Black + Fire' }] }
    };
    context.window.exportUtils = require('../src/export-utils');
    context.chartInstance = null;
    context.document.getElementById = id => elements[id] || getOriginalElement(id);
    context.document.querySelectorAll = () => [];
    context.html2canvas = jest.fn().mockResolvedValue({ width: 400, height: 300 });
    context.syntheticPngDataUrl = PNG_DATA_URL;
    vm.runInContext(`
      waitForChartRenderSettle = async () => {};
      loadExportAssets = async () => ({});
      drawExportComposition = () => syntheticPngDataUrl;
      showExportPreviewModal = dataUrl => { this.previewForTest = dataUrl; };
      this.exportSwimForTest = () => exportVisualizationTab('heatmap');
      this.targetForTest = () => getTabExportTarget('heatmap');
    `, context);

    const target = context.targetForTest();
    await context.exportSwimForTest();
    if (!hasData) {
      expect(target).toBeNull();
      expect(context.html2canvas).not.toHaveBeenCalled();
      expect(runtime.toast.textContent).toContain('Nothing to export');
      return;
    }
    expect(target).toMatchObject({
      targetElementId: 'heatmapMapContainer',
      filters: [
        { label: 'Sport', value: 'Swim' },
        { label: 'Color scheme', value: 'Black + Fire' }
      ],
      availableControls: expect.arrayContaining([
        { label: 'Color scheme', controls: [{ label: 'Black + Fire', selected: true }] }
      ])
    });
    expect(context.html2canvas).toHaveBeenCalledWith(map, expect.objectContaining({ useCORS: true }));
    expect(context.previewForTest).toBe(PNG_DATA_URL);
    await runtime.download();
    expect(runtime.downloadLinks[0].download).toMatch(/^trianalytica-heatmap-/);
  });

  it('removes zoom controls and darkens only the cloned Black + Fire heatmap', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const map = { id: 'heatmapMapContainer', style: { width: '100%', height: '480px' } };
    const tileLayer = { style: { filter: 'invert(1) hue-rotate(180deg) brightness(0.8)', opacity: '' } };
    const liveZoomControl = { remove: jest.fn() };
    const clonedZoomControl = { remove: jest.fn() };
    map.querySelectorAll = jest.fn(selector => selector === '.leaflet-control-zoom' ? [liveZoomControl] : []);
    const clonedMap = {
      style: { backgroundColor: '' },
      querySelector: jest.fn(() => tileLayer),
      querySelectorAll: jest.fn(selector => selector === '.leaflet-control-zoom' ? [clonedZoomControl] : [])
    };
    const clonedDocument = {
      getElementById: id => id === 'heatmapMapContainer' ? clonedMap : (id === 'heatmapColorScheme' ? { value: 'black-fire' } : null)
    };
    const getOriginalElement = context.document.getElementById;
    context.chartInstance = null;
    const elements = {
      heatmapMapContainer: map,
      heatmapEmptyState: { classList: { contains: () => true } },
      heatmapSportBtnAll: { textContent: 'All Sports', classList: { contains: () => true }, getAttribute: () => null },
      heatmapColorScheme: { value: 'black-fire', selectedOptions: [{ textContent: 'Black + Fire' }] }
    };
    context.document.getElementById = id => elements[id] || getOriginalElement(id);
    context.document.querySelectorAll = () => [];
    context.html2canvas = jest.fn(async (_target, options) => {
      options.onclone(clonedDocument);
      return { width: 400, height: 300 };
    });
    context.__mockCapture(PNG_DATA_URL);
    vm.runInContext(`
      showExportPreviewModal = dataUrl => { this.previewForTest = dataUrl; };
      this.exportBlackFireForTest = () => exportVisualizationTab('heatmap');
    `, context);

    await context.exportBlackFireForTest();

    expect(context.console.error).not.toHaveBeenCalled();
    expect(tileLayer.style.filter).toBe('');
    expect(tileLayer.style.opacity).toBe('0.45');
    expect(clonedMap.style).toMatchObject({
      maxWidth: 'none',
      border: 'none',
      borderRadius: '0px',
      boxShadow: 'none',
      outline: 'none',
      padding: '0px',
      backgroundColor: 'rgb(2, 6, 23)'
    });
    expect(clonedMap.style.width).toBeUndefined();
    expect(clonedMap.style.height).toBeUndefined();
    expect(clonedZoomControl.remove).toHaveBeenCalledTimes(1);
    expect(liveZoomControl.remove).not.toHaveBeenCalled();
    expect(map.style).toEqual({ width: '100%', height: '480px' });
    expect(runtime.context.previewForTest).toBe(PNG_DATA_URL);
  });

  it.each([
    ['totalDistance', 'totalDistanceChartWrapper'],
    ['distributions', 'distributionsChartWrapper'],
    ['workoutTime', 'workoutTimeChartWrapper']
  ])('resizes only the cloned %s capture to the export plot region', async (key, targetElementId) => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const liveTarget = { id: targetElementId, style: { width: '100%', height: '420px' } };
    const clonedCanvas = { style: { width: '1120px', height: '420px' } };
    const clonedTarget = {
      style: {},
      querySelectorAll: jest.fn(() => [clonedCanvas])
    };
    context.document.getElementById = id => id === targetElementId ? liveTarget : null;
    context.__mockCapture(PNG_DATA_URL);
    context.html2canvas = jest.fn(async (_target, options) => {
      options.onclone({ getElementById: id => id === targetElementId ? clonedTarget : null });
      return { width: 960, height: 500 };
    });
    const target = context.window.exportUtils.createExportTarget({
      kind: 'tab',
      key,
      title: key,
      targetElementId,
      hasData: true
    });

    await context.__capture(target);

    expect(context.html2canvas).toHaveBeenCalledWith(liveTarget, expect.objectContaining({ useCORS: true }));
    expect(clonedTarget.style).toMatchObject({ width: '960px', height: '500px', maxWidth: 'none' });
    expect(clonedCanvas.style).toMatchObject({ width: '100%', height: '100%' });
    expect(liveTarget.style).toEqual({ width: '100%', height: '420px' });
  });

  it('replaces the cloned Pie canvas with a square export render and keeps the live summary intact', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const liveSummary = { style: { display: '' } };
    const liveChartContainer = { style: { maxWidth: '520px', height: '520px' } };
    const liveCanvas = { style: { width: '100%', height: '100%' }, parentElement: liveChartContainer };
    const liveTarget = { id: 'pieChartsCaptureArea', style: { border: '', borderRadius: '', padding: '' } };
    const clonedSummary = { style: { display: '' } };
    const clonedGrid = { style: {} };
    const clonedChartContainer = { style: {}, parentElement: clonedGrid };
    const clonedCanvas = {
      replaceWith: jest.fn()
    };
    const clonedLegendSpans = [{ style: {} }, { style: {} }];
    const clonedLegend = {
      style: {},
      textContent: 'Distance: 12 km',
      querySelectorAll: selector => selector === 'li span' ? clonedLegendSpans : []
    };
    const clonedImage = { style: {} };
    const clonedElements = {
      '#pieChartsSummary': clonedSummary,
      '#pieChartsCanvas': clonedCanvas,
      '#pieChartsLegend': clonedLegend
    };
    const clonedTarget = { style: {}, querySelector: selector => clonedElements[selector] || null };
    context.document.getElementById = id => id === 'pieChartsCaptureArea' ? liveTarget : null;
    context.window.pieChartsDashboard = { getExportChartImage: jest.fn(() => PNG_DATA_URL) };
    context.__mockCapture(PNG_DATA_URL);
    context.html2canvas = jest.fn(async (_target, options) => {
      options.onclone({
        getElementById: id => id === 'pieChartsCaptureArea' ? clonedTarget : null,
        createElement: tagName => tagName === 'img' ? clonedImage : null
      });
      return { width: 960, height: 600 };
    });
    const target = context.window.exportUtils.createExportTarget({
      kind: 'tab',
      key: 'pieCharts',
      title: 'Pie Charts',
      targetElementId: 'pieChartsCaptureArea',
      hasData: true
    });

    await context.__capture(target);

    expect(clonedSummary.style.display).toBe('none');
    expect(clonedTarget.style).toMatchObject({
      width: '960px',
      maxWidth: 'none',
      border: 'none',
      borderRadius: '0px',
      backgroundColor: 'transparent',
      boxShadow: 'none',
      outline: 'none',
      padding: '0px'
    });
    expect(context.window.pieChartsDashboard.getExportChartImage).toHaveBeenCalledWith(560);
    expect(clonedCanvas.replaceWith).toHaveBeenCalledWith(clonedImage);
    expect(clonedImage).toMatchObject({ src: PNG_DATA_URL, alt: 'Pie chart' });
    expect(clonedLegend.style.fontSize).toBe('22px');
    expect(clonedLegendSpans.every(span => span.style.fontSize === '22px')).toBe(true);
    expect(clonedLegend.textContent).toBe('Distance: 12 km');
    expect(liveSummary.style.display).toBe('');
    expect(liveChartContainer.style).toEqual({ maxWidth: '520px', height: '520px' });
    expect(liveCanvas.style).toEqual({ width: '100%', height: '100%' });
    expect(liveTarget.style).toEqual({ border: '', borderRadius: '', padding: '' });
  });

  it('fits a selected PB detail inside its content bounds without distorting or changing identity', () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const events = [];
    const drawingContext = {
      fillRect(...args) { events.push(['fillRect', ...args]); },
      drawImage(...args) { events.push(['drawImage', ...args]); },
      fillText(...args) { events.push(['fillText', ...args]); },
      measureText: text => ({ width: String(text).length * 8 })
    };
    const canvas = {
      getContext: () => drawingContext,
      toDataURL: () => PNG_DATA_URL
    };
    const originalCreateElement = context.document.createElement;
    context.document.createElement = tagName => tagName === 'canvas' ? canvas : originalCreateElement(tagName);
    const captured = { width: 1200, height: 680 };
    const target = context.window.exportUtils.createExportTarget({
      kind: 'pb-tile',
      key: 'run-5km',
      title: 'Run 5 km',
      targetElementId: 'pbDetailCaptureTarget',
      hasData: true,
      detailKey: 'run-5km',
      filters: [{ label: 'Metric', value: 'Time' }]
    });

    context.__drawExportComposition(captured, target, {
      logo: { naturalWidth: 100, naturalHeight: 100 },
      qrCode: {}
    });

    const chartDraw = events.find(event => event[0] === 'drawImage' && event[1] === captured);
    const renderedText = events.filter(event => event[0] === 'fillText').map(event => event[1]).join(' ');
    expect(target.detailKey).toBe('run-5km');
    expect(renderedText).toContain('Run 5 km');
    expect(renderedText).not.toContain('Metric: Time');
    expect(chartDraw).toBeDefined();
    expect(chartDraw[2]).toBeGreaterThanOrEqual(24);
    expect(chartDraw[2] + chartDraw[4]).toBeLessThanOrEqual(1056);
    expect(chartDraw[3]).toBeGreaterThan(190);
    expect(chartDraw[3] + chartDraw[5]).toBeLessThanOrEqual(1056);
    expect(chartDraw[4] / chartDraw[5]).toBeCloseTo(1200 / 680);
    expect(chartDraw[4] / 1032).toBeGreaterThanOrEqual(0.85);
  });

  it('resizes only the cloned PB detail capture and preserves its SVG viewBox', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const makeLabel = (role, textContent, fontSize) => ({
      textContent,
      attributes: { 'font-size': String(fontSize), 'data-export-role': role },
      children: [],
      getAttribute(name) { return this.attributes[name] ?? null; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      replaceChildren(...children) { this.children = children; }
    });
    const liveSvgLabels = [makeLabel('axis', '6.8', 13), makeLabel('result', '14:10', 14), makeLabel('description', 'A long city marathon title', 12)];
    const liveSvg = {
      style: { width: '100%', height: '100%' }, viewBox: '0 0 1200 680', preserveAspectRatio: 'xMidYMid meet',
      querySelectorAll: selector => selector === 'text' ? liveSvgLabels : []
    };
    const liveTarget = { id: 'pbDetailCaptureTarget', style: { width: '720px', height: '480px', border: '', borderRadius: '', padding: '' }, querySelector: () => liveSvg };
    const svgLabels = [makeLabel('axis', '6.8', 13), makeLabel('result', '14:10', 14), makeLabel('description', 'A long city marathon title', 12)];
    const calloutRect = {
      attributes: { x: '700', y: '300', width: '220', height: '57' },
      getAttribute(name) { return this.attributes[name] ?? null; },
      setAttribute(name, value) { this.attributes[name] = String(value); }
    };
    const callout = {
      querySelector: selector => selector === 'rect' ? calloutRect : svgLabels.find(label => label.getAttribute('data-export-role') === selector.match(/"(.*?)"/)?.[1]) || null,
      querySelectorAll: selector => selector === '[data-export-role="description"]' ? [svgLabels[2]] : []
    };
    const clonedSvg = {
      style: {}, viewBox: '0 0 1200 680', preserveAspectRatio: 'xMidYMid meet',
      querySelectorAll: selector => selector === 'text' || selector === '[data-export-role]' ? svgLabels
        : selector === '[data-pb-callout]' ? [callout] : []
    };
    const clonedTarget = { style: {}, querySelector: () => clonedSvg };
    context.document.getElementById = id => id === 'pbDetailCaptureTarget' ? liveTarget : null;
    context.__mockCapture(PNG_DATA_URL);
    context.html2canvas = jest.fn(async (_target, options) => {
      options.onclone({
        getElementById: id => id === 'pbDetailCaptureTarget' ? clonedTarget : null,
        createElementNS: (_namespace, tagName) => ({ tagName, attributes: {}, textContent: '', setAttribute(name, value) { this.attributes[name] = String(value); } })
      });
      return { width: 1032, height: 560 };
    });
    const target = context.window.exportUtils.createExportTarget({
      kind: 'pb-tile',
      key: 'run-5km',
      title: 'Run 5 km',
      targetElementId: 'pbDetailCaptureTarget',
      hasData: true,
      detailKey: 'run-5km'
    });

    await context.__capture(target);

    expect(context.html2canvas).toHaveBeenCalledWith(liveTarget, expect.objectContaining({ useCORS: true }));
    expect(clonedTarget.style).toMatchObject({
      flex: 'none',
      width: '1032px',
      height: '560px',
      minHeight: '560px',
      maxHeight: '560px',
      maxWidth: 'none',
      border: 'none',
      borderRadius: '0px',
      backgroundColor: 'transparent',
      boxShadow: 'none',
      outline: 'none',
      padding: '0px'
    });
    expect(svgLabels.map(label => label.getAttribute('font-size'))).toEqual(['36', '44', '36']);
    expect(svgLabels.map(label => label.textContent)).toEqual(['6.8', '14:10', 'A long city marathon title']);
    expect(svgLabels[2].children.length).toBeGreaterThan(1);
    expect(Number(calloutRect.getAttribute('height'))).toBeGreaterThan(57);
    expect(clonedSvg.style).toMatchObject({ width: '100%', height: '100%', maxWidth: 'none' });
    expect(clonedSvg.viewBox).toBe('0 0 1200 680');
    expect(clonedSvg.preserveAspectRatio).toBe('xMidYMid meet');
    expect(liveTarget.style).toEqual({ width: '720px', height: '480px', border: '', borderRadius: '', padding: '' });
    expect(liveSvg.style).toEqual({ width: '100%', height: '100%' });
    expect(liveSvgLabels.map(label => label.getAttribute('font-size'))).toEqual(['13', '14', '12']);
    expect(liveSvgLabels.map(label => label.textContent)).toEqual(['6.8', '14:10', 'A long city marathon title']);
  });

  it('retains the Training Calendar intensity legend in the captured visualization', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const liveTarget = { id: 'trainingCalendarYears', style: {} };
    const clonedLegend = { textContent: 'Less No activity Intensity 1 Intensity 2 More' };
    const clonedTarget = {
      style: {},
      clientWidth: 960,
      querySelector: selector => selector === '#trainingCalendarLegend' ? clonedLegend : null,
      querySelectorAll: () => []
    };
    context.document.getElementById = id => id === 'trainingCalendarYears' ? liveTarget : null;
    context.__mockCapture(PNG_DATA_URL);
    context.html2canvas = jest.fn(async (_target, options) => {
      options.onclone({ getElementById: id => id === 'trainingCalendarYears' ? clonedTarget : null });
      return { width: 960, height: 500 };
    });
    const target = context.window.exportUtils.createExportTarget({
      kind: 'tab',
      key: 'trainingCalendar',
      title: 'Training Calendar',
      targetElementId: 'trainingCalendarYears',
      hasData: true
    });

    await context.__capture(target);

    expect(clonedTarget.style).toMatchObject({
      border: 'none',
      borderRadius: '0px',
      backgroundColor: 'transparent',
      boxShadow: 'none',
      outline: 'none',
      padding: '0px'
    });
    expect(clonedTarget.querySelector('#trainingCalendarLegend').textContent).toContain('Intensity 1');
    expect(clonedTarget.querySelector('#trainingCalendarLegend').textContent).toContain('More');
    expect(liveTarget.style).toEqual({});
  });

  it('styles only cloned Training Calendar year headings for export', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const liveHeading = { style: { fontSize: '14px', color: '#e2e8f0' }, textContent: '2026' };
    const liveSection = { dataset: { calendarYear: '2026' }, querySelector: () => liveHeading };
    const clonedHeading = { style: {}, textContent: '2026' };
    const clonedDay = { dataset: { dateKey: '2026-01-01' }, style: {} };
    const clonedSection = {
      dataset: { calendarYear: '2026' }, style: {}, querySelector: () => clonedHeading,
      querySelectorAll: selector => selector === '[data-date-key]' ? [clonedDay] : [],
      getBoundingClientRect: () => ({ height: 160 })
    };
    const liveTarget = { id: 'trainingCalendarYears', style: {} };
    const clonedTarget = {
      style: {}, clientWidth: 960,
      querySelector: () => null,
      querySelectorAll: selector => selector === '[data-calendar-year]' ? [clonedSection] : []
    };
    context.document.getElementById = id => id === 'trainingCalendarYears' ? liveTarget : null;
    context.__mockCapture(PNG_DATA_URL);
    context.html2canvas = jest.fn(async (_target, options) => {
      options.onclone({ getElementById: () => clonedTarget });
      return { width: 960, height: 500 };
    });
    const target = context.window.exportUtils.createExportTarget({
      kind: 'tab', key: 'trainingCalendar', title: 'Training Calendar',
      targetElementId: 'trainingCalendarYears', hasData: true
    });
    target.exportData = {
      years: [{ year: 2026, days: [{ dateKey: '2026-01-01', intensityLevel: 1 }] }],
      scale: { palette: 'green', colors: ['#0B1220', '#DCFCE7', '#86EFAC', '#22C55E', '#16A34A', '#166534'] },
      yearSectionHeight: 160
    };

    await context.__capture(target);

    expect(context.html2canvas).toHaveBeenCalled();
    expect(context.console.error).not.toHaveBeenCalled();
    expect(clonedHeading.style).toMatchObject({ fontSize: '30px', color: '#f8fafc' });
    expect(clonedHeading.textContent).toBe('2026');
    expect(clonedDay.style.backgroundColor).toBe('#DCFCE7');
    expect(Number.parseFloat(clonedTarget.style.height)).toBeLessThan(300);
    expect(liveHeading.style).toEqual({ fontSize: '14px', color: '#e2e8f0' });
    expect(liveHeading.textContent).toBe('2026');
  });

  it('previews and downloads each selected Training Calendar page with matching numbering', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const years = Array.from({ length: 10 }, (_unused, index) => 2026 - index);
    const liveTarget = {
      id: 'trainingCalendarYears',
      cloneNode: () => ({ nodeType: 1, style: {}, querySelectorAll: () => [], setAttribute: jest.fn(), remove: jest.fn() }),
      querySelectorAll: () => [],
      getBoundingClientRect: () => ({ width: 960, height: 900 })
    };
    const scale = { palette: 'blue', minLevel: 0, maxLevel: 5, colors: ['#0B1220', '#DBEAFE', '#1D4ED8'] };
    const capturedYears = [];
    context.document.getElementById = id => id === 'trainingCalendarYears' ? liveTarget : runtime.elements[id] || null;
    context.window.dashboardTooltips = { getPinned: () => null, adapters: new Map() };
    context.__mockCapture(PNG_DATA_URL);
    context.html2canvas = jest.fn(async (_target, options) => {
      const sections = years.map(year => ({
        dataset: { calendarYear: String(year) },
        style: {},
        querySelector: () => ({ style: {} }),
        querySelectorAll: () => []
      }));
      const clonedTarget = {
        style: {}, clientWidth: 960,
        querySelector: () => null,
        querySelectorAll: selector => selector === '[data-calendar-year]' ? sections : []
      };
      options.onclone({ getElementById: () => clonedTarget });
      const visibleYears = sections.filter(section => section.style.display !== 'none')
        .map(section => Number(section.dataset.calendarYear));
      capturedYears.push(visibleYears);
      return { width: 960, height: visibleYears.length * 220, years: visibleYears };
    });
    vm.runInContext(`
      this.calendarCompositionPages = [];
      drawExportComposition = (captured, page) => {
        this.calendarCompositionPages.push({ years: captured.years, format: page.format, pageNumber: page.seriesPage, pageCount: page.seriesCount });
        return '${PNG_DATA_URL}';
      };
    `, context);
    const target = context.window.exportUtils.createExportTarget({
      kind: 'tab', key: 'trainingCalendar', title: 'Training Calendar',
      targetElementId: 'trainingCalendarYears', hasData: true
    });
    target.exportData = {
      years: years.map(year => ({ year })),
      scale,
      palette: 'blue',
      yearSectionHeight: 300
    };

    await runtime.capture(target);
    await context.__setExportFormat('square');

    expect(context.console.error).not.toHaveBeenCalled();
    const squarePages = context.calendarCompositionPages.slice();
    expect(squarePages.length).toBeGreaterThan(1);
    expect(squarePages.every(page => page.format === 'square')).toBe(true);
    expect(squarePages.map(page => page.pageNumber)).toEqual(squarePages.map((_page, index) => index + 1));
    expect(squarePages.every(page => page.pageCount === squarePages.length)).toBe(true);
    expect(squarePages.flatMap(page => page.years)).toEqual(years);
    expect(capturedYears.length).toBeGreaterThan(squarePages.length);

    await context.__setExportFormat('portrait');

    const portraitPages = context.calendarCompositionPages.slice(squarePages.length);
    expect(portraitPages.length).toBeGreaterThan(1);
    expect(portraitPages.every(page => page.format === 'portrait')).toBe(true);
    expect(portraitPages.flatMap(page => page.years)).toEqual(years);
    expect(runtime.elements.exportPreviewSeriesStatus.textContent).toBe(`Page 1 of ${portraitPages.length}`);
    const previewDataUrl = runtime.elements.exportPreviewImage.src;
    await runtime.download();
    expect(runtime.downloadLinks.at(-1).href).toBe(previewDataUrl);
    expect(runtime.downloadLinks.at(-1).download).toMatch(new RegExp(`page-1-of-${portraitPages.length}`));
    expect(runtime.elements.exportPreviewSeriesStatus.textContent).toBe(`Page 2 of ${portraitPages.length}`);
  });

  it('passes the current PNG bytes and suggested filename to the browser unchanged', async () => {
    const runtime = createDownloadRuntime();
    const image = runtime.getImage();
    await runtime.download();
    const link = runtime.downloadLinks[0];
    expect(link.download).toMatch(/^trianalytica-paceMetrics-\d+\.png$/);
    expect(Buffer.from(link.href.split(',')[1], 'base64')).toEqual(Buffer.from(await image.blob.arrayBuffer()));
    expect(runtime.anchors).toHaveLength(0);
  });

  it('uses the existing browser download and explains the limitation when the picker is unavailable', async () => {
    const runtime = createDownloadRuntime();

    await runtime.download();

    expect(runtime.downloadLinks).toHaveLength(1);
    expect(runtime.downloadLinks[0]).toMatchObject({
      clicked: true,
      download: expect.stringMatching(/^trianalytica-paceMetrics-\d+\.png$/),
      href: PNG_DATA_URL
    });
    expect(runtime.toast.textContent).toMatch(/location|destination|Speicherort/i);
  });

  it('falls back to the browser download when the native picker is restricted', async () => {
    const denial = Object.assign(new Error('Picker unavailable in this context'), { name: 'SecurityError' });
    const runtime = createDownloadRuntime({
      showSaveFilePicker: jest.fn().mockRejectedValue(denial)
    });

    await runtime.download();

    expect(runtime.downloadLinks).toHaveLength(1);
    expect(runtime.downloadLinks[0].clicked).toBe(true);
    expect(runtime.pickerCalls).toHaveLength(1);
    expect(runtime.toast.textContent).toMatch(/location|destination|Speicherort/i);
  });

  it('keeps country count and names out of Distance export metadata', () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const originalGetElementById = context.document.getElementById;
    const elements = {
      totalDistanceChartWrapper: { id: 'totalDistanceChartWrapper' },
      countryCountValue: { textContent: '2' },
      countryCountStatus: { textContent: 'GPS routes for 3 of 4 activities' },
      sportBtnAll: { textContent: 'All Sports', classList: { contains: () => true } },
      aggBtnWeekly: { textContent: 'Weekly', classList: { contains: () => true } }
    };
    context.window.exportUtils = require('../src/export-utils');
    context.chartInstance = {};
    context.document.getElementById = id => elements[id] || originalGetElementById(id);
    context.document.querySelectorAll = () => [];
    vm.runInContext(`this.totalDistanceTargetForTest = () => getTabExportTarget('totalDistance');`, context);

    const target = context.totalDistanceTargetForTest();

    expect(target.filters).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Countries visited' }),
      expect.objectContaining({ label: 'GPS coverage' })
    ]));
  });

  it('does not start a download without a prepared PNG', async () => {
    const runtime = createDownloadRuntime();
    runtime.setImage(null);
    await runtime.download();
    expect(runtime.downloadLinks).toHaveLength(0);
  });
});

describe('PNG preparation', () => {
  it('prepares identical PNG data URL and Blob bytes before download', async () => {
    const runtime = createDownloadRuntime();
    const image = await runtime.prepare(PNG_DATA_URL, { kind: 'tab', key: 'paceMetrics' });
    expect(image).toMatchObject({ dataUrl: PNG_DATA_URL, width: 1, height: 1, target: { key: 'paceMetrics' } });
    expect(Buffer.from(await image.blob.arrayBuffer())).toEqual(Buffer.from(PNG_BASE64, 'base64'));
    expect(Object.isFrozen(image)).toBe(true);
  });

  it.each(['data:image/jpeg;base64,aGVsbG8=', 'data:image/png;base64,???', 'data:image/png;base64,aGVsbG8=', 'data:,'])('rejects invalid preparation without opening a picker: %s', async dataUrl => {
    const runtime = createDownloadRuntime({ showSaveFilePicker: jest.fn() });
    await expect(runtime.prepare(dataUrl, { key: 'paceMetrics' })).rejects.toThrow();
    expect(runtime.pickerCalls).toHaveLength(0);
  });

  it('rejects a browser decode failure', async () => {
    const runtime = createDownloadRuntime({ decodeError: new Error('Invalid image') });
    await expect(runtime.prepare(PNG_DATA_URL, { key: 'paceMetrics' })).rejects.toThrow();
  });

  it('rejects a decoded image with nonpositive dimensions', async () => {
    const runtime = createDownloadRuntime({ imageWidth: 0 });
    await expect(runtime.prepare(PNG_DATA_URL, { key: 'paceMetrics' })).rejects.toThrow();
  });

  it('never publishes a preview or changes selected context when preparation fails, and allows regeneration', async () => {
    const runtime = createDownloadRuntime({ showSaveFilePicker: jest.fn() });
    const target = { kind: 'tab', key: 'paceMetrics', targetElementId: 'captureTarget', hasData: true, filters: [{ label: 'Sport', value: 'Run' }] };
    runtime.closePreview();
    runtime.mockCapture('data:image/png;base64,aGVsbG8=');
    await runtime.capture(target);
    expect(runtime.getImage()).toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(true);
    expect(target.filters).toEqual([{ label: 'Sport', value: 'Run' }]);
    expect(runtime.pickerCalls).toHaveLength(0);
    runtime.mockCapture(PNG_DATA_URL);
    await runtime.capture(target);
    expect(runtime.getImage().target).not.toBe(target);
    expect(runtime.getImage().target).toMatchObject(target);
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(false);
  });

  it('publishes no image until browser decoding finishes and preserves no-data behavior', async () => {
    const runtime = createDownloadRuntime();
    const decoding = deferredValue();
    runtime.context.Image = class {
      constructor() { this.naturalWidth = 1; this.naturalHeight = 1; }
      decode() { return decoding.promise; }
    };
    runtime.closePreview();
    runtime.mockCapture(PNG_DATA_URL);
    const target = { kind: 'tab', key: 'paceMetrics', targetElementId: 'captureTarget', hasData: true };
    const capturing = runtime.capture(target);
    await Promise.resolve();
    expect(runtime.getImage()).toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(true);
    decoding.resolve();
    await capturing;
    expect(runtime.getImage().blob.type).toBe('image/png');
    runtime.closePreview();
    await runtime.capture({ ...target, hasData: false });
    expect(runtime.getImage()).toBeNull();
    expect(runtime.toast.textContent).toMatch(/Nothing to export/);
  });

  it('waits for browser fonts before capturing the export snapshot', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const fonts = deferredValue();
    const target = { kind: 'tab', key: 'paceMetrics', targetElementId: 'captureTarget', hasData: true };
    runtime.setImage(null);
    runtime.closePreview();
    runtime.mockCapture(PNG_DATA_URL);
    context.document.fonts = { ready: fonts.promise };

    const pending = runtime.capture(target);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(context.html2canvas).not.toHaveBeenCalled();
    expect(runtime.getImage()).toBeNull();

    fonts.resolve();
    await pending;

    expect(context.html2canvas).toHaveBeenCalledTimes(1);
    expect(runtime.getImage()).not.toBeNull();
  });

  it('reports a font readiness failure without publishing a preview', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const target = { kind: 'tab', key: 'paceMetrics', targetElementId: 'captureTarget', hasData: true };
    runtime.setImage(null);
    runtime.closePreview();
    runtime.mockCapture(PNG_DATA_URL);
    context.document.fonts = { ready: Promise.reject(new Error('Font load failed')) };

    await runtime.capture(target);

    expect(context.html2canvas).not.toHaveBeenCalled();
    expect(runtime.getImage()).toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(true);
    expect(runtime.toast.textContent).toContain('Could not load required fonts');
  });

  it('does not publish a partial export after an asset failure and allows a retry', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const target = { kind: 'tab', key: 'paceMetrics', targetElementId: 'captureTarget', hasData: true };
    let assetAttempts = 0;
    runtime.setImage(null);
    runtime.closePreview();
    context.window.exportUtils.getExportAssetPaths = () => ({ logo: 'assets/logo.png' });
    context.document.getElementById = id => id === 'captureTarget' ? {} : runtime.elements[id] || null;
    context.html2canvas = jest.fn().mockResolvedValue({ width: 960, height: 500 });
    vm.runInContext(`drawExportComposition = () => '${PNG_DATA_URL}';`, context);
    context.Image = class {
      constructor() { this.naturalWidth = 1080; this.naturalHeight = 1080; }
      set src(value) {
        if (value === PNG_DATA_URL) {
          Promise.resolve().then(() => this.onload?.());
          return;
        }
        assetAttempts += 1;
        Promise.resolve().then(() => {
          if (assetAttempts === 1) this.onerror?.(new Error('Asset unavailable'));
          else this.onload?.();
        });
      }
      decode() { return Promise.resolve(); }
    };

    await runtime.capture(target);

    expect(runtime.getImage()).toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(true);
    expect(runtime.toast.textContent).toContain('Could not load export asset');

    await runtime.capture(target);

    expect(assetAttempts).toBe(2);
    expect(runtime.getImage()).not.toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(false);
  });

  it('publishes only the latest format when composition validations finish out of order', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const storyGate = deferredValue();
    const portraitGate = deferredValue();
    context.storyGate = storyGate;
    context.portraitGate = portraitGate;
    context.captureStateForTest = {
      sessionId: 0,
      captured: { width: 960, height: 500 },
      target: { kind: 'tab', key: 'totalDistance', title: 'Run distance', exportData: { sport: 'Run', metricLabel: 'Distance', unit: 'km' } },
      assets: {}, pbOpening: null
    };
    vm.runInContext(`
      lastExportCaptureState = captureStateForTest;
      drawExportComposition = (_captured, target) => target.format;
      prepareExportImage = (dataUrl, target) => dataUrl === 'story' ? storyGate.promise : portraitGate.promise;
    `, context);

    const storyComposition = context.__setExportFormat('story');
    const portraitComposition = context.__setExportFormat('portrait');
    const storyImage = { dataUrl: 'story', target: { format: 'story' }, blob: { size: 1 } };
    const portraitImage = { dataUrl: 'portrait', target: { format: 'portrait' }, blob: { size: 1 } };
    portraitGate.resolve(portraitImage);
    await portraitComposition;
    storyGate.resolve(storyImage);
    await storyComposition;

    expect(runtime.getImage()).toBe(portraitImage);
    expect(runtime.elements.exportPreviewImage.src).toBe('portrait');
    expect(runtime.elements.exportPreviewDownloadBtn.disabled).toBe(false);
  });

  it('does not reopen a preview when its capture finishes after close', async () => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const captureGate = deferredValue();
    runtime.elements.captureTarget = { id: 'captureTarget' };
    runtime.mockCapture(PNG_DATA_URL);
    context.html2canvas = jest.fn(() => captureGate.promise);
    const target = { kind: 'tab', key: 'paceMetrics', targetElementId: 'captureTarget', hasData: true };

    const capture = runtime.capture(target);
    expect(runtime.elements.exportPreviewDownloadBtn.disabled).toBe(true);
    expect(runtime.elements.exportPreviewImage.src).toBe('');
    for (let attempt = 0; attempt < 10 && !context.html2canvas.mock.calls.length; attempt += 1) await Promise.resolve();
    expect(context.html2canvas).toHaveBeenCalledTimes(1);
    runtime.closePreview();
    captureGate.resolve({ width: 960, height: 500 });
    await capture;

    expect(runtime.getImage()).toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(true);
  });

  it('keeps download disabled when an older save finishes during a newer composition', async () => {
    const pickerGate = deferredValue();
    const compositionGate = deferredValue();
    const runtime = createDownloadRuntime({ showSaveFilePicker: () => pickerGate.promise });
    const context = runtime.context;
    context.compositionGate = compositionGate;
    context.captureStateForTest = {
      sessionId: 0,
      captured: { width: 960, height: 500 },
      target: { kind: 'tab', key: 'totalDistance', title: 'Run distance', exportData: { sport: 'Run', metricLabel: 'Distance', unit: 'km' } },
      assets: {}, pbOpening: null
    };
    vm.runInContext(`
      lastExportCaptureState = captureStateForTest;
      drawExportComposition = () => 'new-preview';
      prepareExportImage = () => compositionGate.promise;
    `, context);

    const save = runtime.download();
    const composition = context.__setExportFormat('story');
    expect(runtime.elements.exportPreviewDownloadBtn.disabled).toBe(true);
    pickerGate.resolve({ createWritable: async () => ({ write: async () => {}, close: async () => {} }) });
    await save;

    expect(runtime.elements.exportPreviewDownloadBtn.disabled).toBe(true);
    compositionGate.resolve({ dataUrl: 'new-preview', target: { format: 'story' }, blob: { size: 1 } });
    await composition;
    expect(runtime.elements.exportPreviewDownloadBtn.disabled).toBe(false);
  });

  it('clears stale no-data feedback when a later export succeeds', async () => {
    const runtime = createDownloadRuntime();
    runtime.toast.textContent = 'Nothing to export for this selection yet.';
    runtime.toast.classList.remove('hidden');
    runtime.mockCapture(PNG_DATA_URL);

    await runtime.capture({ kind: 'tab', key: 'paceMetrics', targetElementId: 'captureTarget', hasData: true });

    expect(runtime.toast.textContent).toBe('');
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(false);
  });
});

describe('download attempt outcomes', () => {
  it('handles an anchor exception as a retryable failure and removes the temporary link', async () => {
    const runtime = createDownloadRuntime({ anchorError: new Error('Download blocked') });
    await expect(runtime.download()).resolves.toBeDefined();
    expect(runtime.anchors).toHaveLength(0);
    expect(runtime.toast.textContent).toContain('Download blocked');
    expect(runtime.getImage()).not.toBeNull();
  });

  it('ignores a reentrant click during the same browser handoff', async () => {
    let duplicate;
    const runtime = createDownloadRuntime({ onDownload: () => { duplicate = runtime.download(); } });
    await runtime.download();
    await duplicate;
    expect(runtime.downloadLinks).toHaveLength(1);
  });

  it('clears earlier failure feedback and its timer on a later successful attempt', async () => {
    const failure = jest.fn().mockReturnValueOnce(new Error('Old failure')).mockReturnValue(null);
    const runtime = createDownloadRuntime({ anchorError: failure });
    await runtime.download();
    expect(runtime.toast.textContent).toContain('Old failure');
    await runtime.download();
    expect(runtime.toast.textContent).not.toContain('Old failure');
    expect(runtime.toast.textContent).toMatch(/location|destination/i);
    expect(runtime.timers.size).toBe(1);
    expect(runtime.getImage()).toBeNull();
  });
});

describe('owned export surface lifecycle', () => {
  it('keeps export-resolution Workout Time pixels instead of downsampling to a narrow mobile canvas', async () => {
    const runtime = createDownloadRuntime();
    runtime.mockCapture(PNG_DATA_URL);
    const drawImage = jest.fn();
    const source = { tagName: 'CANVAS', width: 256, height: 420, getContext: () => ({ drawImage }) };
    const clean = { width: 960, height: 500 };
    runtime.elements.captureTarget = source;
    runtime.context.window.dashboardTooltips = { getPinned: () => null, adapters: new Map([['workoutTime', { snapshotCapture: () => ({ canvas: clean, sourceCanvas: source }) }]]) };
    await runtime.capture({ key: 'workoutTime', hasData: true, targetElementId: 'captureTarget' });
    expect(drawImage).toHaveBeenCalledWith(clean, 0, 0, 960, 500);
    expect(runtime.context.html2canvas.mock.calls[0][0]).toMatchObject({ width: 960, height: 500 });
    expect(source).toMatchObject({ width: 256, height: 420 });
  });

  it.each(require('../src/tooltip-selection-utils').TAB_IDS)('excludes pinned %s inspection data while composing one image for preview and download', async key => {
    const runtime = createDownloadRuntime();
    runtime.closePreview();
    const snapshotElement = { id: 'captureTarget', style: {}, clientWidth: 800, querySelectorAll: () => [], querySelector: () => null,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 400 }) };
    const liveElement = { ...snapshotElement, cloneNode: () => ({ ...snapshotElement, style: {} }) };
    runtime.elements.captureTarget = liveElement;
    const pin = { selectionKey: key + ':selected', content: { title: 'Captured selection' }, anchor: { visibility: 'visible', capturePoint: { x: 0.9, y: 0.9 } } };
    const resolveExportAnchor = jest.fn();
    const snapshotCapture = jest.fn(options => { expect(options).toMatchObject({ includeInspection: false, selection: null }); return null; });
    const getPinned = jest.fn(() => pin);
    runtime.context.window.dashboardTooltips = { getPinned, adapters: new Map([[key, { snapshotCapture, resolveExportAnchor }]]) };
    runtime.context.window.wordcloudDashboard = { hasExportableCloud: () => true };
    runtime.context.processedActivities = new Proxy([], { get() { throw new Error('Callout placement must not scan activities'); } });
    runtime.context.window.Chart = jest.fn(() => { throw new Error('Callout placement must not rerender charts'); });
    runtime.context.html2canvas = jest.fn(async (element, options) => {
      options.onclone({ getElementById: () => element });
      return { width: 800, height: 400 };
    });
    runtime.context.assetsForTest = { logo: { naturalWidth: 120, naturalHeight: 60 }, qrCode: {} };
    vm.runInContext('loadExportAssets = () => Promise.resolve(assetsForTest);', runtime.context);
    await runtime.capture({ kind: 'tab', key, title: 'View', targetElementId: 'captureTarget', hasData: true });
    if (key === 'trainingCalendar') await runtime.context.__setExportFormat('square');
    expect(runtime.context.console.error).not.toHaveBeenCalled();
    const captureCount = key === 'trainingCalendar' ? 2 : 1;
    expect(resolveExportAnchor).not.toHaveBeenCalled();
    expect(getPinned).not.toHaveBeenCalled();
    expect(snapshotCapture).toHaveBeenCalledTimes(1);
    expect(runtime.context.window.Chart).not.toHaveBeenCalled();
    expect(runtime.context.html2canvas).toHaveBeenCalledTimes(captureCount);
    expect(runtime.getImage().target.pinnedSelection).toBeNull();
    const renderedCount = runtime.canvasCalls.images.length;
    const preparedCanvasCount = key === 'trainingCalendar' ? 2 : 1;
    expect(runtime.canvasCalls.canvases).toHaveLength(preparedCanvasCount);
    const originalImage = runtime.getImage();
    const previewData = runtime.elements.exportPreviewImage.src;
    await runtime.download();
    expect(runtime.downloadLinks[0].href).toBe(previewData);
    expect(runtime.downloadLinks[0].href).toBe(originalImage.dataUrl);
    expect(runtime.canvasCalls.images).toHaveLength(renderedCount);
    expect(runtime.canvasCalls.canvases).toHaveLength(preparedCanvasCount);
    expect(runtime.context.html2canvas).toHaveBeenCalledTimes(captureCount);
    expect(runtime.canvasCalls.paths.filter(step => step[0] === 'fill')).toHaveLength(0);
  });

  it('exports the chart without attempting to resolve a pinned inspection anchor', async () => {
    const runtime = createDownloadRuntime();
    runtime.mockCapture(PNG_DATA_URL);
    const getPinned = jest.fn(() => ({ content: { title: 'Run' }, anchor: { visibility: 'visible' } }));
    runtime.context.window.dashboardTooltips = { getPinned, adapters: new Map() };
    await runtime.capture({ key: 'totalDistance', hasData: true, targetElementId: 'captureTarget' });
    expect(getPinned).not.toHaveBeenCalled();
    expect(runtime.getImage()).not.toBeNull();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(false);
  });

  it('accepts a loaded PNG when the browser decode promise does not settle', async () => {
    const runtime = createDownloadRuntime();
    runtime.context.Image = class {
      constructor() { this.naturalWidth = 1080; this.naturalHeight = 1080; }
      set src(value) { Promise.resolve().then(() => this.onload?.()); }
      decode() { return new Promise(() => {}); }
    };
    const image = await runtime.prepare(PNG_DATA_URL, { key: 'totalDistance' });
    expect(image.width).toBe(1080);
    expect(image.blob.size).toBeGreaterThan(0);
  });

  it.each(require('../src/tooltip-selection-utils').TAB_IDS)('does not capture or fabricate an empty %s view', async key => {
    const runtime = createDownloadRuntime();
    runtime.context.html2canvas = jest.fn();
    await runtime.capture({ key, hasData: false, targetElementId: 'missing' });
    expect(runtime.context.html2canvas).not.toHaveBeenCalled();
    expect(runtime.toast.textContent).toContain('Nothing to export');
  });

  it('scales private chart pixels to the physical canvas size at non-unit device pixel ratios', async () => {
    const runtime = createDownloadRuntime();
    runtime.mockCapture(PNG_DATA_URL);
    const drawImage = jest.fn();
    const source = { tagName: 'CANVAS', width: 970, height: 525, getContext: () => ({ drawImage }) };
    const clean = { width: 776, height: 420 };
    runtime.elements.captureTarget = source;
    runtime.context.window.dashboardTooltips = { getPinned: () => null, adapters: new Map([['totalDistance', { snapshotCapture: () => ({ canvas: clean, sourceCanvas: source }) }]]) };
    await runtime.capture({ key: 'totalDistance', hasData: true, targetElementId: 'captureTarget' });
    expect(drawImage).toHaveBeenCalledWith(clean, 0, 0, 970, 525);
  });

  it('uses private snapshot dimensions when the live Chart.js canvas is zero-sized', async () => {
    const runtime = createDownloadRuntime();
    runtime.mockCapture(PNG_DATA_URL);
    const drawImage = jest.fn();
    const source = { tagName: 'CANVAS', width: 0, height: 0, querySelectorAll: () => [], getContext: () => ({ drawImage }) };
    const clone = { tagName: 'CANVAS', width: 0, height: 0, style: {}, getContext: () => ({ drawImage }) };
    const clean = { width: 960, height: 500 };
    source.cloneNode = () => clone;
    runtime.elements.captureTarget = source;
    runtime.context.window.dashboardTooltips = {
      getPinned: () => null,
      adapters: new Map([['totalDistance', { snapshotCapture: () => ({ canvas: clean, sourceCanvas: source }) }]])
    };

    await runtime.capture({ key: 'totalDistance', hasData: true, targetElementId: 'captureTarget' });

    expect(clone).toMatchObject({ width: 960, height: 500 });
    expect(drawImage).toHaveBeenCalledWith(clean, 0, 0, 960, 500);
  });

  it('isolates source, pin and metadata before delayed assets and never restores stale live state', async () => {
    const runtime = createDownloadRuntime();
    runtime.mockCapture(PNG_DATA_URL);
    const gate = deferredValue();
    const copiedSource = { id: 'snapshot', style: {}, content: 'original pixels', querySelectorAll: () => [] };
    const source = { id: 'captureTarget', content: 'original pixels', cloneNode: () => ({ ...copiedSource }), querySelectorAll: () => [], getBoundingClientRect: () => ({ width: 800, height: 400 }) };
    runtime.elements.captureTarget = source;
    let pin = { content: { title: 'Original selection' }, anchor: { visibility: 'visible' } };
    const resolveExportAnchor = jest.fn();
    const getPinned = jest.fn(() => pin);
    runtime.context.window.dashboardTooltips = { getPinned, adapters: new Map([['totalDistance', { resolveExportAnchor }]]) };
    runtime.context.assetGate = gate;
    vm.runInContext('loadExportAssets = () => assetGate.promise; drawExportComposition = (canvas, target) => { this.capturedTarget = target; return "' + PNG_DATA_URL + '"; };', runtime.context);
    const target = { key: 'totalDistance', hasData: true, targetElementId: 'captureTarget', filters: [{ label: 'Sport', value: 'Run' }] };
    const pending = runtime.capture(target);
    source.content = 'replacement pixels';
    target.filters[0].value = 'Bike';
    pin = { content: { title: 'New selection' } };
    gate.resolve({});
    await pending;
    const capturedSource = runtime.context.html2canvas.mock.calls[0][0];
    expect(capturedSource).not.toBe(source);
    expect(capturedSource.content).toBe('original pixels');
    expect(runtime.context.capturedTarget.filters[0].value).toBe('Run');
    expect(runtime.context.capturedTarget.pinnedSelection).toBeNull();
    expect(resolveExportAnchor).not.toHaveBeenCalled();
    expect(getPinned).not.toHaveBeenCalled();
    expect(pin.content.title).toBe('New selection');
  });

  it('releases its independent media source exactly once when capture fails', async () => {
    const runtime = createDownloadRuntime();
    runtime.mockCapture(PNG_DATA_URL);
    const lease = { prepare: jest.fn().mockResolvedValue(), release: jest.fn() };
    runtime.context.window.mediaGalleryDashboard = { acquireExportCapture: jest.fn(() => lease) };
    runtime.context.html2canvas.mockRejectedValue(new Error('Capture failed'));
    await runtime.capture({ key: 'mediaGallery', hasData: true, targetElementId: 'captureTarget' });
    expect(runtime.context.window.mediaGalleryDashboard.acquireExportCapture).toHaveBeenCalledTimes(1);
    expect(lease.prepare).toHaveBeenCalledTimes(1);
    expect(lease.release).toHaveBeenCalledTimes(1);
    expect(runtime.toast.textContent).toContain('Capture failed');
  });

  it('uses a fresh image for each intentional export after native-picker fallback', async () => {
    const picker = jest.fn().mockRejectedValue(Object.assign(new Error('Restricted'), { name: 'SecurityError' }));
    const runtime = createDownloadRuntime({ showSaveFilePicker: picker });
    const original = runtime.getImage();
    await runtime.download();
    runtime.setImage({ ...original, target: 'workoutTime' });
    runtime.showPreview(PNG_DATA_URL);
    await runtime.download();
    expect(picker).toHaveBeenCalledTimes(2);
    expect(runtime.downloadLinks).toHaveLength(2);
    expect(runtime.downloadLinks[1].download).toMatch(/workoutTime/);
    expect(runtime.getImage()).toBeNull();
  });

  it('keeps the preview and image until the browser handoff runs', async () => {
    let duringHandoff;
    const runtime = createDownloadRuntime({ onDownload: () => {
      duringHandoff = {
        open: !runtime.elements.exportPreviewModal.classList.contains('hidden'),
        disabled: runtime.elements.exportPreviewDownloadBtn.disabled,
        image: runtime.getImage()
      };
    } });
    const original = runtime.getImage();
    await runtime.download();
    expect(duringHandoff).toEqual({ open: true, disabled: true, image: original });
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(true);
    expect(runtime.getImage()).toBeNull();
  });

  it('closes after browser handoff and a repeated click cannot download the old image', async () => {
    const runtime = createDownloadRuntime();
    await runtime.download();
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(true);
    expect(runtime.getImage()).toBeNull();
    await runtime.download();
    expect(runtime.downloadLinks).toHaveLength(1);
  });

  it('closes the originating PB opening and restores its source focus', async () => {
    const runtime = createDownloadRuntime();
    const focus = jest.fn();
    runtime.openPb({ title: 'PB', axisLabel: 'Pace', records: [{}] }, { focus });
    runtime.setImage({ ...runtime.getImage(), target: { kind: 'pb-tile' }, pbOpening: runtime.getPbOpening() });
    await runtime.download();
    expect(runtime.elements.pbDetailOverlay.classList.contains('hidden')).toBe(true);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('keeps a replacement PB opening and a newer preview untouched (same record: %s)', async sameRecord => {
    const model = { title: 'PB A', axisLabel: 'Pace', records: [{}] };
    const firstFocus = jest.fn();
    const secondFocus = jest.fn();
    let newer;
    let original;
    const runtime = createDownloadRuntime({ onDownload: () => {
      runtime.closePreview();
      runtime.closePb();
      firstFocus.mockClear();
      runtime.openPb(sameRecord ? model : { ...model, title: 'PB B' }, { focus: secondFocus });
      newer = { ...original, target: { kind: 'tab', key: 'workoutTime' } };
      runtime.setImage(newer);
      runtime.showPreview(PNG_DATA_URL);
    } });
    runtime.openPb(model, { focus: firstFocus });
    const firstOpening = runtime.getPbOpening();
    runtime.setImage({ ...runtime.getImage(), target: { kind: 'pb-tile' }, pbOpening: firstOpening });
    original = runtime.getImage();
    await runtime.download();
    expect(runtime.getPbOpening()).not.toBe(firstOpening);
    expect(runtime.getImage()).toBe(newer);
    expect(runtime.elements.exportPreviewModal.classList.contains('hidden')).toBe(false);
    expect(runtime.elements.pbDetailOverlay.classList.contains('hidden')).toBe(false);
    expect(firstFocus).not.toHaveBeenCalled();
    expect(secondFocus).not.toHaveBeenCalled();
    expect(runtime.getFocus()).toBe('pbDetailClose');
  });

  it('does not close an unrelated open PB detail for a tab export', async () => {
    const runtime = createDownloadRuntime();
    runtime.openPb({ title: 'PB', axisLabel: 'Pace', records: [{}] }, { focus: jest.fn() });
    await runtime.download();
    expect(runtime.elements.pbDetailOverlay.classList.contains('hidden')).toBe(false);
  });
});
