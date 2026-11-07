import { expect, test } from "@playwright/test";

test("public landing includes only the hero and booking preview", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "ABG Studios — a new expression of beauty",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Make it yours/i }),
  ).toBeVisible();
  await expect(page.locator("#about, #services, #work, .abg-outro, .abg-footer, .abg-booking-chrome")).toHaveCount(0);
  await expect(page.getByText(/NO BOOKINGS ARE SENT/i)).toBeVisible();

  await page
    .locator(".abg-calendar-grid button:not([disabled])")
    .first()
    .click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("What should we call you?").fill("Demo Visitor");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Choose a preferred time").selectOption("10:30");
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByLabel(/Anything we should know/)
    .fill("Pearl nail inspiration");
  await page.getByLabel("Add inspiration photos").setInputFiles({
    name: "inspiration.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2ioAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Preview request" }).click();
  const preview = page.getByRole("region", { name: "Request preview" });
  await expect(preview).toBeVisible();
  await expect(preview.getByText("Demo Visitor")).toBeVisible();
  await expect(
    preview.getByRole("img", { name: "inspiration.png" }),
  ).toBeVisible();
  await expect(page.getByText(/NOT been sent/i)).toBeVisible();
});
