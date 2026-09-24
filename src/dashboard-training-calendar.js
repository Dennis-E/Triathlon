let selectedTrainingCalendarYear = null;
let selectedTrainingCalendarSport = 'All';
let trainingCalendarModel = null;

const TRAINING_CALENDAR_LEVEL_CLASSES = [
  'bg-slate-800',
  'bg-emerald-950',
  'bg-emerald-800',
  'bg-emerald-600',
  'bg-emerald-400',
  'bg-emerald-300'
];

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

function renderTrainingCalendarSportFilters() {
  const container = document.getElementById('trainingCalendarSportFilters');
  if (!container) return;
  const sports = window.trainingCalendarUtils.getAvailableSports(processedActivities, {
    year: selectedTrainingCalendarYear
  });
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

function renderTrainingCalendarYearOptions() {
  const select = document.getElementById('trainingCalendarYearSelect');
  if (!select) return;
  const years = window.trainingCalendarUtils.getAvailableYears(processedActivities);
  if (!years.includes(selectedTrainingCalendarYear)) {
    selectedTrainingCalendarYear = years[years.length - 1] || new Date().getFullYear();
  }
  select.innerHTML = years.map(year => `<option value="${year}">${year}</option>`).join('');
  select.value = String(selectedTrainingCalendarYear);
}

function selectTrainingCalendarDay(day) {
  const details = document.getElementById('trainingCalendarDetails');
  if (!details || !day) return;
  const duration = formatTrainingCalendarDuration(day.durationSeconds);
  const distance = Number.isFinite(day.distanceKm) ? `${day.distanceKm.toFixed(2)} km` : null;
  const summaries = [
    `${day.activityCount} ${day.activityCount === 1 ? 'activity' : 'activities'}`,
    day.sports.length ? day.sports.join(', ') : 'No activity',
    duration ? `Time: ${duration}` : null,
    distance ? `Distance: ${distance}` : null
  ].filter(Boolean);
  details.innerHTML = `<strong class="block text-slate-100">${formatTrainingCalendarDay(day)}</strong><span class="mt-1 block">${summaries.join(' · ')}</span>`;
}

function createTrainingCalendarCell(day) {
  if (!day) return '<span aria-hidden="true"></span>';
  const label = day.activityCount
    ? `${formatTrainingCalendarDay(day)}, ${day.activityCount} activities, intensity ${day.intensityLevel} of 5`
    : `${formatTrainingCalendarDay(day)}, no activity`;
  return `<button type="button" class="h-3.5 w-3.5 rounded-sm ${TRAINING_CALENDAR_LEVEL_CLASSES[day.intensityLevel]} focus:outline-none focus:ring-2 focus:ring-indigo-400" aria-label="${label}" title="${label}" data-date-key="${day.dateKey}" onclick="selectTrainingCalendarDayByKey('${day.dateKey}')" onfocus="selectTrainingCalendarDayByKey('${day.dateKey}')" onmouseenter="selectTrainingCalendarDayByKey('${day.dateKey}')"></button>`;
}

function renderTrainingCalendarGrid() {
  const grid = document.getElementById('trainingCalendarGrid');
  if (!grid || !trainingCalendarModel) return;
  grid.innerHTML = '';
  trainingCalendarModel.weeks.forEach(week => {
    const firstDay = week.days.find(Boolean);
    const monthLabel = firstDay && (firstDay.date.getDate() <= 7 || week === trainingCalendarModel.weeks[0])
      ? firstDay.date.toLocaleDateString(undefined, { month: 'short' })
      : '';
    const monthCell = document.createElement('span');
    monthCell.className = 'text-[10px] leading-3 text-slate-500';
    monthCell.textContent = monthLabel;
    grid.appendChild(monthCell);
    week.days.forEach(day => {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = createTrainingCalendarCell(day);
      grid.appendChild(wrapper.firstElementChild);
    });
  });
}

function renderTrainingCalendar() {
  const count = document.getElementById('trainingCalendarActivityCount');
  if (!window.trainingCalendarUtils || typeof processedActivities === 'undefined') return;
  renderTrainingCalendarYearOptions();
  renderTrainingCalendarSportFilters();
  trainingCalendarModel = window.trainingCalendarUtils.buildCalendarModel(processedActivities, {
    year: selectedTrainingCalendarYear,
    sport: selectedTrainingCalendarSport
  });
  if (count) count.textContent = `${trainingCalendarModel.activityCount} activities`;
  const emptyState = document.getElementById('trainingCalendarEmptyState');
  if (emptyState) emptyState.classList.toggle('hidden', trainingCalendarModel.activityCount > 0);
  renderTrainingCalendarGrid();
  const firstActiveDay = trainingCalendarModel.days.find(day => day.activityCount > 0);
  selectTrainingCalendarDay(firstActiveDay || trainingCalendarModel.days[0]);
}

function initTrainingCalendarControls() {
  const yearSelect = document.getElementById('trainingCalendarYearSelect');
  if (yearSelect && !yearSelect.dataset.bound) {
    yearSelect.dataset.bound = 'true';
    yearSelect.addEventListener('change', event => {
      selectedTrainingCalendarYear = Number(event.target.value);
      selectedTrainingCalendarSport = 'All';
      renderTrainingCalendar();
    });
  }
  renderTrainingCalendar();
}

function setTrainingCalendarSportFilter(sport) {
  selectedTrainingCalendarSport = sport;
  renderTrainingCalendar();
}

function selectTrainingCalendarDayByKey(dateKey) {
  if (!trainingCalendarModel) return;
  const day = trainingCalendarModel.days.find(candidate => candidate.dateKey === dateKey);
  selectTrainingCalendarDay(day);
}
