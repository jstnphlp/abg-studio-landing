import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const output = "docs/verification/logo-theme";
const protectedFiles = JSON.parse(
  await readFile(`${output}/protected-hashes.json`, "utf8"),
);
for (const [file, hash] of Object.entries(protectedFiles))
  assert.equal(
    createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
    hash,
    file,
  );
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const mode of ["desktop", "mobile", "webgl-unavailable"]) {
    const context = await browser.newContext({
      viewport:
        mode === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
      reducedMotion: "reduce",
      ...(mode === "mobile" ? { isMobile: true, hasTouch: true } : {}),
    });
    if (mode === "webgl-unavailable")
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (...args) {
          return String(args[0]).includes("webgl")
            ? null
            : original.apply(this, args);
        };
      });
    const page = await context.newPage();
    const errors = [],
      models = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.url().endsWith("/brand/abg-logo.glb"))
        models.push(request.url());
    });
    await page.goto(process.env.VERIFY_URL ?? "http://localhost:3000", {
      waitUntil: "networkidle",
    });
    if (mode !== "webgl-unavailable")
      await page.waitForFunction(
        () =>
          document.querySelector(".abg-logo-canvas")?.dataset.ready === "true",
      );
    else await page.getByText("Static logo preview", { exact: true }).waitFor();
    await page.evaluate(() => {
      window.__themeCanvas = document.querySelector(".abg-logo-canvas canvas");
      scrollTo({ top: 0, behavior: "instant" });
    });
    await page.screenshot({ path: `${output}/${mode}-light.png` });
    const toggle = page.getByRole("switch", { name: "Dark mode" });
    await toggle.click();
    await page.waitForFunction(
      () => document.documentElement.dataset.abgTheme === "dark",
    );
    await page.waitForTimeout(300);
    assert.equal(
      await page.evaluate(
        () =>
          document.querySelector(".abg-logo-canvas canvas") ===
          window.__themeCanvas,
      ),
      true,
    );
    if (mode === "webgl-unavailable") {
      const image = page.locator(".abg-logo-fallback");
      assert(await image.isVisible());
      assert(
        (await image.getAttribute("src")).endsWith("abg-logo-dark-mode.webp"),
      );
      await image.evaluate((i) => i.decode());
    } else assert.equal(models.length, 1);
    await page.screenshot({ path: `${output}/${mode}-dark.png` });
    await page
      .locator(".abg-calendar-grid button:not([disabled])")
      .first()
      .click();
    await page.getByRole("button", { name: "Continue" }).click();
    const name = page.getByLabel("What should we call you?");
    await name.fill("Theme Preview Guest");
    await toggle.evaluate((button) => button.click());
    assert.equal(await name.inputValue(), "Theme Preview Guest");
    assert.equal(await toggle.getAttribute("aria-checked"), "false");
    if (mode !== "webgl-unavailable") assert.equal(models.length, 1);
    await toggle.evaluate((button) => button.click());
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await toggle.getAttribute("aria-checked"), "true");
    if (mode !== "webgl-unavailable")
      await page.waitForFunction(
        () =>
          document.querySelector(".abg-logo-canvas")?.dataset.ready === "true",
      );
    else {
      await page.getByText("Static logo preview", { exact: true }).waitFor();
      assert(
        (await page.locator(".abg-logo-fallback").getAttribute("src")).endsWith(
          "abg-logo-dark-mode.webp",
        ),
      );
    }
    assert.deepEqual(errors, []);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    results.push({
      mode,
      sameCanvasOnToggle: true,
      bookingValuePreserved: true,
      persistedDarkMode: true,
      noJavascriptErrors: true,
      noOverflow: true,
    });
    await context.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(results);
} finally {
  await browser.close();
}
