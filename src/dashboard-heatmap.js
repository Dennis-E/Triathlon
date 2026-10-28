     let selectedHeatmapSportFilter = 'All';
    const HEATMAP_COLOR_SCHEMES = ['blue-red', 'yellow-red', 'blue', 'black-fire'];
    let selectedHeatmapColorScheme = 'blue-red';
     let heatmapMapInstance = null;
    let heatmapTileLayerInstance = null;
     let routeCanvasLayerInstance = null;
     let leafletLoadPromise = null;
    let heatmapViewportDataset = null;
    let heatmapInitialFitPending = false;
    let heatmapDisplayedData = null;

    function syncHeatmapDisplayedData(overrides = {}) {
      const next = { dataset: importedDataset, tracks: gpsTracksByActivityId, summaries: heatmapActivitySummaryIndex, dataRevision: typeof dashboardDataRevision === 'number' ? dashboardDataRevision : 0, sport: selectedHeatmapSportFilter, palette: selectedHeatmapColorScheme, ...overrides };
      if (heatmapDisplayedData && Object.keys(next).some(key => next[key] !== heatmapDisplayedData[key])) {
        window.dashboardTooltips?.invalidate?.();
        heatmapTooltipSegmentKey = null;
        heatmapTooltipModel = null;
        hideHeatmapActivityTooltip();
      }
      heatmapDisplayedData = next;
    }

    function updateHeatmapTilePresentation() {
      const tileContainer = heatmapTileLayerInstance && heatmapTileLayerInstance.getContainer();
      if (!tileContainer) return;
      tileContainer.style.filter = selectedHeatmapColorScheme === 'black-fire'
        ? 'invert(1) hue-rotate(180deg) brightness(0.8)'
        : '';
    }

    // Lazy-load Leaflet only when the heatmap tab is first opened. Route lines are
    // drawn with vanilla Leaflet polylines, so no heat-plugin dependency is needed.
    function ensureLeafletLoaded() {
      if (leafletLoadPromise) return leafletLoadPromise;

      leafletLoadPromise = new Promise((resolve, reject) => {
        if (typeof L !== 'undefined' && L.polyline) {
          resolve();
          return;
        }

        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);

        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletScript.onload = resolve;
        leafletScript.onerror = () => reject(new Error('Failed to load Leaflet library'));
        document.head.appendChild(leafletScript);
      });

      return leafletLoadPromise;
    }

    // Lazily define the custom canvas-based route layer once Leaflet (L) is loaded.
    // Replaces one-L.polyline-per-segment rendering (specs/001-route-line-heatmap) with a
    // single <canvas> that redraws only on moveend/zoomend, avoiding the per-object
    // bookkeeping cost that made pan/zoom janky at scale (specs/002-heatmap-performance-scale).
    let RouteCanvasLayerClass = null;
    function ensureRouteCanvasLayerClass() {
      if (RouteCanvasLayerClass) return RouteCanvasLayerClass;

      RouteCanvasLayerClass = L.Layer.extend({
        initialize: function (options) {
          L.Util.setOptions(this, options || {});
          this._segments = [];
          this._frequencyScale = null;
          this._colorScheme = 'blue-red';
          this._lowZoomSegments = null;
          this._screenSegmentIndex = window.heatmapUtils.buildScreenSegmentIndex([]);
          this._hoverFrame = null;
        },

        onAdd: function (map) {
          this._map = map;
          this._canvas = L.DomUtil.create('canvas', 'leaflet-zoom-animated');
          this._canvas.style.position = 'absolute';
          map.getPanes().overlayPane.appendChild(this._canvas);
          map.on('moveend zoomend resize', this._reset, this);
          this._movementStart = () => {
            this._pointerDragged = true;
            this._mapMoving = true;
            this._pointerReady = false;
            if (this._hoverFrame) cancelAnimationFrame(this._hoverFrame);
            this._hoverFrame = null;
            hideHeatmapActivityTooltip();
          };
          map.on('movestart zoomstart', this._movementStart);
          this._mouseMoveHandler = event => {
            if (this._hoverFrame) cancelAnimationFrame(this._hoverFrame);
            this._hoverFrame = requestAnimationFrame(() => this._handlePointerMove(event));
          };
          this._mouseLeaveHandler = () => {
            if (this._hoverFrame) cancelAnimationFrame(this._hoverFrame);
            this._hoverFrame = null;
            hideHeatmapActivityTooltip();
          };
          map.getContainer().addEventListener('mousemove', this._mouseMoveHandler);
          map.getContainer().addEventListener('mouseleave', this._mouseLeaveHandler);
          this._installInspector();
          this._reset();
        },

        onRemove: function (map) {
          L.DomUtil.remove(this._canvas);
          map.off('moveend zoomend resize', this._reset, this);
          map.off('movestart zoomstart', this._movementStart);
          map.getContainer().removeEventListener('mousemove', this._mouseMoveHandler);
          map.getContainer().removeEventListener('mouseleave', this._mouseLeaveHandler);
          if (this._hoverFrame) cancelAnimationFrame(this._hoverFrame);
          this._disposeInspector?.();
          hideHeatmapActivityTooltip();
          this._map = null;
        },

        _installInspector: function () {
          const controller = window.dashboardTooltips;
          if (!controller?.registerAdapter) return;
          const container = this._map.getContainer();
          container.tabIndex = 0;
          const removers = [];
          const listen = (name, handler) => {
            container.addEventListener(name, handler);
            removers.push(() => container.removeEventListener(name, handler));
          };
          const releaseKeyboard = () => {
            this._inspectorOwnsFocus = false;
            delete container.dataset.tooltipInspector;
          };
          const inspect = (hit, point, pinned = true) => {
            if (hit) showHeatmapActivityTooltip(hit.segment, point, container.getBoundingClientRect(), pinned, container);
          };
          controller.registerAdapter('heatmap', {
            readContext: () => controller.readContext('heatmap'),
            resolveItem: event => this._hitForEvent(event),
            projectAnchor: selection => this._projectInspectionAnchor(selection.anchor),
            snapshotCapture: () => {
              const canvas = document.createElement('canvas');
              canvas.width = this._canvas.width;
              canvas.height = this._canvas.height;
              canvas.getContext('2d').drawImage(this._canvas, 0, 0);
              return { canvas, sourceCanvas: this._canvas, selection: controller.getPinned('heatmap'), model: heatmapTooltipModel ? JSON.parse(JSON.stringify(heatmapTooltipModel)) : null, palette: this._colorScheme };
            },
            dispose: () => { removers.forEach(remove => remove()); releaseKeyboard(); }
          });
          this._disposeInspector = () => { removers.forEach(remove => remove()); releaseKeyboard(); };
          listen('pointerdown', event => {
            this._pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
            this._pointerDragged = false;
            this._pointerReady = false;
          });
          listen('pointermove', event => {
            if (this._pointerStart && Math.hypot(event.clientX - this._pointerStart.x, event.clientY - this._pointerStart.y) > 5) this._pointerDragged = true;
          });
          listen('pointerup', event => {
            const start = this._pointerStart;
            this._pointerReady = !!start && start.id === event.pointerId && !this._pointerDragged && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 5;
            this._pointerStart = null;
          });
          listen('pointercancel', () => { this._pointerStart = null; this._pointerReady = false; });
          listen('click', event => {
            if (!this._pointerReady) return;
            this._pointerReady = false;
            const resolved = this._hitForEvent(event);
            if (resolved) inspect(resolved.hit, resolved.point);
          });
          listen('blur', releaseKeyboard);
          listen('keydown', event => {
            if (event.target !== container) return;
            if (this._inspectorOwnsFocus && !controller.getPinned('heatmap')) releaseKeyboard();
            if (!this._inspectorOwnsFocus && !['Enter', ' '].includes(event.key)) return;
            if (event.key === 'Escape') {
              event.preventDefault(); event.stopPropagation();
              controller.dismiss();
              releaseKeyboard();
              return;
            }
            const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : 0;
            if (!direction && !['Enter', ' '].includes(event.key)) return;
            const entries = this._inspectionEntries || [];
            if (!entries.length) return;
            event.preventDefault(); event.stopPropagation();
            this._inspectorOwnsFocus = true;
            container.dataset.tooltipInspector = 'true';
            this._inspectionIndex = this._inspectionIndex == null ? 0 : (this._inspectionIndex + direction + entries.length) % entries.length;
            const entry = entries[this._inspectionIndex % entries.length];
            if (direction && controller.getPinned('heatmap')?.anchor.itemId === String(entry.key)) return;
            inspect(entry, [(entry.p1[0] + entry.p2[0]) / 2, (entry.p1[1] + entry.p2[1]) / 2]);
          });
        },

        _projectInspectionAnchor: function (anchor) {
          if (!this._map || !anchor.geoPoint) return anchor;
          const point = this._map.latLngToContainerPoint(anchor.geoPoint);
          const rect = this._map.getContainer().getBoundingClientRect();
          const size = this._map.getSize();
          return { ...anchor,
            normalizedPoint: { x: (rect.left + point.x) / (window.innerWidth || 800), y: (rect.top + point.y) / (window.innerHeight || 600) },
            capturePoint: { x: point.x / (size.x || 1), y: point.y / (size.y || 1) },
            visibility: point.x >= 0 && point.y >= 0 && point.x <= size.x && point.y <= size.y ? 'visible' : 'outside-view'
          };
        },

        _hitForEvent: function (event) {
          if (!this._map || !this._screenSegmentIndex) return null;
          const rect = this._map.getContainer().getBoundingClientRect();
          const point = [event.clientX - rect.left, event.clientY - rect.top];
          const hit = window.heatmapUtils.hitTestScreenSegmentIndex(this._screenSegmentIndex, point);
          return hit ? { hit, point, rect } : null;
        },

        // Replace the segments this layer draws (called on every renderHeatmap(), e.g.
        // after a sport-filter change) and force a fresh redraw (FR-006/SC-004 from
        // specs/001-route-line-heatmap: no stale routes left visible).
        setSegments: function (segments, frequencyScale, colorScheme = selectedHeatmapColorScheme) {
          const segmentList = Object.values(segments || {});
          this._frequencyScale = frequencyScale || window.heatmapUtils.computeRouteFrequencyScale(segmentList);
          this._colorScheme = colorScheme;
          const styledSegments = segmentList.map(segment => ({
            ...segment,
            color: window.heatmapUtils.computeRouteSegmentColor(segment.count, this._frequencyScale, { scheme: this._colorScheme })
          }));
          // Sort once here (not per redraw frame) so higher-frequency segments are always
          // drawn last/on top, independent of import order (spec 005 FR-001/FR-002/FR-003).
          this._segments = window.heatmapUtils.sortSegmentsForDrawOrder(styledSegments);
          this._lowZoomSegments = null;
          hideHeatmapActivityTooltip();
          if (this._map) this._reset();
          return this;
        },

        _reset: function () {
          if (!this._map) return;
          const map = this._map;
          const size = map.getSize();
          const topLeft = map.containerPointToLayerPoint([0, 0]);
          L.DomUtil.setPosition(this._canvas, topLeft);
          this._canvas.width = size.x;
          this._canvas.height = size.y;
          this._origin = topLeft;
          this._mapMoving = false;
          this._draw();
          window.dashboardTooltips?.refreshAnchor?.();
        },

        _draw: function () {
          const map = this._map;
          const ctx = this._canvas.getContext('2d');
          ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
          if (!this._segments.length) {
            this._screenSegmentIndex = window.heatmapUtils.buildScreenSegmentIndex([]);
            this._inspectionEntries = [];
            return;
          }

          const zoom = map.getZoom();
          const mapBounds = map.getBounds();
          const viewportBounds = [
            [mapBounds.getSouth(), mapBounds.getWest()],
            [mapBounds.getNorth(), mapBounds.getEast()]
          ];
          // Pad by 25% of the viewport height so segments don't visibly pop in/out at
          // the edge while panning between moveend events.
          const paddingDegrees = (mapBounds.getNorth() - mapBounds.getSouth()) * 0.25;

          // Below this zoom, use the coarser buildLowZoomRouteSegments() aggregate
          // (research.md Decision 4) instead of full corridor detail.
          const lowZoomThreshold = this.options.lowZoomThresholdZoom || 10;
          let segmentsToDraw = this._segments;
          if (zoom < lowZoomThreshold) {
            if (!this._lowZoomSegments) {
              const styledLowZoomSegments = Object.values(window.heatmapUtils.buildLowZoomRouteSegments(this._segments))
                .map(segment => ({
                  ...segment,
                  color: window.heatmapUtils.computeRouteSegmentColor(segment.colorCount, this._frequencyScale, { scheme: this._colorScheme })
                }));
              // Same frequency-on-top guarantee for aggregates, keyed by colorCount (FR-010).
              this._lowZoomSegments = window.heatmapUtils.sortSegmentsForDrawOrder(styledLowZoomSegments, 'colorCount');
            }
            segmentsToDraw = this._lowZoomSegments;
          }

          const minLengthPx = this.options.minLengthPx || 1.5;
          const origin = this._origin;
          const screenEntries = [];

          for (let i = 0; i < segmentsToDraw.length; i++) {
            const segment = segmentsToDraw[i];
            // Viewport culling (research.md Decision 3): skip segments that can't be seen.
            if (!window.heatmapUtils.segmentIntersectsBounds(segment, viewportBounds, paddingDegrees)) continue;

            const style = window.heatmapUtils.computeRouteSegmentStyle(segment.count);
            // Above the low-zoom threshold, draw the corridor's true recorded (simplified)
            // path instead of its [start, end] matching chord, so curves are followed rather
            // than cut across (spec 006 FR-001); low-zoom aggregates have no truePathPoints
            // and fall back to their existing coords chord unchanged (FR-006).
            const hasTruePath = Array.isArray(segment.truePathPoints) && segment.truePathPoints.length >= 2;
            const pathPoints = hasTruePath ? segment.truePathPoints : segment.coords;
            const pixelPoints = pathPoints.map(point => {
              const layerPoint = map.latLngToLayerPoint(point);
              return [layerPoint.x - origin.x, layerPoint.y - origin.y];
            });

            // Never draw a fully-invisible stroke, so an isolated activity always shows
            // (spec FR-003 / SC-004 from specs/002-heatmap-performance-scale).
            const totalLengthPx = pixelPoints.slice(1).reduce((sum, point, index) => {
              const previous = pixelPoints[index];
              return sum + Math.hypot(point[0] - previous[0], point[1] - previous[1]);
            }, 0);
            if (totalLengthPx < minLengthPx) {
              const [extendedStart, extendedEnd] = window.heatmapUtils.extendSegmentToMinLength(
                pixelPoints[0], pixelPoints[pixelPoints.length - 1], { minLengthPx }
              );
              pixelPoints[0] = extendedStart;
              pixelPoints[pixelPoints.length - 1] = extendedEnd;
            }

            ctx.beginPath();
            ctx.moveTo(pixelPoints[0][0], pixelPoints[0][1]);
            for (let pointIndex = 1; pointIndex < pixelPoints.length; pointIndex++) {
              ctx.lineTo(pixelPoints[pointIndex][0], pixelPoints[pointIndex][1]);
            }
            ctx.strokeStyle = segment.color;
            ctx.globalAlpha = style.opacity;
            ctx.lineWidth = style.weight;
            ctx.lineCap = 'round';
            ctx.stroke();
            // One screenEntries item per drawn true-path edge, all tagged with the same
            // segment/key, so hit-testing keeps resolving to the correct corridor regardless
            // of which edge along its true path was hovered (spec 006 FR-008).
            for (let pointIndex = 1; pointIndex < pixelPoints.length; pointIndex++) {
              screenEntries.push({
                key: segment.key,
                p1: pixelPoints[pointIndex - 1],
                p2: pixelPoints[pointIndex],
                lineWidth: style.weight,
                segment
              });
            }
          }
          ctx.globalAlpha = 1;
          this._screenSegmentIndex = window.heatmapUtils.buildScreenSegmentIndex(screenEntries);
          const seen = new Set();
          this._inspectionEntries = screenEntries.filter(entry => {
            if (seen.has(entry.key)) return false;
            const midpoint = entry.p1.map((value, index) => (value + entry.p2[index]) / 2);
            if (!midpoint.every((value, index) => value >= 0 && value <= (index ? this._canvas.height : this._canvas.width))) return false;
            seen.add(entry.key);
            return true;
          });
        },

        _handlePointerMove: function (event) {
          this._hoverFrame = null;
          if (this._pointerStart || this._mapMoving) return;
          const resolved = this._hitForEvent(event);
          if (!resolved) {
            hideHeatmapActivityTooltip();
            return;
          }
          showHeatmapActivityTooltip(resolved.hit.segment, resolved.point, resolved.rect);
        }
      });

      return RouteCanvasLayerClass;
    }

    function setHeatmapSportBtnActive(btnId) {
      document.querySelectorAll('[id^="heatmapSportBtn"]').forEach(btn => {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-slate-400 hover:text-slate-200';
      });
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer bg-indigo-600 text-white shadow shadow-indigo-600/25';
      }
    }

    function getHeatmapKeyboardAdapter() {
      return window.dashboardTabNavigation.createDashboardFilterAdapter(
        () => ({ values: { sport: selectedHeatmapSportFilter, palette: selectedHeatmapColorScheme } }),
        prefix => {
          if (prefix.length === 0) return { id: 'sport', values: ['All', 'Run', 'Bike', 'Swim'] };
          if (prefix.length === 1) return { id: 'palette', values: HEATMAP_COLOR_SCHEMES };
          return null;
        },
        values => {
          syncHeatmapDisplayedData({ sport: values.sport, palette: HEATMAP_COLOR_SCHEMES.includes(values.palette) ? values.palette : 'blue-red' });
          selectedHeatmapColorScheme = HEATMAP_COLOR_SCHEMES.includes(values.palette) ? values.palette : 'blue-red';
          const selector = document.getElementById('heatmapColorScheme');
          if (selector) selector.value = selectedHeatmapColorScheme;
          setHeatmapSportFilter(values.sport);
        }
      );
    }

    function setHeatmapSportFilter(sport) {
      syncHeatmapDisplayedData({ sport });
      hideHeatmapActivityTooltip();
      selectedHeatmapSportFilter = sport;
      setHeatmapSportBtnActive(`heatmapSportBtn${sport}`);
      renderHeatmap();
    }

    function setHeatmapColorScheme(scheme) {
      syncHeatmapDisplayedData({ palette: HEATMAP_COLOR_SCHEMES.includes(scheme) ? scheme : 'blue-red' });
      selectedHeatmapColorScheme = HEATMAP_COLOR_SCHEMES.includes(scheme) ? scheme : 'blue-red';
      const selector = document.getElementById('heatmapColorScheme');
      if (selector) selector.value = selectedHeatmapColorScheme;
      renderHeatmap();
    }

    function hideHeatmapActivityTooltip() {
      const tooltip = document.getElementById('heatmapActivityTooltip');
      if (tooltip) tooltip.classList.add('hidden');
      const controller = window.dashboardTooltips;
      if (!controller?.getState || controller.getState()?.context.tabId === 'heatmap') controller?.send?.({ type: 'leave' });
    }

    function showHeatmapActivityTooltip(segment, point, mapRect, pinned = false, target = null) {
      const tooltip = document.getElementById('heatmapActivityTooltip');
      if (!tooltip || !segment) return;
      const controller = window.dashboardTooltips;
      if (!pinned && controller?.getPinned?.('heatmap')) return;
      if (heatmapTooltipSegmentKey !== segment.key) {
        heatmapTooltipSegmentKey = segment.key;
        heatmapTooltipModel = window.heatmapUtils.buildActivityTooltipModel(
          segment.activityIds,
          heatmapActivitySummaryIndex,
          { segmentKey: segment.key }
        );
        const totalCount = heatmapTooltipModel.totalCount;
        const showTrackCount = Number.isFinite(totalCount) && totalCount > 10;
        const trackCountHeading = document.getElementById('heatmapActivityTooltipTrackCount');
        if (trackCountHeading) {
          trackCountHeading.textContent = showTrackCount ? `# of tracks: ${totalCount}` : '';
          trackCountHeading.classList.toggle('hidden', !showTrackCount);
        }
        const activityHeading = document.getElementById('heatmapActivityTooltipHeading');
        const showActivityHeading = showTrackCount && heatmapTooltipModel.sampled;
        if (activityHeading) {
          activityHeading.textContent = showActivityHeading ? heatmapTooltipModel.heading : '';
          activityHeading.classList.toggle('hidden', !showActivityHeading);
        }
        const availability = document.getElementById('heatmapActivityTooltipAvailability');
        availability.textContent = heatmapTooltipModel.availabilityNote || '';
        availability.classList.toggle('hidden', !heatmapTooltipModel.availabilityNote);
        const rows = document.getElementById('heatmapActivityTooltipRows');
        rows.replaceChildren();
        for (const activity of heatmapTooltipModel.activities) {
          const row = document.createElement('div');
          row.className = 'border-t border-slate-800 pt-1.5 text-[10px] leading-tight';
          const title = document.createElement('p');
          title.className = 'truncate font-medium text-white';
          title.textContent = activity.name;
          const details = document.createElement('p');
          details.className = 'mt-0.5 text-slate-300';
          details.textContent = `${activity.dateLabel} · ${activity.sport} · ${activity.distanceLabel} · ${activity.durationLabel}`;
          row.append(title, details);
          rows.appendChild(row);
        }
      }

      if (controller?.show && heatmapMapInstance?.containerPointToLatLng) {
        const model = heatmapTooltipModel;
        const itemLabel = String(segment.key);
        const geoPoint = heatmapMapInstance.containerPointToLatLng(point);
        const anchor = routeCanvasLayerInstance._projectInspectionAnchor({ kind: 'map-location', itemId: itemLabel, geoPoint: { lat: geoPoint.lat, lng: geoPoint.lng }, associationLabel: itemLabel });
        const showCount = Number.isFinite(model.totalCount) && model.totalCount > 10;
        const title = showCount ? `# of tracks: ${model.totalCount}` : model.activities[0]?.name || itemLabel;
        controller.show('heatmap', { selectionKey: `heatmap:${itemLabel}`, anchor, content: {
          title, itemLabel,
          sections: [
            ...(showCount && model.sampled ? [{ heading: model.heading, rows: [] }] : []),
            ...model.activities.map(activity => ({ heading: activity.name, rows: [{ label: '', value: `${activity.dateLabel} · ${activity.sport} · ${activity.distanceLabel} · ${activity.durationLabel}` }] }))
          ],
          footerLines: [], notes: model.availabilityNote ? [model.availabilityNote] : []
        } }, pinned, target);
        tooltip.classList.add('hidden');
        return;
      }

      tooltip.classList.remove('hidden');
      const margin = 8;
      const offset = 12;
      const tooltipRect = tooltip.getBoundingClientRect();
      const maxLeft = Math.max(margin, mapRect.width - tooltipRect.width - margin);
      const maxTop = Math.max(margin, mapRect.height - tooltipRect.height - margin);
      tooltip.style.left = `${Math.min(maxLeft, Math.max(margin, point[0] + offset))}px`;
      tooltip.style.top = `${Math.min(maxTop, Math.max(margin, point[1] + offset))}px`;
    }

    function renderHeatmapFrequencyLegend(scale) {
      const legend = document.getElementById('heatmapFrequencyLegend');
      if (!legend) return;

      const guide = window.heatmapUtils.buildFrequencyScaleGuide(scale, selectedHeatmapColorScheme);
      const range = document.getElementById('heatmapFrequencyRange');
      const gradient = document.getElementById('heatmapFrequencyGradient');
      const constant = document.getElementById('heatmapFrequencyConstant');
      const constantSwatch = document.getElementById('heatmapFrequencyConstantSwatch');
      const minLabel = document.getElementById('heatmapFrequencyMin');
      const midpointLabel = document.getElementById('heatmapFrequencyMidpoint');
      const maxLabel = document.getElementById('heatmapFrequencyMax');
      const constantValue = document.getElementById('heatmapFrequencyConstantValue');
      if (!guide.visible) {
        legend.classList.add('hidden');
        legend.setAttribute('aria-label', '');
        minLabel.textContent = '';
        midpointLabel.textContent = '';
        maxLabel.textContent = '';
        constantValue.textContent = '';
        return;
      }

      legend.classList.remove('hidden');
      legend.setAttribute('aria-label', guide.ariaLabel);
      if (guide.colors && gradient) {
        gradient.style.background = `linear-gradient(to right, ${guide.colors.low} 0%, ${guide.colors.midpoint} 50%, ${guide.colors.high} 100%)`;
      }
      if (guide.mode === 'constant') {
        range.classList.add('hidden');
        constant.classList.remove('hidden');
        constant.classList.add('flex');
        minLabel.textContent = '';
        midpointLabel.textContent = '';
        maxLabel.textContent = '';
        constantValue.textContent = `${guide.count} ${guide.count === 1 ? 'visit' : 'visits'}`;
        if (constantSwatch) constantSwatch.style.backgroundColor = guide.color;
        return;
      }

      constant.classList.add('hidden');
      constant.classList.remove('flex');
      range.classList.remove('hidden');
      constantValue.textContent = '';
      minLabel.textContent = guide.minCount;
      midpointLabel.textContent = `≈${guide.midpointCount}`;
      maxLabel.textContent = guide.maxCount;
    }

    let heatmapRenderRevision = 0;

    async function renderHeatmap() {
      const container = document.getElementById('heatmapMapContainer');
      const emptyState = document.getElementById('heatmapEmptyState');
      if (!container) return;
      syncHeatmapDisplayedData();
      const revision = ++heatmapRenderRevision;
      const token = captureDashboardRenderToken('heatmap', selectedHeatmapSportFilter);
      const dataset = importedDataset;
      const tracks = gpsTracksByActivityId;
      const isCurrent = () => revision === heatmapRenderRevision && dataset === importedDataset && tracks === gpsTracksByActivityId &&
        isDashboardRenderTokenCurrent(token, selectedHeatmapSportFilter);

      if (heatmapViewportDataset !== importedDataset) {
        heatmapViewportDataset = importedDataset;
        heatmapInitialFitPending = importedDataset !== null;
      }

      const hasData = window.heatmapUtils.hasGpsData(gpsTracksByActivityId);

      if (!hasData) {
        container.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        renderHeatmapFrequencyLegend(null);
        return;
      }

      const segments = window.heatmapUtils.buildRouteSegments(gpsTracksByActivityId, { sportFilter: selectedHeatmapSportFilter });
      const segmentList = Object.values(segments);

      if (segmentList.length === 0) {
        container.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        renderHeatmapFrequencyLegend(null);
        return;
      }

      const frequencyScale = window.heatmapUtils.computeRouteFrequencyScale(segmentList);

      container.classList.remove('hidden');
      if (emptyState) emptyState.classList.add('hidden');

      try {
        await ensureLeafletLoaded();
      } catch (err) {
        if (!isCurrent()) return;
        console.error('Could not load map library', err);
        container.classList.add('hidden');
        if (emptyState) {
          emptyState.textContent = 'Could not load the map library. Check your internet connection and try again.';
          emptyState.classList.remove('hidden');
        }
        renderHeatmapFrequencyLegend(null);
        return;
      }

      if (!isCurrent()) return;

      if (!heatmapMapInstance) {
        heatmapMapInstance = L.map(container);
        heatmapTileLayerInstance = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(heatmapMapInstance);
      }
      updateHeatmapTilePresentation();

      // A single canvas layer draws all segments directly (no per-segment Leaflet
      // objects), redrawing on moveend/zoomend for smooth pan/zoom at scale. Calling
      // setSegments() again (e.g. after a sport-filter change) replaces the drawn
      // routes so no stale routes from a previous filter remain (FR-006/SC-004 from
      // specs/001-route-line-heatmap).
      if (!routeCanvasLayerInstance) {
        const RouteCanvasLayer = ensureRouteCanvasLayerClass();
        routeCanvasLayerInstance = new RouteCanvasLayer({ lowZoomThresholdZoom: 10, minLengthPx: 1.5 });
        routeCanvasLayerInstance.addTo(heatmapMapInstance);
      }
      routeCanvasLayerInstance.setSegments(segments, frequencyScale, selectedHeatmapColorScheme);
      renderHeatmapFrequencyLegend(frequencyScale);

      const bounds = window.heatmapUtils.computeRouteSegmentBounds(segments);
      if (bounds && heatmapInitialFitPending) {
        heatmapMapInstance.fitBounds(bounds, { padding: [20, 20] });
        heatmapInitialFitPending = false;
      }

      // Leaflet needs a resize nudge after becoming visible inside a previously hidden tab panel
      setTimeout(() => { if (isCurrent()) heatmapMapInstance.invalidateSize({ pan: false }); }, 0);
    }

    // Synthetic demo route segments around cities with typical training activity, used only
    // for the landing-page preview card - mirrors the real map's route-line + frequency
    // styling (research.md Decision 4) instead of the old heat-blob preview.
    function buildDemoRouteSegments() {
      const segments = [];
      let segmentId = 0;

      const addRadialLines = (lat, lon, lineCount, spread, maxCount) => {
        for (let i = 0; i < lineCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const length = spread * (0.4 + Math.random() * 0.6);
          const endLat = lat + Math.sin(angle) * length;
          const endLon = lon + Math.cos(angle) * length;
          // First line per cluster is always a single visit, so the preview always shows
          // at least one clearly-thin-but-visible line alongside the busier ones.
          const count = i === 0 ? 1 : Math.max(1, Math.round(Math.random() * maxCount));
          segments.push({ key: `demo-${segmentId++}`, coords: [[lat, lon], [endLat, endLon]], count });
        }
      };

      addRadialLines(40.71, -74.00, 10, 2.2, 30); // New York
      addRadialLines(42.36, -71.06, 5, 1.6, 15);   // Boston
      addRadialLines(38.90, -77.03, 5, 1.6, 15);   // Washington DC
      addRadialLines(51.51, -0.13, 8, 1.0, 25);    // London
      addRadialLines(52.52, 13.41, 8, 1.0, 25);    // Berlin
      addRadialLines(40.42, -3.70, 12, 1.8, 40);   // Madrid - dense cluster

      // A single distant one-off activity (e.g. a marathon abroad), always a single visit -
      // this is what stays visible at world zoom per User Story 3 / SC-002.
      segments.push({ key: 'demo-distant-1', coords: [[35.68, 139.69], [35.66, 139.75]], count: 1 }); // Tokyo

      return segments;
    }

    async function renderHeatmapPreviewMap() {
      const container = document.getElementById('heatmapPreviewMap');
      if (!container) return;

      try {
        await ensureLeafletLoaded();
      } catch (err) {
        console.error('Could not load map library for heatmap preview', err);
        return;
      }

      const previewMap = L.map(container, {
        renderer: L.canvas({ padding: 0.5 }),
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
        zoomSnap: 0.1
      }).setView([42, -34], 2.1);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(previewMap);

      const demoSegments = buildDemoRouteSegments();
      const demoScale = window.heatmapUtils.computeRouteFrequencyScale(demoSegments);
      demoSegments.forEach(segment => {
        const style = window.heatmapUtils.computeRouteSegmentStyle(segment.count);
        L.polyline(segment.coords, {
          renderer: previewMap.options.renderer,
          color: window.heatmapUtils.computeRouteSegmentColor(segment.count, demoScale),
          weight: style.weight,
          opacity: style.opacity,
          lineCap: 'round'
        }).addTo(previewMap);
      });

      // Fit to the demo segments so the preview looks right at any card width (from single-column mobile to 5-column 2xl)
      const demoBounds = window.heatmapUtils.computeRouteSegmentBounds(demoSegments);
      const fitToDemoBounds = () => {
        previewMap.invalidateSize();
        if (demoBounds) previewMap.fitBounds(demoBounds, { padding: [16, 16] });
      };
      setTimeout(fitToDemoBounds, 0);
      window.addEventListener('resize', fitToDemoBounds);
    }

    async function captureAtExportSize(capture) {
      const container = document.getElementById('heatmapMapContainer');
      if (!container || !heatmapMapInstance || typeof capture !== 'function') {
        return typeof capture === 'function' ? capture() : null;
      }

      const originalStyle = {
        width: container.style.width,
        height: container.style.height,
        maxWidth: container.style.maxWidth
      };
      const center = heatmapMapInstance.getCenter();
      const zoom = heatmapMapInstance.getZoom();

      try {
        container.style.width = '960px';
        container.style.height = '500px';
        container.style.maxWidth = 'none';
        heatmapMapInstance.invalidateSize({ pan: false, animate: false });
        await new Promise(resolve => {
          let settled = false;
          let timeoutId = null;
          const finish = () => {
            if (settled) return;
            settled = true;
            if (timeoutId !== null) clearTimeout(timeoutId);
            if (heatmapTileLayerInstance && typeof heatmapTileLayerInstance.off === 'function') {
              heatmapTileLayerInstance.off('load', finish);
            }
            resolve();
          };
          if (heatmapTileLayerInstance && typeof heatmapTileLayerInstance.once === 'function') {
            heatmapTileLayerInstance.once('load', finish);
            if (!settled) timeoutId = setTimeout(finish, 1000);
          } else {
            finish();
          }
        });
        return await capture();
      } finally {
        container.style.width = originalStyle.width;
        container.style.height = originalStyle.height;
        container.style.maxWidth = originalStyle.maxWidth;
        heatmapMapInstance.invalidateSize({ pan: false, animate: false });
        heatmapMapInstance.setView(center, zoom, { animate: false });
      }
    }

    window.heatmapDashboard = { captureAtExportSize };
