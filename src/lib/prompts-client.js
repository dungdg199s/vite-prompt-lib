import { gasClient } from "./gas-client";

export const promptsClient = {
  getPrompts: () => gasClient.get("/api/prompts"),
  getPrompt: (name) => gasClient.get(`/api/prompts/${name}`),
  createPrompt: (payload) => gasClient.post("/api/prompts", payload),
  updatePrompt: (payload) => gasClient.put("/api/prompts", payload),
  deletePrompt: (name) => gasClient.del(`/api/prompts/${name}`),
};
