import { expect, test } from "@playwright/test";

test("public landing includes a booking preview and portfolio sections", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "ABG Studios — a new expression of beauty" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /Make it yours/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /The service edit/i })).toBeVisible();
  await expect(page.getByText(/NO BOOKINGS ARE SENT/i)).toBeVisible();

  await page.getByLabel("01 / Your service").selectOption("Nail artistry (demo)");
  await page.getByLabel("02 / Preferred date").fill("2099-10-21");
  await page.getByLabel("03 / Preferred time").selectOption("10:30");
  await page.getByLabel("04 / Your name").fill("Demo Visitor");
  await page.getByLabel("05 / Email address").fill("visitor@example.test");
  await page.getByRole("button", { name: "Preview request" }).click();
  await expect(page.getByText(/Request preview created/i)).toBeVisible();
  await expect(page.getByText(/NOT been sent/i)).toBeVisible();
});
