const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  parseCsv,
  reduceActivitiesRows,
  extractRelevantExport
} = require('../relevant-export-extractor');

describe('reduceActivitiesRows', () => {
  it('keeps only the columns used by the current visualizations', () => {
    const rows = [
      [
        'Aktivitäts-ID',
        'Aktivitätsdatum',
        'Name der Aktivität',
        'Aktivitätsart',
        'Aktivitätsbeschreibung',
        'Aktivitätsausrüstung',
        'Bewegungszeit',
        'Distanz',
        'Durchschnittliche Herzfrequenz',
        'Distanz',
        'Medien'
      ],
      [
        '1',
        '19.07.2026, 14:52:02',
        'Morning run',
        'Lauf',
        'desc',
        'ASICS Novablast 4',
        '3600',
        '10,00',
        '152',
        '10000',
        'media/example.jpg'
      ]
    ];

    const reduced = reduceActivitiesRows(rows);

    expect(reduced[0]).toEqual([
      'Aktivitäts-ID',
      'Aktivitätsdatum',
      'Name der Aktivität',
      'Aktivitätsart',
      'Aktivitätsausrüstung',
      'Bewegungszeit',
      'Distanz',
      'Durchschnittliche Herzfrequenz',
      'Distanz'
    ]);

    expect(reduced[1]).toEqual([
      '1',
      '19.07.2026, 14:52:02',
      'Morning run',
      'Lauf',
      'ASICS Novablast 4',
      '3600',
      '10,00',
      '152',
      '10000'
    ]);
  });

  it('detects the average heart-rate column by name pattern', () => {
    const rows = [
      [
        'Aktivitäts-ID',
        'Aktivitätsdatum',
        'Name der Aktivität',
        'Aktivitätsart',
        'Bewegungszeit',
        'Distanz',
        'Durchschnittliche Herzfrequenz',
        'Distanz'
      ],
      ['1', '19.07.2026, 14:52:02', 'Run', 'Lauf', '3600', '10,00', '150', '10000']
    ];

    const reduced = reduceActivitiesRows(rows);
    expect(reduced[1][7]).toBe('150');
  });
});

describe('extractRelevantExport', () => {
  let sourceDirectory;
  let outputDirectory;

  beforeEach(() => {
    sourceDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tri-relevant-source-'));
    outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'tri-relevant-output-'));

    const sourceCsv = [
      [
        'Aktivitäts-ID',
        'Aktivitätsdatum',
        'Name der Aktivität',
        'Aktivitätsart',
        'Aktivitätsbeschreibung',
        'Aktivitätsausrüstung',
        'Bewegungszeit',
        'Distanz',
        'Durchschnittliche Herzfrequenz',
        'Distanz',
        'Medien'
      ],
      [
        '1',
        '19.07.2026, 14:52:02',
        'Morning run',
        'Lauf',
        'desc',
        'ASICS Novablast 4',
        '3600',
        '10,00',
        '152',
        '10000',
        'media/example.jpg'
      ],
      [
        '2',
        '20.07.2026, 09:15:00',
        'Bike ride',
        'Radfahrt',
        '',
        'Storck Aero 2',
        '5400',
        '48,14',
        '131',
        '48148.8',
        ''
      ]
    ].map(row => row.map(value => {
      const stringValue = String(value);
      if (!/[",\n\r]/.test(stringValue)) return stringValue;
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',')).join('\n');

    fs.writeFileSync(path.join(sourceDirectory, 'activities.csv'), `${sourceCsv}\n`, 'utf8');
  });

  afterEach(() => {
    fs.rmSync(sourceDirectory, { recursive: true, force: true });
    fs.rmSync(outputDirectory, { recursive: true, force: true });
  });

  it('writes a reduced activities.csv from an extracted export directory', () => {
    const sourceRows = parseCsv(
      fs.readFileSync(path.join(sourceDirectory, 'activities.csv'), 'utf8')
    );

    const result = extractRelevantExport(sourceDirectory, outputDirectory);
    const reducedPath = path.join(outputDirectory, 'activities.csv');
    const reducedRows = parseCsv(fs.readFileSync(reducedPath, 'utf8'));

    expect(result.files).toEqual(['activities.csv']);
    expect(result.activityCount).toBe(2);
    expect(fs.existsSync(reducedPath)).toBe(true);
    expect(reducedRows[0]).toEqual([
      'Aktivitäts-ID',
      'Aktivitätsdatum',
      'Name der Aktivität',
      'Aktivitätsart',
      'Aktivitätsausrüstung',
      'Bewegungszeit',
      'Distanz',
      'Durchschnittliche Herzfrequenz',
      'Distanz'
    ]);
    expect(reducedRows.length).toBe(sourceRows.length);
    expect(result.activityCount).toBe(sourceRows.length - 1);
  });
});
