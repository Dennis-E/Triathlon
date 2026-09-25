let selectedPaceMetricsSport = 'Run';
let selectedPaceMetric = 'heartRate';
let paceMetricsChartInstance = null;
let scatterDateRange = { start: 0, end: 0 };
let scatterDateCandidates = [];
let enabledPaceMetricsYears = null;
let paceMetricsShowTrendLines = true;

const PACE_METRIC_PRESENTATION = {
  heartRate: { label: 'Average heart rate', unit: 'bpm' },
  elevationGain: { label: 'Elevation gain', unit: 'm' },
  distance: { label: 'Distance', unit: 'km' }
};

function getPaceMetricPresentation(metric, sport) {
  if (metric !== 'cadence') return PACE_METRIC_PRESENTATION[metric];
  if (sport === 'Bike') return { label: 'Average pedal cadence', unit: 'rpm' };
  if (sport === 'Swim') return { label: 'Average swim rhythm', unit: '' };
  return { label: 'Average step cadence', unit: 'spm' };
}

function initScatterDateSlider() {
  const startInput = document.getElementById('scatterDateStart');
  const endInput = document.getElementById('scatterDateEnd');
  if (!startInput || !endInput) return;

  const uniqueIsoDates = Array.from(new Set(processedActivities.map(activity => formatDateIso(activity.date)))).sort();
  scatterDateCandidates = uniqueIsoDates.map(iso => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  });
  if (scatterDateCandidates.length === 0) scatterDateCandidates = [new Date()];

  const maxIndex = scatterDateCandidates.length - 1;
  scatterDateRange = { start: 0, end: maxIndex };
  [startInput, endInput].forEach(input => {
    input.min = '0';
    input.max = String(maxIndex);
    input.step = '1';
  });
  startInput.value = '0';
  endInput.value = String(maxIndex);
  updateScatterDateRangeLabel();
  updateScatterDateRangeTrack();
}

function initPaceMetricsControls(options = {}) {
  if (options.reset) {
    selectedPaceMetricsSport = 'Run';
    selectedPaceMetric = 'heartRate';
    enabledPaceMetricsYears = null;
    paceMetricsShowTrendLines = true;
  }
  renderPaceMetricsControlButtons();
}

function renderPaceMetricsControlButtons() {
  const sportContainer = document.getElementById('paceMetricsSportFilters');
  const metricContainer = document.getElementById('paceMetricsMetricFilters');
  if (!sportContainer || !metricContainer) return;

  sportContainer.replaceChildren();
  ['Run', 'Bike', 'Swim'].forEach(sport => {
    const button = document.createElement('button');
    const selected = sport === selectedPaceMetricsSport;
    button.type = 'button';
    button.id = `paceMetricsSportBtn${sport}`;
    button.textContent = sport;
    button.className = getPaceMetricsButtonClass(selected);
    button.setAttribute('aria-pressed', String(selected));
    button.addEventListener('click', () => setPaceMetricsSport(sport));
    sportContainer.appendChild(button);
  });

  metricContainer.replaceChildren();
  [
    ['heartRate', 'Heart rate'],
    ['cadence', 'Cadence'],
    ['elevationGain', 'Elevation gain'],
    ['distance', 'Distance']
  ].forEach(([metric, label]) => {
    const button = document.createElement('button');
    const selected = metric === selectedPaceMetric;
    button.type = 'button';
    button.id = `paceMetricsMetricBtn${metric}`;
    button.textContent = label;
    button.className = getPaceMetricsButtonClass(selected);
    button.setAttribute('aria-pressed', String(selected));
    button.addEventListener('click', () => setPaceMetric(metric));
    metricContainer.appendChild(button);
  });
}

function getPaceMetricsButtonClass(selected) {
  return selected
    ? 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25'
    : 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
}

function updateScatterDateRangeLabel() {
  const label = document.getElementById('scatterRangeLabel');
  if (!label || scatterDateCandidates.length === 0) return;
  const isAll = scatterDateRange.start === 0 && scatterDateRange.end === scatterDateCandidates.length - 1;
  label.textContent = isAll ? 'All' : `${formatShortDate(scatterDateCandidates[scatterDateRange.start])} to ${formatShortDate(scatterDateCandidates[scatterDateRange.end])}`;
}

function updateScatterDateRangeTrack() {
  const track = document.getElementById('scatterRangeSelectedTrack');
  if (!track || scatterDateCandidates.length === 0) return;
  const maxIndex = Math.max(1, scatterDateCandidates.length - 1);
  track.style.left = `${(scatterDateRange.start / maxIndex) * 100}%`;
  track.style.right = `${100 - ((scatterDateRange.end / maxIndex) * 100)}%`;
}

function getScatterDateBounds() {
  if (scatterDateCandidates.length === 0) return { minDate: null, maxDate: null };
  const minDate = scatterDateCandidates[scatterDateRange.start];
  const maxDate = new Date(scatterDateCandidates[scatterDateRange.end]);
  maxDate.setHours(23, 59, 59, 999);
  return { minDate, maxDate };
}

function setScatterDateRange(boundary, value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return;
  if (boundary === 'start') {
    scatterDateRange.start = Math.max(0, Math.min(parsed, scatterDateRange.end));
  } else {
    scatterDateRange.end = Math.min(scatterDateCandidates.length - 1, Math.max(parsed, scatterDateRange.start));
  }
  document.getElementById('scatterDateStart').value = String(scatterDateRange.start);
  document.getElementById('scatterDateEnd').value = String(scatterDateRange.end);
  updateScatterDateRangeLabel();
  updateScatterDateRangeTrack();
  renderPaceMetricsChart();
}

function setPaceMetricsSport(sport) {
  selectedPaceMetricsSport = sport;
  renderPaceMetricsControlButtons();
  renderPaceMetricsChart();
}

function setPaceMetric(metric) {
  selectedPaceMetric = metric;
  renderPaceMetricsControlButtons();
  renderPaceMetricsChart();
}

function synchronizePaceMetricsYears(points) {
  const currentYears = new Set(points.map(point => point.year));
  if (enabledPaceMetricsYears === null) {
    enabledPaceMetricsYears = new Set(currentYears);
  } else {
    enabledPaceMetricsYears = new Set([...enabledPaceMetricsYears].filter(year => currentYears.has(year)));
    currentYears.forEach(year => enabledPaceMetricsYears.add(year));
  }
}

function setPaceMetricsYearEnabled(year, enabled) {
  if (enabled) enabledPaceMetricsYears.add(year);
  else enabledPaceMetricsYears.delete(year);
  updatePaceMetricsChartVisibility();
}

function setPaceMetricsTrendLinesVisible(visible) {
  paceMetricsShowTrendLines = visible;
  updatePaceMetricsChartVisibility();
}

function updatePaceMetricsChartVisibility() {
  if (!paceMetricsChartInstance) return;
  paceMetricsChartInstance.data.datasets.forEach((dataset, index) => {
    const visible = dataset.type === 'bubble'
      ? enabledPaceMetricsYears.has(dataset.year)
      : paceMetricsShowTrendLines && enabledPaceMetricsYears.has(dataset.year);
    paceMetricsChartInstance.setDatasetVisibility(index, visible);
  });
  paceMetricsChartInstance.update();
}

function renderPaceMetricsTrendControls(points, trendDatasets) {
  const controls = document.getElementById('paceMetricsTrendControls');
  if (!controls) return;
  controls.replaceChildren();
  controls.classList.toggle('hidden', points.length === 0);
  if (points.length === 0) return;

  const colorByYear = new Map(trendDatasets.map(dataset => [dataset.year, dataset.borderColor]));
  const years = Array.from(new Set(points.map(point => point.year))).sort((a, b) => a - b);
  const yearLegend = document.createElement('legend');
  yearLegend.className = 'mb-2 font-medium text-white';
  yearLegend.textContent = 'Years';
  controls.appendChild(yearLegend);
  years.forEach(year => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 cursor-pointer';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabledPaceMetricsYears.has(year);
    checkbox.className = 'accent-indigo-500';
    checkbox.addEventListener('change', () => setPaceMetricsYearEnabled(year, checkbox.checked));
    const color = document.createElement('span');
    color.className = 'w-3 h-3 rounded-full';
    color.style.backgroundColor = colorByYear.get(year) || '#64748B';
    const text = document.createElement('span');
    text.textContent = year;
    label.append(checkbox, color, text);
    controls.appendChild(label);
  });

  const separator = document.createElement('div');
  separator.className = 'my-3 border-t border-slate-600';
  controls.appendChild(separator);
  const trendLabel = document.createElement('label');
  trendLabel.className = 'flex items-center gap-2 cursor-pointer';
  const trendCheckbox = document.createElement('input');
  trendCheckbox.type = 'checkbox';
  trendCheckbox.checked = paceMetricsShowTrendLines;
  trendCheckbox.className = 'accent-indigo-500';
  trendCheckbox.addEventListener('change', () => setPaceMetricsTrendLinesVisible(trendCheckbox.checked));
  const trendText = document.createElement('span');
  trendText.textContent = 'Trend lines';
  trendLabel.append(trendCheckbox, trendText);
  controls.appendChild(trendLabel);
}

function renderPaceMetricsChart() {
  const canvas = document.getElementById('paceMetricsChart');
  const emptyState = document.getElementById('paceMetricsEmptyState');
  const count = document.getElementById('paceMetricsPointCount');
  if (!canvas) return;

  initPaceMetricsControls();
  const { minDate, maxDate } = getScatterDateBounds();
  const points = window.scatterUtils.getPaceMetricPoints(processedActivities, {
    sport: selectedPaceMetricsSport,
    metric: selectedPaceMetric,
    minDate,
    maxDate
  });
  if (count) count.textContent = `${points.length} sessions`;
  if (paceMetricsChartInstance) paceMetricsChartInstance.destroy();

  if (points.length === 0) {
    canvas.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    renderPaceMetricsTrendControls([], []);
    return;
  }

  canvas.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');
  synchronizePaceMetricsYears(points);
  const durations = points.map(point => point.duration).filter(value => Number.isFinite(value) && value > 0);
  const palette = ['#F59E0B', '#A78BFA', '#F97316', '#22D3EE', '#84CC16'];
  const trendDatasets = window.scatterUtils.buildYearlyRegressionDatasets(points, palette);
  const colorByYear = new Map(trendDatasets.map(dataset => [dataset.year, dataset.borderColor]));
  const pointGroups = new Map();
  points.forEach(point => {
    if (!pointGroups.has(point.year)) pointGroups.set(point.year, []);
    pointGroups.get(point.year).push(point);
  });
  const bubbleDatasets = Array.from(pointGroups.entries()).map(([year, yearPoints], index) => {
    const color = colorByYear.get(year) || palette[index % palette.length];
    return {
      type: 'bubble', label: String(year), year,
      data: yearPoints.map(point => ({ x: point.x, y: point.y, r: window.scatterUtils.calculateBubbleRadius(point.duration, Math.min(...durations), Math.max(...durations)), meta: point })),
      backgroundColor: `${color}AA`, borderColor: color, borderWidth: 1.2, order: 2
    };
  });
  const performance = getPerformanceMetaForSport(selectedPaceMetricsSport);
  const presentation = getPaceMetricPresentation(selectedPaceMetric, selectedPaceMetricsSport);
  renderPaceMetricsTrendControls(points, trendDatasets);
  paceMetricsChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bubble',
    data: { datasets: [...bubbleDatasets, ...trendDatasets] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A', titleColor: '#F8FAFC', bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1,
          callbacks: {
            title: items => items[0]?.raw?.meta?.name || items[0]?.dataset?.label,
            label(context) {
              if (context.dataset.type === 'line') return context.dataset.label;
              const point = context.raw.meta;
              const value = presentation.unit ? `${point.y.toFixed(1)} ${presentation.unit}` : point.y.toFixed(1);
              const details = [
                `${performance.tooltipLabel}: ${formatPerformanceValue(point.x, point.metricType)}`,
                `${presentation.label}: ${value}`,
                `Distance: ${point.distance.toFixed(1)} km`,
                `Duration: ${formatDuration(point.duration)}`,
                `Date: ${formatShortDate(point.date)}`
              ];
              if (point.metric === 'cadence' && point.sport === 'Run' && point.totalSteps) details.splice(2, 0, `Total steps: ${Math.round(point.totalSteps)}`);
              return details;
            }
          }
        }
      },
      scales: {
        x: { reverse: performance.reverseXAxis, title: { display: true, text: performance.axisTitle, color: '#94A3B8' }, grid: { color: '#1E293B' }, ticks: { color: '#64748B', callback: value => formatPerformanceValue(value, performance.metricType, { compact: true }) } },
        y: { title: { display: true, text: presentation.unit ? `${presentation.label} (${presentation.unit})` : presentation.label, color: '#94A3B8' }, grid: { color: '#1E293B' }, ticks: { color: '#64748B' } }
      }
    }
  });
  updatePaceMetricsChartVisibility();
}
