const { log } = require("console");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const sourcePath = path.resolve(__dirname, "src/gs");
const buildPath = path.resolve(__dirname, "./dist");
const appScriptJson = path.join(__dirname, "appsscript.json");
const mainFile = path.join(sourcePath, "main.gs");

const outputCodeFile = path.join(buildPath, "Code.js");
const outputAppScriptJson = path.join(buildPath, "appsscript.json");

const files = fs.readdirSync(sourcePath).filter((file) => {
  return file !== "main.gs" && (file.endsWith(".js") || file.endsWith(".gs"));
});

let mainCode = fs.readFileSync(mainFile, "utf-8");

const scriptCodes = files
  .map((file) => {
    log(`Building file: ${file}`);
    const filePath = path.join(sourcePath, file);
    const code = fs.readFileSync(filePath, "utf-8");
    const codeWithoutImports = code
      .replace(/^import .* from .*$/gm, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .trim();

    // replace process.env.<VAR> with the actual value from .env
    const codeWithEnv = codeWithoutImports.replace(
      /process\.env\.([A-Z0-9_]+)/g,
      (match, p1) => {
        const envValue = process.env[p1];
        if (envValue === undefined) {
          throw new Error(
            `Environment variable ${p1} is not defined in .env file`,
          );
        }
        return JSON.stringify(envValue);
      },
    );

    return `//-----------${file}-----------
(()=> {
${codeWithEnv}
})()`;
  })
  .join("\n\n");

const outputCode = mainCode.replace("/* HANDLERS_IS_REPLACE */", scriptCodes);

fs.writeFileSync(outputCodeFile, outputCode);
fs.copyFileSync(appScriptJson, outputAppScriptJson);
