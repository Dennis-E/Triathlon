    // --- Branded visualization export (specs/008-enhanced-visualization-export) ---

    let exportRequestState = 'idle'; // idle | checking | blocked-no-data | capturing | previewing | capture-failed
    let exportToastTimeoutId = null;
    let lastExportedImage = null; // { dataUrl, target }
    let lastExportImages = [];
    let currentExportSeriesIndex = 0;
    let selectedExportFormat = 'square';
    let selectedExportHumorEnabled = false;
    let lastExportCaptureState = null;
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
        distributions: [
          { label: 'Metric', value: getActiveButtonText(['distributionsMetricBtnLength', 'distributionsMetricBtnDuration', 'distributionsMetricBtnPace', 'distributionsMetricBtnElevation', 'distributionsMetricBtnPower']) },
          { label: 'Sport', value: getActiveButtonText(['distributionsSportBtnAll', 'distributionsSportBtnRun', 'distributionsSportBtnBike', 'distributionsSportBtnSwim']) }
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

    function getSocialExportPresentation(tabName, data = {}, options = {}) {
      const sport = data.sport === 'All' ? 'All sports' : data.sport;
      const metricLabels = {
        avgLength: 'Average distance',
        cadence: 'Cadence',
        count: 'Activity count',
        distance: 'Distance',
        heartRate: 'Heart rate',
        pace: 'Pace',
        power: 'Power',
        speed: 'Speed',
        time: 'Time'
      };
      const metric = metricLabels[data.metric] || data.metricLabel || data.metric;
      let headline;
      let centralValue = Number.isFinite(data.centralValue) ? data.centralValue : null;

      if (tabName === 'totalDistance') {
        headline = ({ Run: 'My running years', Bike: 'My cycling years', Swim: 'My swimming years' })[data.sport] || 'My training years';
      } else if (tabName === 'equipment') {
        headline = data.equipmentFilter === 'Shoes' ? 'My most-used running shoes'
          : data.equipmentFilter === 'Bikes' ? 'My most-used bikes' : 'My most-used equipment';
      } else if (tabName === 'equipmentTimeline') {
        headline = data.equipmentFilter === 'Shoes' ? 'My running shoe eras'
          : data.equipmentFilter === 'Bikes' ? 'My cycling equipment eras' : 'My equipment eras';
      } else if (tabName === 'personalBests' || tabName === 'pb-tile') {
        const recordTitle = String(data.title || '').trim();
        headline = /^PB:/i.test(recordTitle) ? recordTitle : recordTitle ? `PB: ${recordTitle}` : 'My personal bests';
        if (data.best && Number.isFinite(data.best.value)) centralValue = data.best.value;
      } else if (tabName === 'heatmap') {
        headline = 'My training playground';
      } else if (tabName === 'paceMetrics') {
        const measure = metric || 'Heart rate';
        const performance = data.sport === 'Bike' ? 'speed' : 'pace';
        headline = `My ${measure.toLowerCase()} vs ${performance}`;
      } else {
        headline = {
          distributions: 'My training distribution',
          workoutTime: 'My workout rhythm',
          trainingCalendar: 'My training year',
          wordcloud: 'My workout words',
          pieCharts: 'How I train',
          lifetimeStatistics: 'My training totals',
          mediaGallery: 'My training moments'
        }[tabName] || 'My training story';
      }

      let secondaryLine = null;
      if (options.humorEnabled && tabName !== 'paceMetrics') {
        if (tabName === 'totalDistance') {
          secondaryLine = data.sport === 'Bike' ? 'Just one more kilometre.'
            : data.sport === 'Swim' ? 'A lot of counting lengths.'
              : data.sport === 'Run' ? "Apparently, I don't sit still." : null;
        } else if (tabName === 'equipment') {
          secondaryLine = data.equipmentFilter === 'Bikes' ? 'Every bike had a very good reason.'
            : data.equipmentFilter === 'Shoes' ? "They've seen things." : null;
        } else if (tabName === 'equipmentTimeline') {
          secondaryLine = data.equipmentFilter === 'Shoes' ? 'Every pair had a purpose. Probably.' : null;
        } else if (tabName === 'pb-tile' || tabName === 'personalBests') {
          secondaryLine = 'Worth the heavy breathing.';
        } else if (tabName === 'heatmap') {
          secondaryLine = 'Taking the scenic route. Repeatedly.';
        } else if (tabName === 'distributions') {
          secondaryLine = 'Apparently, every workout has a chart.';
        } else if (tabName === 'workoutTime') {
          secondaryLine = 'Time flies. Apparently, so does training.';
        } else if (tabName === 'trainingCalendar') {
          secondaryLine = 'Apparently, I like showing up.';
        } else if (tabName === 'wordcloud') {
          secondaryLine = 'My workout names need their own chart.';
        } else if (tabName === 'pieCharts') {
          secondaryLine = 'Apparently, I enjoy a good slice.';
        } else if (tabName === 'lifetimeStatistics') {
          secondaryLine = 'A few workouts add up.';
        } else if (tabName === 'mediaGallery') {
          secondaryLine = 'Proof I did leave the house.';
        }
      }

      const context = [];
      let summary = null;
      let sourceAttribution = null;
      const addContext = (label, value) => {
        if (value !== undefined && value !== null && String(value).trim()) {
          context.push({ label, value: String(value).trim() });
        }
      };
      addContext('Sport', sport);
      addContext('Metric', metric);
      addContext('Period', data.period);
      addContext('Unit', data.unit);
      addContext('By', data.rankingBy);
      addContext('Timeline', data.periodMeaning);
      addContext('Group', data.groupBy);
      addContext('Resolution', data.resolution);
      addContext('X axis', data.xAxisTitle);
      addContext('Y axis', data.yAxisTitle);
      addContext('Point size', data.pointSizeMeaning);
      if (tabName === 'paceMetrics') {
        const summaryParts = [
          ...(data.sport ? [`${sport}.`] : []),
          `${metric || 'Heart rate'} vs. ${data.sport === 'Bike' ? 'Speed' : 'Pace'}`
        ];
        const period = String(data.period || '').trim();
        summary = summaryParts.join(' ');
        if (data.pointSizeMeaning) summary += `. Size = ${data.pointSizeMeaning}`;
        if (period && !/^(all|all time)$/i.test(period)) summary += `. ${period}`;
      }
      if (tabName === 'pb-tile' || tabName === 'personalBests') {
        const firstRecord = data.firstRecord || data.milestones?.find(record => record.kind === 'first');
        const currentRecord = data.currentRecord || [...(data.milestones || [])].reverse().find(record => record.kind === 'current') || data.best;
        const recordCount = Number(data.recordCount) || data.records?.length || 0;
        if (recordCount > 1 && firstRecord?.displayValue && currentRecord?.displayValue) {
          const firstDate = firstRecord.date ? new Date(firstRecord.date) : null;
          const firstYear = Number.isInteger(data.firstRecordYear) ? data.firstRecordYear
            : firstDate && Number.isFinite(firstDate.getTime()) ? firstDate.getFullYear() : null;
          summary = `From ${firstRecord.displayValue} to ${currentRecord.displayValue}${firstYear ? ` since ${firstYear}` : ''}`;
        }
        sourceAttribution = data.sourceAttribution || data.best?.sourceType || currentRecord?.sourceType || null;
      }

      return {
        ...window.exportUtils.createSocialExportMetadata({ headline, context, secondaryLine }),
        summary,
        sourceAttribution,
        centralValue,
        centralDisplayValue: data.best?.displayValue || data.centralDisplayValue || null,
        metric: metric || null,
        sport: sport || null,
        period: data.period || null,
        unit: data.unit || null,
        series: data.series || [],
        trendLines: data.trendLines || [],
        pointSizeMeaning: data.pointSizeMeaning || null,
        best: data.best || null,
        milestones: data.milestones || []
      };
    }

    function getExportPresentationData(tabName) {
      const adapters = {
        totalDistance: () => window.totalDistanceDashboard?.getExportData?.(),
        paceMetrics: () => window.paceMetricsDashboard?.getExportPresentationData?.(),
        equipment: () => window.equipmentDashboard?.getExportData?.(),
        equipmentTimeline: () => window.equipmentDashboard?.getTimelineExportData?.(),
        trainingCalendar: () => window.trainingCalendarDashboard?.getExportData?.(),
        personalBests: () => window.personalBestsDashboard?.getActiveExportData?.(),
        heatmap: () => window.heatmapDashboard?.getExportData?.()
      };
      const data = adapters[tabName]?.() || {};
      const fallbackContext = getExportContext(tabName);
      const getContextValue = label => fallbackContext.find(item => item.label === label)?.value;
      const metricLabel = data.metricLabel || getContextValue('Metric') || getContextValue('Slice size') || ({
        distributions: 'Training distribution',
        workoutTime: 'Workout time',
        trainingCalendar: 'Training frequency',
        wordcloud: 'Workout titles',
        pieCharts: 'Activities',
        lifetimeStatistics: 'Training statistics',
        mediaGallery: 'Activities'
      }[tabName]);
      const unitByMetric = {
        distance: 'km',
        length: 'km',
        Distance: 'km',
        Length: 'km',
        elevation: 'm',
        'Elevation gain': 'm',
        power: 'W',
        'Power (Watt)': 'W',
        heartRate: 'bpm',
        cadence: 'steps/min',
        count: 'activities',
        Activities: 'activities',
        'Activity count': 'activities'
      };
      const periodContext = getContextValue('Timeframe') || getContextValue('Date range') || getContextValue('Year');
      const validDates = typeof processedActivities !== 'undefined'
        ? processedActivities.map(activity => new Date(activity.date)).filter(date => Number.isFinite(date.getTime()))
        : [];
      let datasetPeriod = 'All time';
      if (validDates.length) {
        const years = validDates.map(date => date.getFullYear());
        const firstYear = Math.min(...years);
        const lastYear = Math.max(...years);
        datasetPeriod = firstYear === lastYear ? String(firstYear) : `${firstYear}-${lastYear}`;
        if (lastYear === new Date().getFullYear()) datasetPeriod += ' YTD';
      }
      return {
        ...data,
        sport: data.sport || getContextValue('Sport'),
        metricLabel,
        period: data.period || periodContext || datasetPeriod,
        unit: data.unit || getContextValue('Unit') || unitByMetric[data.metric] || unitByMetric[metricLabel],
        groupBy: data.groupBy || getContextValue('Group by'),
        resolution: data.resolution || getContextValue('Granularity') || getContextValue('Aggregation')
      };
    }

    function getExportTargetPages(target) {
      if (target?.key === 'trainingCalendar') {
        const years = target.exportData?.years;
        if (!Array.isArray(years) || years.length === 0) return [target];
        const format = target.format || 'square';
        const layout = window.exportUtils.computeSocialExportLayout(format, {
          headerHeight: 180,
          footerHeight: 88,
          marginX: 48,
          bottomMargin: 186
        });
        const sectionHeight = Math.max(1, Number(target.exportData.yearSectionHeight) || 180);
        const pageSize = Math.max(1, Math.floor((layout.visualization.height - 24) / sectionHeight));
        if (years.length <= pageSize) return [target];
        const pageCount = Math.ceil(years.length / pageSize);
        return Array.from({ length: pageCount }, (_unused, index) => ({
          ...target,
          format,
          seriesPage: index + 1,
          seriesCount: pageCount,
          exportData: {
            ...target.exportData,
            years: years.slice(index * pageSize, (index + 1) * pageSize),
            format,
            pageNumber: index + 1,
            pageCount
          }
        }));
      }
      const items = target?.key === 'equipmentTimeline' ? target.exportData?.items : null;
      if (!Array.isArray(items) || items.length === 0) return [target];
      const format = target.format || 'square';
      const pageSize = format === 'portrait' ? 7 : 5;
      if (items.length <= pageSize) return [target];
      const timestamps = items.flatMap(item => [item.firstDate, item.lastDate])
        .map(date => new Date(date).getTime())
        .filter(Number.isFinite);
      const scaleStart = timestamps.length ? Math.min(...timestamps) : 0;
      const scaleEnd = timestamps.length ? Math.max(...timestamps) : scaleStart + 1;
      const pageCount = Math.ceil(items.length / pageSize);
      return Array.from({ length: pageCount }, (_unused, index) => ({
        ...target,
        seriesPage: index + 1,
        seriesCount: pageCount,
        exportData: {
          ...target.exportData,
          items: items.slice(index * pageSize, (index + 1) * pageSize),
          pageNumber: index + 1,
          pageCount,
          scaleStart,
          scaleEnd
        }
      }));
    }

    function getTabExportTarget(tabName) {
      const targetId = EXPORT_CAPTURE_TARGET_IDS[tabName];
      const targetEl = targetId && document.getElementById(targetId);
      const flags = getExportableFlags();
      if (!targetEl || !window.exportUtils.hasExportableContent(tabName, flags)) return null;

      const exportData = getExportPresentationData(tabName);
      const presentation = getSocialExportPresentation(tabName, exportData);
      const target = window.exportUtils.createExportTarget({
        kind: 'tab',
        key: tabName,
        title: presentation.headline,
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
      target.presentation = presentation;
      target.exportData = exportData;
      return target;
    }

    function loadExportAssets() {
      if (exportAssetsPromise) return exportAssetsPromise;
      const paths = window.exportUtils.getExportAssetPaths();
      exportAssetsPromise = Promise.all(Object.entries(paths).map(([name, path]) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve([name, image]);
        image.onerror = () => reject(new Error(`Could not load export asset: ${path}`));
        image.src = path;
      }))).then(entries => Object.fromEntries(entries)).catch(error => {
        exportAssetsPromise = null;
        throw error;
      });
      return exportAssetsPromise;
    }

    async function waitForExportFonts() {
      if (!document.fonts?.ready) return;
      try {
        await document.fonts.ready;
      } catch (_error) {
        throw new Error('Could not load required fonts for this export. Please try again.');
      }
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

    function wrapSocialExportText(ctx, text, maxWidth, maxLines = 2) {
      return window.exportUtils.wrapExportText(text, maxWidth, value => ctx.measureText(value).width, maxLines);
    }

    function drawDistanceExportChart(ctx, data, bounds) {
      const style = window.exportUtils.getSocialExportStyleConfig();
      const labels = Array.isArray(data.periodLabels) ? data.periodLabels : [];
      const series = Array.isArray(data.series) ? data.series : [];
      if (!labels.length || !series.length) return false;
      const start = data.aggregation === 'yearly' ? Math.max(0, labels.length - 10) : 0;
      const visibleLabels = labels.slice(start);
      const plot = { x: bounds.x + 82, y: bounds.y + 28, width: bounds.width - 96, height: bounds.height - 98 };
      if (plot.width <= 0 || plot.height <= 0) return false;
      const totals = visibleLabels.map((_label, index) => series.reduce((sum, item) => sum + (Number(item.values[start + index]) || 0), 0));
      const maxValue = Math.max(1, ...totals);
      const baseline = plot.y + plot.height;
      const step = plot.width / visibleLabels.length;
      const barWidth = Math.min(48, step * 0.62);
      const labelCount = data.aggregation === 'yearly' ? visibleLabels.length : Math.min(6, visibleLabels.length);
      const labelIndexes = new Set(Array.from({ length: labelCount }, (_, index) => labelCount === 1
        ? 0
        : Math.round(index * (visibleLabels.length - 1) / (labelCount - 1))));
      const labelWidth = plot.width / Math.max(1, labelIndexes.size);

      ctx.font = `500 ${style.typography.axis}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let tick = 0; tick <= 4; tick += 1) {
        const y = plot.y + plot.height * (1 - tick / 4);
        ctx.strokeStyle = style.colors.grid;
        ctx.lineWidth = 1;
        ctx.beginPath?.();
        ctx.moveTo?.(plot.x, y);
        ctx.lineTo?.(plot.x + plot.width, y);
        ctx.stroke?.();
        ctx.fillStyle = style.colors.secondary;
        ctx.fillText(`${Math.round(maxValue * tick / 4)} km`, plot.x - 12, y);
      }

      visibleLabels.forEach((label, index) => {
        const centerX = plot.x + step * (index + 0.5);
        const total = totals[index];
        let stackY = baseline;
        series.forEach(item => {
          const value = Number(item.values[start + index]) || 0;
          const height = total > 0 ? plot.height * value / maxValue : 0;
          stackY -= height;
          ctx.fillStyle = item.color || '#20c9b2';
          ctx.fillRect(centerX - barWidth / 2, stackY, barWidth, height);
        });
        ctx.fillStyle = style.colors.headline;
        ctx.font = `600 ${style.typography.axis}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        if (!labelIndexes.has(index)) return;
        const periodLabel = String(label) === String(data.incompleteYear) ? `${label} YTD` : String(label);
        const periodLines = wrapSocialExportText(ctx, periodLabel, Math.max(48, labelWidth - 8), 2);
        periodLines.forEach((line, lineIndex) => ctx.fillText(line, centerX, baseline + 12 + lineIndex * 32));
      });
      ctx.textAlign = 'left';
      return true;
    }

    function drawEquipmentRanking(ctx, data, bounds, format) {
      const style = window.exportUtils.getSocialExportStyleConfig();
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) return false;
      const maxItems = format === 'portrait' ? 7 : 5;
      const visible = items.slice(0, maxItems);
      const truncated = items.length > visible.length;
      const headingHeight = truncated ? 44 : 0;
      if (truncated) {
        ctx.fillStyle = style.colors.secondary;
        ctx.font = `600 ${style.typography.context}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Top ${visible.length} of ${items.length}`, bounds.x, bounds.y);
      }
      const rowHeight = Math.min(88, (bounds.height - headingHeight) / visible.length);
      const maxValue = Math.max(1, ...visible.map(item => Number(item.value) || 0));
      const rankWidth = 74;
      const nameWidth = Math.min(320, bounds.width * 0.34);
      const barX = bounds.x + rankWidth + nameWidth + 18;
      const valueWidth = 170;
      const barWidth = Math.max(60, bounds.x + bounds.width - valueWidth - barX - 18);

      visible.forEach((item, index) => {
        const y = bounds.y + headingHeight + index * rowHeight;
        const centerY = y + rowHeight / 2;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillStyle = index === 0 ? style.colors.rank : style.colors.secondary;
        ctx.font = `${index === 0 ? '700' : '600'} ${style.typography.essential}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.fillText(`#${index + 1}`, bounds.x, centerY);
        ctx.fillStyle = style.colors.headline;
        ctx.font = `600 ${style.typography.essential}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        const nameLines = wrapSocialExportText(ctx, item.name, nameWidth, 2);
        nameLines.forEach((line, lineIndex) => ctx.fillText(line, bounds.x + rankWidth, centerY - (nameLines.length - 1) * 17 + lineIndex * 34));
        ctx.fillStyle = style.colors.surface;
        ctx.fillRect(barX, centerY - 12, barWidth, 24);
        ctx.fillStyle = index === 0 ? style.colors.rank : style.colors.accent;
        ctx.fillRect(barX, centerY - 12, Math.max(2, barWidth * (Number(item.value) || 0) / maxValue), 24);
        ctx.fillStyle = style.colors.headline;
        ctx.font = `600 ${style.typography.essential}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.fillText(item.displayValue ?? String(item.value), barX + barWidth + 14, centerY);
      });
      return true;
    }

    function drawEquipmentTimeline(ctx, data, bounds, format) {
      const style = window.exportUtils.getSocialExportStyleConfig();
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) return false;
      const maxItems = format === 'portrait' ? 7 : 5;
      const visible = items.slice(0, maxItems);
      const truncated = items.length > visible.length;
      const headingHeight = 42;
      ctx.fillStyle = style.colors.secondary;
      ctx.font = `600 ${style.typography.context}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(data.periodMeaning || (data.mode === 'activities' ? 'Individual activities' : 'Usage span'), bounds.x, bounds.y);
      if (data.pageCount > 1) ctx.fillText(`Page ${data.pageNumber} of ${data.pageCount}`, bounds.x + 300, bounds.y);
      else if (truncated) ctx.fillText(`Showing ${visible.length} of ${items.length}`, bounds.x + 300, bounds.y);

      const dates = visible.flatMap(item => [item.firstDate, item.lastDate]).filter(value => value instanceof Date && Number.isFinite(value.getTime()));
      const firstTime = Number.isFinite(data.scaleStart) ? data.scaleStart : dates.length ? Math.min(...dates.map(date => date.getTime())) : 0;
      const lastTime = Number.isFinite(data.scaleEnd) ? data.scaleEnd : dates.length ? Math.max(...dates.map(date => date.getTime())) : firstTime + 1;
      const rowHeight = Math.min(88, (bounds.height - headingHeight) / visible.length);
      const nameWidth = Math.min(320, bounds.width * 0.34);
      const lineX = bounds.x + nameWidth + 30;
      const lineWidth = Math.max(80, bounds.width - nameWidth - 180);
      visible.forEach((item, index) => {
        const y = bounds.y + headingHeight + index * rowHeight;
        const centerY = y + rowHeight / 2;
        ctx.fillStyle = style.colors.headline;
        ctx.font = `600 ${style.typography.essential}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name, bounds.x, centerY);
        ctx.strokeStyle = style.colors.grid;
        ctx.lineWidth = 3;
        ctx.beginPath?.();
        ctx.moveTo?.(lineX, centerY);
        ctx.lineTo?.(lineX + lineWidth, centerY);
        ctx.stroke?.();
        const start = item.firstDate instanceof Date ? item.firstDate.getTime() : firstTime;
        const end = item.lastDate instanceof Date ? item.lastDate.getTime() : start;
        const range = Math.max(1, lastTime - firstTime);
        const x1 = lineX + lineWidth * (start - firstTime) / range;
        const x2 = lineX + lineWidth * (end - firstTime) / range;
        ctx.fillStyle = item.type === 'Shoes' ? style.colors.rank : style.colors.accent;
        ctx.fillRect(Math.min(x1, x2), centerY - 10, Math.max(20, Math.abs(x2 - x1)), 20);
        ctx.fillStyle = style.colors.secondary;
        ctx.font = `500 ${style.typography.axis}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        const startYear = item.firstDate instanceof Date ? item.firstDate.getFullYear() : '';
        const endYear = item.lastDate instanceof Date ? item.lastDate.getFullYear() : '';
        ctx.fillText(`${startYear}-${endYear}`, lineX + lineWidth + 14, centerY);
      });
      return true;
    }

    function drawSpecializedExportVisualization(ctx, captured, target, bounds, format) {
      if (target.key === 'totalDistance') return drawDistanceExportChart(ctx, target.exportData || {}, bounds);
      if (target.key === 'equipment') return drawEquipmentRanking(ctx, target.exportData || {}, bounds, format);
      if (target.key === 'equipmentTimeline') return drawEquipmentTimeline(ctx, target.exportData || {}, bounds, format);
      return false;
    }

    function drawExportComposition(captured, target, assets) {
      const format = target.format || 'square';
      const dimensions = window.exportUtils.getExportFormatConfig(format);
      if (!dimensions) throw new RangeError(`Unsupported export format: ${format}`);
      const style = window.exportUtils.getSocialExportStyleConfig();
      const { width: canvasWidth, height: canvasHeight } = dimensions;
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvasWidth;
      finalCanvas.height = canvasHeight;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not create export canvas');

      const presentation = target.presentation || getSocialExportPresentation(
        target.kind === 'pb-tile' ? 'pb-tile' : target.key,
        { ...(target.exportData || {}), title: target.title, metricLabel: target.metricLabel }
      );
      const margin = style.safeMargin;
      const contentWidth = canvasWidth - margin * 2;
      ctx.fillStyle = style.colors.background;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = style.colors.accent;
      ctx.fillRect(margin, margin, 72, 5);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = style.colors.headline;
      const headlineSize = Math.max(style.typography.headline.min, Math.min(64, style.typography.headline.max));
      ctx.font = `700 ${headlineSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      const headlineLines = wrapSocialExportText(ctx, presentation.headline || target.title, contentWidth, 2);
      const headlineLineHeight = headlineSize + 10;
      headlineLines.forEach((line, index) => ctx.fillText(line, margin, margin + 20 + index * headlineLineHeight));
      let contentTop = margin + 20 + headlineLines.length * headlineLineHeight;

      if (presentation.centralValue !== null && presentation.centralValue !== undefined) {
        const value = typeof presentation.centralValue === 'number'
          ? presentation.centralValue.toLocaleString('en-US', { maximumFractionDigits: 1 })
          : String(presentation.centralValue);
        const centralText = presentation.centralDisplayValue || [value, presentation.unit].filter(Boolean).join(' ');
        const centralSize = Math.max(style.typography.centralValue.min, Math.min(104, style.typography.centralValue.max));
        ctx.fillStyle = style.colors.accent;
        ctx.font = `700 ${centralSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        const centralLines = wrapSocialExportText(ctx, centralText, contentWidth, 2);
        centralLines.forEach((line, index) => ctx.fillText(line, margin, contentTop + 4 + index * (centralSize + 8)));
        contentTop += centralLines.length * (centralSize + 8) + 10;
      }

      const contextItems = target.kind === 'pb-tile'
        ? [
          ...(presentation.summary ? [presentation.summary] : []),
          ...(presentation.sourceAttribution ? [`Source: ${presentation.sourceAttribution}`] : [])
        ]
        : target.key === 'paceMetrics' && presentation.summary
          ? [presentation.summary]
        : (presentation.context || []).map(item => `${item.label}: ${item.value}`);
      if (target.seriesCount > 1) contextItems.push(`Page ${target.seriesPage} of ${target.seriesCount}`);
      const contextText = contextItems.join('  ·  ');
      if (contextText) {
        ctx.fillStyle = style.colors.secondary;
        ctx.font = `600 ${style.typography.context}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        const contextLines = wrapSocialExportText(ctx, contextText, contentWidth, 2);
        contextLines.forEach((line, index) => ctx.fillText(line, margin, contentTop + index * 36));
        contentTop += contextLines.length * 36 + 20;
      }

      const milestones = target.kind === 'pb-tile' ? []
        : Array.isArray(presentation.milestones) ? presentation.milestones.slice(0, 3) : [];
      if (milestones.length) {
        ctx.fillStyle = '#d1e5e3';
        ctx.font = '500 28px system-ui, -apple-system, "Segoe UI", sans-serif';
        const milestoneText = milestones
          .map(item => `${item.kind}: ${item.displayValue || item.value}${item.title ? ` · ${item.title}` : ''}`)
          .join('  ·  ');
        const milestoneLines = wrapSocialExportText(ctx, milestoneText, contentWidth, 2);
        milestoneLines.forEach((line, index) => ctx.fillText(line, margin, contentTop + index * 34));
        contentTop += milestoneLines.length * 34 + 12;
      }

      if (presentation.secondaryLine) {
        ctx.fillStyle = style.colors.secondary;
        ctx.font = `500 ${style.typography.context}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        const humorLines = wrapSocialExportText(ctx, presentation.secondaryLine, contentWidth, 1);
        humorLines.forEach(line => ctx.fillText(line, margin, contentTop));
        contentTop += humorLines.length * 36 + 12;
      }

      const legendItems = presentation.series?.length
        ? [...presentation.series, ...(presentation.trendLines || []).map(item => ({ ...item, line: true }))]
        : target.legend?.items || [];
      const legendRows = [];
      let row = [];
      let rowWidth = 0;
      ctx.font = `500 ${style.typography.context}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      legendItems.forEach(item => {
        const label = String(item.label || '');
        const entryWidth = 40 + ctx.measureText(label).width + 20;
        if (row.length && rowWidth + entryWidth > contentWidth) {
          legendRows.push(row);
          row = [];
          rowWidth = 0;
        }
        row.push({ ...item, label });
        rowWidth += entryWidth;
      });
      if (row.length) legendRows.push(row);

      const annotationHeight = target.pinnedSelection ? getExportTooltipLayout(ctx, target, contentWidth).height : 0;
      const legendTitleHeight = legendItems.length && target.legend?.title ? 38 : 0;
      const legendHeight = legendRows.length * 38 + legendTitleHeight;
      const footerHeight = 88;
      const layout = window.exportUtils.computeSocialExportLayout(format, {
        safeMargin: margin,
        footerHeight,
        headerHeight: contentTop - 1,
        marginX: margin,
        topGap: 15,
        bottomMargin: margin + footerHeight + legendHeight + annotationHeight + 12
      });
      const visualization = layout.visualization;
      if (visualization.height <= 0) throw new RangeError('Export content cannot fit in the selected image format');

      const specialized = drawSpecializedExportVisualization(ctx, captured, target, visualization, format);
      const fit = specialized ? null : window.exportUtils.computeContainFit(captured.width, captured.height, visualization.width, visualization.height);
      const drawX = specialized ? visualization.x : visualization.x + (visualization.width - fit.drawWidth) / 2;
      const drawY = specialized ? visualization.y : visualization.y + (visualization.height - fit.drawHeight) / 2;
      if (!specialized) ctx.drawImage(captured, drawX, drawY, fit.drawWidth, fit.drawHeight);

      if (target.pinnedSelection) {
        const annotation = getExportTooltipLayout(ctx, target, contentWidth);
        const box = { x: margin, y: visualization.y + visualization.height + 8, width: contentWidth, height: annotation.height };
        ctx.fillStyle = '#10292b';
        ctx.fillRect(box.x, box.y, box.width, box.height);
        ctx.fillStyle = '#f1f5f9';
        ctx.font = `500 ${annotation.fontSize}px system-ui, sans-serif`;
        annotation.lines.forEach((line, index) => ctx.fillText(line, box.x + annotation.padding, box.y + annotation.padding + index * annotation.lineHeight));
      }

      let legendY = visualization.y + visualization.height + annotationHeight + 20;
      if (legendTitleHeight) {
        ctx.fillStyle = style.colors.secondary;
        ctx.font = `600 ${style.typography.context}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        ctx.fillText(target.legend.title, margin, legendY);
        legendY += legendTitleHeight;
      }
      legendRows.forEach(items => {
        let x = margin;
        items.forEach(item => {
          ctx.fillStyle = item.color || '#5eead4';
          if (item.line && ctx.beginPath) {
            ctx.beginPath();
            ctx.moveTo(x, legendY + 15);
            ctx.lineTo(x + 24, legendY + 15);
            ctx.strokeStyle = item.color || '#5eead4';
            ctx.lineWidth = 4;
            ctx.stroke();
          } else {
            ctx.fillRect(x, legendY + 4, 22, 22);
          }
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '500 30px system-ui, -apple-system, "Segoe UI", sans-serif';
          ctx.fillText(item.label, x + 32, legendY);
          x += 52 + ctx.measureText(item.label).width + 20;
        });
        legendY += 38;
      });

      if (assets.logo && assets.logo.naturalWidth > 0) {
        const logoBox = { x: margin, y: canvasHeight - margin - 40, width: 88, height: 40 };
        const logoFit = window.exportUtils.computeContainFit(assets.logo.naturalWidth, assets.logo.naturalHeight, logoBox.width, logoBox.height);
        ctx.drawImage(assets.logo, logoBox.x + logoFit.offsetX, logoBox.y + logoFit.offsetY, logoFit.drawWidth, logoFit.drawHeight);
      }
      ctx.fillStyle = style.colors.secondary;
      ctx.font = `500 ${style.typography.branding}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      ctx.fillText(EXPORT_DOMAIN, margin + 104, canvasHeight - margin - style.typography.branding - 8);
      return finalCanvas.toDataURL('image/png');
    }

    function getExportTooltipLayout(ctx, target, maxWidth) {
      const selected = target.pinnedSelection;
      ctx.font = '500 30px system-ui, sans-serif';
      const associationNote = selected.anchor.visibility === 'outside-view'
        ? 'Selected item is outside the current view'
        : selected.anchor.visibility === 'not-in-export' ? selected.anchor.associationLabel : '';
      return window.exportUtils.computeTooltipAnnotationLayout({ content: selected.content, maxWidth, maxHeight: 280, measureText: text => ctx.measureText(text), fontSize: 30, lineHeight: 36, padding: 16, associationNote });
    }

    function createExportCaptureSnapshot(targetEl, tabId, options = {}) {
      const adapter = window.dashboardTooltips?.adapters.get(tabId);
      const renderer = adapter?.snapshotCapture?.(options.chartCapture || {});
      const clonedTarget = targetEl.cloneNode ? targetEl.cloneNode(true) : { ...targetEl };
      const sourceCanvases = targetEl.tagName === 'CANVAS' ? [targetEl] : Array.from(targetEl.querySelectorAll?.('canvas') || []);
      const clonedCanvases = clonedTarget.tagName === 'CANVAS' ? [clonedTarget] : Array.from(clonedTarget.querySelectorAll?.('canvas') || []);
      sourceCanvases.forEach((canvas, index) => {
        const copy = clonedCanvases[index];
        if (!copy) throw new Error('Could not isolate the chart for export');
        const source = renderer?.sourceCanvas === canvas ? renderer.canvas : canvas;
        const width = canvas.width > 0 ? canvas.width : source.width;
        const height = canvas.height > 0 ? canvas.height : source.height;
        if (!(width > 0 && height > 0)) throw new Error('Visualization is not ready to export. Wait for it to finish rendering and try again.');
        copy.width = width;
        copy.height = height;
        copy.getContext('2d').drawImage(source, 0, 0, width, height);
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
      updateExportSeriesControls();
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function updateExportSeriesControls() {
      const controls = document.getElementById('exportPreviewSeriesControls');
      const status = document.getElementById('exportPreviewSeriesStatus');
      const previous = document.getElementById('exportPreviewSeriesPrevious');
      const next = document.getElementById('exportPreviewSeriesNext');
      const hasSeries = lastExportImages.length > 1;
      if (controls) controls.classList.toggle('hidden', !hasSeries);
      if (!hasSeries) return;
      if (status) status.textContent = `Page ${currentExportSeriesIndex + 1} of ${lastExportImages.length}`;
      if (previous) previous.disabled = currentExportSeriesIndex === 0;
      if (next) next.disabled = currentExportSeriesIndex >= lastExportImages.length - 1;
    }

    function updateExportFormatButtons() {
      const buttons = {
        square: document.getElementById('exportFormatSquare'),
        portrait: document.getElementById('exportFormatPortrait')
      };
      Object.entries(buttons).forEach(([format, button]) => {
        if (!button) return;
        const selected = format === selectedExportFormat;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('bg-teal-700', selected);
        button.classList.toggle('text-white', selected);
        button.classList.toggle('font-semibold', selected);
        button.classList.toggle('text-slate-300', !selected);
        button.classList.toggle('font-medium', !selected);
      });
    }

    async function composeCurrentExportImages(captureState) {
      const { captured, target, assets, pbOpening } = captureState;
      const pageTargets = getExportTargetPages({ ...target, format: selectedExportFormat });
      const formatCaptures = captureState.calendarCapturesByFormat?.[selectedExportFormat];
      const preparedImages = [];
      for (const [pageIndex, pageTarget] of pageTargets.entries()) {
        pageTarget.format = selectedExportFormat;
        const presentationKey = pageTarget.kind === 'pb-tile' ? 'pb-tile' : pageTarget.key;
        pageTarget.presentation = getSocialExportPresentation(presentationKey, {
          ...(pageTarget.exportData || {}),
          title: pageTarget.exportData?.title || pageTarget.title,
          metricLabel: pageTarget.exportData?.metricLabel || pageTarget.metricLabel
        }, { humorEnabled: selectedExportHumorEnabled });
        const dataUrl = drawExportComposition(formatCaptures?.[pageIndex] || captured, pageTarget, assets);
        preparedImages.push(await prepareExportImage(dataUrl, pageTarget, pbOpening));
      }
      lastExportImages = preparedImages;
      currentExportSeriesIndex = 0;
      lastExportedImage = preparedImages[0] || null;
      if (lastExportedImage) showExportPreviewModal(lastExportedImage.dataUrl);
    }

    async function setExportFormat(format) {
      const formatConfig = window.exportUtils.getExportFormatConfig(format);
      if (!formatConfig) throw new RangeError(`Unsupported export format: ${format}`);
      selectedExportFormat = formatConfig.key;
      updateExportFormatButtons();
      if (!lastExportCaptureState) return;
      await composeCurrentExportImages(lastExportCaptureState);
    }

    async function setExportHumorEnabled(enabled) {
      selectedExportHumorEnabled = enabled === true;
      const checkbox = document.getElementById('exportHumorEnabled');
      if (checkbox) checkbox.checked = selectedExportHumorEnabled;
      if (!lastExportCaptureState) return;
      await composeCurrentExportImages(lastExportCaptureState);
    }

    function setExportSeriesPage(direction) {
      if (lastExportImages.length < 2) return;
      const delta = direction === 'previous' ? -1 : direction === 'next' ? 1 : 0;
      currentExportSeriesIndex = Math.max(0, Math.min(lastExportImages.length - 1, currentExportSeriesIndex + delta));
      lastExportedImage = lastExportImages[currentExportSeriesIndex];
      const image = document.getElementById('exportPreviewImage');
      if (image) image.src = lastExportedImage.dataUrl;
      updateExportSeriesControls();
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
      lastExportImages = [];
      currentExportSeriesIndex = 0;
      lastExportCaptureState = null;
      updateExportSeriesControls();
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
      let filename = window.exportUtils.generateExportFilename(image.target, new Date())
        || 'trianalytica-export.png';
      if (image.target?.seriesCount > 1) {
        filename = filename.replace(/\.png$/i, '') + `-page-${image.target.seriesPage}-of-${image.target.seriesCount}.png`;
      }
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
          if (ownsPreview && currentExportSeriesIndex < lastExportImages.length - 1) {
            setExportSeriesPage('next');
          } else if (ownsPreview) {
            closeExportPreviewModal();
          }
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

      if (exportToastTimeoutId) clearTimeout(exportToastTimeoutId);
      exportToastTimeoutId = null;
      const previousToast = document.getElementById('exportToast');
      if (previousToast) {
        previousToast.textContent = '';
        previousToast.classList.add('hidden');
      }

      exportRequestState = 'capturing';
      const pbOpening = target.kind === 'pb-tile' && typeof pbDetailOpening !== 'undefined' ? pbDetailOpening : null;
      let snapshot = null;
      try {
        const tabId = target.kind === 'pb-tile' ? 'personalBests' : target.key;
        target = JSON.parse(JSON.stringify(target));
        target.format = selectedExportFormat;
        target.pinnedSelection = window.dashboardTooltips?.getPinned(tabId) || null;
        const heatmapPalette = document.getElementById('heatmapColorScheme')?.value;
        if (target.key === 'wordcloud') {
          if (!window.wordcloudDashboard.hasExportableCloud()) throw new Error('The Wordcloud is not ready to export. Wait for the cloud to finish rendering and try again.');
        }
        const chartCapture = ['totalDistance', 'paceMetrics', 'distributions', 'workoutTime'].includes(tabId)
          ? { width: 960, height: 500, minFontSize: 30, ...(tabId === 'workoutTime' ? { axisTextColor: '#f8fafc' } : {}) }
          : undefined;
        snapshot = createExportCaptureSnapshot(targetEl, tabId, { chartCapture });
        if (window.tooltipSelectionUtils) target = window.tooltipSelectionUtils.freezePlain(window.tooltipSelectionUtils.copyPlain(target));
        await snapshot.prepare();
        await waitForExportFonts();
        const assets = await loadExportAssets();

        const createCaptureOptions = pageTarget => ({
          backgroundColor: '#020617',
          useCORS: true,
          logging: false,
          windowWidth: ['pieCharts', 'heatmap'].includes(target.key) ? Math.max(window.innerWidth || 0, 1200) : undefined,
          onclone: clonedDocument => {
            const clonedTarget = clonedDocument.getElementById(snapshot.element.id || target.targetElementId)
              || clonedDocument.getElementById(target.targetElementId);
            if (!clonedTarget) return;
            clonedTarget.style.border = 'none';
            clonedTarget.style.borderRadius = '0px';
            clonedTarget.style.backgroundColor = 'transparent';
            clonedTarget.style.boxShadow = 'none';
            clonedTarget.style.outline = 'none';
            clonedTarget.style.padding = '0px';
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
                svg.querySelectorAll('[data-export-role]').forEach(label => {
                  const role = label.getAttribute('data-export-role');
                  const minimum = role === 'result' ? 44 : 36;
                  const fontSize = Number(label.getAttribute('font-size')) || 0;
                  if (fontSize < minimum) label.setAttribute('font-size', String(minimum));
                });
                svg.querySelectorAll('[data-pb-callout]').forEach(callout => {
                  const rect = callout.querySelector('rect');
                  const result = callout.querySelector('[data-export-role="result"]');
                  const descriptions = Array.from(callout.querySelectorAll('[data-export-role="description"]'));
                  if (!rect || !descriptions.length) return;
                  const description = descriptions.map(label => label.textContent.trim()).filter(Boolean).join(' ');
                  const boxWidth = Number(rect.getAttribute('width')) || 220;
                  const maxCharacters = Math.max(8, Math.floor((boxWidth - 18) / 20));
                  const lines = [];
                  let line = '';
                  description.split(/\s+/).filter(Boolean).forEach(word => {
                    if (word.length > maxCharacters) {
                      if (line) { lines.push(line); line = ''; }
                      for (let index = 0; index < word.length; index += maxCharacters) {
                        lines.push(word.slice(index, index + maxCharacters));
                      }
                      return;
                    }
                    const candidate = line ? `${line} ${word}` : word;
                    if (candidate.length > maxCharacters && line) { lines.push(line); line = word; }
                    else line = candidate;
                  });
                  if (line) lines.push(line);
                  const firstDescription = descriptions[0];
                  const rectY = Number(rect.getAttribute('y')) || 0;
                  if (lines.length) {
                    firstDescription.setAttribute('y', String(rectY + 78));
                    firstDescription.setAttribute('font-size', '36');
                    firstDescription.replaceChildren(...lines.map((text, index) => {
                      const tspan = clonedDocument.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                      tspan.setAttribute('x', firstDescription.getAttribute('x'));
                      tspan.setAttribute('dy', index === 0 ? '0' : '36');
                      tspan.textContent = text;
                      return tspan;
                    }));
                    firstDescription.setAttribute('data-export-line-count', String(lines.length));
                    descriptions.slice(1).forEach(label => label.remove());
                  }
                  const height = Math.max(Number(rect.getAttribute('height')) || 0, 64 + lines.length * 36);
                  rect.setAttribute('height', String(height));
                  if (result) result.setAttribute('y', String(rectY + 44));
                  const connector = callout.querySelector('[data-pb-connector]');
                  if (connector) {
                    const side = callout.getAttribute('data-pb-side');
                    const rectX = Number(rect.getAttribute('x')) || 0;
                    const rectWidth = Number(rect.getAttribute('width')) || 0;
                    connector.setAttribute('x2', String(side === 'right' ? rectX : rectX + rectWidth));
                    connector.setAttribute('y2', String(rectY + Math.min(height - 8, height / 2)));
                  }
                });
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
              clonedTarget.style.maxWidth = 'none';
              clonedTarget.querySelectorAll?.('.leaflet-control-zoom').forEach(control => control.remove());
              if (heatmapPalette === 'black-fire') {
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
            const years = pageTarget?.exportData?.years || target.exportData?.years || [];
            const calendarScale = pageTarget?.exportData?.scale || target.exportData?.scale;
            const selectedYears = new Set(years.map(year => String(year.year)));
            const intensityByDate = new Map(years.flatMap(year => (year.days || [])
              .map(day => [String(day.dateKey), day.intensityLevel])));
            const yearSections = Array.from(clonedTarget.querySelectorAll('[data-calendar-year]'));
            yearSections.forEach(section => {
              const year = String(section.dataset.calendarYear || section.getAttribute('data-calendar-year') || '');
              const included = selectedYears.size === 0 || selectedYears.has(year);
              section.style.display = included ? '' : 'none';
              if (!included) return;
              section.querySelectorAll('[data-date-key]').forEach(day => {
                const level = intensityByDate.get(String(day.dataset.dateKey)) || 0;
                const color = calendarScale?.colors?.[level];
                if (color) day.style.backgroundColor = color;
              });
              const heading = section.querySelector('h3');
              if (heading) Object.assign(heading.style, {
                color: '#f8fafc',
                fontSize: '30px',
                fontWeight: '700',
                lineHeight: '36px',
                marginBottom: '8px'
              });
            });
            const includedSections = yearSections.filter(section => section.style.display !== 'none');
            const regions = Array.from(clonedTarget.querySelectorAll('[role="region"]'));
            const captureWidth = Math.max(clonedTarget.clientWidth, ...regions.map(region => region.scrollWidth));
            const sectionsHeight = includedSections.reduce((height, section) => height
              + (section.offsetHeight || section.getBoundingClientRect?.().height || Number(target.exportData?.yearSectionHeight) || 180), 0);
            const legendHeight = clonedTarget.querySelector('#trainingCalendarLegend')?.getBoundingClientRect?.().height || 24;
            clonedTarget.style.height = `${Math.ceil(sectionsHeight + Math.max(0, includedSections.length - 1) * 8 + legendHeight + 8)}px`;
            clonedTarget.style.minHeight = '0px';
            clonedTarget.style.maxHeight = 'none';
            regions.forEach(region => {
              region.style.overflow = 'visible';
              region.style.width = `${region.scrollWidth}px`;
              region.style.maxWidth = 'none';
            });
            clonedTarget.style.width = `${captureWidth}px`;
            clonedTarget.style.maxWidth = 'none';
          }
        });
        const capture = pageTarget => html2canvas(snapshot.element, createCaptureOptions(pageTarget));
        let captured;
        let calendarCapturesByFormat = null;
        if (target.key === 'trainingCalendar') {
          calendarCapturesByFormat = {};
          for (const format of ['square', 'portrait']) {
            const pages = getExportTargetPages({ ...target, format });
            calendarCapturesByFormat[format] = [];
            for (const page of pages) calendarCapturesByFormat[format].push(await capture(page));
          }
          captured = calendarCapturesByFormat[selectedExportFormat]?.[0];
        } else {
          const captureCurrentTarget = () => capture();
          captured = target.key === 'heatmap'
            && window.heatmapDashboard
            && typeof window.heatmapDashboard.captureAtExportSize === 'function'
            ? await window.heatmapDashboard.captureAtExportSize(captureCurrentTarget)
            : await captureCurrentTarget();
        }
        lastExportCaptureState = { captured, target, assets, pbOpening, calendarCapturesByFormat };
        await composeCurrentExportImages(lastExportCaptureState);

        exportRequestState = 'previewing';
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
      const exportData = window.personalBestsDashboard?.getActiveExportData?.() || {};
      const presentation = getSocialExportPresentation('pb-tile', { ...exportData, title: model?.title, metricLabel: model?.axisLabel });
      const target = hasData ? window.exportUtils.createExportTarget({
        kind: 'pb-tile',
        key: model.exportKey || model.title,
        title: presentation.headline,
        targetElementId: 'pbDetailCaptureTarget',
        hasData: true,
        filters: [{ label: 'Metric', value: model.axisLabel }],
        availableControls: getAvailableControlContext('personalBests'),
        metricLabel: model.axisLabel,
        detailKey: model.exportKey || model.title
      }) : null;
      if (target) {
        target.presentation = presentation;
        target.exportData = exportData;
      }
      return exportVisualizationTarget(target);
    }
