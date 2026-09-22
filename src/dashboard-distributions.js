     let selectedDistributionsMetric = 'length';
     let selectedDistributionsSportFilter = 'All';
     let selectedDistributionsDisplayMode = 'line';
     let distributionsChartInstance = null;
     let distributionsDateRange = { start: 0, end: 0 };
     let distributionsDateCandidates = [];

    const DISTRIBUTIONS_METRIC_CONFIG = {
      length: { label: 'Length' },
      duration: { label: 'Duration' },
      pace: { label: 'Pace' },
      elevation: { label: 'Elevation gain' },
      power: { label: 'Power' }
    };

    // --- Distributions tab (specs/018-activity-distributions) ---

    function setDistributionsBtnActive(prefix, activeId) {
      document.querySelectorAll(`[id^="${prefix}"]`).forEach(btn => {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
      });
      const btn = document.getElementById(activeId);
      if (btn) {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
      }
    }

    function setDistributionsMetric(metricKey) {
      selectedDistributionsMetric = metricKey;
      const metricBtnSuffix = metricKey.charAt(0).toUpperCase() + metricKey.slice(1);
      setDistributionsBtnActive('distributionsMetricBtn', `distributionsMetricBtn${metricBtnSuffix}`);
      renderDistributionsChart();
    }

    function setDistributionsSportFilter(sport) {
      selectedDistributionsSportFilter = sport;
      setDistributionsBtnActive('distributionsSportBtn', `distributionsSportBtn${sport}`);
      renderDistributionsChart();
    }

    function setDistributionsDisplayMode(mode) {
      selectedDistributionsDisplayMode = mode;
      const modeBtnSuffix = mode.charAt(0).toUpperCase() + mode.slice(1);
      setDistributionsBtnActive('distributionsModeBtn', `distributionsModeBtn${modeBtnSuffix}`);
      renderDistributionsChart();
    }

    function initDistributionsDateSlider() {
      const startInput = document.getElementById('distributionsDateStart');
      const endInput = document.getElementById('distributionsDateEnd');
      if (!startInput || !endInput) return;

      const uniqueIsoDates = Array.from(new Set(processedActivities.map(a => formatDateIso(a.date)))).sort();
      distributionsDateCandidates = uniqueIsoDates.map(iso => {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d);
      });

      if (distributionsDateCandidates.length === 0) {
        distributionsDateCandidates = [new Date()];
      }

      const maxIndex = distributionsDateCandidates.length - 1;
      distributionsDateRange.start = 0;
      distributionsDateRange.end = maxIndex;

      startInput.min = '0';
      endInput.min = '0';
      startInput.max = String(maxIndex);
      endInput.max = String(maxIndex);
      startInput.step = '1';
      endInput.step = '1';
      startInput.value = '0';
      endInput.value = String(maxIndex);

      updateDistributionsDateRangeLabel();
      updateDistributionsDateRangeTrack();
    }

    function updateDistributionsDateRangeLabel() {
      const label = document.getElementById('distributionsRangeLabel');
      if (!label || distributionsDateCandidates.length === 0) return;

      const startDate = distributionsDateCandidates[distributionsDateRange.start];
      const endDate = distributionsDateCandidates[distributionsDateRange.end];
      const isAll = distributionsDateRange.start === 0 && distributionsDateRange.end === distributionsDateCandidates.length - 1;
      label.textContent = isAll
        ? 'All'
        : `${formatShortDate(startDate)} to ${formatShortDate(endDate)}`;
    }

    function updateDistributionsDateRangeTrack() {
      const track = document.getElementById('distributionsRangeSelectedTrack');
      if (!track || distributionsDateCandidates.length === 0) return;

      const maxIndex = Math.max(1, distributionsDateCandidates.length - 1);
      const leftPct = (distributionsDateRange.start / maxIndex) * 100;
      const rightPct = 100 - ((distributionsDateRange.end / maxIndex) * 100);

      track.style.left = `${leftPct}%`;
      track.style.right = `${rightPct}%`;
    }

    function getDistributionsDateBounds() {
      if (distributionsDateCandidates.length === 0) return { minDate: null, maxDate: null };
      const minDate = distributionsDateCandidates[distributionsDateRange.start];
      const maxDate = new Date(distributionsDateCandidates[distributionsDateRange.end]);
      maxDate.setHours(23, 59, 59, 999);
      return { minDate, maxDate };
    }

    function setDistributionsDateRange(boundary, value) {
      const parsed = parseInt(value, 10);
      if (Number.isNaN(parsed)) return;

      if (boundary === 'start') {
        distributionsDateRange.start = Math.max(0, Math.min(parsed, distributionsDateRange.end));
      } else {
        const maxIndex = distributionsDateCandidates.length - 1;
        distributionsDateRange.end = Math.min(maxIndex, Math.max(parsed, distributionsDateRange.start));
      }

      const startInput = document.getElementById('distributionsDateStart');
      const endInput = document.getElementById('distributionsDateEnd');
      if (startInput) startInput.value = String(distributionsDateRange.start);
      if (endInput) endInput.value = String(distributionsDateRange.end);

      updateDistributionsDateRangeLabel();
      updateDistributionsDateRangeTrack();
      renderDistributionsChart();
    }

    function renderDistributionsChart() {
      const canvas = document.getElementById('distributionsChart');
      const emptyState = document.getElementById('distributionsEmptyState');
      if (!canvas) return;

      if (selectedDistributionsMetric === 'elevation' && selectedDistributionsSportFilter === 'Swim') {
        if (distributionsChartInstance) {
          distributionsChartInstance.destroy();
          distributionsChartInstance = null;
        }
        canvas.classList.add('hidden');
        if (emptyState) {
          emptyState.classList.remove('hidden');
          emptyState.textContent = 'Elevation gain is not applicable to Swim activities.';
        }
        const countEl = document.getElementById('distributionsPointCount');
        if (countEl) countEl.textContent = 'N/A';
        return;
      }

      const { minDate, maxDate } = getDistributionsDateBounds();
      const qualifyingActivities = window.distributionUtils.filterActivitiesForDistribution(processedActivities, {
        metric: selectedDistributionsMetric,
        sport: selectedDistributionsSportFilter,
        minDate,
        maxDate
      });

      const values = qualifyingActivities
        .map(activity => window.distributionUtils.getMetricValue(activity, selectedDistributionsMetric))
        .filter(value => Number.isFinite(value));

      const { buckets, activityCount } = window.distributionUtils.computeDistributionBuckets(values, {
        metricKey: selectedDistributionsMetric,
        sport: selectedDistributionsSportFilter !== 'All' ? selectedDistributionsSportFilter : null,
        enableUnderflow: selectedDistributionsMetric === 'pace'
      });

      const countEl = document.getElementById('distributionsPointCount');
      if (countEl) {
        countEl.textContent = `${activityCount} activities`;
      }

      if (distributionsChartInstance) {
        distributionsChartInstance.destroy();
        distributionsChartInstance = null;
      }

      if (activityCount === 0) {
        canvas.classList.add('hidden');
        if (emptyState) {
          emptyState.classList.remove('hidden');
          emptyState.textContent = `No activities with ${DISTRIBUTIONS_METRIC_CONFIG[selectedDistributionsMetric].label} data available in the current dataset.`;
        }
        return;
      }

      canvas.classList.remove('hidden');
      if (emptyState) emptyState.classList.add('hidden');

      const metricConfig = DISTRIBUTIONS_METRIC_CONFIG[selectedDistributionsMetric];
      const bucketLabels = buckets.map(b => b.label);
      const bucketCounts = buckets.map(b => b.count);

      const showPerSportLines = selectedDistributionsSportFilter === 'All' && selectedDistributionsDisplayMode === 'line';
      const shouldReverseAxis = selectedDistributionsMetric === 'pace' &&
        (selectedDistributionsSportFilter === 'Run' || selectedDistributionsSportFilter === 'Swim');
      const getBucketLineX = bucket => (bucket.isOverflow ? bucket.rangeStart : bucket.isUnderflow ? bucket.rangeEnd : (bucket.rangeStart + bucket.rangeEnd) / 2);
      const getColorPositions = count => {
        const positions = count <= 1 ? [0] : Array.from({ length: count }, (_, i) => i / (count - 1));
        return shouldReverseAxis ? positions.map(p => 1 - p) : positions;
      };
      const bucketFireColors = getColorPositions(buckets.length).map(position => window.distributionUtils.getFireGradientColor(position));

      let datasets;
      if (showPerSportLines) {
        const perSport = window.distributionUtils.groupBucketCountsBySport(
          qualifyingActivities,
          selectedDistributionsMetric,
          buckets
        );
        if (selectedDistributionsMetric === 'elevation') {
          delete perSport.Swim;
        }
        datasets = Object.keys(perSport).map(sport => {
          const sportBuckets = perSport[sport].buckets;
          const sportFireColors = getColorPositions(sportBuckets.length).map(position => window.distributionUtils.getFireGradientColor(position));
          return {
            type: 'line',
            label: sport,
            data: sportBuckets.map(b => ({ x: getBucketLineX(b), y: b.count })),
            borderColor: PB_SPORT_COLOR[sport] || '#6366F1',
            backgroundColor: 'transparent',
            pointBackgroundColor: sportFireColors,
            cubicInterpolationMode: 'monotone',
            tension: 0.4,
            fill: false,
            pointRadius: 3
          };
        });
      } else {
        const dataset = selectedDistributionsDisplayMode === 'line'
          ? {
              type: 'line',
              label: 'Activities',
              data: buckets.map(b => ({ x: getBucketLineX(b), y: b.count })),
              borderColor: '#94A3B8',
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              pointBackgroundColor: bucketFireColors,
              cubicInterpolationMode: 'monotone',
              tension: 0.4,
              fill: true,
              pointRadius: 3
            }
          : {
              type: 'bar',
              label: 'Activities',
              data: bucketCounts,
              backgroundColor: bucketFireColors
            };
        datasets = [dataset];
      }

      const PACE_UNIT_BY_SPORT = { Run: 'min/km', Swim: 'min/100m', Bike: 'km/h' };
      const axisTitleText = selectedDistributionsMetric === 'pace' && PACE_UNIT_BY_SPORT[selectedDistributionsSportFilter]
        ? `Pace (${PACE_UNIT_BY_SPORT[selectedDistributionsSportFilter]})`
        : metricConfig.label;

      distributionsChartInstance = new Chart(canvas, {
        type: selectedDistributionsDisplayMode === 'line' ? 'line' : 'bar',
        data: {
          labels: selectedDistributionsDisplayMode === 'line' ? undefined : bucketLabels,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: selectedDistributionsDisplayMode === 'line' ? 'linear' : 'category',
              reverse: shouldReverseAxis,
              title: { display: true, text: axisTitleText },
              ticks: { color: '#94A3B8' },
              grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y: {
              title: { display: true, text: 'Activities' },
              beginAtZero: true,
              ticks: { color: '#94A3B8' },
              grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
          },
          plugins: {
            legend: { display: showPerSportLines }
          }
        }
      });
    }
