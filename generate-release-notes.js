const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, 'CHANGELOG.md');
const changelog = fs.readFileSync(changelogPath, 'utf8');

const latestVersion = changelog.split('\n')[0].replace('# ', '');
const latestChanges = changelog.split('\n\n## ')[1].split('\n').slice(1).join('\n');

console.log(`${latestVersion}\n\n${latestChanges}`);
