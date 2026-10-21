const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dashboardExportSource = fs.readFileSync(
  path.join(__dirname, '../src/dashboard-export.js'),
  'utf8'
);

function createDownloadRuntime({ showSaveFilePicker } = {}) {
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
  const context = {
    console: { error: jest.fn() },
    Date,
    Blob,
    atob,
    Uint8Array,
    setTimeout: () => 1,
    clearTimeout() {},
    window: {
      exportUtils: {
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
        if (tagName !== 'a') throw new Error(`Unexpected element: ${tagName}`);
        return {
          click() { this.clicked = true; },
          href: '',
          download: ''
        };
      },
      getElementById(id) { return id === 'exportToast' ? toast : null; }
    }
  };

  vm.createContext(context);
  vm.runInContext(
    `${dashboardExportSource}\nthis.__downloadExportedImage = downloadExportedImage; this.__setLastExportedImage = value => { lastExportedImage = value; };`,
    context,
    { filename: 'src/dashboard-export.js' }
  );
  context.__setLastExportedImage({
    dataUrl: 'data:image/png;base64,aGVsbG8=',
    target: 'paceMetrics'
  });

  return {
    context,
    download: context.__downloadExportedImage,
    anchors,
    downloadLinks,
    pickerCalls,
    toast
  };
}

describe('dashboard export download destination', () => {
  it.each([true, false])('captures only an exportable Swim heatmap and preserves its preview (hasData=%s)', async hasData => {
    const runtime = createDownloadRuntime();
    const context = runtime.context;
    const map = { id: 'heatmapMapContainer' };
    const getOriginalElement = context.document.getElementById;
    const elements = {
      heatmapMapContainer: map,
      heatmapEmptyState: { classList: { contains: () => hasData } },
      heatmapSportBtnSwim: { textContent: 'Swim', classList: { contains: () => true }, getAttribute: () => null }
    };
    context.window.exportUtils = require('../src/export-utils');
    context.chartInstance = null;
    context.document.getElementById = id => elements[id] || getOriginalElement(id);
    context.document.querySelectorAll = () => [];
    context.html2canvas = jest.fn().mockResolvedValue({ width: 400, height: 300 });
    vm.runInContext(`
      waitForChartRenderSettle = async () => {};
      loadExportAssets = async () => ({});
      drawExportComposition = () => 'data:image/png;base64,aGVsbG8=';
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
    expect(target).toMatchObject({ targetElementId: 'heatmapMapContainer', filters: [{ label: 'Sport', value: 'Swim' }] });
    expect(context.html2canvas).toHaveBeenCalledWith(map, expect.objectContaining({ useCORS: true }));
    expect(context.previewForTest).toBe('data:image/png;base64,aGVsbG8=');
    await runtime.download();
    expect(runtime.downloadLinks[0].download).toMatch(/^trianalytica-heatmap-/);
  });

  it('opens the save picker from Download and writes the current PNG using its suggested filename', async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    const close = jest.fn().mockResolvedValue(undefined);
    const createWritable = jest.fn().mockResolvedValue({ write, close });
    const handle = { createWritable };
    const runtime = createDownloadRuntime({
      showSaveFilePicker: jest.fn().mockResolvedValue(handle)
    });

    const pendingSave = runtime.download();

    expect(runtime.pickerCalls).toHaveLength(1);
    expect(runtime.pickerCalls[0]).toMatchObject({
      suggestedName: expect.stringMatching(/^trianalytica-paceMetrics-\d+\.png$/),
      types: [{
        description: 'PNG image',
        accept: { 'image/png': ['.png'] }
      }]
    });
    await pendingSave;

    expect(createWritable).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(write.mock.calls[0][0].type).toBe('image/png');
    expect(Buffer.from(await write.mock.calls[0][0].arrayBuffer()).toString()).toBe('hello');
    expect(close).toHaveBeenCalledTimes(1);
    expect(runtime.downloadLinks).toHaveLength(0);
    expect(runtime.toast.textContent).toBe('');
  });

  it('treats user cancellation as quiet and does not trigger a fallback download', async () => {
    const cancellation = Object.assign(new Error('User cancelled'), { name: 'AbortError' });
    const runtime = createDownloadRuntime({
      showSaveFilePicker: jest.fn().mockRejectedValue(cancellation)
    });

    await runtime.download();

    expect(runtime.downloadLinks).toHaveLength(0);
    expect(runtime.toast.textContent).toBe('');
    expect(runtime.toast.classList.contains('hidden')).toBe(true);
  });

  it('uses the existing browser download and explains the limitation when the picker is unavailable', async () => {
    const runtime = createDownloadRuntime();

    await runtime.download();

    expect(runtime.downloadLinks).toHaveLength(1);
    expect(runtime.downloadLinks[0]).toMatchObject({
      clicked: true,
      download: expect.stringMatching(/^trianalytica-paceMetrics-\d+\.png$/),
      href: 'data:image/png;base64,aGVsbG8='
    });
    expect(runtime.toast.textContent).toMatch(/location|destination|Speicherort/i);
  });

  it('uses the existing browser download when picker access is denied before a destination is chosen', async () => {
    const denial = Object.assign(new Error('Picker unavailable in this context'), { name: 'SecurityError' });
    const runtime = createDownloadRuntime({
      showSaveFilePicker: jest.fn().mockRejectedValue(denial)
    });

    await runtime.download();

    expect(runtime.downloadLinks).toHaveLength(1);
    expect(runtime.downloadLinks[0].clicked).toBe(true);
    expect(runtime.toast.textContent).toMatch(/location|destination|Speicherort/i);
  });

  it('reports write failure without losing the preview or disabling a retry', async () => {
    const writeFailure = new Error('The selected file could not be written');
    const firstHandle = {
      createWritable: jest.fn().mockResolvedValue({
        write: jest.fn().mockRejectedValue(writeFailure),
        close: jest.fn()
      })
    };
    const secondHandle = {
      createWritable: jest.fn().mockResolvedValue({
        write: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined)
      })
    };
    const picker = jest.fn()
      .mockResolvedValueOnce(firstHandle)
      .mockResolvedValueOnce(secondHandle);
    const runtime = createDownloadRuntime({ showSaveFilePicker: picker });

    await runtime.download();
    expect(runtime.toast.textContent).toContain(writeFailure.message);
    expect(runtime.downloadLinks).toHaveLength(0);

    await runtime.download();
    expect(picker).toHaveBeenCalledTimes(2);
    expect(secondHandle.createWritable).toHaveBeenCalledTimes(1);
  });
});
