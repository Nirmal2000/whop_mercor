import { test, expect } from "@playwright/test";

const EXPERIENCE_ID = process.env.PLAYWRIGHT_EXPERIENCE_ID ?? "demo-experience";

test.describe("Job listings grid", () => {
  test("renders the listing grid with cards", async ({ page }) => {
    await page.goto(`/experiences/${EXPERIENCE_ID}/listings`);
    await expect(page.getByTestId("listing-grid")).toBeVisible();
    await expect(page.getByTestId("listing-card").first()).toBeVisible();
  });
});
