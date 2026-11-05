    // Standard Sport Categorization
    const SPORT_MAP = {
      'lauf': 'Run', 'laufen': 'Run', 'run': 'Run', 'running': 'Run', 'virtueller lauf': 'Run',
      'trail run': 'Run', 'trailrun': 'Run', 'walk': 'Run', 'gehen': 'Run',
      'radfahrt': 'Bike', 'virtuelle radfahrt': 'Bike', 'radfahren': 'Bike', 'ride': 'Bike', 'virtual ride': 'Bike', 'virtualride': 'Bike', 'virtuelle fahrt': 'Bike', 'bike': 'Bike', 'biking': 'Bike', 'cycling': 'Bike', 'gravel ride': 'Bike', 'mountain bike ride': 'Bike', 'ebike ride': 'Bike', 'e-bike ride': 'Bike',
      'schwimmen': 'Swim', 'swim': 'Swim', 'swimming': 'Swim'
    };

    const COUNTRY_BOUNDARY_ASSET_URL = './assets/country-boundaries/ne_50m_admin_0_countries.geojson';
    let countryCountResourcesPromise = null;

    function loadCountryCountResources() {
      if (!countryCountResourcesPromise) {
        countryCountResourcesPromise = Promise.all([
          fetch(COUNTRY_BOUNDARY_ASSET_URL).then(response => {
            if (!response.ok) throw new Error('Country boundary data could not be loaded');
            return response.json();
          }),
          import('https://esm.sh/@turf/boolean-intersects@7.4.0'),
          import('https://esm.sh/@turf/boolean-point-in-polygon@7.4.0')
        ]).then(([countryGeoJson, intersectsModule, pointInPolygonModule]) => {
          if (!countryGeoJson || !Array.isArray(countryGeoJson.features)) {
            throw new Error('Country boundary data is invalid');
          }
          if (typeof intersectsModule.booleanIntersects !== 'function' || typeof pointInPolygonModule.booleanPointInPolygon !== 'function') {
            throw new Error('Country geometry functions are unavailable');
          }
          return {
            countryFeatures: countryGeoJson.features,
            geometryOperations: {
              booleanIntersects: intersectsModule.booleanIntersects,
              booleanPointInPolygon: pointInPolygonModule.booleanPointInPolygon
            }
          };
        }).catch(error => {
          countryCountResourcesPromise = null;
          throw error;
        });
      }
      return countryCountResourcesPromise;
    }

    function hasUsableCountryCountTrack(activities, tracksByActivityId) {
      return activities.some(activity => {
        if (!activity || activity.id === null || activity.id === undefined) return false;
        const track = tracksByActivityId[String(activity.id)];
        return !!(track && Array.isArray(track.points) && track.points.some(point => (
          Array.isArray(point)
          && point.length >= 2
          && Number.isFinite(point[0])
          && Number.isFinite(point[1])
          && point[0] >= -90
          && point[0] <= 90
          && point[1] >= -180
          && point[1] <= 180
        )));
      });
    }

    function renderLifetimeCountryCount() {
      if (window.lifetimeStatisticsDashboard && typeof window.lifetimeStatisticsDashboard.render === 'function') {
        window.lifetimeStatisticsDashboard.render();
      }
    }

    function refreshCountryCountSummary(resourcesLoader = loadCountryCountResources) {
      const requestToken = ++countryCountRequestToken;
      const activities = processedActivities;
      const tracksByActivityId = gpsTracksByActivityId;
      countryCountSummary = null;
      renderLifetimeCountryCount();

      if (!hasUsableCountryCountTrack(activities, tracksByActivityId)) {
        countryCountSummary = window.countryCountUtils.aggregateCountryCount({
          activities,
          gpsTracksByActivityId: tracksByActivityId,
          countryFeatures: [],
          geometryOperations: {}
        });
        renderLifetimeCountryCount();
        countryCountReady = Promise.resolve(countryCountSummary);
        return countryCountReady;
      }

      countryCountReady = Promise.resolve()
        .then(() => resourcesLoader())
        .then(resources => window.countryCountUtils.aggregateCountryCount({
          activities,
          gpsTracksByActivityId: tracksByActivityId,
          countryFeatures: resources.countryFeatures,
          geometryOperations: resources.geometryOperations
        }))
        .catch(() => window.countryCountUtils.aggregateCountryCount({
          activities,
          gpsTracksByActivityId: tracksByActivityId,
          countryFeatures: [],
          geometryOperations: {}
        }))
        .then(summary => {
          if (requestToken === countryCountRequestToken) {
            countryCountSummary = summary;
            renderLifetimeCountryCount();
          }
          return summary;
        });

      return countryCountReady;
    }

    let importExperienceTimer = null;
    let importExperienceSession = null;
    let importExperienceVisibilityHandler = null;
    let importExperienceFadeFrame = null;
    let importIllustrationRequestToken = 0;
    const IMPORT_EXPERIENCE_ROTATION_INTERVAL = 8000;

    function findHeaderIndex(headers, matcher) {
      if (!Array.isArray(headers)) return -1;

      if (matcher.type === 'exact') {
        return headers.indexOf(matcher.header);
      }

      if (matcher.type === 'oneOf') {
        for (const header of matcher.headers) {
          const index = headers.indexOf(header);
          if (index !== -1) return index;
        }
        return -1;
      }

      if (matcher.type === 'predicate') {
        return headers.findIndex(header => matcher.predicate(header));
      }

      return -1;
    }

    function createImportedDataset(csvRows, sourceLabel) {
      const statisticsAccumulator = window.importExperienceCatalog.createStatisticsAccumulator();
      const activities = processData(csvRows, activity => {
        window.importExperienceCatalog.accumulateActivityStatistics(statisticsAccumulator, activity);
      });
      return {
        kind: 'tri-activities-v1',
        importedAt: new Date().toISOString(),
        sourceLabel,
        rawCsvData: csvRows,
        activities,
        heartRateCoverage: window.heartRateUtils?.summarizeHeartRateCoverage(activities) || null,
        importExperienceStatistics: window.importExperienceCatalog.finalizeStatistics(statisticsAccumulator),
        fitBestEffortsByActivityId: {},
        gpsTracksByActivityId: {}
      };
    }

    function createTrainingPeaksImportedDataset(importResult, sourceFileNames = []) {
      const activities = Array.isArray(importResult && importResult.activities) ? importResult.activities : [];
      const statisticsAccumulator = window.importExperienceCatalog.createStatisticsAccumulator();
      activities.forEach(activity => window.importExperienceCatalog.accumulateActivityStatistics(statisticsAccumulator, activity));
      return {
        kind: 'tri-activities-v1',
        importedAt: new Date().toISOString(),
        sourceLabel: 'TrainingPeaks ZIP import',
        rawCsvData: [],
        importedFileCount: sourceFileNames.length,
        importedSourceFiles: sourceFileNames.map(name => String(name)),
        activities,
        heartRateCoverage: importResult.heartRateCoverage || window.heartRateUtils?.summarizeHeartRateCoverage(activities) || null,
        importExperienceStatistics: window.importExperienceCatalog.finalizeStatistics(statisticsAccumulator),
        fitBestEffortsByActivityId: importResult.fitBestEffortsByActivityId || {},
        gpsTracksByActivityId: importResult.gpsTracksByActivityId || {},
        skippedUnsupportedSportCount: Number.isSafeInteger(importResult.skippedUnsupportedSportCount)
          ? importResult.skippedUnsupportedSportCount : 0,
        skippedInvalidSessionCount: Number.isSafeInteger(importResult.skippedInvalidSessionCount)
          ? importResult.skippedInvalidSessionCount : 0,
        skippedGpxRouteCount: Number.isSafeInteger(importResult.skippedGpxRouteCount)
          ? importResult.skippedGpxRouteCount : 0
      };
    }

    let dashboardImportGeneration = 0;
    let appleWorkerImport = null;
    let appleHealthRetryFile = null;
    let sampleImportOperation = null;
    let sampleImportPromise = null;

    function setSampleImportFeedback(message) {
      const status = typeof document !== 'undefined' ? document.getElementById('sampleDataStatus') : null;
      if (status) status.textContent = message;
    }

    function handleSampleDataIngest(dependencies = {}) {
      if (sampleImportOperation && isCurrentImportOperation(sampleImportOperation)) return sampleImportPromise;
      const operation = beginImportOperation('sample');
      sampleImportOperation = operation;
      const button = typeof document !== 'undefined' ? document.getElementById('sampleDataBtn') : null;
      if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
      setSampleImportFeedback('Loading sample training data...');
      sampleImportPromise = (async () => {
        try {
          const loadPayload = dependencies.loadPayload || (async () => {
            const response = await fetch('./sample-data/silicon-valley-training.json');
            if (!response.ok) throw new Error('Sample training data is currently unavailable.');
            return response.json();
          });
          const payload = await loadPayload();
          if (!isCurrentImportOperation(operation)) return null;
          const hydrateDataset = dependencies.hydrateDataset || window.sampleDataUtils.hydrateSampleDataset;
          const dataset = hydrateDataset(payload);
          const accumulator = window.importExperienceCatalog.createStatisticsAccumulator();
          dataset.activities.forEach(activity => window.importExperienceCatalog.accumulateActivityStatistics(accumulator, activity));
          dataset.importExperienceStatistics = window.importExperienceCatalog.finalizeStatistics(accumulator);
          if (!isCurrentImportOperation(operation)) return null;
          const applyDataset = dependencies.applyDataset || applyImportedDataset;
          applyDataset(dataset, { openDashboard: true, operation });
          operation.committed = true;
          setSampleImportFeedback('Synthetic sample training data');
          return dataset;
        } catch (error) {
          if (!isCurrentImportOperation(operation)) return null;
          operation.failed = !operation.committed;
          setSampleImportFeedback(operation.committed ? 'Sample loaded, but a view could not be displayed. Try another view.'
            : 'Could not load sample data. Try again or import your own export.');
          return null;
        } finally {
          if (sampleImportOperation === operation) {
            if (button) { button.disabled = false; button.setAttribute('aria-busy', 'false'); }
            if (!isCurrentImportOperation(operation)) setSampleImportFeedback('');
            sampleImportOperation = null;
            sampleImportPromise = null;
          }
        }
      })();
      return sampleImportPromise;
    }

    function clearAppleHealthRetry() {
      appleHealthRetryFile = null;
      const button = typeof document !== 'undefined' ? document.getElementById('appleHealthRetryBtn') : null;
      button?.classList.add('hidden');
    }

    function beginImportOperation(sourceType) {
      clearAppleHealthRetry();
      if (appleWorkerImport) appleWorkerImport.cancel();
      return { generation: ++dashboardImportGeneration, sourceType, committed: false,
        counted: false, failed: false, releasedMedia: new WeakSet() };
    }

    function isCurrentImportOperation(operation) {
      return !!operation && operation.generation === dashboardImportGeneration;
    }

    function releaseUncommittedImportMedia(operation, candidate) {
      const library = candidate && candidate.mediaLibrary;
      if (!operation || operation.committed || !library || typeof library.release !== 'function'
          || operation.releasedMedia.has(library)) return;
      operation.releasedMedia.add(library);
      library.release();
    }

    function recordImportOperation(operation, recordAnalysis = recordCompletedAnalysis) {
      if (!operation.committed || operation.counted || operation.sourceType === 'sample') return;
      operation.counted = true;
      return recordAnalysis();
    }

    async function executeTrainingPeaksZipImport(zipFiles, dependencies = {}) {
      const selectedFiles = Array.from(zipFiles || []);
      if (selectedFiles.length === 0) return null;

      const operation = dependencies.operation || beginImportOperation('personal');
      const importZips = dependencies.importZips || importTrainingPeaksZips;
      const recordAnalysis = dependencies.recordAnalysis || recordCompletedAnalysis;
      let candidate = null;
      try {
        const importResult = await importZips(selectedFiles, progress => {
          if (isCurrentImportOperation(operation) && typeof dependencies.reportProgress === 'function') {
            dependencies.reportProgress(progress);
          }
        });
        candidate = importResult;
        if (!isCurrentImportOperation(operation)) {
          releaseUncommittedImportMedia(operation, candidate);
          return null;
        }
        const dataset = createTrainingPeaksImportedDataset(importResult, selectedFiles.map(file => file.name));
        if (typeof dependencies.onDatasetPrepared === 'function') dependencies.onDatasetPrepared(dataset);
        if (!isCurrentImportOperation(operation)) {
          releaseUncommittedImportMedia(operation, candidate);
          return null;
        }
        const applyDataset = dependencies.applyDataset || applyImportedDataset;
        applyDataset(dataset, { openDashboard: true, operation });
        operation.committed = true;
        await recordImportOperation(operation, recordAnalysis);
        return dataset;
      } catch (error) {
        releaseUncommittedImportMedia(operation, candidate);
        if (operation.committed) await recordImportOperation(operation, recordAnalysis);
        if (!isCurrentImportOperation(operation)) return null;
        operation.failed = !operation.committed;
        throw error;
      }
    }

    function createAppleHealthImportedDataset(importResult, fileName) {
      const dataset = createTrainingPeaksImportedDataset(importResult, [fileName]);
      dataset.sourceLabel = 'Apple Health ZIP import';
      dataset.diagnostics = { ...(importResult.diagnostics || {}), heartRateCoverage: dataset.heartRateCoverage };
      return dataset;
    }

    function importAppleHealthInWorker(file, reportProgress, operation) {
      const utility = window.appleHealthUtils;
      if (!utility || typeof utility.inspectRuntimeCapabilities !== 'function' || typeof utility.runtimeFailure !== 'function') {
        return Promise.reject(Object.assign(new Error('Apple Health import utilities could not load. Reload the app and retry.'),
          { code: utility ? 'DEPENDENCY_INVALID' : 'DEPENDENCY_LOAD_FAILED' }));
      }
      const preflight = utility.inspectRuntimeCapabilities(globalThis, 'window', operation.generation);
      if (preflight) return Promise.reject(utility.runtimeFailure(preflight.code, preflight));
      const failure = (code, phase = 'worker-start', component = 'worker') => utility.runtimeFailure(code,
        { generation: operation.generation, phase, component, environment: utility.getRuntimeEnvironment(globalThis, 'window') });
      return new Promise((resolve, reject) => {
        let worker = null;
        let settled = false;
        let ready = false;
        let heartbeat = null;
        let watchdog = null;
        const finish = (error, result) => {
          if (settled) return;
          settled = true;
          if (heartbeat !== null) { clearInterval(heartbeat); heartbeat = null; }
          if (watchdog !== null) { clearTimeout(watchdog); watchdog = null; }
          if (worker) {
            worker.onmessage = null;
            worker.onerror = null;
            worker.onmessageerror = null;
            try { worker.terminate(); } catch (terminateError) { }
          }
          if (appleWorkerImport && appleWorkerImport.worker === worker) appleWorkerImport = null;
          if (error) reject(error); else resolve(result);
        };
        const protocolFailure = () => failure('WORKER_PROTOCOL_ERROR', ready ? 'result' : 'worker-start', 'protocol');
        const send = message => {
          try { worker.postMessage(message); }
          catch (transportError) { finish(protocolFailure()); }
        };
        const notify = progress => {
          try { if (typeof reportProgress === 'function') reportProgress(progress); }
          catch (progressError) { finish(failure('INTERNAL_ERROR', 'parsing', 'importer')); }
        };
        try { worker = new Worker('./src/apple-health-worker.js'); }
        catch (startError) { finish(failure('WORKER_START_FAILED')); return; }
        appleWorkerImport = { worker, cancel: () => finish(failure('CANCELLED')) };
        worker.onerror = () => finish(failure('WORKER_RUNTIME_FAILED', ready ? 'parsing' : 'worker-start'));
        worker.onmessageerror = () => finish(protocolFailure());
        worker.onmessage = event => {
          if (settled) return;
          if (!isCurrentImportOperation(operation)) { finish(failure('CANCELLED')); return; }
          const message = event.data;
          if (!message || typeof message !== 'object' || Array.isArray(message)) { finish(protocolFailure()); return; }
          if (Number.isSafeInteger(message.generation) && message.generation >= 0 && message.generation !== operation.generation) return;
          if (message.v !== 1 || message.generation !== operation.generation) { finish(protocolFailure()); return; }
          if (message.type === 'ready') {
            if (ready || Object.keys(message).some(key => !['v', 'type', 'generation'].includes(key))) { finish(protocolFailure()); return; }
            ready = true;
            if (watchdog !== null) { clearTimeout(watchdog); watchdog = null; }
            if (heartbeat !== null) { clearInterval(heartbeat); heartbeat = null; }
            send({ v: 1, type: 'start', generation: operation.generation, file });
            return;
          }
          if (message.type === 'progress') {
            const stages = { readingWorkouts: 'Reading Apple Health workouts...', normalizing: 'Preparing workouts...',
              enrichingMeasurements: 'Matching workout measurements...', readingRoutes: 'Reading workout routes...', finalizing: 'Preparing visualizations...' };
            if (!ready || !Object.prototype.hasOwnProperty.call(stages, message.phase) || !Number.isFinite(message.percent) || message.percent < 0 || message.percent > 100) {
              finish(protocolFailure()); return;
            }
            const progress = { phase: message.phase, percent: message.percent, stage: stages[message.phase] };
            for (const [field, maximum] of [['processedBytes', 24 * 1024 ** 3], ['processedWorkouts', 100000]]) {
              if (message[field] !== undefined) {
                if (!Number.isSafeInteger(message[field]) || message[field] < 0 || message[field] > maximum) { finish(protocolFailure()); return; }
                progress[field] = message[field];
              }
            }
            notify(progress);
          } else if (message.type === 'error') {
            const diagnostic = utility.validateRuntimeDiagnostic(message.diagnostic, operation.generation);
            if (!diagnostic || diagnostic.code !== message.code) { finish(protocolFailure()); return; }
            finish(utility.runtimeFailure(diagnostic.code, diagnostic));
          }
          else if (message.type === 'complete') {
            try {
              if (!ready) throw protocolFailure();
              const result = message.result;
              if (!result || !Array.isArray(result.activities) || !result.activities.length || result.activities.length > 100000) throw protocolFailure();
              result.activities = result.activities.map(activity => {
                const startTime = new Date(activity.startTime);
                if (!Number.isFinite(startTime.getTime()) || !['Run', 'Bike', 'Swim'].includes(activity.sport) || !activity.sourceLocalStart) throw protocolFailure();
                const local = activity.sourceLocalStart;
                if (![local.year, local.month, local.day].every(Number.isInteger)) throw protocolFailure();
                const calendar = utility.calendarDates(local);
                if (calendar.date.getFullYear() !== local.year || calendar.date.getMonth() + 1 !== local.month || calendar.date.getDate() !== local.day) throw protocolFailure();
                return { ...activity, startTime, ...calendar };
              });
              const tracks = Object.create(null);
              let pointCount = 0;
              for (const [id, track] of Object.entries(result.gpsTracksByActivityId || {})) {
                if (!(track.coordinates instanceof Float64Array) || !(track.offsets instanceof Uint32Array) || track.coordinates.length % 2 || track.offsets.length < 2) throw protocolFailure();
                const size = track.coordinates.length / 2;
                pointCount += size;
                if (size > 500000 || pointCount > 2000000 || track.offsets[0] !== 0 || track.offsets[track.offsets.length - 1] !== size) throw utility.failure('RESOURCE_LIMIT');
                const segments = [];
                for (let index = 0; index + 1 < track.offsets.length; index++) {
                  const start = track.offsets[index];
                  const end = track.offsets[index + 1];
                  if (start > end || end > size) throw protocolFailure();
                  const points = [];
                  for (let cursor = start; cursor < end; cursor++) {
                    const latitude = track.coordinates[cursor * 2];
                    const longitude = track.coordinates[cursor * 2 + 1];
                    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw protocolFailure();
                    points.push([latitude, longitude]);
                  }
                  segments.push(points);
                }
                tracks[id] = { sport: track.sport, segments, points: segments.flat() };
              }
              result.gpsTracksByActivityId = tracks;
              finish(null, result);
            } catch (error) { finish(error && error.code === 'RESOURCE_LIMIT' ? failure('RESOURCE_LIMIT', 'result', 'importer') : protocolFailure()); }
          } else finish(protocolFailure());
        };
        heartbeat = setInterval(() => {
          if (!ready && isCurrentImportOperation(operation)) notify({ percent: 0, stage: 'Loading Apple Health importer...' });
        }, 1000);
        watchdog = setTimeout(() => { if (!ready) finish(failure('WORKER_INIT_TIMEOUT')); }, 30000);
        send({ v: 1, type: 'init', generation: operation.generation });
      });
    }

    async function executeAppleHealthZipImport(file, dependencies = {}) {
      if (!file) return null;
      const operation = dependencies.operation || beginImportOperation('personal');
      const importFile = dependencies.importFile || ((selected, progress) => importAppleHealthInWorker(selected, progress, operation));
      const recordAnalysis = dependencies.recordAnalysis || recordCompletedAnalysis;
      try {
        const result = await importFile(file, progress => {
          if (isCurrentImportOperation(operation) && dependencies.reportProgress) dependencies.reportProgress(progress);
        });
        if (!isCurrentImportOperation(operation)) return null;
        if (!result || !Array.isArray(result.activities) || !result.activities.length) {
          throw new Error('No valid running, cycling or swimming workouts were found.');
        }
        const dataset = createAppleHealthImportedDataset(result, file.name);
        if (dependencies.onDatasetPrepared) dependencies.onDatasetPrepared(dataset);
        if (!isCurrentImportOperation(operation)) return null;
        (dependencies.applyDataset || applyImportedDataset)(dataset, { openDashboard: true, operation });
        operation.committed = true;
        await recordImportOperation(operation, recordAnalysis);
        return dataset;
      } catch (error) {
        if (operation.committed) await recordImportOperation(operation, recordAnalysis);
        if (!isCurrentImportOperation(operation)) return null;
        operation.failed = !operation.committed;
        throw error;
      }
    }

    function renderHeartRateImportNote(dataset) {
      const note = document.getElementById('heartRateImportNote');
      if (!note) return;
      const coverage = dataset.sourceType !== 'sample' && dataset.heartRateCoverage;
      let text = '';
      if (coverage) {
        const count = (kind, category) => Number.isSafeInteger(coverage[kind]?.[category]) && coverage[kind][category] >= 0 ? coverage[kind][category] : 0;
        const direct = count('minimum', 'summary') + count('maximum', 'summary');
        const observed = count('minimum', 'records') + count('maximum', 'records');
        if (!direct && !observed) text = coverage.average > 0
          ? 'Average heart rate available; no usable minimum/maximum values.' : 'No usable minimum/maximum heart-rate values in this import.';
        else text = `Heart-rate extrema: ${direct} direct, ${observed} from recorded measurements.`;
        const missingMinimum = count('minimum', 'missing');
        const missingMaximum = count('maximum', 'missing');
        const invalid = count('minimum', 'invalid') + count('maximum', 'invalid');
        const conflicts = count('minimum', 'conflict') + count('maximum', 'conflict');
        const unqualified = count('minimum', 'unqualified') + count('maximum', 'unqualified');
        if (missingMinimum || missingMaximum) text += ` Missing minimum: ${missingMinimum}; missing maximum: ${missingMaximum}.`;
        if (invalid) text += ` Invalid: ${invalid}.`;
        if (conflicts) text += ` Conflicting: ${conflicts}.`;
        if (unqualified) text += ` Unqualified: ${unqualified}.`;
      }
      note.textContent = text;
      if (text) note.classList.remove('hidden');
      else note.classList.add('hidden');
    }

    function applyImportedDataset(dataset, options = {}) {
      if (options.operation && !isCurrentImportOperation(options.operation)) {
        releaseUncommittedImportMedia(options.operation, dataset);
        return false;
      }
      const nextSummaryIndex = window.heatmapUtils.buildActivitySummaryIndex(dataset.activities);
      const previousDataset = importedDataset;
      window.dashboardTooltips?.invalidate();
      importedDataset = dataset;
      rawCsvData = dataset.rawCsvData;
      processedActivities = dataset.activities;
      fitBestEffortsByActivityId = dataset.fitBestEffortsByActivityId || {};
      gpsTracksByActivityId = dataset.gpsTracksByActivityId || {};
      heatmapActivitySummaryIndex = nextSummaryIndex;
      window.heartRateDashboard?.reset();
      if (options.operation) options.operation.committed = true;
      if (previousDataset && previousDataset !== dataset && typeof closeExportPreviewModal === 'function') {
        closeExportPreviewModal();
      }
      if (typeof closePbDetail === 'function') closePbDetail();
      if (previousDataset && previousDataset !== dataset && previousDataset.mediaLibrary &&
          typeof previousDataset.mediaLibrary.release === 'function') {
        if (window.mediaGalleryDashboard && typeof window.mediaGalleryDashboard.clear === 'function') {
          window.mediaGalleryDashboard.clear();
        }
        previousDataset.mediaLibrary.release();
      }
      const countryCountResult = refreshCountryCountSummary(options.countryCountResourcesLoader);
      hideHeatmapActivityTooltip();

      const importLabel = dataset.sourceType === 'sample' ? 'Synthetic sample training data'
        : dataset.sourceLabel === 'Apple Health ZIP import' ? 'Imported Apple Health history'
        : dataset.sourceLabel === 'TrainingPeaks ZIP import' ? 'Imported TrainingPeaks history' : 'Imported Strava history';
      updateStatusBadge('success', importLabel);
      renderHeartRateImportNote(dataset);
      if (dataset.sourceType !== 'sample') setSampleImportFeedback('');

      document.getElementById('previewCardsContainer').classList.remove('hidden');
      document.getElementById('enterDashboardContainer').classList.remove('hidden');
      document.getElementById('emptyStateMessage').classList.add('hidden');
      closePreviewGateModal();

      setSportFilter('All', false);
      initPaceMetricsControls({ reset: true });
      if (typeof selectedTrainingCalendarPalette !== 'undefined') selectedTrainingCalendarPalette = 'green';
      renderTimeframeButtons();
      initScatterDateSlider();
      initDistributionsDateSlider();
      initTrainingCalendarControls();
      if (typeof refreshHeatmapYearControls === 'function') refreshHeatmapYearControls();
      refreshVisualizationTabs();

      renderDashboard();
      renderPaceMetricsChart();
      renderEquipmentChart();
      renderPbChart();
      renderTrainingCalendar();
      if (typeof selectedVisualizationTab !== 'undefined' && selectedVisualizationTab === 'heartRate') window.heartRateDashboard?.render();

      if (options.openDashboard) {
        openDashboardTab(availableVisualizationTabs[0]);
      }

      return countryCountResult;
    }

    function setImportModalVisualState(iconName, spinning) {
      const modal = document.getElementById('importProgressModal');
      if (!modal) return;

      const iconWrapper = modal.querySelector('[data-import-icon-wrapper]');
      if (!iconWrapper) return;

      iconWrapper.classList.toggle('animate-spin', !!spinning);
      iconWrapper.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
      window.lucide.createIcons({
        icons: iconWrapper.querySelectorAll('[data-lucide]')
      });
    }

    function showImportProgressModal() {
      const modal = document.getElementById('importProgressModal');
      if (!modal) return;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      startImportExperienceRotation();
    }

    function hideImportProgressModal() {
      clearAppleHealthRetry();
      const modal = document.getElementById('importProgressModal');
      if (!modal) return;
      stopImportExperienceRotation();
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function renderImportExperienceMessage(entry) {
      if (!entry) return;
      const message = document.getElementById('importProgressMessage');
      const illustration = document.getElementById('importExperienceIllustration');
      if (!message || !illustration) return;
      const requestToken = ++importIllustrationRequestToken;
      const preview = document.getElementById('importProgressPreview');
      if (preview) {
        if (importExperienceFadeFrame !== null) cancelAnimationFrame(importExperienceFadeFrame);
        preview.classList.add('import-experience-is-changing');
        importExperienceFadeFrame = requestAnimationFrame(() => {
          preview.classList.remove('import-experience-is-changing');
          importExperienceFadeFrame = null;
        });
      }
      message.textContent = entry.text;
      illustration.style.visibility = 'hidden';
      illustration.onload = () => {
        if (requestToken !== importIllustrationRequestToken) return;
        illustration.style.visibility = '';
      };
      illustration.onerror = () => {
        if (requestToken !== importIllustrationRequestToken) return;
        illustration.onload = null;
        illustration.onerror = null;
        illustration.removeAttribute('src');
      };
      illustration.src = entry.illustrationPath;
      illustration.alt = '';
      illustration.setAttribute('aria-hidden', 'true');
    }

    function advanceImportExperience() {
      if (!importExperienceSession || !importExperienceSession.active || document.hidden) return;
      const nextMessage = window.importExperienceCatalog.getNextMessage(importExperienceSession);
      renderImportExperienceMessage(nextMessage);
    }

    function scheduleImportExperienceRotation() {
      if (importExperienceTimer !== null || !importExperienceSession || document.hidden) return;
      importExperienceTimer = setInterval(advanceImportExperience, IMPORT_EXPERIENCE_ROTATION_INTERVAL);
    }

    function handleImportExperienceVisibilityChange() {
      if (document.hidden) {
        if (importExperienceTimer !== null) clearInterval(importExperienceTimer);
        importExperienceTimer = null;
        return;
      }
      scheduleImportExperienceRotation();
    }

    function startImportExperienceRotation() {
      stopImportExperienceRotation();
      importExperienceSession = window.importExperienceCatalog.createSession({ phase: 'processing' });
      renderImportExperienceMessage(window.importExperienceCatalog.getNextMessage(importExperienceSession));
      importExperienceVisibilityHandler = handleImportExperienceVisibilityChange;
      document.addEventListener('visibilitychange', importExperienceVisibilityHandler);
      scheduleImportExperienceRotation();
    }

    function stopImportExperienceRotation() {
      if (importExperienceTimer !== null) {
        clearInterval(importExperienceTimer);
        importExperienceTimer = null;
      }
      if (importExperienceFadeFrame !== null) {
        cancelAnimationFrame(importExperienceFadeFrame);
        importExperienceFadeFrame = null;
      }
      if (importExperienceVisibilityHandler) {
        document.removeEventListener('visibilitychange', importExperienceVisibilityHandler);
        importExperienceVisibilityHandler = null;
      }
      if (importExperienceSession) {
        window.importExperienceCatalog.stopSession(importExperienceSession);
        importExperienceSession = null;
      }
    }

    function importCsvText(csvText, options = {}) {
      if (typeof csvText !== 'string' || !csvText.trim()) return Promise.reject(new Error('CSV is empty or invalid'));
      const operation = options.operation || beginImportOperation('personal');
      return new Promise((resolve, reject) => {
        const fail = error => {
          releaseUncommittedImportMedia(operation, options);
          if (!isCurrentImportOperation(operation)) {
            resolve(null);
            return;
          }
          operation.failed = !operation.committed;
          if (operation.committed) recordImportOperation(operation);
          updateStatusBadge('error', error.message || 'Could not process imported data');
          reject(error);
        };
        Papa.parse(csvText, {
          header: false, // We'll process indexes manually to avoid header collisions
          skipEmptyLines: true,
          complete: function(results) {
            if (!isCurrentImportOperation(operation)) {
              releaseUncommittedImportMedia(operation, options);
              resolve(null);
              return;
            }
            if (results.data.length < 2) {
              fail(new Error('CSV is empty or invalid'));
              return;
            }

            try {
              const dataset = createImportedDataset(results.data, options.sourceLabel || 'Imported data');
              if (options.fitBestEffortsByActivityId && typeof options.fitBestEffortsByActivityId === 'object') {
                dataset.fitBestEffortsByActivityId = options.fitBestEffortsByActivityId;
              }
              if (options.gpsTracksByActivityId && typeof options.gpsTracksByActivityId === 'object') {
                dataset.gpsTracksByActivityId = options.gpsTracksByActivityId;
              }
              if (options.mediaLibrary && typeof options.mediaLibrary === 'object') {
                dataset.mediaLibrary = options.mediaLibrary;
              }
              if (typeof options.onDatasetPrepared === 'function') options.onDatasetPrepared(dataset);
              if (!isCurrentImportOperation(operation)) {
                releaseUncommittedImportMedia(operation, options);
                resolve(null);
                return;
              }
              applyImportedDataset(dataset, { ...options, operation });
              operation.committed = true;
              recordImportOperation(operation);
              resolve(dataset);
            } catch (err) {
              fail(err);
            }
          },
          error: function(err) {
            fail(err);
          }
        });
      });
    }

    function normalizeMetricHeader(header) {
      return String(header || '')
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .replace(/[()\[\]_-]+/g, ' ')
        .replace(/\s+/g, ' ');
    }

    function isElevationHeader(header) {
      const normalized = normalizeMetricHeader(header);
      return normalized.includes('höhenmeter') || normalized.includes('elevation gain') ||
        normalized.includes('höhenzunahme') || normalized.includes('höhenunterschied') ||
        normalized.includes('total elevation') || normalized.includes('elevation ascent') ||
        normalized === 'ascent' || normalized.includes('ascent m');
    }

    function parseMetricNumber(value) {
      if (value === null || value === undefined || value === '') return null;
      let normalized = String(value).trim().replace(/\s/g, '');
      if (normalized.includes(',') && normalized.includes('.')) {
        normalized = normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
          ? normalized.replace(/\./g, '').replace(',', '.')
          : normalized.replace(/,/g, '');
      } else if (normalized.includes(',')) {
        normalized = normalized.replace(',', '.');
      }
      const parsed = Number.parseFloat(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    // Map CSV rows to objects
    function processData(csvRows, onActivityProcessed) {
      if (!Array.isArray(csvRows) || csvRows.length < 2) {
        throw new Error('CSV is empty or invalid');
      }

      const headers = csvRows[0];
      
      // Dynamic column resolution
      let dateIdx = findHeaderIndex(headers, { type: 'oneOf', headers: ['Aktivitätsdatum', 'Activity Date'] });
      if (dateIdx === -1) {
        dateIdx = headers.findIndex(h => h && h.includes('Aktivitätsdatum'));
      }

      let sportIdx = findHeaderIndex(headers, { type: 'oneOf', headers: ['Aktivitätsart', 'Activity Type', 'Sport Type'] });
      if (sportIdx === -1) {
        sportIdx = headers.findIndex(h => h && h.includes('Aktivitätsart'));
      }

      const nameIdx = findHeaderIndex(headers, { type: 'oneOf', headers: ['Name der Aktivität', 'Activity Name'] });
      const equipmentIdx = findHeaderIndex(headers, { type: 'oneOf', headers: ['Aktivitätsausrüstung', 'Activity Gear', 'Ausrüstung', 'Fahrrad', 'Gear', 'Bike'] });
      const durationIdx = findHeaderIndex(headers, { type: 'oneOf', headers: ['Bewegungszeit', 'Moving Time'] }); // Moving time is better than elapsed time
      const avgHeartRateIdx = headers.findIndex(h => {
        if (!h) return false;
        const normalized = String(h).toLowerCase();
        return (normalized.includes('herz') || normalized.includes('heart')) &&
          (normalized.includes('durch') || normalized.includes('avg') || normalized.includes('durchschnitt') || normalized.includes('average'));
      });
      const avgWattsIdx = headers.findIndex(h => {
        if (!h) return false;
        const normalized = String(h).toLowerCase();
        return (normalized.includes('watt') || normalized.includes('power')) &&
          (normalized.includes('durch') || normalized.includes('avg') || normalized.includes('durchschnitt') || normalized.includes('average'));
      });
      const avgCadenceIdx = headers.findIndex(h => {
        if (!h) return false;
        const normalized = String(h).toLowerCase();
        return (normalized.includes('trittfrequenz') || normalized.includes('cadence')) &&
          (normalized.includes('durch') || normalized.includes('avg') || normalized.includes('durchschnitt') || normalized.includes('average'));
      });
      const totalStepsIdx = headers.findIndex(h => {
        const normalized = String(h || '').toLowerCase();
        return normalized.includes('schritte insgesamt') || normalized.includes('total steps');
      });
      const elevationIdx = headers.findIndex(h => isElevationHeader(h));

      // Find 'Distanz' columns (index 17 is usually the dot-formatted meters)
      const distIndices = [];
      headers.forEach((h, i) => {
        if (h === 'Distanz' || h === 'Distance') distIndices.push(i);
      });
      // Standardize to the second 'Distanz' column (meters) if present, else fallback
      const distIdx = distIndices.length > 1 ? distIndices[1] : (distIndices[0] || -1);

      if (dateIdx === -1 || sportIdx === -1) {
        throw new Error('Could not locate core columns');
      }

      const nextProcessedActivities = [];

      for (let i = 1; i < csvRows.length; i++) {
        const row = csvRows[i];
        if (row.length <= Math.max(dateIdx, sportIdx)) continue;

        const rawDate = row[dateIdx];
        const startTime = parseGermanDate(rawDate);
        if (!startTime) continue; // Invalid date
        const date = new Date(startTime);
        date.setHours(0, 0, 0, 0);

        const rawSport = row[sportIdx] || '';
        const sportCategory = SPORT_MAP[rawSport.toLowerCase().trim()] || null;
        
        // If not swimming, running, or cycling, keep it but category is null (for stats comparison/lists if needed)
        // For MVP stacking we only include Run, Bike, Swim

        // Raw distance is in meters in index 17
        let distKm = 0;
        let distanceAvailable = false;
        if (distIdx !== -1) {
          let rawDist = row[distIdx];
          if (rawDist) {
            // Check if string contains comma (German style) or dot
            if (typeof rawDist === 'string') {
              rawDist = rawDist.replace(',', '.');
            }
            const numericDist = parseFloat(rawDist);
            if (!isNaN(numericDist)) {
              distanceAvailable = Number.isFinite(numericDist) && numericDist >= 0;
              // If we are using the 2nd Distanz column, it is in meters
              if (distIdx === distIndices[1]) {
                distKm = numericDist / 1000;
              } else {
                // If 1st column, it is already in km
                distKm = numericDist;
              }
            }
          }
        }

        let durationSeconds = 0;
        let durationAvailable = false;
        if (durationIdx !== -1) {
          const rawDuration = parseFloat(row[durationIdx]);
          if (!isNaN(rawDuration)) {
            durationSeconds = rawDuration;
            durationAvailable = Number.isFinite(rawDuration) && rawDuration >= 0;
          }
        }

        const name = row[nameIdx] || 'Activity';
        const avgHeartRate = avgHeartRateIdx !== -1
          ? window.scatterUtils.parseLocalizedNumber(row[avgHeartRateIdx])
          : null;
        const avgWatts = avgWattsIdx !== -1
          ? window.scatterUtils.parseLocalizedNumber(row[avgWattsIdx])
          : null;
        const parsedCadence = avgCadenceIdx !== -1
          ? window.scatterUtils.parseLocalizedNumber(row[avgCadenceIdx])
          : null;
        const parsedTotalSteps = totalStepsIdx !== -1
          ? window.scatterUtils.parseLocalizedNumber(row[totalStepsIdx])
          : null;
        const elevationGain = elevationIdx !== -1
          ? parseMetricNumber(row[elevationIdx])
          : null;
        const equipment = equipmentIdx !== -1 ? (row[equipmentIdx] || '').trim() : '';
        const heartRateEvidence = window.heartRateUtils.inspectCsvHeartRateExtrema(headers, row);

        const processedActivity = {
          id: row[0],
          date: date,
          startTime: startTime,
          monday: getMonday(date),
          sportRaw: rawSport,
          sport: sportCategory, // 'Run', 'Bike', 'Swim' or null
          distance: distKm,
          distanceAvailable,
          equipment,
          duration: durationSeconds,
          durationAvailable,
          avgHeartRate: avgHeartRate,
          ...window.heartRateUtils.resolveHeartRateExtrema(heartRateEvidence),
          avgWatts: sportCategory === 'Bike' ? avgWatts : null,
          avgCadence: Number.isFinite(parsedCadence) && parsedCadence > 0 ? parsedCadence : null,
          totalSteps: sportCategory === 'Run' && Number.isFinite(parsedTotalSteps) && parsedTotalSteps > 0 ? parsedTotalSteps : null,
          elevationGain: elevationGain,
          name: name
        };
        nextProcessedActivities.push(processedActivity);
        if (typeof onActivityProcessed === 'function') onActivityProcessed(processedActivity);
      }

      // Sort chronological ascending for line/bar charts
      nextProcessedActivities.sort((a, b) => a.date - b.date);
      return nextProcessedActivities;
    }

    function hasImportedActivities() {
      return !!importedDataset && processedActivities.length > 0;
    }

    function showPreviewGateModal() {
      const modal = document.getElementById('previewGateModal');
      if (!modal) return;
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closePreviewGateModal() {
      const modal = document.getElementById('previewGateModal');
      if (!modal) return;
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function handleStravaIngest() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const operation = beginImportOperation('personal');
        let importResult = null;
        try {
          // Show progress modal
          const errorDiv = document.getElementById('importProgressError');
          showImportProgressModal();
          errorDiv.classList.add('hidden');
          setImportModalVisualState('loader', true);
          updateImportProgress(0, 'Reading archive...');

          // Import the ZIP file
          importResult = await importStravaZip(file, (progress) => {
            if (!isCurrentImportOperation(operation)) return;
            const percent = progress.percent || 50;
            updateImportProgress(percent, progress.stage);
          });
          if (!isCurrentImportOperation(operation)) {
            releaseUncommittedImportMedia(operation, importResult);
            return;
          }

          // Parse the CSV
          updateImportProgress(null, 'Processing data...');
          const dataset = await importCsvText(importResult.csvText, {
            operation,
            sourceLabel: 'Strava ZIP import',
            openDashboard: true,
            onDatasetPrepared: dataset => {
              if (!importExperienceSession || !importExperienceSession.active) return;
              const personalMessages = window.importExperienceCatalog.buildPersonalMessages(dataset.importExperienceStatistics);
              window.importExperienceCatalog.addCandidates(importExperienceSession, personalMessages, { prioritize: true });
              if (personalMessages.length) advanceImportExperience();
            },
            fitBestEffortsByActivityId: importResult.fitBestEffortsByActivityId || {},
            gpsTracksByActivityId: importResult.gpsTracksByActivityId || {},
            mediaLibrary: importResult.mediaLibrary
          });
          if (!dataset || !isCurrentImportOperation(operation)) return;

          // Update progress
          if (importExperienceSession) {
            window.importExperienceCatalog.setPhase(importExperienceSession, 'finalizing');
          }
          updateImportProgress(null, 'Preparing visualizations...');

          // Hide modal after a short delay
          setTimeout(() => {
            if (isCurrentImportOperation(operation)) hideImportProgressModal();
          }, 1000);
        } catch (error) {
          releaseUncommittedImportMedia(operation, importResult);
          if (!isCurrentImportOperation(operation)) return;
          console.error('Import failed:', error);
          updateImportProgress(null, operation.committed ? 'Could not display imported data' : 'Import failed', true);
          document.getElementById('importProgressError').classList.remove('hidden');
          document.getElementById('importProgressDetail').textContent = error.message || 'Unknown error occurred';
        }
      };
      input.click();
    }

    function handleTrainingPeaksIngest() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip,application/zip';
      input.multiple = true;
      input.onchange = async event => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) return;

        const operation = beginImportOperation('personal');
        try {
          const errorDiv = document.getElementById('importProgressError');
          showImportProgressModal();
          errorDiv.classList.add('hidden');
          setImportModalVisualState('loader', true);
          updateImportProgress(0, 'Reading TrainingPeaks archives...');

          const dataset = await executeTrainingPeaksZipImport(selectedFiles, {
            operation,
            reportProgress: progress => updateImportProgress(progress.percent, progress.stage),
            onDatasetPrepared: preparedDataset => {
              if (!importExperienceSession || !importExperienceSession.active) return;
              const messages = window.importExperienceCatalog.buildPersonalMessages(preparedDataset.importExperienceStatistics);
              window.importExperienceCatalog.addCandidates(importExperienceSession, messages, { prioritize: true });
              if (messages.length) advanceImportExperience();
            }
          });

          if (!dataset || !isCurrentImportOperation(operation)) return;
          updateStatusBadge('success', 'Imported TrainingPeaks history');

          if (importExperienceSession) window.importExperienceCatalog.setPhase(importExperienceSession, 'finalizing');
          updateImportProgress(null, 'Preparing visualizations...');
          setTimeout(() => {
            if (isCurrentImportOperation(operation)) hideImportProgressModal();
          }, 1000);
        } catch (error) {
          if (!isCurrentImportOperation(operation)) return;
          console.error('TrainingPeaks import failed:', error);
          updateImportProgress(null, operation.committed ? 'Could not display imported data' : 'TrainingPeaks import failed', true);
          document.getElementById('importProgressError').classList.remove('hidden');
          document.getElementById('importProgressDetail').textContent = error.message || 'Unknown error occurred';
        }
      };
      input.click();
    }

    async function runAppleHealthFileImport(file) {
        if (!file) return;
        const operation = beginImportOperation('personal');
        const status = document.getElementById('appleHealthImportStatus');
        try {
          if (status) status.textContent = '';
          showImportProgressModal();
          document.getElementById('importProgressError').classList.add('hidden');
          setImportModalVisualState('loader', true);
          updateImportProgress(0, 'Reading Apple Health export...', false, true);
          const dataset = await executeAppleHealthZipImport(file, { operation,
            reportProgress: progress => updateImportProgress(progress.percent, progress.stage, false, true) });
          if (!dataset || !isCurrentImportOperation(operation)) return;
          const report = dataset.diagnostics;
          const unsupported = Object.values(report.unsupportedBySport || {}).reduce((sum, value) => sum + value, 0);
          const incomplete = Object.values(report.unavailableByMetricAndReason || {}).reduce((sum, value) => sum + value, 0);
          if (status) status.textContent = `${dataset.activities.length} workouts imported. ${unsupported} unsupported, ${report.invalidWorkoutCount || 0} invalid, ${report.duplicateCount || 0} duplicates skipped. ${report.skippedRouteCount || 0} optional routes skipped; ${incomplete} unavailable optional measurements.`;
          updateImportProgress(100, 'Apple Health import complete', false, true);
          hideImportProgressModal();
        } catch (error) {
          if (!isCurrentImportOperation(operation)) return;
          const utility = window.appleHealthUtils;
          const diagnostic = typeof utility?.validateRuntimeDiagnostic === 'function' ? utility.validateRuntimeDiagnostic(error?.diagnostic, operation.generation) : null;
          const knownCode = typeof utility?.failure === 'function' && error?.code && utility.failure(error.code).code === error.code;
          const safe = typeof utility?.runtimeFailure === 'function'
            ? utility.runtimeFailure(knownCode ? error.code : 'INTERNAL_ERROR', diagnostic || { generation: operation.generation,
              phase: 'parsing', component: 'importer', environment: utility.getRuntimeEnvironment(globalThis, 'window') })
            : Object.assign(new Error('The Apple Health importer is unavailable. Reload the app and retry.'), { code: utility ? 'DEPENDENCY_INVALID' : 'DEPENDENCY_LOAD_FAILED' });
          updateImportProgress(null, operation.committed ? 'Could not display imported data' : 'Apple Health import failed', true);
          document.getElementById('importProgressError').classList.remove('hidden');
          document.getElementById('importProgressDetail').textContent = `${safe.message} Error code: ${safe.code}.`;
          if (!operation.committed && (safe.diagnostic?.action === 'retry' || ['DEPENDENCY_LOAD_FAILED', 'DEPENDENCY_INVALID'].includes(safe.code))) {
            appleHealthRetryFile = file;
            document.getElementById('appleHealthRetryBtn')?.classList.remove('hidden');
          }
        }
    }

    function retryAppleHealthImport() {
      const file = appleHealthRetryFile;
      if (file) return runAppleHealthFileImport(file);
    }

    function handleAppleHealthIngest() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip,application/zip';
      input.onchange = event => {
        const file = event.target.files && event.target.files[0];
        if (file) return runAppleHealthFileImport(file);
      };
      input.click();
    }

    function updateImportProgress(percent, stage, isError = false, roundPercentForDisplay = false) {
      const modal = document.getElementById('importProgressModal');
      const bar = document.getElementById('importProgressBar');
      const percentEl = document.getElementById('importProgressPercent');
      const stageEl = document.getElementById('importProgressStage');
      const detailEl = document.getElementById('importProgressDetail');
      const detailContainer = detailEl && detailEl.parentElement;
      const errorDiv = document.getElementById('importProgressError');

      const hasProgressValue = Number.isFinite(percent);
      if (hasProgressValue) {
        const boundedPercent = Math.max(0, Math.min(100, percent));
        bar.style.width = boundedPercent + '%';
        percentEl.textContent = (roundPercentForDisplay ? Math.round(boundedPercent) : boundedPercent) + '%';
      }
      stageEl.textContent = stage;
      if (detailContainer) detailContainer.classList.toggle('hidden', !isError);

      if (isError) {
        stopImportExperienceRotation();
        setImportModalVisualState('alert-circle', false);
      }
    }
