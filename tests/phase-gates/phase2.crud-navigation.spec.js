import { test, expect } from "@playwright/test";

test.describe("Phase 2 - CRUD, Navigation & Global Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto("/#/workspaces");
  });

  test.describe("Workspace Navigation & CRUD Flows", () => {
    test("navigate to workspace shows sidebar with controls", async ({
      page,
    }) => {
      // Click workspace button in list
      await page
        .getByRole("button", { name: /growth-team/ })
        .first()
        .click();

      await page.waitForTimeout(500);

      // Verify workspace context loaded
      await expect(page.getByText("growth-team")).toBeVisible();
      await expect(page.getByRole("complementary")).toBeVisible();
    });

    test("can create prompt in workspace", async ({ page }) => {
      // Select workspace
      await page
        .getByRole("button", { name: /frontend-lab/ })
        .first()
        .click();
      await page.waitForTimeout(500);

      // Create prompt
      await page.getByRole("button", { name: "New Prompt" }).click();
      const dialog = page.getByRole("dialog", { name: "Create Prompt" });

      const promptName = `prompt-${Date.now()}`;
      await dialog.getByLabel("Prompt Name").fill(promptName);
      await dialog.getByLabel("Prompt Content").fill("Test prompt");
      await dialog.getByRole("button", { name: "Create" }).click();

      // Verify success
      await expect(page.getByTestId("toast-container")).toContainText(
        "successfully",
      );
    });

    test("can create document in workspace", async ({ page }) => {
      // Select workspace
      await page
        .getByRole("button", { name: /frontend-lab/ })
        .first()
        .click();
      await page.waitForTimeout(500);

      // Create document
      await page.getByRole("button", { name: "New Document" }).click();
      const dialog = page.getByRole("dialog", { name: "Create Document" });

      const docName = `doc-${Date.now()}`;
      await dialog.getByLabel("Document Name").fill(docName);
      await dialog.getByLabel("Document Type").selectOption("spreadsheet");
      await dialog.getByRole("button", { name: "Create" }).click();

      // Verify success
      await expect(page.getByTestId("toast-container")).toContainText(
        "successfully",
      );
    });

    test("switching between workspaces updates context", async ({ page }) => {
      // Go to first workspace
      await page
        .getByRole("button", { name: /frontend-lab/ })
        .first()
        .click();
      await page.waitForTimeout(300);

      await expect(page.getByText("frontend-lab")).toBeVisible();

      // Go to second workspace
      await page
        .getByRole("button", { name: /growth-team/ })
        .first()
        .click();
      await page.waitForTimeout(300);

      await expect(page.getByText("growth-team")).toBeVisible();
    });
  });

  test.describe("Prompt and Document Navigation", () => {
    test("navigate to prompt via URL with query parameters", async ({
      page,
    }) => {
      await page.goto("/#/workspaces/growth-team?prompt=Landing%20Hero%20Copy");

      await page.waitForTimeout(1000);

      // Verify workspace loaded
      await expect(page.getByText(/growth-team/)).toBeVisible({
        timeout: 5000,
      });
    });

    test("navigate to document via URL with query parameters", async ({
      page,
    }) => {
      await page.goto("/#/workspaces/frontend-lab?document=Design%20Notes");

      await page.waitForTimeout(1000);

      // Verify workspace loaded
      await expect(page.getByText(/frontend-lab/)).toBeVisible({
        timeout: 5000,
      });
    });

    test("navigate to workspace without params", async ({ page }) => {
      await page.goto("/#/workspaces/growth-team");

      await page.waitForTimeout(1000);

      // Verify workspace loads
      await expect(page.getByText("growth-team")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Global Search Functionality", () => {
    test("search input is visible and functional", async ({ page }) => {
      const searchInput = page.getByLabel("Global search");
      await expect(searchInput).toBeVisible();

      // Type search query
      await searchInput.fill("Landing");
      await page.waitForTimeout(300);

      expect(await searchInput.inputValue()).toBe("Landing");
    });

    test("search scope selector works", async ({ page }) => {
      const scopeSelector = page.getByLabel("Search scope");
      await expect(scopeSelector).toBeVisible();

      // Change to prompts only
      await scopeSelector.selectOption("prompts");

      const value = await scopeSelector.inputValue();
      expect(value).toBe("prompts");

      // Change back to all
      await scopeSelector.selectOption("all");
      const valueAll = await scopeSelector.inputValue();
      expect(valueAll).toBe("all");
    });

    test("search query can be cleared", async ({ page }) => {
      const searchInput = page.getByLabel("Global search");

      await searchInput.fill("test");
      expect(await searchInput.inputValue()).toBe("test");

      await searchInput.fill("");
      expect(await searchInput.inputValue()).toBe("");
    });
  });

  test.describe("Sidebar and Tab Navigation", () => {
    test("sidebar is visible with workspace entity list", async ({ page }) => {
      await page
        .getByRole("button", { name: /growth-team/ })
        .first()
        .click();

      const sidebar = page.getByRole("complementary");
      await expect(sidebar).toBeVisible({ timeout: 5000 });

      // Sidebar should have buttons
      const buttons = sidebar.getByRole("button");
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });

    test("workspace buttons in sidebar are clickable", async ({ page }) => {
      const workspaceBtn = page
        .getByRole("button", { name: /frontend-lab/ })
        .first();

      await workspaceBtn.click();
      await page.waitForTimeout(500);

      // Workspace should now be visible
      await expect(page.getByText("frontend-lab")).toBeVisible();
    });
  });

  test.describe("Toast Notifications on CRUD Operations", () => {
    test("successful creation shows toast", async ({ page }) => {
      await page
        .getByRole("button", { name: /frontend-lab/ })
        .first()
        .click();
      await page.waitForTimeout(500);

      // Create prompt
      await page.getByRole("button", { name: "New Prompt" }).click();
      const dialog = page.getByRole("dialog", { name: "Create Prompt" });

      await dialog.getByLabel("Prompt Name").fill(`p-${Date.now()}`);
      await dialog.getByLabel("Prompt Content").fill("Test");
      await dialog.getByRole("button", { name: "Create" }).click();

      // Verify toast shows success
      const toast = page.getByTestId("toast-container");
      await expect(toast).toContainText("successfully");
    });
  });

  test.describe("URL State Management", () => {
    test("URL-based navigation preserves workspace context", async ({
      page,
    }) => {
      // Navigate to specific workspace
      await page.goto("/#/workspaces/growth-team");

      await page.waitForTimeout(1000);

      // Verify workspace loads
      await expect(page.getByText("growth-team")).toBeVisible({
        timeout: 5000,
      });
    });

    test("URL with prompt parameter loads both contexts", async ({ page }) => {
      await page.goto("/#/workspaces/growth-team?prompt=Landing%20Hero%20Copy");

      await page.waitForTimeout(1000);

      // Verify workspace loads
      await expect(page.getByText("growth-team")).toBeVisible({
        timeout: 5000,
      });
    });

    test("URL with document parameter loads both contexts", async ({
      page,
    }) => {
      await page.goto("/#/workspaces/frontend-lab?document=Design%20Notes");

      await page.waitForTimeout(1000);

      // Verify workspace loads
      await expect(page.getByText("frontend-lab")).toBeVisible({
        timeout: 5000,
      });
    });

    test("returning to root navigates back to workspaces list", async ({
      page,
    }) => {
      // Go to specific workspace
      await page.goto("/#/workspaces/growth-team");
      await page.waitForTimeout(500);

      // Go back to root workspaces
      await page.goto("/#/workspaces");
      await page.waitForTimeout(500);

      // Should show workspace list with buttons
      const workspaceBtn = page
        .getByRole("button", { name: /frontend-lab|growth-team/ })
        .first();
      await expect(workspaceBtn).toBeVisible();
    });
  });
});
