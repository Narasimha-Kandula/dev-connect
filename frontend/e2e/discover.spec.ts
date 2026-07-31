import { test, expect } from '@playwright/test';
import {
  setupDiscoverPage,
  setupDiscoverPageWithCustomProfiles,
  setupApiMocks,
  MOCK_TOKEN,
} from './discover/helpers';

// ─── Auth via HTTP header (middleware checks Authorization header) ───
test.use({
  extraHTTPHeaders: {
    Authorization: `Bearer ${MOCK_TOKEN}`,
  },
});

// ─── Setup ───────────────────────────────────────────────

test.describe('Discover Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupDiscoverPage(page);
  });

  // ─── Render & Layout ─────────────────────────────────

  test.describe('render and layout', () => {
    test('shows discover page header with sort and filter controls', async ({ page }) => {
      await expect(page.locator('h1')).toHaveText('Discover Developers');
      await expect(page.locator('select[title="Sort order"]')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeVisible();
    });

    test('shows the search bar with placeholder text', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search developers/i);
      await expect(searchInput).toBeVisible();
    });

    test('shows the recently joined section when profiles are loaded', async ({ page }) => {
      await expect(page.getByText('Recently Joined')).toBeVisible();
    });

    test('renders the first profile card with name and headline', async ({ page }) => {
      // Main swipe card is inside a [class*="cursor-grab"] container
      const card = page.locator('[class*="cursor-grab"]').first();
      await expect(card.getByText('Alice Chen')).toBeVisible();
      await expect(card.getByText('Full Stack Engineer')).toBeVisible();
    });

    test('shows skill tags on the profile card', async ({ page }) => {
      const card = page.locator('[class*="cursor-grab"]').first();
      // Use skills NOT present in Alice's bio to avoid matching bio text
      await expect(card.getByText('TypeScript')).toBeVisible();
      await expect(card.getByText('GraphQL')).toBeVisible();
    });

    test('shows reputation score on the profile card', async ({ page }) => {
      const card = page.locator('[class*="cursor-grab"]').first();
      await expect(card.locator('p.text-primary')).toHaveText('1250');
      await expect(card.getByText('pts', { exact: true })).toBeVisible();
    });

    test('shows location and experience level on the card', async ({ page }) => {
      const card = page.locator('[class*="cursor-grab"]').first();
      await expect(card.getByText('San Francisco, CA')).toBeVisible();
      await expect(card.getByText('senior')).toBeVisible();
    });

    test('toggles filter panel visibility when clicking Filters button', async ({ page }) => {
      const filtersButton = page.getByRole('button', { name: 'Filters', exact: true });
      await filtersButton.click();
      await expect(page.getByPlaceholder(/add skill/i)).toBeVisible();
      await expect(page.getByText('Apply Filters')).toBeVisible();

      await filtersButton.click();
      await expect(page.getByPlaceholder(/add skill/i)).not.toBeVisible();
    });

    test('shows desktop SwipeControls on desktop viewport', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop only');
      const likeButton = page.locator('button[title="Like"]').first();
      await expect(likeButton).toBeVisible();
    });
  });

  // ─── Swipe Gestures (desktop only — mobile has dedicated bottom-sheet tests) ───

  test.describe('swipe gestures', () => {
    test('swipes right (like) by dragging the card', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop only; mobile uses bottom sheet');
      const card = page.locator('[class*="cursor-grab"]').first();
      await expect(card).toBeVisible();

      const box = await card.boundingBox();
      expect(box).toBeTruthy();
      const startX = box!.x + box!.width / 2;
      const startY = box!.y + box!.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 300, startY, { steps: 20 });
      await page.mouse.up();

      // After swipe, Alice Chen's card is gone and Bob Smith should appear in the card area
      const nextCard = page.locator('[class*="cursor-grab"]').first();
      await expect(nextCard.getByText('Bob Smith')).toBeVisible({ timeout: 5000 });
    });

    test('swipes left (pass) by dragging the card', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop only; mobile uses bottom sheet');
      const card = page.locator('[class*="cursor-grab"]').first();
      await expect(card).toBeVisible();

      const box = await card.boundingBox();
      expect(box).toBeTruthy();
      const startX = box!.x + box!.width / 2;
      const startY = box!.y + box!.height / 2;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX - 300, startY, { steps: 20 });
      await page.mouse.up();

      const nextCard = page.locator('[class*="cursor-grab"]').first();
      await expect(nextCard.getByText('Bob Smith')).toBeVisible({ timeout: 5000 });
    });

    test('swipes right by clicking the Like button', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop only; mobile uses bottom sheet');
      const likeButton = page.locator('button[title="Like"]').first();
      await likeButton.click();
      const nextCard = page.locator('[class*="cursor-grab"]').first();
      await expect(nextCard.getByText('Bob Smith')).toBeVisible({ timeout: 5000 });
    });

    test('swipes left by clicking the Pass button', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop only; mobile uses bottom sheet');
      const passButton = page.locator('button[title="Pass"]').first();
      await passButton.click();
      const nextCard = page.locator('[class*="cursor-grab"]').first();
      await expect(nextCard.getByText('Bob Smith')).toBeVisible({ timeout: 5000 });
    });

    test('swipes super by clicking the Super Like button', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop only; mobile uses bottom sheet');
      const superLikeButton = page.locator('button[title="Super Like"]').first();
      await superLikeButton.click();
      const nextCard = page.locator('[class*="cursor-grab"]').first();
      await expect(nextCard.getByText('Bob Smith')).toBeVisible({ timeout: 5000 });
    });

    test('swipes through all profiles and card area becomes empty', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop only; mobile uses bottom sheet');
      const likeButton = page.locator('button[title="Like"]').first();
      for (let i = 0; i < 6; i++) {
        await expect(likeButton).toBeVisible({ timeout: 3000 });
        await likeButton.click();
        await page.waitForTimeout(600);
      }
      // After all profiles, the swipe card area should be empty (no cursor-grab cards)
      await expect(page.locator('[class*="cursor-grab"]')).toHaveCount(0, { timeout: 5000 });
    });

    test('shows undo button briefly after swiping', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop only; mobile uses bottom sheet');
      const likeButton = page.locator('button[title="Like"]').first();
      await likeButton.click();
      await expect(page.getByRole('button', { name: /undo/i })).toBeVisible({ timeout: 3000 });
    });
  });

  // ─── Profile Preview (Mobile) ─────────────────────────

  test.describe('profile preview on mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('opens preview modal when clicking the card', async ({ page }) => {
      await page.reload();
      await setupApiMocks(page);
      await expect(page.getByText('Alice Chen').first()).toBeVisible({ timeout: 10000 });

      const card = page.locator('[class*="cursor-grab"]').first();
      await card.click({ force: true });

      await expect(page.getByText('View Full Profile')).toBeVisible({ timeout: 3000 });
      await expect(page.getByText('Send Message')).toBeVisible();

      // Close the modal by clicking outside
      await page.locator('div.fixed.inset-0').first().click({ position: { x: 0, y: 0 } });
      await expect(page.getByText('View Full Profile')).not.toBeVisible({ timeout: 3000 });
    });
  });

  // ─── Filter Panel ─────────────────────────────────────

  test.describe('filter panel', () => {
    test('opens filter panel and shows all inputs', async ({ page }) => {
      await page.getByRole('button', { name: 'Filters', exact: true }).click();

      await expect(page.getByPlaceholder(/add skill/i)).toBeVisible();
      await expect(page.getByPlaceholder(/location/i)).toBeVisible();
      await expect(page.getByText('Apply Filters')).toBeVisible();
      await expect(page.getByText('Clear All')).toBeVisible();
    });

    test('allows adding a skill filter', async ({ page }) => {
      await page.getByRole('button', { name: 'Filters', exact: true }).click();

      // The skill suggestion dropdown is inside the filter panel (CardContent)
      const filterPanel = page.locator('div.space-y-3').first();
      const skillInput = filterPanel.getByPlaceholder(/add skill/i);
      await skillInput.fill('React');

      // Click the suggestion that appears
      await filterPanel.getByText('React').first().waitFor({ state: 'visible', timeout: 5000 });
      await filterPanel.getByText('React').first().click();

      // The skill tag should be visible inside the filter panel
      await expect(filterPanel.getByText('React').first()).toBeVisible();
    });

    test('allows setting location filter', async ({ page }) => {
      await page.getByRole('button', { name: 'Filters', exact: true }).click();

      const locationInput = page.getByPlaceholder(/location/i);
      await locationInput.fill('San Francisco');
      await expect(locationInput).toHaveValue('San Francisco');
    });

    test('allows selecting experience level', async ({ page }) => {
      await page.getByRole('button', { name: 'Filters', exact: true }).click();

      const experienceSelect = page.locator('select').nth(1);
      await experienceSelect.selectOption('senior');
      await expect(experienceSelect).toHaveValue('senior');
    });

    test('toggles remote and available checkboxes', async ({ page }) => {
      await page.getByRole('button', { name: 'Filters', exact: true }).click();

      const remoteCheckbox = page.getByText('Remote only').locator('input[type="checkbox"]');
      await remoteCheckbox.check();
      await expect(remoteCheckbox).toBeChecked();
      await remoteCheckbox.uncheck();
      await expect(remoteCheckbox).not.toBeChecked();

      const availableCheckbox = page.getByText('Available for hire').locator('input[type="checkbox"]');
      await availableCheckbox.check();
      await expect(availableCheckbox).toBeChecked();
    });

    test('clears all filters when clicking Clear All', async ({ page }) => {
      await page.getByRole('button', { name: 'Filters', exact: true }).click();

      const filterPanel = page.locator('div.space-y-3').first();
      const skillInput = filterPanel.getByPlaceholder(/add skill/i);
      await skillInput.fill('React');
      await filterPanel.getByText('React').first().waitFor({ state: 'visible', timeout: 5000 });
      await filterPanel.getByText('React').first().click();

      await page.getByPlaceholder(/location/i).fill('San Francisco');
      await page.getByText('Remote only').locator('input[type="checkbox"]').check();

      await page.getByText('Clear All').click();

      await expect(page.getByPlaceholder(/location/i)).toHaveValue('');
    });
  });

  // ─── Search Functionality ─────────────────────────────

  test.describe('search functionality', () => {
    test('shows autocomplete results when typing', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search developers/i);
      await searchInput.fill('alex');

      // Scope search results to the autocomplete dropdown
      const resultsDropdown = page.locator(
        'div.absolute.z-30.mt-2.rounded-xl.border.border-border',
      ).first();
      await expect(resultsDropdown.getByText('Alice Chen')).toBeVisible({ timeout: 5000 });
      await expect(resultsDropdown.getByText('Full Stack Engineer')).toBeVisible();
    });

    test('shows no-results message for unmatched query', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search developers/i);
      await searchInput.fill('zzz');
      await expect(page.getByText('No developers found')).toBeVisible({ timeout: 5000 });
    });

    test('clears search results when clearing the input', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search developers/i);

      await searchInput.fill('alex');
      const resultsDropdown = page.locator(
        'div.absolute.z-30.mt-2.rounded-xl.border.border-border',
      ).first();
      await expect(resultsDropdown).toBeVisible({ timeout: 5000 });

      await searchInput.clear();
      await page.waitForTimeout(400);

      await expect(resultsDropdown).not.toBeVisible({ timeout: 3000 });
    });
  });

  // ─── Empty State ──────────────────────────────────────

  test.describe('empty state', () => {
    test('shows empty state when no profiles exist', async ({ page }) => {
      await setupDiscoverPageWithCustomProfiles(page, []);
      await expect(page.getByText("You've seen everyone")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Adjust filters or check back later')).toBeVisible();
      await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
    });
  });

  // ─── Mobile Bottom Sheet ──────────────────────────────

  test.describe('mobile bottom sheet', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test('shows bottom sheet with action buttons', async ({ page }) => {
      await page.reload();
      await setupApiMocks(page);
      await expect(page.getByText('Alice Chen').first()).toBeVisible({ timeout: 10000 });

      // Scope bottom sheet buttons — use getByRole with exact to avoid partial match with "Super Like"
      const bottomSheet = page.locator('.fixed.bottom-0');
      await expect(bottomSheet.getByRole('button', { name: 'Pass', exact: true })).toBeVisible();
      await expect(bottomSheet.getByRole('button', { name: 'Like', exact: true })).toBeVisible();
      await expect(bottomSheet.getByRole('button', { name: 'Super Like', exact: true })).toBeVisible();
    });

    test('shows progress counter on bottom sheet', async ({ page }) => {
      await page.reload();
      await setupApiMocks(page);
      await expect(page.getByText('Alice Chen').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('1 of 6')).toBeVisible();
    });

    test('swipes using bottom sheet Like button', async ({ page }) => {
      await page.reload();
      await setupApiMocks(page);
      await expect(page.getByText('Alice Chen').first()).toBeVisible({ timeout: 10000 });

      const bottomSheet = page.locator('.fixed.bottom-0');
      await bottomSheet.getByRole('button', { name: 'Like', exact: true }).click();
      await expect(page.getByText('Bob Smith').first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('2 of 6')).toBeVisible();
    });

    // Drag-gesture tests: only run on chromium-mobile project (page.mouse doesn't reliably
    // trigger Framer Motion drag on Desktop Chrome, even with hasTouch: true).
    test('swipes right (like) by dragging the card on mobile', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-mobile', 'Framer Motion drag requires mobile touch emulation');
      await page.reload();
      await setupApiMocks(page);
      await expect(page.getByText('Alice Chen').first()).toBeVisible({ timeout: 10000 });

      const card = page.locator('[class*="cursor-grab"]').first();
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box).toBeTruthy();
      const cx = box!.x + box!.width / 2;
      const cy = box!.y + box!.height / 2;

      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 250, cy, { steps: 20 });
      await page.mouse.up();

      await expect(page.getByText('Bob Smith').first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('2 of 6')).toBeVisible();
    });

    test('swipes left (pass) by dragging the card on mobile', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium-mobile', 'Framer Motion drag requires mobile touch emulation');
      await page.reload();
      await setupApiMocks(page);
      await expect(page.getByText('Alice Chen').first()).toBeVisible({ timeout: 10000 });

      const card = page.locator('[class*="cursor-grab"]').first();
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      expect(box).toBeTruthy();
      const cx = box!.x + box!.width / 2;
      const cy = box!.y + box!.height / 2;

      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx - 250, cy, { steps: 20 });
      await page.mouse.up();

      await expect(page.getByText('Bob Smith').first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('2 of 6')).toBeVisible();
    });

    test('swipes through all profiles using bottom sheet buttons on mobile', async ({ page }) => {
      await page.reload();
      await setupApiMocks(page);
      await expect(page.getByText('Alice Chen').first()).toBeVisible({ timeout: 10000 });

      const bottomSheet = page.locator('.fixed.bottom-0');
      const likeButton = bottomSheet.getByRole('button', { name: 'Like', exact: true });

      for (let i = 0; i < 6; i++) {
        await expect(likeButton).toBeVisible({ timeout: 3000 });
        await likeButton.click();
        await page.waitForTimeout(500);
      }

      await expect(page.locator('[class*="cursor-grab"]')).toHaveCount(0, { timeout: 8000 });
    });

    test('undo restores the previous profile on mobile', async ({ page }) => {
      await page.reload();
      await setupApiMocks(page);
      await expect(page.getByText('Alice Chen').first()).toBeVisible({ timeout: 10000 });

      // 1. Swipe right (Like) via bottom sheet button
      const bottomSheet = page.locator('.fixed.bottom-0');
      await bottomSheet.getByRole('button', { name: 'Like', exact: true }).click();

      // Let Framer Motion swipe animation settle before looking for undo
      await page.waitForTimeout(400);

      // 2. Wait for Undo button to appear in the bottom sheet
      const undoButton = bottomSheet.getByRole('button', { name: /undo/i });
      await expect(undoButton).toBeVisible({ timeout: 5000 });

      // 3. Undo the swipe — use force:true to avoid interception by animated elements
      await undoButton.click({ force: true });

      // 4. Verify Alice Chen is back and the counter resets to 1 of 6
      await expect(page.getByText('Alice Chen').first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('1 of 6')).toBeVisible();
    });
  });

  // ─── Undo Functionality (desktop only — mobile has dedicated bottom-sheet tests) ───

  test.describe('undo functionality', () => {
    test('undo restores the previous profile', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'chromium-mobile', 'Desktop only; mobile uses bottom sheet');
      const likeButton = page.locator('button[title="Like"]').first();
      await likeButton.click();

      await expect(page.getByRole('button', { name: /undo/i })).toBeVisible({ timeout: 3000 });

      await page.getByRole('button', { name: /undo/i }).click();
      // After undo, Alice Chen should be back in the card area
      const card = page.locator('[class*="cursor-grab"]').first();
      await expect(card.getByText('Alice Chen')).toBeVisible({ timeout: 3000 });
    });
  });

  // ─── Edge Cases ───────────────────────────────────────

  test.describe('edge cases', () => {
    test('handles profiles with minimal data (null bio, 0 reputation)', async ({ page }) => {
      const minimalProfiles = [
        {
          id: 'minimal-1',
          userId: 'minimal-user',
          displayName: 'Minimal User',
          headline: 'Developer',
          bio: null,
          avatarUrl: null,
          skills: [{ name: 'JavaScript', proficiency: 3 }],
          location: null,
          experienceLevel: null,
          reputationScore: 0,
        },
      ];

      await setupDiscoverPageWithCustomProfiles(page, minimalProfiles);
      const card = page.locator('[class*="cursor-grab"]').first();
      await expect(card.getByText('Minimal User')).toBeVisible({ timeout: 10000 });
      await expect(card.getByText('New')).toBeVisible();
    });
  });
});
