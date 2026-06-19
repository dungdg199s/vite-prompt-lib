const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const deployments = runClasp(["deployments", "--json"]);
const versions = runClasp(["versions", "--json"]);

const latestDeployment = deployments[deployments.length - 1];
const lastVersion = versions.sort(
  (a, b) => b.versionNumber - a.versionNumber,
)[0];

if (deployments.length === 0) {
  console.log("No deployments found. Create a deployment...");
  const deployOutput = runClasp([
    "deploy",
    `-V ${lastVersion.versionNumber}`,
    `-d "Update deployment at ${new Date().toISOString()}"`,
  ]);
  console.log(deployOutput);
  return;
}

console.log("Deployments found. Update a deployment...");
const deployOutput = runClasp([
  "redeploy",
  `${latestDeployment.deploymentId}`,
  `-V ${lastVersion.versionNumber}`,
  `-d "Update deployment at ${new Date().toISOString()}"`,
]);

console.log(deployOutput);

function runClasp(args, options = {}) {
  console.log(`$ clasp ${args[0]}`);
  const cmd = `clasp ${args.join(" ")}`;
  const stdout = execSync(cmd, { encoding: "utf-8", ...options });
  try {
    return JSON.parse(stdout);
  } catch (error) {
    return stdout.toString();
  }
}
