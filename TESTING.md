# Testing Guide: Test-Driven Development (TDD)

This project uses **Test-Driven Development (TDD)** with Jest for unit/integration tests. All commits require passing tests.

## Quick Start

### Install Dependencies
Tests are set up and dependencies are already installed via `npm install`. No additional setup needed.

### Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm test:watch

# Run tests with coverage report
npm test:coverage
```

### What Happens on Commit
When you try to commit to git, a pre-commit hook runs `npm test`. If tests fail, the commit is blocked. This ensures only code that passes all tests gets committed.

**This is the TDD workflow:**
1. Write a test for a new feature (test fails initially ❌)
2. Write minimal code to make the test pass ✅
3. Refactor and improve the code
4. Commit (tests must pass!)

---

## Project Test Structure

```
__tests__/
├── parsing.test.js       # Tests for date parsing, sport categorization, formatting
├── processing.test.js    # Tests for CSV parsing, data processing, aggregation
└── integration.test.js   # End-to-end tests: CSV import → parsing → calculations

test-data/
└── activities.csv        # Sample CSV file for testing

dashboard-utils.js        # Exported utilities for testing (can be used in browser too)
jest.config.js           # Jest configuration
```

### File Organization

- **dashboard-utils.js**: All pure functions extracted from `index.html`. This file:
  - Can be imported in Node.js tests
  - Can be imported in the browser via script tag
  - Contains NO DOM manipulation or browser-specific code

- **index.html**: Uses `dashboard-utils.js` for calculations, plus DOM operations

---

## Test Categories

### 1. Parsing Tests (`parsing.test.js`)
Tests for individual functions that parse and format data.

Examples:
- `parseGermanDate()` - Parse "19.07.2026, 14:52:02" to Date object
- `categorizeSport()` - Convert "Lauf" → "Run"
- `formatDateIso()` - Convert Date to "2026-07-19"

**When to add:** When you create a new parsing or formatting function.

### 2. Processing Tests (`processing.test.js`)
Tests for data transformation: CSV parsing, activity processing, aggregation.

Examples:
- `processData()` - Convert CSV rows to activity objects
- `aggregateByWeek()` - Sum activities by week and sport
- `calculateTotalsByCategory()` - Get totals for Run/Bike/Swim

**When to add:** When you add data transformation logic.

### 3. Integration Tests (`integration.test.js`)
End-to-end tests: Load CSV file → parse → process → calculate metrics.

These test the complete workflow to ensure all pieces work together.

**When to add:** When you implement a complete feature (e.g., "User can import CSV and see charts").

---

## TDD Workflow Example

### Scenario: Add a new function to filter activities by sport

#### Step 1: Write the test FIRST (Red ❌)

```javascript
// In __tests__/processing.test.js

describe('filterActivitiesBySport', () => {
  it('should return only activities for the specified sport', () => {
    const activities = [
      { sport: 'Run', distance: 10 },
      { sport: 'Run', distance: 5 },
      { sport: 'Bike', distance: 40 }
    ];

    const result = filterActivitiesBySport(activities, 'Run');

    expect(result).toHaveLength(2);
    expect(result[0].distance).toBe(10);
    expect(result[1].distance).toBe(5);
  });

  it('should return empty array if no activities match', () => {
    const activities = [
      { sport: 'Run', distance: 10 },
      { sport: 'Bike', distance: 40 }
    ];

    const result = filterActivitiesBySport(activities, 'Swim');

    expect(result).toHaveLength(0);
  });
});
```

Run tests: `npm test` → Tests FAIL because `filterActivitiesBySport` doesn't exist yet.

#### Step 2: Write minimal code (Green ✅)

```javascript
// In dashboard-utils.js

/**
 * Filter activities by sport category
 * @param {Array} activities - Activities to filter
 * @param {string} sport - Sport to filter by ('Run', 'Bike', 'Swim')
 * @returns {Array} Filtered activities
 */
function filterActivitiesBySport(activities, sport) {
  return activities.filter(a => a.sport === sport);
}

// Export it
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // ... other exports
    filterActivitiesBySport
  };
}
```

Run tests: `npm test` → Tests PASS ✅

#### Step 3: Refactor (optional)
If you want to improve the code, refactor now. Tests will verify it still works.

#### Step 4: Commit
```bash
git add .
git commit -m "Add filterActivitiesBySport function with tests"
```

The pre-commit hook runs tests automatically. If tests pass, commit succeeds. If they fail, commit is blocked.

---

## Common Test Patterns

### Testing a function that validates input

```javascript
describe('parseGermanDate', () => {
  it('should accept valid dates', () => {
    const result = parseGermanDate('19.07.2026, 14:52:02');
    expect(result).not.toBeNull();
  });

  it('should reject invalid dates', () => {
    expect(parseGermanDate('32.13.2026')).toBeNull();
    expect(parseGermanDate('not-a-date')).toBeNull();
  });

  it('should reject empty input', () => {
    expect(parseGermanDate('')).toBeNull();
    expect(parseGermanDate(null)).toBeNull();
  });
});
```

### Testing a function that transforms data

```javascript
describe('processData', () => {
  it('should convert CSV rows to activity objects', () => {
    const csvData = [
      ['Aktivitätsdatum', 'Aktivitätsart', 'Name der Aktivität', 'Bewegungszeit', 'Distanz'],
      ['19.07.2026, 14:52:02', 'Lauf', 'Morning run', '3600', '10000']
    ];

    const result = processData(csvData);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sport: 'Run',
      name: 'Morning run',
      distance: 10,
      duration: 3600
    });
  });
});
```

### Testing error handling

```javascript
describe('processData', () => {
  it('should throw if required columns are missing', () => {
    const invalidCsv = [
      ['WrongColumn1', 'WrongColumn2'],
      ['value1', 'value2']
    ];

    expect(() => processData(invalidCsv)).toThrow();
  });
});
```

---

## Coverage Report

To see how much of your code is tested:

```bash
npm test:coverage
```

This generates a coverage report showing:
- **Lines**: % of code lines executed by tests
- **Branches**: % of if/else branches covered
- **Functions**: % of functions called by tests
- **Statements**: % of statements executed

Goal: Aim for >80% coverage on the main utility functions.

---

## Tips for Writing Good Tests

### ✅ DO

- Write tests that describe WHAT the function does, not HOW
- Use descriptive test names: `it('should return null for invalid dates')`
- Test both happy path (success) and edge cases (errors)
- Test one thing per test
- Use `beforeAll()` or `beforeEach()` for common setup

### ❌ DON'T

- Write tests that are too specific (brittle tests)
- Test implementation details rather than behavior
- Use vague test names: `it('works')`
- Test multiple unrelated things in one test
- Ignore edge cases (null, empty, invalid input)

---

## Troubleshooting

### Tests pass locally but fail in CI
- Ensure all environment-specific code is tested
- Check timezone issues with date tests
- Verify CSV test data doesn't have platform-specific line endings

### "Cannot find module" error
- Make sure exports are added to the `module.exports` block in `dashboard-utils.js`
- Example: `module.exports = { parseGermanDate, processData, ... }`

### Tests run slowly
- Use `npm test:watch` for faster feedback during development
- Only run relevant tests: `npx jest parsing.test.js`

---

## Next Steps: E2E Testing

For testing the complete page (loading, file upload, chart rendering), we'll use **Playwright** or **Cypress** later. For now, focus on unit/integration tests for data logic.

Example E2E test (to add later):
```javascript
test('User can import CSV and see dashboard', async ({ page }) => {
  await page.goto('http://localhost:8000');
  // Manual CSV upload flow was removed. Start from Strava ZIP import instead.
  await page.waitForSelector('#trainingChart');
  const totalKm = await page.textContent('#cardTotalKm');
  expect(parseFloat(totalKm)).toBeGreaterThan(0);
});
```

---

## Questions?

Refer to:
- [Jest Documentation](https://jestjs.io/)
- `dashboard-utils.js` - See exported functions
- Test examples in `__tests__/` directories
