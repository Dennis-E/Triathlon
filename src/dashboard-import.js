    // Standard Sport Categorization
    const SPORT_MAP = {
      'lauf': 'Run', 'laufen': 'Run', 'run': 'Run', 'running': 'Run', 'virtueller lauf': 'Run',
      'trail run': 'Run', 'trailrun': 'Run', 'walk': 'Run', 'gehen': 'Run',
      'radfahrt': 'Bike', 'virtuelle radfahrt': 'Bike', 'radfahren': 'Bike', 'ride': 'Bike', 'virtual ride': 'Bike', 'virtualride': 'Bike', 'virtuelle fahrt': 'Bike', 'bike': 'Bike', 'biking': 'Bike', 'cycling': 'Bike', 'gravel ride': 'Bike', 'mountain bike ride': 'Bike', 'ebike ride': 'Bike', 'e-bike ride': 'Bike',
      'schwimmen': 'Swim', 'swim': 'Swim', 'swimming': 'Swim'
    };

    let importExperienceTimer = null;
    let importExperienceSession = null;
    let importExperienceVisibilityHandler = null;
    let importExperienceFadeFrame = null;
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
        importExperienceStatistics: window.importExperienceCatalog.finalizeStatistics(statisticsAccumulator),
        fitBestEffortsByActivityId: {},
        gpsTracksByActivityId: {}
      };
    }

    function applyImportedDataset(dataset, options = {}) {
      importedDataset = dataset;
      rawCsvData = dataset.rawCsvData;
      processedActivities = dataset.activities;
      fitBestEffortsByActivityId = dataset.fitBestEffortsByActivityId || {};
      gpsTracksByActivityId = dataset.gpsTracksByActivityId || {};
      heatmapActivitySummaryIndex = window.heatmapUtils.buildActivitySummaryIndex(processedActivities);
      hideHeatmapActivityTooltip();

      updateStatusBadge('success', `Loaded ${processedActivities.length} activities`);

      document.getElementById('previewCardsContainer').classList.remove('hidden');
      document.getElementById('enterDashboardContainer').classList.remove('hidden');
      document.getElementById('emptyStateMessage').classList.add('hidden');
      closePreviewGateModal();

      setBtnActive('sportBtnAll');
      initPaceMetricsControls({ reset: true });
      if (typeof selectedTrainingCalendarPalette !== 'undefined') selectedTrainingCalendarPalette = 'green';
      renderTimeframeButtons();
      initScatterDateSlider();
      initDistributionsDateSlider();
      initTrainingCalendarControls();

      renderDashboard();
      renderPaceMetricsChart();
      renderEquipmentChart();
      renderPbChart();
      renderTrainingCalendar();

      if (options.openDashboard) {
        openDashboardTab('totalDistance');
      }
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
      const privacyReminder = document.getElementById('importPrivacyReminder');
      if (!message || !illustration) return;
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
      illustration.src = entry.illustrationPath;
      illustration.alt = '';
      illustration.setAttribute('aria-hidden', 'true');
      if (privacyReminder) {
        const reminderDue = !!(importExperienceSession && importExperienceSession.privacyReminderDue);
        privacyReminder.textContent = reminderDue ? window.importExperienceCatalog.privacyReminder : '';
        privacyReminder.classList.toggle('hidden', !reminderDue);
      }
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
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: false, // We'll process indexes manually to avoid header collisions
          skipEmptyLines: true,
          complete: function(results) {
            if (results.data.length < 2) {
              updateStatusBadge('error', 'CSV is empty or invalid');
              reject(new Error('CSV is empty or invalid'));
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
                  if (typeof options.onDatasetPrepared === 'function') options.onDatasetPrepared(dataset);
                  applyImportedDataset(dataset, options);
              resolve(dataset);
            } catch (err) {
              updateStatusBadge('error', err.message || 'Could not process imported data');
              reject(err);
            }
          },
          error: function(err) {
            updateStatusBadge('error', 'CSV parsing failed');
            console.error("Csv parsing error", err);
            reject(err);
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

        try {
          // Show progress modal
          const errorDiv = document.getElementById('importProgressError');
          showImportProgressModal();
          errorDiv.classList.add('hidden');
          setImportModalVisualState('loader', true);
          updateImportProgress(0, 'Reading archive...');

          // Import the ZIP file
          const importResult = await importStravaZip(file, (progress) => {
            const percent = progress.percent || 50;
            updateImportProgress(percent, progress.stage);
          });

          // Parse the CSV
          updateImportProgress(null, 'Processing data...');
          await importCsvText(importResult.csvText, {
            sourceLabel: 'Strava ZIP import',
            openDashboard: true,
            onDatasetPrepared: dataset => {
              if (!importExperienceSession || !importExperienceSession.active) return;
              const personalMessages = window.importExperienceCatalog.buildPersonalMessages(dataset.importExperienceStatistics);
              window.importExperienceCatalog.addCandidates(importExperienceSession, personalMessages, { prioritize: true });
              if (personalMessages.length) advanceImportExperience();
            },
            fitBestEffortsByActivityId: importResult.fitBestEffortsByActivityId || {},
            gpsTracksByActivityId: importResult.gpsTracksByActivityId || {}
          });
          recordCompletedAnalysis();

          // Update progress
          if (importExperienceSession) {
            window.importExperienceCatalog.setPhase(importExperienceSession, 'finalizing');
          }
          updateImportProgress(null, 'Preparing visualizations...');

          // Hide modal after a short delay
          setTimeout(() => {
            hideImportProgressModal();
          }, 1000);
        } catch (error) {
          console.error('Import failed:', error);
          updateImportProgress(null, 'Import failed', true);
          document.getElementById('importProgressError').classList.remove('hidden');
          document.getElementById('importProgressDetail').textContent = error.message || 'Unknown error occurred';
        }
      };
      input.click();
    }

    function updateImportProgress(percent, stage, isError = false) {
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
        percentEl.textContent = boundedPercent + '%';
      }
      stageEl.textContent = stage;
      if (detailContainer) detailContainer.classList.toggle('hidden', !isError);

      if (isError) {
        stopImportExperienceRotation();
        setImportModalVisualState('alert-circle', false);
      }
    }
