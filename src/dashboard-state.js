    // Configuration / State
    let rawCsvData = [];
    let processedActivities = [];
    let fitBestEffortsByActivityId = {};
    let gpsTracksByActivityId = {};
    let countryCountSummary = null;
    let countryCountRequestToken = 0;
    let countryCountReady = Promise.resolve(null);
    let heatmapActivitySummaryIndex = new Map();
    let heatmapTooltipSegmentKey = null;
    let heatmapTooltipModel = null;
    let importedDataset = null;
    let selectedSportFilter = 'All'; // 'All', 'Run', 'Bike', 'Swim'
    let selectedAggregationLevel = 'weekly'; // 'daily', 'weekly', 'monthly', 'yearly'
    let selectedVisualizationTab = 'totalDistance'; // 'totalDistance', 'paceMetrics', 'workoutTime'
    let visualizationAvailabilityByTab = {};
    let availableVisualizationTabs = [];
    let selectedTimeframeByAggregation = {
      daily: '3m',
      weekly: '1y',
      monthly: '1y',
      yearly: '5y'
    };
    let chartInstance = null;
    let dashboardNavigationRevision = 0;
    let dashboardDataRevision = 0;
    const dashboardFilterAdapters = new Map();

    function advanceDashboardRevision(dataChanged = false) {
      if (typeof window !== 'undefined') window.dashboardTooltips?.invalidate();
      dashboardNavigationRevision += 1;
      if (dataChanged) dashboardDataRevision += 1;
    }

    function captureDashboardRenderToken(tabId, canonicalKey) {
      return {
        tabId,
        canonicalKey,
        navigationRevision: dashboardNavigationRevision,
        dataRevision: dashboardDataRevision,
        activities: processedActivities
      };
    }

    function isDashboardRenderTokenCurrent(token, canonicalKey) {
      return token.tabId === selectedVisualizationTab && token.canonicalKey === canonicalKey &&
        token.navigationRevision === dashboardNavigationRevision && token.dataRevision === dashboardDataRevision &&
        token.activities === processedActivities;
    }
