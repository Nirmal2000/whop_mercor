import { test, expect } from "@playwright/test";

const EXPERIENCE_ID = process.env.PLAYWRIGHT_EXPERIENCE_ID ?? "demo-experience";

test.describe("Listing overlay", () => {
  test("shows and hides detail sidecar", async ({ page }) => {
    await page.goto(`/experiences/${EXPERIENCE_ID}/listings`);

    const firstCard = page.getByTestId("listing-card").first();
    await firstCard.click();

    const overlay = page.getByTestId("listing-overlay");
    await expect(overlay).toBeVisible();

    await overlay.getByRole("button", { name: /close/i }).click();
    await expect(overlay).toBeHidden();
  });
});
