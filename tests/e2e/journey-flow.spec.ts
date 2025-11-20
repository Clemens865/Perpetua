/**
 * E2E tests for complete journey flows
 * Tests the full user experience with Playwright
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Journey Creation and Exploration', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should display welcome screen on first launch', async () => {
    await expect(page.locator('h1')).toContainText('Perpetua');
    await expect(page.locator('[data-testid="start-journey-input"]')).toBeVisible();
  });

  test('should start a new journey', async () => {
    // Enter journey input
    const input = page.locator('[data-testid="start-journey-input"]');
    await input.fill('How do neural networks learn?');

    // Click start button
    const startButton = page.locator('[data-testid="start-journey-button"]');
    await startButton.click();

    // Wait for first stage to appear
    await page.waitForSelector('[data-testid="stage-card"]', { timeout: 10000 });

    // Verify journey started
    const stageCard = page.locator('[data-testid="stage-card"]').first();
    await expect(stageCard).toBeVisible();
    await expect(stageCard).toContainText('Discovering');
  });

  test('should show all 8 stages completing in sequence', async () => {
    // Start journey
    await page.locator('[data-testid="start-journey-input"]').fill('Test topic');
    await page.locator('[data-testid="start-journey-button"]').click();

    // Wait for journey to progress through stages
    const stages = [
      'Discovering',
      'Chasing',
      'Solving',
      'Challenging',
      'Questioning',
      'Searching',
      'Imagining',
      'Building'
    ];

    for (const stageName of stages) {
      await expect(
        page.locator(`[data-testid="stage-card"]:has-text("${stageName}")`)
      ).toBeVisible({ timeout: 30000 });
    }

    // Verify all stages completed
    const completedStages = await page.locator('[data-testid="stage-card"][data-status="complete"]').count();
    expect(completedStages).toBe(8);
  });

  test('should display Extended Thinking when available', async () => {
    await page.locator('[data-testid="start-journey-input"]').fill('Complex problem');
    await page.locator('[data-testid="start-journey-button"]').click();

    // Wait for stage with thinking
    await page.waitForSelector('[data-testid="thinking-section"]', { timeout: 15000 });

    const thinkingSection = page.locator('[data-testid="thinking-section"]').first();
    await expect(thinkingSection).toBeVisible();
    await expect(thinkingSection).toContainText('thinking', { ignoreCase: true });
  });

  test('should create and display artifacts', async () => {
    await page.locator('[data-testid="start-journey-input"]').fill('Build a React component');
    await page.locator('[data-testid="start-journey-button"]').click();

    // Wait for Building stage
    await page.waitForSelector('[data-testid="stage-card"]:has-text("Building")', { timeout: 60000 });

    // Check for artifacts
    const artifactCard = page.locator('[data-testid="artifact-card"]').first();
    await expect(artifactCard).toBeVisible();

    // Verify artifact has content
    await artifactCard.click();
    const artifactViewer = page.locator('[data-testid="artifact-viewer"]');
    await expect(artifactViewer).toBeVisible();
  });

  test('should pause and resume journey', async () => {
    await page.locator('[data-testid="start-journey-input"]').fill('Test');
    await page.locator('[data-testid="start-journey-button"]').click();

    // Wait for journey to start
    await page.waitForSelector('[data-testid="stage-card"]');

    // Pause journey
    const pauseButton = page.locator('[data-testid="pause-journey-button"]');
    await pauseButton.click();

    // Verify paused state
    await expect(page.locator('[data-testid="journey-status"]')).toContainText('Paused');

    // Resume journey
    const resumeButton = page.locator('[data-testid="resume-journey-button"]');
    await resumeButton.click();

    // Verify running state
    await expect(page.locator('[data-testid="journey-status"]')).toContainText('Running');
  });

  test('should stop journey early', async () => {
    await page.locator('[data-testid="start-journey-input"]').fill('Test');
    await page.locator('[data-testid="start-journey-button"]').click();

    // Wait for a few stages
    await page.waitForTimeout(5000);

    // Stop journey
    const stopButton = page.locator('[data-testid="stop-journey-button"]');
    await stopButton.click();

    // Confirm stop
    const confirmButton = page.locator('[data-testid="confirm-stop"]');
    await confirmButton.click();

    // Verify stopped state
    await expect(page.locator('[data-testid="journey-status"]')).toContainText('Stopped');
  });
});

test.describe('Journey History and Navigation', () => {
  test('should list previous journeys', async ({ page }) => {
    // Start multiple journeys
    for (let i = 0; i < 3; i++) {
      await page.goto('/');
      await page.locator('[data-testid="start-journey-input"]').fill(`Journey ${i + 1}`);
      await page.locator('[data-testid="start-journey-button"]').click();
      await page.waitForSelector('[data-testid="stage-card"]');

      // Stop journey
      await page.locator('[data-testid="stop-journey-button"]').click();
      await page.locator('[data-testid="confirm-stop"]').click();
    }

    // Navigate to history
    await page.locator('[data-testid="nav-history"]').click();

    // Verify journeys are listed
    const journeyItems = page.locator('[data-testid="journey-list-item"]');
    await expect(journeyItems).toHaveCount(3);
  });

  test('should open previous journey', async ({ page }) => {
    // Create a journey
    await page.goto('/');
    await page.locator('[data-testid="start-journey-input"]').fill('Previous journey');
    await page.locator('[data-testid="start-journey-button"]').click();
    await page.waitForSelector('[data-testid="stage-card"]');

    const journeyId = await page.locator('[data-testid="journey-id"]').textContent();

    // Navigate to history
    await page.locator('[data-testid="nav-history"]').click();

    // Click on journey
    await page.locator(`[data-testid="journey-list-item"][data-journey-id="${journeyId}"]`).click();

    // Verify journey opened
    await expect(page.locator('[data-testid="journey-id"]')).toHaveText(journeyId);
    await expect(page.locator('[data-testid="stage-card"]')).toBeVisible();
  });

  test('should export journey', async ({ page }) => {
    // Start journey
    await page.goto('/');
    await page.locator('[data-testid="start-journey-input"]').fill('Export test');
    await page.locator('[data-testid="start-journey-button"]').click();
    await page.waitForSelector('[data-testid="stage-card"]');

    // Open journey menu
    await page.locator('[data-testid="journey-menu"]').click();

    // Click export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-testid="export-journey"]').click()
    ]);

    // Verify download started
    expect(download.suggestedFilename()).toContain('.json');
  });
});

test.describe('Settings and Configuration', () => {
  test('should open settings panel', async ({ page }) => {
    await page.goto('/');

    // Click settings button
    await page.locator('[data-testid="settings-button"]').click();

    // Verify settings panel opened
    await expect(page.locator('[data-testid="settings-panel"]')).toBeVisible();
  });

  test('should configure API key', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="settings-button"]').click();

    // Enter API key
    const apiKeyInput = page.locator('[data-testid="api-key-input"]');
    await apiKeyInput.fill('sk-ant-test-key-123');

    // Save settings
    await page.locator('[data-testid="save-settings"]').click();

    // Verify saved
    await expect(page.locator('[data-testid="settings-saved-toast"]')).toBeVisible();
  });

  test('should toggle Extended Thinking', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="settings-button"]').click();

    // Toggle Extended Thinking
    const toggle = page.locator('[data-testid="extended-thinking-toggle"]');
    await toggle.click();

    // Verify state changed
    await expect(toggle).toHaveAttribute('aria-checked', 'false');

    // Save and verify
    await page.locator('[data-testid="save-settings"]').click();

    // Reload and check persisted
    await page.reload();
    await page.locator('[data-testid="settings-button"]').click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('should change theme', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="settings-button"]').click();

    // Change to dark theme
    await page.locator('[data-testid="theme-selector"]').selectOption('dark');

    // Verify theme applied
    await expect(page.locator('body')).toHaveClass(/dark/);
  });
});

test.describe('Performance and Responsiveness', () => {
  test('should render 50+ stages without performance issues', async ({ page }) => {
    await page.goto('/');

    // Configure for many stages
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="max-stages-input"]').fill('60');
    await page.locator('[data-testid="save-settings"]').click();

    // Start journey
    await page.locator('[data-testid="start-journey-input"]').fill('Long journey');
    await page.locator('[data-testid="start-journey-button"]').click();

    // Let it run for a while
    await page.waitForTimeout(30000);

    // Check performance
    const stageCount = await page.locator('[data-testid="stage-card"]').count();
    expect(stageCount).toBeGreaterThan(10);

    // Verify smooth scrolling
    const scrollContainer = page.locator('[data-testid="stage-stream"]');
    await scrollContainer.evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(100);
    await scrollContainer.evaluate(el => el.scrollTop = el.scrollHeight);

    // Should scroll smoothly without janks
  });

  test('should handle rapid user interactions', async ({ page }) => {
    await page.goto('/');

    // Rapidly start and stop journeys
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="start-journey-input"]').fill(`Rapid ${i}`);
      await page.locator('[data-testid="start-journey-button"]').click();
      await page.waitForTimeout(1000);
      await page.locator('[data-testid="stop-journey-button"]').click();
      await page.locator('[data-testid="confirm-stop"]').click();
    }

    // App should still be responsive
    await expect(page.locator('[data-testid="start-journey-input"]')).toBeEnabled();
  });
});

test.describe('Error Handling', () => {
  test('should display error for invalid API key', async ({ page }) => {
    await page.goto('/');

    // Configure invalid API key
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('[data-testid="api-key-input"]').fill('invalid-key');
    await page.locator('[data-testid="save-settings"]').click();

    // Try to start journey
    await page.locator('[data-testid="start-journey-input"]').fill('Test');
    await page.locator('[data-testid="start-journey-button"]').click();

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid API key');
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true);

    await page.goto('/');
    await page.locator('[data-testid="start-journey-input"]').fill('Test');
    await page.locator('[data-testid="start-journey-button"]').click();

    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
  });
});
