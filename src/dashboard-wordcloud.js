(function initializeWordcloudDashboard() {
  let rankedWords = [];
  let selectedWords = new Map();
  let activitySource = null;
  let renderVersion = 0;
  let listenersInitialized = false;
  let resizeObserver = null;
  let rankedListExpanded = true;
  let currentRenderComplete = false;
  let currentRenderHasContent = false;
  let currentRenderPromise = Promise.resolve(false);
  let resolveCurrentRender = null;

  const WORD_COLORS = ['#67e8f9', '#a5b4fc', '#f9a8d4', '#fde68a', '#86efac', '#c4b5fd'];

  function getElements() {
    return {
      panel: document.getElementById('vizPanelWordcloud'),
      layout: document.getElementById('wordcloudLayout'),
      canvas: document.getElementById('wordcloudCanvas'),
      slider: document.getElementById('wordcloudCountSlider'),
      countValue: document.getElementById('wordcloudCountValue'),
      list: document.getElementById('wordcloudWordList'),
      listPanel: document.getElementById('wordcloudListPanel'),
      listContent: document.getElementById('wordcloudListContent'),
      listToggle: document.getElementById('wordcloudListToggle'),
      listToggleIcon: document.getElementById('wordcloudListToggleIcon'),
      listToggleLabel: document.getElementById('wordcloudListToggleLabel'),
      emptyState: document.getElementById('wordcloudEmptyState'),
      unavailableState: document.getElementById('wordcloudUnavailableState'),
      unplacedNotice: document.getElementById('wordcloudUnplacedNotice')
    };
  }

  function setVisible(element, visible) {
    if (element) element.classList.toggle('hidden', !visible);
  }

  function applyRankedListLayout(elements) {
    if (!elements.layout || !elements.listPanel || !elements.listToggle) return;
    const collapsed = !rankedListExpanded;
    elements.layout.classList.toggle('is-list-collapsed', collapsed);
    elements.listPanel.classList.toggle('is-collapsed', collapsed);
    elements.listToggle.setAttribute('aria-expanded', rankedListExpanded ? 'true' : 'false');
    elements.listToggle.setAttribute('aria-label', `${rankedListExpanded ? 'Collapse' : 'Expand'} ranked word list`);
    if (elements.listToggleLabel) elements.listToggleLabel.textContent = `${rankedListExpanded ? 'Collapse' : 'Expand'} ranked words`;
    if (elements.listToggleIcon) elements.listToggleIcon.textContent = rankedListExpanded ? '›' : '‹';
    if (elements.listContent) elements.listContent.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
  }

  function toggleWordcloudList() {
    rankedListExpanded = !rankedListExpanded;
    const elements = getElements();
    applyRankedListLayout(elements);
    if (elements.panel && !elements.panel.classList.contains('hidden') && rankedWords.length) {
      const topWords = window.wordcloudUtils.getTopWords(rankedWords, Number(elements.slider.value));
      updateCloud(elements, topWords);
    }
    return rankedListExpanded;
  }

  function updateSelectionList(elements, topWords) {
    if (!elements.list) return;
    elements.list.replaceChildren();
    topWords.forEach((entry, index) => {
      const row = document.createElement('li');
      row.className = 'flex items-center justify-between gap-3 border-b border-slate-800 py-1.5 last:border-b-0';

      const label = document.createElement('label');
      label.className = 'flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-200';
      label.htmlFor = `wordcloudWord${index}`;

      const checkbox = document.createElement('input');
      checkbox.id = `wordcloudWord${index}`;
      checkbox.type = 'checkbox';
      checkbox.checked = selectedWords.get(entry.word) !== false;
      checkbox.className = 'h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:ring-indigo-500';
      checkbox.setAttribute('aria-label', `Show ${entry.word}, ${entry.count} occurrences`);
      checkbox.addEventListener('change', () => {
        selectedWords.set(entry.word, checkbox.checked);
        updateCloud(elements, topWords);
      });

      const wordLabel = document.createElement('span');
      wordLabel.className = 'truncate';
      wordLabel.textContent = entry.word;
      label.append(checkbox, wordLabel);

      const count = document.createElement('span');
      count.className = 'shrink-0 text-xs tabular-nums text-slate-400';
      count.textContent = entry.count.toLocaleString();
      count.setAttribute('aria-label', `${entry.count} occurrences`);
      row.append(label, count);
      elements.list.appendChild(row);
    });
  }

  function getCanvasDimensions(canvas) {
    const parentWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
    const width = Math.max(280, Math.floor(parentWidth || canvas.clientWidth || 640));
    const height = width < 480 ? 500 : Math.max(400, Math.min(560, Math.floor(width * 0.68)));
    return { width, height };
  }

  function getWordColor(word) {
    let hash = 0;
    for (let index = 0; index < word.length; index += 1) {
      hash = (hash * 31 + word.charCodeAt(index)) | 0;
    }
    return WORD_COLORS[Math.abs(hash) % WORD_COLORS.length];
  }

  function renderUnplacedNotice(elements, words) {
    if (!elements.unplacedNotice) return;
    elements.unplacedNotice.textContent = words.length
      ? `Could not place these words in the cloud: ${words.join(', ')}. They remain available in the word list.`
      : '';
    setVisible(elements.unplacedNotice, words.length > 0);
  }

  function beginCloudRender() {
    if (resolveCurrentRender) resolveCurrentRender(false);
    const version = ++renderVersion;
    currentRenderComplete = false;
    currentRenderHasContent = false;
    currentRenderPromise = new Promise(resolve => {
      resolveCurrentRender = resolve;
    });
    return version;
  }

  function finishCloudRender(version, completed, hasContent) {
    if (version !== renderVersion) return;
    currentRenderComplete = completed === true;
    currentRenderHasContent = currentRenderComplete && hasContent === true;
    const resolve = resolveCurrentRender;
    resolveCurrentRender = null;
    if (resolve) resolve(currentRenderHasContent);
  }

  function updateCloud(elements, topWords) {
    if (!elements.canvas) return;
    const included = topWords.filter(entry => selectedWords.get(entry.word) !== false);
    const version = beginCloudRender();
    const unavailable = !window.WordCloud || typeof window.WordCloud !== 'function' || !window.WordCloud.isSupported;
    setVisible(elements.unavailableState, unavailable && included.length > 0);
    setVisible(elements.emptyState, !unavailable && included.length === 0 && rankedWords.length > 0);
    renderUnplacedNotice(elements, []);
    if (unavailable || included.length === 0) {
      if (window.WordCloud && typeof window.WordCloud.stop === 'function') window.WordCloud.stop();
      finishCloudRender(version, false, false);
      return;
    }

    const dimensions = getCanvasDimensions(elements.canvas);
    elements.canvas.width = dimensions.width;
    elements.canvas.height = dimensions.height;
    elements.canvas.style.height = `${dimensions.height}px`;
    const minimumSize = 16;
    const maximumSize = 68;
    const minimumCount = Math.min(...included.map(entry => entry.count));
    const maximumCount = Math.max(...included.map(entry => entry.count));
    const minLog = Math.log(minimumCount);
    const maxLog = Math.log(maximumCount || 1);
    const drawnWords = new Set();
    const cleanupListeners = () => {
      elements.canvas.removeEventListener('wordclouddrawn', onWordDrawn);
      elements.canvas.removeEventListener('wordcloudstop', onWordcloudStop);
      elements.canvas.removeEventListener('wordcloudabort', onWordcloudAbort);
    };

    const onWordDrawn = event => {
      if (version !== renderVersion || !event.detail) return;
      const item = event.detail.item;
      const word = Array.isArray(item) ? item[0] : item && item.word;
      if (event.detail.drawn && word) drawnWords.add(word);
    };
    const onWordcloudStop = () => {
      cleanupListeners();
      if (version !== renderVersion) return;
      renderUnplacedNotice(elements, included.filter(entry => !drawnWords.has(entry.word)).map(entry => entry.word));
      finishCloudRender(version, true, drawnWords.size > 0);
    };
    const onWordcloudAbort = () => {
      cleanupListeners();
      if (version !== renderVersion) return;
      renderUnplacedNotice(elements, included.filter(entry => !drawnWords.has(entry.word)).map(entry => entry.word));
      finishCloudRender(version, false, false);
    };
    elements.canvas.addEventListener('wordclouddrawn', onWordDrawn);
    elements.canvas.addEventListener('wordcloudstop', onWordcloudStop);
    elements.canvas.addEventListener('wordcloudabort', onWordcloudAbort);

    try {
      window.WordCloud(elements.canvas, {
        list: included.map(entry => [entry.word, entry.count]),
        shuffle: false,
        rotateRatio: 0,
        minRotation: 0,
        maxRotation: 0,
        minSize: 12,
        shrinkToFit: true,
        drawOutOfBound: false,
        clearCanvas: true,
        abortThreshold: 350,
        abort() {},
        backgroundColor: '#020617',
        color: word => getWordColor(word),
        weightFactor: count => {
          if (maxLog <= minLog) return 28;
          const ratio = (Math.log(count) - minLog) / (maxLog - minLog);
          return minimumSize + Math.max(0, Math.min(1, ratio)) * (maximumSize - minimumSize);
        },
        gridSize: dimensions.width < 480 ? 12 : 8
      });
    } catch (error) {
      cleanupListeners();
      setVisible(elements.unavailableState, true);
      finishCloudRender(version, false, false);
    }
  }

  function updateWordCount(elements) {
    if (!elements.slider || !elements.countValue) return;
    const requested = Number(elements.slider.value);
    const actualCount = Math.min(requested, rankedWords.length);
    elements.countValue.textContent = `${actualCount} words`;
    const topWords = window.wordcloudUtils.getTopWords(rankedWords, requested);
    selectedWords = window.wordcloudUtils.reconcileWordSelection(topWords, selectedWords);
    updateSelectionList(elements, topWords);
    updateCloud(elements, topWords);
  }

  function initializeControls(elements) {
    if (listenersInitialized) return;
    listenersInitialized = true;
    if (elements.slider) elements.slider.addEventListener('input', () => updateWordCount(getElements()));
    if (typeof ResizeObserver !== 'undefined' && elements.canvas && elements.canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        const current = getElements();
        if (current.panel && !current.panel.classList.contains('hidden')) {
          const topWords = window.wordcloudUtils.getTopWords(rankedWords, Number(current.slider.value));
          updateCloud(current, topWords);
        }
      });
      resizeObserver.observe(elements.canvas.parentElement);
    }
    window.addEventListener('resize', () => {
      const current = getElements();
      if (current.panel && !current.panel.classList.contains('hidden') && rankedWords.length) {
        const topWords = window.wordcloudUtils.getTopWords(rankedWords, Number(current.slider.value));
        updateCloud(current, topWords);
      }
    });
  }

  function renderWordcloud() {
    const elements = getElements();
    initializeControls(elements);
    rankedListExpanded = true;
    applyRankedListLayout(elements);
    if (!window.wordcloudUtils) {
      setVisible(elements.unavailableState, true);
      return;
    }

    if (activitySource !== processedActivities) {
      activitySource = processedActivities;
      rankedWords = window.wordcloudUtils.getWordFrequencies(processedActivities);
      selectedWords = new Map();
    }

    setVisible(elements.emptyState, rankedWords.length === 0);
    setVisible(elements.unavailableState, false);
    if (elements.list) elements.list.replaceChildren();
    if (rankedWords.length === 0) {
      if (window.WordCloud && typeof window.WordCloud.stop === 'function') window.WordCloud.stop();
      renderUnplacedNotice(elements, []);
      finishCloudRender(beginCloudRender(), false, false);
      return;
    }
    updateWordCount(elements);
  }

  window.renderWordcloud = renderWordcloud;
  window.toggleWordcloudList = toggleWordcloudList;
  window.wordcloudDashboard = {
    hasExportableCloud() {
      return currentRenderComplete && currentRenderHasContent;
    },
    canRequestExport() {
      return Boolean(window.WordCloud && window.WordCloud.isSupported && rankedWords.length &&
        Array.from(selectedWords.values()).some(Boolean));
    },
    waitForCurrentRender() {
      return currentRenderPromise;
    }
  };
})();
