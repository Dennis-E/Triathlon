const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6XcAAAAASUVORK5CYII=';
const PNG_DATA_URL = `data:image/png;base64,${PNG_BASE64}`;

function deferredValue() {
  let resolve;
  const promise = new Promise(complete => { resolve = complete; });
  return { promise, resolve };
}

const dashboardExportSource = fs.readFileSync(
  path.join(__dirname, '../src/dashboard-export.js'),
  'utf8'
);

function createDownloadRuntime({ showSaveFilePicker, decodeError, imageWidth = 1, anchorError, onDownload } = {}) {
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
  const canvasCalls = { text: [], textFonts: [], images: [], fills: [], canvases: [] };
  const canvasContext = {
    measureText(text) { return { width: String(text).length * 12 }; },
    fillText(text) { canvasCalls.text.push(String(text)); canvasCalls.textFonts.push(this.font); },
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
      constructor() { this.naturalWidth = imageWidth; this.naturalHeight = 1; }
      decode() { return decodeError ? Promise.reject(decodeError) : Promise.resolve(); }
    },
    window: {
      powerPbUtils: { POWER_DURATIONS: [] },
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
            toDataURL() { return PNG_DATA_URL; }
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
    `${dashboardExportSource}\nthis.__exportTargetIds = EXPORT_CAPTURE_TARGET_IDS; this.__socialPresentation = getSocialExportPresentation; this.__exportPresentationData = getExportPresentationData; this.__exportTargetPages = getExportTargetPages; this.__exportActivePbDetail = exportActivePbDetail; this.__setExportFormat = setExportFormat; this.__setExportHumorEnabled = setExportHumorEnabled; this.__getExportFormat = () => selectedExportFormat; this.__downloadExportedImage = downloadExportedImage; this.__setLastExportedImage = value => { lastExportedImage = value; }; this.__prepare = (...args) => prepareExportImage(...args); this.__close = closeExportPreviewModal; this.__show = showExportPreviewModal; this.__image = () => lastExportedImage; this.__capture = exportVisualizationTarget; this.__targetForTest = getTabExportTarget; this.__drawExportComposition = drawExportComposition; this.__drawComposition = drawExportComposition; this.__mockCapture = dataUrl => { waitForChartRenderSettle = () => Promise.resolve(); loadExportAssets = () => Promise.resolve({}); drawExportComposition = () => dataUrl; };`,
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
    },
    getFocus: () => focused
  };
}

describe('dashboard export target inventory', () => {
  const expectedTargets = {
    totalDistance: 'totalDistanceChartWrapper',
    paceMetrics: 'paceMetricsChartWrapper',
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

  it.each([
    ['totalDistance', { sport: 'Run', period: '2024-2026', metricLabel: 'Distance', unit: 'km' }, 'My running years'],
    ['paceMetrics', { sport: 'Bike', metricLabel: 'Heart rate', period: '2024-2026', unit: 'bpm' }, 'My heart rate vs speed'],
    ['equipment', { equipmentFilter: 'Shoes', metric: 'distance' }, 'My most-used running shoes'],
    ['equipmentTimeline', { equipmentFilter: 'Shoes', periodMeaning: 'Usage span' }, 'My running shoe eras'],
    ['personalBests', {}, 'My personal bests'],
    ['heatmap', { sport: 'Run', period: '2024-2026' }, 'My training playground'],
    ['distributions', {}, 'My training distribution'],
    ['workoutTime', {}, 'My workout rhythm'],
    ['trainingCalendar', {}, 'My training year'],
    ['wordcloud', {}, 'My workout words'],
    ['pieCharts', {}, 'How I train'],
    ['lifetimeStatistics', {}, 'My training totals'],
    ['mediaGallery', {}, 'My training moments']
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

  it('does not add humor to the heart-rate-versus-performance comparison', () => {
    const runtime = createDownloadRuntime();
    const presentation = runtime.context.__socialPresentation('paceMetrics', {
      sport: 'Bike', metricLabel: 'Heart rate'
    }, { humorEnabled: true });

    expect(presentation.secondaryLine).toBeNull();
    expect(presentation.headline).toBe('My heart rate vs speed');
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
    runtime.openPb({
      title: 'Run 5 km',
      axisLabel: 'Time',
      direction: 'down',
      records: [first, improvement, current]
    }, { focus() {} });

    expect(runtime.context.window.personalBestsDashboard.getActiveExportData()).toEqual({
      title: 'Run 5 km',
      metricLabel: 'Time',
      direction: 'down',
      recordCount: 3,
      records: [
        { value: 1100, displayValue: '1100', date: first.date, sourceType: 'activity' },
        { value: 900, displayValue: '900', date: improvement.date, sourceType: null },
        { value: 850, displayValue: '850', date: current.date, sourceType: 'official race' }
      ],
      firstRecord: { value: 1100, displayValue: '1100', date: first.date, sourceType: 'activity' },
      currentRecord: { value: 850, displayValue: '850', date: current.date, sourceType: 'official race' },
      best: { value: 850, displayValue: '850', date: current.date, title: 'Current race', sourceType: 'official race' },
      milestones: [
        { kind: 'first', value: 1100, displayValue: '1100', date: first.date, title: 'First effort', sourceType: 'activity' },
        { kind: 'largestImprovement', value: 900, displayValue: '900', date: improvement.date, title: 'Big improvement', sourceType: null },
        { kind: 'current', value: 850, displayValue: '850', date: current.date, title: 'Current race', sourceType: 'official race' }
      ]
    });
  });
});

describe('dashboard export composition', () => {
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
    expect(sizes).toEqual(expect.arrayContaining([64, 104, 30, 24]));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(24);
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
    await context.__setExportFormat('portrait');
    const target = {
      kind: 'tab',
      key: 'paceMetrics',
      title: 'My heart rate vs pace',
      targetElementId: 'captureTarget',
      hasData: true,
      presentation: { headline: 'My heart rate vs pace', context: [] }
    };

    await runtime.capture(target);

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

    expect(snapshotCapture).toHaveBeenCalledWith({ width: 960, height: 500, minFontSize: 30, axisTextColor: '#f8fafc' });
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
    expect(context.formatDraws[0].format).toBe('square');
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
    expect(context.humorDraws[0].line).toBeNull();
    await context.__setExportHumorEnabled(true);

    expect(context.humorDraws[1].captured).toBe(originalCapture);
    expect(context.humorDraws[1].headline).toBe(context.humorDraws[0].headline);
    expect(context.humorDraws[1].line).toBe("Apparently, I don't sit still.");
    expect(runtime.elements.exportHumorEnabled.checked).toBe(true);
  });

  it('limits yearly distance to ten periods and marks an incomplete current year', () => {
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
    expect(renderedText).not.toContain('2015');
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
      mediaGalleryIncludeRoutes: { checked: false }
    };
    context.window.exportUtils = require('../src/export-utils');
    context.window.mediaGalleryDashboard = {
      getExportContext: () => [
        { label: 'Year', value: '2025' }, { label: 'Sport', value: 'Run' }, { label: 'Routes', value: 'Excluded' }
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
        { label: 'Sport', value: 'Run' },
        { label: 'Routes', value: 'Excluded' }
      ]),
      availableControls: expect.arrayContaining([
        { label: 'Include routes', controls: [{ label: 'Excluded', selected: false }] }
      ])
    });
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
    runtime.context.window.dashboardTooltips = { getPinned: () => pin, adapters: new Map() };
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
    expect(runtime.context.capturedTarget.pinnedSelection.content.title).toBe('Original selection');
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
