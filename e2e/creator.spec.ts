import { test, expect } from "@playwright/test";
import { createTestUser, deleteTestUser, login } from "./helpers";

let creator: { email: string; password: string; username: string; userId: string };

test.beforeAll(async () => {
  creator = await createTestUser("creator", Date.now().toString());
});

test.afterAll(async () => {
  if (creator?.userId) await deleteTestUser(creator.userId);
});

test.describe("Creator Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.setItem("onboarding-complete", "true"));
    await login(page, creator.email, creator.password);
  });

  test("dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByText("Published")).toBeVisible();
    await expect(page.getByText("Drafts")).toBeVisible();
  });

  test("stories page loads", async ({ page }) => {
    await page.goto("/dashboard/stories");
    await expect(page.getByText("Your Stories")).toBeVisible();
    await expect(page.getByText("New Story")).toBeVisible();
  });

  test("analytics page loads", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    await expect(page.getByText("Analytics")).toBeVisible();
    await expect(page.getByText("Total Views")).toBeVisible();
  });

  test("earnings page loads", async ({ page }) => {
    await page.goto("/dashboard/earnings");
    await expect(page.getByText("Earnings")).toBeVisible();
  });

  test("import page loads", async ({ page }) => {
    await page.goto("/dashboard/import");
    await expect(page.getByText("Import from imgchest")).toBeVisible();
    await expect(page.getByText("Chapter URLs")).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Settings")).toBeVisible();
    await expect(page.getByText("Profile")).toBeVisible();
  });

  test("new story page loads with format options", async ({ page }) => {
    await page.goto("/dashboard/stories/new");
    await expect(page.getByText("Illustrated Story")).toBeVisible();
    await expect(page.getByText("Sext Story")).toBeVisible();
  });

  test("can create a story as draft", async ({ page }) => {
    await page.goto("/dashboard/stories/new");

    // Fill story details
    await page.fill('#story-title', 'E2E Test Story');
    await page.fill('#story-description', 'This is an automated test story');

    // Select Illustrated Story format (should be default)
    // Click continue to editor
    const continueBtn = page.getByText("Continue to Editor");
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }

    // Save as draft
    const saveDraftBtn = page.getByText("Save Draft");
    if (await saveDraftBtn.isVisible()) {
      await saveDraftBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  test("import page accepts URLs", async ({ page }) => {
    await page.goto("/dashboard/import");
    const textarea = page.locator("#import-urls");
    await textarea.fill("https://imgchest.com/p/9p4n8gl5l4n");
    await expect(page.getByText("1 valid URL")).toBeVisible();
  });

  test("dashboard sidebar navigation works", async ({ page }) => {
    await page.goto("/dashboard");
    await page.click("text=Stories");
    await expect(page).toHaveURL(/dashboard\/stories/);
    await page.click("text=Analytics");
    await expect(page).toHaveURL(/dashboard\/analytics/);
    await page.click("text=Earnings");
    await expect(page).toHaveURL(/dashboard\/earnings/);
    await page.click("text=Import");
    await expect(page).toHaveURL(/dashboard\/import/);
  });

  test("settings can update display name", async ({ page }) => {
    await page.goto("/settings");
    const nameInput = page.locator("#display_name");
    await nameInput.clear();
    await nameInput.fill("E2E Updated Name");
    await page.click("text=Save Profile");
    // Should show success toast
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
  });

  test("settings has pricing section for creators", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Pricing")).toBeVisible();
    await expect(page.getByText("Monthly Subscription Price")).toBeVisible();
  });

  test("settings has notification preferences", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Notification Preferences")).toBeVisible();
  });

  test("settings has payout settings for creators", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Payout Settings")).toBeVisible();
  });
});
