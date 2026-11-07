import { chromium } from "@playwright/test";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";

const folder = "docs/verification/logo-refinement";
const variants = process.argv.slice(2);
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const variant of variants) {
    const context = await browser.newContext({
      viewport: { width: 2000, height: 1400 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/brand/abg-logo.glb", (route) =>
      route.fulfill({
        path: resolve(`${folder}/${variant}.glb`),
        contentType: "model/gltf-binary",
      }),
    );
    await page.goto(process.env.VERIFY_URL ?? "http://localhost:3000", {
      waitUntil: "networkidle",
    });
    await page.waitForFunction(
      () =>
        document.querySelector(".abg-logo-canvas")?.dataset.ready === "true",
    );
    await page.addStyleTag({
      content: `html,body,.abg-site,.abg-hero,.abg-hero-left{background:transparent!important;background-image:none!important;} .abg-site-noise,header,.abg-hero-right,.abg-hero-kicker,.abg-hero-lower{visibility:hidden!important;} .abg-hero-left .abg-live-logo{position:fixed!important;inset:0 auto auto 0!important;width:1800px!important;height:1212px!important;min-height:0!important;margin:0!important;}`,
    });
    await page.waitForTimeout(150);
    await page
      .locator(".abg-logo-canvas canvas")
      .screenshot({ path: `${folder}/${variant}.png`, omitBackground: true });
    if (errors.length) throw new Error(errors.join("\n"));
    await writeFile(
      `${folder}/${variant}-capture.json`,
      JSON.stringify(
        {
          variant,
          width: 1800,
          height: 1212,
          deviceScale: 1,
          reducedMotion: true,
          errors,
        },
        null,
        2,
      ),
    );
    console.log(`Captured ${variant}`);
    await context.close();
  }
} finally {
  await browser.close();
}
