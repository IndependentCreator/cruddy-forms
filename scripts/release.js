import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function checkGitStatus() {
  // ... (keep the existing checkGitStatus function as is)
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

function getVersionFromPackageJson() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function release(bumpType, isReleaseCandidate) {
  try {
    checkGitStatus();
    
    runTests();

    const oldVersion = getVersionFromPackageJson();
    console.log(`Current version: ${oldVersion}`);

    let releaseCommand = `release-it --${bumpType} --no-git.changelog --ci`;
    if (isReleaseCandidate) {
      releaseCommand += ' --preRelease=rc';
    }

    console.log(`Executing command: ${releaseCommand}`);
    execSync(releaseCommand, { stdio: 'inherit' });

    const newVersion = getVersionFromPackageJson();
    console.log(`New version: ${newVersion}`);

    if (oldVersion === newVersion) {
      console.log('Version remained unchanged. The release may have been cancelled.');
      return;
    }

    buildModule();

    const moduleLocation = getModuleLocation();
    console.log(`Module built and located at: ${moduleLocation}`);

    console.log('\nRelease preparation completed successfully.');
    console.log('Next steps:');
    console.log('1. Review the changes and the built module.');
    console.log('2. If everything looks good, push changes and tags to remote: git push --follow-tags');
    console.log('3. To publish the module, run: pnpm run publish');
    console.log('\nIf you need to cancel this release:');
    console.log(`1. Delete the local tag: git tag -d v${newVersion}`);
    console.log(`2. Reset to the commit before the release: git reset --hard HEAD~1`);
  } catch (error) {
    console.error('Release process failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const bumpType = args.find(arg => ['patch', 'minor', 'major'].includes(arg)) || 'patch';
const isReleaseCandidate = args.includes('--rc');

release(bumpType, isReleaseCandidate);
