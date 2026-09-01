const { extractRelevantColumns, parseCsvBasic } = require('../src/zip-importer');

describe('zip importer relevant column extraction', () => {
  it('keeps Average Watts when present in original ZIP activities.csv headers', () => {
    const csv = [
      ['Activity ID', 'Activity Date', 'Activity Name', 'Activity Type', 'Moving Time', 'Distance', 'Average Heart Rate', 'Average Watts', 'Distance'].join(','),
      ['1', '2026-07-19 14:52:02', 'Bike workout', 'Bike', '3600', '40.00', '145', '232', '40000'].join(',')
    ].join('\n');

    const reducedCsv = extractRelevantColumns(csv);
    const rows = parseCsvBasic(reducedCsv);

    expect(rows[0]).toEqual([
      'Aktivitäts-ID',
      'Aktivitätsdatum',
      'Name der Aktivität',
      'Aktivitätsart',
      'Aktivitätsausrüstung',
      'Bewegungszeit',
      'Distanz',
      'Durchschnittliche Herzfrequenz',
      'Durchschnittliche Wattzahl',
      'Distanz'
    ]);
    expect(rows[1][8]).toBe('232');
  });

  it('keeps power column slot empty when Average Watts/Power is missing', () => {
    const csv = [
      ['Activity ID', 'Activity Date', 'Activity Name', 'Activity Type', 'Moving Time', 'Distance', 'Average Heart Rate', 'Distance'].join(','),
      ['1', '2026-07-19 14:52:02', 'Run', 'Run', '3600', '10.00', '152', '10000'].join(',')
    ].join('\n');

    const reducedCsv = extractRelevantColumns(csv);
    const rows = parseCsvBasic(reducedCsv);

    expect(rows[0][8]).toBe('Durchschnittliche Wattzahl');
    expect(rows[1][8]).toBe('');
  });
});
