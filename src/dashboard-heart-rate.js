(function attachHeartRateDashboard(root) {
  let chart = null;
  let model = null;
  let registrySource = null;
  let registry = new Map();
  let modelRevision = 0;
  let renderContext = null;

  function element(id) {
    return document.getElementById(id);
  }

  function invalidate() {
    modelRevision += 1;
    root.dashboardTooltips?.invalidate();
    if (chart) chart.destroy();
    chart = null;
    model = null;
    renderContext = null;
    element('heartRateDetails')?.replaceChildren();
  }

  function reset() {
    invalidate();
    if (typeof invalidateHeartRateExport === 'function') invalidateHeartRateExport(false);
    registrySource = null;
    registry = new Map();
  }

  function describePoint(point) {
    const kind = point.kind === 'minimum' ? 'Minimum' : 'Maximum';
    const source = point.provenance?.source === 'records' ? 'From recorded measurements'
      : point.provenance?.source === 'summary' ? 'Direct summary' : '';
    return `${kind}: ${point.y} bpm | ${point.dateLabel}${point.startTimeLabel ? ` ${point.startTimeLabel}` : ''} | ${point.sport} | ${point.displayName}${source ? ` | ${source}` : ''}`;
  }

  function showDetails(points) {
    const details = element('heartRateDetails');
    if (!details || !points.length) return;
    details.replaceChildren();
    const entries = new Map();
    for (const point of points) {
      for (const contributor of point.contributors || []) {
        for (const source of [contributor.minimum, contributor.maximum].filter(Boolean)) entries.set(`${source.activityKey}:${source.kind}`, source);
      }
    }
    const sourcePoints = entries.size ? [...entries.values()] : points;
    if (points[0].contributors) {
      const period = document.createElement('p');
      period.className = 'text-sm text-slate-300 break-words';
      period.textContent = `${points[0].label} | ${points[0].contributors.length} contributing trainings | ${points[0].kind === 'minimum' ? 'Minimum' : 'Maximum'}: ${points[0].y} bpm`;
      details.appendChild(period);
    }
    const summary = document.createElement('p');
    summary.className = 'text-sm text-slate-200 break-words';
    const initial = points[0].sources?.[0] || sourcePoints[0];
    summary.textContent = describePoint(initial);
    if (sourcePoints.length > 1) {
      const selector = document.createElement('select');
      selector.className = 'w-full min-w-0 bg-slate-900 text-slate-200 border border-slate-700 rounded p-2 text-sm';
      selector.setAttribute('aria-label', 'Training and heart-rate measurement');
      sourcePoints.forEach((point, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = describePoint(point);
        selector.appendChild(option);
      });
      selector.value = String(sourcePoints.findIndex(source => source.activityKey === initial.activityKey && source.kind === initial.kind));
      selector.onchange = () => { summary.textContent = describePoint(sourcePoints[Number(selector.value)]); };
      details.appendChild(selector);
    }
    details.appendChild(summary);
  }

  function getHeartRateViewRange(filteredActivities) {
    const option = getCurrentTimeframeOption();
    let rangeStart;
    let rangeEnd;
    if (option.all) {
      const dates = (filteredActivities || []).filter(activity => activity && ['Run', 'Bike', 'Swim'].includes(activity.sport) &&
        activity.date !== null && activity.date !== undefined && activity.date !== '' && Number.isFinite(new Date(activity.date).getTime()))
        .map(activity => new Date(activity.date).getTime());
      if (!dates.length) return null;
      rangeStart = dates.reduce((minimum, date) => Math.min(minimum, date), Infinity);
      rangeEnd = dates.reduce((maximum, date) => Math.max(maximum, date), -Infinity);
    } else {
      const end = getTimeframeRange().maxDate;
      rangeEnd = end.getTime();
      rangeStart = shiftDateByUnit(end, option.amount, option.unit).getTime();
    }
    if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) return null;
    const padding = option.all && rangeStart === rangeEnd ? 86400000 : 0;
    return { rangeStart, rangeEnd, displayStart: rangeStart - padding, displayEnd: rangeEnd + padding,
      timeframeKey: option.key, aggregation: selectedAggregationLevel };
  }

  function render() {
    invalidate();
    renderControls();
    if (registrySource !== processedActivities) {
      registrySource = processedActivities;
      registry = new Map(processedActivities.map((activity, sourceOrdinal) => [activity, {
        activityKey: `${activity.id ?? 'training'}:${sourceOrdinal}`, sourceOrdinal
      }]));
    }
    const filtered = getDashboardFilteredActivities();
    const range = getHeartRateViewRange(filtered);
    model = root.heartRateUtils.buildHeartRatePeriodModel(filtered, { aggregation: selectedAggregationLevel,
      getActivityKey: activity => registry.get(activity), rangeStart: range?.rangeStart, rangeEnd: range?.rangeEnd });
    const canvas = element('heartRateChart');
    const empty = element('heartRateEmptyState');
    const hasData = model.activityCount > 0 && range !== null;
    if (empty) {
      empty.textContent = hasData ? '' : 'No usable heart-rate extrema for the selected filters.';
      empty.classList.toggle('hidden', hasData);
    }
    canvas?.classList.toggle('hidden', !hasData);
    const share = element('heartRateShareBtn');
    if (share) share.disabled = !hasData;
    if (!hasData && typeof invalidateHeartRateExport === 'function') invalidateHeartRateExport(false);
    if (!hasData || !canvas) return;
    renderContext = { sport: selectedSportFilter, aggregation: selectedAggregationLevel,
      timeframeKey: range.timeframeKey, viewRange: { ...range }, datasetRevision: dashboardDataRevision, modelRevision };
    const rangeLabel = document.createElement('p');
    rangeLabel.id = 'heartRateRangeLabel';
    rangeLabel.className = 'w-full min-w-0 text-xs text-slate-400 break-words';
    rangeLabel.textContent = `${selectedAggregationLevel[0].toUpperCase() + selectedAggregationLevel.slice(1)} | ${new Date(range.rangeStart).toLocaleDateString()} - ${new Date(range.rangeEnd).toLocaleDateString()} | ${model.periodCount} periods`;
    element('heartRateFilters')?.appendChild(rangeLabel);
    const datasets = [
      { label: 'Minimum', data: model.minimumPoints, pointStyle: 'circle', backgroundColor: '#34d399', borderColor: '#10b981' },
      { label: 'Maximum', data: model.maximumPoints, pointStyle: 'triangle', backgroundColor: '#fb7185', borderColor: '#f43f5e' }
    ].map(dataset => ({ ...dataset, label: dataset.data.length ? dataset.label : `${dataset.label} (no data)`,
      showLine: false, clip: false, pointRadius: 4, pointHitRadius: 9,
      inspectionKeys: dataset.data.map(point => `${point.activityKey}:${point.kind}`) }));
    chart = new Chart(canvas.getContext('2d'), {
      type: 'scatter', data: { datasets }, plugins: [],
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'point', intersect: true },
        plugins: {
          legend: { labels: { color: '#cbd5e1', usePointStyle: true }, onClick() {} },
          tooltip: { enabled: false }
        },
        scales: {
          x: { type: 'linear', min: range.displayStart, max: range.displayEnd,
            title: { display: true, text: 'Calendar period', color: '#94a3b8' },
            ticks: { color: '#94a3b8', maxTicksLimit: root.innerWidth < 640 ? 3 : 5, maxRotation: 0,
              callback: value => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) },
            grid: { color: '#334155' } },
          y: { grace: '8%', title: { display: true, text: 'Heart rate (bpm)', color: '#94a3b8' },
            ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
        }
      }
    });
    root.dashboardTooltips?.attachChart('heartRate', chart, {
      resolveHits: (event, source) => source.getElementsAtEventForMode(event, 'point', { intersect: true }, false)
        .sort((first, second) => {
          const firstPoint = source.data.datasets[first.datasetIndex].data[first.index];
          const secondPoint = source.data.datasets[second.datasetIndex].data[second.index];
          return firstPoint.sourceOrdinal - secondPoint.sourceOrdinal || first.datasetIndex - second.datasetIndex;
        }),
      describeContent: (source, hits) => {
        const selected = hits.map(hit => source.data.datasets[hit.datasetIndex].data[hit.index]);
        showDetails(selected);
        const point = selected[0];
        return { title: `${point.kind === 'minimum' ? 'Minimum' : 'Maximum'}: ${point.y} bpm`,
          itemLabel: point.label, lines: [point.label, `${point.contributors.length} contributing trainings`, `${point.sources.length} extreme sources`] };
      },
      anchorPoint: (source, hit) => source.getDatasetMeta(hit.datasetIndex).data[hit.index]
    });
  }

  function renderControls() {
    const container = element('heartRateFilters');
    if (!container) return;
    const focusedId = document.activeElement?.id;
    container.replaceChildren();
    const descriptors = [
      { id: 'heartRateSportFilter', label: 'Sport', value: selectedSportFilter,
        options: ['All', 'Run', 'Bike', 'Swim'].map(value => ({ value, label: value === 'All' ? 'All sports' : value })), change: setSportFilter },
      { id: 'heartRateAggregationFilter', label: 'Calendar grouping', value: selectedAggregationLevel,
        options: ['daily', 'weekly', 'monthly', 'yearly'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) })), change: setAggregationLevel },
      { id: 'heartRateTimeframeFilter', label: 'Timeframe', value: selectedTimeframeByAggregation[selectedAggregationLevel],
        options: TIMEFRAME_OPTIONS[selectedAggregationLevel].map(option => ({ value: option.key, label: option.label })), change: setTimeframeFilter }
    ];
    descriptors.forEach(descriptor => {
      const label = document.createElement('label');
      label.className = 'grid min-w-0 max-w-full gap-1 text-xs text-slate-400';
      label.setAttribute('data-filter-summary', '');
      label.setAttribute('data-filter-label', descriptor.label);
      const caption = document.createElement('span');
      caption.textContent = descriptor.label;
      const select = document.createElement('select');
      select.id = descriptor.id;
      select.setAttribute('aria-label', descriptor.label);
      select.className = 'max-w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200';
      descriptor.options.forEach(entry => {
        const option = document.createElement('option');
        option.value = entry.value;
        option.textContent = entry.label;
        select.appendChild(option);
      });
      select.value = descriptor.value;
      select.onchange = () => descriptor.change(select.value);
      label.appendChild(caption);
      label.appendChild(select);
      container.appendChild(label);
    });
    if (focusedId) element(focusedId)?.focus();
  }

  function getExportData() {
    if (!chart || !model || !renderContext || model.activityCount === 0) return null;
    const datasets = chart.data.datasets.map(dataset => ({ label: dataset.label,
      backgroundColor: dataset.backgroundColor, borderColor: dataset.borderColor,
      pointStyle: dataset.pointStyle, pointRadius: 10, borderWidth: 2, showLine: false, clip: false,
      data: dataset.data.map(point => ({ x: point.x, y: point.y })) }));
    const legend = { items: datasets.map(dataset => ({ label: dataset.label, color: dataset.backgroundColor, pointStyle: dataset.pointStyle })) };
    const bounds = renderContext.viewRange;
    const dayLabel = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      title: 'Heart-rate minimum and maximum', sport: renderContext.sport, metric: 'heartRate', aggregation: renderContext.aggregation,
      metricLabel: 'Minimum / maximum heart rate', unit: 'bpm', activityCount: model.activityCount, periodCount: model.periodCount,
      periodLabels: model.periods.map(period => period.label),
      period: `${dayLabel(new Date(bounds.rangeStart))} - ${dayLabel(new Date(bounds.rangeEnd))}`,
      periodStart: bounds.rangeStart, periodEnd: bounds.rangeEnd, viewBounds: { min: bounds.displayStart, max: bounds.displayEnd },
      modelRevision, points: datasets.flatMap(dataset => dataset.data.map(point => ({ ...point }))),
      series: legend.items.map(item => ({ ...item })), legend,
      xAxisTitle: 'Calendar period', yAxisTitle: 'Heart rate (bpm)',
      chartInput: { type: 'scatter', data: { datasets }, visibility: [true, true], plugins: [],
        options: { responsive: false, animation: false, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { type: 'linear', min: chart.config.options.scales.x.min, max: chart.config.options.scales.x.max,
              title: { display: true, text: 'Calendar period' },
              ticks: { maxTicksLimit: 3, maxRotation: 0,
                callback: value => new Date(value).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: '2-digit' }) } },
            y: { grace: '8%', title: { display: true, text: 'Heart rate (bpm)' } }
          }
        }
      }
    };
  }

  root.heartRateDashboard = { render, reset, invalidate, getRevision: () => modelRevision,
    getViewRange: getHeartRateViewRange, getKeyboardAdapter: () => getTotalDistanceKeyboardAdapter(), getExportData };
})(window);