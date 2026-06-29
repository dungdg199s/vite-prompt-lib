const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const outputCodeFile = path.resolve(__dirname, 'dist/Code.js');
const appScriptJson = path.resolve(__dirname, 'appsscript.json');
const outputAppScriptJson = path.resolve(__dirname, 'dist/appsscript.json');

const files = fs.readdirSync(path.resolve(__dirname, 'appscripts'));

for (const file of files) {
  const filePath = path.resolve(__dirname, 'appscripts', file);
  const outputFilePath = path.resolve(__dirname, 'dist', file);

  if (fs.statSync(filePath).isFile() && path.extname(file) === '.js') {
    const code = fs.readFileSync(filePath, 'utf-8');
    const outputCode = code.replace(/process\.env\.([A-Z0-9_]+)/g, (match, p1) => {
      const envValue = process.env[p1];
      if (envValue === undefined) {
        throw new Error(`Environment variable ${p1} is not defined in .env file`);
      }
      return JSON.stringify(envValue);
    });
    fs.writeFileSync(outputFilePath, outputCode);
  }
}

fs.copyFileSync(appScriptJson, outputAppScriptJson);

// require("esbuild")
//   .build({
//     entryPoints: ["src-gs/index.js"],
//     bundle: true,
//     write: false,
//   })
//   .then(async (data) => {
//     const code = data.outputFiles[0].text;
//     const outputCode = code
//       .split("\n")
//       .filter((_, idx, arr) => idx !== 0 && idx < arr.length - 2)
//       .join("\n")
//       .replace(/process\.env\.([A-Z0-9_]+)/g, (match, p1) => {
//         const envValue = process.env[p1];
//         if (envValue === undefined) {
//           throw new Error(
//             `Environment variable ${p1} is not defined in .env file`,
//           );
//         }
//         return JSON.stringify(envValue);
//       });

//     // format with Prettier
//     const prettier = require("prettier");
//     const formattedCode = await prettier.format(outputCode, {
//       parser: "babel",
//     });

//     fs.writeFileSync(outputCodeFile, formattedCode);
//     fs.copyFileSync(appScriptJson, outputAppScriptJson);
//   })
//   .catch((error) => {
//     console.error("Build failed:", error);
//     process.exit(1);
//   });
