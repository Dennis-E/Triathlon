    // --- Branded visualization export (specs/008-enhanced-visualization-export) ---

    let exportRequestState = 'idle'; // idle | checking | blocked-no-data | capturing | previewing | capture-failed
    let exportToastTimeoutId = null;
    let lastExportedImage = null; // { dataUrl, target }
    let lastExportImages = [];
    let currentExportSeriesIndex = 0;
    let selectedExportFormat = 'story';
    let selectedExportHumorEnabled = false;
    let exportPunchlineSelection = null;
    let exportCompositionPending = false;
    let lastExportCaptureState = null;
    let exportAssetsPromise = null;
    let exportDownloadAttempt = null;
    let exportSessionSequence = 0;
    let exportCaptureGeneration = 0;

    const EXPORT_CAPTURE_TARGET_IDS = {
      totalDistance: 'totalDistanceChartWrapper',
      paceMetrics: 'paceMetricsChartWrapper',
      heartRate: 'heartRateChartWrapper',
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

    let exportSelectionSequence = 0;
    let exportDatasetSequence = 0;
    const exportDatasetIdentities = new WeakMap();
    const EXPORT_FAMILY_RENDERERS = Object.create(null);
    const EXPORT_ADAPTERS = Object.freeze(Object.fromEntries(Object.keys(EXPORT_CAPTURE_TARGET_IDS).map(key => [key, {
      captureSelection: (target, data, context) => captureExportSelection(target, data, context),
      renderPage: (...args) => {
        if (!args[0]?.snapshot || !args[0]?.context || !args[0]?.page) throw new Error('Export renderer input is not ready');
        const renderer = EXPORT_FAMILY_RENDERERS[key];
        if (typeof renderer !== 'function') throw new Error(`Export renderer is not ready for ${key}`);
        return renderer(...args);
      }
    }])));

    function captureExportSelection(target, data = {}, context = {}) {
      const targetKey = target?.kind === 'pb-tile' ? 'personalBests' : target?.key;
      if (!EXPORT_CAPTURE_TARGET_IDS[targetKey]) throw new RangeError('Unknown export target');
      if (target.hasData !== true) throw new Error('No data available for export');
      const dataset = context.dataset;
      let datasetIdentity = 'dataset-none';
      if (dataset && typeof dataset === 'object') {
        if (!exportDatasetIdentities.has(dataset)) exportDatasetIdentities.set(dataset, `dataset-${++exportDatasetSequence}`);
        datasetIdentity = exportDatasetIdentities.get(dataset);
      }
      const equipmentNames = ['equipment', 'equipmentTimeline'].includes(targetKey);
      const locationAllowed = targetKey === 'heatmap' || (targetKey === 'mediaGallery' && data.includeRoutes === true);
      const fields = new Set([
        'sport', 'metric', 'metricLabel', 'unit', 'period', 'periodLabels', 'aggregation', 'series',
        'trendLines', 'items', 'years', 'palette', 'scale', 'best', 'milestones', 'records',
        'firstRecord', 'currentRecord', 'recordCount', 'firstRecordYear', 'title', 'sourceAttribution',
        'xAxisTitle', 'yAxisTitle', 'pointSizeMeaning', 'centralValue', 'centralDisplayValue',
        'incompleteYear', 'rankingBy', 'equipmentFilter', 'mode', 'periodMeaning', 'groupBy',
        'resolution', 'definitions', 'points', 'bins', 'slices', 'summary', 'coverage', 'metricKind',
        'axisMode', 'xAxisMode', 'durationSeconds', 'durationLabel', 'viewBounds', 'viewport',
        'dates', 'days', 'totals', 'domain', 'visibility', 'frequencies', 'filters', 'colorScheme',
        'year', 'selectedYears', 'sourceType', 'scope', 'selectedAssetKeys', 'mediaKind',
        'includeRoutes', 'eligibleCount', 'displayedCount', 'legend', 'groups', 'words', 'weightDomain',
        'periodStart', 'periodEnd', 'totalCount', 'scaleStart', 'scaleEnd', 'granularity',
        'rawUnit', 'valueDivisor', 'status', 'activityCount', 'excludedCount', 'denominator',
  'countrySummary', 'preparationVersion', 'definitionKey', 'periodCount', 'punchlineEvidence', 'startTimeAnalysis'
      ]);
      const forbidden = new Set(['rawActivities', 'rawActivity', 'activity', 'activityName', 'activityTitle', 'workoutTitle',
        'sourceElement', 'element', 'canvas', 'chart', 'document', 'filename', '__proto__', 'constructor', 'prototype']);
      const locationFields = new Set(['lat', 'lon', 'latitude', 'longitude', 'coordinates']);
      const ancestors = new Set();
      const pbSourcePath = path => targetKey === 'personalBests'
        && /^(?:groups\.\d+\.)?(?:records\.\d+|best|firstRecord|currentRecord|milestones\.\d+)\.source$/.test(path.join('.'));
      const copyPbSource = value => {
        if (value === null) return null;
        if (!value || Object.prototype.toString.call(value) !== '[object Object]') throw new TypeError('Invalid PB source schema');
        const title = value.workoutTitle ?? null;
        const kind = value.kind ?? 'unknown';
        const estimated = value.estimated ?? false;
        if ((title !== null && typeof title !== 'string') || !['modeled', 'full-activity', 'fit-rolling', 'unknown'].includes(kind)
            || typeof estimated !== 'boolean') throw new TypeError('Invalid PB source title or schema');
        const date = value.activityDate === null || value.activityDate === undefined ? null
          : Object.prototype.toString.call(value.activityDate) === '[object Date]' ? value.activityDate.getTime() : value.activityDate;
        if (date !== null && (typeof date !== 'number' || !Number.isFinite(date))) throw new TypeError('Invalid PB source date');
        const result = { workoutTitle: title, activityDate: date, kind, estimated };
        if (value.sourceDistanceKm !== undefined) {
          if (!Number.isFinite(value.sourceDistanceKm) || value.sourceDistanceKm <= 0) throw new TypeError('Invalid PB source distance');
          result.sourceDistanceKm = value.sourceDistanceKm;
        }
        return Object.freeze(result);
      };
      const copy = (value, depth = 0, path = []) => {
        if (value === null || value === undefined || typeof value === 'string' || typeof value === 'boolean') return value;
        if (typeof value === 'number') {
          if (!Number.isFinite(value)) throw new TypeError('Invalid numeric export content');
          return value;
        }
        if (Object.prototype.toString.call(value) === '[object Date]') {
          const epoch = value.getTime();
          if (!Number.isFinite(epoch)) throw new TypeError('Invalid export date');
          return epoch;
        }
        if (typeof value !== 'object' || value.nodeType || value.tagName
            || (!Array.isArray(value) && Object.prototype.toString.call(value) !== '[object Object]')
            || ancestors.has(value)) throw new TypeError('Export content must contain plain acyclic values');
        ancestors.add(value);
        let result;
        if (Array.isArray(value)) {
          result = value.map((item, index) => copy(item, depth + 1, [...path, String(index)]));
        } else {
          result = {};
          for (const [key, entry] of Object.entries(value)) {
            const entryPath = [...path, key];
            if (key === 'source' && pbSourcePath(entryPath)) {
              result.source = copyPbSource(entry);
              continue;
            }
            if (forbidden.has(key) || (locationFields.has(key) && !locationAllowed)
                || (key === 'name' && !equipmentNames)
                || (key === 'title' && depth > 0 && !(targetKey === 'personalBests' && typeof value.definitionKey === 'string'))
                || (key === 'activities' && targetKey !== 'equipmentTimeline')) continue;
            if (key === 'activities' && Array.isArray(entry) && entry.some(item => item && typeof item === 'object'
                && Object.prototype.toString.call(item) !== '[object Date]')) throw new TypeError('Timeline export content requires activity dates, not activity objects');
            result[key] = copy(entry, depth + 1, entryPath);
          }
        }
        ancestors.delete(value);
        return Object.freeze(result);
      };
      const familyData = copy(Object.fromEntries(Object.entries(data).filter(([key]) => fields.has(key)
        && (key !== 'startTimeAnalysis' || targetKey === 'workoutTime'))));
      return Object.freeze({
        selectionId: `selection-${++exportSelectionSequence}`,
        datasetIdentity, targetKey, targetKind: target.kind || 'tab',
        variantKey: target.detailKey || context.variantKey || target.key,
        capturedAt: Date.now(), filters: copy(target.filters || []),
        period: familyData.period ?? null, metric: familyData.metric ?? familyData.metricLabel ?? null,
        units: familyData.unit ?? null, familyData,
        legend: copy(target.legend || familyData.legend || null),
        provenance: copy(target.sampleProvenance || null),
        attribution: copy(context.attribution || null),
        disclosure: copy(context.disclosure || {}),
        pbOpening: context.pbOpening ?? null
      });
    }

    const EXPORT_DOMAIN = window.exportUtils.getExportBrandConfig().domain;

    function getExportDashboardDataRevision() {
      return typeof dashboardDataRevision === 'number' ? dashboardDataRevision : null;
    }

    function isCurrentExportCapture(captureState) {
      if (!captureState) return false;
      return (captureState.captureGeneration === undefined || captureState.captureGeneration === exportCaptureGeneration) &&
        (captureState.dashboardDataRevision === null || captureState.dashboardDataRevision === undefined ||
          captureState.dashboardDataRevision === getExportDashboardDataRevision()) &&
        (captureState.heartRateRevision === undefined || captureState.heartRateSnapshotPublished === true ||
          captureState.heartRateRevision === window.heartRateDashboard?.getRevision?.());
    }

    function invalidateHeartRateExport(hasData) {
      const state = lastExportCaptureState;
      if (state?.snapshot?.targetKey !== 'heartRate') return;
      if (!hasData || !state.heartRateSnapshotPublished) closeExportPreviewModal();
    }

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
        heartRate: !!window.heartRateDashboard?.getExportData?.(),
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
        'vizTabHeartRate',
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
        heartRate: [
          getSelectControlGroup('Sport', 'heartRateSportFilter'),
          getSelectControlGroup('Calendar grouping', 'heartRateAggregationFilter'),
          getSelectControlGroup('Timeframe', 'heartRateTimeframeFilter')
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
          getSelectControlGroup('Year', 'heatmapYear'),
          getSelectControlGroup('Color scheme', 'heatmapColorScheme')
        ],
        workoutTime: [
          getControlGroup('Granularity', ['workoutTimeGranularityBtnDay', 'workoutTimeGranularityBtnWeek', 'workoutTimeGranularityBtnMonth', 'workoutTimeGranularityBtnYear']),
          getControlGroup('Sport', ['workoutTimeSportBtnAll', 'workoutTimeSportBtnRun', 'workoutTimeSportBtnBike', 'workoutTimeSportBtnSwim']),
          getControlGroup('Measure', ['workoutTimeMeasureBtnCount', 'workoutTimeMeasureBtnDuration', 'workoutTimeMeasureBtnDistance'])
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
        ]
      };
      return window.exportUtils.summarizeAvailableControls(groups.concat(tabGroups[tabName] || []));
    }

    function getExportContext(tabName) {
      const heartRateData = tabName === 'heartRate' ? window.heartRateDashboard?.getExportData?.() : null;
      const contexts = {
        heartRate: [
          { label: 'Sport', value: heartRateData?.sport === 'All' ? 'All sports' : heartRateData?.sport },
          { label: 'Date range', value: heartRateData?.period },
          { label: 'Grouping', value: heartRateData?.aggregation ? heartRateData.aggregation[0].toUpperCase() + heartRateData.aggregation.slice(1) : null },
          { label: 'Metric', value: 'Minimum / maximum heart rate' },
          { label: 'Unit', value: 'bpm' }
        ],
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
          { label: 'Year', value: document.getElementById('heatmapYear')?.selectedOptions[0]?.textContent.trim() },
          { label: 'Color scheme', value: document.getElementById('heatmapColorScheme')?.selectedOptions[0]?.textContent.trim() }
        ],
        workoutTime: [
          { label: 'Granularity', value: getActiveButtonText(['workoutTimeGranularityBtnDay', 'workoutTimeGranularityBtnWeek', 'workoutTimeGranularityBtnMonth', 'workoutTimeGranularityBtnYear']) },
          { label: 'Sport', value: getActiveButtonText(['workoutTimeSportBtnAll', 'workoutTimeSportBtnRun', 'workoutTimeSportBtnBike', 'workoutTimeSportBtnSwim']) },
          { label: 'Measure', value: getActiveButtonText(['workoutTimeMeasureBtnCount', 'workoutTimeMeasureBtnDuration', 'workoutTimeMeasureBtnDistance']) },
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
        const selectedSport = ({ Run: 'Run', Bike: 'Bike', Swim: 'Swim' })[data.sport] || 'Training';
        const aggregation = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }[data.aggregation];
        const selectedMetric = String(data.metricLabel || metric || 'Distance').toLowerCase();
        headline = `${selectedSport} ${selectedMetric}${aggregation ? ` by ${aggregation}` : ''}`;
      } else if (tabName === 'equipment') {
        const category = data.equipmentFilter === 'Shoes' ? 'Shoe'
          : data.equipmentFilter === 'Bikes' ? 'Bike' : 'Equipment';
        headline = `${category} ${String(metric || 'activity').toLowerCase()} ranking`;
      } else if (tabName === 'equipmentTimeline') {
        const category = data.equipmentFilter === 'Shoes' ? 'Shoe'
          : data.equipmentFilter === 'Bikes' ? 'Bike' : 'Equipment';
        const mode = data.mode === 'activities' ? 'activity' : 'usage';
        headline = `${category} ${mode} timeline`;
      } else if (tabName === 'personalBests' || tabName === 'pb-tile') {
        const recordTitle = String(data.title || '').trim();
        headline = /^PB:/i.test(recordTitle) ? recordTitle : recordTitle ? `PB: ${recordTitle}` : 'My personal bests';
        if (data.best && Number.isFinite(data.best.value)) centralValue = data.best.value;
      } else if (tabName === 'heatmap') {
        headline = `${sport && sport !== 'All sports' ? sport + ' ' : ''}route heatmap`;
      } else if (tabName === 'paceMetrics') {
        const measure = metric || 'Heart rate';
        const performance = data.sport === 'Bike' ? 'speed' : 'pace';
        headline = `My ${measure.toLowerCase()} vs ${performance}`;
      } else if (tabName === 'heartRate') {
        headline = `${data.aggregation ? data.aggregation[0].toUpperCase() + data.aggregation.slice(1) + ' ' : ''}heart-rate minimum and maximum`;
        if (!data.aggregation) headline = 'Heart-rate minimum and maximum';
      } else {
        headline = {
          distributions: `${sport && sport !== 'All sports' ? sport + ' ' : ''}${String(metric || 'training').toLowerCase()} distribution`,
          workoutTime: `${sport && sport !== 'All sports' ? sport + ' ' : ''}${String(metric || 'workouts').toLowerCase()} by $granularity`,
          trainingCalendar: `${sport && sport !== 'All sports' ? sport + ' ' : ''}${String(data.metricLabel || 'training frequency').replace(/^daily\s+/i, '').toLowerCase()} calendar`,
          wordcloud: `Workout title frequency: ${Number(data.wordCount) || data.words?.length || 'selected'} words`,
          pieCharts: `Activities by ${String(data.groupBy || 'category').toLowerCase()}`,
          lifetimeStatistics: 'Lifetime training summary',
          mediaGallery: data.mediaKind === 'annual' ? `${data.period || 'Annual'} training media recap` : 'Training media collage'
        }[tabName] || 'Training visualization';
      }

      if (tabName === 'workoutTime') {
        const pattern = { day: 'start time', week: 'weekday', month: 'day of month', year: 'month' }[data.granularity];
        headline = pattern ? headline.replace('$granularity', pattern) : `${sport} workout measure`;
      }

      let secondaryLine = null;
      if (options.humorEnabled) {
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
        } else if (tabName === 'heartRate') {
          secondaryLine = 'Some highs and lows, accurately recorded.';
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
        secondaryLine ||= ({
          totalDistance: 'One session at a time.', paceMetrics: 'Dots, not destiny.',
          equipment: 'Good gear earns its keep.', equipmentTimeline: 'Every era starts somewhere.'
        })[tabName] || 'The data got a little personality.';
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
      if (tabName === 'trainingCalendar') addContext('Intensity', 'Yearly scale; empty = no record');
      if (tabName === 'heatmap' && data.scale?.hasRange) {
        addContext('Route frequency', `${data.scale.minCount}-${data.scale.maxCount} traversals per segment; logarithmic colour`);
      }
      if (tabName === 'mediaGallery') {
        addContext('Media selection', `${data.displayedCount || 0} of ${data.eligibleCount || 0} readable items`);
        if (data.includeRoutes) addContext('Routes', 'Included by selection');
      }
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
        const datedRecords = data.records?.length ? data.records : [firstRecord, currentRecord].filter(Boolean);
        const observedDays = new Set(datedRecords.flatMap(record => {
          const value = record.date ?? record.source?.activityDate;
          if (value === null || value === undefined || value === '') return [];
          const date = new Date(value);
          return Number.isFinite(date.getTime()) ? [date.toDateString()] : [];
        }));
        if (data.xAxisMode !== 'duration' && recordCount > 1 && (observedDays.size > 1 || !data.records?.length)
          && firstRecord?.displayValue && currentRecord?.displayValue) {
          const firstDate = firstRecord.date ? new Date(firstRecord.date) : null;
          const firstYear = Number.isInteger(data.firstRecordYear) ? data.firstRecordYear
            : firstDate && Number.isFinite(firstDate.getTime()) ? firstDate.getFullYear() : null;
          summary = `From ${firstRecord.displayValue} to ${currentRecord.displayValue}${firstYear ? ` since ${firstYear}` : ''}`;
        }
        sourceAttribution = data.sourceAttribution || data.best?.sourceType || currentRecord?.sourceType || null;
        if (typeof sourceAttribution === 'string') {
          sourceAttribution = sourceAttribution.split(/,\s*/).map(source => ['modeled', 'full-activity', 'fit-rolling'].includes(source)
            ? window.exportUtils.getPbExportSourceLabel({ sourceType: source }) : source).join(', ');
        }
      }
      if (tabName === 'heatmap' && data.scale?.hasRange) {
        summary = `${data.scale.minCount}-${data.scale.maxCount} traversals per segment; logarithmic colour scale`;
      }
      if (tabName === 'mediaGallery') {
        summary = `${data.displayedCount || 0} of ${data.eligibleCount || 0} readable media items`;
      }

      const compactParts = [];
      const compactValue = value => String(value ?? '').trim().replace(/\b(\d{4})\s*[-–]\s*(\d{4})\b/g,
        (_match, firstYear, lastYear) => firstYear === lastYear ? firstYear : `${firstYear}–${lastYear}`);
      const semanticValue = value => String(value || '').toLowerCase().replace(/^average\s+/, '').replace(/^daily\s+/, '')
        .replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
      const semanticHeadline = semanticValue(headline);
      const visibleSummary = tabName === 'paceMetrics' ? '' : compactValue(summary);
      const addCompactPart = value => {
        const text = compactValue(value);
        if (text && !compactParts.some(part => part.toLowerCase() === text.toLowerCase())) compactParts.push(text);
      };
      if (visibleSummary) addCompactPart(visibleSummary);
      for (const item of context) {
        const value = compactValue(item.value);
        if ((item.label === 'Sport' && /^(all|all sports)$/i.test(value))
            || (item.label === 'Resolution' && /blocks/i.test(value))
            || ['X axis', 'Y axis'].includes(item.label)
            || (item.label === 'Media selection' && visibleSummary)
            || (['Sport', 'Metric', 'Period'].includes(item.label) && semanticHeadline.includes(semanticValue(value)))
            || (visibleSummary && visibleSummary.toLowerCase().includes(value.toLowerCase()))
            || (item.label === 'Unit' && [...compactParts, data.xAxisTitle, data.yAxisTitle]
              .some(axis => String(axis || '').includes(`(${value})`)))) continue;
        addCompactPart(item.label === 'Point size' ? `Size = ${value}` : value);
      }
      const axes = [data.xAxisTitle, data.yAxisTitle].filter(Boolean)
        .map(axis => String(axis).replace(/\s*\([^)]*\)\s*$/, '').trim());
      if (axes.length && !axes.every(axis => semanticHeadline.includes(semanticValue(axis)))) addCompactPart(axes.join(' vs '));

      return {
        ...window.exportUtils.createSocialExportMetadata({ headline, context, secondaryLine }),
        ...(options.humorEnabled && typeof options.punchlineText === 'string'
          ? { secondaryLine: options.punchlineText } : {}),
        contextText: compactParts.join(' · '),
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
        heartRate: () => window.heartRateDashboard?.getExportData?.(),
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

    function projectExportPunchlineEvidence(snapshot) {
      return window.exportPunchlineUtils.projectExportPunchlineEvidence(snapshot);
    }

    function getStructuredExportData(tabName, kind = 'tab') {
      const providers = {
        totalDistance: () => window.totalDistanceDashboard?.getExportData?.(),
        paceMetrics: () => window.paceMetricsDashboard?.getExportData?.(),
        heartRate: () => window.heartRateDashboard?.getExportData?.(),
        equipment: () => window.equipmentDashboard?.getExportModel?.('ranking'),
        equipmentTimeline: () => window.equipmentDashboard?.getExportModel?.('timeline'),
        personalBests: () => kind === 'pb-tile' ? window.personalBestsDashboard?.getActiveExportData?.()
          : window.personalBestsDashboard?.getOverviewExportData?.(),
        heatmap: () => window.heatmapDashboard?.getExportData?.(),
        distributions: () => window.distributionsDashboard?.getExportData?.(),
        workoutTime: () => window.workoutTimeDashboard?.getExportData?.(),
        trainingCalendar: () => window.trainingCalendarDashboard?.getExportData?.(),
        wordcloud: () => window.wordcloudDashboard?.getExportData?.(),
        pieCharts: () => window.pieChartsDashboard?.getExportData?.(),
        lifetimeStatistics: () => window.lifetimeStatisticsDashboard?.getExportData?.(),
        mediaGallery: () => window.mediaGalleryDashboard?.getExportData?.()
      };
      return providers[tabName]?.();
    }

    function initializeStructuredExportTarget(target, data) {
      if (data === undefined) return target;
      if (!data) return null;
      const key = target.kind === 'pb-tile' ? 'personalBests' : target.key;
      target.exportData = data;
      target.presentation = getSocialExportPresentation(target.kind === 'pb-tile' ? 'pb-tile' : key, data);
      target.selectionSnapshot = captureExportSelection(target, data, {
        dataset: typeof importedDataset !== 'undefined' ? importedDataset : null,
        pbOpening: target.kind === 'pb-tile' && typeof pbDetailOpening !== 'undefined' ? pbDetailOpening : null,
        attribution: key === 'heatmap' ? ['OpenStreetMap contributors', 'openstreetmap.org/copyright'] : null
      });
      target.structuredChartInput = data.chartInput || null;
      return target;
    }

    function getTabExportTarget(tabName) {
      if (typeof availableVisualizationTabs !== 'undefined' && Array.isArray(availableVisualizationTabs) &&
          !availableVisualizationTabs.includes(tabName)) return null;
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
        sampleProvenance: typeof importedDataset !== 'undefined' && importedDataset?.sourceType === 'sample'
          ? importedDataset.sampleProvenance : null,
        filters: getExportContext(tabName),
        availableControls: getAvailableControlContext(tabName),
        legend: tabName === 'heartRate' ? exportData.legend : tabName === 'paceMetrics' && window.paceMetricsDashboard
          ? {
            title: 'Years',
            items: window.paceMetricsDashboard.getExportSeries()
          }
          : window.exportUtils.getExportLegend(tabName),
        contentFit: tabName === 'lifetimeStatistics' ? 'lifetime-kpis' : undefined
      });
      target.presentation = presentation;
      target.exportData = exportData;
      return initializeStructuredExportTarget(target, getStructuredExportData(tabName));
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
      const start = 0;
      const visibleLabels = labels.slice(start);
      const totals = visibleLabels.map((_label, index) => series.reduce((sum, item) => sum + (Number(item.values[start + index]) || 0), 0));
      const maxValue = Math.max(1, Number(data.scaleMax) || 0, ...totals);
      ctx.font = `500 ${style.typography.axis}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      const axisWidth = Math.max(...Array.from({ length: 5 }, (_unused, tick) => ctx.measureText(`${Math.round(maxValue * tick / 4)} km`).width)) + 16;
      const plot = { x: bounds.x + axisWidth, y: bounds.y + 28, width: bounds.width - axisWidth - 14, height: bounds.height - 124 };
      if (plot.width <= 0 || plot.height <= 0) return false;
      const baseline = plot.y + plot.height;
      const step = plot.width / visibleLabels.length;
      const barWidth = Math.min(48, step * 0.62);
      ctx.font = `600 ${style.typography.axis}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      const widestLabel = Math.max(...visibleLabels.map(label => ctx.measureText(String(label)).width));
      const readableTickCount = Math.max(1, Math.floor(plot.width / (widestLabel + 16)));
      const labelCount = data.aggregation === 'yearly' ? visibleLabels.length : Math.min(6, readableTickCount, visibleLabels.length);
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
        const labelX = Math.max(bounds.x + labelWidth / 2,
          Math.min(bounds.x + bounds.width - labelWidth / 2, centerX));
        periodLines.forEach((line, lineIndex) => ctx.fillText(line, labelX, baseline + 12 + lineIndex * 44));
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

      if (target.sampleProvenance?.synthetic) {
        ctx.fillStyle = '#a7f3d0';
        ctx.font = '500 26px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.fillText('Synthetic sample training data', margin, contentTop);
        contentTop += 38;
        if (target.key === 'heatmap') {
          ctx.fillStyle = style.colors.secondary;
          ctx.font = '500 22px system-ui, -apple-system, "Segoe UI", sans-serif';
          ctx.fillText('OpenStreetMap contributors | https://www.openstreetmap.org/copyright', margin, contentTop);
          contentTop += 32;
        }
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

      const annotationHeight = 0;
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

    function renderDistanceExportPage({ context, snapshot, page }) {
      const data = snapshot.familyData;
      const selected = page.itemIndexes;
      const bounds = { ...page.visualization };
      if (selected.length === 1 && bounds.height > 420) {
        bounds.y += (bounds.height - 420) / 2; bounds.height = 420;
      }
      const rendered = drawDistanceExportChart(context, { ...data, scaleMax: page.scale.max,
        periodLabels: selected.map(index => data.periodLabels[index]),
        series: data.series.map(series => ({ ...series, values: selected.map(index => series.values[index]) })) }, bounds);
      if (!rendered) throw new Error('Distance export renderer has no readable plotting space');
    }

    function renderEquipmentExportPage({ context, snapshot, page }) {
      const style = window.exportUtils.getSocialExportStyleConfig();
      const data = snapshot.familyData;
      const timeline = snapshot.targetKey === 'equipmentTimeline';
      const bounds = page.visualization;
      const heights = page.rowHeights;
      if (timeline) {
        const startX = bounds.x + 12;
        const axisWidth = bounds.width - 24;
        const axisY = bounds.y + 48;
        const minimum = page.scale.min;
        const maximum = page.scale.max;
        const position = value => minimum === maximum ? startX + axisWidth / 2
          : startX + axisWidth * (value - minimum) / (maximum - minimum);
        context.strokeStyle = style.colors.secondary; context.lineWidth = 2;
        context.beginPath(); context.moveTo(startX, axisY); context.lineTo(startX + axisWidth, axisY); context.stroke();
        context.textAlign = 'center'; context.textBaseline = 'top'; context.fillStyle = style.colors.secondary;
        context.font = '600 36px system-ui, sans-serif';
        context.fillText('Year', bounds.x + bounds.width / 2, bounds.y);
        context.font = '500 36px system-ui, sans-serif';
        for (const tick of page.axisTicks || []) {
          const x = position(tick.value);
          context.beginPath(); context.moveTo(x, axisY - 5); context.lineTo(x, axisY + 6); context.stroke();
          const date = new Date(tick.date);
          const span = maximum - minimum;
          const label = span >= 2 * 365 * 86400000 ? String(date.getFullYear())
            : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          const halfLabelWidth = context.measureText(label).width / 2;
          const labelX = Math.max(bounds.x + halfLabelWidth, Math.min(bounds.x + bounds.width - halfLabelWidth, x));
          context.fillText(label, labelX, bounds.y + 50);
        }
      }
      let y = bounds.y + (timeline ? page.axisHeight : 0)
        + Math.max(0, (bounds.height - heights.reduce((sum, height) => sum + height, 0) - (timeline ? page.axisHeight : 0)) / 2);
      context.textAlign = 'left'; context.textBaseline = 'top';
      page.itemIndexes.forEach((itemIndex, rowIndex) => {
        const item = data.items[itemIndex];
        context.fillStyle = style.colors.headline;
        context.font = '600 36px system-ui, sans-serif';
        const rankWidth = timeline ? 0 : 84;
        if (!timeline) {
          context.fillStyle = itemIndex === 0 ? style.colors.rank : style.colors.secondary;
          context.fillText(`#${item.rank || itemIndex + 1}`, bounds.x, y);
          context.fillStyle = style.colors.headline;
        }
        const nameLines = window.exportUtils.wrapExportText(item.name, bounds.width - rankWidth,
          text => context.measureText(text).width, Infinity);
        nameLines.forEach((line, index) => context.fillText(line, bounds.x + rankWidth, y + index * 44));
        const contentY = y + nameLines.length * 44 + 12;
        if (timeline) {
          const xStart = bounds.x + 8;
          const width = bounds.width - 16;
          const min = page.scale.min;
          const max = page.scale.max;
          const position = value => min === max ? xStart + width / 2 : xStart + width * (value - min) / (max - min);
          context.strokeStyle = style.colors.grid; context.lineWidth = 3;
          context.beginPath(); context.moveTo(xStart, contentY + 12); context.lineTo(xStart + width, contentY + 12); context.stroke();
          context.fillStyle = item.type === 'Shoes' ? style.colors.rank : style.colors.accent;
          if (data.mode === 'activities') {
            for (const date of item.activities || []) {
              const x = position(date);
              context.fillRect(x - 3, contentY + 2, 6, 20);
            }
          } else {
            const start = position(item.firstDate);
            const end = position(item.lastDate);
            if (start === end) context.fillRect(start - 3, contentY + 2, 6, 20);
            else context.fillRect(start, contentY + 2, end - start, 20);
          }
          context.font = '500 36px system-ui, sans-serif'; context.fillStyle = style.colors.secondary;
          const startLabel = new Date(item.firstDate).toLocaleDateString('en-GB');
          const endLabel = new Date(item.lastDate).toLocaleDateString('en-GB');
          context.fillText(startLabel, bounds.x, contentY + 42);
          if (startLabel !== endLabel) context.fillText(endLabel, bounds.x + bounds.width - context.measureText(endLabel).width, contentY + 42);
        } else {
          const barX = bounds.x + rankWidth;
          const barWidth = bounds.width - rankWidth;
          context.fillStyle = style.colors.surface;
          context.fillRect(barX, contentY, barWidth, 24);
          context.fillStyle = itemIndex === 0 ? style.colors.rank : style.colors.accent;
          context.fillRect(barX, contentY, page.scale.max > 0 ? barWidth * item.value / page.scale.max : 0, 24);
          context.fillStyle = style.colors.headline; context.font = '600 36px system-ui, sans-serif';
          const label = item.displayValue || `${item.value}${data.unit ? ` ${data.unit}` : ''}`;
          context.fillText(label, barX, contentY + 40);
        }
        y += heights[rowIndex];
      });
    }

    function renderChartExportPage({ context, snapshot, page, resources }) {
      if (!resources?.chartAdapter || !resources.chartInput) throw new Error('Chart export renderer input is not ready');
      const bounds = page.visualization;
      const originalFont = context.font;
      const scales = Object.fromEntries(Object.entries(resources.chartInput.options?.scales || {}).map(([key, originalScale]) => {
        let scale = originalScale;
        const vertical = scale.axis === 'y' || key.startsWith('y');
        if (['paceMetrics', 'distributions', 'workoutTime'].includes(snapshot.targetKey) && !vertical) {
          const capacity = Math.max(2, Math.floor((bounds.width - 160) / 200));
          scale = { ...scale, ticks: { ...scale.ticks, autoSkip: true,
            maxTicksLimit: Math.min(Number(scale.ticks?.maxTicksLimit) || capacity, capacity) } };
        }
        if (!scale.title?.text || scale.title.display === false) return [key, scale];
        const titleSize = Math.max(36, Number(scale.title.font?.size) || 0);
        context.font = `${scale.title.font?.weight || 500} ${titleSize}px ${scale.title.font?.family || 'system-ui, sans-serif'}`;
        const title = Array.isArray(scale.title.text) ? scale.title.text.join(' ') : String(scale.title.text);
        const lines = window.exportUtils.wrapExportText(title, Math.max(72, (vertical ? bounds.height : bounds.width) - 160),
          value => context.measureText(value).width, Infinity);
        return [key, { ...scale, title: { ...scale.title, text: lines.length > 1 ? lines : title } }];
      }));
      context.font = originalFont;
      const chartInput = resources.chartInput.options?.scales
        ? { ...resources.chartInput, options: { ...resources.chartInput.options, scales } }
        : resources.chartInput;
      const captured = resources.chartAdapter.snapshotCapture({
        chartInput, width: Math.floor(bounds.width), height: Math.floor(bounds.height),
        minFontSize: 36, axisTextColor: '#f8fafc', includeInspection: false
      });
      if (!captured?.canvas || !(captured.canvas.width > 0) || !(captured.canvas.height > 0)) throw new Error('Chart export renderer produced no content');
      context.drawImage(captured.canvas, bounds.x, bounds.y, bounds.width, bounds.height);
    }

    function createPbExportChart(data, bounds) {
      const ChartType = window.Chart || (typeof Chart !== 'undefined' ? Chart : null);
      if (!ChartType || !data.records?.length) throw new Error('PB export chart renderer is not ready');
      const profile = data.xAxisMode === 'duration';
      const values = data.records.flatMap(record => {
        const sourceDate = record.date ?? record.source?.activityDate;
        if (sourceDate === null || sourceDate === undefined || sourceDate === '' || typeof sourceDate === 'boolean') return [];
        const date = new Date(sourceDate).getTime();
        return Number.isFinite(date) ? [{ x: date, y: record.value }] : [];
      });
      const dates = values.map(point => point.x).filter(Number.isFinite);
      if (!profile && !dates.length) return null;
      const uniqueDates = [...new Set(dates)].sort((first, second) => first - second);
      const minDate = dates.length ? Math.min(...dates) : null;
      const maxDate = dates.length ? Math.max(...dates) : null;
      const labels = data.records.map(record => record.durationLabel || String(record.durationSeconds));
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(bounds.width); canvas.height = Math.floor(bounds.height);
      const axisFont = { size: 36, family: 'system-ui, sans-serif' };
      const dateLabel = value => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const measurement = canvas.getContext('2d');
      measurement.font = '500 36px system-ui, sans-serif';
      const labelWidth = Math.max(1, ...uniqueDates.map(date => measurement.measureText(dateLabel(date)).width));
      const plotWidth = Math.max(1, bounds.width - 300);
      const timeSpan = Math.max(1, maxDate - minDate);
      const tickDates = [];
      for (const date of uniqueDates) {
        if (!tickDates.length || (date - tickDates[tickDates.length - 1]) / timeSpan * plotWidth >= labelWidth + 32) tickDates.push(date);
      }
      if (uniqueDates.length > 1 && tickDates[tickDates.length - 1] !== maxDate) {
        while (tickDates.length > 1 && (maxDate - tickDates[tickDates.length - 1]) / timeSpan * plotWidth < labelWidth + 32) tickDates.pop();
        tickDates.push(maxDate);
      }
      const tickCount = Math.max(2, tickDates.length);
      const xScale = profile
        ? { type: 'category', title: { display: true, text: 'Effort duration', color: '#f8fafc', font: axisFont },
          ticks: { color: '#f8fafc', font: axisFont, maxRotation: 0, autoSkip: true } }
        : { type: 'linear', min: minDate === maxDate ? minDate - 43200000 : minDate,
          max: minDate === maxDate ? maxDate + 43200000 : maxDate,
          afterBuildTicks: axis => { axis.ticks = tickDates.map(value => ({ value })); },
          ticks: { color: '#f8fafc', font: axisFont, maxTicksLimit: tickCount, maxRotation: 0,
            callback: dateLabel } };
      const copy = document.createElement('canvas');
      copy.width = canvas.width; copy.height = canvas.height;
      let chart;
      try {
        chart = new ChartType(canvas, {
          type: 'line', data: { ...(profile ? { labels } : {}), datasets: [{
            data: profile ? data.records.map(record => record.value) : values,
            borderColor: '#20c9b2', backgroundColor: '#20c9b2', borderWidth: 4,
            pointRadius: data.records.length > 30 ? 3 : 6, pointHoverRadius: 0,
            tension: 0, fill: false, showLine: profile ? data.records.length > 1 : uniqueDates.length > 1
          }] },
          options: { responsive: false, animation: false, devicePixelRatio: 1, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: xScale,
              y: { beginAtZero: true, title: { display: true, text: data.unit === 's' ? ['Time', '(h:m:s)'] : data.unit || data.metricLabel, color: '#f8fafc', font: axisFont },
                ticks: { color: '#f8fafc', font: axisFont, maxTicksLimit: 4,
                  callback: value => data.unit === 's' && typeof formatDurationHms === 'function'
                    ? formatDurationHms(value) : Number(value).toLocaleString('en-US', { maximumFractionDigits: 1 }) } }
            }
          }
        });
        chart.update?.('none');
        copy.getContext('2d').drawImage(canvas, 0, 0);
        return copy;
      } finally { chart?.destroy(); }
    }

    function renderPbExportPage({ context, snapshot, page }) {
      const data = snapshot.familyData;
      const bounds = page.visualization;
      if (page.overview && !page.recordIndexes) {
        let y = bounds.y;
        for (const [rowIndex, index] of page.itemIndexes.entries()) {
          const group = data.groups[index];
          const rowHeight = page.rowHeights[rowIndex];
          context.fillStyle = '#f8fafc'; context.font = '600 36px system-ui, sans-serif'; context.textBaseline = 'top'; context.textAlign = 'left';
          context.fillText(group.title || group.definitionKey, bounds.x, y);
          if (group.best?.displayValue) {
            context.fillStyle = '#20c9b2'; context.font = '700 48px system-ui, sans-serif';
            const value = group.best.displayValue;
            const unit = group.unit && !(group.unit === 's' && value.includes(':')) && !value.includes(group.unit) ? ` ${group.unit}` : '';
            context.fillText(value + unit, bounds.x, y + 44);
          }
          const chartBounds = { x: bounds.x, y: y + 104, width: bounds.width, height: rowHeight - 116 };
          const image = createPbExportChart(group, chartBounds);
          if (image) context.drawImage(image, chartBounds.x, chartBounds.y, chartBounds.width, chartBounds.height);
          y += rowHeight;
        }
        return;
      }
      const group = page.overview ? data.groups[page.itemIndexes[0]] : data;
      let y = bounds.y;
      context.textAlign = 'left'; context.textBaseline = 'top';
      if (page.overview) {
        context.fillStyle = '#f8fafc'; context.font = '600 36px system-ui, sans-serif';
        page.headerLines.forEach((line, index) => context.fillText(line, bounds.x, y + index * 44));
        if (group.best?.displayValue) {
          context.fillStyle = '#20c9b2'; context.font = '700 48px system-ui, sans-serif';
          const value = group.best.displayValue;
          const unit = group.unit && !(group.unit === 's' && value.includes(':')) && !value.includes(group.unit) ? ` ${group.unit}` : '';
          context.fillText(value + unit, bounds.x, y + page.headerLines.length * 44);
        }
        y += page.headerHeight;
      }
      if (page.chartHeight > 0) {
        const chartBounds = { ...bounds, y, height: page.chartHeight };
        const image = createPbExportChart(group, chartBounds);
        if (image) context.drawImage(image, chartBounds.x, chartBounds.y, chartBounds.width, chartBounds.height);
        y += page.chartHeight + 24;
      }
      context.font = '500 36px system-ui, sans-serif'; context.fillStyle = '#f8fafc';
      context.textAlign = 'left'; context.textBaseline = 'top';
      (page.recordIndexes || page.itemIndexes).forEach((index, rowIndex) => {
        const record = group.records[index];
        const lines = page.recordTextLines?.[rowIndex] || window.exportUtils.getPbExportRecordLines(record, group)
          .flatMap(text => window.exportUtils.wrapExportText(text, bounds.width, value => context.measureText(value).width, Infinity));
        lines.forEach((line, lineIndex) => context.fillText(line, bounds.x, y + lineIndex * 44));
        y += page.recordRowHeights?.[rowIndex] || lines.length * 44 + 12;
      });
    }

    async function renderDomExportPage({ context, snapshot, page, resources }) {
      const owner = { trainingCalendar: window.trainingCalendarDashboard,
        lifetimeStatistics: window.lifetimeStatisticsDashboard, mediaGallery: window.mediaGalleryDashboard }[snapshot.targetKey];
      if (!owner?.createExportPage || typeof html2canvas !== 'function') throw new Error('Export page renderer is not ready');
      const surface = owner.createExportPage(snapshot.familyData, page);
      try {
        await surface.prepare(snapshot.targetKey === 'mediaGallery' ? resources?.mediaSources : null);
        const bounds = page.visualization;
        const height = surface.element.getBoundingClientRect().height;
        if (height > bounds.height + 1) {
          const error = new RangeError('Export page needs a readable continuation');
          error.code = 'EXPORT_PAGE_OVERFLOW'; throw error;
        }
        const image = await html2canvas(surface.element, { backgroundColor: '#071719', useCORS: true,
          scale: 1, logging: false, width: Math.ceil(bounds.width) });
        if (image.width > bounds.width + 1 || image.height > bounds.height + 1) {
          const error = new RangeError('Captured export page exceeds its measured bounds');
          error.code = 'EXPORT_PAGE_OVERFLOW'; throw error;
        }
        context.drawImage(image, bounds.x, bounds.y + Math.max(0, (bounds.height - image.height) / 2), image.width, image.height);
      } finally { surface.release(); }
    }

    async function renderWordcloudExportPage({ context, snapshot, page }) {
      if (!window.wordcloudDashboard?.createExportCanvas) throw new Error('Wordcloud export renderer is not ready');
      const surface = window.wordcloudDashboard.createExportCanvas(snapshot.familyData, page);
      try {
        await surface.prepare();
        const bounds = page.visualization;
        context.drawImage(surface.canvas, bounds.x, bounds.y, bounds.width, bounds.height);
      } finally { surface.release(); }
    }

    function renderPieExportPage({ context, snapshot, page }) {
      if (!window.pieChartsDashboard?.createExportCanvas) throw new Error('Pie export renderer is not ready');
      const data = snapshot.familyData;
      const image = window.pieChartsDashboard.createExportCanvas(data, Math.floor(page.circleSize));
      const bounds = page.chartBounds;
      context.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height);
      context.font = '500 36px system-ui, sans-serif'; context.textAlign = 'left'; context.textBaseline = 'top';
      let y = page.legendBounds.y;
      for (const index of page.itemIndexes) {
        const slice = data.slices[index];
        const percentage = Number.isFinite(slice.percentage) ? slice.percentage : slice.value / page.denominator * 100;
        const text = `${slice.label}  ${slice.displayValue || slice.value}  ${percentage.toFixed(1)}%`;
        const lines = window.exportUtils.wrapExportText(text, page.legendBounds.width - 48,
          value => context.measureText(value).width, Infinity);
        context.fillStyle = slice.color; context.fillRect(page.legendBounds.x, y + 8, 24, 24);
        context.fillStyle = '#f8fafc';
        lines.forEach((line, lineIndex) => context.fillText(line, page.legendBounds.x + 36, y + lineIndex * 44));
        y += lines.length * 44 + 12;
      }
      if (y > page.legendBounds.y + page.legendBounds.height + 1) throw new RangeError('Pie legend exceeds measured bounds');
    }

    async function renderMapExportPage({ context, page, resources }) {
      if (!resources?.mapSurface || typeof html2canvas !== 'function') throw new Error('Map export renderer is not ready');
      const image = await html2canvas(resources.mapSurface.element, {
        backgroundColor: '#071719', useCORS: true, logging: false, scale: 2
      });
      const bounds = page.mapBounds;
      context.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height);
    }

    Object.assign(EXPORT_FAMILY_RENDERERS, {
      totalDistance: renderDistanceExportPage,
      equipment: renderEquipmentExportPage,
      equipmentTimeline: renderEquipmentExportPage,
      paceMetrics: renderChartExportPage,
      heartRate: renderChartExportPage,
      distributions: renderChartExportPage,
      workoutTime: renderChartExportPage,
      personalBests: renderPbExportPage,
      heatmap: renderMapExportPage,
      trainingCalendar: renderDomExportPage,
      wordcloud: renderWordcloudExportPage,
      pieCharts: renderPieExportPage,
      lifetimeStatistics: renderDomExportPage,
      mediaGallery: renderDomExportPage
    });

    function drawStructuredExportFrame(plan, assets = {}) {
      const style = window.exportUtils.getSocialExportStyleConfig();
      const canvas = document.createElement('canvas');
      canvas.width = plan.width; canvas.height = plan.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create export canvas');
      context.fillStyle = style.colors.background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = style.colors.accent;
      context.fillRect(plan.contentBounds.x, plan.contentBounds.y, 72, 5);
      context.textAlign = 'left'; context.textBaseline = 'top';
      for (const block of plan.textBlocks) {
        context.fillStyle = ['headline', 'caption'].includes(block.role) ? style.colors.headline
          : ['provenance', 'centralValue'].includes(block.role) ? style.colors.accent : style.colors.secondary;
        context.font = `${block.weight} ${block.fontSize}px system-ui, sans-serif`;
        block.lines.forEach((line, index) => context.fillText(line, block.x, block.y + index * block.lineHeight));
      }
      for (const row of plan.legendRows) {
        for (const entry of row.entries) {
          const x = plan.contentBounds.x + entry.offsetX;
          context.fillStyle = Array.isArray(entry.color) ? entry.color[0] : entry.color;
          if (entry.pointStyle === 'triangle') {
            context.beginPath(); context.moveTo(x + 12, row.y + 6);
            context.lineTo(x + 25, row.y + 32); context.lineTo(x - 1, row.y + 32);
            context.closePath(); context.fill();
          } else if (entry.pointStyle === 'circle') {
            context.beginPath(); context.arc(x + 12, row.y + 20, 12, 0, Math.PI * 2); context.fill();
          } else {
            context.fillRect(x, row.y + 8, 24, 24);
          }
          context.fillStyle = style.colors.secondary;
          context.font = '500 36px system-ui, sans-serif';
          entry.lines.forEach((line, index) => context.fillText(line, x + 36, row.y + index * 44));
        }
      }
      let brandX = plan.footer.x;
      const storyBranding = plan.format === 'story';
      if (assets.logo?.naturalWidth > 0) {
        const fit = window.exportUtils.computeContainFit(assets.logo.naturalWidth, assets.logo.naturalHeight,
          storyBranding ? 132 : 88, storyBranding ? 60 : 40);
        context.drawImage(assets.logo, brandX + fit.offsetX, plan.footer.y + fit.offsetY + 4, fit.drawWidth, fit.drawHeight);
        brandX += storyBranding ? 148 : 104;
      }
      context.fillStyle = style.colors.secondary;
      context.font = '700 36px system-ui, sans-serif';
      context.fillText('TriAnalytica', brandX, plan.footer.y + 4);
      context.font = '500 36px system-ui, sans-serif';
      if (context.measureText(EXPORT_DOMAIN).width > plan.footer.width) {
        throw new RangeError('Export branding cannot fit at readable size');
      }
      context.fillText(EXPORT_DOMAIN, plan.footer.x, plan.footer.y + (storyBranding ? 80 : 52));
      return { canvas, context };
    }

    function createExportCaptureSnapshot(targetEl, tabId, options = {}) {
      const { selection = null, target = null } = options;
      const adapter = window.dashboardTooltips?.adapters.get(tabId);
      const renderer = adapter?.snapshotCapture?.({ ...options.chartCapture, includeInspection: false, selection: null });
      const clonedTarget = targetEl.cloneNode ? targetEl.cloneNode(true) : { ...targetEl };
      const sourceCanvases = targetEl.tagName === 'CANVAS' ? [targetEl] : Array.from(targetEl.querySelectorAll?.('canvas') || []);
      const clonedCanvases = clonedTarget.tagName === 'CANVAS' ? [clonedTarget] : Array.from(clonedTarget.querySelectorAll?.('canvas') || []);
      sourceCanvases.forEach((canvas, index) => {
        const copy = clonedCanvases[index];
        if (!copy) throw new Error('Could not isolate the chart for export');
        const source = renderer?.sourceCanvas === canvas ? renderer.canvas : canvas;
  const exportResolution = tabId === 'workoutTime' && renderer?.sourceCanvas === canvas;
  const width = exportResolution ? source.width : canvas.width > 0 ? canvas.width : source.width;
  const height = exportResolution ? source.height : canvas.height > 0 ? canvas.height : source.height;
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
      let snapshotReleased = false;
      const release = () => {
        if (snapshotReleased) return;
        snapshotReleased = true;
        try { mediaLease?.release(); }
        finally { if (clonedTarget.nodeType === 1) clonedTarget.remove(); }
      };
      try {
      if (clonedTarget.nodeType === 1) {
        const rect = targetEl.getBoundingClientRect();
        clonedTarget.id = `${targetEl.id || tabId}-export-snapshot`;
        Object.assign(clonedTarget.style, { position: 'fixed', left: '-100000px', top: '0', width: `${rect.width}px`, height: `${rect.height}px`, maxWidth: 'none', margin: '0', pointerEvents: 'none' });
        clonedTarget.setAttribute('aria-hidden', 'true');
        document.body.appendChild(clonedTarget);
      }
      const chartImage = tabId === 'pieCharts'
        ? renderer?.canvas ? renderer.canvas.toDataURL('image/png') : window.pieChartsDashboard?.getExportChartImage?.(560)
        : null;
      return {
        element: clonedTarget, chartImage,
        resolveExportAnchor(element) {
          if (!selection) return null;
          const captureContext = { element, target };
          const resolved = renderer?.resolveExportAnchor
            ? renderer.resolveExportAnchor(captureContext)
            : adapter?.resolveExportAnchor?.(selection, captureContext);
          if (!resolved) throw new Error('Could not resolve the selected item in the export');
          return resolved;
        },
        prepare: () => mediaLease?.prepare(clonedTarget),
        release
      };
      } catch (error) {
        release();
        throw error;
      }
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
      updateExportDownloadButton();
      updateExportSeriesControls();
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function updateExportDownloadButton() {
      const button = document.getElementById('exportPreviewDownloadBtn');
      if (button) button.disabled = !!exportDownloadAttempt || exportCompositionPending || !lastExportedImage?.blob?.size
        || isExportPunchlineDownloadBlocked();
    }

    function isExportPunchlineDownloadBlocked() {
      const state = exportPunchlineSelection;
      if (!state) return false;
      if (state.enabled && (state.blockedAfterApply || state.validationStatus !== 'valid')) return true;
      if (lastExportCaptureState && !isCurrentExportCapture(lastExportCaptureState)) return true;
      return !!lastExportedImage && lastExportedImage.target?.punchlineRevision !== state.presentationRevision;
    }

    function markExportPunchlineFitError(error) {
      if (!exportPunchlineSelection?.enabled || !/punchline/i.test(error?.message || '')) return;
      exportPunchlineSelection.validationStatus = 'does-not-fit';
      exportPunchlineSelection.error = error.message;
      exportPunchlineSelection.blockedAfterApply = true;
      updateExportPunchlineControls();
      updateExportDownloadButton();
    }

    function clearExportPunchlineFitError() {
      if (!exportPunchlineSelection?.enabled || exportPunchlineSelection.validationStatus !== 'does-not-fit') return;
      exportPunchlineSelection.validationStatus = 'valid';
      exportPunchlineSelection.error = null;
      exportPunchlineSelection.blockedAfterApply = false;
      updateExportPunchlineControls();
    }

    function beginExportSession(snapshot = null) {
      selectedExportFormat = 'story';
      updateExportFormatButtons();
      const suggestions = snapshot && Object.prototype.hasOwnProperty.call(EXPORT_CAPTURE_TARGET_IDS, snapshot.targetKey)
        ? window.exportPunchlineUtils.buildPunchlineSuggestions(snapshot) : [];
      exportPunchlineSelection = {
        enabled: true, source: 'default', selectionId: snapshot?.selectionId || null,
        suggestionId: suggestions[0]?.id || null, suggestions,
        confirmedText: suggestions[0]?.text || 'My training story.', draftText: '',
        validationStatus: 'valid', error: null, blockedAfterApply: false, hasUnconfirmedDraft: false,
        presentationRevision: 0, previousSelection: null,
        startTimeAnalysis: snapshot?.familyData?.startTimeAnalysis || null,
        neutralReason: snapshot ? projectExportPunchlineEvidence(snapshot).neutralReason : null
      };
      selectedExportHumorEnabled = true;
      const checkbox = document.getElementById('exportHumorEnabled');
      if (checkbox) checkbox.checked = true;
      const customPanel = document.getElementById('exportPunchlineCustomPanel');
      if (customPanel) customPanel.open = false;
      updateExportPunchlineControls(true);
      exportRequestState = 'capturing';
      exportCompositionPending = true;
      lastExportedImage = null;
      lastExportImages = [];
      currentExportSeriesIndex = 0;
      const image = document.getElementById('exportPreviewImage');
      if (image) image.src = '';
      const error = document.getElementById('exportPreviewError');
      if (error) error.classList.add('hidden');
      updateExportSeriesControls();
      updateExportDownloadButton();
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
        portrait: document.getElementById('exportFormatPortrait'),
        story: document.getElementById('exportFormatStory')
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

    function updateExportPunchlineControls(syncDraft = false) {
      const state = exportPunchlineSelection;
      if (!state) return;
      const controls = document.getElementById('exportPunchlineControls');
      if (controls) controls.classList.toggle('hidden', !state.enabled);
      const select = document.getElementById('exportPunchlineSuggestion');
      if (select) {
        const placeholder = document.createElement('option');
        placeholder.value = ''; placeholder.textContent = state.source === 'custom' ? 'Own text' : 'Suggested punchline';
        const options = state.suggestions.map(suggestion => {
          const option = document.createElement('option');
          option.value = suggestion.id; option.textContent = suggestion.text;
          return option;
        });
        select.replaceChildren(placeholder, ...options);
        select.value = state.source === 'custom' ? '' : state.suggestionId || '';
      }
      const input = document.getElementById('exportPunchlineText');
      if (input) {
        if (syncDraft) input.value = state.draftText;
        input.setAttribute('aria-invalid', String(state.enabled && !!state.error));
      }
      const count = document.getElementById('exportPunchlineLength');
      if (count) count.textContent = `${Array.from(state.draftText.trim()).length} / 120`;
      const source = document.getElementById('exportPunchlineSource');
      if (source) source.textContent = state.source === 'custom' ? 'Own text' : 'Suggested';
      const error = document.getElementById('exportPunchlineError');
      if (error) {
        error.textContent = state.enabled ? state.error || '' : '';
        error.classList.toggle('hidden', !state.enabled || !state.error);
      }
      const evidence = document.getElementById('exportPunchlineEvidence');
      if (evidence) {
        const selected = state.source === 'custom' ? null : state.suggestions.find(item => item.id === state.suggestionId);
        const basis = selected?.basis;
        const parts = [];
        if (basis) {
          parts.push(`${basis.metric}: ${basis.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}${basis.denominator
            ? ` / ${basis.denominator.toLocaleString('en-US')}` : ''}${basis.unit ? ` ${basis.unit}` : ''}`);
          if (Number.isInteger(basis.excludedCount)) parts.push(`${basis.excludedCount} excluded`);
          if (basis.labels?.length) parts.push(basis.labels.join(', '));
          if (basis.sport && !/^all(?: sports)?$/i.test(basis.sport)) parts.push(basis.sport);
          if (basis.period) parts.push(basis.period);
          if (basis.qualifiers?.length) parts.push(basis.qualifiers.join('; '));
        } else if (state.source !== 'custom') {
          if (state.startTimeAnalysis) {
            const analysis = state.startTimeAnalysis;
            parts.push(`${analysis.validStartCount} valid local starts; ${analysis.excludedStartCount} excluded`);
            parts.push(analysis.validStartCount < 10 ? 'At least 10 valid starts are required for a habit label'
              : 'No start-time window reaches 60% of valid starts');
          }
          if (state.neutralReason) parts.push(state.neutralReason);
        }
        evidence.textContent = parts.join(' · ');
        evidence.classList.toggle('hidden', !state.enabled || !parts.length);
      }
    }

    function getConfirmedExportPunchline() {
      const state = exportPunchlineSelection;
      if (!state || !state.enabled) return null;
      const resolved = window.exportPunchlineUtils.resolvePunchline(state, state.suggestions);
      if (!resolved.valid) throw new RangeError(resolved.error);
      return resolved.text;
    }

    function setExportPunchlineDraft(value) {
      if (!exportPunchlineSelection) return;
      exportPunchlineSelection.draftText = typeof value === 'string' ? value : '';
      exportPunchlineSelection.hasUnconfirmedDraft = exportPunchlineSelection.draftText.trim()
        !== exportPunchlineSelection.confirmedText;
      updateExportPunchlineControls();
    }

    async function applyExportPunchline() {
      const state = exportPunchlineSelection;
      if (!state) return false;
      const checked = window.exportPunchlineUtils.validateCustomPunchline(state.draftText);
      if (!checked.valid) {
        state.validationStatus = checked.length ? 'too-long' : 'empty';
        state.error = checked.error; state.blockedAfterApply = true;
        state.presentationRevision++;
        exportCompositionPending = false;
        updateExportPunchlineControls(); updateExportDownloadButton();
        return false;
      }
      state.previousSelection = { source: state.source, suggestionId: state.suggestionId, confirmedText: state.confirmedText };
      state.source = 'custom'; state.confirmedText = checked.text; state.draftText = checked.text;
      state.validationStatus = 'valid'; state.error = null; state.blockedAfterApply = false;
      state.hasUnconfirmedDraft = false; state.presentationRevision++;
      updateExportPunchlineControls(true);
      return lastExportCaptureState ? composeCurrentExportImages(lastExportCaptureState) : false;
    }

    async function setExportPunchlineSuggestion(id) {
      const state = exportPunchlineSelection;
      if (!state) return false;
      const suggestion = state.suggestions.find(item => item.id === id && item.selectionId === state.selectionId);
      if (!suggestion) {
        state.error = 'Choose a suggestion from this export.'; state.blockedAfterApply = true;
        state.presentationRevision++;
        exportCompositionPending = false;
        updateExportPunchlineControls(); updateExportDownloadButton();
        return false;
      }
      state.previousSelection = { source: state.source, suggestionId: state.suggestionId, confirmedText: state.confirmedText };
      state.source = 'suggestion'; state.suggestionId = suggestion.id; state.confirmedText = suggestion.text;
      state.validationStatus = 'valid'; state.error = null; state.blockedAfterApply = false;
      state.hasUnconfirmedDraft = false; state.presentationRevision++;
      updateExportPunchlineControls();
      return lastExportCaptureState ? composeCurrentExportImages(lastExportCaptureState) : false;
    }

    async function restoreExportPunchline() {
      const state = exportPunchlineSelection;
      if (!state) return false;
        if (((!state.hasUnconfirmedDraft && !state.blockedAfterApply) || state.validationStatus === 'does-not-fit')
          && state.previousSelection) {
        Object.assign(state, state.previousSelection);
        state.previousSelection = null;
      }
      state.draftText = state.source === 'custom' ? state.confirmedText : '';
      state.validationStatus = 'valid'; state.error = null; state.blockedAfterApply = false;
      state.hasUnconfirmedDraft = false; state.presentationRevision++;
      updateExportPunchlineControls(true);
      return lastExportCaptureState ? composeCurrentExportImages(lastExportCaptureState) : false;
    }

    function createStructuredExportResources(target) {
      const key = target.selectionSnapshot.targetKey;
      const resources = {};
      try {
        if (['paceMetrics', 'heartRate', 'distributions', 'workoutTime'].includes(key)) {
          resources.chartAdapter = window.dashboardTooltips?.adapters.get(key);
          if (!resources.chartAdapter?.captureExportInput || !target.structuredChartInput) throw new Error('Selected chart export is not ready');
          resources.chartInput = resources.chartAdapter.captureExportInput(target.structuredChartInput);
        }
        if (key === 'heatmap') {
          resources.mapSurface = window.heatmapDashboard.captureExportSurface();
          resources.mapSurface.element.querySelectorAll('.leaflet-control-attribution').forEach(element => element.remove());
        }
        if (key === 'mediaGallery') resources.mediaSources = window.mediaGalleryDashboard.acquirePreparedExportSources(target.selectionSnapshot.familyData);
      } catch (error) {
        resources.mapSurface?.release(); resources.mediaSources?.release(); throw error;
      }
      resources.prepare = () => resources.mapSurface?.prepare();
      let released = false;
      resources.release = () => {
        if (released) return;
        released = true;
        try { resources.mapSurface?.release(); }
        finally { resources.mediaSources?.release(); }
      };
      return resources;
    }

    function releaseStructuredExportState(state) {
      if (state.released && state.active === 0) state.resources.release();
    }

    async function composeStructuredExportImages(state) {
      const revision = ++state.revision;
      const format = selectedExportFormat;
      const humorEnabled = selectedExportHumorEnabled;
      const punchlineText = getConfirmedExportPunchline();
      const punchlineRevision = exportPunchlineSelection?.presentationRevision ?? 0;
      const current = () => lastExportCaptureState === state && !state.released
        && state.sessionId === exportSessionSequence && state.revision === revision && isCurrentExportCapture(state)
        && (exportPunchlineSelection?.presentationRevision ?? 0) === punchlineRevision;
      state.active++;
      if (current()) {
        lastExportedImage = null; lastExportImages = []; currentExportSeriesIndex = 0;
        exportCompositionPending = true;
        updateExportDownloadButton();
        const previewImage = document.getElementById('exportPreviewImage');
        if (previewImage) previewImage.src = '';
        updateExportSeriesControls();
      }
      try {
        await state.ready;
        if (!current()) return false;
        const data = state.snapshot.familyData;
        const presentation = getSocialExportPresentation(state.snapshot.targetKind === 'pb-tile' ? 'pb-tile' : state.snapshot.targetKey,
          data, { humorEnabled, punchlineText });
        if (state.snapshot.targetKey === 'mediaGallery') presentation.context.push({ label: 'Selection', value: `${data.displayedCount} of ${data.eligibleCount} media items` });
        const measureCanvas = document.createElement('canvas');
        const measureContext = measureCanvas.getContext('2d');
        const plan = window.exportUtils.planExportPages(state.snapshot, { format, humorEnabled, presentation }, {
          measureText: (text, size = 36) => { measureContext.font = `700 ${size}px system-ui, sans-serif`; return measureContext.measureText(text).width; }
        });
        const prepared = [];
        let pageIndex = 0;
        while (pageIndex < plan.pages.length) {
          if (!current()) return false;
          const page = plan.pages[pageIndex];
          const framePlan = { ...plan, textBlocks: plan.textBlocks.map(block => block.role === 'page'
            ? { ...block, lines: [`Page ${pageIndex + 1} of ${plan.pages.length}`] } : block) };
          const frame = drawStructuredExportFrame(framePlan, state.assets);
          try {
            await EXPORT_ADAPTERS[state.snapshot.targetKey].renderPage({
              context: frame.context, snapshot: state.snapshot, page, resources: state.resources
            });
          } catch (error) {
            const indexes = page.monthKeys || page.itemIndexes;
            if (!['EXPORT_PAGE_OVERFLOW', 'WORD_PLACEMENT_FAILED'].includes(error.code) || indexes.length <= 1) throw error;
            if (!plan.textBlocks.some(block => block.role === 'page')) {
              plan.textBlocks.push({ role: 'page', lines: [], x: page.visualization.x, y: page.visualization.y,
                fontSize: 36, lineHeight: 44, weight: 500 });
              for (const candidate of plan.pages) {
                candidate.visualization.y += 56; candidate.visualization.height -= 56;
              }
            }
            const half = Math.ceil(indexes.length / 2);
            const split = values => ({ ...page, visualization: { ...page.visualization },
              ...(page.monthKeys ? { monthKeys: values } : { itemIndexes: values }) });
            plan.pages.splice(pageIndex, 1, split(indexes.slice(0, half)), split(indexes.slice(half)));
            prepared.length = 0; pageIndex = 0;
            continue;
          }
          if (!current()) return false;
          const pageTarget = { ...state.target, format, seriesPage: pageIndex + 1, seriesCount: plan.pages.length,
            presentation, selectionSnapshot: state.snapshot, sessionId: state.sessionId, compositionRevision: revision, punchlineRevision };
          const image = await prepareExportImage(frame.canvas.toDataURL('image/png'), pageTarget, state.pbOpening);
          if (!current()) return false;
          prepared.push(image); pageIndex++;
        }
        if (!current()) return false;
        lastExportImages = prepared; currentExportSeriesIndex = 0; lastExportedImage = prepared[0];
        exportRequestState = 'previewing';
        exportCompositionPending = false;
        state.error = null;
        if (state.snapshot.targetKey === 'heartRate') state.heartRateSnapshotPublished = true;
        clearExportPunchlineFitError();
        showExportPreviewModal(lastExportedImage.dataUrl);
        return true;
      } catch (error) {
        if (current()) {
          state.error = error; exportRequestState = 'capture-failed';
          exportCompositionPending = false;
          markExportPunchlineFitError(error);
          const message = document.getElementById('exportPreviewError');
          if (message) { message.textContent = error.message; message.classList.remove('hidden'); }
          showExportToast(error.message || 'Could not export this visualization.');
        }
        return false;
      } finally {
        state.active--; releaseStructuredExportState(state);
      }
    }

    async function exportStructuredVisualizationTarget(target) {
      const sessionId = ++exportSessionSequence;
      const previous = lastExportCaptureState;
      if (previous?.structured) { previous.released = true; releaseStructuredExportState(previous); }
      beginExportSession(target.selectionSnapshot);
      let resources;
      try { resources = createStructuredExportResources(target); }
      catch (error) {
        exportCompositionPending = false;
        exportRequestState = 'idle';
        updateExportDownloadButton();
        showExportToast(error.message);
        return;
      }
      const state = { structured: true, sessionId, target, snapshot: target.selectionSnapshot, resources,
        captureGeneration: ++exportCaptureGeneration, dashboardDataRevision: getExportDashboardDataRevision(),
        ...(target.key === 'heartRate' ? { heartRateRevision: target.exportData.modelRevision ?? window.heartRateDashboard?.getRevision?.(), heartRateSnapshotPublished: false } : {}),
        pbOpening: target.selectionSnapshot.pbOpening, revision: 0, active: 1, released: false, assets: null, error: null };
      lastExportCaptureState = state;
      exportRequestState = 'capturing';
      state.ready = (async () => { await waitForExportFonts(); await resources.prepare(); state.assets = await loadExportAssets(); })();
      try { await composeStructuredExportImages(state); }
      finally { state.active--; releaseStructuredExportState(state); }
    }

    async function composeCurrentExportImages(captureState) {
      if (!isCurrentExportCapture(captureState)) return;
      if (captureState.structured) return composeStructuredExportImages(captureState);
      const { captured, target, assets, pbOpening } = captureState;
      const revision = (captureState.compositionRevision || 0) + 1;
      captureState.compositionRevision = revision;
      const format = selectedExportFormat;
      const humorEnabled = selectedExportHumorEnabled;
      const punchlineText = getConfirmedExportPunchline();
      const punchlineRevision = exportPunchlineSelection?.presentationRevision ?? 0;
      const current = () => lastExportCaptureState === captureState
        && captureState.sessionId === exportSessionSequence && captureState.compositionRevision === revision
        && isCurrentExportCapture(captureState)
        && (exportPunchlineSelection?.presentationRevision ?? 0) === punchlineRevision;
      const pageTargets = getExportTargetPages({ ...target, format });
      const formatCaptures = captureState.calendarCapturesByFormat?.[format];
      const preparedImages = [];
      captureState.state = 'composing';
      exportCompositionPending = true;
      lastExportedImage = null;
      lastExportImages = [];
      currentExportSeriesIndex = 0;
      updateExportDownloadButton();
      const previewImage = document.getElementById('exportPreviewImage');
      if (previewImage) previewImage.src = '';
      updateExportSeriesControls();
      try {
        for (const [pageIndex, sourceTarget] of pageTargets.entries()) {
          if (!current()) return false;
          const pageTarget = { ...sourceTarget, format, sessionId: captureState.sessionId, compositionRevision: revision, punchlineRevision };
          const presentationKey = pageTarget.kind === 'pb-tile' ? 'pb-tile' : pageTarget.key;
          pageTarget.presentation = getSocialExportPresentation(presentationKey, {
            ...(pageTarget.exportData || {}),
            title: pageTarget.exportData?.title || pageTarget.title,
            metricLabel: pageTarget.exportData?.metricLabel || pageTarget.metricLabel
          }, { humorEnabled, punchlineText });
          const dataUrl = drawExportComposition(formatCaptures?.[pageIndex] || captured, pageTarget, assets);
          const image = await prepareExportImage(dataUrl, pageTarget, pbOpening);
          if (!current()) return false;
          preparedImages.push(image);
        }
        if (!current()) return false;
        lastExportImages = preparedImages;
        currentExportSeriesIndex = 0;
        lastExportedImage = preparedImages[0] || null;
        captureState.state = 'ready';
        exportCompositionPending = false;
        clearExportPunchlineFitError();
        if (lastExportedImage) {
          exportRequestState = 'previewing';
          showExportPreviewModal(lastExportedImage.dataUrl);
        }
        return true;
      } catch (error) {
        if (!current()) return false;
        captureState.state = 'failed';
        exportRequestState = 'idle';
        exportCompositionPending = false;
        markExportPunchlineFitError(error);
        const errorElement = document.getElementById('exportPreviewError');
        if (errorElement) { errorElement.textContent = error.message; errorElement.classList.remove('hidden'); }
        showExportToast(error.message || 'Could not export this visualization.');
        return false;
      }
    }

    async function setExportFormat(format) {
      const formatConfig = window.exportUtils.getExportFormatConfig(format);
      if (!formatConfig) throw new RangeError(`Unsupported export format: ${format}`);
      selectedExportFormat = formatConfig.key;
      updateExportFormatButtons();
      if (exportPunchlineSelection) exportPunchlineSelection.presentationRevision++;
      if (!lastExportCaptureState) return;
      await composeCurrentExportImages(lastExportCaptureState);
    }

    async function setExportHumorEnabled(enabled) {
      selectedExportHumorEnabled = enabled === true;
      if (exportPunchlineSelection) {
        exportPunchlineSelection.enabled = selectedExportHumorEnabled;
        exportPunchlineSelection.presentationRevision++;
        updateExportPunchlineControls();
      }
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
      updateExportDownloadButton();
    }

    function closeExportPreviewModal() {
      exportSessionSequence += 1;
      exportCompositionPending = false;
      exportPunchlineSelection = null;
      if (lastExportCaptureState?.structured) {
        lastExportCaptureState.released = true;
        releaseStructuredExportState(lastExportCaptureState);
      }
      exportCaptureGeneration += 1;
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
      updateExportDownloadButton();
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
      if (target?.selectionSnapshot) {
        const dimensions = window.exportUtils.getExportPngDimensions(new Uint8Array(await blob.arrayBuffer()));
        const expected = window.exportUtils.getExportFormatConfig(target.format);
        if (!expected || dimensions.width !== expected.width || dimensions.height !== expected.height) throw new Error('Export PNG dimensions do not match the selected format');
      }
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
      if (target?.selectionSnapshot) {
        const expected = window.exportUtils.getExportFormatConfig(target.format);
        if (image.naturalWidth !== expected.width || image.naturalHeight !== expected.height) throw new Error('Decoded export dimensions do not match the selected format');
      }
      return Object.freeze({ dataUrl, blob, target, pbOpening, width: image.naturalWidth, height: image.naturalHeight });
    }

    async function downloadExportedImage() {
      const image = lastExportedImage;
      if (exportDownloadAttempt || exportCompositionPending || isExportPunchlineDownloadBlocked()
          || !image || !image.blob || !image.blob.size) return;
      const attempt = { image, outcome: null };
      exportDownloadAttempt = attempt;
      updateExportDownloadButton();
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
            let writable = null;
            try {
              writable = await fileHandle.createWritable();
              await writable.write(image.blob);
              await writable.close();
              attempt.outcome = 'saved';
              return attempt.outcome;
            } catch (error) {
              if (error && error.name === 'NotAllowedError') {
                try {
                  await writable?.abort?.();
                } catch (abortError) {
                  console.error('Could not abort the restricted export write', abortError);
                }
                showExportToast('Writing to the selected file was blocked; that file may be empty or incomplete. The complete PNG will use the browser download, with its location controlled by browser settings.');
              } else {
                attempt.outcome = 'failed';
                console.error('Could not save exported image', error);
                if (lastExportedImage === image) {
                  showExportToast(`Could not save export image. ${error && error.message || 'Please try again.'}`);
                }
                return attempt.outcome;
              }
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
        updateExportDownloadButton();
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
      if (target?.selectionSnapshot) return exportStructuredVisualizationTarget(target);
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

      const sessionId = ++exportSessionSequence;
      const captureState = {
        sessionId,
        captureGeneration: ++exportCaptureGeneration,
        dashboardDataRevision: getExportDashboardDataRevision()
      };
      const currentSession = () => exportSessionSequence === sessionId && isCurrentExportCapture(captureState);
      beginExportSession({ selectionId: `legacy-selection-${sessionId}`,
        targetKey: target.kind === 'pb-tile' ? 'personalBests' : target.key,
        variantKey: target.detailKey || target.key, familyData: {} });

      if (exportToastTimeoutId) clearTimeout(exportToastTimeoutId);
      exportToastTimeoutId = null;
      const previousToast = document.getElementById('exportToast');
      if (previousToast) {
        previousToast.textContent = '';
        previousToast.classList.add('hidden');
      }

      const pbOpening = target.kind === 'pb-tile' && typeof pbDetailOpening !== 'undefined' ? pbDetailOpening : null;
      let snapshot = null;
      try {
        const tabId = target.kind === 'pb-tile' ? 'personalBests' : target.key;
        target = JSON.parse(JSON.stringify(target));
  target.format = selectedExportFormat;
        target.pinnedSelection = null;
        const heatmapPalette = document.getElementById('heatmapColorScheme')?.value;
        if (target.key === 'wordcloud') {
          if (!window.wordcloudDashboard.hasExportableCloud()) throw new Error('The Wordcloud is not ready to export. Wait for the cloud to finish rendering and try again.');
        }
        const chartCapture = ['totalDistance', 'paceMetrics', 'heartRate', 'distributions', 'workoutTime'].includes(tabId)
          ? { width: 960, height: 500, minFontSize: 30, ...(tabId === 'workoutTime' ? { axisTextColor: '#f8fafc' } : {}) }
          : undefined;
        snapshot = createExportCaptureSnapshot(targetEl, tabId, { chartCapture, selection: null, target });
        if (window.tooltipSelectionUtils) target = window.tooltipSelectionUtils.freezePlain(window.tooltipSelectionUtils.copyPlain(target));
        await snapshot.prepare();
        if (!currentSession()) return;
        await waitForExportFonts();
        if (!currentSession()) return;
        const assets = await loadExportAssets();
        if (!currentSession()) return;

        let resolvedAnchor = null;
        let captureProtectedRects = [];
        const createCaptureOptions = pageTarget => ({
          backgroundColor: '#020617',
          useCORS: true,
          logging: false,
          windowWidth: ['pieCharts', 'heatmap'].includes(target.key) ? Math.max(window.innerWidth || 0, 1200) : undefined,
          onclone: clonedDocument => {
            const clonedTarget = clonedDocument.getElementById(snapshot.element.id || target.targetElementId)
              || clonedDocument.getElementById(target.targetElementId);
            if (!clonedTarget) return;
            try {
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
              if (chart && snapshot.chartImage) {
                const image = clonedDocument.createElement('img');
                image.src = snapshot.chartImage;
                image.setAttribute?.('data-export-chart-image', 'true');
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
            } finally {
              if (target.pinnedSelection) {
                resolvedAnchor = snapshot.resolveExportAnchor(clonedTarget);
                const bounds = clonedTarget.getBoundingClientRect?.();
                if (bounds?.width > 0 && bounds?.height > 0) {
                  captureProtectedRects = Array.from(clonedTarget.querySelectorAll?.('#pieChartsLegend, .leaflet-control-attribution') || []).map(element => {
                    const rect = element.getBoundingClientRect();
                    return { x: (rect.left - bounds.left) / bounds.width, y: (rect.top - bounds.top) / bounds.height, width: rect.width / bounds.width, height: rect.height / bounds.height };
                  }).filter(rect => rect.width > 0 && rect.height > 0);
                }
              }
            }
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
            for (const page of pages) {
              calendarCapturesByFormat[format].push(await capture(page));
              if (!isCurrentExportCapture(captureState)) return;
            }
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
  if (!currentSession()) return;
        if (target.pinnedSelection && !resolvedAnchor) resolvedAnchor = snapshot.resolveExportAnchor(snapshot.element);
        const compositionTarget = resolvedAnchor ? { ...target, captureProtectedRects, pinnedSelection: { ...target.pinnedSelection, anchor: resolvedAnchor } } : target;
        if (window.tooltipSelectionUtils) window.tooltipSelectionUtils.freezePlain(compositionTarget);
        lastExportCaptureState = { ...captureState, captured, target: compositionTarget, assets, pbOpening, calendarCapturesByFormat };
        await composeCurrentExportImages(lastExportCaptureState);
      } catch (error) {
        if (currentSession()) {
          console.error('Export failed', error);
          exportRequestState = 'idle';
          exportCompositionPending = false;
          updateExportDownloadButton();
          showExportToast(error.message || 'Could not export this visualization. Please try again.');
        }
      } finally {
        snapshot?.release();
        if (captureState.captureGeneration === exportCaptureGeneration && exportRequestState === 'capturing') {
          exportRequestState = 'idle';
        }
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
        sampleProvenance: typeof importedDataset !== 'undefined' && importedDataset?.sourceType === 'sample'
          ? importedDataset.sampleProvenance : null,
        filters: [{ label: 'Metric', value: model.axisLabel }],
        availableControls: getAvailableControlContext('personalBests'),
        metricLabel: model.axisLabel,
        detailKey: model.exportKey || model.title
      }) : null;
      if (target) {
        target.presentation = presentation;
        target.exportData = exportData;
      }
      return exportVisualizationTarget(target ? initializeStructuredExportTarget(target, getStructuredExportData('personalBests', 'pb-tile')) : null);
    }
