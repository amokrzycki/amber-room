import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  globalTimeout: process.env.CI ? 12 * 60_000 : undefined,
  workers: process.env.CI ? 1 : "50%",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: [[process.env.CI ? "line" : "list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    actionTimeout: 15_000,
    browserName: "chromium",
    viewport: { width: 1600, height: 900 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
    },
  },
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://localhost:5173/prototypes/opening-hours.html",
    reuseExistingServer: !process.env.CI,
  },
});
