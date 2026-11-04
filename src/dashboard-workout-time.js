    let selectedWorkoutTimeGranularity = 'day';
    let selectedWorkoutTimeSport = 'All';
    let selectedWorkoutTimeMeasure = 'count';
    let workoutTimeChartInstance = null;
    let workoutTimeDateRange = { start: 0, end: 0 };
    let workoutTimeDateCandidates = [];
    let workoutTimeActivitySource = null;
    let workoutTimeExportData = null;

    function setWorkoutTimeButtonActive(prefix, activeId) {
      document.querySelectorAll(`[id^="${prefix}"]`).forEach(button => {
        button.setAttribute?.('aria-pressed', 'false');
        button.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
      });
      const activeButton = document.getElementById(activeId);
      if (activeButton) {
        activeButton.setAttribute?.('aria-pressed', 'true');
        activeButton.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
      }
    }

    function initWorkoutTimeDateSlider() {
      const startInput = document.getElementById('workoutTimeDateStart');
      const endInput = document.getElementById('workoutTimeDateEnd');
      if (!startInput || !endInput || !Array.isArray(processedActivities)) return;
      workoutTimeActivitySource = processedActivities;

      const uniqueDates = Array.from(new Set(processedActivities
        .filter(activity => activity.date instanceof Date && !Number.isNaN(activity.date.getTime()))
        .map(activity => formatDateIso(activity.date))))
        .sort();
      workoutTimeDateCandidates = uniqueDates.map(iso => {
        const [year, month, day] = iso.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
      if (workoutTimeDateCandidates.length === 0) workoutTimeDateCandidates = [new Date()];

      const maxIndex = workoutTimeDateCandidates.length - 1;
      workoutTimeDateRange = { start: 0, end: Math.max(0, maxIndex) };
      startInput.min = '0';
      startInput.max = String(Math.max(0, maxIndex));
      startInput.value = '0';
      endInput.min = '0';
      endInput.max = String(Math.max(0, maxIndex));
      endInput.value = String(Math.max(0, maxIndex));
      updateWorkoutTimeDateRangeLabel();
      updateWorkoutTimeDateRangeTrack();
    }

    function getWorkoutTimeDateBounds() {
      if (workoutTimeDateCandidates.length === 0) return { minDate: null, maxDate: null };
      const minDate = workoutTimeDateCandidates[workoutTimeDateRange.start];
      const maxDate = new Date(workoutTimeDateCandidates[workoutTimeDateRange.end]);
      maxDate.setHours(23, 59, 59, 999);
      return { minDate, maxDate };
    }

    function updateWorkoutTimeDateRangeLabel() {
      const label = document.getElementById('workoutTimeRangeLabel');
      if (!label || workoutTimeDateCandidates.length === 0) return;
      const first = workoutTimeDateCandidates[workoutTimeDateRange.start];
      const last = workoutTimeDateCandidates[workoutTimeDateRange.end];
      const all = workoutTimeDateRange.start === 0 && workoutTimeDateRange.end === workoutTimeDateCandidates.length - 1;
      label.textContent = all ? 'All' : `${formatShortDate(first)} to ${formatShortDate(last)}`;
    }

    function updateWorkoutTimeDateRangeTrack() {
      const track = document.getElementById('workoutTimeRangeSelectedTrack');
      if (!track || workoutTimeDateCandidates.length === 0) return;
      const maxIndex = Math.max(1, workoutTimeDateCandidates.length - 1);
      track.style.left = `${(workoutTimeDateRange.start / maxIndex) * 100}%`;
      track.style.right = `${100 - ((workoutTimeDateRange.end / maxIndex) * 100)}%`;
    }

    function setWorkoutTimeDateRange(boundary, value) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || workoutTimeDateCandidates.length === 0) return;
      const maxIndex = workoutTimeDateCandidates.length - 1;
      const next = boundary === 'start'
        ? Math.max(0, Math.min(parsed, workoutTimeDateRange.end))
        : Math.min(maxIndex, Math.max(parsed, workoutTimeDateRange.start));
      if (next !== workoutTimeDateRange[boundary === 'start' ? 'start' : 'end']) window.dashboardTooltips?.invalidate();
      if (boundary === 'start') {
        workoutTimeDateRange.start = Math.max(0, Math.min(parsed, workoutTimeDateRange.end));
      } else {
        workoutTimeDateRange.end = Math.min(maxIndex, Math.max(parsed, workoutTimeDateRange.start));
      }
      const startInput = document.getElementById('workoutTimeDateStart');
      const endInput = document.getElementById('workoutTimeDateEnd');
      if (startInput) startInput.value = String(workoutTimeDateRange.start);
      if (endInput) endInput.value = String(workoutTimeDateRange.end);
      updateWorkoutTimeDateRangeLabel();
      updateWorkoutTimeDateRangeTrack();
      renderWorkoutTimeChart();
    }

    function setWorkoutTimeGranularity(granularity) {
      if (!window.workoutTimeUtils || !Object.values(window.workoutTimeUtils.GRANULARITIES).includes(granularity)) return;
      if (granularity !== selectedWorkoutTimeGranularity) window.dashboardTooltips?.invalidate();
      selectedWorkoutTimeGranularity = granularity;
      setWorkoutTimeButtonActive('workoutTimeGranularityBtn', `workoutTimeGranularityBtn${granularity.charAt(0).toUpperCase()}${granularity.slice(1)}`);
      renderWorkoutTimeChart();
    }

    function setWorkoutTimeSportFilter(sport) {
      if (!['All', 'Run', 'Bike', 'Swim'].includes(sport)) return;
      if (sport !== selectedWorkoutTimeSport) window.dashboardTooltips?.invalidate();
      selectedWorkoutTimeSport = sport;
      setWorkoutTimeButtonActive('workoutTimeSportBtn', `workoutTimeSportBtn${sport}`);
      renderWorkoutTimeChart();
    }

    function setWorkoutTimeMeasure(measure) {
      if (!['count', 'duration', 'distance'].includes(measure) || measure === selectedWorkoutTimeMeasure) return;
      window.dashboardTooltips?.invalidate();
      selectedWorkoutTimeMeasure = measure;
      setWorkoutTimeButtonActive('workoutTimeMeasureBtn', `workoutTimeMeasureBtn${measure.charAt(0).toUpperCase()}${measure.slice(1)}`);
      renderWorkoutTimeChart();
    }

    function showWorkoutTimeEmptyState(message) {
      if (workoutTimeChartInstance) {
        workoutTimeChartInstance.destroy();
        workoutTimeChartInstance = null;
      }
      const canvas = document.getElementById('workoutTimeChart');
      const emptyState = document.getElementById('workoutTimeEmptyState');
      if (canvas) canvas.classList.add('hidden');
      if (emptyState) {
        emptyState.textContent = message;
        emptyState.classList.remove('hidden');
      }
    }

    function getWorkoutTimeKeyboardAdapter() {
      return window.dashboardTabNavigation.createDashboardFilterAdapter(
        () => ({ values: { granularity: selectedWorkoutTimeGranularity, sport: selectedWorkoutTimeSport, measure: selectedWorkoutTimeMeasure,
          start: workoutTimeDateRange.start, end: workoutTimeDateRange.end }, maxIndex: Math.max(0, workoutTimeDateCandidates.length - 1) }),
        (prefix, snapshot) => {
          if (prefix.length === 0) return { id: 'granularity', values: ['day', 'week', 'month', 'year'] };
          if (prefix.length === 1) return { id: 'sport', values: ['All', 'Run', 'Bike', 'Swim'] };
          if (prefix.length === 2) return { id: 'measure', values: ['count', 'duration', 'distance'] };
          if (prefix.length === 3) return { id: 'start', kind: 'stepped', min: 0, max: snapshot.maxIndex, step: 1 };
          if (prefix.length === 4) return { id: 'end', kind: 'stepped', min: prefix[3].value, max: snapshot.maxIndex, step: 1 };
          return null;
        },
        values => {
          if (values.granularity !== selectedWorkoutTimeGranularity || values.sport !== selectedWorkoutTimeSport || values.measure !== selectedWorkoutTimeMeasure ||
            values.start !== workoutTimeDateRange.start || values.end !== workoutTimeDateRange.end) window.dashboardTooltips?.invalidate();
          selectedWorkoutTimeGranularity = values.granularity;
          selectedWorkoutTimeSport = values.sport;
          selectedWorkoutTimeMeasure = values.measure;
          workoutTimeDateRange = { start: values.start, end: values.end };
          setWorkoutTimeButtonActive('workoutTimeGranularityBtn', `workoutTimeGranularityBtn${values.granularity.charAt(0).toUpperCase()}${values.granularity.slice(1)}`);
          setWorkoutTimeButtonActive('workoutTimeSportBtn', `workoutTimeSportBtn${values.sport}`);
          setWorkoutTimeButtonActive('workoutTimeMeasureBtn', `workoutTimeMeasureBtn${values.measure.charAt(0).toUpperCase()}${values.measure.slice(1)}`);
          ['start', 'end'].forEach(boundary => {
            const input = document.getElementById(boundary === 'start' ? 'workoutTimeDateStart' : 'workoutTimeDateEnd');
            if (input) input.value = String(values[boundary]);
          });
          updateWorkoutTimeDateRangeLabel();
          updateWorkoutTimeDateRangeTrack();
          renderWorkoutTimeChart();
        }
      );
    }

    function createWorkoutTimeInspection(dataset) {
      const { getMeasureDefinition, formatWorkoutTimeValue } = window.workoutTimeUtils;
      const definition = getMeasureDefinition(dataset.measure);
      return {
        resolveHits(event, chart) {
          const rect = chart.canvas.getBoundingClientRect();
          const x = (Number.isFinite(event.clientX) ? event.clientX - rect.left : event.offsetX) * chart.width / rect.width;
          const y = (Number.isFinite(event.clientY) ? event.clientY - rect.top : event.offsetY) * chart.height / rect.height;
          const area = chart.chartArea;
          if (!Number.isFinite(x) || !Number.isFinite(y) || x < area.left || x > area.right || y < area.top || y > area.bottom) return [];
          const category = chart.scales.x.getValueForPixel(x);
          if (!Number.isFinite(category)) return [];
          return [{ datasetIndex: 0, index: Math.max(0, Math.min(dataset.groups.length - 1, Math.round(category))) }];
        },
        describeContent(chart, hits) {
          const group = dataset.groups[hits[0].index];
          return {
            title: `${group.label} - ${definition.label}`, itemLabel: group.label,
            sections: [{ heading: '', rows: [{ label: definition.label, value: formatWorkoutTimeValue(group.value, dataset.measure) }] }],
            footerLines: [],
            notes: group.status === 'empty' ? ['No activities'] : group.status === 'unavailable' ? [`No usable ${dataset.measure} values`]
              : group.status === 'partial' ? [`Available for ${group.availableCount} of ${group.count} workouts`] : []
          };
        },
        anchorPoint(chart, hit) {
          const group = dataset.groups[hit.index];
          return { x: chart.scales.x.getPixelForValue(hit.index), y: chart.scales.y.getPixelForValue(group.value === null ? 0 : group.value / definition.divisor) };
        }
      };
    }

    function renderWorkoutTimeChart() {
      workoutTimeExportData = null;
      const canvas = document.getElementById('workoutTimeChart');
      if (!canvas || !window.workoutTimeUtils) return;
      if (workoutTimeActivitySource !== processedActivities || workoutTimeDateCandidates.length === 0) initWorkoutTimeDateSlider();

      const dataset = window.workoutTimeUtils.buildWorkoutTimeDataset(processedActivities, {
        granularity: selectedWorkoutTimeGranularity,
        sport: selectedWorkoutTimeSport,
        measure: selectedWorkoutTimeMeasure,
        ...getWorkoutTimeDateBounds()
      });
      const countElement = document.getElementById('workoutTimeActivityCount');
      if (countElement) countElement.textContent = `${dataset.activityCount} activities`;
      if (dataset.activityCount === 0) {
        showWorkoutTimeEmptyState('No activities with valid start times are available for the current filters.');
        return;
      }
      if (dataset.status === 'unavailable') {
        showWorkoutTimeEmptyState(`No usable ${dataset.measure} values are available for the current filters.`);
        return;
      }
      const measure = dataset.measure;
      const definition = window.workoutTimeUtils.getMeasureDefinition(measure);

      if (workoutTimeChartInstance) {
        workoutTimeChartInstance.destroy();
        workoutTimeChartInstance = null;
      }
      canvas.classList.remove('hidden');
      const emptyState = document.getElementById('workoutTimeEmptyState');
      if (emptyState) emptyState.classList.add('hidden');

      workoutTimeChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: dataset.groups.map(group => group.label),
          datasets: [{
            label: definition.axisTitle,
            inspectionKeys: dataset.groups.map(group => `${dataset.granularity}:${measure}:${group.key}`),
            data: dataset.groups.map(group => group.value === null ? null : group.value / definition.divisor),
            backgroundColor: 'rgba(99, 102, 241, 0.72)',
            borderColor: '#818cf8',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 250 },
          scales: {
            x: { title: { display: true, text: selectedWorkoutTimeGranularity === 'day' ? 'Start time' : selectedWorkoutTimeGranularity } },
            y: { beginAtZero: true, ticks: measure === 'count' ? { precision: 0 } : {}, title: { display: true, text: definition.axisTitle } }
          },
          plugins: {
            tooltip: {
              enabled: false,
              callbacks: {
                label: context => window.workoutTimeUtils.formatWorkoutTimeValue(
                  Number.isInteger(context.dataIndex) ? dataset.groups[context.dataIndex].value : context.parsed.y * definition.divisor, measure)
              }
            },
            legend: { display: false }
          }
        }
      });
      window.dashboardTooltips?.attachChart('workoutTime', workoutTimeChartInstance, createWorkoutTimeInspection(dataset));
      const bounds = getWorkoutTimeDateBounds();
      const chartData = JSON.parse(JSON.stringify(workoutTimeChartInstance.data || workoutTimeChartInstance.config.data));
      const xAxisTitle = dataset.granularity === 'day' ? 'Start time' : dataset.granularity;
      workoutTimeExportData = {
        sport: selectedWorkoutTimeSport, metric: measure, metricLabel: definition.label,
        unit: { count: 'activities', duration: 'h', distance: 'km' }[measure],
        rawUnit: { count: 'activities', duration: 's', distance: 'km' }[measure],
        valueDivisor: definition.divisor, granularity: dataset.granularity,
        periodMeaning: { day: 'Start-time blocks', week: 'Weekday pattern', month: 'Day-of-month pattern', year: 'Monthly pattern' }[dataset.granularity],
        period: bounds.minDate && bounds.maxDate ? `${formatDateIso(bounds.minDate)} - ${formatDateIso(bounds.maxDate)}` : null,
        periodStart: bounds.minDate?.getTime() ?? null, periodEnd: bounds.maxDate?.getTime() ?? null,
        status: dataset.status, activityCount: dataset.activityCount,
        groups: dataset.groups.map(group => ({ key: group.key, label: group.label, value: group.value,
          count: group.count, status: group.status, availableCount: group.availableCount,
          durationSeconds: group.durationSeconds, distanceKm: group.distanceKm,
          durationAvailableCount: group.durationAvailableCount, distanceAvailableCount: group.distanceAvailableCount })),
        xAxisTitle, yAxisTitle: definition.axisTitle,
        chartInput: { type: 'bar', data: chartData, visibility: [true], plugins: [],
          options: { responsive: false, animation: false, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: {
              x: { type: 'category', title: { display: true, text: xAxisTitle, color: '#f8fafc' }, ticks: { color: '#f8fafc' } },
              y: { beginAtZero: true, title: { display: true, text: definition.axisTitle, color: '#f8fafc' },
                ticks: { color: '#f8fafc', ...(measure === 'count' ? { precision: 0 } : {}) } }
            }
          }
        }
      };
    }

    function getWorkoutTimeExportData() {
      if (!workoutTimeExportData || !workoutTimeChartInstance) return null;
      const data = JSON.parse(JSON.stringify(workoutTimeExportData));
      const labels = data.chartInput.data.labels.slice();
      const granularity = data.granularity;
      data.xAxisTitle = { day: 'Start hour (2-hour blocks)', week: 'Weekday', month: 'Day of month', year: 'Month' }[granularity];
      if (granularity === 'day') data.periodMeaning = 'Two-hour start-time blocks';
      data.chartInput.options.scales.x.title.text = data.xAxisTitle;
      data.chartInput.options.scales.x.ticks = { color: '#f8fafc', autoSkip: true,
        maxRotation: 0, minRotation: 0, maxTicksLimit: 12,
        callback: value => {
          const label = String(labels[Number(value)] ?? value);
          return granularity === 'day' ? label.slice(0, 2)
            : ['week', 'year'].includes(granularity) ? label.slice(0, 3) : label;
        } };
      return data;
    }

    window.workoutTimeDashboard = { getExportData: getWorkoutTimeExportData };
