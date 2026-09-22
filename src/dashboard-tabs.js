    // Lucide Icons init
    lucide.createIcons();
    // Deferred so all `let` state declarations below (e.g. leafletLoadPromise) have run first
    setTimeout(renderHeatmapPreviewMap, 0);

    function setVisualizationTab(tabName, options = {}) {
      const nextTab = window.dashboardTabNavigation.setVisualizationTab(tabName, options);
      if (nextTab) {
        selectedVisualizationTab = nextTab;
        if (nextTab === 'heartratePace') {
          renderHeartratePaceChart();
        } else if (nextTab === 'equipment') {
          renderEquipmentChart();
        } else if (nextTab === 'equipmentTimeline') {
          renderEquipmentTimeline();
        } else if (nextTab === 'personalBests') {
          renderPbChart();
        } else if (nextTab === 'heatmap') {
          renderHeatmap();
        } else if (nextTab === 'distributions') {
          renderDistributionsChart();
        }
      }
    }

    function handleVisualizationTabKeydown(event, currentTab) {
      const nextTab = window.dashboardTabNavigation.handleVisualizationTabKeydown(event, currentTab, {
        onTabChange: setVisualizationTab
      });

      if (nextTab) {
        selectedVisualizationTab = nextTab;
      }
    }

    // Window size listener to adapt chart autoSkip nicely
    window.addEventListener('resize', () => {
      if (chartInstance) {
        chartInstance.options.scales.x.ticks.maxTicksLimit = window.innerWidth < 640 ? 8 : 16;
        chartInstance.update();
      }
    });

    // Landing page navigation
    function goToLanding() {
      document.getElementById('landingPage').classList.remove('hidden');
      document.getElementById('dashboardMain').classList.add('hidden');
    }

    function openDashboardTab(tabName) {
      if (!hasImportedActivities()) {
        showPreviewGateModal();
        return;
      }
      document.getElementById('landingPage').classList.add('hidden');
      document.getElementById('dashboardMain').classList.remove('hidden');
      setVisualizationTab(tabName);
      const tabButton = document.getElementById(
        tabName === 'totalDistance' ? 'vizTabTotalDistance' :
        tabName === 'heartratePace' ? 'vizTabHeartratePace' :
        tabName === 'equipment' ? 'vizTabEquipment' :
        tabName === 'equipmentTimeline' ? 'vizTabEquipmentTimeline' :
        tabName === 'heatmap' ? 'vizTabHeatmap' :
        tabName === 'distributions' ? 'vizTabDistributions' :
        'vizTabPersonalBests'
      );
      if (tabButton) tabButton.focus();
    }

    const ANALYSIS_COUNTER_API_BASE_URL = 'https://trianalytics-api-520098173492.europe-west1.run.app';
    const ANALYSIS_COUNTER_CLIENT_KEY = 'k2026-09.nEWXDOuN_5rur45Xqt4h07BqeisjKNij';
    const analysisCounterClient = AnalysisCounter.createAnalysisCounter({
      apiBaseUrl: ANALYSIS_COUNTER_API_BASE_URL,
      clientKey: ANALYSIS_COUNTER_CLIENT_KEY
    });

    function setAnalysisCounter(count) {
      const counter = document.getElementById('analysisCounter');
      if (!counter || !Number.isSafeInteger(count) || count < 0) return;
      counter.textContent = `${count.toLocaleString()} analyses completed`;
      counter.classList.remove('hidden');
    }

    async function loadAnalysisCounter() {
      if (!analysisCounterClient.isConfigured()) return;
      try {
        setAnalysisCounter(await analysisCounterClient.getCount());
      } catch (error) {
        console.warn('Could not load analysis counter', error);
      }
    }

    async function recordCompletedAnalysis() {
      if (!analysisCounterClient.isConfigured()) return;
      try {
        setAnalysisCounter(await analysisCounterClient.recordAnalysis());
      } catch (error) {
        console.warn('Could not record completed analysis', error);
      }
    }

    loadAnalysisCounter();

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closePbDetail();
        closePreviewGateModal();
      }
    });

    document.getElementById('pbDetailClose').addEventListener('click', closePbDetail);

    document.getElementById('pbDetailOverlay').addEventListener('click', event => {
      if (event.target.id === 'pbDetailOverlay') closePbDetail();
    });

    window.addEventListener('resize', () => {
      if (activePbDetailModel) renderPbDetailChart(activePbDetailModel);
    });

    document.getElementById('previewGateModal').addEventListener('click', event => {
      if (event.target.id === 'previewGateModal') {
        closePreviewGateModal();
      }
    });

    document.getElementById('exportPreviewCloseBtn').addEventListener('click', closeExportPreviewModal);
    document.getElementById('exportPreviewCloseBtn2').addEventListener('click', closeExportPreviewModal);
    document.getElementById('exportPreviewDownloadBtn').addEventListener('click', downloadExportedImage);
    document.getElementById('pbDetailExport').addEventListener('click', exportActivePbDetail);
    document.getElementById('exportPreviewModal').addEventListener('click', event => {
      if (event.target.id === 'exportPreviewModal') closeExportPreviewModal();
    });

    setVisualizationTab(selectedVisualizationTab);
