const { execSync } = require('child_process');
const packageManifest = require('./package_manifest.json');

console.log("Detecting changes to determine which pipelines to upload...");

const ignoredFiles = ["README.md", "LICENSE.txt", ".gitignore", "TESTING.md", "osv-scanner.toml"];

const baseBranch = process.env.BUILDKITE_PULL_REQUEST_BASE_BRANCH;
const currentBranch = process.env.BUILDKITE_BRANCH;
const commitMessage = process.env.BUILDKITE_MESSAGE || "";

if (baseBranch) {
  console.log(`Fetching latest changes from ${baseBranch}`);
  execSync(`git fetch origin ${baseBranch}`);

  console.log(`Files changed in ${currentBranch} compared to ${baseBranch}:`);
  execSync(`git --no-pager diff --name-only origin/${baseBranch}`, { stdio: 'inherit' });
}

packageManifest.forEach(({ paths, block, pipeline }) => {
  let upload = false;

  if (!baseBranch) {
    console.log(`No pull request raised, uploading blocker file: ${block}`);
    execSync(`buildkite-agent pipeline upload ${block}`);
    return;
  }

  if (commitMessage.includes("[full ci]") ||
    ["next", "main"].includes(currentBranch) ||
    ["main"].includes(baseBranch)) {
    console.log(`Upload pipeline file: ${pipeline}`);
    execSync(`buildkite-agent pipeline upload ${pipeline}`);
    return;
  }

  const changedFiles = execSync(`git diff --name-only origin/${baseBranch}`).toString().split('\n');

  for (const file of changedFiles) {
    if (ignoredFiles.includes(file)) {
      console.log(`Skipping ${file} based on ignored_files list`);
      continue;
    }

    for (const path of paths) {
      if (file.includes(path)) {
        console.log(`file ${file} is in ${path}, mark pipeline for upload`);
        upload = true;
        break;
      }
    }

    if (upload) break;
  }

  if (upload) {
    console.log(`Upload pipeline file: ${pipeline}`);
    execSync(`buildkite-agent pipeline upload ${pipeline}`);
  } else {
    console.log(`Upload blocker file: ${block}`);
    execSync(`buildkite-agent pipeline upload ${block}`);
  }
});
