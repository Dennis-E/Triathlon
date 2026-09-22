     let selectedScatterSportFilter = 'Run';
     let scatterChartInstance = null;
     let scatterDateRange = { start: 0, end: 0 };
     let scatterDateCandidates = [];
     let enabledScatterTrendYears = null;
     let enabledScatterDataYears = null;
     let scatterShowTrendLines = true;

    function initScatterDateSlider() {
      const startInput = document.getElementById('scatterDateStart');
      const endInput = document.getElementById('scatterDateEnd');
      if (!startInput || !endInput) return;

      const uniqueIsoDates = Array.from(new Set(processedActivities.map(a => formatDateIso(a.date)))).sort();
      scatterDateCandidates = uniqueIsoDates.map(iso => {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d);
      });

      if (scatterDateCandidates.length === 0) {
        scatterDateCandidates = [new Date()];
      }

      const maxIndex = scatterDateCandidates.length - 1;
      scatterDateRange.start = 0;
      scatterDateRange.end = maxIndex;

      startInput.min = '0';
      endInput.min = '0';
      startInput.max = String(maxIndex);
      endInput.max = String(maxIndex);
      startInput.step = '1';
      endInput.step = '1';
      startInput.value = '0';
      endInput.value = String(maxIndex);

      updateScatterDateRangeLabel();
      updateScatterDateRangeTrack();
    }

    function updateScatterDateRangeLabel() {
      const label = document.getElementById('scatterRangeLabel');
      if (!label || scatterDateCandidates.length === 0) return;

      const startDate = scatterDateCandidates[scatterDateRange.start];
      const endDate = scatterDateCandidates[scatterDateRange.end];
      const isAll = scatterDateRange.start === 0 && scatterDateRange.end === scatterDateCandidates.length - 1;
      label.textContent = isAll
        ? 'All'
        : `${formatShortDate(startDate)} to ${formatShortDate(endDate)}`;
    }

    function getScatterDateBounds() {
      if (scatterDateCandidates.length === 0) return { minDate: null, maxDate: null };
      const minDate = scatterDateCandidates[scatterDateRange.start];
      const maxDate = new Date(scatterDateCandidates[scatterDateRange.end]);
      maxDate.setHours(23, 59, 59, 999);
      return { minDate, maxDate };
    }

    function setScatterDateRange(boundary, value) {
      const parsed = parseInt(value, 10);
      if (Number.isNaN(parsed)) return;

      if (boundary === 'start') {
        scatterDateRange.start = Math.max(0, Math.min(parsed, scatterDateRange.end));
      } else {
        const maxIndex = scatterDateCandidates.length - 1;
        scatterDateRange.end = Math.min(maxIndex, Math.max(parsed, scatterDateRange.start));
      }

      const startInput = document.getElementById('scatterDateStart');
      const endInput = document.getElementById('scatterDateEnd');
      if (startInput) startInput.value = String(scatterDateRange.start);
      if (endInput) endInput.value = String(scatterDateRange.end);

      updateScatterDateRangeLabel();
      updateScatterDateRangeTrack();
      renderHeartratePaceChart();
    }

    function updateScatterDateRangeTrack() {
      const track = document.getElementById('scatterRangeSelectedTrack');
      if (!track || scatterDateCandidates.length === 0) return;

      const maxIndex = Math.max(1, scatterDateCandidates.length - 1);
      const leftPct = (scatterDateRange.start / maxIndex) * 100;
      const rightPct = 100 - ((scatterDateRange.end / maxIndex) * 100);

      track.style.left = `${leftPct}%`;
      track.style.right = `${rightPct}%`;
    }

    function setScatterSportBtnActive(btnId) {
      document.querySelectorAll('[id^="scatterSportBtn"]').forEach(btn => {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
      });
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
      }
    }

    function setScatterSportFilter(sport) {
      selectedScatterSportFilter = sport;
      setScatterSportBtnActive(`scatterSportBtn${sport}`);
      renderHeartratePaceChart();
    }

     function setScatterDataYearEnabled(year, enabled) {
       if (!enabledScatterDataYears) enabledScatterDataYears = new Set();
       if (enabled) {
         enabledScatterDataYears.add(year);
       } else {
         enabledScatterDataYears.delete(year);
       }

       if (!scatterChartInstance) return;
       updateScatterChartVisibility();
     }

     function setScatterTrendLinesVisible(visible) {
       scatterShowTrendLines = visible;
       if (!scatterChartInstance) return;
       updateScatterChartVisibility();
     }

     function updateScatterChartVisibility() {
       if (!scatterChartInstance) return;
       
       scatterChartInstance.data.datasets.forEach((dataset, index) => {
         let isVisible = false;
         
         if (dataset.type === 'bubble') {
           // Show bubble if its year is enabled
           isVisible = enabledScatterDataYears && enabledScatterDataYears.has(dataset.year);
         } else if (dataset.type === 'line') {
           // Show trend line if trend lines are visible AND the year's data is enabled
           isVisible = scatterShowTrendLines && (enabledScatterDataYears && enabledScatterDataYears.has(dataset.year));
         }
         
         scatterChartInstance.setDatasetVisibility(index, isVisible);
       });
       
       scatterChartInstance.update();
     }

     function renderScatterTrendControls(regressionDatasets) {
       const controls = document.getElementById('scatterTrendControls');
       if (!controls) return;

       controls.replaceChildren();
       controls.classList.toggle('hidden', regressionDatasets.length === 0);
       if (regressionDatasets.length === 0) return;

       // Get years from regression datasets
       const years = regressionDatasets.map(d => d.year).sort((a, b) => a - b);
       
       // Initialize enabled data years on first render
       if (enabledScatterDataYears === null) {
         enabledScatterDataYears = new Set(years);
       }

       // Legend for data years
       const dataLegend = document.createElement('legend');
       dataLegend.className = 'mb-2 font-medium text-white';
       dataLegend.textContent = 'Years';
       controls.appendChild(dataLegend);

       // Year data checkboxes
       years.forEach(year => {
         const regressionDataset = regressionDatasets.find(d => d.year === year);
         const label = document.createElement('label');
         label.className = 'flex items-center gap-2 cursor-pointer';

         const checkbox = document.createElement('input');
         checkbox.type = 'checkbox';
         checkbox.checked = enabledScatterDataYears && enabledScatterDataYears.has(year);
         checkbox.className = 'accent-indigo-500';
         checkbox.addEventListener('change', () => setScatterDataYearEnabled(year, checkbox.checked));

         const colorBall = document.createElement('span');
         colorBall.className = 'w-3 h-3 rounded-full';
         colorBall.style.backgroundColor = regressionDataset.borderColor;

         const text = document.createElement('span');
         text.textContent = year;

         label.append(checkbox, colorBall, text);
         controls.appendChild(label);
       });

       // Separator
       const separator = document.createElement('div');
       separator.className = 'my-3 border-t border-slate-600';
       controls.appendChild(separator);

       // Trend line toggle legend
       const trendLegend = document.createElement('legend');
       trendLegend.className = 'mb-2 font-medium text-white';
       trendLegend.textContent = 'Display';
       controls.appendChild(trendLegend);

       // Trend line toggle checkbox
       const trendLabel = document.createElement('label');
       trendLabel.className = 'flex items-center gap-2 cursor-pointer';

       const trendCheckbox = document.createElement('input');
       trendCheckbox.type = 'checkbox';
       trendCheckbox.checked = scatterShowTrendLines;
       trendCheckbox.className = 'accent-indigo-500';
       trendCheckbox.addEventListener('change', () => setScatterTrendLinesVisible(trendCheckbox.checked));

       const trendLine = document.createElement('span');
       trendLine.className = 'w-5 border-t-2 border-dashed';
       trendLine.style.borderColor = '#94A3B8';

       const trendText = document.createElement('span');
       trendText.textContent = 'Trend lines';

       trendLabel.append(trendCheckbox, trendLine, trendText);
       controls.appendChild(trendLabel);
     }

    function renderHeartratePaceChart() {
      const canvas = document.getElementById('heartratePaceChart');
      const emptyState = document.getElementById('heartratePaceEmptyState');
      if (!canvas) return;

      const { minDate, maxDate } = getScatterDateBounds();
      const points = window.scatterUtils.getHeartratePacePoints(processedActivities, {
        sport: selectedScatterSportFilter,
        minDate,
        maxDate
      });

      const countEl = document.getElementById('scatterPointCount');
      if (countEl) {
        countEl.textContent = `${points.length} sessions`;
      }

      if (scatterChartInstance) {
        scatterChartInstance.destroy();
        scatterChartInstance = null;
      }

      if (points.length === 0) {
        canvas.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        renderScatterTrendControls([]);
        return;
      }

      canvas.classList.remove('hidden');
      if (emptyState) emptyState.classList.add('hidden');

      const durationValues = points.map(p => p.duration).filter(v => Number.isFinite(v) && v > 0);
      const minDuration = durationValues.length > 0 ? Math.min(...durationValues) : 0;
      const maxDuration = durationValues.length > 0 ? Math.max(...durationValues) : 0;

      const regressionDatasets = window.scatterUtils.buildYearlyRegressionDatasets(points, [
        '#F59E0B', '#A78BFA', '#F97316', '#22D3EE', '#84CC16'
      ]);

      // Create a map of year to color from regression datasets
      const yearToColor = new Map();
      regressionDatasets.forEach(dataset => {
        yearToColor.set(dataset.year, dataset.borderColor);
      });

      const sportsToRender = selectedScatterSportFilter === 'All'
        ? ['Run', 'Bike', 'Swim']
        : [selectedScatterSportFilter];

      // Group points by year to create datasets with year-based colors
      const bubbleDatasets = [];
      const yearGroups = new Map();
      
      points.forEach(point => {
        if (sportsToRender.includes(point.sport)) {
          if (!yearGroups.has(point.year)) {
            yearGroups.set(point.year, []);
          }
          yearGroups.get(point.year).push(point);
        }
      });

       yearGroups.forEach((yearPoints, year) => {
         const color = yearToColor.get(year) || '#64748B';
         bubbleDatasets.push({
           type: 'bubble',
           label: `${year}`,
           year: year,
           data: yearPoints.map(p => ({
             x: p.x,
             y: p.y,
             r: window.scatterUtils.calculateBubbleRadius(p.duration, minDuration, maxDuration),
             meta: p
           })),
           backgroundColor: `${color}AA`,
           borderColor: color,
           borderWidth: 1.2,
           order: 2
         });
       });
       
       // Initialize enabled data years on first chart creation
       const regressionYears = new Set(regressionDatasets.map(dataset => dataset.year));
       if (enabledScatterDataYears === null) {
         enabledScatterDataYears = regressionYears;
       } else {
         enabledScatterDataYears = new Set([...enabledScatterDataYears].filter(year => regressionYears.has(year)));
       }

       renderScatterTrendControls(regressionDatasets);
       const ctx = canvas.getContext('2d');
       const scatterMeta = getPerformanceMetaForSport(selectedScatterSportFilter);
       scatterChartInstance = new Chart(ctx, {
         type: 'bubble',
         data: {
           datasets: [...bubbleDatasets, ...regressionDatasets]
         },
         options: {
           responsive: true,
           maintainAspectRatio: false,
           plugins: {
             legend: {
               display: false
             },
             tooltip: {
               backgroundColor: '#0F172A',
               titleColor: '#F8FAFC',
               bodyColor: '#94A3B8',
               borderColor: '#334155',
               borderWidth: 1,
               callbacks: {
                 title: function(items) {
                   const first = items[0];
                   if (!first || !first.raw || !first.raw.meta) return first.dataset.label;
                   return first.raw.meta.name;
                 },
                  label: function(context) {
                    if (context.dataset.type === 'line') return context.dataset.label;
                    const meta = context.raw.meta;
                    const metricType = meta.metricType || scatterMeta.metricType || 'pace_run';
                    const performanceLabel = scatterMeta.tooltipLabel || 'Performance';
                    const details = [
                      `${performanceLabel}: ${formatPerformanceValue(meta.x, metricType)}`,
                      `Heartrate: ${meta.y.toFixed(0)} bpm`,
                      `Distance: ${meta.distance.toFixed(1)} km`,
                      `Duration: ${formatDuration(meta.duration)}`,
                      `Date: ${formatShortDate(meta.date)}`
                    ];
                    if (meta.sport === 'Bike' && Number.isFinite(meta.avgWatts) && meta.avgWatts > 0) {
                      details.splice(2, 0, `Avg Watts: ${Math.round(meta.avgWatts)} W`);
                    }
                    return [
                      ...details
                    ];
                  }
                }
              }
            },
            scales: {
              x: {
                reverse: scatterMeta.reverseXAxis,
                title: {
                  display: true,
                  text: scatterMeta.axisTitle,
                  color: '#94A3B8'
                },
                grid: { color: '#1E293B' },
                ticks: {
                  color: '#64748B',
                  callback: function(value) {
                    if (selectedScatterSportFilter === 'All') {
                      return Number.isFinite(value) ? Number(value).toFixed(1) : value;
                    }
                    return formatPerformanceValue(value, scatterMeta.metricType, { compact: true });
                  }
                }
              },
             y: {
               title: {
                 display: true,
                 text: 'Average Heartrate (bpm)',
                 color: '#94A3B8'
               },
               grid: { color: '#1E293B' },
               ticks: { color: '#64748B' }
             }
           }
         }
       });

       // Apply initial visibility settings
       updateScatterChartVisibility();
     }
