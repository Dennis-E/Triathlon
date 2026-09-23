     let selectedDistributionsMetric = 'length';
     let selectedDistributionsSportFilter = 'All';
     let selectedDistributionsDisplayMode = 'line';
    let selectedDistributionsColorScheme = 'fire';
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

    function setDistributionsColorScheme(scheme) {
      selectedDistributionsColorScheme = scheme === 'monochrome-blue' ? scheme : 'fire';
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

    function showDistributionsEmptyState(message) {
      if (distributionsChartInstance) {
        distributionsChartInstance.destroy();
        distributionsChartInstance = null;
      }
      const canvas = document.getElementById('distributionsChart');
      const emptyState = document.getElementById('distributionsEmptyState');
      const countEl = document.getElementById('distributionsPointCount');
      if (canvas) canvas.classList.add('hidden');
      if (emptyState) {
        emptyState.classList.remove('hidden');
        emptyState.textContent = message;
      }
      if (countEl) countEl.textContent = 'N/A';
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

      if (selectedDistributionsSportFilter === 'All' && selectedDistributionsDisplayMode === 'histogram') {
        showDistributionsEmptyState('N/A: Histogram is not available for All Sports.');
        return;
      }

      if (selectedDistributionsMetric === 'elevation' && selectedDistributionsSportFilter === 'Swim') {
        showDistributionsEmptyState('N/A: Elevation gain is not applicable to Swim activities.');
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
        .map(activity => window.distributionUtils.getMetricValue(activity, selectedDistributionsMetric, {
          normalizePaceToSpeed: selectedDistributionsMetric === 'pace' && selectedDistributionsSportFilter === 'All'
        }))
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
        showDistributionsEmptyState(`N/A: No activities with ${DISTRIBUTIONS_METRIC_CONFIG[selectedDistributionsMetric].label} data available in the current dataset.`);
        return;
      }

      canvas.classList.remove('hidden');
      if (emptyState) emptyState.classList.add('hidden');

      const metricConfig = DISTRIBUTIONS_METRIC_CONFIG[selectedDistributionsMetric];
      const getBucketDisplayLabel = bucket => {
        if (bucket.isOverflow || bucket.isUnderflow) return bucket.label;
        return window.distributionUtils.getHistogramBoundaryTicks([bucket], selectedDistributionsMetric, selectedDistributionsSportFilter !== 'All' ? selectedDistributionsSportFilter : null)[0] || bucket.label;
      };
      const bucketLabels = buckets.map(getBucketDisplayLabel);
      const bucketCounts = buckets.map(b => b.count);

      const showPerSportLines = selectedDistributionsSportFilter === 'All' && selectedDistributionsDisplayMode === 'line';
      const shouldReverseAxis = selectedDistributionsMetric === 'pace' &&
        (selectedDistributionsSportFilter === 'Run' || selectedDistributionsSportFilter === 'Swim');
      const getBucketLineX = bucket => (bucket.isOverflow ? bucket.rangeStart : bucket.isUnderflow ? bucket.rangeEnd : (bucket.rangeStart + bucket.rangeEnd) / 2);
      const getColorPositions = count => {
        const positions = count <= 1 ? [0] : Array.from({ length: count }, (_, i) => i / (count - 1));
        return shouldReverseAxis ? positions.map(p => 1 - p) : positions;
      };
      const getDistributionColor = position => window.distributionUtils.getDistributionColor(position, selectedDistributionsColorScheme);
      const bucketColors = getColorPositions(buckets.length).map(getDistributionColor);
      const histogramColors = selectedDistributionsColorScheme === 'monochrome-blue'
        ? bucketColors.map(() => getDistributionColor(0.5))
        : bucketColors;
      const getBucketLabelForX = value => {
        let closestBucket = buckets[0];
        let closestDistance = Infinity;
        buckets.forEach(bucket => {
          const distance = Math.abs(getBucketLineX(bucket) - value);
          if (distance < closestDistance) {
            closestBucket = bucket;
            closestDistance = distance;
          }
        });
        return closestBucket ? getBucketDisplayLabel(closestBucket) : value;
      };

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
        const sports = Object.keys(perSport);
        datasets = sports.map((sport, sportIndex) => {
          const sportBuckets = perSport[sport].buckets;
          const sportStrokeColor = selectedDistributionsColorScheme === 'monochrome-blue'
            ? getDistributionColor(sports.length <= 1 ? 0.5 : sportIndex / (sports.length - 1))
            : PB_SPORT_COLOR[sport] || '#6366F1';
          const sportFillColor = `${sportStrokeColor}33`;
          return {
            type: 'line',
            label: sport,
            data: sportBuckets.map(b => ({ x: getBucketLineX(b), y: b.count })),
            borderColor: sportStrokeColor,
            backgroundColor: sportFillColor,
            cubicInterpolationMode: 'monotone',
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 0
          };
        });
      } else {
        const dataset = selectedDistributionsDisplayMode === 'line'
          ? {
              type: 'line',
              label: 'Activities',
              data: buckets.map(b => ({ x: getBucketLineX(b), y: b.count })),
              borderColor: getDistributionColor(0.75),
              backgroundColor: `${getDistributionColor(0.75)}33`,
              cubicInterpolationMode: 'monotone',
              tension: 0.4,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 0
            }
          : {
              type: 'bar',
              label: 'Activities',
              data: bucketCounts,
              backgroundColor: histogramColors
            };
        datasets = [dataset];
      }

      const PACE_UNIT_BY_SPORT = { Run: 'min/km', Swim: 'min/100m', Bike: 'km/h' };
      const axisTitleText = selectedDistributionsMetric === 'pace'
        ? (PACE_UNIT_BY_SPORT[selectedDistributionsSportFilter]
          ? `Pace (${PACE_UNIT_BY_SPORT[selectedDistributionsSportFilter]})`
          : 'Pace (km/h)')
        : ({
            length: 'Length (km)',
            duration: 'Duration (h:m)',
            elevation: 'Elevation gain (m)',
            power: 'Power (W)'
          }[selectedDistributionsMetric] || metricConfig.label);

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
              ticks: {
                color: '#94A3B8',
                callback: value => selectedDistributionsDisplayMode === 'line'
                  ? getBucketLabelForX(Number(value))
                  : bucketLabels[Number(value)] || value
              },
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
            legend: {
              display: showPerSportLines,
              labels: {
                usePointStyle: true,
                pointStyle: 'circle'
              }
            }
          }
        }
      });
    }
