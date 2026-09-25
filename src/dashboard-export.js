    // --- Branded visualization export (specs/008-enhanced-visualization-export) ---

    let exportRequestState = 'idle'; // idle | checking | blocked-no-data | capturing | previewing | capture-failed
    let exportToastTimeoutId = null;
    let lastExportedImage = null; // { dataUrl, target }
    let exportAssetsPromise = null;

    const EXPORT_CAPTURE_TARGET_IDS = {
      totalDistance: 'totalDistanceChartWrapper',
      paceMetrics: 'paceMetricsChartWrapper',
      equipment: 'equipmentChartWrapper',
      equipmentTimeline: 'equipmentTimelineWrapper',
      personalBests: 'pbColumnsContainer',
      heatmap: 'heatmapMapContainer',
      distributions: 'distributionsChartWrapper',
      workoutTime: 'workoutTimeChartWrapper',
      trainingCalendar: 'trainingCalendarYears'
    };

    const EXPORT_DOMAIN = window.exportUtils.getExportBrandConfig().domain;

    function showExportToast(message) {
      const toast = document.getElementById('exportToast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.remove('hidden');
      if (exportToastTimeoutId) clearTimeout(exportToastTimeoutId);
      exportToastTimeoutId = setTimeout(() => toast.classList.add('hidden'), 4000);
    }

    function isEmptyStateHidden(elementId) {
      const el = document.getElementById(elementId);
      return el ? el.classList.contains('hidden') : false;
    }

    function getExportableFlags() {
      return {
        totalDistance: !!chartInstance,
        paceMetrics: isEmptyStateHidden('paceMetricsEmptyState'),
        equipment: isEmptyStateHidden('equipmentEmptyState'),
        equipmentTimeline: isEmptyStateHidden('equipmentTimelineEmptyState'),
        personalBests: isEmptyStateHidden('pbEmptyState'),
        heatmap: isEmptyStateHidden('heatmapEmptyState'),
        distributions: isEmptyStateHidden('distributionsEmptyState'),
        workoutTime: isEmptyStateHidden('workoutTimeEmptyState'),
        trainingCalendar: typeof processedActivities !== 'undefined' && processedActivities.length > 0
      };
    }

    function getActiveButtonText(ids) {
      const button = ids.map(id => document.getElementById(id)).find(el => el && el.classList.contains('bg-indigo-600'));
      return button ? button.textContent.trim() : null;
    }

    function getControlSnapshot(ids) {
      return ids
        .map(id => document.getElementById(id))
        .filter(button => button && !button.disabled)
        .map(button => ({
          label: button.textContent.trim(),
          selected: button.classList.contains('bg-indigo-600') || button.getAttribute('aria-selected') === 'true'
        }));
    }

    function getControlGroup(label, ids) {
      return { label, controls: getControlSnapshot(ids) };
    }

    function getAvailableControlContext(tabName) {
      const viewIds = [
        'vizTabTotalDistance',
        'vizTabPaceMetrics',
        'vizTabEquipment',
        'vizTabEquipmentTimeline',
        'vizTabPersonalBests',
        'vizTabHeatmap',
        'vizTabDistributions',
        'vizTabWorkoutTime',
        'vizTabTrainingCalendar'
      ];
      const groups = [getControlGroup('Views', viewIds)];
      const tabGroups = {
        totalDistance: [
          getControlGroup('Aggregation', ['aggBtnDaily', 'aggBtnWeekly', 'aggBtnMonthly', 'aggBtnYearly']),
          getControlGroup('Sport', ['sportBtnAll', 'sportBtnRun', 'sportBtnBike', 'sportBtnSwim']),
          getControlGroup('Timeframe', Array.from(document.querySelectorAll('#timeframeSelector button')).map(button => button.id))
        ],
        paceMetrics: [
          getControlGroup('Sport', ['paceMetricsSportBtnRun', 'paceMetricsSportBtnBike', 'paceMetricsSportBtnSwim']),
          getControlGroup('Metric', ['paceMetricsMetricBtnheartRate', 'paceMetricsMetricBtncadence', 'paceMetricsMetricBtnelevationGain', 'paceMetricsMetricBtndistance'])
        ],
        equipment: [
          getControlGroup('Metric', ['equipmentMetricDistance', 'equipmentMetricPace', 'equipmentMetricCount', 'equipmentMetricAvgLength']),
          getControlGroup('Equipment', ['equipmentBtnAll', 'equipmentBtnShoes', 'equipmentBtnBikes'])
        ],
        equipmentTimeline: [
          getControlGroup('Mode', ['equipmentTimelineModeContinuous', 'equipmentTimelineModeActivities']),
          getControlGroup('Equipment', ['equipmentTimelineBtnAll', 'equipmentTimelineBtnShoes', 'equipmentTimelineBtnBikes'])
        ],
        personalBests: [],
        heatmap: [
          getControlGroup('Sport', ['heatmapSportBtnAll', 'heatmapSportBtnRun', 'heatmapSportBtnBike', 'heatmapSportBtnSwim'])
        ],
        workoutTime: [
          getControlGroup('Granularity', ['workoutTimeGranularityBtnDay', 'workoutTimeGranularityBtnWeek', 'workoutTimeGranularityBtnMonth', 'workoutTimeGranularityBtnYear']),
          getControlGroup('Sport', ['workoutTimeSportBtnAll', 'workoutTimeSportBtnRun', 'workoutTimeSportBtnBike', 'workoutTimeSportBtnSwim'])
        ],
        trainingCalendar: [
          getControlGroup('Palette', ['trainingCalendarPaletteGreen', 'trainingCalendarPaletteBlue', 'trainingCalendarPaletteFire']),
          getControlGroup('Sport', Array.from(document.querySelectorAll('#trainingCalendarSportFilters button')).map(button => button.id))
        ]
      };
      return window.exportUtils.summarizeAvailableControls(groups.concat(tabGroups[tabName] || []));
    }

    function getExportContext(tabName) {
      const contexts = {
        totalDistance: [
          { label: 'Sport', value: getActiveButtonText(['sportBtnAll', 'sportBtnRun', 'sportBtnBike', 'sportBtnSwim']) },
          { label: 'Timeframe', value: getActiveButtonText(Array.from(document.querySelectorAll('#timeframeSelector button')).map(button => button.id)) }
        ],
        paceMetrics: [
          { label: 'Sport', value: getActiveButtonText(['paceMetricsSportBtnRun', 'paceMetricsSportBtnBike', 'paceMetricsSportBtnSwim']) },
          { label: 'Metric', value: getActiveButtonText(['paceMetricsMetricBtnheartRate', 'paceMetricsMetricBtncadence', 'paceMetricsMetricBtnelevationGain', 'paceMetricsMetricBtndistance']) },
          { label: 'Date range', value: document.getElementById('scatterRangeLabel')?.textContent.trim() }
        ],
        equipment: [
          { label: 'Metric', value: getActiveButtonText(['equipmentMetricDistance', 'equipmentMetricPace', 'equipmentMetricCount', 'equipmentMetricAvgLength']) },
          { label: 'Equipment', value: getActiveButtonText(['equipmentBtnAll', 'equipmentBtnShoes', 'equipmentBtnBikes']) }
        ],
        equipmentTimeline: [
          { label: 'Mode', value: getActiveButtonText(['equipmentTimelineModeContinuous', 'equipmentTimelineModeActivities']) },
          { label: 'Equipment', value: getActiveButtonText(['equipmentTimelineBtnAll', 'equipmentTimelineBtnShoes', 'equipmentTimelineBtnBikes']) }
        ],
        personalBests: [],
        heatmap: [
          { label: 'Sport', value: getActiveButtonText(['heatmapSportBtnAll', 'heatmapSportBtnRun', 'heatmapSportBtnBike', 'heatmapSportBtnSwim']) }
        ],
        workoutTime: [
          { label: 'Granularity', value: getActiveButtonText(['workoutTimeGranularityBtnDay', 'workoutTimeGranularityBtnWeek', 'workoutTimeGranularityBtnMonth', 'workoutTimeGranularityBtnYear']) },
          { label: 'Sport', value: getActiveButtonText(['workoutTimeSportBtnAll', 'workoutTimeSportBtnRun', 'workoutTimeSportBtnBike', 'workoutTimeSportBtnSwim']) },
          { label: 'Date range', value: document.getElementById('workoutTimeRangeLabel')?.textContent.trim() }
        ],
        trainingCalendar: [
          { label: 'Palette', value: getActiveButtonText(['trainingCalendarPaletteGreen', 'trainingCalendarPaletteBlue', 'trainingCalendarPaletteFire']) },
          { label: 'Sport', value: getActiveButtonText(Array.from(document.querySelectorAll('#trainingCalendarSportFilters button')).map(button => button.id)) }
        ]
      };
      return window.exportUtils.summarizeFilters(contexts[tabName] || []);
    }

    function getTabExportTarget(tabName) {
      const targetId = EXPORT_CAPTURE_TARGET_IDS[tabName];
      const targetEl = targetId && document.getElementById(targetId);
      const flags = getExportableFlags();
      if (!targetEl || !window.exportUtils.hasExportableContent(tabName, flags)) return null;

      return window.exportUtils.createExportTarget({
        kind: 'tab',
        key: tabName,
        title: window.exportUtils.getTabDisplayTitle(tabName),
        targetElementId: targetId,
        hasData: flags[tabName],
        filters: getExportContext(tabName),
        availableControls: getAvailableControlContext(tabName),
        legend: window.exportUtils.getExportLegend(tabName)
      });
    }

    function loadExportAssets() {
      if (exportAssetsPromise) return exportAssetsPromise;
      const paths = window.exportUtils.getExportAssetPaths();
      exportAssetsPromise = Promise.all(Object.entries(paths).map(([name, path]) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve([name, image]);
        image.onerror = () => reject(new Error(`Could not load export asset: ${path}`));
        image.src = path;
      }))).then(entries => Object.fromEntries(entries));
      return exportAssetsPromise;
    }

    function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
      const words = String(text || '').split(/\s+/).filter(Boolean);
      const lines = [];
      let line = '';
      words.forEach(word => {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      });
      if (line) lines.push(line);
      const visibleLines = lines.slice(0, maxLines);
      visibleLines.forEach((entry, index) => ctx.fillText(entry, x, y + index * lineHeight));
      return {
        lineCount: visibleLines.length,
        bottom: y + visibleLines.length * lineHeight
      };
    }

    function drawAvailableControls(ctx, groups, x, y, maxWidth, maxY = Number.POSITIVE_INFINITY) {
      const pillHeight = 28;
      const rowPaddingBottom = 14;
      const gap = 10;
      const groupGap = 18;
      ctx.font = '600 16px system-ui, -apple-system, "Segoe UI", sans-serif';
      const entries = [];

      groups.forEach(group => {
        entries.push({ label: group.label, isGroup: true });
        group.controls.forEach(control => entries.push({ ...control, isGroup: false }));
      });

      const widths = entries.map(entry => entry.isGroup
        ? ctx.measureText(entry.label).width + groupGap
        : ctx.measureText(entry.label).width + 30);
      const rowLayout = window.exportUtils.computeFilterRowLayout({
        widths,
        availableWidth: maxWidth,
        rowHeight: pillHeight,
        rowPaddingBottom,
        gap
      });
      const visibleRows = rowLayout.rows.filter(row => y + row.bottom <= maxY);
      let rowIndex = 0;
      let cursorX = x;
      entries.forEach((entry, index) => {
        const row = rowLayout.rows[rowIndex];
        if (!row || !visibleRows.includes(row)) return;
        const entryWidth = widths[index];
        if (cursorX !== x && cursorX + entryWidth > x + maxWidth) {
          rowIndex += 1;
          cursorX = x;
        }
        const activeRow = rowLayout.rows[rowIndex];
        if (!activeRow || !visibleRows.includes(activeRow)) return;
        if (entry.isGroup) {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(entry.label, cursorX, y + activeRow.start + pillHeight - 5);
        } else {
          const pillWidth = entryWidth - 0;
          const pillY = y + activeRow.start;
          ctx.fillStyle = entry.selected ? '#4f46e5' : '#1e293b';
          ctx.fillRect(cursorX, pillY, pillWidth, pillHeight);
          ctx.fillStyle = entry.selected ? '#ffffff' : '#cbd5e1';
          ctx.fillText(entry.label, cursorX + 15, pillY + pillHeight - 7);
        }
        cursorX += entryWidth + gap;
      });
      return y + (visibleRows.length ? visibleRows[visibleRows.length - 1].bottom : 0);
    }

    function drawExportComposition(captured, target, assets) {
      const targetSize = 1080;
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetSize;
      finalCanvas.height = targetSize;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not create export canvas');

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, targetSize, targetSize);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetSize, 190);

      const headerLogoBox = { x: 56, y: 38, width: 110, height: 66 };
      const headerLogoFit = window.exportUtils.computeContainFit(
        assets.logo.naturalWidth,
        assets.logo.naturalHeight,
        headerLogoBox.width,
        headerLogoBox.height
      );
      ctx.drawImage(
        assets.logo,
        headerLogoBox.x + headerLogoFit.offsetX,
        headerLogoBox.y + headerLogoFit.offsetY,
        headerLogoFit.drawWidth,
        headerLogoFit.drawHeight
      );
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '700 38px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(target.title, 194, 68);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 24px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText('Shareable visualization', 194, 108);
      ctx.font = '600 20px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(EXPORT_DOMAIN, 194, 145);
      ctx.drawImage(assets.qrCode, 930, 28, 120, 120);

      const contentWidth = target.contentFit === 'pb-tight' ? 1032 : 960;
      const contentHeight = target.contentFit === 'pb-tight' ? 560 : 500;
      const scale = Math.min(contentWidth / captured.width, contentHeight / captured.height);
      const drawWidth = captured.width * scale;
      const drawHeight = captured.height * scale;
      const contentX = target.kind === 'pb-tile' ? 24 : 60;
      const contentY = 205;
      ctx.drawImage(captured, contentX + (contentWidth - drawWidth) / 2, contentY + (contentHeight - drawHeight) / 2, drawWidth, drawHeight);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 24px system-ui, -apple-system, "Segoe UI", sans-serif';
      const filterText = target.filters.map(filter => `${filter.label}: ${filter.value}`).join('  |  ');
      const filterHeight = filterText ? 64 : 0;
      const controlsHeight = Math.max(42, (target.availableControls || []).length * 56);
      const legendHeight = target.legend ? 42 : 0;
      const metadataLayout = window.exportUtils.computeExportMetadataLayout({
        startY: 790,
        filterHeight,
        controlsHeight,
        legendHeight,
        footerStart: 1070,
        spacing: 18
      });
      if (filterText) drawWrappedText(ctx, filterText, 60, metadataLayout.filters.y, 960, 32, 2);
      const controlsBottom = drawAvailableControls(
        ctx,
        target.availableControls || [],
        60,
        metadataLayout.controls.y,
        960,
        metadataLayout.legend.y - 18
      );
      if (target.legend) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 22px system-ui, -apple-system, "Segoe UI", sans-serif';
        const legendY = Math.max(metadataLayout.legend.y, controlsBottom + 12);
        ctx.fillText(target.legend.title, 60, legendY);
        target.legend.items.forEach((item, index) => {
          const x = 170 + index * 180;
          ctx.fillStyle = item.color;
          ctx.fillRect(x, legendY - 18, 18, 18);
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '500 22px system-ui, -apple-system, "Segoe UI", sans-serif';
          ctx.fillText(item.label, x + 22, legendY);
        });
      }

      return finalCanvas.toDataURL('image/png');
    }

    // Chart.js exposes no consistent cross-version "isAnimating" API, so a short settle
    // delay after the next paint is used as a pragmatic guard against capturing a
    // mid-animation frame (spec.md Edge Case: chart still loading/animating at capture).
    function waitForChartRenderSettle() {
      return new Promise(resolve => {
        requestAnimationFrame(() => setTimeout(resolve, 350));
      });
    }

    function showExportPreviewModal(dataUrl) {
      const modal = document.getElementById('exportPreviewModal');
      const img = document.getElementById('exportPreviewImage');
      const errorEl = document.getElementById('exportPreviewError');
      if (!modal || !img) return;
      img.src = dataUrl;
      if (errorEl) errorEl.classList.add('hidden');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeExportPreviewModal() {
      const modal = document.getElementById('exportPreviewModal');
      const img = document.getElementById('exportPreviewImage');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      if (img) img.src = '';
      lastExportedImage = null;
      exportRequestState = 'idle';
    }

    function downloadExportedImage() {
      if (!lastExportedImage) return;
      const filename = window.exportUtils.generateExportFilename(lastExportedImage.target, new Date())
        || 'trianalytica-export.png';
      const link = document.createElement('a');
      link.href = lastExportedImage.dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    async function exportVisualizationTarget(target) {
      if (exportRequestState !== 'idle') return;

      exportRequestState = 'checking';
      if (!target || !target.hasData) {
        exportRequestState = 'idle';
        showExportToast('Nothing to export for this selection yet.');
        return;
      }

      const targetEl = document.getElementById(target.targetElementId);
      if (!targetEl) {
        exportRequestState = 'idle';
        showExportToast('Nothing to export for this selection yet.');
        return;
      }

      exportRequestState = 'capturing';
      const tooltip = document.getElementById('trainingCalendarDayTooltip');
      const tooltipWasVisible = tooltip && !tooltip.classList.contains('hidden');
      try {
        if (tooltipWasVisible) tooltip.classList.add('hidden');
        await waitForChartRenderSettle();
        const assets = await loadExportAssets();

        const captured = await html2canvas(targetEl, {
          backgroundColor: '#020617',
          useCORS: true,
          logging: false
        });
        const dataUrl = drawExportComposition(captured, target, assets);
        lastExportedImage = { dataUrl, target };

        exportRequestState = 'previewing';
        showExportPreviewModal(dataUrl);
      } catch (error) {
        console.error('Export failed', error);
        exportRequestState = 'idle';
        showExportToast(error.message || 'Could not export this visualization. Please try again.');
      } finally {
        if (tooltip && tooltipWasVisible) tooltip.classList.remove('hidden');
      }
    }

    async function exportVisualizationTab(tabName) {
      const target = getTabExportTarget(tabName);
      await exportVisualizationTarget(target);
    }

    function exportActivePbDetail() {
      const model = activePbDetailModel;
      const hasData = !!(model && Array.isArray(model.records) && model.records.length > 0);
      const target = hasData ? window.exportUtils.createExportTarget({
        kind: 'pb-tile',
        key: model.exportKey || model.title,
        title: model.title,
        targetElementId: 'pbDetailCaptureTarget',
        hasData: true,
        filters: [{ label: 'Metric', value: model.axisLabel }],
        availableControls: getAvailableControlContext('personalBests'),
        metricLabel: model.axisLabel,
        detailKey: model.exportKey || model.title
      }) : null;
      return exportVisualizationTarget(target);
    }
