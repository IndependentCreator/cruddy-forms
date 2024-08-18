import { execSync } from 'child_process';

function checkGitStatus() {
  // Check if we're on the main branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (currentBranch !== 'main') {
    console.error('Releases must be initiated from the main branch.');
    process.exit(1);
  }

  // Check for uncommitted changes
  try {
    execSync('git diff-index --quiet HEAD --');
  } catch (error) {
    console.error('There are uncommitted changes. Please commit or stash them before releasing.');
    process.exit(1);
  }

  // Check if remote 'origin' exists
  try {
    execSync('git remote get-url origin');
  } catch (error) {
    console.error('Remote "origin" is not configured. Please set up the remote repository first.');
    console.error('You can do this by running: git remote add origin <repository-url>');
    process.exit(1);
  }

  // Check if local main is ahead of remote main
  try {
    execSync('git fetch origin main');
    const localCommit = execSync('git rev-parse HEAD').toString().trim();
    const remoteCommit = execSync('git rev-parse origin/main').toString().trim();
    if (localCommit !== remoteCommit) {
      console.error('Local main branch is not in sync with remote. Please pull or push your changes before releasing.');
      process.exit(1);
    }
  } catch (error) {
    if (error.message.includes('couldn\'t find remote ref main')) {
      console.error('The remote branch "main" does not exist. Please push your local main branch to the remote repository.');
      console.error('You can do this by running: git push -u origin main');
    } else {
      console.error('Failed to check if local main is in sync with remote:', error.message);
    }
    process.exit(1);
  }
}

function release(isReleaseCandidate) {
  checkGitStatus();
  
  // If everything is okay, proceed with the release
  const releaseCommand = isReleaseCandidate 
    ? 'release-it --preRelease=rc --no-git.changelog --no-github.release'
    : 'release-it --no-git.changelog --no-github.release';

  try {
    console.log(`Executing command: ${releaseCommand}`);
    const output = execSync(releaseCommand, { stdio: 'pipe' }).toString();
    console.log('Release-it output:', output);

    // Extract the version number from the release-it output
    const versionMatch = output.match(/to\s+v?(\d+\.\d+\.\d+(?:-rc\.\d+)?)/i);
    if (versionMatch && versionMatch[1]) {
      const version = versionMatch[1];
      console.log(`Extracted version: ${version}`);
      
      // Add a tag for the release
      const tagCommand = `git tag -a v${version} -m "Release ${version}"`;
      console.log(`Executing command: ${tagCommand}`);
      execSync(tagCommand, { stdio: 'inherit' });
      console.log(`Tagged release as v${version}`);
    } else {
      throw new Error('Could not determine version number from release output. Unable to create tag.');
    }

    console.log('Release process completed successfully. To publish, run: npm run publish');
  } catch (error) {
    console.error('Release process failed:', error.message);
    if (error.stderr) {
      console.error('Error output:', error.stderr.toString());
    }
    if (error.message.includes('No upstream configured for current branch')) {
      console.error('Please set an upstream branch for your current branch.');
      console.error('You can do this by running: git push -u origin main');
    }
    process.exit(1);
  }
}

// Check if this is a release candidate
const isReleaseCandidate = process.argv.includes('--rc');

release(isReleaseCandidate);
