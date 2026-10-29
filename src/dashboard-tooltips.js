(function (root) {
  const utils = root.tooltipSelectionUtils;

  function createController(options = {}) {
    const doc = options.document || root.document;
    const adapters = new Map();
    let state = null;
    let overlay = null;
    let origin = null;
    let revision = 0;

    function readContext(tabId) {
      return { tabId, datasetRevision: typeof dashboardDataRevision === 'number' ? dashboardDataRevision : 0, viewRevision: revision, renderGeneration: 0, settings: {} };
    }

    function render() {
      if (!doc?.body) return;
      if (!state) { overlay?.remove(); overlay = null; origin?.setAttribute?.('aria-pressed', 'false'); origin = null; return; }
      if (!overlay) {
        overlay = doc.createElement('section');
        overlay.id = 'pinnedVisualizationTooltip';
        overlay.className = 'visualization-detail-tooltip';
        overlay.dataset.tooltipInspector = 'true';
        overlay.setAttribute('role', 'region');
        overlay.setAttribute('aria-label', 'Selected visualization detail');
        overlay.style.position = 'fixed';
        overlay.style.zIndex = '90';
        doc.body.appendChild(overlay);
      }
      overlay.replaceChildren();
      if (state.mode === 'pinned') {
        origin?.setAttribute?.('aria-pressed', 'true');
        const status = doc.createElement('div');
        status.className = 'visualization-detail-status';
        status.textContent = 'Pinned';
        overlay.appendChild(status);
        const close = doc.createElement('button');
        close.type = 'button';
        close.className = 'visualization-detail-dismiss';
        close.textContent = 'Close';
        close.setAttribute('aria-label', 'Dismiss pinned detail');
        close.addEventListener('click', () => dismiss());
        overlay.appendChild(close);
      }
      const title = doc.createElement('strong');
      title.textContent = state.content.title || state.content.itemLabel || 'Selected item';
      overlay.appendChild(title);
      const body = doc.createElement('div');
      body.className = 'visualization-detail-body';
      utils.contentLines(state.content).slice(1).forEach(line => {
        const row = doc.createElement('div');
        row.textContent = line;
        body.appendChild(row);
      });
      if (state.anchor.visibility !== 'visible') {
        const note = doc.createElement('div');
        note.textContent = state.anchor.visibility === 'outside-view' ? 'Selected item is outside the current view' : state.anchor.associationLabel;
        body.appendChild(note);
      }
      overlay.appendChild(body);
      const width = root.innerWidth || 800;
      const height = root.innerHeight || 600;
      const measured = overlay.getBoundingClientRect();
      const placement = utils.resolveTooltipPlacement({ width: Math.min(360, width - 16), height: Math.min(measured.height || 200, height - 16) }, { width, height }, state.anchor);
      overlay.style.left = `${placement.left}px`;
      overlay.style.top = `${placement.top}px`;
      overlay.style.width = `${placement.width}px`;
      overlay.style.maxHeight = `${height - 16}px`;
    }

    function send(event) {
      state = utils.transitionSelection(state, event);
      render();
      return state;
    }

    function registerAdapter(tabId, adapter) {
      if (!utils.TAB_IDS.includes(tabId)) throw new TypeError('Unknown visualization');
      adapters.get(tabId)?.dispose?.();
      adapters.set(tabId, adapter);
      return adapter;
    }

    function show(tabId, item, pinned = false, focusTarget = null) {
      const context = adapters.get(tabId)?.readContext?.() || readContext(tabId);
      const selection = { ...item, context };
      if (focusTarget && (pinned || state?.mode !== 'pinned')) refreshOrigin(focusTarget);
      return send({ type: pinned ? 'select' : 'hover', context, selection });
    }

    function refreshOrigin(target) {
      if (origin !== target) origin?.setAttribute?.('aria-pressed', 'false');
      origin = target;
      origin?.setAttribute?.('aria-pressed', state?.mode === 'pinned' ? 'true' : 'false');
    }

    function dismiss() {
      const target = origin;
      send({ type: 'dismiss' });
      if (target?.isConnected !== false) target?.focus?.();
    }

    function invalidate() {
      revision += 1;
      send({ type: 'reset' });
    }

    function getPinned(tabId) {
      return state?.context.tabId === tabId ? utils.copyPinnedSelection(state, adapters.get(tabId)?.readContext?.() || readContext(tabId)) : null;
    }

    function refreshAnchor() {
      if (!state) return;
      const anchor = adapters.get(state.context.tabId)?.projectAnchor?.(state) || state.anchor;
      send({ type: 'anchor', anchor, context: state.context });
    }

    return { adapters, registerAdapter, readContext, show, send, dismiss, invalidate, getPinned, refreshAnchor, refreshOrigin, getState: () => state, ownsKeyboard: target => !!target?.closest?.('[data-tooltip-inspector]'), dispose() { for (const adapter of adapters.values()) adapter.dispose?.(); adapters.clear(); send({ type: 'reset' }); } };
  }

  const controller = createController();

  function resolveCaptureAnchor(selection, captureContext, element, point = { x: 0.5, y: 0.5 }) {
    const bounds = captureContext.element?.getBoundingClientRect?.();
    const rect = element?.getBoundingClientRect?.();
    if (!(bounds?.width > 0 && bounds?.height > 0 && rect?.width >= 0 && rect?.height >= 0 && (rect.width > 0 || rect.height > 0))) throw new Error('Could not resolve the selected item in the export');
    if (!point || !['x', 'y'].every(key => Number.isFinite(point[key]))) throw new Error('Could not resolve a finite selected-item anchor');
    const capturePoint = { x: (rect.left - bounds.left + point.x * rect.width) / bounds.width, y: (rect.top - bounds.top + point.y * rect.height) / bounds.height };
    if (!['x', 'y'].every(key => Number.isFinite(capturePoint[key]) && capturePoint[key] >= 0 && capturePoint[key] <= 1)) {
      return { ...selection.anchor, visibility: 'outside-view', capturePoint: null, associationLabel: `${selection.content.itemLabel || selection.content.title}: outside the current view` };
    }
    return { ...selection.anchor, visibility: 'visible', capturePoint };
  }

  function contentFromChart(chart, hits, position) {
    const tooltip = chart.tooltip;
    if (!tooltip || !hits.length) return null;
    tooltip.setActiveElements(hits, position);
    tooltip.update(true);
    const title = (tooltip.title || []).join(' ');
    const lines = [...(tooltip.beforeBody || []), ...(tooltip.body || []).flatMap(body => [...(body.before || []), ...(body.lines || []), ...(body.after || [])]), ...(tooltip.afterBody || [])];
    return { title, itemLabel: title || String(chart.data.labels?.[hits[0].index] || chart.data.datasets[hits[0].datasetIndex]?.label || 'Selected item'), sections: [{ heading: '', rows: lines.map(value => ({ label: '', value: String(value) })) }], footerLines: [...(tooltip.footer || [])], notes: [] };
  }

  function attachChart(tabId, chart) {
    if (!chart?.canvas?.addEventListener || !chart.getElementsAtEventForMode) return;
    const canvas = chart.canvas;
    let currentIndex = -1;
    function copyChartInput(value) {
      if (value instanceof Date) return new Date(value.getTime());
      if (Array.isArray(value)) return value.map(copyChartInput);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, copyChartInput(entry)]));
      return value;
    }
    const listeners = [];
    const listen = (target, name, handler) => { target.addEventListener(name, handler); listeners.push(() => target.removeEventListener(name, handler)); };
    const itemFor = (hits, position) => {
      const content = contentFromChart(chart, hits, position);
      if (!content) return null;
      const first = hits[0];
      const rect = canvas.getBoundingClientRect();
      const element = chart.getDatasetMeta(first.datasetIndex).data[first.index];
      const point = element.tooltipPosition ? element.tooltipPosition() : element;
      const itemId = hits.map(hit => `${chart.data.datasets[hit.datasetIndex]?.label || hit.datasetIndex}:${chart.data.labels?.[hit.index] || hit.index}`).join('|');
      return { selectionKey: `${tabId}:${itemId}`, content, anchor: { kind: 'chart-item', itemId, chartElements: hits.map(hit => ({ datasetIndex: hit.datasetIndex, index: hit.index })), normalizedPoint: { x: (rect.left + point.x) / (root.innerWidth || 800), y: (rect.top + point.y) / (root.innerHeight || 600) }, capturePoint: { x: point.x / chart.width, y: point.y / chart.height }, visibility: 'visible', associationLabel: content.itemLabel } };
    };
    const hitsFor = event => chart.getElementsAtEventForMode(event, chart.options.interaction?.mode || 'nearest', { intersect: true, ...(chart.options.interaction || {}) }, false);
    const selectHits = (hits, position, pinned) => {
      const item = itemFor(hits, position);
      if (item) { controller.show(tabId, item, pinned, canvas); chart.draw?.(); }
    };
    listen(canvas, 'click', event => selectHits(hitsFor(event), { x: event.offsetX || 0, y: event.offsetY || 0 }, true));
    canvas.tabIndex = 0;
    canvas.dataset.tooltipInspector = 'true';
    canvas.setAttribute('role', 'button');
    canvas.setAttribute('aria-pressed', 'false');
    canvas.setAttribute('aria-label', `${tabId} data inspection`);
    listen(canvas, 'keydown', event => {
      if (event.key === 'Escape' && controller.getPinned(tabId)) { event.preventDefault(); event.stopPropagation(); controller.dismiss(); return; }
      const valid = chart.data.datasets.flatMap((dataset, datasetIndex) => chart.isDatasetVisible(datasetIndex) ? dataset.data.map((value, index) => ({ datasetIndex, index })).filter(hit => chart.getDatasetMeta(datasetIndex).data[hit.index] && chart.data.datasets[datasetIndex].label !== '') : []);
      if (!valid.length) return;
      const inspect = (hit, pinned) => {
        const element = chart.getDatasetMeta(hit.datasetIndex).data[hit.index];
        const hits = chart.options.interaction?.mode === 'index' ? valid.filter(candidate => candidate.index === hit.index) : [hit];
        selectHits(hits, { x: element.x, y: element.y }, pinned);
      };
      if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        currentIndex = (currentIndex + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + valid.length) % valid.length;
        const hit = valid[currentIndex];
        inspect(hit, false);
      } else if (['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        currentIndex = Math.max(0, currentIndex);
        const hit = valid[currentIndex % valid.length];
        inspect(hit, true);
      }
    });
    const plugin = {
      id: `pinned-detail-${tabId}`,
      beforeTooltipDraw() { if (controller.getPinned(tabId)) return false; },
      afterDestroy() { listeners.forEach(remove => remove()); }
    };
    if (chart.config?.plugins) { chart.config.plugins.push(plugin); chart._plugins?.invalidate?.(); chart.update('none'); }
    controller.registerAdapter(tabId, {
      readContext: () => controller.readContext(tabId),
      resolveItem: hitsFor, describeItem: itemFor,
      projectAnchor: selection => {
        const rect = canvas.getBoundingClientRect();
        const point = selection.anchor.capturePoint;
        if (!point) return selection.anchor;
        return { ...selection.anchor, normalizedPoint: { x: (rect.left + point.x * rect.width) / (root.innerWidth || 800), y: (rect.top + point.y * rect.height) / (root.innerHeight || 600) } };
      },
      snapshotCapture(selection) {
        const privateCanvas = root.document.createElement('canvas');
        privateCanvas.width = tabId === 'pieCharts' ? 560 : chart.width;
        privateCanvas.height = tabId === 'pieCharts' ? 560 : chart.height;
        const options = copyChartInput(chart.config.options);
        options.responsive = false; options.animation = false; options.devicePixelRatio = 1;
        options.plugins = { ...options.plugins, tooltip: { enabled: false } };
        const privateChart = new root.Chart(privateCanvas, {
          type: chart.config.type, data: copyChartInput(chart.data), options,
          plugins: (chart.config.plugins || []).filter(entry => entry !== plugin)
        });
        chart.data.datasets.forEach((dataset, index) => privateChart.setDatasetVisibility(index, chart.isDatasetVisible(index)));
        privateChart.update('none');
        const hit = selection?.anchor.chartElements?.[0];
        const selectedElement = hit && privateChart.getDatasetMeta(hit.datasetIndex)?.data[hit.index];
        const selectedPoint = selectedElement?.tooltipPosition?.() || selectedElement;
        const exportPoint = selectedPoint ? { x: selectedPoint.x / privateCanvas.width, y: selectedPoint.y / privateCanvas.height } : selection?.anchor.capturePoint;
        const copy = root.document.createElement('canvas');
        copy.width = privateCanvas.width; copy.height = privateCanvas.height;
        copy.getContext('2d').drawImage(privateCanvas, 0, 0);
        privateChart.destroy();
        return { canvas: copy, sourceCanvas: canvas, resolveExportAnchor: selection ? captureContext => {
          if (!exportPoint) throw new Error('Could not resolve the selected chart item');
          const element = captureContext.element.querySelector?.('[data-export-chart-image]')
            || (captureContext.element.tagName === 'CANVAS' ? captureContext.element : captureContext.element.querySelector?.('canvas'));
          return resolveCaptureAnchor(selection, captureContext, element, exportPoint);
        } : null };
      },
      dispose() { listeners.forEach(remove => remove()); const plugins = chart.config?.plugins; if (plugins) { const index = plugins.indexOf(plugin); if (index >= 0) plugins.splice(index, 1); } }
    });
    return chart;
  }

  root.dashboardTooltips = { ...controller, createController, attachChart, contentFromChart, resolveCaptureAnchor };
  if (root.document?.addEventListener) {
    root.document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && controller.getState()?.mode === 'pinned' && (controller.ownsKeyboard(event.target) || root.document.getElementById('pinnedVisualizationTooltip')?.contains(event.target))) {
        event.preventDefault(); event.stopImmediatePropagation(); controller.dismiss();
      }
    }, true);
    root.addEventListener?.('resize', controller.refreshAnchor);
    root.addEventListener?.('scroll', controller.refreshAnchor, true);
  }
})(window);