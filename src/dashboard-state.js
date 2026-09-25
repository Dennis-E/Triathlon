    // Configuration / State
    let rawCsvData = [];
    let processedActivities = [];
    let fitBestEffortsByActivityId = {};
    let gpsTracksByActivityId = {};
    let heatmapActivitySummaryIndex = new Map();
    let heatmapTooltipSegmentKey = null;
    let heatmapTooltipModel = null;
    let importedDataset = null;
    let selectedSportFilter = 'All'; // 'All', 'Run', 'Bike', 'Swim'
    let selectedAggregationLevel = 'weekly'; // 'daily', 'weekly', 'monthly', 'yearly'
    let selectedVisualizationTab = 'totalDistance'; // 'totalDistance', 'paceMetrics', 'workoutTime'
    let selectedTimeframeByAggregation = {
      daily: '3m',
      weekly: '1y',
      monthly: '1y',
      yearly: '5y'
    };
    let chartInstance = null;
