const { execSync } = require('child_process');

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
}

function release(isReleaseCandidate) {
  checkGitStatus();
  
  // If everything is okay, proceed with the release
  const releaseCommand = isReleaseCandidate 
    ? 'release-it --preRelease=rc'
    : 'release-it';

  try {
    execSync(releaseCommand, { stdio: 'inherit' });
  } catch (error) {
    console.error('Release process failed:', error.message);
    process.exit(1);
  }
}

// Check if this is a release candidate
const isReleaseCandidate = process.argv.includes('--rc');

release(isReleaseCandidate);
