import { sheetDb } from "./g-sheet-db";
import { gasServer } from "./gas-server";

gasServer.get("/api/workspaces", () => {
  return sheetDb.table("workspaces").getAll();
});

gasServer.get("/api/workspaces/:name", (req) => {
  const name = req.params.name;
  const workspace = sheetDb.table("workspaces").getByName(name);
  if (!workspace) {
    throw new Error(`Workspace "${name}" not found`);
  }
  const prompts = sheetDb
    .table("prompt")
    .getAll()
    .filter((prompt) => {
      return prompt.workspace === name;
    });

  const documents = sheetDb
    .table("documents")
    .getAll()
    .filter((document) => {
      return document.workspace === name;
    });

  return { ...workspace, prompts, documents };
});

gasServer.post("/api/workspaces", (req) => {
  const payload = req.body;
  if (!payload || !payload.name) {
    throw new Error("Invalid payload for create-workspace");
  }

  const newRecord = {
    name: payload.name,
    description: payload.description || "",
    shareMode: payload.shareMode || "private",
    shareWith: payload.shareWith || [],
  };

  sheetDb.table("workspaces").create(newRecord);

  return { success: true };
});

gasServer.put("/api/workspaces", (req) => {
  const payload = req.body;
  if (!payload || !payload.name) {
    throw new Error("Invalid payload for update-workspace");
  }
  const updatedRecord = {
    id: payload.id,
    name: payload.name,
    description: payload.description || "",
    shareMode: payload.shareMode || "private",
    shareWith: payload.shareWith || [],
  };

  const success = sheetDb.table("workspaces").update(updatedRecord);
  if (!success) {
    throw new Error("Workspace not found for update");
  }

  return { success: true };
});

gasServer.delete("/api/workspaces/:name", (req) => {
  const name = req.params.name;
  const success = sheetDb.table("workspaces").delete(name);
  if (!success) {
    throw new Error(`Workspace "${name}" not found for delete`);
  }

  return { success: true };
});
