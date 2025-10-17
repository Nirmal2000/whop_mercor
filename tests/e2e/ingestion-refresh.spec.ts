import { test, expect } from "@playwright/test";

const COMPANY_ID = process.env.PLAYWRIGHT_COMPANY_ID ?? "demo-company";

test.describe("Admin listings refresh", () => {
  test.skip(!process.env.PLAYWRIGHT_REFRESH_TEST, "Refresh test disabled by default");

  test("triggers listings refresh via admin endpoint", async ({ request }) => {
    const response = await request.post(`/api/admin/listings/refresh`);
    expect(response.status()).toBe(202);

    const body = await response.json();
    expect(body).toMatchObject({ status: "succeeded" });
  });
});
