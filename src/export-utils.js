// Pure, DOM-free helpers for the Instagram-ready visualization export feature.
// See specs/007-instagram-export-button for the feature spec/plan/tasks.

const TAB_DISPLAY_TITLES = {
  totalDistance: 'Total distance',
  heartratePace: 'Heartrate vs Pace',
  equipment: 'Equipment mileage',
  equipmentTimeline: 'Equipment Timeline',
  personalBests: 'Personal Bests',
  heatmap: 'GPS Heatmap'
};

const TAB_FILENAME_SLUGS = {
  totalDistance: 'total-distance',
  heartratePace: 'heart-rate-pace',
  equipment: 'equipment',
  equipmentTimeline: 'equipment-timeline',
  personalBests: 'personal-bests',
  heatmap: 'heatmap'
};

// "Contain"/letterbox fit: scales the source to fully fit inside a
// targetSize x targetSize square, centered, without cropping or distortion.
function computeSquareFit(sourceWidth, sourceHeight, targetSize) {
  if (!(sourceWidth > 0) || !(sourceHeight > 0) || !(targetSize > 0)) {
    return { drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 };
  }

  const scale = Math.min(targetSize / sourceWidth, targetSize / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = (targetSize - drawWidth) / 2;
  const offsetY = (targetSize - drawHeight) / 2;

  return { drawWidth, drawHeight, offsetX, offsetY };
}

// Human-readable title for a tab, reusing the same labels shown on the tab buttons.
function getTabDisplayTitle(tabName) {
  return TAB_DISPLAY_TITLES[tabName] || null;
}

function pad(value, length) {
  return String(value).padStart(length, '0');
}

// trianalytica-<tab-slug>-<yyyyMMdd-HHmmss>.png
function generateExportFilename(tabName, date) {
  const slug = TAB_FILENAME_SLUGS[tabName];
  if (!slug || !(date instanceof Date) || isNaN(date.getTime())) return null;

  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}`;
  const timePart = `${pad(date.getHours(), 2)}${pad(date.getMinutes(), 2)}${pad(date.getSeconds(), 2)}`;

  return `trianalytica-${slug}-${datePart}-${timePart}.png`;
}

// Pure "has data to export" check: delegates to each tab's own empty-state signal,
// passed in as a flags object (e.g. { heatmap: false } when heatmapEmptyState is visible).
function hasExportableContent(tabName, flags) {
  if (!flags || typeof flags[tabName] !== 'boolean') return false;
  return flags[tabName];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computeSquareFit,
    getTabDisplayTitle,
    generateExportFilename,
    hasExportableContent
  };
}

if (typeof window !== 'undefined') {
  window.exportUtils = {
    computeSquareFit,
    getTabDisplayTitle,
    generateExportFilename,
    hasExportableContent
  };
}
