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
  const elements = { exportToast: toast };
  let focused = null;
  for (const id of ['exportPreviewModal', 'exportPreviewImage', 'exportPreviewError', 'exportPreviewDownloadBtn', 'pbDetailOverlay', 'pbDetailTitle', 'pbDetailSubtitle', 'pbDetailExport', 'pbDetailClose']) {
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
    `${dashboardExportSource}\nthis.__downloadExportedImage = downloadExportedImage; this.__setLastExportedImage = value => { lastExportedImage = value; }; this.__prepare = (...args) => prepareExportImage(...args); this.__close = closeExportPreviewModal; this.__show = showExportPreviewModal; this.__image = () => lastExportedImage; this.__capture = exportVisualizationTarget; this.__mockCapture = dataUrl => { waitForChartRenderSettle = () => Promise.resolve(); loadExportAssets = () => Promise.resolve({}); drawExportComposition = () => dataUrl; };`,
    context,
    { filename: 'src/dashboard-export.js' }
  );
  context.__setLastExportedImage({
    dataUrl: PNG_DATA_URL,
    blob: new Blob([Buffer.from(PNG_BASE64, 'base64')], { type: 'image/png' }),
    target: 'paceMetrics'
  });

  return {
    download: context.__downloadExportedImage,
    anchors,
    downloadLinks,
    pickerCalls,
    toast,
    elements,
    timers,
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

describe('dashboard export download destination', () => {
  it('uses only one browser-managed save flow even when a native picker is available', async () => {
    const picker = jest.fn().mockRejectedValue(Object.assign(new Error('Restricted'), { name: 'NotAllowedError' }));
    const runtime = createDownloadRuntime({ showSaveFilePicker: picker });
    await runtime.download();
    expect(picker).not.toHaveBeenCalled();
    expect(runtime.downloadLinks).toHaveLength(1);
    expect(runtime.downloadLinks[0]).toMatchObject({ clicked: true, href: PNG_DATA_URL });
    expect(runtime.getImage()).toBeNull();
    await runtime.download();
    expect(runtime.downloadLinks).toHaveLength(1);
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

  it('never attempts the restricted native picker', async () => {
    const denial = Object.assign(new Error('Picker unavailable in this context'), { name: 'SecurityError' });
    const runtime = createDownloadRuntime({
      showSaveFilePicker: jest.fn().mockRejectedValue(denial)
    });

    await runtime.download();

    expect(runtime.downloadLinks).toHaveLength(1);
    expect(runtime.downloadLinks[0].clicked).toBe(true);
    expect(runtime.pickerCalls).toHaveLength(0);
    expect(runtime.toast.textContent).toMatch(/location|destination|Speicherort/i);
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
    expect(runtime.getImage().target).toBe(target);
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
    expect(runtime.toast.textContent).toMatch(/handed to your browser/);
    expect(runtime.timers.size).toBe(1);
    expect(runtime.getImage()).toBeNull();
  });
});

describe('owned export surface lifecycle', () => {
  it('uses a fresh image for a subsequent intentional export without opening a native picker', async () => {
    const picker = jest.fn();
    const runtime = createDownloadRuntime({ showSaveFilePicker: picker });
    const original = runtime.getImage();
    await runtime.download();
    runtime.setImage({ ...original, target: 'workoutTime' });
    runtime.showPreview(PNG_DATA_URL);
    await runtime.download();
    expect(picker).not.toHaveBeenCalled();
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
