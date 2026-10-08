(function exposeImportExperienceCatalog(root) {
  'use strict';

  const messages = [
    { id: 'message-01', text: 'Your training data has entered T1. This may take a moment.', visualDescription: 'A swimmer enters transition and picks up a laptop instead of a bicycle.', illustrationPath: './assets/import-illustrations/message-01.svg', kind: 'humor' },
    { id: 'message-02', text: 'Calculating how much of your personality is actually endurance sport…', visualDescription: 'A donut chart fills with TRIATHLON versus OTHER.', illustrationPath: './assets/import-illustrations/message-02.svg', kind: 'humor' },
    { id: 'message-03', text: 'Checking whether all those Zone 2 sessions were actually Zone 2. 👀', visualDescription: 'A heart-rate line repeatedly crosses the Zone 2 boundary.', illustrationPath: './assets/import-illustrations/message-03.svg', kind: 'humor' },
    { id: 'message-04', text: 'Converting years of questionable life choices into beautiful charts.', visualDescription: 'Swim, bike, and run icons transform into a colorful analytics chart.', illustrationPath: './assets/import-illustrations/message-04.svg', kind: 'humor' },
    { id: 'message-05', text: 'Good news: buying faster equipment does improve at least one metric — equipment count.', visualDescription: 'A bicycle becomes aerodynamic while its equipment count rises.', illustrationPath: './assets/import-illustrations/message-05.svg', kind: 'humor' },
    { id: 'message-06', text: 'Looking for evidence that you occasionally took a rest day…', visualDescription: 'A magnifying glass scans a calendar and finds a humorous 404.', illustrationPath: './assets/import-illustrations/message-06.svg', kind: 'humor' },
    { id: 'message-07', text: 'Analysing thousands of kilometres you could have spent relaxing.', visualDescription: 'An athlete runs an endless GPS track past an unused sofa.', illustrationPath: './assets/import-illustrations/message-07.svg', kind: 'humor' },
    { id: 'message-08', text: 'Your data is doing a brick session. It also regrets its choices.', visualDescription: 'A cyclist dismounts and runs with exaggerated wobbly legs.', illustrationPath: './assets/import-illustrations/message-08.svg', kind: 'humor' },
    { id: 'message-09', text: "Finding the exact moment \"I'll just try a triathlon\" got out of control.", visualDescription: 'A single workout multiplies into hundreds of activities.', illustrationPath: './assets/import-illustrations/message-09.svg', kind: 'humor' },
    { id: 'message-10', text: "Counting activities. Yes, indoor rides count too. We're not monsters.", visualDescription: 'An indoor trainer receives an animated green checkmark.', illustrationPath: './assets/import-illustrations/message-10.svg', kind: 'humor' },
    { id: 'message-11', text: "Checking whether it really happened if it wasn't recorded…", visualDescription: 'An activity vanishes and returns when a GPS watch saves it.', illustrationPath: './assets/import-illustrations/message-11.svg', kind: 'humor' },
    { id: 'message-12', text: 'Searching your history for the mythical easy recovery session.', visualDescription: 'A magnifying glass searches activity cards labelled HARD.', illustrationPath: './assets/import-illustrations/message-12.svg', kind: 'humor' },
    { id: 'message-13', text: 'Plotting your athletic evolution from "this is fun" to "what\'s my FTP?"', visualDescription: 'Athletic evolution ends with an athlete studying a power meter.', illustrationPath: './assets/import-illustrations/message-13.svg', kind: 'humor' },
    { id: 'message-14', text: 'Separating training volume from compulsive data collection. Difficult.', visualDescription: 'Overlapping circles show TRAINING and ANALYSING TRAINING.', illustrationPath: './assets/import-illustrations/message-14.svg', kind: 'humor' },
    { id: 'message-15', text: 'Analysing your pacing strategy: optimistic start detected.', visualDescription: 'A pace chart starts aggressively and then deteriorates.', illustrationPath: './assets/import-illustrations/message-15.svg', kind: 'humor' },
    { id: 'message-16', text: 'Looking for your fastest performances — and pretending tailwind had nothing to do with them.', visualDescription: 'A cyclist is propelled by an enormous tailwind arrow.', illustrationPath: './assets/import-illustrations/message-16.svg', kind: 'humor' },
    { id: 'message-17', text: 'Reconstructing years of swim, bike, run… and buying things.', visualDescription: 'A repeating sequence shows swimming, cycling, running, and a credit card.', illustrationPath: './assets/import-illustrations/message-17.svg', kind: 'humor' },
    { id: 'message-18', text: "Your ZIP file is bigger than some people's annual training volume. Respect.", visualDescription: 'An oversized ZIP archive balances against a tiny training log.', illustrationPath: './assets/import-illustrations/message-18.svg', kind: 'humor' },
    { id: 'message-19', text: 'Crunching the numbers so you can confirm what you already suspected: you need another bike.', visualDescription: 'An equation reads DATA + SCIENCE = NEW BIKE.', illustrationPath: './assets/import-illustrations/message-19.svg', kind: 'humor' },
    { id: 'message-20', text: 'Almost there. Please resist opening Strava while you wait.', visualDescription: 'A finger approaches a generic activity-feed icon while a warning flashes.', illustrationPath: './assets/import-illustrations/message-20.svg', kind: 'humor', requiresPhase: 'finalizing' }
  ];

  function getEligibleMessages(entries, phase) {
    return (Array.isArray(entries) ? entries : []).filter(message => !message.requiresPhase || message.requiresPhase === phase);
  }

  function shuffleWithoutReplacement(items, random = Math.random) {
    const shuffled = Array.isArray(items) ? items.slice() : [];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const candidate = Number(random());
      const bounded = Number.isFinite(candidate) ? Math.max(0, Math.min(0.999999999, candidate)) : 0;
      const swapIndex = Math.floor(bounded * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function createSession(options = {}) {
    const phase = options.phase || 'processing';
    const sessionMessages = Array.isArray(options.messages) ? options.messages : messages;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const eligible = getEligibleMessages(sessionMessages, phase);
    return {
      messages: sessionMessages.slice(),
      orderedMessageIds: shuffleWithoutReplacement(eligible, random).map(message => message.id),
      shownMessageIds: new Set(),
      currentMessageId: null,
      humorousMessageCount: 0,
      privacyReminderDue: false,
      phase,
      random,
      active: true
    };
  }

  function enqueueNewlyEligible(session, eligible) {
    const queued = new Set(session.orderedMessageIds);
    const fresh = eligible.filter(message => !queued.has(message.id) && !session.shownMessageIds.has(message.id));
    if (fresh.length) {
      session.orderedMessageIds.push(...shuffleWithoutReplacement(fresh, session.random).map(message => message.id));
    }
  }

  function setPhase(session, phase) {
    if (!session || !session.active) return;
    session.phase = phase;
    enqueueNewlyEligible(session, getEligibleMessages(session.messages, phase));
    const completionMessage = session.messages.find(message => message.id === 'message-20');
    if (phase === 'finalizing' && completionMessage && !session.shownMessageIds.has(completionMessage.id)) {
      session.orderedMessageIds = session.orderedMessageIds.filter(id => id !== completionMessage.id);
      session.orderedMessageIds.unshift(completionMessage.id);
    }
  }

  function addCandidates(session, candidates, options = {}) {
    if (!session || !session.active || !Array.isArray(candidates)) return;
    const existingIds = new Set(session.messages.map(message => message.id));
    const additions = candidates.filter(message => {
      if (!message || !message.id || existingIds.has(message.id)) return false;
      existingIds.add(message.id);
      return true;
    });
    if (!additions.length) return;
    session.messages.push(...additions);
    const eligibleAdditions = shuffleWithoutReplacement(
      getEligibleMessages(additions, session.phase),
      session.random
    ).map(message => message.id);
    if (options.prioritize === true) {
      session.orderedMessageIds.unshift(...eligibleAdditions);
    } else {
      session.orderedMessageIds.push(...eligibleAdditions);
    }
  }

  function getNextMessage(session) {
    if (!session || !session.active) return null;
    if (!session.orderedMessageIds.length) {
      session.shownMessageIds.clear();
      session.orderedMessageIds = shuffleWithoutReplacement(
        getEligibleMessages(session.messages, session.phase),
        session.random
      ).map(message => message.id);
    }
    const id = session.orderedMessageIds.shift();
    const message = session.messages.find(candidate => candidate.id === id);
    if (!message) return null;
    session.currentMessageId = message.id;
    session.shownMessageIds.add(message.id);
    if (message.kind === 'humor' || message.kind === 'personal') {
      session.humorousMessageCount += 1;
      session.privacyReminderDue = session.humorousMessageCount % 4 === 0;
    }
    return message;
  }

  function stopSession(session) {
    if (!session) return;
    session.active = false;
    session.orderedMessageIds.length = 0;
  }

  function createStatisticsAccumulator() {
    return {
      activityCount: 0,
      firstYear: null,
      lastYear: null,
      bikeCount: 0,
      bikeDistancesComplete: true,
      cyclingDistanceKm: 0,
      longestRideKm: null,
      swimmingActivityCount: 0,
      runningEquipment: new Set()
    };
  }

  function accumulateActivityStatistics(accumulator, activity) {
    if (!accumulator || !activity || !(activity.date instanceof Date) || !Number.isFinite(activity.date.getTime())) return;
    accumulator.activityCount += 1;
    const year = activity.date.getFullYear();
    accumulator.firstYear = accumulator.firstYear === null ? year : Math.min(accumulator.firstYear, year);
    accumulator.lastYear = accumulator.lastYear === null ? year : Math.max(accumulator.lastYear, year);

    if (activity.sport === 'Bike') {
      accumulator.bikeCount += 1;
      const distance = activity.distance;
      if (activity.distanceAvailable !== true || !Number.isFinite(distance) || distance < 0) {
        accumulator.bikeDistancesComplete = false;
      } else {
        accumulator.cyclingDistanceKm += distance;
        accumulator.longestRideKm = accumulator.longestRideKm === null ? distance : Math.max(accumulator.longestRideKm, distance);
      }
    } else if (activity.sport === 'Swim') {
      accumulator.swimmingActivityCount += 1;
    } else if (activity.sport === 'Run') {
      const equipment = String(activity.equipment || '').trim();
      const normalized = equipment.toLocaleLowerCase();
      if (equipment && !['-', 'none', 'unknown', 'n/a'].includes(normalized)) {
        accumulator.runningEquipment.add(normalized);
      }
    }
  }

  function finalizeStatistics(accumulator) {
    const hasActivities = accumulator.activityCount > 0;
    const completeBikeData = accumulator.bikeCount > 0 && accumulator.bikeDistancesComplete;
    return {
      activityCount: hasActivities ? accumulator.activityCount : null,
      cyclingDistanceKm: completeBikeData ? accumulator.cyclingDistanceKm : null,
      historyYearRange: hasActivities ? { firstYear: accumulator.firstYear, lastYear: accumulator.lastYear } : null,
      runningShoeCount: accumulator.runningEquipment.size > 0 ? accumulator.runningEquipment.size : null,
      longestRideKm: completeBikeData ? accumulator.longestRideKm : null,
      swimmingActivityCount: accumulator.swimmingActivityCount > 0 ? accumulator.swimmingActivityCount : null
    };
  }

  function getPersonalStatistics(activities) {
    const accumulator = createStatisticsAccumulator();
    if (Array.isArray(activities)) activities.forEach(activity => accumulateActivityStatistics(accumulator, activity));
    return finalizeStatistics(accumulator);
  }

  function buildPersonalMessages(activitiesOrStatistics, formatNumber) {
    const statistics = Array.isArray(activitiesOrStatistics)
      ? getPersonalStatistics(activitiesOrStatistics)
      : activitiesOrStatistics;
    if (!statistics || typeof statistics !== 'object') return [];
    const format = typeof formatNumber === 'function'
      ? formatNumber
      : value => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
    const candidates = [];
    const add = (id, statistic, text, illustrationId) => candidates.push({
      id: `personal-${id}`,
      kind: 'personal',
      statistic,
      text,
      illustrationPath: `./assets/import-illustrations/${illustrationId}.svg`
    });

    if (statistics.activityCount !== null) {
      add('activity-count', 'activityCount', `We found ${format(statistics.activityCount)} activities. Apparently “rest day” was more of a guideline.`, 'message-10');
    }
    if (statistics.cyclingDistanceKm !== null) {
      add('cycling-distance', 'cyclingDistanceKm', `You've ridden ${format(statistics.cyclingDistanceKm)} km. Your car would like a word.`, 'message-07');
    }
    if (statistics.historyYearRange) {
      add('history-span', 'historyYearRange', `Training history spans ${statistics.historyYearRange.firstYear}–${statistics.historyYearRange.lastYear}. This is no longer a hobby.`, 'message-13');
    }
    if (statistics.runningShoeCount !== null) {
      add('running-shoes', 'runningShoeCount', `You have used ${format(statistics.runningShoeCount)} pairs of running shoes. Your feet have expensive taste.`, 'message-05');
    }
    if (statistics.longestRideKm !== null) {
      add('longest-ride', 'longestRideKm', `Longest ride found: ${format(statistics.longestRideKm)} km. We assume this seemed like a good idea at the time.`, 'message-16');
    }
    if (statistics.swimmingActivityCount !== null) {
      add('swim-count', 'swimmingActivityCount', `${format(statistics.swimmingActivityCount)} swims detected. Good. We were worried you were one of those triathletes.`, 'message-01');
    }
    return candidates;
  }

  const api = {
    messages,
    personalMessages: [],
    privacyReminder: '🔒 Still local. Your Strava training-file contents are processed in your browser — not uploaded to TriAnalytica servers.',
    getEligibleMessages,
    shuffleWithoutReplacement,
    createSession,
    setPhase,
    addCandidates,
    getNextMessage,
    stopSession,
    createStatisticsAccumulator,
    accumulateActivityStatistics,
    finalizeStatistics,
    getPersonalStatistics,
    buildPersonalMessages
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.importExperienceCatalog = api;
})(typeof window !== 'undefined' ? window : null);
