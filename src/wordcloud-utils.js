(function attachWordcloudUtils(root) {
  const STOP_WORDS = new Set((
    'a an and are as at be been but by das dass dem den der des die dies dieser dieses du ein eine einem einen einer eines er es ' +
    'for from für hat have he her hier him his ich im in is it its me mit nach nicht of on or she sie sich so the their them then ' +
    'there they this to und uns von was we were what when where which who will with would you your zu zum zur'
  ).split(/\s+/u));

  function getActivityTitle(activity) {
    if (typeof activity === 'string') return activity;
    if (!activity || typeof activity !== 'object') return '';
    const value = activity.name !== undefined ? activity.name : activity.title;
    return typeof value === 'string' ? value : '';
  }

  function getWordFrequencies(activities = []) {
    if (!Array.isArray(activities) || activities.length === 0) return [];

    const counts = new Map();
    activities.forEach(activity => {
      const title = getActivityTitle(activity).trim();
      if (!title || /^activity$/iu.test(title)) return;

      const normalized = title.normalize('NFKC').toLocaleLowerCase();
      const tokens = normalized.match(/[\p{L}\p{M}]+/gu) || [];
      tokens.forEach(token => {
        if (STOP_WORDS.has(token)) return;
        const letterCount = Array.from(token).filter(character => /\p{L}/u.test(character)).length;
        if (letterCount < 2) return;
        counts.set(token, (counts.get(token) || 0) + 1);
      });
    });

    return Array.from(counts, ([word, count]) => ({ word, count }))
      .sort((first, second) => second.count - first.count || first.word.localeCompare(second.word, 'de'))
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  function getTopWords(rankedWords = [], limit = 50) {
    const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 50;
    return Array.isArray(rankedWords) ? rankedWords.slice(0, safeLimit) : [];
  }

  function reconcileWordSelection(rankedWords = [], previousSelection = new Map()) {
    const previous = previousSelection instanceof Map
      ? previousSelection
      : new Map(Object.entries(previousSelection || {}));
    const next = new Map();
    getTopWords(rankedWords, rankedWords.length).forEach(entry => {
      next.set(entry.word, previous.has(entry.word) ? Boolean(previous.get(entry.word)) : true);
    });
    return next;
  }

  const api = { getWordFrequencies, getTopWords, reconcileWordSelection };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.wordcloudUtils = api;
})(typeof window !== 'undefined' ? window : null);
