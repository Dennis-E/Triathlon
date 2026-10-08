const catalog = require('../src/import-experience-catalog');

describe('import experience message catalogue', () => {
  it('contains twenty stable messages with a one-to-one local illustration mapping', () => {
    expect(catalog.messages).toHaveLength(20);
    expect(catalog.messages.map(message => message.id)).toEqual(
      Array.from({ length: 20 }, (_, index) => `message-${String(index + 1).padStart(2, '0')}`)
    );
    catalog.messages.forEach(message => {
      expect(message.illustrationPath).toBe(`./assets/import-illustrations/${message.id}.svg`);
      expect(message.text).toEqual(expect.any(String));
      expect(message.visualDescription).toEqual(expect.any(String));
    });
  });

  it('shuffles a copy deterministically without mutating the source list', () => {
    const values = ['a', 'b', 'c', 'd'];
    const shuffled = catalog.shuffleWithoutReplacement(values, () => 0);

    expect(shuffled).toEqual(['b', 'c', 'd', 'a']);
    expect(values).toEqual(['a', 'b', 'c', 'd']);
    expect(new Set(shuffled).size).toBe(values.length);
  });

  it('does not repeat eligible messages before completing a session cycle', () => {
    const session = catalog.createSession({ phase: 'processing', random: () => 0 });
    const firstCycle = Array.from({ length: 19 }, () => catalog.getNextMessage(session));

    expect(firstCycle.every(Boolean)).toBe(true);
    expect(new Set(firstCycle.map(message => message.id)).size).toBe(19);
    expect(firstCycle.some(message => message.id === 'message-20')).toBe(false);
    expect(session.shownMessageIds.size).toBe(19);

    const nextMessage = catalog.getNextMessage(session);
    expect(nextMessage).not.toBeNull();
    expect(firstCycle.some(message => message.id === nextMessage.id)).toBe(true);
  });

  it('makes the final message eligible only in the explicit finalization phase', () => {
    const session = catalog.createSession({ phase: 'processing', random: () => 0 });
    expect(catalog.getEligibleMessages(catalog.messages, session.phase)).toHaveLength(19);
    expect(catalog.getEligibleMessages(catalog.messages, 'finalizing')).toHaveLength(20);

    catalog.setPhase(session, 'finalizing');
    expect(session.orderedMessageIds).toContain('message-20');
    expect(session.orderedMessageIds[0]).toBe('message-20');
  });

  it('derives only reliable personalized metrics from the completed activity array', () => {
    const activities = [
      { sport: 'Run', date: new Date(2014, 5, 1), distance: 5, distanceAvailable: true, equipment: 'Nike Pegasus' },
      { sport: 'Run', date: new Date(2018, 5, 1), distance: 7, distanceAvailable: true, equipment: ' nike pegasus ' },
      { sport: 'Run', date: new Date(2020, 5, 1), distance: 8, distanceAvailable: true, equipment: 'Other Runner' },
      { sport: 'Bike', date: new Date(2022, 5, 1), distance: 214, distanceAvailable: true, equipment: 'Trek' },
      { sport: 'Bike', date: new Date(2023, 5, 1), distance: 40, distanceAvailable: true, equipment: 'Trek' },
      { sport: 'Swim', date: new Date(2026, 5, 1), distance: 1.9, distanceAvailable: true, equipment: '' },
      { sport: null, date: new Date(2025, 5, 1), distance: 0, distanceAvailable: false, equipment: '' }
    ];

    expect(catalog.getPersonalStatistics(activities)).toEqual({
      activityCount: 7,
      cyclingDistanceKm: 254,
      historyYearRange: { firstYear: 2014, lastYear: 2026 },
      runningShoeCount: 2,
      longestRideKm: 214,
      swimmingActivityCount: 1
    });
    const accumulator = catalog.createStatisticsAccumulator();
    activities.forEach(activity => catalog.accumulateActivityStatistics(accumulator, activity));
    expect(catalog.finalizeStatistics(accumulator)).toEqual(catalog.getPersonalStatistics(activities));
  });

  it('omits cycling totals if any Bike distance is unavailable and omits absent sports/equipment', () => {
    const activities = [
      { sport: 'Bike', date: new Date(2024, 0, 1), distance: 30, distanceAvailable: true, equipment: '' },
      { sport: 'Bike', date: new Date(2025, 0, 1), distance: 0, distanceAvailable: false, equipment: '' },
      { sport: 'Run', date: new Date(2023, 0, 1), distance: 5, distanceAvailable: true, equipment: 'none' }
    ];
    const stats = catalog.getPersonalStatistics(activities);

    expect(stats.cyclingDistanceKm).toBeNull();
    expect(stats.longestRideKm).toBeNull();
    expect(stats.swimmingActivityCount).toBeNull();
    expect(stats.runningShoeCount).toBeNull();
    expect(catalog.getPersonalStatistics([])).toEqual({
      activityCount: null,
      cyclingDistanceKm: null,
      historyYearRange: null,
      runningShoeCount: null,
      longestRideKm: null,
      swimmingActivityCount: null
    });
  });

  it('creates personal messages only for available real values and uses supplied app formatting', () => {
    const activities = [
      { sport: 'Bike', date: new Date(2020, 0, 1), distance: 41.5, distanceAvailable: true },
      { sport: 'Swim', date: new Date(2022, 0, 1), distance: 1, distanceAvailable: true },
      { sport: 'Run', date: new Date(2021, 0, 1), distance: 5, distanceAvailable: true, equipment: 'Shoe A' }
    ];
    const entries = catalog.buildPersonalMessages(activities, value => `formatted-${value}`);

    expect(entries.map(entry => entry.id)).toEqual(expect.arrayContaining([
      'personal-activity-count', 'personal-cycling-distance', 'personal-history-span',
      'personal-running-shoes', 'personal-longest-ride', 'personal-swim-count'
    ]));
    expect(entries.find(entry => entry.id === 'personal-cycling-distance').text).toContain('formatted-41.5');
    expect(entries.find(entry => entry.id === 'personal-longest-ride').text).toContain('formatted-41.5');
    expect(entries.every(entry => entry.kind === 'personal' && entry.illustrationPath)).toBe(true);
  });

  it('adds newly available personal candidates once without restarting or repeating the active cycle', () => {
    const session = catalog.createSession({ messages: [catalog.messages[0]], phase: 'processing', random: () => 0 });
    const shown = catalog.getNextMessage(session);
    const personal = { id: 'personal-activity-count', kind: 'personal', text: 'A real total.', illustrationPath: './assets/import-illustrations/message-10.svg' };

    catalog.addCandidates(session, [personal]);
    catalog.addCandidates(session, [personal]);

    expect(session.currentMessageId).toBe(shown.id);
    expect(session.shownMessageIds.has(personal.id)).toBe(false);
    expect(session.orderedMessageIds.filter(id => id === personal.id)).toHaveLength(1);
    expect(catalog.getNextMessage(session).id).toBe(personal.id);
  });

  it('makes the privacy reminder due after four humorous entries, including personal messages', () => {
    const session = catalog.createSession({ messages: [catalog.messages[0]], phase: 'processing', random: () => 0 });
    catalog.getNextMessage(session);
    catalog.addCandidates(session, [
      { id: 'personal-one', kind: 'personal', text: 'A real value.', illustrationPath: './assets/import-illustrations/message-10.svg' },
      { id: 'personal-two', kind: 'personal', text: 'Another real value.', illustrationPath: './assets/import-illustrations/message-10.svg' },
      { id: 'personal-three', kind: 'personal', text: 'A third real value.', illustrationPath: './assets/import-illustrations/message-10.svg' }
    ]);

    catalog.getNextMessage(session);
    catalog.getNextMessage(session);
    expect(session.privacyReminderDue).toBe(false);
    catalog.getNextMessage(session);

    expect(session.privacyReminderDue).toBe(true);
    expect(catalog.privacyReminder).toMatch(/processed in your browser/i);
    expect(catalog.privacyReminder).toMatch(/not uploaded to TriAnalytica servers/i);
    expect(catalog.privacyReminder).not.toMatch(/no network requests/i);
  });
});
