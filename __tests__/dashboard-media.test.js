const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mediaUtils = require('../src/media-utils');

const dashboardMediaSource = fs.readFileSync(path.join(__dirname, '../src/dashboard-media.js'), 'utf8');

function loadDashboardMedia() {
  const nodes = {
    mediaGalleryGrid: { innerHTML: '' },
    mediaGalleryStatus: { textContent: '' },
    mediaGalleryYearFilter: { value: 'all', innerHTML: '' },
    mediaGallerySportFilter: { value: 'all', innerHTML: '' },
    mediaGalleryActivityFilter: { value: 'all', innerHTML: '' },
    mediaGalleryLoadMore: {
      classList: { contains: name => this.hidden === name, toggle(name, hidden) { this.hidden = hidden ? name : null; } },
      onclick: null
    },
    mediaGalleryPreview: { classList: { add() {}, remove() {} } },
    mediaGalleryPreviewContent: {
      children: [],
      replaceChildren: jest.fn(function (...children) { this.children = children; }),
      appendChild(child) { this.children.push(child); }
    },
    mediaGalleryPreviewClose: { onclick: null },
    mediaGalleryCreateRecap: { onclick: null },
    mediaGalleryCreateCollage: { onclick: null },
    mediaGalleryIncludeRoutes: { checked: false },
    mediaGalleryExportArea: {
      innerHTML: '',
      get childElementCount() { return this.innerHTML ? 1 : 0; }
    }
  };
  const createdElements = [];
  const document = {
    getElementById: id => nodes[id] || null,
    createElement: tagName => {
      const element = {
        tagName, className: '', src: '', controls: false, preload: '', alt: '', textContent: '', children: [],
        setAttribute(name, value) { this[name] = value; },
        appendChild(child) { this.children.push(child); },
        append(...children) { this.children.push(...children); }
      };
      createdElements.push(element);
      return element;
    }
  };
  const context = { document, window: { mediaUtils, openDashboardTab: jest.fn(), exportVisualizationTab: jest.fn() } };
  vm.createContext(context);
  vm.runInContext(`${dashboardMediaSource}\nthis.__renderMediaGallery = renderMediaGallery;`, context, {
    filename: 'src/dashboard-media.js'
  });
  return { render: context.__renderMediaGallery, nodes, createdElements, window: context.window };
}

describe('dashboard media gallery', () => {
  it('renders readable media and an explicit unassigned status', () => {
    const runtime = loadDashboardMedia();

    runtime.render({
      hasReadableMedia: true,
      assets: [{ key: 'photo-1.jpg', filename: 'photo-1.jpg', mediaType: 'photo', caption: 'Synthetic', status: 'readable', activityIds: [] }]
    });

    expect(runtime.nodes.mediaGalleryGrid.innerHTML).toContain('photo-1.jpg');
    expect(runtime.nodes.mediaGalleryGrid.innerHTML).toContain('Unassigned');
  });

  it('renders a readable unreferenced archive file without assigning an activity', () => {
    const runtime = loadDashboardMedia();

    runtime.render({
      hasReadableMedia: true,
      assets: [{ key: 'unlisted.jpg', filename: 'unlisted.jpg', mediaType: 'photo', status: 'unreferenced', activityIds: [] }]
    });

    expect(runtime.nodes.mediaGalleryGrid.innerHTML).toContain('data-media-key="unlisted.jpg"');
    expect(runtime.nodes.mediaGalleryGrid.innerHTML).toContain('Unassigned');
    expect(runtime.nodes.mediaGalleryGrid.innerHTML).toContain('Unlisted');
  });

  it('summarizes all reconciled reference outcomes without exposing reference tokens', () => {
    const runtime = loadDashboardMedia();
    runtime.render({
      hasReadableMedia: true,
      counts: { references: 2433, matchedReferences: 1456, missingReferences: 977, ambiguousReferences: 0, unreferenced: 3 },
      assets: [{ key: 'photo.jpg', filename: 'photo.jpg', mediaType: 'photo', status: 'readable', activityIds: [] }]
    });

    expect(runtime.nodes.mediaGalleryStatus.textContent).toContain('1456 references matched');
    expect(runtime.nodes.mediaGalleryStatus.textContent).toContain('977 references missing');
    expect(runtime.nodes.mediaGalleryStatus.textContent).not.toContain('photo.jpg');
  });

  it('shows a clear no-media state when nothing is readable', () => {
    const runtime = loadDashboardMedia();

    runtime.render({ hasReadableMedia: false, assets: [] });

    expect(runtime.nodes.mediaGalleryStatus.textContent).toMatch(/no readable media/i);
    expect(runtime.nodes.mediaGalleryGrid.innerHTML).toBe('');
  });

  it('filters by year, sport, and activity using accessible native controls', () => {
    const runtime = loadDashboardMedia();
    const library = {
      hasReadableMedia: true,
      activityOptions: [{ id: 'run-1', name: 'Morning Run' }],
      assets: [
        { key: 'run-photo.jpg', filename: 'run-photo.jpg', caption: 'Run', mediaType: 'photo', status: 'readable', date: new Date('2025-03-01T08:00:00Z'), sport: 'Run', activityIds: ['run-1'] },
        { key: 'bike-photo.jpg', filename: 'bike-photo.jpg', caption: 'Bike', mediaType: 'photo', status: 'readable', date: new Date('2024-06-01T08:00:00Z'), sport: 'Bike', activityIds: ['bike-1'] }
      ]
    };

    runtime.render(library);
    expect(runtime.nodes.mediaGalleryActivityFilter.innerHTML).toContain('Morning Run');
    expect(runtime.nodes.mediaGalleryYearFilter.innerHTML).toContain('2025');

    runtime.nodes.mediaGalleryYearFilter.value = '2025';
    runtime.nodes.mediaGallerySportFilter.value = 'Run';
    runtime.nodes.mediaGalleryActivityFilter.value = 'run-1';
    runtime.nodes.mediaGalleryYearFilter.onchange();

    expect(runtime.nodes.mediaGalleryGrid.innerHTML).toContain('run-photo.jpg');
    expect(runtime.nodes.mediaGalleryGrid.innerHTML).not.toContain('bike-photo.jpg');
    expect(runtime.nodes.mediaGalleryGrid.innerHTML).toContain('aria-label="Open Run"');
  });

  it('renders a bounded page and loads more items on request', () => {
    const runtime = loadDashboardMedia();
    const assets = Array.from({ length: 60 }, (_, index) => ({
      key: `photo-${index}.jpg`, filename: `photo-${index}.jpg`, mediaType: 'photo',
      status: 'readable', activityIds: [], date: new Date('2025-01-01T00:00:00Z')
    }));

    runtime.render({ hasReadableMedia: true, assets });

    expect((runtime.nodes.mediaGalleryGrid.innerHTML.match(/data-media-key=/g) || [])).toHaveLength(48);
    runtime.nodes.mediaGalleryLoadMore.onclick();
    expect((runtime.nodes.mediaGalleryGrid.innerHTML.match(/data-media-key=/g) || [])).toHaveLength(60);
  });

  it('keeps the initial render bounded for 1000 media entries', () => {
    const runtime = loadDashboardMedia();
    const assets = Array.from({ length: 1000 }, (_, index) => ({
      key: `media-${index}.jpg`, filename: `media-${index}.jpg`, mediaType: 'photo',
      status: 'readable', activityIds: [], date: new Date(2024 + index % 3, index % 12, 1)
    }));
    const startedAt = performance.now();

    runtime.render({ hasReadableMedia: true, assets });

    const elapsed = performance.now() - startedAt;
    expect((runtime.nodes.mediaGalleryGrid.innerHTML.match(/data-media-key=/g) || [])).toHaveLength(48);
    expect(elapsed).toBeLessThan(2000);
  });

  it('loads a selected video only after a click and never enables autoplay', async () => {
    const runtime = loadDashboardMedia();
    const video = { key: 'run-video.mp4', filename: 'run-video.mp4', mediaType: 'video', caption: 'Finish', status: 'readable', activityIds: [] };
    const library = { hasReadableMedia: true, assets: [video], getObjectUrl: jest.fn().mockResolvedValue('blob:local-video') };
    runtime.render(library);

    await runtime.nodes.mediaGalleryGrid.onclick({
      target: { closest: () => ({ dataset: { mediaKey: video.key }, disabled: false }) }
    });

    const renderedVideo = runtime.nodes.mediaGalleryPreviewContent.replaceChildren.mock.calls[0][0];
    expect(renderedVideo).toMatchObject({ tagName: 'video', src: 'blob:local-video', controls: true, preload: 'metadata' });
    expect(renderedVideo.autoplay).not.toBe(true);
  });

  it('shows linked activity details and opens its route only when available', async () => {
    const runtime = loadDashboardMedia();
    const photo = { key: 'run-photo.jpg', filename: 'run-photo.jpg', mediaType: 'photo', caption: 'Finish', status: 'readable', activityIds: ['run-1'] };
    const library = {
      hasReadableMedia: true,
      assets: [photo],
      activityOptions: [{ id: 'run-1', name: 'Morning Run', sport: 'Run', date: '2025-03-01', hasRoute: true }],
      getObjectUrl: jest.fn().mockResolvedValue('blob:local-photo')
    };
    runtime.render(library);

    await runtime.nodes.mediaGalleryGrid.onclick({
      target: { closest: () => ({ dataset: { mediaKey: photo.key }, disabled: false }) }
    });

    const activityDetails = runtime.createdElements.find(element => element.textContent.includes('Morning Run'));
    const routeButton = runtime.createdElements.find(element => element.textContent === 'View route');
    expect(activityDetails).toBeDefined();
    expect(routeButton).toMatchObject({ type: 'button', 'aria-label': 'View route for Morning Run' });
    routeButton.onclick();
    expect(runtime.window.openDashboardTab).toHaveBeenCalledWith('heatmap');
  });

  it('shows an empty result state after filters exclude every item', () => {
    const runtime = loadDashboardMedia();
    runtime.render({
      hasReadableMedia: true,
      assets: [{ key: 'run.jpg', filename: 'run.jpg', status: 'readable', mediaType: 'photo', date: new Date('2025-01-01'), activityIds: [] }]
    });

    runtime.nodes.mediaGalleryYearFilter.value = '2024';
    runtime.nodes.mediaGalleryYearFilter.onchange();

    expect(runtime.nodes.mediaGalleryStatus.textContent).toMatch(/no media match/i);
  });

  it('builds local recaps and collages with route content excluded until explicit opt-in', async () => {
    const runtime = loadDashboardMedia();
    const library = {
      hasReadableMedia: true,
      assets: [{ key: 'run-photo.jpg', filename: 'run-photo.jpg', caption: 'Finish', mediaType: 'photo', status: 'readable', date: new Date('2025-03-01'), sport: 'Run', activityIds: ['run-1'] }],
      activityOptions: [{ id: 'run-1', name: 'Morning Run', sport: 'Run', date: '2025-03-01', hasRoute: true }],
      gpsTracksByActivityId: { 'run-1': { points: [[48, 11], [48.01, 11.02]] } },
      getObjectUrl: jest.fn().mockResolvedValue('blob:local-photo')
    };
    runtime.render(library);

    await runtime.nodes.mediaGalleryCreateCollage.onclick();
    expect(runtime.nodes.mediaGalleryExportArea.innerHTML).toContain('blob:local-photo');
    expect(runtime.nodes.mediaGalleryExportArea.innerHTML).not.toContain('<svg');
    expect(runtime.window.exportVisualizationTab).toHaveBeenCalledWith('mediaGallery');

    runtime.nodes.mediaGalleryIncludeRoutes.checked = true;
    await runtime.nodes.mediaGalleryCreateCollage.onclick();
    expect(runtime.nodes.mediaGalleryExportArea.innerHTML).toContain('<svg');

    runtime.nodes.mediaGalleryYearFilter.value = '2025';
    runtime.nodes.mediaGalleryYearFilter.onchange();
    await runtime.nodes.mediaGalleryCreateRecap.onclick();
    expect(runtime.nodes.mediaGalleryExportArea.innerHTML).toContain('2025');
  });

  it('reports loading and failed preview states without blocking the gallery', async () => {
    const runtime = loadDashboardMedia();
    const asset = { key: 'broken.jpg', filename: 'broken.jpg', status: 'readable', mediaType: 'photo', activityIds: [] };
    const library = { hasReadableMedia: true, assets: [asset], getObjectUrl: jest.fn().mockRejectedValue(new Error('corrupt')) };
    runtime.render(library);

    const pending = runtime.nodes.mediaGalleryGrid.onclick({
      target: { closest: () => ({ dataset: { mediaKey: asset.key }, disabled: false }) }
    });
    expect(runtime.nodes.mediaGalleryStatus.textContent).toBe('Loading media preview...');
    await pending;

    expect(asset.status).toBe('corrupt');
    expect(library.hasReadableMedia).toBe(false);
    expect(runtime.nodes.mediaGalleryStatus.textContent).toMatch(/could not be read/i);
  });
});