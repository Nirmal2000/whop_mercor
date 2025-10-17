import { test, expect } from "@playwright/test";

const COMPANY_ID = process.env.PLAYWRIGHT_COMPANY_ID ?? "demo-company";

test.describe("Admin analytics dashboard", () => {
  test("blocks non-admin access", async ({ page }) => {
    const response = await page.goto(`/dashboard/${COMPANY_ID}/listings`);
    expect(response?.status()).toBe(403);
  });
});
