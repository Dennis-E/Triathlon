    const TIMEFRAME_OPTIONS = {
      daily: [
        { key: '7d', label: '7 Days', amount: 7, unit: 'days' },
        { key: '1m', label: '1 Month', amount: 1, unit: 'months' },
        { key: '3m', label: '3 Months', amount: 3, unit: 'months' },
        { key: '1y', label: '1 Year', amount: 1, unit: 'years' },
        { key: 'all', label: 'All', all: true }
      ],
      weekly: [
        { key: '3m', label: '3 Months', amount: 3, unit: 'months' },
        { key: '6m', label: '6 Months', amount: 6, unit: 'months' },
        { key: '1y', label: '1 Year', amount: 1, unit: 'years' },
        { key: '2y', label: '2 Years', amount: 2, unit: 'years' },
        { key: 'all', label: 'All', all: true }
      ],
      monthly: [
        { key: '6m', label: '6 Months', amount: 6, unit: 'months' },
        { key: '1y', label: '1 Year', amount: 1, unit: 'years' },
        { key: '2y', label: '2 Years', amount: 2, unit: 'years' },
        { key: '5y', label: '5 Years', amount: 5, unit: 'years' },
        { key: 'all', label: 'All', all: true }
      ],
      yearly: [
        { key: '3y', label: '3 Years', amount: 3, unit: 'years' },
        { key: '5y', label: '5 Years', amount: 5, unit: 'years' },
        { key: '10y', label: '10 Years', amount: 10, unit: 'years' },
        { key: 'all', label: 'All', all: true }
      ]
    };

    function parseGermanDate(dateStr) {
      if (!dateStr) return null;
      const normalized = String(dateStr).trim();
      const germanMatch = normalized.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:,\s*\d{1,2}:\d{2}(?::\d{2})?)?$/);

      if (germanMatch) {
        const day = parseInt(germanMatch[1], 10);
        const month = parseInt(germanMatch[2], 10) - 1;
        const year = parseInt(germanMatch[3], 10);
        const parsedDate = new Date(year, month, day);

        if (
          parsedDate.getFullYear() !== year ||
          parsedDate.getMonth() !== month ||
          parsedDate.getDate() !== day
        ) {
          return null;
        }

        return parsedDate;
      }

      const directParse = new Date(normalized);
      return Number.isNaN(directParse.getTime()) ? null : directParse;
    }

    // Helper to get Monday of a date's week
    function getMonday(date) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    }

    // Helper to format Date as 'YYYY-MM-DD'
    function formatDateIso(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Helper to format Date for Chart Label (e.g. "13 Jul '26")
    function formatDateLabel(date) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = months[date.getMonth()];
      const y = String(date.getFullYear()).slice(-2);
      return `${date.getDate()} ${m} '${y}`;
    }

    // Format seconds to human readable (e.g., "1h 45m")
    function formatDuration(seconds) {
      if (!seconds || isNaN(seconds)) return '--';
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (h > 0) {
        return `${h}h ${m}m`;
      }
      return `${m}m`;
    }

    function formatTimePerUnitLabel(minutesValue, unitSuffix) {
      if (!Number.isFinite(minutesValue) || minutesValue <= 0) return '--';
      const totalSeconds = Math.round(minutesValue * 60);
      const min = Math.floor(totalSeconds / 60);
      const sec = totalSeconds % 60;
      return `${min}:${String(sec).padStart(2, '0')} ${unitSuffix}`;
    }

    function formatPaceLabel(minPerKm) {
      return formatTimePerUnitLabel(minPerKm, '/km');
    }

    function formatSwimPaceLabel(minPer100m) {
      return formatTimePerUnitLabel(minPer100m, '/100m');
    }

    function paceMinPerKmToSpeedKmh(minPerKm) {
      if (!Number.isFinite(minPerKm) || minPerKm <= 0) return null;
      return 60 / minPerKm;
    }

    function formatSpeedLabel(kmh) {
      if (!Number.isFinite(kmh) || kmh <= 0) return '--';
      return `${kmh.toFixed(1)} km/h`;
    }

    function formatPerformanceValue(value, metricType, options = {}) {
      const compact = !!options.compact;
      if (!Number.isFinite(value) || value <= 0) return '--';
      if (metricType === 'speed_bike') {
        return compact ? `${value.toFixed(1)} km/h` : formatSpeedLabel(value);
      }
      if (metricType === 'pace_swim') {
        return compact ? formatSwimPaceLabel(value).replace(' /100m', '') : formatSwimPaceLabel(value);
      }
      return compact ? formatPaceLabel(value).replace(' /km', '') : formatPaceLabel(value);
    }

    function getPerformanceMetaForSport(sport) {
      if (sport === 'Run') {
        return {
          metricType: 'pace_run',
          axisTitle: 'Pace (mm:ss /km)',
          tooltipLabel: 'Pace',
          reverseXAxis: true
        };
      }
      if (sport === 'Swim') {
        return {
          metricType: 'pace_swim',
          axisTitle: 'Pace (mm:ss /100m)',
          tooltipLabel: 'Pace',
          reverseXAxis: true
        };
      }
      if (sport === 'Bike') {
        return {
          metricType: 'speed_bike',
          axisTitle: 'Speed (km/h)',
          tooltipLabel: 'Speed',
          reverseXAxis: false
        };
      }
      return {
        metricType: null,
        axisTitle: 'Performance (sport-specific units)',
        tooltipLabel: 'Performance',
        reverseXAxis: false
      };
    }

    function formatShortDate(date) {
      if (!(date instanceof Date)) return '--';
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Update status bar UI
    function updateStatusBadge(state, text) {
      const badge = document.getElementById('statusBadge');
      const statusText = document.getElementById('statusText');
      statusText.textContent = text;
      
      badge.className = "flex items-center space-x-2 text-xs px-2.5 py-1 rounded-full border ";
      if (state === 'success') {
        badge.classList.add('bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/20');
        badge.querySelector('span').className = "w-2 h-2 rounded-full bg-emerald-400";
      } else if (state === 'offline') {
        badge.classList.add('bg-amber-500/10', 'text-amber-400', 'border-amber-500/20');
        badge.querySelector('span').className = "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
      } else {
        badge.classList.add('bg-red-500/10', 'text-red-400', 'border-red-500/20');
        badge.querySelector('span').className = "w-2 h-2 rounded-full bg-red-400";
      }
    }

    function getCurrentTimeframeOption() {
      const options = TIMEFRAME_OPTIONS[selectedAggregationLevel] || [];
      const selectedKey = selectedTimeframeByAggregation[selectedAggregationLevel];
      const selectedOption = options.find(opt => opt.key === selectedKey);
      return selectedOption || options[0] || { key: 'all', all: true };
    }

    function shiftDateByUnit(date, amount, unit) {
      const shifted = new Date(date);
      if (unit === 'days') {
        shifted.setDate(shifted.getDate() - amount);
      } else if (unit === 'months') {
        shifted.setMonth(shifted.getMonth() - amount);
      } else if (unit === 'years') {
        shifted.setFullYear(shifted.getFullYear() - amount);
      }
      return shifted;
    }

    // Helper to derive a date range from the selected timeframe (always using weeks as horizon)
    function getTimeframeRange() {
      const maxDate = new Date(Math.max(...processedActivities.map(a => a.date)));
      const overallMinDate = new Date(Math.min(...processedActivities.map(a => a.date)));
      const selectedTimeframe = getCurrentTimeframeOption();

      if (!selectedTimeframe.all) {
        const proposedMin = shiftDateByUnit(maxDate, selectedTimeframe.amount, selectedTimeframe.unit);
        const minDate = proposedMin < overallMinDate ? overallMinDate : proposedMin;
        return { minDate, maxDate };
      }

      // 'all' timeframe → full dataset range
      return { minDate: overallMinDate, maxDate };
    }

    function getActivitiesInTimeframe() {
      const { minDate, maxDate } = getTimeframeRange();
      return processedActivities.filter(act => act.date >= minDate && act.date <= maxDate);
    }

    function getWeeksInDisplayedHorizon() {
      const { minDate, maxDate } = getTimeframeRange();
      const diffMs = maxDate - minDate;
      const weeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
      return Math.max(1, weeks);
    }

    // Helper function to get aggregation based on selected level
    function getAggregatedData() {
      if (selectedAggregationLevel === 'daily') {
        return aggregateActivitiesByDay();
      } else if (selectedAggregationLevel === 'monthly') {
        return aggregateActivitiesByMonth();
      } else if (selectedAggregationLevel === 'yearly') {
        return aggregateActivitiesByYear();
      } else {
        return aggregateActivitiesByWeek();
      }
    }

    // Aggregate by day (respecting timeframe)
    function aggregateActivitiesByDay() {
      const { minDate, maxDate } = getTimeframeRange();

      const lastDay = new Date(maxDate);
      lastDay.setHours(0, 0, 0, 0);

      const firstDay = new Date(minDate);
      firstDay.setHours(0, 0, 0, 0);

      const daysList = [];
      const current = new Date(firstDay);
      while (current <= lastDay) {
        daysList.push({
          date: new Date(current),
          formattedLabel: formatDateLabel(current),
          isoKey: formatDateIso(current),
          Run: 0,
          Bike: 0,
          Swim: 0
        });
        current.setDate(current.getDate() + 1);
      }

      const activeDaysKeys = new Set(daysList.map(d => d.isoKey));
      const timeframeActivities = getActivitiesInTimeframe();
      const filteredActivities = timeframeActivities.filter(act => activeDaysKeys.has(formatDateIso(act.date)));

      filteredActivities.forEach(act => {
        if (!act.sport) return;
        const dayKey = formatDateIso(act.date);
        const dayObj = daysList.find(d => d.isoKey === dayKey);
        if (dayObj) {
          dayObj[act.sport] += act.distance;
        }
      });

      return { aggregatedList: daysList, filteredActivities };
    }

    // Aggregate by month (respecting timeframe)
    function aggregateActivitiesByMonth() {
      const { minDate, maxDate } = getTimeframeRange();

      const monthsList = [];
      const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      while (current <= maxDate) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `${monthNames[current.getMonth()]} '${String(current.getFullYear()).slice(-2)}`;
        
        monthsList.push({
          date: new Date(current),
          formattedLabel: monthLabel,
          isoKey: monthKey,
          Run: 0,
          Bike: 0,
          Swim: 0
        });
        
        current.setMonth(current.getMonth() + 1);
      }

      const filteredActivities = getActivitiesInTimeframe();
      
      filteredActivities.forEach(act => {
        if (!act.sport) return;
        const monthKey = `${act.date.getFullYear()}-${String(act.date.getMonth() + 1).padStart(2, '0')}`;
        const monthObj = monthsList.find(m => m.isoKey === monthKey);
        if (monthObj) {
          monthObj[act.sport] += act.distance;
        }
      });

      return { aggregatedList: monthsList, filteredActivities };
    }

    // Aggregate by year (respecting timeframe)
    function aggregateActivitiesByYear() {
      const { minDate, maxDate } = getTimeframeRange();

      const yearsList = [];
      let currentYear = minDate.getFullYear();
      const maxYear = maxDate.getFullYear();

      while (currentYear <= maxYear) {
        const isoKey = String(currentYear);
        const label = String(currentYear);
        yearsList.push({
          date: new Date(currentYear, 0, 1),
          formattedLabel: label,
          isoKey,
          Run: 0,
          Bike: 0,
          Swim: 0
        });
        currentYear++;
      }

      const filteredActivities = getActivitiesInTimeframe();

      filteredActivities.forEach(act => {
        if (!act.sport) return;
        const yearKey = String(act.date.getFullYear());
        const yearObj = yearsList.find(y => y.isoKey === yearKey);
        if (yearObj) {
          yearObj[act.sport] += act.distance;
        }
      });

      return { aggregatedList: yearsList, filteredActivities };
    }

    // Aggregate by week (existing logic, adapted into helper)
    function aggregateActivitiesByWeek() {
      const { minDate, maxDate } = getTimeframeRange();
      const lastMonday = getMonday(maxDate);
      const firstMonday = getMonday(minDate);

      const weeksList = [];
      const currentMonday = new Date(firstMonday);
      while (currentMonday <= lastMonday) {
        const monday = new Date(currentMonday);
        weeksList.push({
          date: monday,
          formattedLabel: formatDateLabel(monday),
          isoKey: formatDateIso(monday),
          Run: 0,
          Bike: 0,
          Swim: 0
        });
        currentMonday.setDate(currentMonday.getDate() + 7);
      }

      const activeWeeksKeys = new Set(weeksList.map(w => w.isoKey));

      // Filter activities inside this timeframe
      const timeframeActivities = getActivitiesInTimeframe();
      const filteredActivities = timeframeActivities.filter(act => {
        const key = formatDateIso(act.monday);
        return activeWeeksKeys.has(key);
      });

      // Sum distances per sport per week
      filteredActivities.forEach(act => {
        if (!act.sport) return; // Skip unsupported activities for chart volume
        
        const weekKey = formatDateIso(act.monday);
        const weekObj = weeksList.find(w => w.isoKey === weekKey);
        if (weekObj) {
          weekObj[act.sport] += act.distance;
        }
      });

      return { aggregatedList: weeksList, filteredActivities };
    }

    // Filter and aggregate data based on selections, then render
    function renderDashboard() {
      if (processedActivities.length === 0) return;

      const { aggregatedList: aggregatedList, filteredActivities } = getAggregatedData();
      const timeframeActivities = getActivitiesInTimeframe();

      // Compute Dashboard Stats (Cards)
      let totalKm = 0;
      let totalRun = 0;
      let totalBike = 0;
      let totalSwim = 0;
      let peakKm = 0;
      let uniqueTrainingDays = new Set();

      timeframeActivities.forEach(act => {
        // Accumulate raw sport metrics
        if (act.sport === 'Run') totalRun += act.distance;
        else if (act.sport === 'Bike') totalBike += act.distance;
        else if (act.sport === 'Swim') totalSwim += act.distance;

        // If filtering by specific sport, check matching
        if (selectedSportFilter === 'All' || act.sport === selectedSportFilter) {
          totalKm += act.distance;
          uniqueTrainingDays.add(formatDateIso(act.date));
        }
      });

      // Peak week is always computed weekly within the currently displayed horizon
      const weeklyAggregationForPeak = aggregateActivitiesByWeek().aggregatedList;
      weeklyAggregationForPeak.forEach(bucket => {
        const volume = selectedSportFilter === 'All'
          ? (bucket.Run + bucket.Bike + bucket.Swim)
          : (bucket[selectedSportFilter] || 0);
        if (volume > peakKm) peakKm = volume;
      });

      // Weekly average always reflects visible horizon length in weeks
      const weeksInHorizon = getWeeksInDisplayedHorizon();
      const avgKmPerWeek = weeksInHorizon > 0 ? (totalKm / weeksInHorizon) : 0;

      // Update Card UI
      document.getElementById('cardTotalKm').textContent = totalKm.toFixed(1);
      document.getElementById('cardAvgKm').textContent = avgKmPerWeek.toFixed(1);
      document.getElementById('cardPeakKm').textContent = peakKm.toFixed(1);

      // Sport Distribution Pill split
      const totalAllSports = totalRun + totalBike + totalSwim;
      const runPct = totalAllSports > 0 ? Math.round((totalRun / totalAllSports) * 100) : 0;
      const bikePct = totalAllSports > 0 ? Math.round((totalBike / totalAllSports) * 100) : 0;
      const swimPct = totalAllSports > 0 ? Math.round((totalSwim / totalAllSports) * 100) : 0;

      document.getElementById('splitBarRun').style.width = `${runPct}%`;
      document.getElementById('splitBarBike').style.width = `${bikePct}%`;
      document.getElementById('splitBarSwim').style.width = `${swimPct}%`;

      document.getElementById('splitPctRun').textContent = `${runPct}%`;
      document.getElementById('splitPctBike').textContent = `${bikePct}%`;
      document.getElementById('splitPctSwim').textContent = `${swimPct}%`;

      // Build Chart
      buildTrainingChart(aggregatedList);
    }

    // Build the Chart.js visual representation
    function buildTrainingChart(weeksList) {
      const ctx = document.getElementById('trainingChart').getContext('2d');
      
      const labels = weeksList.map(w => w.formattedLabel);
      
      // Chart datasets depending on sport selection
      let datasets = [];

      if (selectedSportFilter === 'All' || selectedSportFilter === 'Run') {
        datasets.push({
          label: 'Running',
          data: weeksList.map(w => w.Run),
          backgroundColor: '#EF4444', // Red-500
          hoverBackgroundColor: '#F87171',
          borderRadius: selectedSportFilter === 'Run' ? 4 : 0,
          stack: 'trainingStack'
        });
      }
      if (selectedSportFilter === 'All' || selectedSportFilter === 'Bike') {
        datasets.push({
          label: 'Cycling',
          data: weeksList.map(w => w.Bike),
          backgroundColor: '#14B8A6', // Teal-500
          hoverBackgroundColor: '#2DD4BF',
          borderRadius: selectedSportFilter === 'Bike' ? 4 : 0,
          stack: 'trainingStack'
        });
      }
      if (selectedSportFilter === 'All' || selectedSportFilter === 'Swim') {
        datasets.push({
          label: 'Swimming',
          data: weeksList.map(w => w.Swim),
          backgroundColor: '#06B6D4', // Cyan-500
          hoverBackgroundColor: '#22D3EE',
          borderRadius: 4, // always top layer gets rounded corners
          stack: 'trainingStack'
        });
      }

      // If chart already exists, destroy it before recreating
      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: selectedSportFilter === 'All', // Only show legend if multiple stacked
              position: 'top',
              labels: {
                color: '#94A3B8',
                font: { size: 11, weight: '500' },
                boxWidth: 12,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#94A3B8',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              boxPadding: 6,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(1) + ' km';
                  }
                  return label;
                },
                footer: function(items) {
                  if (selectedSportFilter !== 'All') return '';
                  let sum = 0;
                  items.forEach(function(item) {
                    sum += item.parsed.y;
                  });
                  return 'Total: ' + sum.toFixed(1) + ' km';
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false
              },
              ticks: {
                color: '#64748B',
                font: { size: 10 },
                maxRotation: 45,
                minRotation: 0,
                autoSkip: true,
                maxTicksLimit: window.innerWidth < 640 ? 8 : 16
              }
            },
            y: {
              stacked: true,
              grid: {
                color: '#1E293B'
              },
              ticks: {
                color: '#64748B',
                font: { size: 10 },
                callback: function(value) {
                  return value + ' km';
                }
              }
            }
          }
        }
      });
    }

    // ─── End Personal Bests Visualization ────────────────────────────────────────

    // UI Interactive helpers for filters
    function setSportFilter(sport) {
      selectedSportFilter = sport;
      
      // Update Buttons State
      document.querySelectorAll('[id^="sportBtn"]').forEach(btn => {
        btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200";
      });
      setBtnActive(`sportBtn${sport}`);
      
      renderDashboard();
    }

    function setTimeframeFilter(timeframeKey) {
      selectedTimeframeByAggregation[selectedAggregationLevel] = timeframeKey;
      renderTimeframeButtons();
      renderDashboard();
    }

    function renderTimeframeButtons() {
      const container = document.getElementById('timeframeSelector');
      if (!container) return;

      const options = TIMEFRAME_OPTIONS[selectedAggregationLevel] || [];
      const selectedKey = selectedTimeframeByAggregation[selectedAggregationLevel];

      if (!options.some(opt => opt.key === selectedKey) && options[0]) {
        selectedTimeframeByAggregation[selectedAggregationLevel] = options[0].key;
      }

      const activeKey = selectedTimeframeByAggregation[selectedAggregationLevel];
      container.innerHTML = '';

      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = `timeBtn${opt.key}`;
        btn.textContent = opt.label;
        btn.className = opt.key === activeKey
          ? 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25'
          : 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
        btn.addEventListener('click', () => setTimeframeFilter(opt.key));
        container.appendChild(btn);
      });
    }

    // Aggregation level toggle
    function setAggregationLevel(level) {
      selectedAggregationLevel = level;

      // Update Buttons State
      document.querySelectorAll('[id^="aggBtn"]').forEach(btn => {
        btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200";
      });
      const btnId = `aggBtn${level.charAt(0).toUpperCase() + level.slice(1)}`;
      setBtnActive(btnId);

      renderTimeframeButtons();

      renderDashboard();
    }

    function setBtnActive(btnId) {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25";
      }
    }
