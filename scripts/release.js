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

  // Check if local main is ahead of remote main
  try {
    execSync('git fetch origin main');
    const localCommit = execSync('git rev-parse HEAD').toString().trim();
    const remoteCommit = execSync('git rev-parse origin/main').toString().trim();
    if (localCommit !== remoteCommit) {
      console.error('Local main branch is ahead of remote. Please push your changes before releasing.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to check if local main is ahead of remote:', error.message);
    process.exit(1);
  }
}

function release(isReleaseCandidate) {
  checkGitStatus();
  
  // If everything is okay, proceed with the release
  const releaseCommand = isReleaseCandidate 
    ? 'release-it --preRelease=rc'
    : 'release-it';

  try {
    const output = execSync(releaseCommand, { stdio: 'pipe' }).toString();
    console.log(output);

    // Extract the version number from the release-it output
    const versionMatch = output.match(/to\s+v([\d.]+)/);
    if (versionMatch && versionMatch[1]) {
      const version = versionMatch[1];
      // Add a tag for the release
      execSync(`git tag -a v${version} -m "Release ${version}"`, { stdio: 'inherit' });
      console.log(`Tagged release as v${version}`);
    } else {
      console.warn('Could not determine version number from release output. Tag was not created.');
    }

    console.log('Release created successfully. To publish, run: npm run publish');
  } catch (error) {
    console.error('Release process failed:', error.message);
    process.exit(1);
  }
}

// Check if this is a release candidate
const isReleaseCandidate = process.argv.includes('--rc');

release(isReleaseCandidate);
