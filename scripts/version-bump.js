const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Split version into parts
const versionParts = packageJson.version.split('.');
if (versionParts.length !== 3) {
    console.error('Invalid version format in package.json');
    process.exit(1);
}

// Increment patch version
versionParts[2] = (parseInt(versionParts[2], 10) + 1).toString();
const newVersion = versionParts.join('.');

packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n');

console.log(`Version bumped to ${newVersion}`);

// Stage package.json
try {
    execSync('git add package.json');
    console.log('package.json staged for commit');
} catch (error) {
    console.error('Failed to stage package.json:', error.message);
    process.exit(1);
}
