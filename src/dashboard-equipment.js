    let selectedEquipmentFilter = 'All';
    let selectedEquipmentMetric = 'distance';
    let selectedEquipmentTimelineFilter = 'All';
    let selectedEquipmentTimelineMode = 'continuous'; // 'continuous' | 'activities'
    let equipmentTimelineChartInstance = null;
     let equipmentChartInstance = null;

    function wrapEquipmentValue(ctx, label, availableWidth) {
      if (availableWidth <= 0) return null;
      if (ctx.measureText(label).width <= availableWidth) return [label];
      const lines = [];
      let line = '';
      for (const word of label.split(' ')) {
        const joined = line ? `${line} ${word}` : word;
        if (ctx.measureText(joined).width <= availableWidth) {
          line = joined;
          continue;
        }
        if (line) lines.push(line);
        line = '';
        // Split a single unbreakable token only if both lines can still hold it.
        for (const char of word) {
          if (ctx.measureText(line + char).width > availableWidth) {
            if (!line) return null;
            lines.push(line);
            line = '';
          }
          line += char;
          if (lines.length >= 2) return null;
        }
        if (lines.length >= 2) return null;
      }
      if (line) lines.push(line);
      return lines.length <= 2 ? lines : null;
    }

    function renderEquipmentChart() {
      const canvas = document.getElementById('equipmentChart');
      const emptyState = document.getElementById('equipmentEmptyState');
      const canvasArea = document.getElementById('equipmentCanvasArea');
      const fallback = document.getElementById('equipmentValueFallback');
      const explanation = document.getElementById('equipmentPaceExplanation');
      if (!canvas) return;

      let sortedEntries;
      if (selectedEquipmentMetric === 'distance') {
        sortedEntries = window.equipmentUtils.aggregateEquipmentDistance(processedActivities, selectedEquipmentFilter);
      } else if (selectedEquipmentMetric === 'pace') {
        sortedEntries = window.equipmentUtils.aggregateEquipmentPace(processedActivities, selectedEquipmentFilter);
      } else if (selectedEquipmentMetric === 'count') {
        sortedEntries = window.equipmentUtils.aggregateEquipmentActivityCount(processedActivities, selectedEquipmentFilter);
      } else if (selectedEquipmentMetric === 'avgLength') {
        sortedEntries = window.equipmentUtils.aggregateEquipmentAvgLength(processedActivities, selectedEquipmentFilter);
      } else {
        sortedEntries = [];
      }

      if (equipmentChartInstance) {
        equipmentChartInstance.destroy();
        equipmentChartInstance = null;
      }

      if (fallback) {
        fallback.replaceChildren();
        fallback.classList.add('hidden');
      }
      if (explanation) explanation.classList.add('hidden');

      if (sortedEntries.length === 0) {
        canvas.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      canvas.classList.remove('hidden');
      if (emptyState) emptyState.classList.add('hidden');

      const isPace = selectedEquipmentMetric === 'pace';
      const metric = selectedEquipmentMetric;
      const paceRows = isPace
        ? window.equipmentUtils.buildEquipmentPaceDisplay(sortedEntries)
        : [];
      // Group only the mixed pace view; other metrics retain their original order.
      const rows = isPace && selectedEquipmentFilter === 'All'
        ? paceRows.filter(row => row.type === 'Shoes').concat(paceRows.filter(row => row.type === 'Bikes'))
        : paceRows;
      const labels = isPace ? rows.map(row => row.name) : sortedEntries.map(([name]) => name);
      const values = isPace
        ? rows.map(row => row.barValue)
        : sortedEntries.map(([, value]) => metric === 'count' ? value : Number(value.toFixed(2)));
      const displayValues = isPace
        ? rows.map(row => row.type === 'Bikes' ? formatSpeedLabel(row.speedKmh) : formatPaceLabel(row.paceMinPerKm))
        : values.map(value => metric === 'distance' ? `${value.toFixed(1)} km`
          : metric === 'count' ? `${value} activities` : `${value.toFixed(2)} km/act`);

      if (canvasArea) canvasArea.style.height = `${Math.max(540, labels.length * 56 + 70)}px`;
      if (explanation && isPace) {
        explanation.textContent = selectedEquipmentFilter === 'All'
          ? 'Shoes (purple) · Bikes (teal) — 100 % = fastest item of the same type; bars across types are not directly comparable.'
          : '100 % = fastest item of the same type (relative speed).';
        explanation.classList.remove('hidden');
      }

      function labelPadding(width) {
        // Leave room for the plot and its equipment names on small screens.
        const longest = Math.max(...displayValues.map(label => label.length * 7));
        return Math.min(longest + 20, Math.max(72, width * 0.4));
      }

      equipmentChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        plugins: [{
          id: 'equipmentValueLabels',
          afterDatasetsDraw(chart) {
            const { ctx } = chart;
            const unavailable = [];

            ctx.save();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '600 12px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            chart.getDatasetMeta(0).data.forEach((bar, index) => {
              // Follow the bar end when space permits; use the reserved lane for long bars.
              const x = Math.max(chart.chartArea.left, Math.min(bar.x + 8, chart.chartArea.right + 8));
              const lines = wrapEquipmentValue(ctx, displayValues[index], chart.width - x - 8);
              if (!lines) {
                unavailable.push(index);
                return;
              }
              lines.forEach((line, lineIndex) => {
                ctx.fillText(line, x, bar.y + (lineIndex - (lines.length - 1) / 2) * 15);
              });
            });

            ctx.restore();
            if (fallback) {
              fallback.replaceChildren();
              unavailable.forEach(index => {
                const row = document.createElement('p');
                row.textContent = `${labels[index]}: ${displayValues[index]}`;
                fallback.appendChild(row);
              });
              fallback.classList.toggle('hidden', unavailable.length === 0);
            }
          }
        }],
        data: {
          labels,
          datasets: [{
            label: metric === 'distance' ? 'Distance' :
                  metric === 'pace' ? 'Relative speed' :
                  metric === 'count' ? 'Activity Count' :
                  metric === 'avgLength' ? 'Avg Length' : '',
            data: values,
            borderRadius: 6,
            backgroundColor: labels.map(name =>
              window.equipmentUtils.getEquipmentType(name) === 'Shoes'
                ? '#8B5CF6'
                : '#14B8A6'
            )
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: labelPadding(canvasArea ? canvasArea.clientWidth : canvas.clientWidth) } },
          onResize(chart) {
            chart.options.layout.padding.right = labelPadding(chart.width);
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#CBD5E1',
              callbacks: {
                label: context => isPace ? displayValues[context.dataIndex]
                  : metric === 'distance' ? displayValues[context.dataIndex]
                    : `${context.raw}`
              }
            }
          },
          scales: {
            x: {
              ...(isPace ? { min: 0, max: 1, title: { display: true, text: 'Relative speed within equipment type (%)', color: '#94A3B8' } } : {}),
              grid: { color: '#1E293B' },
              ticks: {
                color: '#94A3B8',
                callback: value => metric === 'distance'
                  ? `${value} km`
                  : isPace ? `${Math.round(value * 100)}%`
                    : value
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                color: '#E2E8F0',
                autoSkip: false
              }
            }
          }
        }
      });
    }

    function setEquipmentFilter(filter) {
      selectedEquipmentFilter = filter;

      document.querySelectorAll('[id^="equipmentBtn"]').forEach(btn => {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
      });

      const activeButton = document.getElementById(`equipmentBtn${filter}`);
      if (activeButton) {
        activeButton.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
      }

      renderEquipmentChart();
    }

    function setEquipmentMetric(metric) {
      selectedEquipmentMetric = metric;

      document.querySelectorAll('[id^="equipmentMetric"]').forEach(btn => {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
      });

      const activeButton = document.getElementById(`equipmentMetric${metric.charAt(0).toUpperCase() + metric.slice(1)}`);
      if (activeButton) {
        activeButton.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
      }

      renderEquipmentChart();
    }

    function setEquipmentTimelineFilter(filter) {
      selectedEquipmentTimelineFilter = filter;

      document.querySelectorAll('[id^="equipmentTimelineBtn"]').forEach(btn => {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
      });

      const activeButton = document.getElementById(`equipmentTimelineBtn${filter}`);
      if (activeButton) {
        activeButton.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
      }

      renderEquipmentTimeline();
    }

    function setEquipmentTimelineMode(mode) {
      selectedEquipmentTimelineMode = mode;

      const btnContinuous = document.getElementById('equipmentTimelineModeContinuous');
      const btnActivities = document.getElementById('equipmentTimelineModeActivities');
      const activeClass = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
      const inactiveClass = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';

      if (btnContinuous) btnContinuous.className = mode === 'continuous' ? activeClass : inactiveClass;
      if (btnActivities) btnActivities.className = mode === 'activities' ? activeClass : inactiveClass;

      const subtitle = document.getElementById('equipmentTimelineSubtitle');
      if (subtitle) {
        subtitle.textContent = mode === 'continuous'
          ? 'Active period per piece of equipment, ordered by most recently used'
          : 'Individual activities per piece of equipment, ordered by most recently used';
      }

      renderEquipmentTimeline();
    }

    // ─── shared helpers ────────────────────────────────────────────────────────

    function _timelineSetCanvasHeight(canvas, wrapper, rowCount) {
      const rowHeight = 52;
      const h = Math.max(320, rowCount * rowHeight + 80);
      canvas.style.height = h + 'px';
      if (wrapper) wrapper.style.height = h + 'px';
    }

    function _timelineDateLabel(d) {
      return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    }

    function _timelineFullDateLabel(d) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // ─── CONTINUOUS mode renderer ──────────────────────────────────────────────

    function _renderTimelineContinuous(canvas, entries) {
      const globalMin = Math.min(...entries.map(e => e.firstDate.getTime()));
      const globalMax = Math.max(...entries.map(e => e.lastDate.getTime()));
      const labels = entries.map(e => e.name);

      const spacerData = entries.map(e => e.firstDate.getTime() - globalMin);
      const durationData = entries.map(e => Math.max(
        e.lastDate.getTime() - e.firstDate.getTime(),
        1000 * 60 * 60 * 24   // min 1 day so point-in-time is visible
      ));
      const barColors = entries.map(e => e.type === 'Shoes' ? '#8B5CF6' : '#14B8A6');
      const barBorderColors = entries.map(e => e.type === 'Shoes' ? '#A78BFA' : '#2DD4BF');

      const ganttLabelPlugin = {
        id: 'ganttLabelsContinuous',
        afterDatasetsDraw(chart) {
          const { ctx } = chart;
          const barMeta = chart.getDatasetMeta(1);
          ctx.save();
          ctx.font = '500 11px sans-serif';
          ctx.textBaseline = 'middle';

          barMeta.data.forEach((bar, i) => {
            const entry = entries[i];
            const bw = bar.width;
            const barLeft = bar.x - bw;
            const centerX = bar.x - bw / 2;
            const barY = bar.y;

            ctx.fillStyle = '#64748B';
            ctx.textAlign = 'right';
            ctx.fillText(_timelineDateLabel(entry.firstDate), barLeft - 4, barY);

            if (bw > 80) {
              ctx.fillStyle = '#FFFFFF';
              ctx.textAlign = 'center';
              const kmLabel = `${Math.round(entry.totalKm)} km · to ${_timelineDateLabel(entry.lastDate)}`;
              ctx.fillText(kmLabel, centerX, barY);
            } else if (bw > 38) {
              ctx.fillStyle = '#FFFFFF';
              ctx.textAlign = 'center';
              ctx.fillText(`${Math.round(entry.totalKm)} km`, centerX, barY);
            }
          });
          ctx.restore();
        }
      };

      return new Chart(canvas.getContext('2d'), {
        type: 'bar',
        plugins: [ganttLabelPlugin],
        data: {
          labels,
          datasets: [
            { label: 'spacer', data: spacerData, backgroundColor: 'transparent', borderWidth: 0, borderSkipped: false },
            { label: 'Active period', data: durationData, backgroundColor: barColors, borderColor: barBorderColors, borderWidth: 1, borderSkipped: false, borderRadius: 4 }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { left: 0, right: 24 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#CBD5E1',
              callbacks: {
                title: ctx => ctx[0] ? labels[ctx[0].dataIndex] : '',
                label: ctx => {
                  if (ctx.datasetIndex !== 1) return null;
                  const entry = entries[ctx.dataIndex];
                  return [
                    `From: ${_timelineFullDateLabel(entry.firstDate)}`,
                    `To:   ${_timelineFullDateLabel(entry.lastDate)}`,
                    `Distance: ${entry.totalKm.toFixed(1)} km`,
                    `Activities: ${entry.activityCount}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              type: 'linear',
              min: 0,
              max: globalMax - globalMin,
              grid: { color: '#1E293B' },
              ticks: {
                color: '#94A3B8',
                maxTicksLimit: 8,
                callback: value => _timelineDateLabel(new Date(globalMin + value))
              }
            },
            y: {
              stacked: true,
              grid: { display: false },
              ticks: { color: '#E2E8F0', autoSkip: false, font: { size: 12 } }
            }
          }
        }
      });
    }

    // ─── ACTIVITIES mode renderer ──────────────────────────────────────────────
    //
    // Strategy: use a scatter chart with custom rendering.
    //   X axis = real timestamp (ms).
    //   Y axis = equipment row index (0 = top = most recently used).
    //   Each activity is a point at (date.getTime(), rowIndex).
    //   We draw it as a vertical pill/rectangle via a custom plugin so we can
    //   control width (proportional to distance) and height (fixed, fits in row).

    function _renderTimelineActivities(canvas, rows) {
      const allDates = rows.flatMap(r => r.activities.map(a => a.date.getTime()));
      const globalMin = Math.min(...allDates);
      const globalMax = Math.max(...allDates);

      // Pad the axis slightly so bars at edges don't clip
      const span = Math.max(globalMax - globalMin, 1000 * 60 * 60 * 24 * 7);
      const xMin = globalMin - span * 0.01;
      const xMax = globalMax + span * 0.02;

      // Colour palette per equipment row
      const rowColors = rows.map(r => r.type === 'Shoes' ? '#8B5CF6' : '#14B8A6');
      const rowBorderColors = rows.map(r => r.type === 'Shoes' ? '#A78BFA' : '#2DD4BF');

      // Distance normalisation for bar width:
      //   largest activity in dataset gets a reference pixel-equivalent width.
      //   We express widths as fractions of the time span so Chart.js scale handles it.
      const allDistances = rows.flatMap(r => r.activities.map(a => a.distance));
      const maxDist = Math.max(...allDistances, 1);
      // Reference width: largest activity occupies ~2.5% of the time axis
      const refWidthMs = span * 0.025;
      const minWidthMs = span * 0.004; // minimum so tiny activities are still visible

      // Y-axis category labels — row 0 (most recently used) at top
      const yLabels = rows.map(r => r.name);

      // Build one scatter dataset per equipment row so colours work simply.
      // Use the equipment name string as the Y value so Chart.js maps it onto
      // the category axis — this gives the same centering as the continuous chart.
      const datasets = rows.map((row, rowIdx) => ({
        label: row.name,
        data: row.activities.map(act => ({
          x: act.date.getTime(),
          y: row.name,
          distance: act.distance,
          actName: act.name,
          sport: act.sport,
          widthMs: Math.max(minWidthMs, (act.distance / maxDist) * refWidthMs)
        })),
        backgroundColor: rowColors[rowIdx] + 'CC',   // slight transparency
        borderColor: rowBorderColors[rowIdx],
        borderWidth: 1,
        pointRadius: 0,   // we draw custom rects, hide default points
        showLine: false
      }));

      // Custom plugin that draws the activity bars.
      // The Y scale is a category axis, so getPixelForValue(equipmentName)
      // returns the exact vertical centre of that row's band — identical to
      // how the continuous Gantt chart centres its bars.
      const activityBarsPlugin = {
        id: 'activityBars',
        afterDatasetsDraw(chart) {
          const { ctx, scales: { x, y } } = chart;
          // Category band height = total axis height / number of categories
          const barH = Math.max(10, (y.height / rows.length) * 0.55);

          ctx.save();
          chart.data.datasets.forEach((ds, dsIdx) => {
            const meta = chart.getDatasetMeta(dsIdx);
            if (meta.hidden) return;

            ds.data.forEach((point) => {
              const cx = x.getPixelForValue(point.x);
              const cy = y.getPixelForValue(point.y);   // centered in category band
              const halfW = Math.max(2, x.getPixelForValue(point.x + point.widthMs) - cx);
              const rx = cx - halfW / 2;
              const ry = cy - barH / 2;

              ctx.fillStyle = rowColors[dsIdx] + 'CC';
              ctx.strokeStyle = rowBorderColors[dsIdx];
              ctx.lineWidth = 1;

              // Rounded rect
              const r = Math.min(3, halfW / 2, barH / 2);
              ctx.beginPath();
              ctx.moveTo(rx + r, ry);
              ctx.lineTo(rx + halfW - r, ry);
              ctx.quadraticCurveTo(rx + halfW, ry, rx + halfW, ry + r);
              ctx.lineTo(rx + halfW, ry + barH - r);
              ctx.quadraticCurveTo(rx + halfW, ry + barH, rx + halfW - r, ry + barH);
              ctx.lineTo(rx + r, ry + barH);
              ctx.quadraticCurveTo(rx, ry + barH, rx, ry + barH - r);
              ctx.lineTo(rx, ry + r);
              ctx.quadraticCurveTo(rx, ry, rx + r, ry);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            });
          });
          ctx.restore();
        }
      };

      return new Chart(canvas.getContext('2d'), {
        type: 'scatter',
        plugins: [activityBarsPlugin],
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { left: 0, right: 16 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0F172A',
              titleColor: '#F8FAFC',
              bodyColor: '#CBD5E1',
              callbacks: {
                title: ctx => {
                  if (!ctx[0]) return '';
                  const ds = datasets[ctx[0].datasetIndex];
                  return ds ? ds.label : '';
                },
                label: ctx => {
                  const point = ctx.raw;
                  if (!point) return '';
                  return [
                    point.actName ? `Activity: ${point.actName}` : null,
                    `Date: ${_timelineFullDateLabel(new Date(point.x))}`,
                    `Distance: ${point.distance.toFixed(1)} km`,
                    point.sport ? `Sport: ${point.sport}` : null
                  ].filter(Boolean);
                }
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              min: xMin,
              max: xMax,
              grid: { color: '#1E293B' },
              ticks: {
                color: '#94A3B8',
                maxTicksLimit: 8,
                callback: value => _timelineDateLabel(new Date(value))
              }
            },
            y: {
              type: 'category',
              labels: yLabels,
              reverse: false,
              offset: true,
              grid: { display: false },
              ticks: {
                color: '#E2E8F0',
                autoSkip: false,
                font: { size: 12 }
              }
            }
          }
        }
      });
    }

    // ─── main entry point ──────────────────────────────────────────────────────

    function renderEquipmentTimeline() {
      const canvas = document.getElementById('equipmentTimelineChart');
      const wrapper = document.getElementById('equipmentTimelineWrapper');
      const emptyState = document.getElementById('equipmentTimelineEmptyState');
      if (!canvas) return;

      if (equipmentTimelineChartInstance) {
        equipmentTimelineChartInstance.destroy();
        equipmentTimelineChartInstance = null;
      }

      if (selectedEquipmentTimelineMode === 'activities') {
        const rows = window.equipmentUtils.getEquipmentTimelineActivities(
          processedActivities,
          selectedEquipmentTimelineFilter
        );

        if (rows.length === 0 || rows.every(r => r.activities.length === 0)) {
          canvas.classList.add('hidden');
          if (emptyState) emptyState.classList.remove('hidden');
          return;
        }
        canvas.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        _timelineSetCanvasHeight(canvas, wrapper, rows.length);
        equipmentTimelineChartInstance = _renderTimelineActivities(canvas, rows);

      } else {
        // continuous mode
        const entries = window.equipmentUtils.aggregateEquipmentTimeline(
          processedActivities,
          selectedEquipmentTimelineFilter
        );

        if (entries.length === 0) {
          canvas.classList.add('hidden');
          if (emptyState) emptyState.classList.remove('hidden');
          return;
        }
        canvas.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        _timelineSetCanvasHeight(canvas, wrapper, entries.length);
        equipmentTimelineChartInstance = _renderTimelineContinuous(canvas, entries);
      }
    }
