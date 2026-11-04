(function (root) {
  const headers = ['Activity ID', 'Activity Date', 'Activity Name', 'Activity Type', 'Distance', 'Distance', 'Moving Time', 'Average Heart Rate', 'Average Cadence', 'Average Watts', 'Elevation Gain', 'Activity Gear', 'Filename', 'Media'];

  function csvCell(value) {
    const text = String(value ?? '');
    return /[\r\n",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function csv(rows) {
    return rows.map(row => row.map(csvCell).join(',')).join('\n') + '\n';
  }

  function crc(bytes) {
    const table = [0, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401, 0xa001, 0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801, 0x4400];
    let value = 0;
    for (const byte of bytes) {
      value = (value >>> 4) ^ table[value & 15] ^ table[byte & 15];
      value = (value >>> 4) ^ table[value & 15] ^ table[(byte >>> 4) & 15];
    }
    return value;
  }

  function makeFit(activity) {
    const fields = [[253, 4, 0x86], [5, 4, 0x86], [7, 2, 0x84], [3, 1, 2], [4, 1, 2]];
    const definition = [0x40, 0, 0, 20, 0, fields.length, ...fields.flat()];
    const recordSize = 13;
    const dataSize = definition.length + (activity.duration + 1) * recordSize;
    const bytes = new Uint8Array(12 + dataSize + 2);
    const view = new DataView(bytes.buffer);
    bytes.set([12, 0x10, 0x88, 8], 0);
    view.setUint32(4, dataSize, true);
    bytes.set([46, 70, 73, 84], 8);
    bytes.set(definition, 12);
    let offset = 12 + definition.length;
    const fitStart = Math.round((Date.parse(activity.date) - Date.UTC(1989, 11, 31)) / 1000);
    for (let second = 0; second <= activity.duration; second++) {
      bytes[offset++] = 0;
      view.setUint32(offset, fitStart + second, true); offset += 4;
      view.setUint32(offset, Math.round(activity.distance * 100000 * second / activity.duration), true); offset += 4;
      view.setUint16(offset, activity.watts, true); offset += 2;
      bytes[offset++] = activity.heartRate;
      bytes[offset++] = activity.cadence;
    }
    view.setUint16(bytes.length - 2, crc(bytes.subarray(0, bytes.length - 2)), true);
    return bytes;
  }

  function makeGpx(activity) {
    const points = Array.from({ length: 48 }, (_, index) => {
      const angle = index * Math.PI * 2 / 47;
      const latitude = 37.42 + Math.sin(angle) * 0.008;
      const longitude = -122.17 + Math.cos(angle) * 0.012;
      const time = new Date(Date.parse(activity.date) + activity.duration * 1000 * index / 47).toISOString();
      return `<trkpt lat="${latitude.toFixed(7)}" lon="${longitude.toFixed(7)}"><time>${time}</time><ele>${10 + index % 8}</ele></trkpt>`;
    }).join('');
    return `<?xml version="1.0"?><gpx version="1.1" creator="TriAnalytica synthetic fixture" xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>${points}</trkseg></trk></gpx>`;
  }

  function createRecipe(density, definitions, durations) {
    if (!['sparse', 'dense'].includes(density)) throw new RangeError('Unknown density');
    const years = density === 'sparse' ? [2025] : Array.from({ length: 13 }, (_, index) => 2013 + index);
    const activities = [];
    const tracks = [];
    const powerActivities = [];
    for (const [yearIndex, year] of years.entries()) {
      for (const [sport, distances] of Object.entries(definitions)) {
        distances.forEach((definition, distanceIndex) => {
          const index = activities.length;
          const duration = Math.round(definition.km * (sport === 'Swim' ? 1800 : sport === 'Run' ? 360 : 120) / (1 + yearIndex * 0.025));
          const activity = {
            id: String(770000 + index), sport, distance: definition.km, duration,
            date: new Date(Date.UTC(year, distanceIndex * 2, 4 + distanceIndex, 7)).toISOString(),
            name: `SYNTHETIC PRIVATE TITLE ${sport} endurance ${index % 3 ? 'steady' : 'recovery'}`,
            gear: sport === 'Run' ? `Nike synthetic review pair ${yearIndex + 1} with a deliberately long equipment name`
              : sport === 'Bike' ? `Synthetic bike ${yearIndex + 1}` : '',
            heartRate: 120 + distanceIndex * 6 + yearIndex,
            cadence: sport === 'Run' ? 170 + distanceIndex : sport === 'Bike' ? 80 + distanceIndex : '',
            watts: sport === 'Bike' ? 200 + yearIndex * 8 : '',
            elevation: sport === 'Swim' ? 0 : (100 + yearIndex * 60) * (distanceIndex + 1),
            definition: definition.label, filename: '', media: ''
          };
          if (sport === 'Bike' && distanceIndex === distances.length - 1) {
            activity.filename = `activities/${activity.id}.fit`;
            powerActivities.push(activity);
          } else if (distanceIndex === 0) {
            activity.filename = `activities/${activity.id}.gpx`;
            tracks.push(activity);
          }
          activities.push(activity);
        });
      }
    }
    const mediaCount = density === 'sparse' ? 1 : 14;
    const media = Array.from({ length: mediaCount }, (_, index) => ({
      filename: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}.${index === mediaCount - 1 ? 'mp4' : 'jpg'}`,
      caption: `Synthetic training frame ${index + 1}`,
      activityId: activities[activities.length - 1 - index % Math.min(activities.length, 15)].id
    }));
    for (const asset of media) {
      const activity = activities.find(item => item.id === asset.activityId);
      activity.media = [activity.media, asset.filename].filter(Boolean).join(';');
    }
    const orderedMedia = media.slice().sort((first, second) => Date.parse(activities.find(activity => activity.id === second.activityId).date)
      - Date.parse(activities.find(activity => activity.id === first.activityId).date));
    const rows = activities.map(activity => [activity.id, activity.date, activity.name, activity.sport,
      activity.distance, activity.distance * 1000, activity.duration, activity.heartRate,
      activity.cadence, activity.watts, activity.elevation, activity.gear, activity.filename, activity.media]);
    const sportTotals = Object.fromEntries(Object.keys(definitions).map(sport => {
      const selected = activities.filter(activity => activity.sport === sport);
      return [sport, {
        activities: selected.length,
        distanceKm: Number(selected.reduce((sum, activity) => sum + activity.distance, 0).toFixed(6)),
        movingSeconds: selected.reduce((sum, activity) => sum + activity.duration, 0)
      }];
    }));
    return {
      density, years, activities, tracks, powerActivities, media,
      activityCsv: csv([headers, ...rows]),
      mediaCsv: csv([['Media Filename', 'Media Caption'], ...media.map(asset => [asset.filename, asset.caption])]),
      expected: {
        fixtureId: `reel-story-${density}-v1`, synthetic: true,
        provenance: 'Synthetic sample training data', years, sportTotals,
        filters: { sport: 'All', period: `${years[0]}-${years[years.length - 1]}`, aggregation: 'yearly' },
        pbDefinitions: definitions,
        power: durations.map(duration => ({ label: duration.label, targetSeconds: duration.seconds,
          firstWatts: powerActivities[0].watts, currentWatts: powerActivities[powerActivities.length - 1].watts,
          recordCount: powerActivities.length, source: 'fit-rolling' })),
        media: { eligible: media.length, defaultDisplayed: Math.min(media.length, 12),
          orderedSelection: orderedMedia.map(asset => asset.filename),
          defaultSelection: orderedMedia.slice(0, 12).map(asset => asset.filename), routesIncludedByDefault: false,
          videoFilename: media[media.length - 1].filename },
        scaleChecks: { timelineDomain: [activities[0].date, activities[activities.length - 1].date],
          wordCounts: { SYNTHETIC: activities.length, PRIVATE: activities.length, TITLE: activities.length } },
        referenceActivities: activities.map(activity => ({ ...activity })),
        sparseSelectionRecipe: { sport: 'Run', metric: 'distance', year: years[0], activityId: activities.find(activity => activity.sport === 'Run').id }
      }
    };
  }

  async function createMedia(documentRef) {
    const canvas = documentRef.createElement('canvas');
    canvas.width = 480;
    canvas.height = 320;
    const context = canvas.getContext('2d');
    context.fillStyle = '#0e786d';
    context.fillRect(0, 0, 480, 320);
    context.fillStyle = '#ffffff';
    context.font = 'bold 36px sans-serif';
    context.fillText('SYNTHETIC TRAINING', 24, 100);
    context.fillStyle = '#ffd25b';
    context.fillRect(24, 150, 320, 32);
    const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    const mimeType = ['video/mp4;codecs=avc1.42001E', 'video/mp4'].find(type => root.MediaRecorder?.isTypeSupported(type));
    if (!mimeType) throw new Error('MP4 recording unavailable; video fixture preparation is blocked.');
    const stream = canvas.captureStream(10);
    const chunks = [];
    const recorder = new root.MediaRecorder(stream, { mimeType });
    const video = await new Promise((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = event => reject(event.error || new Error('Synthetic recording failed'));
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/mp4' }));
      recorder.start();
      let frame = 0;
      const interval = root.setInterval(() => {
        context.fillStyle = frame % 2 ? '#0e786d' : '#f05b78';
        context.fillRect(24, 220, 32 + frame * 12, 30);
        frame++;
        if (frame === 10) { root.clearInterval(interval); recorder.stop(); }
      }, 100);
    }).finally(() => stream.getTracks().forEach(track => track.stop()));
    if (!jpeg?.size || !video.size) throw new Error('Synthetic media encoding failed');
    return { jpeg, video };
  }

  async function buildArchive(recipe, JSZip, media) {
    const archive = new JSZip();
    const options = { date: new Date('2025-01-01T00:00:00Z') };
    archive.file('activities.csv', recipe.activityCsv, options);
    archive.file('media.csv', recipe.mediaCsv, options);
    for (const activity of recipe.powerActivities) archive.file(activity.filename, makeFit(activity), options);
    for (const activity of recipe.tracks) archive.file(activity.filename, makeGpx(activity), options);
    const jpeg = new Uint8Array(await media.jpeg.arrayBuffer());
    const video = new Uint8Array(await media.video.arrayBuffer());
    for (const asset of recipe.media) archive.file(`media/${asset.filename}`, asset.filename.endsWith('.mp4') ? video : jpeg, options);
    return archive.generateAsync({ type: 'uint8array', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  }

  function createReviewCases(targetKeys, definitions, durations) {
    const variants = {
      totalDistance: ['daily', 'weekly', 'monthly', 'yearly'].map(aggregation => ({ aggregation, sport: 'All' })),
      paceMetrics: ['heartRate', 'cadence', 'elevationGain', 'distance'].map((metric, index) => ({ metric, sport: ['Run', 'Run', 'Bike', 'Swim'][index] })),
      equipment: ['distance', 'pace', 'count', 'avgLength'].map(metric => ({ metric, equipment: 'All' })),
      equipmentTimeline: ['continuous', 'activities'].map(mode => ({ mode, equipment: 'All' })),
      personalBests: [{ definition: 'overview' },
        ...Object.entries(definitions).flatMap(([sport, distances]) => distances.map(distance => ({ sport, definition: distance.label }))),
        ...['Swim', 'Run', 'Bike'].map(sport => ({ sport, definition: 'longest' })),
        ...['Run', 'Bike'].map(sport => ({ sport, definition: 'elevation' })),
        ...durations.map(duration => ({ sport: 'Bike', definition: `power-${duration.label}` })),
        { sport: 'Bike', definition: 'power-profile' }],
      heatmap: ['All', 'Run', 'Bike', 'Swim'].map(sport => ({ sport, year: 'fixture-latest', viewport: 'selected' })),
      distributions: ['length', 'duration', 'pace', 'elevation', 'power'].map(metric => ({ metric, sport: metric === 'power' ? 'Bike' : 'Run' })),
      workoutTime: ['day', 'week', 'month', 'year'].flatMap(granularity => ['count', 'duration', 'distance'].map(measure => ({ granularity, measure, sport: 'All' }))),
      trainingCalendar: ['green', 'blue', 'fire'].map(palette => ({ palette, sport: 'All' })),
      wordcloud: [{ includedTerms: 'current' }],
      pieCharts: ['sport', 'duration', 'pace', 'equipment', 'length', 'power'].flatMap(groupBy => ['count', 'time', 'distance'].map(measure => ({ groupBy, measure, sport: groupBy === 'power' ? 'Bike' : 'All' }))),
      lifetimeStatistics: [{ scope: 'all-imported' }],
      mediaGallery: [{ kind: 'annual', year: 'fixture-latest', includeRoutes: false }, { kind: 'collage', includeRoutes: true, explicitVideoSelection: true }]
    };
    variants.paceMetrics.push({ metric: 'heartRate', sport: 'Bike' }, { metric: 'heartRate', sport: 'Swim' },
      { metric: 'cadence', sport: 'Bike' });
    variants.equipment.push(...['Shoes', 'Bikes'].flatMap(equipment => ['distance', 'pace'].map(metric => ({ metric, equipment }))));
    variants.equipmentTimeline.push(...['Shoes', 'Bikes'].flatMap(equipment => ['continuous', 'activities'].map(mode => ({ mode, equipment }))));
    variants.distributions.push(...['length', 'duration', 'pace', 'elevation', 'power']
      .map(metric => ({ metric, sport: metric === 'power' ? 'Bike' : 'Run', mode: 'histogram' })),
    { metric: 'pace', sport: 'All', mode: 'line' });
    variants.trainingCalendar.push(...['Run', 'Bike', 'Swim'].map(sport => ({ sport, palette: 'green' })));
    variants.mediaGallery.push({ kind: 'annual', year: 'fixture-latest', includeRoutes: true },
      { kind: 'collage', includeRoutes: false }, { kind: 'collage', includeRoutes: true });
    const cases = [];
    for (const target of targetKeys) {
      if (!variants[target]) throw new Error(`Missing review family: ${target}`);
      for (const [variantIndex, filters] of variants[target].entries()) {
        for (const browser of ['Chrome', 'Edge']) {
          for (const density of ['sparse', 'dense']) {
            for (const format of ['square', 'portrait', 'story']) {
              for (const humor of [false, true]) cases.push({
                id: `${target}-${variantIndex + 1}-${browser}-${density}-${format}-${humor ? 'on' : 'off'}`,
                target, filters, browser, density, format, humor,
                fixture: `training-${density}.zip`, reference: `recipes.${density}`
              });
            }
          }
        }
      }
    }
    return cases;
  }

  function installImageEvidence() {
    if (!root) return;
    if (root.__reelImageEvidence) {
      if (root.__reelImageEvidence.version !== 2) throw new Error('Review instrumentation is stale; reload the page before image evidence collection');
      return;
    }
    const records = new WeakMap();
    const images = new Map();
    const prototype = root.CanvasRenderingContext2D.prototype;
    const originalText = prototype.fillText;
    const originalImage = prototype.drawImage;
    const originalClear = prototype.clearRect;
    const originalEncode = root.HTMLCanvasElement.prototype.toDataURL;
    const transformed = (box, transform) => {
      const points = [[box.left, box.top], [box.right, box.top], [box.left, box.bottom], [box.right, box.bottom]]
        .map(([x, y]) => ({ x: transform.a * x + transform.c * y + transform.e, y: transform.b * x + transform.d * y + transform.f }));
      return { ...box, left: Math.min(...points.map(point => point.x)), right: Math.max(...points.map(point => point.x)),
        top: Math.min(...points.map(point => point.y)), bottom: Math.max(...points.map(point => point.y)),
        size: box.size * Math.min(Math.hypot(transform.a, transform.b), Math.hypot(transform.c, transform.d)) };
    };
    prototype.fillText = function (text, x, y, ...rest) {
      const result = originalText.call(this, text, x, y, ...rest);
      if (!String(text).trim()) return result;
      const metrics = this.measureText(text);
      const size = Number(this.font.match(/([\d.]+)px/)?.[1]);
      const box = transformed({ text: String(text), left: x - metrics.actualBoundingBoxLeft,
        right: x + metrics.actualBoundingBoxRight, top: y - metrics.actualBoundingBoxAscent,
        bottom: y + metrics.actualBoundingBoxDescent, size }, this.getTransform());
      if (!records.has(this.canvas)) records.set(this.canvas, []);
      records.get(this.canvas).push(box);
      return result;
    };
    prototype.clearRect = function (x, y, width, height) {
      if (x === 0 && y === 0 && width >= this.canvas.width && height >= this.canvas.height) records.set(this.canvas, []);
      return originalClear.call(this, x, y, width, height);
    };
    prototype.drawImage = function (source, ...args) {
      const result = originalImage.call(this, source, ...args);
      const sourceRecords = records.get(source);
      if (!sourceRecords?.length) return result;
      const sourceWidth = args.length === 8 ? args[2] : source.width;
      const sourceHeight = args.length === 8 ? args[3] : source.height;
      const sourceX = args.length === 8 ? args[0] : 0;
      const sourceY = args.length === 8 ? args[1] : 0;
      const x = args.length === 8 ? args[4] : args[0];
      const y = args.length === 8 ? args[5] : args[1];
      const width = args.length === 8 ? args[6] : args.length === 4 ? args[2] : sourceWidth;
      const height = args.length === 8 ? args[7] : args.length === 4 ? args[3] : sourceHeight;
      if (!sourceWidth || !sourceHeight) return result;
      const mapping = { a: width / sourceWidth, b: 0, c: 0, d: height / sourceHeight,
        e: x - sourceX * width / sourceWidth, f: y - sourceY * height / sourceHeight };
      if (!records.has(this.canvas)) records.set(this.canvas, []);
      for (const box of sourceRecords) {
        if (box.right <= sourceX || box.left >= sourceX + sourceWidth || box.bottom <= sourceY || box.top >= sourceY + sourceHeight) continue;
        const sourceClipped = box.sourceClipped || box.left < sourceX - 1 || box.right > sourceX + sourceWidth + 1
          || box.top < sourceY - 1 || box.bottom > sourceY + sourceHeight + 1;
        records.get(this.canvas).push({ ...transformed(transformed(box, mapping), this.getTransform()), sourceClipped });
      }
      return result;
    };
    root.HTMLCanvasElement.prototype.toDataURL = function (...args) {
      const value = originalEncode.apply(this, args);
      if (this.width === 1080 && [1080, 1350, 1920].includes(this.height)) images.set(value, (records.get(this) || []).map(box => ({ ...box })));
      return value;
    };
    root.__reelImageEvidence = { version: 2, images, clear: () => images.clear() };
  }

  async function inspectApprovedImage() {
    if (!lastExportedImage) throw new Error('No approved image to inspect');
    if (root.__reelImageEvidence?.version !== 2) throw new Error('Current image instrumentation is required');
    const image = lastExportedImage;
    const decoded = new root.Image();
    decoded.src = image.dataUrl; await decoded.decode();
    const canvas = root.document.createElement('canvas');
    canvas.width = decoded.naturalWidth; canvas.height = decoded.naturalHeight;
    const context = canvas.getContext('2d'); context.drawImage(decoded, 0, 0);
    const story = image.target.format === 'story';
    const bounds = story ? { left: 72, top: 240, right: 960, bottom: 1560 }
      : { left: 48, top: 48, right: canvas.width - 48, bottom: canvas.height - 48 };
    const text = root.__reelImageEvidence?.images.get(image.dataUrl) || [];
    const clipped = text.filter(box => box.left < bounds.left - 1 || box.right > bounds.right + 1
      || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1);
    const tooSmall = text.filter(box => Number.isFinite(box.size) && box.size < 35.9);
    const overlaps = [];
    for (let first = 0; first < text.length; first++) {
      for (let second = first + 1; second < text.length; second++) {
        const left = text[first], right = text[second];
        const width = Math.min(left.right, right.right) - Math.max(left.left, right.left);
        const height = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
        if (width > 3 && height > 3) overlaps.push([left.text, right.text]);
      }
    }
    const phone = root.document.createElement('canvas');
    phone.width = 360; phone.height = canvas.height / 3;
    const phoneContext = phone.getContext('2d'); phoneContext.drawImage(decoded, 0, 0, phone.width, phone.height);
    const pixels = phoneContext.getImageData(0, 0, phone.width, phone.height).data;
    let paintedPixels = 0;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (Math.abs(pixels[offset] - 7) + Math.abs(pixels[offset + 1] - 23) + Math.abs(pixels[offset + 2] - 25) > 40) paintedPixels++;
    }
    const hash = await root.crypto.subtle.digest('SHA-256', await image.blob.arrayBuffer());
    return { diagnosticVersion: 2, width: canvas.width, height: canvas.height, bytes: image.blob.size, page: image.target.seriesPage,
      sha256: Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join(''),
      textCount: text.length, clipped: clipped.map(box => box.text), tooSmall: tooSmall.map(box => ({ text: box.text, size: box.size })),
      sourceClipped: text.filter(box => box.sourceClipped).map(box => box.text),
      overlaps, phoneDimensions: [phone.width, phone.height], paintedPhonePixels: paintedPixels, visualApproval: 'unverified' };
  }

  async function prepareReviewCase(reviewCase) {
    if (!root || !['sparse', 'dense'].includes(reviewCase.density)) throw new Error('Review requires a browser and known synthetic fixture');
    root.closeExportPreviewModal();
    root.__reelImageEvidence?.clear();
    if (root.__reelFixtureDensity !== reviewCase.density) {
      const name = `training-${reviewCase.density}.zip`;
      const response = await root.fetch(`/__tests__/fixtures/reel-story-exports/${name}`);
      if (!response.ok) throw new Error('Synthetic review archive is unavailable');
      const imported = await root.importStravaZip(new root.File([await response.arrayBuffer()], name));
      await root.importCsvText(imported.csvText, {
        operation: root.beginImportOperation('sample'), sourceLabel: 'Synthetic fixture ZIP', openDashboard: true,
        fitBestEffortsByActivityId: imported.fitBestEffortsByActivityId,
        gpsTracksByActivityId: imported.gpsTracksByActivityId, mediaLibrary: imported.mediaLibrary,
        onDatasetPrepared: value => { value.sourceType = 'sample'; value.sampleProvenance = { synthetic: true, label: 'Synthetic sample training data' }; }
      });
      root.__reelFixtureDensity = reviewCase.density;
    }
    const key = reviewCase.target;
    const filters = reviewCase.filters;
    root.setVisualizationTab(key);
    await root.setExportFormat(reviewCase.format);
    await root.setExportHumorEnabled(reviewCase.humor);
    if (key === 'totalDistance') {
      selectedTimeframeByAggregation[filters.aggregation] = 'all';
      root.setAggregationLevel(filters.aggregation); root.setSportFilter(filters.sport);
    } else if (key === 'paceMetrics') {
      root.setPaceMetricsSport(filters.sport); root.setPaceMetric(filters.metric);
    } else if (key === 'equipment') {
      root.setEquipmentMetric(filters.metric); root.setEquipmentFilter(filters.equipment);
    } else if (key === 'equipmentTimeline') {
      root.setEquipmentTimelineMode(filters.mode); root.setEquipmentTimelineFilter(filters.equipment);
    } else if (key === 'distributions') {
      root.setDistributionsSportFilter(filters.sport); root.setDistributionsMetric(filters.metric); root.setDistributionsDisplayMode(filters.mode || 'line');
    } else if (key === 'workoutTime') {
      root.setWorkoutTimeGranularity(filters.granularity); root.setWorkoutTimeSportFilter(filters.sport); root.setWorkoutTimeMeasure(filters.measure);
    } else if (key === 'trainingCalendar') {
      root.setTrainingCalendarPalette(filters.palette); root.setTrainingCalendarSportFilter(filters.sport);
    } else if (key === 'heatmap') {
      root.setHeatmapSportFilter(filters.sport); root.setHeatmapYear('2025'); await root.renderHeatmap();
    } else if (key === 'pieCharts') {
      root.setPieSportFilter(filters.sport); root.setPieDimension(filters.groupBy); root.setPieMeasure(filters.measure);
    } else if (key === 'mediaGallery') {
      const year = root.document.getElementById('mediaGalleryYearFilter');
      year.value = '2025'; year.dispatchEvent(new root.Event('change'));
      root.mediaGalleryDashboard.setIncludeRoutes(filters.includeRoutes);
      if (filters.explicitVideoSelection) {
        const key = importedDataset.mediaLibrary.assets.find(asset => asset.mediaType === 'video')?.key;
        const checkbox = Array.from(root.document.querySelectorAll('[data-media-select-key]')).find(input => input.dataset.mediaSelectKey === key);
        if (!checkbox) throw new Error('Synthetic video selection is unavailable');
        checkbox.checked = true; checkbox.dispatchEvent(new root.Event('change', { bubbles: true }));
      }
      await (filters.kind === 'annual' ? root.mediaGalleryDashboard.createAnnualRecap() : root.mediaGalleryDashboard.createCollage());
    }
    if (key === 'personalBests' && filters.definition !== 'overview') {
      const groups = root.personalBestsDashboard.getOverviewExportData().groups;
      const definitionKey = filters.definition === 'power-profile' ? 'Bike-power-all-time-profile' : `${filters.sport}-${filters.definition}`;
      const group = groups.find(item => item.definitionKey === definitionKey
        || filters.definition === 'longest' && item.sport === filters.sport && /^Longest /i.test(item.title)
        || filters.definition === 'elevation' && item.sport === filters.sport && /^Most elevation/i.test(item.title));
      if (!group) throw new Error(`Synthetic PB definition unavailable: ${definitionKey}`);
      root.openPbDetail({ title: group.title, exportKey: group.definitionKey, sport: group.sport,
        xAxisMode: group.xAxisMode === 'duration' ? 'duration-category' : 'time', axisLabel: group.metricLabel,
        direction: group.direction, color: '#20c9b2',
        formatValue: value => group.records.find(record => record.value === value)?.displayValue || String(value),
        records: group.records.map(record => ({ ...record, date: record.date ? new Date(record.date) : null }))
      }, root.document.getElementById('vizTabPersonalBests'));
      await root.exportActivePbDetail();
    } else if (key !== 'mediaGallery') {
      await root.exportVisualizationTab(key);
    }
    if (!lastExportedImage) throw new Error(lastExportCaptureState?.error?.message || root.document.getElementById('exportToast').textContent || 'Review export produced no image');
    return { caseId: reviewCase.id, pages: lastExportImages.length, width: lastExportedImage.width,
      height: lastExportedImage.height, selectionId: lastExportCaptureState.snapshot.selectionId,
      actualFilters: lastExportCaptureState.snapshot.filters, period: lastExportCaptureState.snapshot.period };
  }

  const api = { createRecipe, makeFit, makeGpx, createMedia, buildArchive, createReviewCases,
    installImageEvidence, inspectApprovedImage, prepareReviewCase };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.reelStoryFixtures = api;
})(typeof window !== 'undefined' ? window : null);

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('fs');
  const path = require('path');
  if (process.argv[2] === '--append-review-cases') {
    const repository = path.resolve(__dirname, '../../..');
    const vm = require('vm');
    const power = require(path.join(repository, 'src/power-pb-utils'));
    const context = { window: { powerPbUtils: power } }; vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(repository, 'src/dashboard-power-pb.js'), 'utf8') + '\nthis.definitions = PB_DISTANCES;', context);
    const exporter = fs.readFileSync(path.join(repository, 'src/dashboard-export.js'), 'utf8');
    const registry = exporter.match(/const EXPORT_CAPTURE_TARGET_IDS = \{([\s\S]*?)\n    \};/);
    const keys = [...registry[1].matchAll(/(\w+): '([^']+)'/g)].map(match => match[1]);
    const cases = module.exports.createReviewCases(keys, context.definitions, power.POWER_DURATIONS);
    const matrixPath = path.join(repository, 'specs/077-reel-story-exports/review-matrix.md');
    const existing = fs.readFileSync(matrixPath, 'utf8');
    const known = new Set([...existing.matchAll(/^\| ([A-Za-z]+-\d+-(?:Chrome|Edge)-(?:sparse|dense)-(?:square|portrait|story)-(?:on|off)) \|/gm)].map(match => match[1]));
    const added = cases.filter(item => !known.has(item.id));
    if (added.length) {
      const rows = added.map(item => `| ${item.id} | ${JSON.stringify(item.filters)} | ${item.fixture}; expected-values.json#${item.reference} | ${item.browser}; unverified | unverified; expand continuation pages | unverified | unverified |`);
      fs.writeFileSync(matrixPath, existing + '\n## Additional Selection Coverage\n\n| Case | Filters | Fixture/reference | Browser/version/OS | Pages/files/dimensions | Native/phone/safe area/data/privacy/provenance/parity | Reviewer/status |\n| --- | --- | --- | --- | --- | --- | --- |\n' + rows.join('\n') + '\n');
    }
    console.log(JSON.stringify({ cases: cases.length, previous: known.size, added: added.length, existingRowsPreserved: true }));
  } else if (process.argv[2] === '--verify-native') {
    const repository = path.resolve(__dirname, '../../..');
    const artifactRoot = path.join(repository, 'private-data/interim/reel077');
    const text = fs.readFileSync(process.argv[3], 'utf8');
    const captured = JSON.parse(text.startsWith('Result: ') ? text.slice(8) : text);
    const input = captured.result || captured;
    const utils = require(path.join(repository, 'src/export-utils'));
    const crypto = require('crypto');
    const results = [];
    for (const item of input.results || []) {
      if (item.error) throw new Error(`Native review case failed: ${item.caseId}: ${item.error}`);
      const formatKey = item.caseId.match(/-(square|portrait|story)-(?:on|off)$/)?.[1];
      const format = utils.getExportFormatConfig(formatKey);
      if (!format || !item.files?.length || item.files.length !== item.pages) throw new Error('Incomplete native case metadata');
      for (const artifact of item.files) {
        const file = path.resolve(artifact.file);
        if (!file.startsWith(artifactRoot + path.sep)) throw new Error('Native artifact is outside the local review directory');
        const bytes = fs.readFileSync(file);
        const dimensions = utils.getExportPngDimensions(bytes);
        const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
        if (dimensions.width !== format.width || dimensions.height !== format.height
            || sha256 !== artifact.sha256 || bytes.length !== artifact.bytes) throw new Error(`Native file differs from approved preview: ${file}`);
        results.push({ caseId: item.caseId, page: artifact.page, file: path.relative(repository, file).split(path.sep).join('/'),
          ...dimensions, bytes: bytes.length, sha256, byteParity: true, visualApproval: 'unverified' });
      }
    }
    if (!results.length) throw new Error('No native image evidence');
    const report = { browser: input.browser, files: results, visualApproval: 'unverified' };
    fs.writeFileSync(path.join(artifactRoot, 'native-verification.json'), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ cases: input.results.length, files: results.length, byteParity: true,
      nativeDimensions: true, visualApproval: 'unverified' }));
  } else if (process.argv[2] === '--refresh-references') {
    const repository = path.resolve(__dirname, '../../..');
    const vm = require('vm');
    const power = require(path.join(repository, 'src/power-pb-utils'));
    const context = { window: { powerPbUtils: power } };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(repository, 'src/dashboard-power-pb.js'), 'utf8') + '\nthis.definitions = PB_DISTANCES;', context);
    const expected = { schemaVersion: 1, synthetic: true, recipes: {} };
    for (const density of ['sparse', 'dense']) {
      const recipe = module.exports.createRecipe(density, context.definitions, power.POWER_DURATIONS);
      if (fs.readFileSync(path.join(__dirname, `activities-${density}.csv`), 'utf8') !== recipe.activityCsv) throw new Error('Fixture inputs changed; regenerate archives before refreshing references');
      expected.recipes[density] = recipe.expected;
    }
    fs.writeFileSync(path.join(__dirname, 'expected-values.json'), `${JSON.stringify(expected, null, 2)}\n`);
    console.log('Refreshed reference values from unchanged deterministic fixture inputs.');
  } else {
  const text = fs.readFileSync(process.argv[2], 'utf8');
  const capture = JSON.parse(text.startsWith('Result: ') ? text.slice(8) : text);
  const data = capture.result || capture;
  if (!data.recipes || !data.expected || data.expected.synthetic !== true) throw new Error('Invalid synthetic browser capture');
  for (const [density, recipe] of Object.entries(data.recipes)) {
    if (!['sparse', 'dense'].includes(density)) throw new Error('Invalid fixture density');
    const bytes = Buffer.from(recipe.archiveBase64, 'base64');
    if (bytes[0] !== 80 || bytes[1] !== 75) throw new Error('Invalid ZIP fixture');
    fs.writeFileSync(path.join(__dirname, `training-${density}.zip`), bytes);
    fs.writeFileSync(path.join(__dirname, `activities-${density}.csv`), recipe.activityCsv);
  }
  fs.writeFileSync(path.join(__dirname, 'expected-values.json'), `${JSON.stringify(data.expected, null, 2)}\n`);
  if (process.argv[3] === '--fixtures-only') {
    console.log('Refreshed synthetic fixture inputs and references; existing reviewer matrix unchanged.');
  } else {
  const repository = path.resolve(__dirname, '../../..');
  const vm = require('vm');
  const context = { window: { powerPbUtils: require(path.join(repository, 'src/power-pb-utils')) } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(repository, 'src/dashboard-power-pb.js'), 'utf8') + '\nthis.definitions = PB_DISTANCES;', context);
  const exporter = fs.readFileSync(path.join(repository, 'src/dashboard-export.js'), 'utf8');
  const registry = exporter.match(/const EXPORT_CAPTURE_TARGET_IDS = \{([\s\S]*?)\n    \};/);
  if (!registry) throw new Error('Export registry not found');
  const keys = [...registry[1].matchAll(/(\w+): '([^']+)'/g)].map(match => match[1]);
  const cases = module.exports.createReviewCases(keys, context.definitions, context.window.powerPbUtils.POWER_DURATIONS);
  const matrixPath = path.join(repository, 'specs/077-reel-story-exports/review-matrix.md');
  const existing = fs.readFileSync(matrixPath, 'utf8');
  const marker = '\n## Generated Review Cases\n';
  if (existing.includes(marker)) throw new Error('Review matrix already generated; do not overwrite reviewer results.');
  const table = ['| Case | Filters | Fixture/reference | Browser/version/OS | Pages/files/dimensions | Native/phone/safe area/data/privacy/provenance/parity | Reviewer/status |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...cases.map(item => `| ${item.id} | ${JSON.stringify(item.filters)} | ${item.fixture}; expected-values.json#${item.reference} | ${item.browser}; unverified | unverified; expand continuation pages | unverified | unverified |`)];
  fs.writeFileSync(matrixPath, existing + marker + `\n${cases.length} initially unverified cases, generated from all ${keys.length} current target keys and every configured PB definition. Each case ID states format, density and caption state. Record actual browser version/OS, selected concrete dates/filters, all continuation pages, local files, native dimensions and each review result before sign-off.\n\n` + table.join('\n') + '\n');
  console.log(`Saved synthetic sparse/dense ZIPs, CSVs and expected values; ${cases.length} review cases generated.`);
  }
  }
}