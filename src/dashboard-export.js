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
        legend: tabName === 'paceMetrics' && window.paceMetricsDashboard
          ? {
            title: 'Years',
            items: window.paceMetricsDashboard.getExportSeries()
          }
          : window.exportUtils.getExportLegend(tabName),
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
      const filterText = target.filters.map(filter => `${filter.label}: ${filter.value}`).join('  |  ');
      const filterLayout = filterText && !isLifetimeKpiExport
        ? drawWrappedText(ctx, filterText, 60, 220, 960, 32, 2)
        : null;
      const contentWidth = target.contentFit === 'pb-tight' || isLifetimeKpiExport ? 1032 : 960;
      const requestedContentHeight = target.contentFit === 'pb-tight' ? 560 : isLifetimeKpiExport ? 840 : 500;
      const contentY = isLifetimeKpiExport
        ? 190
        : filterLayout
          ? Math.max(250, filterLayout.bottom + 16)
          : 205;
      const contentHeight = isLifetimeKpiExport
        ? requestedContentHeight
        : Math.min(requestedContentHeight, Math.max(0, 790 - contentY));
      const contentFit = window.exportUtils.computeExportContentFit(
        captured.width,
        captured.height,
        contentWidth,
        contentHeight
      );
      const contentX = target.kind === 'pb-tile' ? 24 : isLifetimeKpiExport ? 24 : 60;
      ctx.drawImage(
        captured,
        contentX + contentFit.offsetX,
        contentY + contentFit.offsetY,
        contentFit.drawWidth,
        contentFit.drawHeight
      );

      if (isLifetimeKpiExport) return finalCanvas.toDataURL('image/png');

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 24px system-ui, -apple-system, "Segoe UI", sans-serif';
      const controlsHeight = Math.max(42, (target.availableControls || []).length * 56);
      const legendHeight = target.legend ? 42 : 0;
      const metadataLayout = window.exportUtils.computeExportMetadataLayout({
        startY: 790,
        filterHeight: 0,
        controlsHeight,
        legendHeight,
        footerStart: 1070,
        spacing: 18
      });
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
        let itemX = 170;
        let itemY = legendY;
        target.legend.items.forEach((item, index) => {
          ctx.font = '500 22px system-ui, -apple-system, "Segoe UI", sans-serif';
          const itemWidth = 42 + ctx.measureText(item.label).width;
          if (itemX + itemWidth > 1020 && itemX > 170) {
            itemX = 170;
            itemY += 32;
          }
          ctx.fillStyle = item.color;
          ctx.fillRect(itemX, itemY - 18, 18, 18);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(item.label, itemX + 24, itemY);
          itemX += itemWidth + 18;
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
      image.src = dataUrl;
      await image.decode();
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
      const tooltip = document.getElementById('trainingCalendarDayTooltip');
      const tooltipWasVisible = tooltip && !tooltip.classList.contains('hidden');
      try {
        if (tooltipWasVisible) tooltip.classList.add('hidden');
        if (target.key === 'wordcloud') {
          const completed = await window.wordcloudDashboard.waitForCurrentRender();
          if (!completed || !window.wordcloudDashboard.hasExportableCloud()) {
            exportRequestState = 'idle';
            showExportToast('The Wordcloud is not ready to export. Wait for the cloud to finish rendering and try again.');
            return;
          }
        }
        await waitForChartRenderSettle();
        if (target.key === 'wordcloud' && !window.wordcloudDashboard.hasExportableCloud()) {
          exportRequestState = 'idle';
          showExportToast('The Wordcloud changed before capture completed. Wait for the current cloud and try again.');
          return;
        }
        const assets = await loadExportAssets();

        const captureOptions = {
          backgroundColor: '#020617',
          useCORS: true,
          logging: false,
          windowWidth: ['pieCharts', 'heatmap'].includes(target.key) ? Math.max(window.innerWidth || 0, 1200) : undefined,
          onclone: clonedDocument => {
            const clonedTarget = clonedDocument.getElementById(target.targetElementId);
            if (!clonedTarget) return;
            if (['totalDistance', 'distributions', 'workoutTime'].includes(target.key)) {
              clonedTarget.style.width = '960px';
              clonedTarget.style.height = '500px';
              clonedTarget.style.maxWidth = 'none';
              clonedTarget.querySelectorAll?.('canvas').forEach(canvas => {
                canvas.style.width = '100%';
                canvas.style.height = '100%';
              });
              return;
            }
            if (target.kind === 'pb-tile') {
              clonedTarget.style.flex = 'none';
              clonedTarget.style.width = '1032px';
              clonedTarget.style.height = '560px';
              clonedTarget.style.minHeight = '560px';
              clonedTarget.style.maxHeight = '560px';
              clonedTarget.style.maxWidth = 'none';
              const svg = clonedTarget.querySelector('svg');
              if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
                svg.style.maxWidth = 'none';
              }
              return;
            }
            if (target.key === 'pieCharts') {
              clonedTarget.style.width = '960px';
              clonedTarget.style.maxWidth = 'none';
              const summary = clonedTarget.querySelector('#pieChartsSummary');
              if (summary) summary.style.display = 'none';
              const chart = clonedTarget.querySelector('#pieChartsCanvas');
              const chartContainer = chart && chart.parentElement;
              if (chartContainer) {
                chartContainer.style.maxWidth = 'none';
                chartContainer.style.height = '560px';
                chartContainer.style.width = '560px';
                chartContainer.style.margin = '0 auto';
                const grid = chartContainer.parentElement;
                if (grid) {
                  grid.style.display = 'grid';
                  grid.style.gridTemplateColumns = 'minmax(0, 1fr) 18rem';
                  grid.style.gap = '24px';
                  grid.style.alignItems = 'center';
                }
              }
              if (chart && window.pieChartsDashboard && typeof window.pieChartsDashboard.getExportChartImage === 'function') {
                const image = clonedDocument.createElement('img');
                image.src = window.pieChartsDashboard.getExportChartImage(560);
                image.alt = 'Pie chart';
                image.style.width = '560px';
                image.style.height = '560px';
                image.style.display = 'block';
                chart.replaceWith(image);
              }
              const legend = clonedTarget.querySelector('#pieChartsLegend');
              if (legend) {
                legend.style.width = '288px';
                legend.style.fontSize = '22px';
                legend.querySelectorAll('li span').forEach(span => {
                  span.style.fontSize = '22px';
                });
              }
              return;
            }
            if (target.key === 'heatmap') {
              clonedTarget.style.width = '960px';
              clonedTarget.style.height = '500px';
              clonedTarget.style.maxWidth = 'none';
              clonedTarget.querySelectorAll?.('.leaflet-control-zoom').forEach(control => control.remove());
              if (document.getElementById('heatmapColorScheme')?.value === 'black-fire') {
                const tileLayer = clonedTarget.querySelector('.leaflet-tile-pane .leaflet-layer');
                if (tileLayer) {
                  tileLayer.style.filter = '';
                  tileLayer.style.opacity = '0.45';
                  clonedTarget.style.backgroundColor = 'rgb(2, 6, 23)';
                }
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
        };
        const captured = target.key === 'heatmap'
          && window.heatmapDashboard
          && typeof window.heatmapDashboard.captureAtExportSize === 'function'
          ? await window.heatmapDashboard.captureAtExportSize(() => html2canvas(targetEl, captureOptions))
          : await html2canvas(targetEl, captureOptions);
        const dataUrl = drawExportComposition(captured, target, assets);
        lastExportedImage = await prepareExportImage(dataUrl, target, pbOpening);

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
