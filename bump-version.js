const fs = require('fs');
const path = require('path');

// 버전 타입 (patch, minor, major)
const versionType = process.argv[2] || 'patch';

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// tauri.conf.json 업데이트
const tauriConfPath = path.join(__dirname, 'src-tauri', 'tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
const newVersion = bumpVersion(tauriConf.version, versionType);
tauriConf.version = newVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');

// Cargo.toml 업데이트
const cargoTomlPath = path.join(__dirname, 'src-tauri', 'Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/^version = ".*"$/m, `version = "${newVersion}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);

// package.json 업데이트
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`Version bumped to ${newVersion}`);
