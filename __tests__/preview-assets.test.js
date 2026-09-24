const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PREVIEW_DIR = path.join(ROOT, 'assets', 'previews');
const PREVIEWS = [
  ['totalDistance', 'total-distance.png'],
  ['heartratePace', 'heartrate-pace.png'],
  ['equipment', 'equipment.png'],
  ['equipmentTimeline', 'equipment-timeline.png'],
  ['personalBests', 'personal-bests.png'],
  ['heatmap', 'heatmap.png'],
  ['distributions', 'distributions.png'],
  ['workoutTime', 'workout-time.png']
];

function readIndex() {
  return fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
}

describe('landing visualization previews', () => {
  let html;

  beforeAll(() => {
    html = readIndex();
  });

  it('covers every dashboard visualization with one preview card and asset', () => {
    PREVIEWS.forEach(([visualizationKey, assetName]) => {
      expect(html).toContain(`openDashboardTab('${visualizationKey}')`);
      expect(html).toContain(`assets/previews/${assetName}`);
    });
    expect((html.match(/id="previewCard-/g) || []).length).toBe(PREVIEWS.length);
    expect(html).toContain('Workout Time');
    expect(html).toContain('Distributions');
  });

  it('preserves import-required guidance for data-dependent preview actions', () => {
    expect(html).toContain('id="previewGateModal"');
    expect(html).toContain('Import Strava Data First');
    expect(html).toContain('These dashboards become interactive after you import your Strava export.');
  });

  it('does not reference private source data from landing-page runtime markup', () => {
    expect(html).not.toMatch(/private-data[\\/]export_39173135\.zip/i);
    expect(html).not.toMatch(/(?:href|src)="[^"]*\.(?:csv|gpx|fit|zip)"/i);
  });

  it('has all approved preview assets in the expected readable image format', () => {
    PREVIEWS.forEach(([, assetName]) => {
      const assetPath = path.join(PREVIEW_DIR, assetName);
      expect(fs.existsSync(assetPath)).toBe(true);
      expect(fs.statSync(assetPath).size).toBeGreaterThan(100);
      expect(fs.readFileSync(assetPath).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    });
  });

  it('keeps the preview grid responsive and labels accessible', () => {
    expect(html).toMatch(/id="previewCardsContainer"[^>]*class="[^"]*grid-cols-1[^"]*md:grid-cols-2/);
    expect((html.match(/class="[^"]*preview-card-image[^"]*"/g) || []).length).toBe(PREVIEWS.length);
    expect(html).toMatch(/alt="Workout Time visualization preview"/);
    expect(html).toMatch(/alt="Distributions visualization preview"/);
  });

  it('documents the requested corrected capture states', () => {
    const captureStates = fs.readFileSync(
      path.join(ROOT, 'specs', '034-refine-visualization-previews', 'capture-states.md'),
      'utf8'
    );
    expect(captureStates).toContain('Run; focused 2021-2026 range');
    expect(captureStates).toContain('Bikes only');
    expect(captureStates).toContain('Activities mode');
    expect(captureStates).toContain('50 km PB tile/detail');
    expect(captureStates).toContain('Rheinland-area view');
    expect(captureStates).toContain('X-axis labels and units visible');
  });

  it('keeps corrected public markup independent of private source files', () => {
    expect(html).not.toMatch(/private-data[\\/]export_39173135\.zip/i);
    expect(html).not.toMatch(/(?:src|href)="[^"]*\.(?:csv|gpx|fit|zip)"/i);
  });
});