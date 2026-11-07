// Focused appearance checks against the already-running local application.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const output = "docs/verification/appearance";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const mode of [
    "desktop",
    "mobile",
    "reduced-motion",
    "blocked-storage",
  ]) {
    const context = await browser.newContext({
      viewport:
        mode === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
      ...(mode === "mobile" ? { isMobile: true, hasTouch: true } : {}),
      ...(mode === "reduced-motion" ? { reducedMotion: "reduce" } : {}),
    });
    if (mode === "blocked-storage")
      await context.addInitScript(() => {
        Storage.prototype.getItem = () => {
          throw new Error("Blocked storage");
        };
        Storage.prototype.setItem = () => {
          throw new Error("Blocked storage");
        };
      });
    const page = await context.newPage();
    const errors = [],
      hydrationErrors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydration|did not match/i.test(message.text())
      )
        hydrationErrors.push(message.text());
    });
    await page.goto(process.env.VERIFY_URL ?? "http://localhost:3000", {
      waitUntil: "networkidle",
    });
    await page.waitForFunction(
      () =>
        document.querySelector(".abg-logo-canvas")?.dataset.ready === "true",
    );
    const toggle = page.getByRole("switch", { name: "Dark mode" });
    assert.equal(await toggle.getAttribute("aria-checked"), "false");
    assert.equal(await page.locator(".abg-stars").isVisible(), false);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    if (mode === "desktop")
      await page.screenshot({ path: `${output}/light.png` });
    await page.evaluate(() => {
      window.__originalLogoCanvas = document.querySelector(
        ".abg-logo-canvas canvas",
      );
    });
    await toggle.focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(
      () => document.documentElement.dataset.abgTheme === "dark",
    );
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector(".abg-nav-book")).color ===
        "rgb(236, 235, 232)",
    );
    assert.equal(await toggle.getAttribute("aria-checked"), "true");
    assert(await page.locator(".abg-stars").isVisible());
    assert.equal(
      await page.evaluate(
        () =>
          document.querySelector(".abg-logo-canvas canvas") ===
          window.__originalLogoCanvas,
      ),
      true,
    );
    assert.equal(await page.locator(".abg-splash").count(), 0);
    if (mode === "desktop" || mode === "mobile") {
      await page.screenshot({
        path: `${output}/${mode === "desktop" ? "dark" : "mobile-dark"}.png`,
      });
    }
    if (mode === "reduced-motion") {
      assert.equal(
        await page
          .locator(".abg-stars span")
          .first()
          .evaluate((element) => getComputedStyle(element).animationName),
        "none",
      );
    }
    const rect = await toggle.boundingBox();
    assert(
      rect.x >= 0 && rect.x + rect.width <= (mode === "mobile" ? 390 : 1440),
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    if (mode !== "blocked-storage") {
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForFunction(
        () =>
          document.querySelector(".abg-logo-canvas")?.dataset.ready === "true",
      );
      assert.equal(await toggle.getAttribute("aria-checked"), "true");
      assert(await page.locator(".abg-stars").isVisible());
    }
    await page
      .locator(".abg-calendar-grid button:not([disabled])")
      .first()
      .click();
    await page.getByRole("button", { name: "Continue" }).click();
    const name = page.getByLabel("What should we call you?");
    await name.fill("Appearance Guest");
    // Invoke the accessible control while the mobile header is above the fold:
    // using the DOM click avoids scrolling the booking step out of view.
    await toggle.evaluate((button) => button.click());
    assert.equal(await name.inputValue(), "Appearance Guest");
    assert.equal(await toggle.getAttribute("aria-checked"), "false");
    assert.equal(await page.locator(".abg-stars").isVisible(), false);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Choose a preferred time").selectOption("10:30");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Preview request" }).click();
    assert(
      await page
        .getByRole("region", { name: "Request preview" })
        .getByText("Appearance Guest")
        .isVisible(),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(hydrationErrors, []);
    results.push({
      mode,
      switchWorks: true,
      keyboardWorks: true,
      savedPreference: mode !== "blocked-storage",
      bookingStatePreserved: true,
      noOverflow: true,
      noJavascriptOrHydrationErrors: true,
    });
    await context.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
