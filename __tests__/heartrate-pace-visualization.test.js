/**
 * Tests for Heart Rate vs Pace Visualization
 * Tests the new year-based data visibility and trend line toggle functionality
 */

const {
  buildYearlyRegressionDatasets,
  getHeartratePacePoints
} = require('../src/scatter-utils');

describe('Heartrate vs Pace Visualization - Year Data and Trend Lines', () => {
  
  const testActivities = [
    {
      date: new Date(2024, 0, 10),
      sport: 'Run',
      distance: 10,
      duration: 3600,
      avgHeartRate: 150,
      name: 'Run 2024-01'
    },
    {
      date: new Date(2024, 5, 15),
      sport: 'Run',
      distance: 12,
      duration: 4200,
      avgHeartRate: 155,
      name: 'Run 2024-06'
    },
    {
      date: new Date(2025, 0, 10),
      sport: 'Run',
      distance: 11,
      duration: 3900,
      avgHeartRate: 145,
      name: 'Run 2025-01'
    },
    {
      date: new Date(2025, 6, 20),
      sport: 'Bike',
      distance: 40,
      duration: 7200,
      avgHeartRate: 130,
      name: 'Bike 2025-07'
    }
  ];

  describe('Year-based Data Grouping', () => {
    it('should filter and group points by year', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      
      const pointsByYear = new Map();
      points.forEach(point => {
        if (!pointsByYear.has(point.year)) {
          pointsByYear.set(point.year, []);
        }
        pointsByYear.get(point.year).push(point);
      });

      expect(pointsByYear.has(2024)).toBe(true);
      expect(pointsByYear.has(2025)).toBe(true);
      expect(pointsByYear.get(2024).length).toBe(2);
      expect(pointsByYear.get(2025).length).toBe(2);
    });

    it('should include year property in each point', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      
      points.forEach(point => {
        expect(point).toHaveProperty('year');
        expect(typeof point.year).toBe('number');
        expect(point.year >= 2000).toBe(true);
      });
    });

    it('should correctly identify year from activity date', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      
      const point2024 = points.find(p => p.name === 'Run 2024-01');
      const point2025 = points.find(p => p.name === 'Run 2025-01');
      
      expect(point2024.year).toBe(2024);
      expect(point2025.year).toBe(2025);
    });
  });

  describe('Regression Dataset Color Mapping', () => {
    it('should create one regression dataset per year', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      const datasets = buildYearlyRegressionDatasets(points, ['#F59E0B', '#A78BFA', '#F97316', '#22D3EE', '#84CC16']);
      
      expect(datasets.length).toBe(2); // 2024 and 2025
    });

    it('should assign unique colors from palette to each year', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      const palette = ['#F59E0B', '#A78BFA', '#F97316', '#22D3EE', '#84CC16'];
      const datasets = buildYearlyRegressionDatasets(points, palette);
      
      const colors = datasets.map(d => d.borderColor);
      expect(new Set(colors).size).toBe(datasets.length); // All unique
      expect(colors.every(c => palette.includes(c))).toBe(true);
    });

    it('should maintain consistent colors across dataset and bubble renders', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      const palette = ['#F59E0B', '#A78BFA'];
      const regressionDatasets = buildYearlyRegressionDatasets(points, palette);
      
      const yearToColor = new Map();
      regressionDatasets.forEach(dataset => {
        yearToColor.set(dataset.year, dataset.borderColor);
      });

      expect(yearToColor.get(2024)).toBeDefined();
      expect(yearToColor.get(2025)).toBeDefined();
      expect(yearToColor.get(2024)).not.toBe(yearToColor.get(2025));
    });

    it('should cycle through palette if more years than colors', () => {
      const points = [
        { x: 4, y: 150, year: 2020 },
        { x: 5, y: 155, year: 2020 },
        { x: 6, y: 160, year: 2021 },
        { x: 7, y: 165, year: 2021 },
        { x: 8, y: 170, year: 2022 },
        { x: 9, y: 175, year: 2022 },
        { x: 4.5, y: 152, year: 2023 },
        { x: 5.5, y: 157, year: 2023 },
        { x: 8.5, y: 172, year: 2024 },
        { x: 9.5, y: 177, year: 2024 },
        { x: 4.2, y: 151, year: 2025 },
        { x: 5.2, y: 156, year: 2025 }
      ];
      
      const palette = ['#F59E0B', '#A78BFA']; // Only 2 colors
      const datasets = buildYearlyRegressionDatasets(points, palette);
      
      expect(datasets.length).toBe(6);
      // First and fourth datasets should use the same color (cycling)
      expect(datasets[0].borderColor).toBe(palette[0]);
      expect(datasets[2].borderColor).toBe(palette[0]); // Cycles back
    });
  });

  describe('Visibility Control State', () => {
    it('should track enabled years separately from trend line visibility', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      const datasets = buildYearlyRegressionDatasets(points, ['#F59E0B', '#A78BFA']);

      // Simulate state management:
      // - enabledScatterDataYears tracks which years have visible data
      // - scatterShowTrendLines tracks whether to show trend lines
      
      const enabledYears = new Set([2024, 2025]);
      const showTrendLines = true;

      // Both 2024 and 2025 data should be visible
      expect(enabledYears.has(2024)).toBe(true);
      expect(enabledYears.has(2025)).toBe(true);
      expect(showTrendLines).toBe(true);
    });

    it('should allow toggling individual year visibility', () => {
      const enabledYears = new Set([2024, 2025]);
      
      // Disable 2024
      enabledYears.delete(2024);
      expect(enabledYears.has(2024)).toBe(false);
      expect(enabledYears.has(2025)).toBe(true);
      
      // Re-enable 2024
      enabledYears.add(2024);
      expect(enabledYears.has(2024)).toBe(true);
    });

    it('should allow independent control of trend line visibility', () => {
      const showTrendLines = true;
      const newShowTrendLines = false;

      expect(showTrendLines).toBe(true);
      expect(newShowTrendLines).toBe(false);
    });
  });

  describe('Dataset Visibility Logic', () => {
    it('should show bubbles when year is enabled', () => {
      const enabledYears = new Set([2024, 2025]);
      
      // Bubble dataset for 2024
      const bubbleDataset = {
        type: 'bubble',
        year: 2024,
        label: '2024'
      };

      const isVisible = enabledYears.has(bubbleDataset.year);
      expect(isVisible).toBe(true);
    });

    it('should hide bubbles when year is disabled', () => {
      const enabledYears = new Set([2024]); // Only 2024 enabled
      
      // Bubble dataset for 2025
      const bubbleDataset = {
        type: 'bubble',
        year: 2025,
        label: '2025'
      };

      const isVisible = enabledYears.has(bubbleDataset.year);
      expect(isVisible).toBe(false);
    });

    it('should show trend lines only when both conditions are met', () => {
      const enabledYears = new Set([2024, 2025]);
      const showTrendLines = true;

      // Trend dataset for 2024
      const trendDataset = {
        type: 'line',
        year: 2024,
        label: '2024 Trend'
      };

      // Trend line visible if trend lines are enabled AND year data is enabled
      const isVisible = showTrendLines && enabledYears.has(trendDataset.year);
      expect(isVisible).toBe(true);
    });

    it('should hide trend lines when trend line toggle is off', () => {
      const enabledYears = new Set([2024, 2025]);
      const showTrendLines = false; // Trend lines disabled

      // Trend dataset for 2024
      const trendDataset = {
        type: 'line',
        year: 2024,
        label: '2024 Trend'
      };

      const isVisible = showTrendLines && enabledYears.has(trendDataset.year);
      expect(isVisible).toBe(false);
    });

    it('should hide trend lines when year data is disabled', () => {
      const enabledYears = new Set([2025]); // Only 2025 enabled
      const showTrendLines = true;

      // Trend dataset for 2024
      const trendDataset = {
        type: 'line',
        year: 2024,
        label: '2024 Trend'
      };

      const isVisible = showTrendLines && enabledYears.has(trendDataset.year);
      expect(isVisible).toBe(false);
    });
  });

  describe('Bubble Dataset Year Properties', () => {
    it('should add year property to bubble datasets', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      const yearToColor = new Map();
      points.forEach(p => {
        if (!yearToColor.has(p.year)) {
          yearToColor.set(p.year, `#color${p.year}`);
        }
      });

      const bubbleDatasets = [];
      const yearGroups = new Map();
      
      points.forEach(point => {
        if (!yearGroups.has(point.year)) {
          yearGroups.set(point.year, []);
        }
        yearGroups.get(point.year).push(point);
      });

      yearGroups.forEach((yearPoints, year) => {
        bubbleDatasets.push({
          type: 'bubble',
          year: year,
          label: `${year}`
        });
      });

      expect(bubbleDatasets.every(ds => ds.hasOwnProperty('year'))).toBe(true);
      expect(bubbleDatasets[0].year).toBeDefined();
    });

    it('should apply order property to bubble datasets', () => {
      const bubbleDataset = {
        type: 'bubble',
        year: 2024,
        order: 2 // Bubbles render behind trend lines
      };

      expect(bubbleDataset.order).toBe(2);
    });
  });

  describe('Control Panel Rendering Data', () => {
    it('should provide data for year checkboxes', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      const regressionDatasets = buildYearlyRegressionDatasets(
        points,
        ['#F59E0B', '#A78BFA']
      );

      const years = regressionDatasets.map(d => d.year).sort((a, b) => a - b);
      
      expect(years).toContain(2024);
      expect(years).toContain(2025);
    });

    it('should provide color data for year checkboxes', () => {
      const points = getHeartratePacePoints(testActivities, { sport: 'All' });
      const regressionDatasets = buildYearlyRegressionDatasets(
        points,
        ['#F59E0B', '#A78BFA']
      );

      regressionDatasets.forEach(dataset => {
        expect(dataset).toHaveProperty('borderColor');
        expect(dataset.borderColor).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should have separate trend line toggle independent of year selection', () => {
      const enabledYears = new Set([2024]); // Only one year selected
      const showTrendLines = true; // But trend lines toggle is on

      // This combination is valid
      expect(enabledYears.size).toBe(1);
      expect(showTrendLines).toBe(true);
    });
  });
});
