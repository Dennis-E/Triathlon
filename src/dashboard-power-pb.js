    // ─── Personal Bests Visualization ───────────────────────────────────────────

    // PB distance definitions per sport, sorted shortest → longest
    const PB_DISTANCES = {
      Swim: [
        { label: '400m',  km: 0.4,    tol: 0.12 },
        { label: '750m',  km: 0.75,   tol: 0.10 },
        { label: '1500m', km: 1.5,    tol: 0.10 },
        { label: '1900m', km: 1.9,    tol: 0.10 },
        { label: '3800m', km: 3.8,    tol: 0.10 }
      ],
      Run: [
        { label: '5km',   km: 5.0,    tol: 0.05 },
        { label: '10km',  km: 10.0,   tol: 0.05 },
        { label: 'HM',    km: 21.0975, tol: 0.03 },
        { label: 'M',     km: 42.195,  tol: 0.03 },
        { label: '50k',   km: 50.0,    tol: 0.05 }
      ],
      Bike: [
        { label: '20km',  km: 20.0,   tol: 0.10 },
        { label: '40km',  km: 40.0,   tol: 0.10 },
        { label: '90km',  km: 90.0,   tol: 0.10 },
        { label: '100km', km: 100.0,  tol: 0.10 },
        { label: '180km', km: 180.0,  tol: 0.10 }
      ]
    };

    const PB_SPORT_COLOR = { Swim: '#06B6D4', Run: '#EF4444', Bike: '#14B8A6' };
    const PB_MAX_RESULTS = 10;
    const PB_BIKE_POWER_DURATIONS = window.powerPbUtils.POWER_DURATIONS.map(duration => ({
      ...duration,
      tol: 0.20
    }));

    function getPbMetricForEffort(sport, distanceKm, durationSeconds) {
      if (!Number.isFinite(distanceKm) || !Number.isFinite(durationSeconds) || distanceKm <= 0 || durationSeconds <= 0) return null;
      if (sport === 'Swim') {
        const value = window.scatterUtils.calculatePaceMinPer100m(distanceKm, durationSeconds);
        return Number.isFinite(value) && value > 0 ? { value, metricType: 'pace_swim', better: 'lower' } : null;
      }
      if (sport === 'Bike') {
        const value = window.scatterUtils.calculateSpeedKmH(distanceKm, durationSeconds);
        return Number.isFinite(value) && value > 0 ? { value, metricType: 'speed_bike', better: 'higher' } : null;
      }
      const value = window.scatterUtils.calculatePaceMinPerKm(distanceKm, durationSeconds);
      return Number.isFinite(value) && value > 0 ? { value, metricType: 'pace_run', better: 'lower' } : null;
    }

    // Returns array of PB events for a target distance. Also includes interim
    // estimates from longer activities, based on average pace/speed.
    function computePbsForDistance(activities, sport, km, tol) {
      const lo = km * (1 - tol);
      const hi = km * (1 + tol);
      const candidates = activities
        .filter(a => a.sport === sport && a.duration > 0 && a.distance >= lo)
        .map(a => {
          const activityId = a && a.id != null ? String(a.id) : null;
          const fitEfforts = activityId ? fitBestEffortsByActivityId[activityId] : null;
          const fitDistanceEffort = fitEfforts && Array.isArray(fitEfforts.distanceEfforts)
            ? fitEfforts.distanceEfforts.find(e => Math.abs((e.targetKm || 0) - km) < 0.0001)
            : null;

          const fitWindowSpan = fitDistanceEffort
            ? fitDistanceEffort.endKm - fitDistanceEffort.startKm
            : null;
          const isFitWindowPlausible = !!fitDistanceEffort &&
            Number.isFinite(fitDistanceEffort.durationSec) && fitDistanceEffort.durationSec > 0 &&
            Number.isFinite(fitDistanceEffort.startKm) && Number.isFinite(fitDistanceEffort.endKm) &&
            Number.isFinite(fitWindowSpan) && fitWindowSpan > 0 &&
            Math.abs(fitWindowSpan - km) <= Math.max(0.15, km * 0.15) &&
            fitDistanceEffort.endKm <= Math.max(km * 1.5, a.distance * 1.5);

          if (isFitWindowPlausible) {
            const metricFit = getPbMetricForEffort(sport, km, fitDistanceEffort.durationSec);
            if (!metricFit) return null;
            return {
              date: a.date,
              metricValue: metricFit.value,
              metricType: metricFit.metricType,
              duration: fitDistanceEffort.durationSec,
              distance: km,
              avgWatts: a.avgWatts,
              name: a.name,
              sourceDistance: a.distance,
              isInterimEstimated: false,
              intervalStartKm: fitDistanceEffort.startKm,
              intervalEndKm: fitDistanceEffort.endKm,
              effortSource: 'fit-rolling'
            };
          }

          const isExactDistance = a.distance <= hi;
          const modeledDuration = isExactDistance
            ? a.duration
            : a.duration * (km / a.distance);
          const metricModeled = getPbMetricForEffort(sport, km, modeledDuration);
          if (!metricModeled) return null;
          return {
            date: a.date,
            metricValue: metricModeled.value,
            metricType: metricModeled.metricType,
            duration: modeledDuration,
            distance: km,
            avgWatts: a.avgWatts,
            name: a.name,
            sourceDistance: a.distance,
            isInterimEstimated: !isExactDistance,
            intervalStartKm: null,
            intervalEndKm: null,
            effortSource: !isExactDistance ? 'modeled' : 'full-activity'
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.date - b.date);

      let bestDuration = Infinity;
      const pbs = [];
      for (const cand of candidates) {
        const isBetter = cand.duration < bestDuration;
        if (isBetter) {
          bestDuration = cand.duration;
          pbs.push(cand);
        }
      }
      return pbs;
    }

    function computeBikePowerPbsForDuration(activities, targetSeconds, tol) {
      const candidates = activities
        .filter(a => a.sport === 'Bike')
        .map(a => {
          const activityId = a && a.id != null ? String(a.id) : null;
          const fitEfforts = activityId ? fitBestEffortsByActivityId[activityId] : null;
          const fitPowerEffort = fitEfforts && Array.isArray(fitEfforts.powerEfforts)
            ? fitEfforts.powerEfforts.find(e => e.targetSeconds === targetSeconds)
            : null;

          if (fitPowerEffort && Number.isFinite(fitPowerEffort.avgPower) && fitPowerEffort.avgPower > 0) {
            return {
              date: a.date,
              duration: targetSeconds,
              watts: fitPowerEffort.avgPower,
              name: a.name,
              intervalStartKm: fitPowerEffort.startKm,
              intervalEndKm: fitPowerEffort.endKm,
              intervalStartSec: fitPowerEffort.startSec,
              intervalEndSec: fitPowerEffort.endSec,
              effortSource: 'fit-rolling'
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.date - b.date);

      const pbs = [];
      let bestWatts = -Infinity;
      for (const act of candidates) {
        if (act.watts > bestWatts) {
          bestWatts = act.watts;
          pbs.push({
            date: act.date,
            duration: act.duration,
            watts: act.watts,
            name: act.name,
            targetSeconds,
            intervalStartKm: act.intervalStartKm,
            intervalEndKm: act.intervalEndKm,
            intervalStartSec: act.intervalStartSec,
            intervalEndSec: act.intervalEndSec,
            effortSource: act.effortSource
          });
        }
      }
      return pbs;
    }

    function formatDurationHms(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.round(seconds % 60);
      if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      return `${m}:${String(s).padStart(2,'0')}`;
    }

    let activePbDetailModel = null;
    let pbDetailReturnFocus = null;

    function createSvgElement(tag, attributes = {}) {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
      return element;
    }

    function getCompactPbRecords(records) {
      if (records.length <= PB_MAX_RESULTS) return records;
      return records.slice(0, PB_MAX_RESULTS - 1).concat(records[records.length - 1]);
    }

    function getDetailTimeTicks(startMs, endMs) {
      const spanDays = Math.max(1, (endMs - startMs) / 86400000);
      const ticks = [];
      let cursor;
      let stepMonths;
      if (spanDays <= 370) {
        cursor = new Date(new Date(startMs).getFullYear(), new Date(startMs).getMonth(), 1);
        stepMonths = 1;
      } else if (spanDays <= 365 * 4) {
        const start = new Date(startMs);
        cursor = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
        stepMonths = 3;
      } else {
        cursor = new Date(new Date(startMs).getFullYear(), 0, 1);
        stepMonths = 12;
      }
      while (cursor.getTime() <= endMs) {
        if (cursor.getTime() >= startMs) ticks.push(new Date(cursor));
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + stepMonths, 1);
      }
      return { ticks, showMonth: stepMonths < 12 };
    }

    function getNiceTicks(minValue, maxValue, count = 5) {
      const span = Math.max(maxValue - minValue, 1);
      const roughStep = span / Math.max(1, count - 1);
      const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
      const normalized = roughStep / magnitude;
      const niceFactor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
      const step = niceFactor * magnitude;
      const first = Math.floor(minValue / step) * step;
      const last = Math.ceil(maxValue / step) * step;
      const ticks = [];
      for (let value = first; value <= last + step * 0.1; value += step) ticks.push(value);
      return { min: first, max: last, ticks };
    }

    function wrapPbActivityTitle(title, maxCharacters = 24) {
      const words = String(title || 'Activity').trim().split(/\s+/);
      const lines = [];
      words.forEach(word => {
        const current = lines[lines.length - 1];
        if (!current || current.length + word.length + 1 > maxCharacters) {
          lines.push(word);
        } else {
          lines[lines.length - 1] = current + ' ' + word;
        }
      });
      if (lines.length <= 2) return lines;
      const secondLine = lines.slice(1).join(' ');
      return [lines[0], secondLine.length > maxCharacters ? secondLine.slice(0, maxCharacters - 1) + '…' : secondLine];
    }

    function renderPbDetailChart(model) {
      const svg = document.getElementById('pbDetailChart');
      if (!svg || !model) return;
      svg.innerHTML = '';
      const records = model.records;
      const W = 1200;
      const H = 680;
      const left = 96;
      const right = 64;
      const top = 62;
      const bottom = 82;
      const plotW = W - left - right;
      const plotH = H - top - bottom;
      const times = records.map(record => record.date.getTime());
      const rawStart = Math.min(...times);
      const rawEnd = Math.max(...times);
      const rawSpan = Math.max(rawEnd - rawStart, 86400000);
      const start = rawStart - rawSpan * 0.035;
      const end = rawEnd + rawSpan * 0.035;
      const xFor = date => left + ((date.getTime() - start) / (end - start)) * plotW;
      const values = records.map(record => record.value);
      const valueMin = model.direction === 'down' ? Math.min(...values) * 0.9 : 0;
      const valueMax = Math.max(...values) * 1.08;
      const scale = getNiceTicks(valueMin, valueMax, 6);
      const yFor = value => top + ((scale.max - value) / Math.max(1, scale.max - scale.min)) * plotH;

      scale.ticks.forEach(value => {
        const y = yFor(value);
        svg.appendChild(createSvgElement('line', { x1: left, y1: y, x2: W - right, y2: y, stroke: '#1E293B', 'stroke-width': 1 }));
        const label = createSvgElement('text', { x: left - 12, y: y + 4, 'text-anchor': 'end', 'font-size': 13, fill: '#CBD5E1', 'font-family': 'ui-monospace, monospace' });
        label.textContent = model.formatValue(value);
        svg.appendChild(label);
      });

      const yTitle = createSvgElement('text', { x: 24, y: top + plotH / 2, transform: `rotate(-90 24 ${top + plotH / 2})`, 'text-anchor': 'middle', 'font-size': 14, fill: '#94A3B8' });
      yTitle.textContent = model.axisLabel;
      svg.appendChild(yTitle);

      const timeTicks = getDetailTimeTicks(start, end);
      timeTicks.ticks.forEach(date => {
        const x = xFor(date);
        svg.appendChild(createSvgElement('line', { x1: x, y1: top, x2: x, y2: H - bottom, stroke: '#172033', 'stroke-width': 1 }));
        const label = createSvgElement('text', { x, y: H - bottom + 28, 'text-anchor': 'middle', 'font-size': 13, fill: '#CBD5E1' });
        label.textContent = timeTicks.showMonth
          ? date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
          : String(date.getFullYear());
        svg.appendChild(label);
      });

      svg.appendChild(createSvgElement('line', { x1: left, y1: top, x2: left, y2: H - bottom, stroke: '#475569', 'stroke-width': 1.5 }));
      svg.appendChild(createSvgElement('line', { x1: left, y1: H - bottom, x2: W - right, y2: H - bottom, stroke: '#475569', 'stroke-width': 1.5 }));

      const points = records.map(record => `${xFor(record.date).toFixed(2)},${yFor(record.value).toFixed(2)}`).join(' ');
      svg.appendChild(createSvgElement('polyline', { points, fill: 'none', stroke: model.color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

      const occupied = [];
      const labelLayouts = records.map((record, index) => {
        const x = xFor(record.date);
        const y = yFor(record.value);
        const labelText = model.formatValue(record.value);
        const titleLines = wrapPbActivityTitle(record.title);
        const estimatedWidth = Math.min(230, Math.max(72, labelText.length * 8.5, ...titleLines.map(line => line.length * 7.2)) + 16);
        const boxHeight = 27 + titleLines.length * 15;
        const preferredSide = model.direction === 'down' ? 'right' : 'left';
        const sides = [preferredSide, preferredSide === 'right' ? 'left' : 'right'];
        const desiredTop = Math.max(top + 4, Math.min(H - bottom - boxHeight - 4, y - boxHeight - 14));
        const laneStep = boxHeight + 8;
        const laneTops = [desiredTop];
        for (let laneTop = top + 4; laneTop <= H - bottom - boxHeight - 4; laneTop += laneStep) {
          laneTops.push(laneTop);
        }
        laneTops.sort((a, b) => Math.abs(a - desiredTop) - Math.abs(b - desiredTop));
        let side = preferredSide;
        let labelX = side === 'right' ? x + 14 : x - 14;
        let boxTop = desiredTop;
        let box = null;
        function getBox(candidateSide, candidateTop) {
          const candidateX = candidateSide === 'right' ? x + 14 : x - 14;
          return {
            left: candidateSide === 'right' ? candidateX : candidateX - estimatedWidth,
            right: candidateSide === 'right' ? candidateX + estimatedWidth : candidateX,
            top: candidateTop,
            bottom: candidateTop + boxHeight
          };
        }

        for (const candidateSide of sides) {
          if (candidateSide === 'right' && x + estimatedWidth + 18 > W - right) continue;
          if (candidateSide === 'left' && x - estimatedWidth - 18 < left) continue;
          for (const candidateTop of laneTops) {
            const candidateBox = getBox(candidateSide, candidateTop);
            const overlaps = occupied.some(other => candidateBox.left < other.right && candidateBox.right > other.left && candidateBox.top < other.bottom && candidateBox.bottom > other.top);
            if (!overlaps) {
              side = candidateSide;
              labelX = candidateSide === 'right' ? x + 14 : x - 14;
              boxTop = candidateTop;
              box = candidateBox;
              break;
            }
          }
          if (box) break;
        }

        if (!box) box = getBox(side, boxTop);
        occupied.push(box);
        return { record, index, x, y, labelText, titleLines, side, box, boxHeight };
      });

      labelLayouts.forEach(layout => {
        const edgeX = layout.side === 'right' ? layout.box.left : layout.box.right;
        const edgeY = Math.max(layout.box.top + 8, Math.min(layout.y, layout.box.bottom - 8));
        svg.appendChild(createSvgElement('line', { x1: layout.x, y1: layout.y, x2: edgeX, y2: edgeY, stroke: '#64748B', 'stroke-width': 1 }));
        svg.appendChild(createSvgElement('circle', { cx: layout.x, cy: layout.y, r: layout.index === records.length - 1 ? 5 : 4, fill: model.color }));
      });

      labelLayouts.forEach(layout => {
        svg.appendChild(createSvgElement('rect', {
          x: layout.box.left,
          y: layout.box.top,
          width: layout.box.right - layout.box.left,
          height: layout.boxHeight,
          rx: 4,
          fill: '#020617',
          'fill-opacity': 0.94,
          stroke: '#334155',
          'stroke-width': 1
        }));
        const textX = layout.side === 'right' ? layout.box.left + 8 : layout.box.right - 8;
        const anchor = layout.side === 'right' ? 'start' : 'end';
        const valueLabel = createSvgElement('text', { x: textX, y: layout.box.top + 17, 'text-anchor': anchor, 'font-size': 14, 'font-weight': layout.index === records.length - 1 ? 700 : 600, fill: layout.index === records.length - 1 ? '#F8FAFC' : model.color, 'font-family': 'ui-monospace, monospace' });
        valueLabel.textContent = layout.labelText;
        svg.appendChild(valueLabel);

        layout.titleLines.forEach((line, lineIndex) => {
          const titleLabel = createSvgElement('text', { x: textX, y: layout.box.top + 34 + lineIndex * 15, 'text-anchor': anchor, 'font-size': 12, fill: '#CBD5E1' });
          titleLabel.textContent = line;
          svg.appendChild(titleLabel);
        });
      });
    }

    function openPbDetail(model, sourceButton) {
      activePbDetailModel = model;
      pbDetailReturnFocus = sourceButton;
      document.getElementById('pbDetailTitle').textContent = model.title;
      document.getElementById('pbDetailSubtitle').textContent = `${model.records.length} record${model.records.length === 1 ? '' : 's'} · ${model.axisLabel}`;
      const exportButton = document.getElementById('pbDetailExport');
      if (exportButton) {
        exportButton.classList.toggle('hidden', !Array.isArray(model.records) || model.records.length === 0);
      }
      document.getElementById('pbDetailOverlay').classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      renderPbDetailChart(model);
      document.getElementById('pbDetailClose').focus();
    }

    function closePbDetail() {
      const overlay = document.getElementById('pbDetailOverlay');
      if (overlay.classList.contains('hidden')) return;
      overlay.classList.add('hidden');
      document.body.style.overflow = '';
      const exportButton = document.getElementById('pbDetailExport');
      if (exportButton) exportButton.classList.add('hidden');
      activePbDetailModel = null;
      if (pbDetailReturnFocus) pbDetailReturnFocus.focus();
      pbDetailReturnFocus = null;
    }

    function renderPbChart() {
      const activities = processedActivities;

      // ── Shared time axis across all sports so x-positions are comparable ──────
      const allSportMs = activities
        .filter(a => ['Swim','Run','Bike'].includes(a.sport))
        .map(a => a.date.getTime());
      const globalTMin = allSportMs.length ? Math.min(...allSportMs) : Date.now() - 1;
      const globalTMax = allSportMs.length ? Math.max(...allSportMs) : Date.now();

      // Use the real first activity as left bound (no leading empty space),
      // and extend to today on the right.
      const today = Date.now();
      const axisStart  = globalTMin;
      const axisEnd    = Math.max(globalTMax, today);
      const axisSpan   = axisEnd - axisStart || 1;

      // Jan-1 tick positions within the visible axis range
      const yearTicks = [];
      const firstYear = new Date(axisStart).getFullYear();
      const lastYear = new Date(axisEnd).getFullYear();
      for (let y = firstYear; y <= lastYear; y++) {
        const tickTime = new Date(y, 0, 1).getTime();
        if (tickTime >= axisStart && tickTime <= axisEnd) {
          yearTicks.push({ year: y, t: tickTime });
        }
      }

      // SVG coordinate system (viewBox units)
      const VB_W      = 300;
      const PAD_L     = 24;
      const PAD_R     = 4;
      const DRAW_W    = VB_W - PAD_L - PAD_R;
      const SVG_H     = 56;
      const CHART_TOP = 6;
      const X_AXIS_Y  = 40;

      function tToX(t) {
        return PAD_L + ((t - axisStart) / axisSpan) * DRAW_W;
      }

      function appendTimelineAxes(svg) {
        const baseline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        baseline.setAttribute('x1', PAD_L);
        baseline.setAttribute('y1', X_AXIS_Y);
        baseline.setAttribute('x2', VB_W - PAD_R);
        baseline.setAttribute('y2', X_AXIS_Y);
        baseline.setAttribute('stroke', '#1E293B');
        baseline.setAttribute('stroke-width', '1');
        svg.appendChild(baseline);

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', PAD_L);
        yAxis.setAttribute('y1', CHART_TOP);
        yAxis.setAttribute('x2', PAD_L);
        yAxis.setAttribute('y2', X_AXIS_Y);
        yAxis.setAttribute('stroke', '#1E293B');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);

        yearTicks.forEach(function(tick) {
          const x = tToX(tick.t);
          const tickLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          tickLine.setAttribute('x1', x);
          tickLine.setAttribute('y1', X_AXIS_Y);
          tickLine.setAttribute('x2', x);
          tickLine.setAttribute('y2', X_AXIS_Y + 3);
          tickLine.setAttribute('stroke', '#334155');
          tickLine.setAttribute('stroke-width', '0.8');
          svg.appendChild(tickLine);

          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', x);
          label.setAttribute('y', SVG_H - 0.5);
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('font-size', '8.5');
          label.setAttribute('fill', '#CBD5E1');
          label.setAttribute('font-family', 'ui-monospace, monospace');
          label.textContent = tick.year;
          svg.appendChild(label);
        });
      }

      function appendYAxisLabel(svg, y, text, isTop) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', PAD_L - 2);
        label.setAttribute('y', y);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', isTop ? 'hanging' : 'auto');
        label.setAttribute('font-size', '6.8');
        label.setAttribute('fill', isTop ? '#E2E8F0' : '#CBD5E1');
        label.setAttribute('font-family', 'ui-monospace, monospace');
        label.textContent = text;
        svg.appendChild(label);
      }

      function appendCurrentBest(svg, x, y, text, color, preferredSide) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', x);
        dot.setAttribute('cy', y);
        dot.setAttribute('r', '2.5');
        dot.setAttribute('fill', color);
        dot.style.pointerEvents = 'none';
        svg.appendChild(dot);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const placeRight = preferredSide === 'right' && x < VB_W - PAD_R - 54;
        const placeLeft = preferredSide !== 'right' && x > PAD_L + 54;
        label.setAttribute('x', placeRight ? x + 5 : placeLeft ? x - 5 : x);
        label.setAttribute('y', Math.max(7, y - 5));
        label.setAttribute('text-anchor', placeRight ? 'start' : placeLeft ? 'end' : 'middle');
        label.setAttribute('font-size', '8.5');
        label.setAttribute('font-weight', '700');
        label.setAttribute('fill', color);
        label.setAttribute('font-family', 'ui-monospace, monospace');
        label.setAttribute('stroke', '#020617');
        label.setAttribute('stroke-width', '2.5');
        label.setAttribute('paint-order', 'stroke');
        label.style.pointerEvents = 'none';
        label.textContent = text;
        svg.appendChild(label);
      }

      function appendPbDetailButton(header, model, tileElement) {
        header.classList.add('justify-between', 'gap-2');
        const actions = document.createElement('div');
        actions.className = 'flex items-center gap-1';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'grid h-7 w-7 shrink-0 place-items-center rounded-md border border-slate-600 bg-slate-900 text-slate-200 shadow-sm transition hover:border-cyan-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400';
        button.setAttribute('aria-label', 'View ' + model.title + ' in full screen');
        button.title = 'View in full screen';
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'maximize-2');
        icon.className = 'h-4 w-4';
        button.appendChild(icon);
        button.addEventListener('click', function() { openPbDetail(model, button); });
        actions.appendChild(button);

        header.appendChild(actions);
        if (window.lucide) window.lucide.createIcons();
      }

      // ── Shared floating tooltip ───────────────────────────────────────────────
      const tooltip  = document.getElementById('pbTooltip');
      const ttTitle  = document.getElementById('pbTooltipTitle');
      const ttDate   = document.getElementById('pbTooltipDate');
      const ttTime   = document.getElementById('pbTooltipTime');
      const ttDist   = document.getElementById('pbTooltipDist');
      const ttPace   = document.getElementById('pbTooltipPace');
      const ttWatts  = document.getElementById('pbTooltipWatts');
      const ttRank   = document.getElementById('pbTooltipRank');

      function showPbTooltip(e, pb, rank, total, color) {
        ttTitle.textContent = pb.name || 'Activity';
        ttTitle.style.color = color;
        ttDate.textContent  = pb.date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
        ttTime.textContent  = 'Time: ' + formatDurationHms(pb.duration);
        const hasWindow = Number.isFinite(pb.intervalStartKm) && Number.isFinite(pb.intervalEndKm);
        const sourceDistanceSuffix = hasWindow
          ? ` (${pb.intervalStartKm.toFixed(2)} km to ${pb.intervalEndKm.toFixed(2)} km)`
          : (pb.isInterimEstimated && Number.isFinite(pb.sourceDistance)
            ? ` (from ${pb.sourceDistance.toFixed(2)} km activity)`
            : '');
        ttDist.textContent  = 'Dist: ' + pb.distance.toFixed(2) + ' km' + sourceDistanceSuffix;
        const metricLabel = pb.metricType === 'speed_bike' ? 'Speed' : 'Pace';
        const metricText = `${metricLabel}: ${formatPerformanceValue(pb.metricValue, pb.metricType)}`;
        if (pb.metricType === 'speed_bike') {
          ttWatts.classList.remove('hidden');
          ttWatts.textContent = Number.isFinite(pb.avgWatts) && pb.avgWatts > 0
            ? `Avg Watts: ${Math.round(pb.avgWatts)} W`
            : 'Avg Watts: n/a';
        } else {
          ttWatts.classList.add('hidden');
          ttWatts.textContent = '';
        }
        ttPace.textContent  = metricText;
        ttRank.textContent  = rank === total ? 'Current PB' : 'PB #' + rank + ' of ' + total;
        tooltip.classList.remove('hidden');
        movePbTooltip(e);
      }

      function movePbTooltip(e) {
        const th  = tooltip.offsetHeight || 120;
        let left  = e.clientX + 14;
        let top   = e.clientY;
        if (left + 230 > window.innerWidth) left = e.clientX - 230 - 6;
        top = Math.max(8, Math.min(top, window.innerHeight - th - 8));
        tooltip.style.left = left + 'px';
        tooltip.style.top  = top  + 'px';
      }

      function hidePbTooltip() {
        tooltip.classList.add('hidden');
      }

      function showPowerPbTooltip(e, pb, rank, total, color, durationLabel) {
        ttTitle.textContent = pb.name || 'Activity';
        ttTitle.style.color = color;
        ttDate.textContent = pb.date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
        const seconds = Number.isFinite(pb.targetSeconds) ? pb.targetSeconds : pb.duration;
        ttTime.textContent = 'Duration: ' + formatDurationHms(seconds);
        ttDist.textContent = Number.isFinite(pb.intervalStartKm) && Number.isFinite(pb.intervalEndKm)
          ? 'Window: ' + pb.intervalStartKm.toFixed(2) + ' km to ' + pb.intervalEndKm.toFixed(2) + ' km'
          : 'Window: n/a';
        ttPace.textContent = 'Power: ' + Math.round(pb.watts) + ' W';
        ttWatts.classList.remove('hidden');
        ttWatts.textContent = 'Source: duration-specific effort';
        ttRank.textContent = (durationLabel ? durationLabel + ' - ' : '') + (rank === total ? 'Current PB' : 'PB #' + rank + ' of ' + total);
        tooltip.classList.remove('hidden');
        movePbTooltip(e);
      }

      function renderRecordCard(containerId, title, sport, metricLabel, getValue, formatValue) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const candidates = activities
          .filter(a => a.sport === sport)
          .map(a => ({ activity: a, value: getValue(a) }))
          .filter(item => Number.isFinite(item.value) && item.value > 0)
          .sort((a, b) => a.activity.date - b.activity.date);
        const records = [];
        let bestValue = -Infinity;
        candidates.forEach(item => {
          if (item.value > bestValue) {
            bestValue = item.value;
            records.push(item);
          }
        });

        const block = document.createElement('div');
        block.className = 'bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5';
        const color = PB_SPORT_COLOR[sport];
        const header = document.createElement('div');
        header.className = 'flex items-center';
        header.innerHTML = '<span class="text-xs font-semibold text-slate-300">' + title + '</span>';
        block.appendChild(header);

        if (records.length === 0) {
          const empty = document.createElement('p');
          empty.className = 'text-xs text-slate-600 italic';
          empty.textContent = sport === 'Swim' ? 'No matching activities found.' : 'No elevation data found.';
          block.appendChild(empty);
          container.appendChild(block);
          return;
        }

        appendPbDetailButton(header, {
          title,
          exportKey: sport + '-' + title,
          axisLabel: metricLabel === 'Elevation' ? 'Elevation (m)' : 'Distance (km)',
          color,
          direction: 'up',
          formatValue,
          records: records.map(item => ({ date: item.activity.date, value: item.value, title: item.activity.name || 'Activity' }))
        }, block);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + SVG_H);
        svg.setAttribute('width', '100%');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.overflow = 'visible';
        svg.style.display = 'block';

        appendTimelineAxes(svg);

        const maxValue = Math.max(records[records.length - 1].value, 1);
        const valueToY = value => X_AXIS_Y - (value / maxValue) * (X_AXIS_Y - CHART_TOP - 2);
        const firstRecordValue = records[0].value;
        const firstRecordY = valueToY(firstRecordValue);
        appendYAxisLabel(svg, firstRecordY <= CHART_TOP + 2 ? CHART_TOP + 1 : firstRecordY - 1, formatValue(firstRecordValue), firstRecordY <= CHART_TOP + 2);
        appendYAxisLabel(svg, X_AXIS_Y - 1, '0', false);

        if (records.length > 1) {
          const firstRecordTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          firstRecordTick.setAttribute('x1', PAD_L - 2);
          firstRecordTick.setAttribute('y1', firstRecordY);
          firstRecordTick.setAttribute('x2', PAD_L + 2);
          firstRecordTick.setAttribute('y2', firstRecordY);
          firstRecordTick.setAttribute('stroke', '#334155');
          firstRecordTick.setAttribute('stroke-width', '0.8');
          svg.appendChild(firstRecordTick);
        }

        const points = records.map(item => tToX(item.activity.date.getTime()).toFixed(2) + ',' + valueToY(item.value).toFixed(2)).join(' ');
        const trendLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        trendLine.setAttribute('points', points);
        trendLine.setAttribute('fill', 'none');
        trendLine.setAttribute('stroke', color);
        trendLine.setAttribute('stroke-width', '1.8');
        svg.appendChild(trendLine);

        records.forEach(function(item, index) {
          const x = tToX(item.activity.date.getTime());
          const y = valueToY(item.value);
          const isLatest = index === records.length - 1;
          const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          hit.setAttribute('x1', x);
          hit.setAttribute('y1', CHART_TOP);
          hit.setAttribute('x2', x);
          hit.setAttribute('y2', X_AXIS_Y);
          hit.setAttribute('stroke', 'transparent');
          hit.setAttribute('stroke-width', '12');
          hit.style.cursor = 'pointer';

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x);
          line.setAttribute('y1', y);
          line.setAttribute('x2', x);
          line.setAttribute('y2', X_AXIS_Y);
          line.setAttribute('stroke', color);
          line.setAttribute('stroke-width', '1.8');
          line.setAttribute('opacity', '0.75');
          line.style.pointerEvents = 'none';
          svg.appendChild(line);

          if (isLatest) {
            appendCurrentBest(svg, x, y, formatValue(item.value), color, 'left');
          }

          const record = item;
          hit.addEventListener('mouseenter', function(e) {
            line.setAttribute('opacity', '1');
            ttTitle.textContent = record.activity.name || 'Activity';
            ttTitle.style.color = color;
            ttDate.textContent = record.activity.date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
            ttTime.textContent = metricLabel + ': ' + formatValue(record.value);
            ttDist.textContent = 'Distance: ' + record.activity.distance.toFixed(2) + ' km';
            ttPace.textContent = '';
            ttWatts.classList.add('hidden');
            ttWatts.textContent = '';
            ttRank.textContent = 'Record ' + (records.indexOf(record) + 1) + ' of ' + records.length;
            tooltip.classList.remove('hidden');
            movePbTooltip(e);
          });
          hit.addEventListener('mousemove', movePbTooltip);
          hit.addEventListener('mouseleave', function() {
            line.setAttribute('opacity', '0.75');
            hidePbTooltip();
          });
          svg.appendChild(hit);
        });

        block.appendChild(svg);
        const footer = document.createElement('p');
        footer.className = 'text-[10px] text-slate-600';
        footer.textContent = records.length + ' record' + (records.length > 1 ? 's' : '') + ' set';
        block.appendChild(footer);
        container.appendChild(block);
      }

      function renderPowerDurationTileChart(block, allPbs, color) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + SVG_H);
        svg.setAttribute('width', '100%');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.overflow = 'visible';
        svg.style.display = 'block';

        appendTimelineAxes(svg);

        const maxValue = Math.max(allPbs[allPbs.length - 1].watts, 1);
        const valueToY = value => X_AXIS_Y - (value / maxValue) * (X_AXIS_Y - CHART_TOP - 2);
        const firstRecordValue = allPbs[0].watts;
        const firstRecordY = valueToY(firstRecordValue);
        appendYAxisLabel(svg, firstRecordY <= CHART_TOP + 2 ? CHART_TOP + 1 : firstRecordY - 1, Math.round(firstRecordValue) + ' W', firstRecordY <= CHART_TOP + 2);
        appendYAxisLabel(svg, X_AXIS_Y - 1, '0 W', false);

        if (allPbs.length > 1) {
          const firstRecordTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          firstRecordTick.setAttribute('x1', PAD_L - 2);
          firstRecordTick.setAttribute('y1', firstRecordY);
          firstRecordTick.setAttribute('x2', PAD_L + 2);
          firstRecordTick.setAttribute('y2', firstRecordY);
          firstRecordTick.setAttribute('stroke', '#334155');
          firstRecordTick.setAttribute('stroke-width', '0.8');
          svg.appendChild(firstRecordTick);
        }

        const points = allPbs.map(pb => tToX(pb.date.getTime()).toFixed(2) + ',' + valueToY(pb.watts).toFixed(2)).join(' ');
        const trendLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        trendLine.setAttribute('points', points);
        trendLine.setAttribute('fill', 'none');
        trendLine.setAttribute('stroke', color);
        trendLine.setAttribute('stroke-width', '1.8');
        svg.appendChild(trendLine);

        allPbs.forEach(function(pb, index) {
          const x = tToX(pb.date.getTime());
          const y = valueToY(pb.watts);
          const isLatest = index === allPbs.length - 1;
          const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          hit.setAttribute('x1', x);
          hit.setAttribute('y1', CHART_TOP);
          hit.setAttribute('x2', x);
          hit.setAttribute('y2', X_AXIS_Y);
          hit.setAttribute('stroke', 'transparent');
          hit.setAttribute('stroke-width', '12');
          hit.style.cursor = 'pointer';

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x);
          line.setAttribute('y1', y);
          line.setAttribute('x2', x);
          line.setAttribute('y2', X_AXIS_Y);
          line.setAttribute('stroke', color);
          line.setAttribute('stroke-width', '1.8');
          line.setAttribute('opacity', '0.75');
          line.style.pointerEvents = 'none';
          svg.appendChild(line);

          if (isLatest) {
            appendCurrentBest(svg, x, y, Math.round(pb.watts) + ' W', color, 'left');
          }

          hit.addEventListener('mouseenter', function(e) {
            line.setAttribute('opacity', '1');
            showPowerPbTooltip(e, pb, index + 1, allPbs.length, color, null);
          });
          hit.addEventListener('mousemove', movePbTooltip);
          hit.addEventListener('mouseleave', function() {
            line.setAttribute('opacity', '0.75');
            hidePbTooltip();
          });
          svg.appendChild(hit);
        });

        block.appendChild(svg);
        const footer = document.createElement('p');
        footer.className = 'text-[10px] text-slate-600';
        footer.textContent = allPbs.length + ' record' + (allPbs.length > 1 ? 's' : '') + ' set';
        block.appendChild(footer);
      }

      // ── Per-sport columns ─────────────────────────────────────────────────────
      ['Swim', 'Run', 'Bike'].forEach(function(sport) {
        const containerId = sport === 'Swim' ? 'pbSwimContainer'
                          : sport === 'Run'  ? 'pbRunContainer'
                          : 'pbBikeContainer';
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        const color     = PB_SPORT_COLOR[sport];
        const distances = PB_DISTANCES[sport];
        let anyData     = false;

        distances.forEach(function(distDef) {
          const allPbs = computePbsForDistance(activities, sport, distDef.km, distDef.tol);
          if (allPbs.length === 0) return;
          const pbs = getCompactPbRecords(allPbs);
          anyData = true;

          // Card wrapper
          const block = document.createElement('div');
          block.className = 'bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5';

          // Header: distance label
          const best   = pbs[pbs.length - 1];
          const header = document.createElement('div');
          header.className = 'flex items-center';
          header.innerHTML = '<span class="text-xs font-semibold text-slate-300">' + distDef.label + '</span>';
          appendPbDetailButton(header, {
            title: sport + ' ' + distDef.label,
            exportKey: sport + '-' + distDef.label,
            axisLabel: 'Time',
            color,
            direction: 'down',
            formatValue: formatDurationHms,
            records: allPbs.map(pb => ({ date: pb.date, value: pb.duration, title: pb.name || 'Activity' }))
          }, block);
          block.appendChild(header);

          // SVG
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          // Responsive SVG: use viewBox and preserveAspectRatio to avoid non-uniform scaling
          svg.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + SVG_H);
          svg.setAttribute('width', '100%');
          // Do not force a fixed height attribute; allow the browser to size keeping aspect ratio
          svg.removeAttribute('height');
          // Preserve aspect ratio (uniform scaling) so text and axis labels don't stretch
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svg.style.overflow = 'visible';
          svg.style.cursor   = 'default';
          svg.style.display  = 'block';
          svg.style.height   = 'auto';

          appendTimelineAxes(svg);

          // PB line chart + vertical PB markers (Y axis = total duration)
          const durationMax = Math.max(...pbs.map(pb => pb.duration));
          const yMax    = Math.max(durationMax, 1);
          const ySpan   = X_AXIS_Y - CHART_TOP - 2;

          function durationToY(durationSeconds) {
            const normalized = Math.max(0, Math.min(1, durationSeconds / yMax));
            return X_AXIS_Y - normalized * ySpan;
          }

          // Y-axis labels (top = slowest PB duration, bottom fixed at zero)
          appendYAxisLabel(svg, CHART_TOP + 1, formatDurationHms(durationMax), true);
          appendYAxisLabel(svg, X_AXIS_Y - 1, '0:00', false);

          const trendLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
          const points = pbs.map(function(pb) {
            return tToX(pb.date.getTime()).toFixed(2) + ',' + durationToY(pb.duration).toFixed(2);
          }).join(' ');
          trendLine.setAttribute('points', points);
          trendLine.setAttribute('fill', 'none');
          trendLine.setAttribute('stroke', color);
          trendLine.setAttribute('stroke-opacity', '0.9');
          trendLine.setAttribute('stroke-width', '1.8');
          trendLine.setAttribute('stroke-linecap', 'round');
          trendLine.setAttribute('stroke-linejoin', 'round');
          svg.appendChild(trendLine);

          pbs.forEach(function(pb, i) {
            const x        = tToX(pb.date.getTime());
            const y1       = durationToY(pb.duration);
            const y2       = X_AXIS_Y;
            const isLatest = i === pbs.length - 1;
            const opacity  = 0.30 + 0.70 * (i / Math.max(pbs.length - 1, 1));
            const markerStrokeWidth = 1.8;

            // Wide transparent hit zone
            const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hit.setAttribute('x1', x);
            hit.setAttribute('y1', CHART_TOP);
            hit.setAttribute('x2', x);
            hit.setAttribute('y2', y2);
            hit.setAttribute('stroke', 'transparent');
            hit.setAttribute('stroke-width', '10');
            hit.style.cursor = 'pointer';
            svg.appendChild(hit);

            // Visible line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', String(markerStrokeWidth));
            line.setAttribute('stroke-linecap', 'round');
            line.setAttribute('opacity', opacity.toFixed(2));
            line.style.pointerEvents = 'none';
            svg.appendChild(line);

            if (isLatest) {
              appendCurrentBest(svg, x, y1, formatDurationHms(best.duration), color, 'right');
            }

            // Hover events — close over immutable copies
            const pbSnap = pb;
            const rank   = i + 1;
            const total  = pbs.length;
            hit.addEventListener('mouseenter', function(e) {
              line.setAttribute('opacity', '1');
              showPbTooltip(e, pbSnap, rank, total, color);
            });
            hit.addEventListener('mousemove', movePbTooltip);
            hit.addEventListener('mouseleave', function() {
              line.setAttribute('opacity', opacity.toFixed(2));
              hidePbTooltip();
            });
          });

          block.appendChild(svg);

          // Footer
          const footer = document.createElement('p');
          footer.className = 'text-[10px] text-slate-600';
          footer.textContent = allPbs.length + ' PB' + (allPbs.length > 1 ? 's' : '') + ' set';
          block.appendChild(footer);

          container.appendChild(block);
        });

        if (!anyData) {
          const empty = document.createElement('p');
          empty.className = 'text-xs text-slate-600 italic';
          empty.textContent = 'No matching activities found for this sport.';
          container.appendChild(empty);
        }
      });

      renderRecordCard('pbSwimLongestContainer', 'Longest swim', 'Swim', 'Distance', a => a.distance, value => value.toFixed(2) + ' km');
      renderRecordCard('pbRunElevationContainer', 'Most elevation (Run)', 'Run', 'Elevation', a => a.elevationGain, value => Math.round(value) + ' m');
      renderRecordCard('pbBikeElevationContainer', 'Most elevation (Bike)', 'Bike', 'Elevation', a => a.elevationGain, value => Math.round(value) + ' m');
      renderRecordCard('pbRunLongestContainer', 'Longest run', 'Run', 'Distance', a => a.distance, value => value.toFixed(2) + ' km');
      renderRecordCard('pbBikeLongestContainer', 'Longest bike', 'Bike', 'Distance', a => a.distance, value => value.toFixed(2) + ' km');

      function renderBikePowerSection() {
        const container = document.getElementById('pbBikePowerContainer');
        if (!container) return;
        container.innerHTML = '';
        const heading = document.getElementById('pbBikePowerHeading');
        const divider = document.getElementById('pbBikePowerDivider');
        if (heading) heading.classList.add('hidden');
        if (divider) divider.classList.add('hidden');
        const color = PB_SPORT_COLOR.Bike;
        const durationRecords = [];
        const section = document.createElement('div');
        section.className = 'space-y-3';

        PB_BIKE_POWER_DURATIONS.forEach(function(durationDef) {
          const allPbs = computeBikePowerPbsForDuration(activities, durationDef.seconds, durationDef.tol);
          if (allPbs.length === 0) return;
          const pbs = getCompactPbRecords(allPbs);
          const best = allPbs[allPbs.length - 1];
          durationRecords.push({
            durationSeconds: durationDef.seconds,
            durationLabel: durationDef.label,
            watts: best.watts,
            date: best.date,
            title: best.name || 'Activity',
            record: best
          });

          const block = document.createElement('div');
          block.className = 'bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5';
          const header = document.createElement('div');
          header.className = 'flex items-center';
          header.innerHTML = '<span class="text-xs font-semibold text-slate-300">' + durationDef.label + '</span>';
          appendPbDetailButton(header, {
            title: 'Bike power ' + durationDef.label,
            exportKey: 'Bike-power-' + durationDef.label,
            axisLabel: 'Power (W)',
            color,
            direction: 'up',
            formatValue: value => Math.round(value) + ' W',
            records: allPbs.map(pb => ({ date: pb.date, value: pb.watts, title: pb.name || 'Activity' }))
          }, block);
          block.appendChild(header);

          renderPowerDurationTileChart(block, allPbs, color);
          section.appendChild(block);
        });

        const profilePoints = window.powerPbUtils.buildAllTimePowerProfile(durationRecords.map(entry => ({
          durationSeconds: entry.durationSeconds,
          durationLabel: entry.durationLabel,
          watts: entry.watts,
          date: entry.date,
          title: entry.title,
          record: entry.record
        })));
        if (profilePoints.length >= 2) {
          const profileBlock = document.createElement('div');
          profileBlock.className = 'bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2';
          const profileHeader = document.createElement('div');
          profileHeader.className = 'flex items-center';
          const profileTitle = document.createElement('span');
          profileTitle.className = 'text-xs font-semibold text-slate-300';
          profileTitle.textContent = 'All-time power profile';
          profileHeader.appendChild(profileTitle);
          appendPbDetailButton(profileHeader, {
            title: 'Bike power all-time profile',
            exportKey: 'Bike-power-all-time-profile',
            axisLabel: 'Power (W)',
            color,
            direction: 'up',
            formatValue: value => Math.round(value) + ' W',
            records: profilePoints.map(point => ({ date: point.date, value: point.watts, title: point.title || 'Activity' }))
          }, profileBlock);
          profileBlock.appendChild(profileHeader);

          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const width = 320;
          const height = 150;
          const left = 38;
          const right = 10;
          const top = 12;
          const bottom = 30;
          const minDuration = profilePoints[0].durationSeconds;
          const maxDuration = profilePoints[profilePoints.length - 1].durationSeconds;
          const wattRange = window.powerPbUtils.getPowerProfileWattRange(profilePoints);
          const maxWatts = Math.max(wattRange.max || 1, 1);
          const labeledPoints = window.powerPbUtils.markPowerProfileLabelVisibility(profilePoints);
          const xFor = seconds => left + ((seconds - minDuration) / Math.max(1, maxDuration - minDuration)) * (width - left - right);
          const yFor = watts => top + (1 - watts / maxWatts) * (height - top - bottom);
          svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', String(height));
          svg.setAttribute('role', 'img');
          svg.setAttribute('aria-label', 'Power (W) by duration');

          const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          axis.setAttribute('x1', left); axis.setAttribute('y1', height - bottom); axis.setAttribute('x2', width - right); axis.setAttribute('y2', height - bottom); axis.setAttribute('stroke', '#475569');
          svg.appendChild(axis);
          const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          yAxis.setAttribute('x1', left); yAxis.setAttribute('y1', top); yAxis.setAttribute('x2', left); yAxis.setAttribute('y2', height - bottom); yAxis.setAttribute('stroke', '#475569');
          svg.appendChild(yAxis);

          function appendProfileWattLabel(watts, y) {
            const wattLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            wattLabel.setAttribute('x', left - 4);
            wattLabel.setAttribute('y', y);
            wattLabel.setAttribute('text-anchor', 'end');
            wattLabel.setAttribute('dominant-baseline', 'middle');
            wattLabel.setAttribute('font-size', '8');
            wattLabel.setAttribute('fill', '#CBD5E1');
            wattLabel.textContent = Math.round(watts) + ' W';
            svg.appendChild(wattLabel);
          }
          if (Number.isFinite(wattRange.max)) appendProfileWattLabel(wattRange.max, yFor(wattRange.max));
          if (Number.isFinite(wattRange.min) && wattRange.min !== wattRange.max) appendProfileWattLabel(wattRange.min, yFor(wattRange.min));

          const profileLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
          profileLine.setAttribute('points', profilePoints.map(point => xFor(point.durationSeconds).toFixed(2) + ',' + yFor(point.watts).toFixed(2)).join(' '));
          profileLine.setAttribute('fill', 'none'); profileLine.setAttribute('stroke', color); profileLine.setAttribute('stroke-width', '2');
          svg.appendChild(profileLine);

          labeledPoints.forEach(function(point) {
            const px = xFor(point.durationSeconds);
            const py = yFor(point.watts);
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', px); circle.setAttribute('cy', py); circle.setAttribute('r', '4'); circle.setAttribute('fill', color);
            circle.setAttribute('aria-label', point.durationLabel + ': ' + Math.round(point.watts) + ' W');
            svg.appendChild(circle);
            if (point.showLabel) {
              const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              label.setAttribute('x', px); label.setAttribute('y', height - 12); label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', '9'); label.setAttribute('fill', '#CBD5E1'); label.textContent = point.durationLabel;
              svg.appendChild(label);
            }

            const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            hit.setAttribute('cx', px); hit.setAttribute('cy', py); hit.setAttribute('r', '8'); hit.setAttribute('fill', 'transparent');
            hit.style.cursor = 'pointer';
            hit.addEventListener('mouseenter', function(e) {
              showPowerPbTooltip(e, point.record, 1, 1, color, point.durationLabel);
            });
            hit.addEventListener('mousemove', movePbTooltip);
            hit.addEventListener('mouseleave', hidePbTooltip);
            svg.appendChild(hit);
          });

          const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          xLabel.setAttribute('x', width / 2); xLabel.setAttribute('y', height - 1); xLabel.setAttribute('text-anchor', 'middle'); xLabel.setAttribute('font-size', '9'); xLabel.setAttribute('fill', '#94A3B8'); xLabel.textContent = 'Duration';
          svg.appendChild(xLabel);
          const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          yLabel.setAttribute('x', '10'); yLabel.setAttribute('y', height / 2); yLabel.setAttribute('text-anchor', 'middle'); yLabel.setAttribute('font-size', '9'); yLabel.setAttribute('fill', '#94A3B8'); yLabel.setAttribute('transform', 'rotate(-90 10 ' + height / 2 + ')'); yLabel.textContent = 'Power (W)';
          svg.appendChild(yLabel);
          profileBlock.appendChild(svg);
          section.appendChild(profileBlock);
        } else if (profilePoints.length === 1) {
          const limited = document.createElement('p');
          limited.className = 'limited-profile text-xs text-slate-500 italic';
          limited.textContent = 'Limited power profile: one duration available.';
          section.appendChild(limited);
        }

        if (durationRecords.length > 0) {
          if (heading) heading.classList.remove('hidden');
          if (divider) divider.classList.remove('hidden');
          container.appendChild(section);
          if (window.lucide) window.lucide.createIcons();
        }
      }

      renderBikePowerSection();

      // Show/hide overall empty state
      const hasAnyPb = processedActivities.some(function(a) { return ['Swim','Run','Bike'].includes(a.sport); });
      const emptyState = document.getElementById('pbEmptyState');
      if (emptyState) emptyState.classList.toggle('hidden', hasAnyPb);
    }
