    // --- Branded visualization export (specs/008-enhanced-visualization-export) ---

    let exportRequestState = 'idle'; // idle | checking | blocked-no-data | capturing | previewing | capture-failed
    let exportToastTimeoutId = null;
    let lastExportedImage = null; // { dataUrl, target }
    let exportAssetsPromise = null;
    let exportDownloadAttempt = null;

    const EXPORT_CAPTURE_TARGET_IDS = {
      totalDistance: 'totalDistanceChartWrapper',
      paceMetrics: 'paceMetricsChartWrapper',
      equipment: 'equipmentChartWrapper',
      equipmentTimeline: 'equipmentTimelineWrapper',
      personalBests: 'pbColumnsContainer',
      heatmap: 'heatmapMapContainer',
      distributions: 'distributionsChartWrapper',
      workoutTime: 'workoutTimeChartWrapper',
      trainingCalendar: 'trainingCalendarYears',
      wordcloud: 'wordcloudCanvas',
      pieCharts: 'pieChartsCaptureArea',
      lifetimeStatistics: 'lifetimeStatisticsExportArea',
      mediaGallery: 'mediaGalleryExportArea'
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
        trainingCalendar: typeof processedActivities !== 'undefined' && processedActivities.length > 0,
        wordcloud: !!(window.wordcloudDashboard && window.wordcloudDashboard.canRequestExport()),
        pieCharts: isEmptyStateHidden('pieChartsEmptyState'),
        lifetimeStatistics: isEmptyStateHidden('lifetimeStatisticsEmptyState'),
        mediaGallery: !!(document.getElementById('mediaGalleryExportArea') &&
          document.getElementById('mediaGalleryExportArea').childElementCount > 0)
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

    function getSelectControlGroup(label, id) {
      const select = document.getElementById(id);
      const selectedOption = select?.selectedOptions?.[0];
      const selectedLabel = selectedOption?.textContent.trim();
      return { label, controls: selectedLabel ? [{ label: selectedLabel, selected: true }] : [] };
    }

    function getCheckboxControlGroup(label, id) {
      const checkbox = document.getElementById(id);
      if (!checkbox) return { label, controls: [] };
      return { label, controls: [{ label: checkbox.checked ? 'Included' : 'Excluded', selected: checkbox.checked === true }] };
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
        'vizTabTrainingCalendar',
        'vizTabWordcloud',
        'vizTabPieCharts',
        'vizTabLifetimeStatistics',
        'vizTabMediaGallery'
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
          getControlGroup('Sport', ['heatmapSportBtnAll', 'heatmapSportBtnRun', 'heatmapSportBtnBike', 'heatmapSportBtnSwim']),
          getSelectControlGroup('Color scheme', 'heatmapColorScheme')
        ],
        workoutTime: [
          getControlGroup('Granularity', ['workoutTimeGranularityBtnDay', 'workoutTimeGranularityBtnWeek', 'workoutTimeGranularityBtnMonth', 'workoutTimeGranularityBtnYear']),
          getControlGroup('Sport', ['workoutTimeSportBtnAll', 'workoutTimeSportBtnRun', 'workoutTimeSportBtnBike', 'workoutTimeSportBtnSwim'])
        ],
        trainingCalendar: [
          getControlGroup('Palette', ['trainingCalendarPaletteGreen', 'trainingCalendarPaletteBlue', 'trainingCalendarPaletteFire']),
          getControlGroup('Sport', Array.from(document.querySelectorAll('#trainingCalendarSportFilters button')).map(button => button.id))
        ],
        wordcloud: [],
        pieCharts: [
          getControlGroup('Group by', ['pieDimensionBtnSport', 'pieDimensionBtnDuration', 'pieDimensionBtnPace', 'pieDimensionBtnEquipment', 'pieDimensionBtnLength', 'pieDimensionBtnPower']),
          getControlGroup('Slice size', ['pieMeasureBtnCount', 'pieMeasureBtnTime', 'pieMeasureBtnDistance']),
          getControlGroup('Sport', ['pieSportBtnAll', 'pieSportBtnRun', 'pieSportBtnBike', 'pieSportBtnSwim'])
        ],
        lifetimeStatistics: [],
        mediaGallery: [
          getSelectControlGroup('Year', 'mediaGalleryYearFilter'),
          getSelectControlGroup('Sport', 'mediaGallerySportFilter'),
          getSelectControlGroup('Activity', 'mediaGalleryActivityFilter'),
          getCheckboxControlGroup('Include routes', 'mediaGalleryIncludeRoutes')
        ]
      };
      return window.exportUtils.summarizeAvailableControls(groups.concat(tabGroups[tabName] || []));
    }

    function getExportContext(tabName) {
      const contexts = {
        totalDistance: [
          { label: 'Sport', value: getActiveButtonText(['sportBtnAll', 'sportBtnRun', 'sportBtnBike', 'sportBtnSwim']) },
          { label: 'Aggregation', value: getActiveButtonText(['aggBtnDaily', 'aggBtnWeekly', 'aggBtnMonthly', 'aggBtnYearly']) },
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
          { label: 'Sport', value: getActiveButtonText(['heatmapSportBtnAll', 'heatmapSportBtnRun', 'heatmapSportBtnBike', 'heatmapSportBtnSwim']) },
          { label: 'Color scheme', value: document.getElementById('heatmapColorScheme')?.selectedOptions[0]?.textContent.trim() }
        ],
        workoutTime: [
          { label: 'Granularity', value: getActiveButtonText(['workoutTimeGranularityBtnDay', 'workoutTimeGranularityBtnWeek', 'workoutTimeGranularityBtnMonth', 'workoutTimeGranularityBtnYear']) },
          { label: 'Sport', value: getActiveButtonText(['workoutTimeSportBtnAll', 'workoutTimeSportBtnRun', 'workoutTimeSportBtnBike', 'workoutTimeSportBtnSwim']) },
          { label: 'Date range', value: document.getElementById('workoutTimeRangeLabel')?.textContent.trim() }
        ],
        trainingCalendar: [
          { label: 'Palette', value: getActiveButtonText(['trainingCalendarPaletteGreen', 'trainingCalendarPaletteBlue', 'trainingCalendarPaletteFire']) },
          { label: 'Sport', value: getActiveButtonText(Array.from(document.querySelectorAll('#trainingCalendarSportFilters button')).map(button => button.id)) }
        ],
        wordcloud: [],
        pieCharts: [
          { label: 'Group by', value: getActiveButtonText(['pieDimensionBtnSport', 'pieDimensionBtnDuration', 'pieDimensionBtnPace', 'pieDimensionBtnEquipment', 'pieDimensionBtnLength', 'pieDimensionBtnPower']) },
          { label: 'Slice size', value: getActiveButtonText(['pieMeasureBtnCount', 'pieMeasureBtnTime', 'pieMeasureBtnDistance']) },
          { label: 'Sport', value: getActiveButtonText(['pieSportBtnAll', 'pieSportBtnRun', 'pieSportBtnBike', 'pieSportBtnSwim']) },
          { label: 'Colour scheme', value: document.getElementById('pieChartsColorScheme')?.selectedOptions[0]?.textContent.trim() }
        ],
        lifetimeStatistics: [],
        mediaGallery: [
          ...(window.mediaGalleryDashboard && typeof window.mediaGalleryDashboard.getExportContext === 'function'
            ? window.mediaGalleryDashboard.getExportContext() : [])
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
        legend: window.exportUtils.getExportLegend(tabName),
        contentFit: tabName === 'lifetimeStatistics' ? 'lifetime-kpis' : undefined
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

      const isLifetimeKpiExport = target.contentFit === 'lifetime-kpis';
      const contentX = target.kind === 'pb-tile' || isLifetimeKpiExport ? 24 : 60;
      const contentWidth = target.kind === 'pb-tile' || isLifetimeKpiExport ? 1032 : 960;
      const filterText = (target.filters || []).map(filter => `${filter.label}: ${filter.value}`).join('  |  ');
      const contextY = isLifetimeKpiExport ? 190 : 205;
      let contextLineCount = 0;
      if (filterText && !isLifetimeKpiExport) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 24px system-ui, -apple-system, "Segoe UI", sans-serif';
        contextLineCount = drawWrappedText(
          ctx,
          filterText,
          contentX,
          contextY,
          contentWidth,
          32,
          Number.POSITIVE_INFINITY
        ).lineCount;
      }

      const layout = window.exportUtils.computeExportContentLayout({
        canvasWidth: targetSize,
        canvasHeight: targetSize,
        headerHeight: 190,
        marginX: contentX,
        topGap: isLifetimeKpiExport ? 0 : 15,
        bottomMargin: isLifetimeKpiExport ? 50 : target.legend ? 76 : 24,
        contextGap: 12,
        contextHeight: contextLineCount * 32,
        annotationHeight: target.pinnedSelection ? getExportTooltipLayout(ctx, target, contentWidth).height : 0
      });
      const fit = window.exportUtils.computeContainFit(
        captured.width,
        captured.height,
        layout.visualization.width,
        layout.visualization.height
      );
      ctx.drawImage(
        captured,
        layout.visualization.x + (layout.visualization.width - fit.drawWidth) / 2,
        layout.visualization.y + (layout.visualization.height - fit.drawHeight) / 2,
        fit.drawWidth,
        fit.drawHeight
      );

      if (target.pinnedSelection) {
        const annotation = getExportTooltipLayout(ctx, target, contentWidth);
        const box = layout.annotation;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(box.x, box.y, box.width, box.height);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = `500 ${annotation.fontSize}px system-ui, sans-serif`;
        annotation.lines.forEach((line, index) => ctx.fillText(line, box.x + annotation.padding, box.y + annotation.padding + annotation.fontSize + index * annotation.lineHeight));
        const anchor = target.pinnedSelection.anchor;
        if (anchor.visibility === 'visible' && anchor.capturePoint && ctx.beginPath) {
          const pointX = layout.visualization.x + (layout.visualization.width - fit.drawWidth) / 2 + anchor.capturePoint.x * fit.drawWidth;
          const pointY = layout.visualization.y + (layout.visualization.height - fit.drawHeight) / 2 + anchor.capturePoint.y * fit.drawHeight;
          ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(pointX, pointY, 8, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pointX, pointY + 8); ctx.lineTo(box.x + 12, box.y); ctx.stroke();
        }
      }

      if (isLifetimeKpiExport) return finalCanvas.toDataURL('image/png');

      if (target.legend) {
        const legendY = layout.visualization.y + layout.visualization.height + (layout.annotation?.height || 0) + 28;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 22px system-ui, -apple-system, "Segoe UI", sans-serif';
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

    function getExportTooltipLayout(ctx, target, maxWidth) {
      const selected = target.pinnedSelection;
      ctx.font = '500 18px system-ui, sans-serif';
      const associationNote = selected.anchor.visibility === 'outside-view'
        ? 'Selected item is outside the current view'
        : selected.anchor.visibility === 'not-in-export' ? selected.anchor.associationLabel : '';
      return window.exportUtils.computeTooltipAnnotationLayout({ content: selected.content, maxWidth, maxHeight: 280, measureText: text => ctx.measureText(text), associationNote });
    }

    function createExportCaptureSnapshot(targetEl, tabId) {
      const adapter = window.dashboardTooltips?.adapters.get(tabId);
      const renderer = adapter?.snapshotCapture?.();
      const clonedTarget = targetEl.cloneNode ? targetEl.cloneNode(true) : { ...targetEl };
      const sourceCanvases = targetEl.tagName === 'CANVAS' ? [targetEl] : Array.from(targetEl.querySelectorAll?.('canvas') || []);
      const clonedCanvases = clonedTarget.tagName === 'CANVAS' ? [clonedTarget] : Array.from(clonedTarget.querySelectorAll?.('canvas') || []);
      sourceCanvases.forEach((canvas, index) => {
        const copy = clonedCanvases[index];
        if (!copy) throw new Error('Could not isolate the chart for export');
        copy.width = canvas.width; copy.height = canvas.height;
        const source = renderer?.sourceCanvas === canvas ? renderer.canvas : canvas;
        copy.getContext('2d').drawImage(source, 0, 0, copy.width, copy.height);
      });
      const sourceImages = Array.from(targetEl.querySelectorAll?.('img') || []);
      Array.from(clonedTarget.querySelectorAll?.('img') || []).forEach((image, index) => {
        image.src = sourceImages[index]?.currentSrc || sourceImages[index]?.src || image.src;
        image.removeAttribute?.('srcset');
      });
      Array.from(clonedTarget.querySelectorAll?.('#heatmapActivityTooltip, #trainingCalendarDayTooltip, #pbTooltip, .visualization-detail-tooltip, [data-export-exclude]') || []).forEach(element => element.remove());
      const mediaLease = tabId === 'mediaGallery' ? window.mediaGalleryDashboard?.acquireExportCapture?.(targetEl) : null;
      if (clonedTarget.nodeType === 1) {
        const rect = targetEl.getBoundingClientRect();
        clonedTarget.id = `${targetEl.id || tabId}-export-snapshot`;
        Object.assign(clonedTarget.style, { position: 'fixed', left: '-100000px', top: '0', width: `${rect.width}px`, height: `${rect.height}px`, maxWidth: 'none', margin: '0', pointerEvents: 'none' });
        clonedTarget.setAttribute('aria-hidden', 'true');
        document.body.appendChild(clonedTarget);
      }
      return { element: clonedTarget, prepare: () => mediaLease?.prepare(clonedTarget), release() { mediaLease?.release(); if (clonedTarget.nodeType === 1) clonedTarget.remove(); } };
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
      const button = document.getElementById('exportPreviewDownloadBtn');
      if (button) button.disabled = !!exportDownloadAttempt;
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

    function downloadExportedImageWithAnchor(filename, image = lastExportedImage) {
      const link = document.createElement('a');
      link.href = image.dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        document.body.removeChild(link);
      }
    }

    function exportDataUrlToBlob(dataUrl) {
      const match = String(dataUrl || '').match(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!match) throw new Error('Could not prepare the export image for saving. Please try again.');

      const binary = atob(match[1]);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
      }
      window.exportUtils.getExportPngDimensions(bytes);
      return new Blob([bytes], { type: 'image/png' });
    }

    async function prepareExportImage(dataUrl, target, pbOpening = null) {
      const blob = exportDataUrlToBlob(dataUrl);
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Could not prepare the export image. Please export again.'));
        image.src = dataUrl;
        if (typeof image.decode === 'function') image.decode().then(resolve, reject);
      });
      image.onload = null;
      image.onerror = null;
      if (!(image.naturalWidth > 0 && image.naturalHeight > 0)) {
        throw new Error('Could not prepare the export image. Please export again.');
      }
      return Object.freeze({ dataUrl, blob, target, pbOpening, width: image.naturalWidth, height: image.naturalHeight });
    }

    async function downloadExportedImage() {
      const image = lastExportedImage;
      if (exportDownloadAttempt || !image || !image.blob || !image.blob.size) return;
      const attempt = { image, outcome: null };
      exportDownloadAttempt = attempt;
      const button = document.getElementById('exportPreviewDownloadBtn');
      if (button) button.disabled = true;
      if (exportToastTimeoutId) clearTimeout(exportToastTimeoutId);
      exportToastTimeoutId = null;
      const toast = document.getElementById('exportToast');
      if (toast) {
        toast.textContent = '';
        toast.classList.add('hidden');
      }
      const filename = window.exportUtils.generateExportFilename(image.target, new Date())
        || 'trianalytica-export.png';
      const saveFilePicker = window.showSaveFilePicker;
      try {
        if (typeof saveFilePicker === 'function') {
          let fileHandle;
          try {
            fileHandle = await saveFilePicker({
              suggestedName: filename,
              types: [{ description: 'PNG image', accept: { 'image/png': ['.png'] } }]
            });
          } catch (error) {
            if (error && error.name === 'AbortError') {
              attempt.outcome = 'cancelled';
              return attempt.outcome;
            }
            showExportToast('Your browser could not open a location picker. The file will use the browser’s default download behavior.');
          }

          if (fileHandle) {
            try {
              const writable = await fileHandle.createWritable();
              await writable.write(image.blob);
              await writable.close();
              attempt.outcome = 'saved';
              return attempt.outcome;
            } catch (error) {
              attempt.outcome = 'failed';
              console.error('Could not save exported image', error);
              if (lastExportedImage === image) {
                showExportToast(`Could not save export image. ${error && error.message || 'Please try again.'}`);
              }
              return attempt.outcome;
            }
          }
        } else {
          showExportToast('Your browser cannot choose a download location. The file will use the browser’s default download behavior.');
        }

        downloadExportedImageWithAnchor(filename, image);
        attempt.outcome = 'handed-off';
        return attempt.outcome;
      } catch (error) {
        attempt.outcome = 'failed';
        console.error('Could not save exported image', error);
        if (lastExportedImage === image) {
          showExportToast(`Could not save export image. ${error && error.message || 'Please try again.'}`);
        }
        return attempt.outcome;
      } finally {
        exportDownloadAttempt = null;
        if (button) button.disabled = false;
        if (attempt.outcome === 'handed-off' || attempt.outcome === 'saved') {
          const ownsPreview = lastExportedImage === image;
          const canCloseOrigin = ownsPreview || !lastExportedImage;
          if (ownsPreview) closeExportPreviewModal();
          if (canCloseOrigin && image.target && image.target.kind === 'pb-tile' && image.pbOpening
            && typeof pbDetailOpening !== 'undefined' && pbDetailOpening === image.pbOpening
            && typeof closePbDetail === 'function') {
            closePbDetail();
          }
        }
      }
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
      const pbOpening = target.kind === 'pb-tile' && typeof pbDetailOpening !== 'undefined' ? pbDetailOpening : null;
      let snapshot = null;
      try {
        const tabId = target.kind === 'pb-tile' ? 'personalBests' : target.key;
        target = JSON.parse(JSON.stringify(target));
        target.pinnedSelection = window.dashboardTooltips?.getPinned(tabId) || null;
        const heatmapPalette = document.getElementById('heatmapColorScheme')?.value;
        if (target.key === 'wordcloud') {
          if (!window.wordcloudDashboard.hasExportableCloud()) throw new Error('The Wordcloud is not ready to export. Wait for the cloud to finish rendering and try again.');
        }
        snapshot = createExportCaptureSnapshot(targetEl, tabId);
        if (window.tooltipSelectionUtils) target = window.tooltipSelectionUtils.freezePlain(window.tooltipSelectionUtils.copyPlain(target));
        await snapshot.prepare();
        const assets = await loadExportAssets();

        const captured = await html2canvas(snapshot.element, {
          backgroundColor: '#020617',
          useCORS: true,
          logging: false,
          onclone: clonedDocument => {
            const clonedTarget = clonedDocument.getElementById(snapshot.element.id || target.targetElementId);
            if (!clonedTarget) return;
            if (target.key === 'heatmap' && heatmapPalette === 'black-fire') {
              const tileLayer = clonedTarget.querySelector('.leaflet-tile-pane .leaflet-layer');
              if (tileLayer) {
                tileLayer.style.filter = '';
                tileLayer.style.opacity = '0.45';
                clonedTarget.style.backgroundColor = 'rgb(2, 6, 23)';
              }
              return;
            }
            if (target.key !== 'trainingCalendar') return;
            const regions = Array.from(clonedTarget.querySelectorAll('[role="region"]'));
            const captureWidth = Math.max(clonedTarget.clientWidth, ...regions.map(region => region.scrollWidth));
            regions.forEach(region => {
              region.style.overflow = 'visible';
              region.style.width = `${region.scrollWidth}px`;
              region.style.maxWidth = 'none';
            });
            clonedTarget.style.width = `${captureWidth}px`;
            clonedTarget.style.maxWidth = 'none';
          }
        });
        const dataUrl = drawExportComposition(captured, target, assets);
        lastExportedImage = await prepareExportImage(dataUrl, target, pbOpening);

        exportRequestState = 'previewing';
        showExportPreviewModal(dataUrl);
      } catch (error) {
        console.error('Export failed', error);
        exportRequestState = 'idle';
        showExportToast(error.message || 'Could not export this visualization. Please try again.');
      } finally {
        snapshot?.release();
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
