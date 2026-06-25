import { gasClient } from "./gas-client";

export const promptsClient = {
  getPrompts: () => gasClient.get("/api/prompts"),
  getPrompt: (id) => gasClient.get(`/api/prompts/${id}`),
  createPrompt: (payload) => gasClient.post("/api/prompts", payload),
  updatePrompt: (payload) => gasClient.put("/api/prompts", payload),
  deletePrompt: (name) => gasClient.del(`/api/prompts/${name}`),
};
