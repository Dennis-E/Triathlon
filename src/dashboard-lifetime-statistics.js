(function(root) {
  let tooltipAdapter = null;
  let sourceActivities = null;
  let sourceCountries = null;
  let statisticDetails = new Map();

  function pinMarkup(key, exportMode = false) {
    return exportMode ? '' : `<button type="button" data-statistic-pin="${escapeHtml(key)}" data-tooltip-inspector="true" aria-label="Pin details for ${escapeHtml(key)}" title="Pin details" class="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-600 text-slate-200"><i data-lucide="pin" class="h-4 w-4" aria-hidden="true"></i></button>`;
  }

  function statisticAnchor(key, target) {
    const rect = target?.getBoundingClientRect?.();
    return { kind: 'statistic', itemId: key, normalizedPoint: {
      x: Number.isFinite(rect?.left) ? (rect.left + (rect.width || 0) / 2) / (root.innerWidth || 800) : 0.5,
      y: Number.isFinite(rect?.top) ? (rect.top + (rect.height || 0) / 2) / (root.innerHeight || 600) : 0.5
    }, visibility: 'visible', associationLabel: statisticDetails.get(key)?.title || key };
  }

  function bindStatisticDetails(area, summary, countries) {
    const details = new Map();
    const add = (key, rows, notes = [], title = key) => details.set(key, {
      title, itemLabel: title, sections: [{ heading: '', rows }], footerLines: [], notes
    });
    const addMetric = (label, metric, formatter, unit) => add(label,
      [{ label, value: metricValue(metric, formatter, unit) }],
      metric.status === 'unavailable' ? ['No usable source values'] : []);
    addMetric('Total distance', summary.distance, value => formatNumber(value, 0), 'km');
    addMetric('Moving time', summary.movingTime, formatMovingTime, '');
    addMetric('Elevation gain', summary.elevationGain, value => formatNumber(value / 1000), 'km');
    [['Workouts', summary.workoutCount], ['Active days', summary.activeDayCount],
      ['Shoes used', summary.equipmentCounts.shoes], ['Bikes used', summary.equipmentCounts.bikes]]
      .forEach(([label, value]) => add(label, [{ label, value: formatNumber(value, 0) }]));
    summary.sportSummaries.forEach(sport => add(`sport:${sport.sport}`, [
      { label: 'Workouts', value: formatNumber(sport.workoutCount, 0) },
      { label: 'Distance', value: metricValue(sport.distance, value => formatNumber(value), 'km') },
      { label: 'Moving time', value: metricValue(sport.movingTime, formatMovingTime, '') }
    ], [], sport.sport));
    [['Longest distance', summary.longestByDistance, value => formatNumber(value, 0), 'km'],
      ['Longest moving time', summary.longestByMovingTime, formatMovingTime, '']].forEach(([label, activity, formatter, unit]) => {
      const rows = [{ label, value: activity ? `${formatter(activity.value)}${unit ? ` ${unit}` : ''}` : 'Not available' }];
      if (activity) rows.push({ label: 'Activity', value: activity.name || 'Activity' },
        { label: 'Date', value: activity.date instanceof Date && Number.isFinite(activity.date.getTime()) ? activity.date.toLocaleDateString() : 'Date unavailable' });
      add(label, rows, activity ? [] : ['No activity has a usable recorded value']);
    });
    const countryAvailable = countries && countries.status !== 'unavailable' && Number.isSafeInteger(countries.countryCount);
    add('Countries visited', [{ label: 'Countries visited', value: !countries ? 'Calculating...' : countryAvailable ? formatNumber(countries.countryCount, 0) : 'Not available' }],
      !countries ? ['Country names loading'] : !countryAvailable ? ['Location unavailable'] : [
        (countries.countryNames || []).filter(name => typeof name === 'string' && name.trim()).join(', ') || 'No countries identified',
        countries.status === 'partial' ? `Based on ${formatNumber(countries.trackedActivityCount, 0)} of ${formatNumber(countries.totalActivityCount, 0)} activities`
          : `All ${formatNumber(countries.totalActivityCount, 0)} activities included`
      ]);
    statisticDetails = details;
    const api = root.dashboardTooltips;
    if (!api?.registerAdapter) return;
    if (!tooltipAdapter) {
      const adapter = {
        readContext: () => api.readContext('lifetimeStatistics'),
        projectAnchor: selection => {
          const target = Array.from(area.querySelectorAll?.('[data-statistic-pin]') || []).find(button => button.dataset.statisticPin === selection.anchor.itemId);
          return target ? statisticAnchor(selection.anchor.itemId, target) : selection.anchor;
        },
        dispose() { area.onclick = null; tooltipAdapter = null; }
      };
      api.registerAdapter('lifetimeStatistics', adapter);
      tooltipAdapter = adapter;
    }
    area.onclick = event => {
      const button = event.target?.closest?.('[data-statistic-pin]');
      const key = button?.dataset.statisticPin;
      const content = statisticDetails.get(key);
      if (content) api.show('lifetimeStatistics', { selectionKey: `lifetimeStatistics:${key}`, content, anchor: statisticAnchor(key, button) }, true, button);
    };
    root.lucide?.createIcons?.();
    api.refreshAnchor?.();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatNumber(value, maximumFractionDigits = 1) {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
  }

  function formatMovingTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainderSeconds = seconds % 60;
    const parts = [];

    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (parts.length === 0 || (!days && !hours && !minutes)) parts.push(`${remainderSeconds}s`);
    return parts.join(' ');
  }

  function metricStatusMarkup(metric) {
    if (metric.status === 'unavailable') {
      return '<p class="mt-2 text-xs text-slate-400">No usable source values</p>';
    }
    return '';
  }

  function metricValue(metric, formatter, unit) {
    if (metric.status === 'unavailable' || metric.value === null) return 'Not available';
    return `${formatter(metric.value)}${unit ? ` ${unit}` : ''}`;
  }

  function renderPrimaryMetric(label, metric, formatter, unit, exportMode = false, prominent = true) {
    const cardClass = exportMode
      ? 'min-w-0 rounded-2xl border border-slate-700 bg-slate-900 p-8'
      : 'min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5';
    const valueClass = exportMode && prominent
      ? 'mt-5 break-words text-5xl font-bold leading-tight tabular-nums text-white'
      : exportMode
        ? 'mt-3 break-words text-3xl font-bold leading-tight tabular-nums text-white'
      : 'mt-2 break-words text-2xl font-semibold tabular-nums text-white';
    return `<article class="${cardClass}">
      <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(label)}</h3>
      <p class="${valueClass}">${escapeHtml(metricValue(metric, formatter, unit))}</p>
      ${metricStatusMarkup(metric)}
      ${pinMarkup(label, exportMode)}
    </article>`;
  }

  function renderSportSummary(sportSummary) {
    const distance = metricValue(sportSummary.distance, value => formatNumber(value), 'km');
    const movingTime = metricValue(sportSummary.movingTime, formatMovingTime, '');
    return `<tr class="border-t border-slate-800">
      <th scope="row" class="py-3 pr-4 text-left font-medium text-white">${escapeHtml(sportSummary.sport)} ${pinMarkup(`sport:${sportSummary.sport}`)}</th>
      <td class="px-3 py-3 text-right tabular-nums text-slate-200">${formatNumber(sportSummary.workoutCount, 0)}</td>
      <td class="px-3 py-3 text-right tabular-nums text-slate-200">${escapeHtml(distance)}</td>
      <td class="py-3 pl-3 text-right tabular-nums text-slate-200">${escapeHtml(movingTime)}</td>
    </tr>`;
  }

  function renderCountMilestone(label, value, exportMode = false) {
    const cardClass = exportMode
      ? 'min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-6'
      : 'min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4';
    const valueClass = exportMode
      ? 'mt-3 break-words text-3xl font-bold tabular-nums text-white'
      : 'mt-2 break-words text-xl font-semibold tabular-nums text-white';
    return `<article class="${cardClass}">
      <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(label)}</h3>
      <p class="${valueClass}">${formatNumber(value, 0)}</p>
      ${pinMarkup(label, exportMode)}
    </article>`;
  }

  function renderActivityMilestone(label, activity, formatter, unit, exportMode = false) {
    if (!activity) {
      return `<article class="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(label)}</h3>
        <p class="mt-2 text-xl font-semibold text-slate-300">Not available</p>
        <p class="mt-2 text-xs text-slate-400">No activity has a usable recorded value</p>
        ${pinMarkup(label, exportMode)}
      </article>`;
    }

    const activityDate = activity.date instanceof Date && Number.isFinite(activity.date.getTime())
      ? activity.date.toLocaleDateString()
      : 'Date unavailable';
    const value = `${formatter(activity.value)}${unit ? ` ${unit}` : ''}`;
    return `<article class="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(label)}</h3>
      <p class="mt-2 break-words text-xl font-semibold tabular-nums text-white">${escapeHtml(value)}</p>
      <p class="mt-2 break-words text-sm text-slate-300">${escapeHtml(activity.name)}</p>
      <p class="mt-1 text-xs text-slate-500">${escapeHtml(activityDate)}</p>
      ${pinMarkup(label, exportMode)}
    </article>`;
  }

  function renderMilestones(summary, exportMode = false) {
    const gridClass = exportMode
      ? 'grid min-w-0 grid-cols-4 gap-3'
      : 'grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4';
    return `<section aria-labelledby="lifetimeMilestonesHeading" class="space-y-3">
      <h3 id="lifetimeMilestonesHeading" class="text-sm font-semibold text-white">Lifetime milestones</h3>
      <div class="${gridClass}">
        ${renderPrimaryMetric('Elevation gain', summary.elevationGain, value => formatNumber(value / 1000), 'km', exportMode, false)}
        ${renderCountMilestone('Active days', summary.activeDayCount, exportMode)}
        ${renderActivityMilestone('Longest distance', summary.longestByDistance, value => formatNumber(value, 0), 'km', exportMode)}
        ${renderActivityMilestone('Longest moving time', summary.longestByMovingTime, formatMovingTime, '', exportMode)}
      </div>
    </section>`;
  }

  function renderEquipmentCounts(equipmentCounts, exportMode = false) {
    const gridClass = exportMode
      ? 'grid min-w-0 grid-cols-2 gap-3'
      : 'grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2';
    return `<section aria-label="Equipment totals" class="space-y-2">
      <div class="${gridClass}">
        ${renderCountMilestone('Shoes used', equipmentCounts.shoes, exportMode)}
        ${renderCountMilestone('Bikes used', equipmentCounts.bikes, exportMode)}
      </div>
    </section>`;
  }

  function renderCountriesVisited(countrySummary, exportMode = false) {
    const loading = !countrySummary;
    const unavailable = !loading && (
      countrySummary.status === 'unavailable'
      || !Number.isSafeInteger(countrySummary.countryCount)
    );
    const value = unavailable
      ? 'Not available'
      : loading
        ? 'Calculating...'
        : formatNumber(countrySummary.countryCount, 0);
    const countryNames = countrySummary && Array.isArray(countrySummary.countryNames)
      ? countrySummary.countryNames.filter(name => typeof name === 'string' && name.trim())
      : [];
    const namesText = loading
      ? 'Country names loading'
      : unavailable
        ? 'Location unavailable'
        : countryNames.length > 0
          ? countryNames.join(', ')
          : 'No countries identified';
    const coverageText = !countrySummary
      ? ''
      : unavailable
        ? ''
        : countrySummary.status === 'partial'
          ? `Based on ${formatNumber(countrySummary.trackedActivityCount, 0)} of ${formatNumber(countrySummary.totalActivityCount, 0)} activities`
          : `All ${formatNumber(countrySummary.totalActivityCount, 0)} activities included`;
    const cardClass = exportMode
      ? 'min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-6'
      : 'min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5';
    const valueClass = exportMode
      ? 'mt-3 break-words text-3xl font-bold tabular-nums text-white'
      : 'mt-2 break-words text-xl font-semibold tabular-nums text-white';
    return `<article aria-label="Countries visited" class="${cardClass}">
      <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">Countries visited</h3>
      <p class="${valueClass}">${escapeHtml(value)}</p>
      <p class="mt-2 break-words text-sm text-slate-200">${escapeHtml(namesText)}</p>
      ${coverageText ? `<p class="mt-1 break-words text-xs text-slate-500">${escapeHtml(coverageText)}</p>` : ''}
      ${pinMarkup('Countries visited', exportMode)}
    </article>`;
  }

  function renderLifetimeStatistics(summary, options = {}) {
    const exportMode = options.export === true;
    const countrySummary = options.countryCountSummary || null;
    const rows = summary.sportSummaries.map(renderSportSummary).join('');
    const sportBreakdown = exportMode
      ? ''
      : rows
      ? `<section aria-labelledby="lifetimeSportBreakdownHeading" class="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
          <h3 id="lifetimeSportBreakdownHeading" class="text-sm font-semibold text-white">By sport</h3>
          <div class="mt-3 overflow-x-auto">
            <table class="w-full min-w-[34rem] text-sm">
              <thead><tr class="text-xs text-slate-400"><th scope="col" class="pb-2 pr-4 text-left font-medium">Sport</th><th scope="col" class="px-3 pb-2 text-right font-medium">Workouts</th><th scope="col" class="px-3 pb-2 text-right font-medium">Distance</th><th scope="col" class="pb-2 pl-3 text-right font-medium">Moving time</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>`
      : '<p class="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">No supported sport categories are present.</p>';

    return `<section aria-labelledby="lifetimeStatisticsHeading" class="${exportMode ? 'space-y-8' : 'space-y-5'}">
      ${exportMode ? '' : '<h2 id="lifetimeStatisticsHeading" class="sr-only">Lifetime Statistics</h2>'}
      <div class="grid min-w-0 ${exportMode ? 'grid-cols-4 gap-3' : 'grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'}">
        ${renderPrimaryMetric('Total distance', summary.distance, value => formatNumber(value, 0), 'km', exportMode)}
        ${renderPrimaryMetric('Moving time', summary.movingTime, formatMovingTime, '', exportMode)}
        ${exportMode
          ? renderCountMilestone('Workouts', summary.workoutCount, true)
          : `<article class="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
              <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">Workouts</h3>
              <p class="mt-2 break-words text-2xl font-semibold tabular-nums text-white">${formatNumber(summary.workoutCount, 0)}</p>
              ${pinMarkup('Workouts')}
            </article>`}
            ${renderCountriesVisited(countrySummary, exportMode)}
      </div>
      ${sportBreakdown || ''}
      ${renderMilestones(summary, exportMode)}
      ${renderEquipmentCounts(summary.equipmentCounts, exportMode)}
    </section>`;
  }

  function render() {
    const captureArea = document.getElementById('lifetimeStatisticsCaptureArea');
    const exportArea = document.getElementById('lifetimeStatisticsExportArea');
    const emptyState = document.getElementById('lifetimeStatisticsEmptyState');
    if (!captureArea || !emptyState) return;

    const activities = typeof processedActivities !== 'undefined' && Array.isArray(processedActivities)
      ? processedActivities
      : [];
    const countrySummary = typeof countryCountSummary !== 'undefined' ? countryCountSummary : null;
    if (sourceActivities !== activities || sourceCountries !== countrySummary) {
      root.dashboardTooltips?.invalidate?.();
      sourceActivities = activities;
      sourceCountries = countrySummary;
    }

    if (activities.length === 0) {
      captureArea.innerHTML = '';
      if (exportArea) exportArea.innerHTML = '';
      captureArea.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    const summary = root.lifetimeStatisticsUtils.aggregateLifetimeStatistics(activities);
    captureArea.innerHTML = renderLifetimeStatistics(summary, { countryCountSummary: countrySummary });
    if (exportArea) exportArea.innerHTML = renderLifetimeStatistics(summary, { export: true, countryCountSummary: countrySummary });
    captureArea.classList.remove('hidden');
    emptyState.classList.add('hidden');
    bindStatisticDetails(captureArea, summary, countrySummary);
  }

  root.lifetimeStatisticsDashboard = { render };
})(window);
