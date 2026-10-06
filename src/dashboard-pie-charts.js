    // --- Pie Charts tab (specs/049-pie-charts) ---

    let selectedPieDimension = 'sport';
    let selectedPieMeasure = 'count';
    let selectedPieSport = 'All';
    let selectedPieColorScheme = 'fire';
    let pieChartInstance = null;
    let currentPieResult = null;

    const PIE_BUTTON_ACTIVE_CLASS = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
    const PIE_BUTTON_INACTIVE_CLASS = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';

    const PIE_DIMENSION_BUTTON_IDS = {
      sport: 'pieDimensionBtnSport',
      duration: 'pieDimensionBtnDuration',
      pace: 'pieDimensionBtnPace',
      equipment: 'pieDimensionBtnEquipment',
      length: 'pieDimensionBtnLength',
      power: 'pieDimensionBtnPower'
    };
    const PIE_MEASURE_BUTTON_IDS = {
      count: 'pieMeasureBtnCount',
      time: 'pieMeasureBtnTime',
      distance: 'pieMeasureBtnDistance'
    };
    const PIE_SPORT_BUTTON_IDS = {
      All: 'pieSportBtnAll',
      Run: 'pieSportBtnRun',
      Bike: 'pieSportBtnBike',
      Swim: 'pieSportBtnSwim'
    };

    function setPieButtonGroupActive(buttonIds, activeKey) {
      Object.entries(buttonIds).forEach(([key, id]) => {
        const button = document.getElementById(id);
        if (button) button.className = key === activeKey ? PIE_BUTTON_ACTIVE_CLASS : PIE_BUTTON_INACTIVE_CLASS;
      });
    }

    function setPieDimension(dimension) {
      if (!PIE_DIMENSION_BUTTON_IDS[dimension]) return;
      selectedPieDimension = dimension;
      setPieButtonGroupActive(PIE_DIMENSION_BUTTON_IDS, dimension);
      renderPieCharts();
    }

    function setPieMeasure(measure) {
      if (!PIE_MEASURE_BUTTON_IDS[measure]) return;
      selectedPieMeasure = measure;
      setPieButtonGroupActive(PIE_MEASURE_BUTTON_IDS, measure);
      renderPieCharts();
    }

    function setPieSportFilter(sport) {
      if (!PIE_SPORT_BUTTON_IDS[sport]) return;
      selectedPieSport = sport;
      setPieButtonGroupActive(PIE_SPORT_BUTTON_IDS, sport);
      renderPieCharts();
    }

    function setPieColorScheme(scheme) {
      selectedPieColorScheme = scheme === 'monochrome-blue' ? scheme : 'fire';
      renderPieCharts();
    }

    function getPieLabelTextColor(hexColor) {
      const value = parseInt(String(hexColor).slice(1), 16);
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;
      return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#0f172a' : '#ffffff';
    }

    const piePercentageLabelPlugin = {
      id: 'piePercentageLabels',
      afterDatasetsDraw(chart) {
        const slices = currentPieResult ? currentPieResult.slices : [];
        const meta = chart.getDatasetMeta(0);
        const ctx = chart.ctx;
        ctx.save();
        ctx.font = '700 14px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        meta.data.forEach((arc, index) => {
          const slice = slices[index];
          if (!slice || slice.percentage < 5) return;
          const { x, y } = arc.tooltipPosition();
          ctx.fillStyle = getPieLabelTextColor(slice.color);
          ctx.fillText(`${Math.round(slice.percentage)}%`, x, y);
        });
        ctx.restore();
      }
    };

    function formatPieSummary(result) {
      const utils = window.pieChartUtils;
      const parts = selectedPieMeasure === 'count'
        ? [utils.formatPieMeasureValue('count', result.activityCount)]
        : [utils.formatPieMeasureValue(selectedPieMeasure, result.total), utils.formatPieMeasureValue('count', result.activityCount)];
      return parts.join(' · ');
    }

    function renderPieLegend(legend, slices) {
      legend.replaceChildren();
      slices.forEach(slice => {
        const item = document.createElement('li');
        item.className = 'flex min-w-0 items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2';

        const swatch = document.createElement('span');
        swatch.className = 'h-3.5 w-3.5 shrink-0 rounded-full';
        swatch.style.backgroundColor = slice.color;
        swatch.setAttribute('aria-hidden', 'true');

        const label = document.createElement('span');
        label.className = 'min-w-0 flex-1 truncate text-slate-200';
        label.textContent = slice.label;
        label.title = slice.label;

        const value = document.createElement('span');
        value.className = 'shrink-0 text-right tabular-nums text-xs text-slate-400';
        value.textContent = `${window.pieChartUtils.formatPieMeasureValue(selectedPieMeasure, slice.value)} · ${slice.percentage.toFixed(1)}%`;

        item.append(swatch, label, value);
        legend.appendChild(item);
      });
    }

    function destroyPieChart() {
      if (pieChartInstance) {
        pieChartInstance.destroy();
        pieChartInstance = null;
      }
    }

    function renderPieCharts() {
      const canvas = document.getElementById('pieChartsCanvas');
      const captureArea = document.getElementById('pieChartsCaptureArea');
      const emptyState = document.getElementById('pieChartsEmptyState');
      const summary = document.getElementById('pieChartsSummary');
      const legend = document.getElementById('pieChartsLegend');
      if (!canvas || !captureArea || !emptyState || !summary || !legend) return;

      const result = window.pieChartUtils.computePieSlices(
        typeof processedActivities !== 'undefined' ? processedActivities : [],
        {
          dimension: selectedPieDimension,
          measure: selectedPieMeasure,
          sport: selectedPieSport,
          colorScheme: selectedPieColorScheme
        }
      );
      currentPieResult = result;

      if (result.slices.length === 0) {
        destroyPieChart();
        legend.replaceChildren();
        summary.textContent = '';
        captureArea.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
      }

      emptyState.classList.add('hidden');
      captureArea.classList.remove('hidden');
      summary.textContent = formatPieSummary(result);
      renderPieLegend(legend, result.slices);
      canvas.setAttribute('aria-label', `Pie chart: ${result.slices
        .map(slice => `${slice.label} ${slice.percentage.toFixed(1)}%`)
        .join(', ')}`);

      destroyPieChart();
      pieChartInstance = new Chart(canvas, {
        type: 'pie',
        data: {
          labels: result.slices.map(slice => slice.label),
          datasets: [{
            data: result.slices.map(slice => slice.value),
            backgroundColor: result.slices.map(slice => slice.color),
            borderColor: '#020617',
            borderWidth: 2,
            hoverOffset: 14
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 16 },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: context => {
                  const slice = result.slices[context.dataIndex];
                  const share = `${slice.percentage.toFixed(1)}%`;
                  return selectedPieMeasure === 'count'
                    ? [`${window.pieChartUtils.formatPieMeasureValue('count', slice.activityCount)} · ${share}`]
                    : [
                      `${window.pieChartUtils.formatPieMeasureValue(selectedPieMeasure, slice.value)} · ${share}`,
                      window.pieChartUtils.formatPieMeasureValue('count', slice.activityCount)
                    ];
                }
              }
            }
          }
        },
        plugins: [piePercentageLabelPlugin]
      });
    }

    window.pieChartsDashboard = { render: renderPieCharts };
