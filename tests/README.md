# Perpetua Testing Infrastructure

Comprehensive testing suite for Perpetua - The Infinite Thought Engine.

## 📋 Overview

This testing infrastructure provides complete coverage for:
- **Unit Tests** - Individual functions and services
- **Integration Tests** - Component interactions and data flow
- **E2E Tests** - Full application workflows
- **Performance Tests** - Load and stress testing

## 🎯 Coverage Requirements

Minimum coverage thresholds:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
npx playwright install
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Watch mode for development
npm run test:watch
```

### View Coverage Report

```bash
npm run test:coverage
```

## 📁 Test Structure

```
tests/
├── unit/                  # Unit tests
│   ├── services/         # Service layer tests
│   ├── engine/           # Exploration engine tests
│   └── utils/            # Utility function tests
│
├── integration/          # Integration tests
│   ├── ipc.test.ts      # Electron IPC tests
│   ├── database.test.ts  # Database operation tests
│   └── api.test.ts       # API integration tests
│
├── e2e/                  # End-to-end tests
│   ├── journey-flow.spec.ts
│   ├── settings.spec.ts
│   └── artifacts.spec.ts
│
├── setup.ts              # Jest setup file
├── jest.config.js        # Jest configuration
└── playwright.config.ts  # Playwright configuration
```

## 🧪 Test Types

### Unit Tests

Test individual functions and classes in isolation:

```typescript
describe('ClaudeService', () => {
  it('should execute prompt with Extended Thinking', async () => {
    const service = new ClaudeService('test-key');
    const result = await service.execute({
      prompt: 'Test',
      extendedThinking: true
    });

    expect(result.thinking).toBeDefined();
  });
});
```

### Integration Tests

Test component interactions:

```typescript
describe('Database Integration', () => {
  it('should create journey with stages', async () => {
    const db = new DatabaseService(':memory:');
    const journey = await db.createJourney('Test');

    const stage = await db.createStage({
      journeyId: journey.id,
      type: 'discovering',
      // ...
    });

    expect(stage.journeyId).toBe(journey.id);
  });
});
```

### E2E Tests

Test complete user workflows:

```typescript
test('should complete full journey flow', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="input"]', 'Test topic');
  await page.click('[data-testid="start"]');

  // Wait for journey completion
  await expect(page.locator('.stage-complete')).toHaveCount(8);
});
```

## 🔧 Configuration

### Jest Configuration

Located in `jest.config.js`:
- TypeScript support via ts-jest
- Coverage collection from src/ directory
- Mocks for Electron APIs

### Playwright Configuration

Located in `playwright.config.ts`:
- Multi-browser testing (Chromium, Electron)
- Automatic test retries on failure
- Screenshot and video capture on failure

## 📊 Coverage Reports

Coverage reports are generated in multiple formats:
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`
- **JSON**: `coverage/coverage-final.json`

View HTML report:
```bash
npm run test:coverage
```

## 🎭 Playwright E2E Tests

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run playwright:report
```

### E2E Test Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Wait for elements** before interacting
3. **Test user flows**, not implementation details
4. **Handle async operations** properly
5. **Clean up** between tests

## 🔍 Debugging Tests

### Jest Tests

```bash
# Run specific test file
npm test -- ClaudeService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should execute"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Tests

```bash
# Debug mode
npx playwright test --debug

# UI mode for interactive debugging
npm run test:e2e:ui

# Trace viewer
npx playwright show-trace trace.zip
```

## 🚦 CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Scheduled nightly builds

See `.github/workflows/test.yml` for CI configuration.

## 📝 Writing New Tests

### Unit Test Template

```typescript
import { ServiceName } from '../../../src/lib/services/ServiceName';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should do something', () => {
      const result = service.methodName();
      expect(result).toBe(expected);
    });

    it('should handle errors', () => {
      expect(() => service.methodName()).toThrow();
    });
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should perform action', async ({ page }) => {
    // Arrange
    const button = page.locator('[data-testid="button"]');

    // Act
    await button.click();

    // Assert
    await expect(page.locator('[data-testid="result"]'))
      .toContainText('Expected');
  });
});
```

## 🔒 Test Data Management

### Mock Data

Mock data is stored in `tests/__mocks__/`:
- `journey.mock.ts` - Journey test data
- `stage.mock.ts` - Stage test data
- `artifact.mock.ts` - Artifact test data

### Test Fixtures

Playwright fixtures in `tests/e2e/fixtures/`:
- User profiles
- API responses
- Database states

## 🎯 Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Avoid testing internal implementation details

2. **Keep Tests Independent**
   - Each test should run in isolation
   - Use beforeEach/afterEach for setup/cleanup

3. **Use Descriptive Names**
   - Test names should describe the expected behavior
   - Follow pattern: "should [expected behavior] when [condition]"

4. **Arrange-Act-Assert**
   - Set up test data (Arrange)
   - Execute the code (Act)
   - Verify results (Assert)

5. **Mock External Dependencies**
   - Mock API calls, file system, databases
   - Keep tests fast and reliable

6. **Test Edge Cases**
   - Empty inputs
   - Boundary values
   - Error conditions
   - Concurrent operations

## 📈 Performance Testing

Run performance benchmarks:

```bash
npm run test:performance
```

Performance targets:
- App startup: < 2 seconds
- Stage rendering: < 100ms
- Database queries: < 50ms
- API responses: < 200ms

## 🐛 Troubleshooting

### Tests Failing Locally

1. Clear Jest cache: `npx jest --clearCache`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node version: `node --version` (should be 18+)

### Playwright Issues

1. Reinstall browsers: `npx playwright install`
2. Check browser versions: `npx playwright --version`
3. View trace: `npx playwright show-trace trace.zip`

### Coverage Issues

1. Clear coverage: `rm -rf coverage`
2. Run with verbose: `npm test -- --verbose`
3. Check uncovered files in HTML report

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain coverage thresholds
4. Update test documentation

## 📞 Support

For testing issues:
- Check existing test examples
- Review test documentation
- Ask in team discussions

---

**Remember**: Good tests are the foundation of maintainable software. Invest time in writing quality tests—they pay dividends in confidence and velocity.
