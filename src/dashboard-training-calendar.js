let selectedTrainingCalendarSport = 'All';
let selectedTrainingCalendarPalette = 'green';
let trainingCalendarModel = null;
const TRAINING_CALENDAR_EMPTY_DAY_COLOR = 'rgba(241,245,249,0.5)';

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
    return `<button type="button" data-sport="${sport}" aria-pressed="${sport === selectedTrainingCalendarSport ? 'true' : 'false'}" onclick="setTrainingCalendarSportFilter('${sport}')">${label}</button>`;
  }).join('');
  setTrainingCalendarSportButtonActive(selectedTrainingCalendarSport);
}

function escapeTrainingCalendarText(value) {
  return String(value).replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
}

function closeTrainingCalendarTooltip() {
  const tooltip = document.getElementById('trainingCalendarDayTooltip');
  if (!tooltip) return;
  tooltip.classList.add('hidden');
  tooltip.setAttribute('aria-hidden', 'true');
}

function showTrainingCalendarTooltip(day, anchor) {
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
    ? TRAINING_CALENDAR_EMPTY_DAY_COLOR
    : window.trainingCalendarUtils.PALETTES[palette][day.intensityLevel - 1];
  return `<button type="button" class="h-3.5 w-3.5 rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400" style="background-color:${color}" aria-label="${label}" data-date-key="${day.dateKey}" onmouseenter="showTrainingCalendarDayTooltipByKey('${day.dateKey}', this)" onmouseleave="closeTrainingCalendarTooltip()" onfocus="showTrainingCalendarDayTooltipByKey('${day.dateKey}', this)" onblur="closeTrainingCalendarTooltip()"></button>`;
}

function renderTrainingCalendarGrid(yearModel, grid) {
  if (!grid || !yearModel) return;
  grid.innerHTML = '';
  yearModel.weeks.forEach(week => {
    const firstDay = week.days.find(Boolean);
    const monthLabel = firstDay && (firstDay.date.getDate() <= 7 || week === yearModel.weeks[0])
      ? firstDay.date.toLocaleDateString(undefined, { month: 'short' })
      : '';
    const monthCell = document.createElement('span');
    monthCell.className = 'text-[10px] leading-3 text-slate-500';
    monthCell.textContent = monthLabel;
    grid.appendChild(monthCell);
    week.days.forEach(day => {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = createTrainingCalendarCell(day, selectedTrainingCalendarPalette);
      grid.appendChild(wrapper.firstElementChild);
    });
  });
}

function renderTrainingCalendarLegend() {
  const legend = document.getElementById('trainingCalendarLegend');
  if (!legend) return;
  const colors = [window.trainingCalendarUtils.EMPTY_DAY_COLOR, ...window.trainingCalendarUtils.PALETTES[selectedTrainingCalendarPalette]];
  legend.innerHTML = `<span>Less</span>${colors.map((color, index) => `<span class="h-3 w-3 rounded-sm border border-slate-300" style="background-color:${color}" title="${index === 0 ? 'No activity' : `Intensity ${index}`}"></span>`).join('')}<span>More</span>`;
}

function renderTrainingCalendar() {
  const count = document.getElementById('trainingCalendarActivityCount');
  if (!window.trainingCalendarUtils || typeof processedActivities === 'undefined') return;
  renderTrainingCalendarSportFilters();
  trainingCalendarModel = window.trainingCalendarUtils.buildMultiYearCalendarModel(processedActivities, {
    sport: selectedTrainingCalendarSport
  });
  if (count) count.textContent = `${trainingCalendarModel.years.reduce((total, year) => total + year.activityCount, 0)} activities`;
  const emptyState = document.getElementById('trainingCalendarEmptyState');
  if (emptyState) emptyState.classList.toggle('hidden', trainingCalendarModel.years.some(year => year.activityCount > 0));
  renderTrainingCalendarLegend();
  const yearsContainer = document.getElementById('trainingCalendarYears');
  if (!yearsContainer) return;
  yearsContainer.innerHTML = '';
  trainingCalendarModel.years.forEach(yearModel => {
    const section = document.createElement('section');
    section.className = 'space-y-2';
    section.innerHTML = `<h3 class="text-sm font-semibold text-slate-200">${yearModel.year}</h3><div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4"><div class="min-w-max" data-calendar-grid-wrapper></div></div>`;
    yearsContainer.appendChild(section);
    const grid = document.createElement('div');
    grid.className = 'grid min-w-max auto-cols-[14px] grid-flow-col grid-rows-[16px_repeat(7,14px)] gap-1';
    section.querySelector('[data-calendar-grid-wrapper]').appendChild(grid);
    renderTrainingCalendarGrid(yearModel, grid);
  });
  closeTrainingCalendarTooltip();
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
