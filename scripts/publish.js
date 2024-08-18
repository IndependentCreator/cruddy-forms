const { execSync } = require('child_process');

function publish() {
  try {
    // Ensure we're on the main branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    if (currentBranch !== 'main') {
      console.error('Publishing must be done from the main branch.');
      process.exit(1);
    }

    // Check if there are any uncommitted changes
    try {
      execSync('git diff-index --quiet HEAD --');
    } catch (error) {
      console.error('There are uncommitted changes. Please commit or stash them before publishing.');
      process.exit(1);
    }

    // Publish to npm
    console.log('Publishing to npm...');
    execSync('npm publish', { stdio: 'inherit' });
    console.log('Successfully published to npm!');
  } catch (error) {
    console.error('Publish process failed:', error.message);
    process.exit(1);
  }
}

publish();
