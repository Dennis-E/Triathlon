const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dashboardImportSource = fs.readFileSync(
  path.join(__dirname, '../src/dashboard-import.js'),
  'utf8'
);
const importExperienceCatalog = require('../src/import-experience-catalog');

function loadRuntimeProcessData() {
  const context = {
    parseGermanDate(value) {
      const match = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4}),?\s*(\d{2}):(\d{2}):(\d{2})?$/);
      if (!match) return null;
      return new Date(
        Number(match[3]),
        Number(match[2]) - 1,
        Number(match[1]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6] || 0)
      );
    },
    getMonday(date) {
      return new Date(date.getTime());
    },
    window: {
      scatterUtils: {
        parseLocalizedNumber: value => Number(value)
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(`${dashboardImportSource}\nthis.__processData = processData;`, context, {
    filename: 'src/dashboard-import.js'
  });
  return context.__processData;
}

const processRuntimeData = loadRuntimeProcessData();
const headers = ['Activity Date', 'Activity Type', 'Activity Name', 'Moving Time', 'Distance', 'Distance'];

function loadRuntimeProgress() {
  const nodes = {
    importProgressBar: { style: {} },
    importProgressPercent: { textContent: '' },
    importProgressStage: { textContent: '' },
    importProgressDetail: { textContent: '', parentElement: { classList: { toggle() {} } } },
    importProgressError: { classList: { add() {}, remove() {} } },
    importProgressPreview: { classList: { add() {}, remove() {} } },
    importProgressMessage: { textContent: '' },
    importExperienceIllustration: { src: '', alt: '', setAttribute() {} },
    importPrivacyReminder: { textContent: '', classList: { add() {}, remove() {}, toggle() {} } },
    importProgressModal: {
      classList: { add() {}, remove() {} },
      querySelector() { return null; }
    }
  };
  const activeIntervals = new Set();
  const removedListeners = [];
  let nextInterval = 1;
  const context = {
    document: {
      hidden: false,
      getElementById: id => nodes[id] || null,
      addEventListener() {},
      removeEventListener: (event, handler) => removedListeners.push({ event, handler })
    },
    window: { importExperienceCatalog },
    setInterval: () => { const id = nextInterval++; activeIntervals.add(id); return id; },
    clearInterval: id => activeIntervals.delete(id),
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {}
  };
  vm.createContext(context);
  vm.runInContext(`${dashboardImportSource}\nthis.__updateProgress = updateImportProgress; this.__showModal = showImportProgressModal; this.__hideModal = hideImportProgressModal; this.__activeSession = () => importExperienceSession;`, context, {
    filename: 'src/dashboard-import.js'
  });
  return { updateProgress: context.__updateProgress, showModal: context.__showModal, hideModal: context.__hideModal, activeSession: context.__activeSession, nodes, activeIntervals, removedListeners };
}

function activityRow(name, duration, km, meters) {
  return ['19.07.2026, 14:52:02', 'Run', name, duration, km, meters];
}

describe('runtime dashboard-import metric availability', () => {
  it('marks positive and zero source values available without changing existing numeric fields', () => {
    const result = processRuntimeData([
      headers,
      activityRow('Positive values', '3600', '10', '10000'),
      activityRow('Recorded zeroes', '0', '0', '0')
    ]);

    expect(result.map(activity => activity.distance)).toEqual([10, 0]);
    expect(result.map(activity => activity.duration)).toEqual([3600, 0]);
    expect(result.map(activity => activity.distanceAvailable)).toEqual([true, true]);
    expect(result.map(activity => activity.durationAvailable)).toEqual([true, true]);
  });

  it('marks missing, invalid, and negative source values unavailable', () => {
    const result = processRuntimeData([
      headers,
      activityRow('Missing', '', '10', ''),
      activityRow('Invalid', 'not-a-number', '10', 'not-a-number'),
      activityRow('Negative', '-60', '10', '-1000')
    ]);

    expect(result.map(activity => activity.distanceAvailable)).toEqual([false, false, false]);
    expect(result.map(activity => activity.durationAvailable)).toEqual([false, false, false]);
    expect(result[0].distance).toBe(0);
    expect(result[0].duration).toBe(0);
    expect(result[2].distance).toBe(-1);
    expect(result[2].duration).toBe(-60);
  });

  it('marks a metric unavailable when its source column is absent', () => {
    const result = processRuntimeData([
      ['Activity Date', 'Activity Type', 'Activity Name'],
      ['19.07.2026, 14:52:02', 'Run', 'No optional metrics']
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].distanceAvailable).toBe(false);
    expect(result[0].durationAvailable).toBe(false);
    expect(result[0].distance).toBe(0);
    expect(result[0].duration).toBe(0);
  });
});

describe('runtime dashboard-import progress updates', () => {
  it('retains the last reported percentage when only the factual stage changes', () => {
    const runtime = loadRuntimeProgress();
    runtime.updateProgress(95, 'Extracting GPS tracks...');
    runtime.updateProgress(null, 'Processing data...');

    expect(runtime.nodes.importProgressBar.style.width).toBe('95%');
    expect(runtime.nodes.importProgressPercent.textContent).toBe('95%');
    expect(runtime.nodes.importProgressStage.textContent).toBe('Processing data...');
    expect(runtime.nodes.importProgressDetail.textContent).toBe('');
  });

  it('excludes percentage-only eligibility and keeps the final message phase-gated', () => {
    const session = importExperienceCatalog.createSession({ phase: 'processing', random: () => 0 });
    expect(session.orderedMessageIds).not.toContain('message-20');
    importExperienceCatalog.setPhase(session, 'finalizing');
    expect(session.orderedMessageIds).toContain('message-20');
    expect(dashboardImportSource).toContain("setPhase(importExperienceSession, 'finalizing')");
    expect(dashboardImportSource).not.toContain('updateImportProgress(5,');
    expect(dashboardImportSource).not.toContain('updateImportProgress(70,');
  });

  it('cleans up the previous timer and session on error, modal close, and restart', () => {
    const runtime = loadRuntimeProgress();
    runtime.showModal();
    const firstSession = runtime.activeSession();
    expect(runtime.activeIntervals.size).toBe(1);

    runtime.updateProgress(null, 'Import failed', true);
    expect(runtime.activeIntervals.size).toBe(0);
    expect(firstSession.active).toBe(false);

    runtime.showModal();
    const secondSession = runtime.activeSession();
    expect(secondSession).not.toBe(firstSession);
    expect(runtime.activeIntervals.size).toBe(1);

    runtime.hideModal();
    expect(runtime.activeIntervals.size).toBe(0);
    expect(secondSession.active).toBe(false);
    expect(runtime.removedListeners.map(item => item.event)).toEqual(['visibilitychange', 'visibilitychange']);
  });
});
