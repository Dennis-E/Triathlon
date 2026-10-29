let selectedTrainingCalendarSport = 'All';
let selectedTrainingCalendarPalette = 'green';
let trainingCalendarModel = null;
let trainingCalendarTooltipAdapter = null;
let trainingCalendarActivitySource = null;

function trainingCalendarAnchor(dateKey, target) {
  const rect = target?.getBoundingClientRect?.();
  return { kind: 'calendar-day', itemId: dateKey, normalizedPoint: {
    x: Number.isFinite(rect?.left) ? (rect.left + (rect.width || 0) / 2) / (window.innerWidth || 800) : 0.5,
    y: Number.isFinite(rect?.top) ? (rect.top + (rect.height || 0) / 2) / (window.innerHeight || 600) : 0.5
  }, visibility: 'visible', associationLabel: dateKey };
}

function registerTrainingCalendarTooltipAdapter() {
  const api = window.dashboardTooltips;
  if (!api?.registerAdapter || trainingCalendarTooltipAdapter) return;
  const adapter = {
    readContext: () => api.readContext('trainingCalendar'),
    resolveExportAnchor(selection, captureContext) {
      const target = Array.from(captureContext.element.querySelectorAll?.('[data-date-key]') || []).find(item => item.dataset.dateKey === selection.anchor.itemId);
      return api.resolveCaptureAnchor(selection, captureContext, target);
    },
    projectAnchor: selection => {
      const target = Array.from(document.querySelectorAll?.('[data-date-key]') || []).find(button => button.dataset.dateKey === selection.anchor.itemId);
      return target ? trainingCalendarAnchor(selection.anchor.itemId, target) : selection.anchor;
    },
    dispose() { closeTrainingCalendarTooltip(); trainingCalendarTooltipAdapter = null; }
  };
  api.registerAdapter('trainingCalendar', adapter);
  trainingCalendarTooltipAdapter = adapter;
}

function pinTrainingCalendarDayByKey(dateKey, target) {
  const day = selectTrainingCalendarDayByKey(dateKey);
  const api = window.dashboardTooltips;
  if (!day || !api?.show) return;
  closeTrainingCalendarTooltip();
  const title = formatTrainingCalendarDay(day);
  api.show('trainingCalendar', { selectionKey: `trainingCalendar:${dateKey}`,
    content: { title, itemLabel: title, sections: day.tooltipActivities.map(activity => ({
      heading: activity.name, rows: [
        { label: 'Sport', value: activity.sport },
        { label: 'Duration', value: Number.isFinite(activity.durationSeconds) ? formatTrainingCalendarDuration(activity.durationSeconds) : 'Not available' },
        { label: 'Distance', value: Number.isFinite(activity.distanceKm) ? `${activity.distanceKm.toFixed(2)} km` : 'Not available' }
      ]
    })), footerLines: [], notes: day.activityCount ? [] : ['No activity'] },
    anchor: trainingCalendarAnchor(dateKey, target)
  }, true, target);
}

function getTrainingCalendarKeyboardAdapter() {
  return window.dashboardTabNavigation.createDashboardFilterAdapter(
    () => ({ values: { palette: selectedTrainingCalendarPalette, sport: selectedTrainingCalendarSport },
      sports: ['All', ...window.trainingCalendarUtils.getAvailableSports(processedActivities)] }),
    (prefix, snapshot) => prefix.length === 0 ? { id: 'palette', values: ['green', 'blue', 'fire'] }
      : prefix.length === 1 ? { id: 'sport', values: snapshot.sports } : null,
    values => {
      if (selectedTrainingCalendarSport !== values.sport) window.dashboardTooltips?.invalidate?.();
      selectedTrainingCalendarPalette = values.palette;
      selectedTrainingCalendarSport = values.sport;
      setTrainingCalendarPaletteButtonActive(values.palette);
      setTrainingCalendarSportButtonActive(values.sport);
      renderTrainingCalendar();
    }
  );
}

function formatTrainingCalendarDuration(seconds) {
  if (!Number.isFinite(seconds)) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatTrainingCalendarDay(day) {
  return day.date.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function setTrainingCalendarSportButtonActive(activeSport) {
  document.querySelectorAll('#trainingCalendarSportFilters button').forEach(button => {
    const isActive = button.dataset.sport === activeSport;
    button.className = isActive
      ? 'rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow shadow-indigo-600/25'
      : 'rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-slate-500 hover:text-slate-200';
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function setTrainingCalendarPaletteButtonActive(activePalette) {
  document.querySelectorAll('#trainingCalendarPaletteFilters button').forEach(button => {
    const isActive = button.dataset.palette === activePalette;
    button.className = isActive
      ? 'rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow shadow-indigo-600/25'
      : 'rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-slate-500 hover:text-slate-200';
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function renderTrainingCalendarSportFilters() {
  const container = document.getElementById('trainingCalendarSportFilters');
  if (!container) return;
  const sports = window.trainingCalendarUtils.getAvailableSports(processedActivities);
  const options = processedActivities.length ? ['All', ...sports] : [];
  if (selectedTrainingCalendarSport !== 'All' && !sports.includes(selectedTrainingCalendarSport)) {
    selectedTrainingCalendarSport = 'All';
  }
  container.innerHTML = options.map(sport => {
    const label = sport === 'All' ? 'All Sports' : sport;
    return `<button type="button" id="trainingCalendarSportBtn${sport}" data-sport="${sport}" aria-pressed="${sport === selectedTrainingCalendarSport ? 'true' : 'false'}" onclick="setTrainingCalendarSportFilter('${sport}')">${label}</button>`;
  }).join('');
  setTrainingCalendarSportButtonActive(selectedTrainingCalendarSport);
}

function escapeTrainingCalendarText(value) {
  return String(value).replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
}

function closeTrainingCalendarTooltip() {
  window.dashboardTooltips?.send?.({ type: 'leave' });
  const tooltip = document.getElementById('trainingCalendarDayTooltip');
  if (!tooltip) return;
  tooltip.classList.add('hidden');
  tooltip.setAttribute('aria-hidden', 'true');
}

function showTrainingCalendarTooltip(day, anchor) {
  if (window.dashboardTooltips?.getPinned?.('trainingCalendar')) { closeTrainingCalendarTooltip(); return; }
  const tooltip = document.getElementById('trainingCalendarDayTooltip');
  const panel = document.getElementById('vizPanelTrainingCalendar');
  if (!tooltip || !panel || !day || !anchor) return;
  const rows = day.tooltipActivities.map(activity => {
    const metrics = [
      Number.isFinite(activity.durationSeconds) ? formatTrainingCalendarDuration(activity.durationSeconds) : null,
      Number.isFinite(activity.distanceKm) ? `${activity.distanceKm.toFixed(2)} km` : null
    ].filter(Boolean).join(' · ');
    return `<li class="border-t border-slate-700 pt-1.5"><strong class="block text-slate-100">${escapeTrainingCalendarText(activity.name)}</strong><span>${escapeTrainingCalendarText(activity.sport)}${metrics ? ` · ${escapeTrainingCalendarText(metrics)}` : ''}</span></li>`;
  }).join('');
  tooltip.innerHTML = `<strong class="block text-slate-100">${escapeTrainingCalendarText(formatTrainingCalendarDay(day))}</strong>${rows ? `<ul class="mt-2 space-y-1.5">${rows}</ul>` : '<span class="mt-1 block">No activity</span>'}`;
  tooltip.classList.remove('hidden');
  tooltip.setAttribute('aria-hidden', 'false');
  const anchorRect = anchor.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const left = Math.max(8, Math.min(anchorRect.left - panelRect.left, panelRect.width - tooltip.offsetWidth - 8));
  const top = Math.max(8, anchorRect.bottom - panelRect.top + 8);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function createTrainingCalendarCell(day, palette) {
  if (!day) return '<span aria-hidden="true"></span>';
  const label = day.activityCount
    ? `${formatTrainingCalendarDay(day)}, ${day.activityCount} activities, intensity ${day.intensityLevel} of 5`
    : `${formatTrainingCalendarDay(day)}, no activity`;
  const color = day.intensityLevel === 0
    ? window.trainingCalendarUtils.EMPTY_DAY_COLOR
    : window.trainingCalendarUtils.PALETTES[palette][day.intensityLevel - 1];
  return `<button type="button" class="h-3.5 w-3.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" style="background-color:${color}" aria-label="${label}" data-date-key="${day.dateKey}" data-tooltip-inspector="true" onclick="pinTrainingCalendarDayByKey('${day.dateKey}', this)" onmouseenter="showTrainingCalendarDayTooltipByKey('${day.dateKey}', this)" onmouseleave="closeTrainingCalendarTooltip()" onfocus="showTrainingCalendarDayTooltipByKey('${day.dateKey}', this)" onblur="closeTrainingCalendarTooltip()"></button>`;
}

function renderTrainingCalendarGrid(yearModel, monthHeader, grid) {
  if (!grid || !monthHeader || !yearModel) return;
  monthHeader.innerHTML = '';
  grid.innerHTML = '';
  yearModel.weeks.forEach(week => {
    const monthStart = week.days.find(day => day && day.date.getDate() === 1);
    const monthCell = document.createElement('span');
    monthCell.className = 'whitespace-nowrap text-[10px] leading-3 text-slate-500';
    monthCell.textContent = monthStart
      ? monthStart.date.toLocaleDateString(undefined, { month: 'short' })
      : '';
    monthHeader.appendChild(monthCell);
    week.days.forEach(day => {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = createTrainingCalendarCell(day, selectedTrainingCalendarPalette);
      grid.appendChild(wrapper.firstElementChild);
    });
  });
}

function renderTrainingCalendarLegend(legend) {
  if (!legend) return;
  const colors = [window.trainingCalendarUtils.EMPTY_DAY_COLOR, ...window.trainingCalendarUtils.PALETTES[selectedTrainingCalendarPalette]];
  legend.innerHTML = `<span>Less</span>${colors.map((color, index) => `<span class="h-3 w-3 rounded-sm" style="background-color:${color}" title="${index === 0 ? 'No activity' : `Intensity ${index}`}" aria-label="${index === 0 ? 'No activity' : `Intensity ${index}`}"></span>`).join('')}<span>More</span>`;
}

function renderTrainingCalendar() {
  const count = document.getElementById('trainingCalendarActivityCount');
  if (!window.trainingCalendarUtils || typeof processedActivities === 'undefined') return;
  if (trainingCalendarActivitySource !== processedActivities) {
    window.dashboardTooltips?.invalidate?.();
    trainingCalendarActivitySource = processedActivities;
  }
  registerTrainingCalendarTooltipAdapter();
  renderTrainingCalendarSportFilters();
  trainingCalendarModel = window.trainingCalendarUtils.buildMultiYearCalendarModel(processedActivities, {
    sport: selectedTrainingCalendarSport
  });
  if (count) count.textContent = `${trainingCalendarModel.years.reduce((total, year) => total + year.activityCount, 0)} activities`;
  const emptyState = document.getElementById('trainingCalendarEmptyState');
  if (emptyState) emptyState.classList.toggle('hidden', trainingCalendarModel.years.some(year => year.activityCount > 0));
  const yearsContainer = document.getElementById('trainingCalendarYears');
  if (!yearsContainer) return;
  yearsContainer.innerHTML = '';
  trainingCalendarModel.years.forEach(yearModel => {
    const section = document.createElement('section');
    section.className = 'space-y-2';
    section.innerHTML = `<h3 class="text-sm font-semibold text-slate-200">${yearModel.year}</h3><div class="overflow-x-auto pb-2" role="region" aria-label="${yearModel.year} training calendar" tabindex="0"><div class="min-w-max space-y-1"><div class="grid min-w-max auto-cols-[14px] grid-flow-col gap-1" data-calendar-months></div><div class="grid min-w-max auto-cols-[14px] grid-flow-col grid-rows-[repeat(7,14px)] gap-1" data-calendar-days></div></div></div>`;
    yearsContainer.appendChild(section);
    renderTrainingCalendarGrid(
      yearModel,
      section.querySelector('[data-calendar-months]'),
      section.querySelector('[data-calendar-days]')
    );
  });
  const legend = document.createElement('div');
  legend.id = 'trainingCalendarLegend';
  legend.className = 'flex flex-wrap items-center justify-end gap-2 pt-1 text-xs text-slate-400';
  legend.setAttribute('aria-label', 'Training intensity legend');
  yearsContainer.appendChild(legend);
  renderTrainingCalendarLegend(legend);
  closeTrainingCalendarTooltip();
  window.dashboardTooltips?.refreshAnchor?.();
}

function initTrainingCalendarControls() {
  document.querySelectorAll('#trainingCalendarPaletteFilters button').forEach(button => {
    if (button.dataset.bound) return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => setTrainingCalendarPalette(button.dataset.palette));
  });
  setTrainingCalendarPaletteButtonActive(selectedTrainingCalendarPalette);
  renderTrainingCalendar();
}

function setTrainingCalendarPalette(palette) {
  if (!window.trainingCalendarUtils.PALETTES[palette]) return;
  selectedTrainingCalendarPalette = palette;
  setTrainingCalendarPaletteButtonActive(palette);
  renderTrainingCalendar();
}

function setTrainingCalendarSportFilter(sport) {
  if (selectedTrainingCalendarSport !== sport) window.dashboardTooltips?.invalidate?.();
  selectedTrainingCalendarSport = sport;
  renderTrainingCalendar();
}

function selectTrainingCalendarDayByKey(dateKey) {
  if (!trainingCalendarModel) return;
  const yearModel = trainingCalendarModel.years.find(year => year.days.some(candidate => candidate.dateKey === dateKey));
  return yearModel && yearModel.days.find(candidate => candidate.dateKey === dateKey);
}

function showTrainingCalendarDayTooltipByKey(dateKey, anchor) {
  if (!trainingCalendarModel) return;
  const day = selectTrainingCalendarDayByKey(dateKey);
  showTrainingCalendarTooltip(day, anchor);
}
