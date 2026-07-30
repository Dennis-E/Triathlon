/**
 * Unit Tests for Parsing Functions
 * Tests for date parsing, sport categorization, and CSV parsing
 */

const {
  parseGermanDate,
  getMonday,
  formatDateIso,
  formatDateLabel,
  formatDuration,
  categorizeSport,
  SPORT_MAP
} = require('../dashboard-utils');

describe('parseGermanDate', () => {
  it('should correctly parse German date format with time', () => {
    const result = parseGermanDate('19.07.2026, 14:52:02');
    expect(result).not.toBeNull();
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6); // 0-indexed
    expect(result.getDate()).toBe(19);
  });

  it('should correctly parse German date format without time', () => {
    const result = parseGermanDate('19.07.2026');
    expect(result).not.toBeNull();
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(19);
  });

  it('should parse english export dates with month names', () => {
    const result = parseGermanDate('Jul 27, 2026, 9:00:37 AM');
    expect(result).not.toBeNull();
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(27);
  });

  it('should return null for empty string', () => {
    expect(parseGermanDate('')).toBeNull();
  });

  it('should return null for null input', () => {
    expect(parseGermanDate(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(parseGermanDate(undefined)).toBeNull();
  });

  it('should return null for invalid date format', () => {
    expect(parseGermanDate('not-a-date')).toBeNull();
    expect(parseGermanDate('32.13.2026')).toBeNull(); // Invalid day/month
  });

  it('should return null for incomplete date', () => {
    expect(parseGermanDate('19.07')).toBeNull();
    expect(parseGermanDate('19')).toBeNull();
  });
});

describe('getMonday', () => {
  it('should return the Monday of a given week', () => {
    // July 19, 2026 is a Sunday
    const date = new Date(2026, 6, 19);
    const monday = getMonday(date);
    expect(monday.getDay()).toBe(1); // Monday is day 1
    expect(monday.getDate()).toBe(13); // Monday of that week
  });

  it('should return the same date if input is already Monday', () => {
    // July 13, 2026 is a Monday
    const date = new Date(2026, 6, 13);
    const monday = getMonday(date);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(13);
  });

  it('should handle Sunday correctly (returns same week Monday)', () => {
    // July 19, 2026 is a Sunday
    const date = new Date(2026, 6, 19);
    const monday = getMonday(date);
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(13); // Previous Monday
  });

  it('should reset time to midnight', () => {
    const date = new Date(2026, 6, 19, 14, 30, 45);
    const monday = getMonday(date);
    expect(monday.getHours()).toBe(0);
    expect(monday.getMinutes()).toBe(0);
    expect(monday.getSeconds()).toBe(0);
  });
});

describe('formatDateIso', () => {
  it('should format date as YYYY-MM-DD', () => {
    const date = new Date(2026, 6, 19); // July 19, 2026
    expect(formatDateIso(date)).toBe('2026-07-19');
  });

  it('should pad month and day with zeros', () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(formatDateIso(date)).toBe('2026-01-05');
  });

  it('should handle year padding correctly', () => {
    const date = new Date(999, 11, 31); // December 31, year 999
    expect(formatDateIso(date)).toBe('0999-12-31');
  });
});

describe('formatDateLabel', () => {
  it('should format date as "D Mon \'YY"', () => {
    const date = new Date(2026, 6, 19); // July 19, 2026
    expect(formatDateLabel(date)).toBe("19 Jul '26");
  });

  it('should handle all months correctly', () => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthLabels.forEach((month, index) => {
      const date = new Date(2026, index, 1);
      expect(formatDateLabel(date)).toContain(month);
    });
  });

  it('should format January 1, 2026', () => {
    const date = new Date(2026, 0, 1);
    expect(formatDateLabel(date)).toBe("1 Jan '26");
  });
});

describe('formatDuration', () => {
  it('should format seconds as "Xh Ym"', () => {
    const seconds = 3600 + 2700; // 1h 45m
    expect(formatDuration(seconds)).toBe('1h 45m');
  });

  it('should format seconds as "Xm" for durations less than 1 hour', () => {
    const seconds = 1800; // 30 minutes
    expect(formatDuration(seconds)).toBe('30m');
  });

  it('should handle zero duration', () => {
    expect(formatDuration(0)).toBe('--');
  });

  it('should handle null duration', () => {
    expect(formatDuration(null)).toBe('--');
  });

  it('should handle undefined duration', () => {
    expect(formatDuration(undefined)).toBe('--');
  });

  it('should handle NaN duration', () => {
    expect(formatDuration(NaN)).toBe('--');
  });

  it('should format large durations correctly', () => {
    const seconds = 7200 + 1800; // 2h 30m
    expect(formatDuration(seconds)).toBe('2h 30m');
  });
});

describe('categorizeSport', () => {
  it('should categorize German running terms to Run', () => {
    expect(categorizeSport('Lauf')).toBe('Run');
    expect(categorizeSport('Laufen')).toBe('Run');
    expect(categorizeSport('Virtueller Lauf')).toBe('Run');
  });

  it('should categorize English running terms to Run', () => {
    expect(categorizeSport('Run')).toBe('Run');
    expect(categorizeSport('Running')).toBe('Run');
  });

  it('should categorize German cycling terms to Bike', () => {
    expect(categorizeSport('Radfahrt')).toBe('Bike');
    expect(categorizeSport('Radfahren')).toBe('Bike');
    expect(categorizeSport('Virtuelle Radfahrt')).toBe('Bike');
  });

  it('should categorize English cycling terms to Bike', () => {
    expect(categorizeSport('Ride')).toBe('Bike');
    expect(categorizeSport('Cycling')).toBe('Bike');
    expect(categorizeSport('Biking')).toBe('Bike');
    expect(categorizeSport('Virtual Ride')).toBe('Bike');
  });

  it('should categorize German swimming terms to Swim', () => {
    expect(categorizeSport('Schwimmen')).toBe('Swim');
  });

  it('should categorize English swimming terms to Swim', () => {
    expect(categorizeSport('Swim')).toBe('Swim');
    expect(categorizeSport('Swimming')).toBe('Swim');
  });

  it('should handle case insensitivity', () => {
    expect(categorizeSport('LAUF')).toBe('Run');
    expect(categorizeSport('Radfahrt')).toBe('Bike');
    expect(categorizeSport('SWIM')).toBe('Swim');
  });

  it('should handle whitespace', () => {
    expect(categorizeSport('  Lauf  ')).toBe('Run');
  });

  it('should return null for unknown sports', () => {
    expect(categorizeSport('Unknown')).toBeNull();
    expect(categorizeSport('Strength Training')).toBeNull();
  });

  it('should return null for null input', () => {
    expect(categorizeSport(null)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(categorizeSport('')).toBeNull();
  });
});

describe('SPORT_MAP', () => {
  it('should be defined and contain expected entries', () => {
    expect(SPORT_MAP).toBeDefined();
    expect(SPORT_MAP['lauf']).toBe('Run');
    expect(SPORT_MAP['radfahrt']).toBe('Bike');
    expect(SPORT_MAP['schwimmen']).toBe('Swim');
  });
});
