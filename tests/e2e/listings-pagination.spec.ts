import { test, expect } from "@playwright/test";

const EXPERIENCE_ID = process.env.PLAYWRIGHT_EXPERIENCE_ID ?? "demo-experience";

test.describe("Listings pagination", () => {
  test("navigates between pages and updates indicators", async ({ page }) => {
    await page.goto(`/experiences/${EXPERIENCE_ID}/listings?page=1`);

    const nextButton = page.getByRole("button", { name: /next page/i });
    await expect(nextButton).toBeVisible();

    await nextButton.click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Page 2 of/)).toBeVisible();
  });
});
