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


test("chrome hero preserves SVG artwork when WebGL is unavailable", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByRole("img", { name: "ABG Studios in reflective silver lettering" });
  await expect(logo).toBeVisible();
  await expect(logo.locator('img')).toHaveAttribute(
    "src",
    "/brand/abg-logo-fallback.svg",
  );
  await expect(logo.locator("canvas[data-abg-chrome]")).toHaveCount(1);
  const asset = await page.request.get("/brand/abg-logo-fallback.svg");
  expect(asset.ok()).toBe(true);
  const source = await page.request.get("/brand/chrome-logo.js");
  expect(source.ok()).toBe(true);
});
