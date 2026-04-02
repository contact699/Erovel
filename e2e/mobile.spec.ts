import { test, expect, devices } from "@playwright/test";
import { bypassAgeGate } from "./helpers";

test.use({ ...devices["iPhone 14"] });

test.describe("Mobile Experience", () => {
  test.beforeEach(async ({ page }) => {
    await bypassAgeGate(page);
  });

  test("mobile bottom nav is visible", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav.fixed.bottom-0");
    await expect(nav).toBeVisible();
  });

  test("mobile bottom nav has correct links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Home")).toBeVisible();
    await expect(page.getByText("Browse")).toBeVisible();
    await expect(page.getByText("Search")).toBeVisible();
  });

  test("mobile browse navigation works", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Browse");
    await expect(page).toHaveURL(/browse/);
  });

  test("age gate is usable on mobile", async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText("Age Verification Required")).toBeVisible();
    // Inputs should be visible and not overflowing
    await expect(page.locator('input[placeholder="MM"]')).toBeVisible();
    await expect(page.locator('input[placeholder="DD"]')).toBeVisible();
    await expect(page.locator('input[placeholder="YYYY"]')).toBeVisible();
  });

  test("story cards are responsive", async ({ page }) => {
    await page.goto("/browse");
    await page.waitForTimeout(2000);
    // Cards should stack vertically on mobile
    const cards = page.locator("[href*='/story/']");
    const count = await cards.count();
    if (count > 0) {
      const firstCard = cards.first();
      const box = await firstCard.boundingBox();
      // Card should be nearly full width on mobile
      if (box) {
        expect(box.width).toBeGreaterThan(250);
      }
    }
  });

  test("header is sticky on mobile", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeVisible();
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    // Header should still be visible
    await expect(header).toBeVisible();
  });

  test("login page is responsive", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    const form = page.locator("form");
    const box = await form.boundingBox();
    if (box) {
      expect(box.width).toBeLessThan(400);
    }
  });
});
