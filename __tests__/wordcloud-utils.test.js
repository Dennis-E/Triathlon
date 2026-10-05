const { performance } = require('perf_hooks');
const { getWordFrequencies, getTopWords, reconcileWordSelection } = require('../src/wordcloud-utils');

describe('wordcloud title-word frequency utility', () => {
  it('ignores missing, blank, and generic fallback activity titles', () => {
    expect(getWordFrequencies([
      { name: '' },
      { name: '   ' },
      { name: 'Activity' },
      { name: ' activity ' },
      { name: null }
    ])).toEqual([]);
  });

  it('normalizes case, splits punctuation, preserves German letters, and counts every occurrence', () => {
    const words = getWordFrequencies([
      { name: 'Tempo/tempo-run! ÄRGER Ärger ß' }
    ]);

    expect(words).toEqual([
      { word: 'ärger', count: 2, rank: 1 },
      { word: 'tempo', count: 2, rank: 2 },
      { word: 'run', count: 1, rank: 3 },
    ]);
  });

  it('excludes all one-letter Unicode tokens, including combining marks and supplementary letters', () => {
    const words = getWordFrequencies([{ name: 'a Ä ß 𐐀 e\u0301 ab él' }]);
    expect(words.map(entry => entry.word)).toEqual(['ab', 'él']);
  });

  it('excludes the agreed common German and English function words', () => {
    const words = getWordFrequencies([
      { name: 'The run and der Lauf mit tempo' }
    ]);

    expect(words.map(entry => entry.word)).toEqual(['lauf', 'run', 'tempo']);
  });

  it('excludes numeric-only and punctuation-only tokens', () => {
    const words = getWordFrequencies([{ name: 'Run 123 45.6 !!! bike' }]);
    expect(words.map(entry => entry.word)).toEqual(['bike', 'run']);
  });

  it('ranks by total count and breaks frequency ties alphabetically', () => {
    expect(getWordFrequencies([
      { name: 'zeta alpha beta alpha' },
      { name: 'zeta beta' }
    ])).toEqual([
      { word: 'alpha', count: 2, rank: 1 },
      { word: 'beta', count: 2, rank: 2 },
      { word: 'zeta', count: 2, rank: 3 }
    ]);
  });

  it('limits the ranked view and reconciles checkbox choices as the limit changes', () => {
    const ranked = getWordFrequencies([
      { name: 'run bike swim' },
      { name: 'run bike tempo' }
    ]);
    const firstTop = getTopWords(ranked, 2);
    const initial = reconcileWordSelection(firstTop);
    expect([...initial.entries()]).toEqual([['bike', true], ['run', true]]);

    initial.set('run', false);
    const expanded = reconcileWordSelection(getTopWords(ranked, 4), initial);
    expect([...expanded.entries()]).toEqual([
      ['bike', true], ['run', false], ['swim', true], ['tempo', true]
    ]);

    const reduced = reconcileWordSelection(getTopWords(ranked, 1), expanded);
    expect([...reduced.entries()]).toEqual([['bike', true]]);
    const reintroduced = reconcileWordSelection(getTopWords(ranked, 4), reduced);
    expect(reintroduced.get('run')).toBe(true);
  });

  it('ranks 5,000 generated activity titles in under one second', () => {
    const titles = Array.from({ length: 5000 }, (_, index) => ({
      name: `Run tempo ${index % 7} interval ${index % 11}`
    }));
    getWordFrequencies(titles); // Warm up the runtime before measuring.

    const startedAt = performance.now();
    const ranked = getWordFrequencies(titles);
    const elapsedMs = performance.now() - startedAt;

    expect(ranked.length).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(1000);
  });
});
