import { sheetDb } from "./g-sheet-db";
import { gasServer } from "./gas-server";

gasServer.get("/api/prompts", () => {
  return sheetDb.table("prompt").getAll();
});

gasServer.get("/api/prompts/:name", (req) => {
  const name = req.params.name;
  return sheetDb.table("prompt").getByName(name);
});

gasServer.post("/api/prompts", (req) => {
  const payload = req.body;
  if (!payload || !payload.name) {
    throw new Error("Invalid payload for create-prompt");
  }

  const newRecord = {
    name: payload.name,
    description: payload.description || "",
    shareMode: payload.shareMode || "private",
    shareWith: payload.shareWith || [],
  };

  sheetDb.table("prompt").create(newRecord);

  return { success: true };
});

gasServer.put("/api/prompts", (req) => {
  const payload = req.body;
  if (!payload || !payload.name) {
    throw new Error("Invalid payload for update-prompt");
  }
  const updatedRecord = {
    name: payload.name,
    description: payload.description || "",
    shareMode: payload.shareMode || "private",
    shareWith: payload.shareWith || [],
  };

  const success = sheetDb.table("prompt").update(updatedRecord);
  if (!success) {
    throw new Error("Prompt not found for update");
  }

  return { success: true };
});

gasServer.delete("/api/prompts/:name", (req) => {
  const name = req.params.name;
  const success = sheetDb.table("prompt").delete(name);
  if (!success) {
    throw new Error(`Prompt "${name}" not found for delete`);
  }

  return { success: true };
});
