(function(root) {
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

  function renderPrimaryMetric(label, metric, formatter, unit) {
    return `<article class="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
      <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(label)}</h3>
      <p class="mt-2 break-words text-2xl font-semibold tabular-nums text-white">${escapeHtml(metricValue(metric, formatter, unit))}</p>
      ${metricStatusMarkup(metric)}
    </article>`;
  }

  function renderSportSummary(sportSummary) {
    const distance = metricValue(sportSummary.distance, value => formatNumber(value), 'km');
    const movingTime = metricValue(sportSummary.movingTime, formatMovingTime, '');
    return `<tr class="border-t border-slate-800">
      <th scope="row" class="py-3 pr-4 text-left font-medium text-white">${escapeHtml(sportSummary.sport)}</th>
      <td class="px-3 py-3 text-right tabular-nums text-slate-200">${formatNumber(sportSummary.workoutCount, 0)}</td>
      <td class="px-3 py-3 text-right tabular-nums text-slate-200">${escapeHtml(distance)}</td>
      <td class="py-3 pl-3 text-right tabular-nums text-slate-200">${escapeHtml(movingTime)}</td>
    </tr>`;
  }

  function renderCountMilestone(label, value) {
    return `<article class="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(label)}</h3>
      <p class="mt-2 break-words text-xl font-semibold tabular-nums text-white">${formatNumber(value, 0)}</p>
    </article>`;
  }

  function renderActivityMilestone(label, activity, formatter, unit) {
    if (!activity) {
      return `<article class="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4">
        <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">${escapeHtml(label)}</h3>
        <p class="mt-2 text-xl font-semibold text-slate-300">Not available</p>
        <p class="mt-2 text-xs text-slate-400">No activity has a usable recorded value</p>
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
    </article>`;
  }

  function renderMilestones(summary) {
    return `<section aria-labelledby="lifetimeMilestonesHeading" class="space-y-3">
      <h3 id="lifetimeMilestonesHeading" class="text-sm font-semibold text-white">Lifetime milestones</h3>
      <div class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        ${renderPrimaryMetric('Elevation gain', summary.elevationGain, value => formatNumber(value / 1000), 'km')}
        ${renderCountMilestone('Active days', summary.activeDayCount)}
        ${renderActivityMilestone('Longest distance', summary.longestByDistance, value => formatNumber(value, 0), 'km')}
        ${renderActivityMilestone('Longest moving time', summary.longestByMovingTime, formatMovingTime, '')}
      </div>
    </section>`;
  }

  function renderEquipmentCounts(equipmentCounts) {
    return `<section aria-label="Equipment totals" class="space-y-2">
      <div class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        ${renderCountMilestone('Shoes used', equipmentCounts.shoes)}
        ${renderCountMilestone('Bikes used', equipmentCounts.bikes)}
      </div>
      <p class="text-xs text-slate-500">Counts are based on distinct gear labels in the imported activities.</p>
    </section>`;
  }

  function renderLifetimeStatistics(summary) {
    const rows = summary.sportSummaries.map(renderSportSummary).join('');
    const sportBreakdown = rows
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

    return `<section aria-labelledby="lifetimeStatisticsHeading" class="space-y-5">
      <h2 id="lifetimeStatisticsHeading" class="sr-only">Lifetime Statistics</h2>
      <div class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        ${renderPrimaryMetric('Total distance', summary.distance, value => formatNumber(value), 'km')}
        ${renderPrimaryMetric('Moving time', summary.movingTime, formatMovingTime, '')}
        <article class="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
          <h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">Workouts</h3>
          <p class="mt-2 break-words text-2xl font-semibold tabular-nums text-white">${formatNumber(summary.workoutCount, 0)}</p>
        </article>
      </div>
      ${sportBreakdown}
      ${renderMilestones(summary)}
      ${renderEquipmentCounts(summary.equipmentCounts)}
    </section>`;
  }

  function render() {
    const captureArea = document.getElementById('lifetimeStatisticsCaptureArea');
    const emptyState = document.getElementById('lifetimeStatisticsEmptyState');
    if (!captureArea || !emptyState) return;

    const activities = typeof processedActivities !== 'undefined' && Array.isArray(processedActivities)
      ? processedActivities
      : [];

    if (activities.length === 0) {
      captureArea.innerHTML = '';
      captureArea.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    const summary = root.lifetimeStatisticsUtils.aggregateLifetimeStatistics(activities);
    captureArea.innerHTML = renderLifetimeStatistics(summary);
    captureArea.classList.remove('hidden');
    emptyState.classList.add('hidden');
  }

  root.lifetimeStatisticsDashboard = { render };
})(window);
