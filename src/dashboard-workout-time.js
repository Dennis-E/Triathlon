    let selectedWorkoutTimeGranularity = 'day';
    let selectedWorkoutTimeSport = 'All';
    let workoutTimeChartInstance = null;
    let workoutTimeDateRange = { start: 0, end: 0 };
    let workoutTimeDateCandidates = [];

    function setWorkoutTimeButtonActive(prefix, activeId) {
      document.querySelectorAll(`[id^="${prefix}"]`).forEach(button => {
        button.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
      });
      const activeButton = document.getElementById(activeId);
      if (activeButton) {
        activeButton.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
      }
    }

    function initWorkoutTimeDateSlider() {
      const startInput = document.getElementById('workoutTimeDateStart');
      const endInput = document.getElementById('workoutTimeDateEnd');
      if (!startInput || !endInput || !Array.isArray(processedActivities)) return;

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
      selectedWorkoutTimeGranularity = granularity;
      setWorkoutTimeButtonActive('workoutTimeGranularityBtn', `workoutTimeGranularityBtn${granularity.charAt(0).toUpperCase()}${granularity.slice(1)}`);
      renderWorkoutTimeChart();
    }

    function setWorkoutTimeSportFilter(sport) {
      if (!['All', 'Run', 'Bike', 'Swim'].includes(sport)) return;
      selectedWorkoutTimeSport = sport;
      setWorkoutTimeButtonActive('workoutTimeSportBtn', `workoutTimeSportBtn${sport}`);
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

    function renderWorkoutTimeChart() {
      const canvas = document.getElementById('workoutTimeChart');
      if (!canvas || !window.workoutTimeUtils) return;
      if (workoutTimeDateCandidates.length === 0) initWorkoutTimeDateSlider();

      const dataset = window.workoutTimeUtils.buildWorkoutTimeDataset(processedActivities, {
        granularity: selectedWorkoutTimeGranularity,
        sport: selectedWorkoutTimeSport,
        ...getWorkoutTimeDateBounds()
      });
      const countElement = document.getElementById('workoutTimeActivityCount');
      if (countElement) countElement.textContent = `${dataset.activityCount} activities`;
      if (dataset.activityCount === 0) {
        showWorkoutTimeEmptyState('No activities with valid start times are available for the current filters.');
        return;
      }

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
            label: 'Workouts',
            data: dataset.groups.map(group => group.count),
            backgroundColor: 'rgba(99, 102, 241, 0.72)',
            borderColor: '#818cf8',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { title: { display: true, text: selectedWorkoutTimeGranularity === 'day' ? 'Start time' : selectedWorkoutTimeGranularity } },
            y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Workouts' } }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: context => `${context.parsed.y} workouts`
              }
            },
            legend: { display: false }
          }
        }
      });
    }
