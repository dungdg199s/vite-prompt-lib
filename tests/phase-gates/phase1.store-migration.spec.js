import { test, expect } from "@playwright/test";

test.describe("Phase 1 - Zustand migration gates", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto("/#/workspaces");
    await expect(page.getByRole("button", { name: "Workspaces" })).toBeVisible();
  });

  test("loads workspace list from mock API", async ({ page }) => {
    await expect(page.getByText("frontend-lab")).toBeVisible();
    await expect(page.getByText("growth-team")).toBeVisible();
  });

  test("can create workspace and show success toast", async ({ page }) => {
    const workspaceName = `phase1-${Date.now()}`;

    await page.getByRole("button", { name: "New Workspace" }).click();
    const createDialog = page.getByRole("dialog", { name: "Create Workspace" });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel("Workspace Name").fill(workspaceName);
    await createDialog.getByLabel("Description").fill("Phase 1 migration test workspace");
    await createDialog.getByRole("button", { name: "Create" }).click();

    await expect(page.getByTestId("toast-container")).toContainText("Workspace created successfully");
    await expect(page.getByRole("heading", { level: 2, name: workspaceName })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/#/workspaces/${workspaceName}$`));
  });

  test("global search opens prompt deep-link", async ({ page }) => {
    await page.getByLabel("Global search").fill("Landing Hero Copy");
    await page.getByRole("button", { name: "Landing Hero Copy" }).first().click();

    await expect(page).toHaveURL(/\/workspaces\/growth-team\?prompt=Landing%20Hero%20Copy/);
  });
});
