import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["src/**/*.{js,jsx}"],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ["src-gs/*.{ts,tsx}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.browser,
    },
    globals: {
      process: "readonly",
      SpreadsheetApp: "readonly",
      GmailApp: "readonly",
      DriveApp: "readonly",
      Logger: "readonly",
      PropertiesService: "readonly",
      ScriptApp: "readonly",
      UrlFetchApp: "readonly",
    },
  },
]);
