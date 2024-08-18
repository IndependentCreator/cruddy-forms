import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function checkGitStatus() {
  // Check if we're on the main branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (currentBranch !== 'main') {
    throw new Error('Releases must be initiated from the main branch.');
  }

  // Check for uncommitted changes
  try {
    execSync('git diff-index --quiet HEAD --');
  } catch (error) {
    throw new Error('There are uncommitted changes. Please commit or stash them before releasing.');
  }

  // Check if local main is ahead of remote main
  try {
    execSync('git fetch origin main');
    const localCommit = execSync('git rev-parse HEAD').toString().trim();
    const remoteCommit = execSync('git rev-parse origin/main').toString().trim();
    if (localCommit !== remoteCommit) {
      throw new Error('Local main branch is not in sync with remote. Please pull or push your changes before releasing.');
    }
  } catch (error) {
    throw new Error(`Failed to check if local main is in sync with remote: ${error.message}`);
  }
}

function buildModule() {
  console.log('Building the module...');
  execSync('pnpm run build', { stdio: 'inherit' });
  console.log('Module built successfully.');
}

function runTests() {
  console.log('Running tests...');
  execSync('pnpm run test', { stdio: 'inherit' });
  console.log('Tests completed successfully.');
}

function getModuleLocation() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const mainFile = packageJson.main;
  return path.resolve(mainFile);
}

function release(isReleaseCandidate) {
  try {
    checkGitStatus();
    
    // Run tests before proceeding with the release
    runTests();

    // If everything is okay, proceed with the release
    const releaseCommand = isReleaseCandidate 
      ? 'release-it --preRelease=rc --no-git.changelog --ci'
      : 'release-it --no-git.changelog --ci';

    console.log(`Executing command: ${releaseCommand}`);
    const output = execSync(releaseCommand, { stdio: 'pipe' }).toString();
    console.log('Release-it output:', output);

    // Extract the new version number
    const versionMatch = output.match(/to v?(\d+\.\d+\.\d+(?:-rc\.\d+)?)/i);
    if (!versionMatch || !versionMatch[1]) {
      throw new Error('Could not determine new version number from release output.');
    }

    const version = versionMatch[1];
    console.log(`New version: ${version}`);

    // Build the module
    buildModule();

    // Get the location of the built module
    const moduleLocation = getModuleLocation();
    console.log(`Module built and located at: ${moduleLocation}`);

    console.log('\nRelease preparation completed successfully.');
    console.log('Next steps:');
    console.log('1. Review the changes and the built module.');
    console.log('2. If everything looks good, push changes and tags to remote: git push --follow-tags');
    console.log('3. To publish the module, run: pnpm run publish');
    console.log('\nIf you need to cancel this release:');
    console.log(`1. Delete the local tag: git tag -d v${version}`);
    console.log(`2. Reset to the commit before the release: git reset --hard HEAD~1`);
  } catch (error) {
    console.error('Release process failed:', error.message);
    process.exit(1);
  }
}

// Check if this is a release candidate
const isReleaseCandidate = process.argv.includes('--rc');

release(isReleaseCandidate);
