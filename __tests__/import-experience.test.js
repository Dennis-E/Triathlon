const catalog = require('../src/import-experience-catalog');

describe('import experience message catalogue', () => {
  it('contains nineteen PNG-backed messages and no message without supplied PNG artwork', () => {
    expect(catalog.messages).toHaveLength(19);
    expect(catalog.messages.map(message => message.id)).toEqual(
      Array.from({ length: 19 }, (_, index) => `message-${String(index + 2).padStart(2, '0')}`)
    );
    catalog.messages.forEach((message, index) => {
      const imageNumber = String(index + 1).padStart(2, '0');
      expect(message.illustrationPath).toBe(`./assets/import-illustrations/${imageNumber}.png`);
      expect(message).not.toHaveProperty('fallbackIllustrationPath');
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
    const firstCycle = Array.from({ length: 18 }, () => catalog.getNextMessage(session));

    expect(firstCycle.every(Boolean)).toBe(true);
    expect(new Set(firstCycle.map(message => message.id)).size).toBe(18);
    expect(firstCycle.some(message => message.id === 'message-20')).toBe(false);
    expect(session.shownMessageIds.size).toBe(18);

    const nextMessage = catalog.getNextMessage(session);
    expect(nextMessage).not.toBeNull();
    expect(firstCycle.some(message => message.id === nextMessage.id)).toBe(true);
  });

  it('makes the final message eligible only in the explicit finalization phase', () => {
    const session = catalog.createSession({ phase: 'processing', random: () => 0 });
    const finalMessage = catalog.messages.find(message => message.id === 'message-20');
    expect(finalMessage.illustrationPath).toBe('./assets/import-illustrations/19.png');
    expect(finalMessage).not.toHaveProperty('fallbackIllustrationPath');
    expect(finalMessage.requiresPhase).toBe('finalizing');
    expect(catalog.getEligibleMessages(catalog.messages, session.phase)).toHaveLength(18);
    expect(catalog.getEligibleMessages(catalog.messages, 'finalizing')).toHaveLength(19);

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
      'personal-running-shoes', 'personal-longest-ride'
    ]));
    expect(entries.find(entry => entry.id === 'personal-cycling-distance').text).toContain('formatted-41.5');
    expect(entries.find(entry => entry.id === 'personal-longest-ride').text).toContain('formatted-41.5');
    expect(entries.every(entry => entry.kind === 'personal' && entry.illustrationPath)).toBe(true);
  });

  it('maps personal messages to the supplied artwork for their reused scene', () => {
    const statistics = {
      activityCount: 12,
      cyclingDistanceKm: 345,
      historyYearRange: { firstYear: 2018, lastYear: 2026 },
      runningShoeCount: 3,
      longestRideKm: 150,
      swimmingActivityCount: 8
    };
    const sceneNumbers = {
      'personal-activity-count': '10',
      'personal-cycling-distance': '07',
      'personal-history-span': '13',
      'personal-running-shoes': '05',
      'personal-longest-ride': '16'
    };
    const personalMessages = catalog.buildPersonalMessages(statistics);

    personalMessages.forEach(message => {
      const sceneNumber = Number(sceneNumbers[message.id]);
      const imageNumber = String(sceneNumber - 1).padStart(2, '0');
      expect(message.illustrationPath).toBe(`./assets/import-illustrations/${imageNumber}.png`);
      expect(message).not.toHaveProperty('fallbackIllustrationPath');
    });
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

  it('does not expose the removed local-processing reminder in import messages', () => {
    const session = catalog.createSession({ messages: [catalog.messages[0]], phase: 'processing', random: () => 0 });
    expect(session).not.toHaveProperty('privacyReminderDue');
    expect(catalog).not.toHaveProperty('privacyReminder');
    expect(catalog.messages.every(message => !message.text.includes('Still local'))).toBe(true);
  });
});
