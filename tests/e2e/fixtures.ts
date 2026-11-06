import { test as base } from "@playwright/test";

export const test = base.extend<{ browserCleanup: undefined }>({
  browserCleanup: [
    async ({ browser }, use) => {
      await use(undefined);
      for (const context of browser.contexts()) await context.close();
    },
    { auto: true },
  ],
});
