import fs from 'fs';
import path from 'path';
import { deleteAsync } from 'del';
import os from 'os';
import gulp from 'gulp';

let iconsData = '';
function readFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((fileName) => {
    const filePath = path.join(dir, fileName);
    if (fs.statSync(filePath).isDirectory()) readFiles(filePath);
    else if (filePath.endsWith('.svg'))
      iconsData +=
        `export const ${fileName.replaceAll('.svg', '').replaceAll('-', '_')}_icon` +
        ` = \`${fs.readFileSync(filePath)}\`;\n\n`;
  });
}

function optimizeIcons(done) {
  let iconsPath = './static/icons/';
  let utilPath = './src/util/';

  readFiles(iconsPath);

  iconsData = iconsData
    .slice(0, -2)
    .replaceAll(/ stroke=".*?"/g, '')
    .replaceAll(/ fill=".*?"/g, '');
  fs.writeFileSync(utilPath + 'icon-definitions.ts', iconsData);
  done();
}

function cleanBuildFolder() {
  return deleteAsync(['build', 'build-tauri', 'src-tauri/target'], { force: true });
}

function cleanAll() {
  return deleteAsync(['.svelte-kit', 'build', 'build-tauri', 'src-tauri/target', 'node_modules', 'package-lock.json'], {
    force: true
  });
}

function copyTauriFiles() {
  const filesToCopy = [
    'src-tauri/target/release/mva.exe',
    'src-tauri/target/release/bundle/msi/mva_0.1.0_x64_en-US.msi',
    'src-tauri/target/release/bundle/nsis/mva_0.1.0_x64-setup.exe'
  ];

  return gulp.src(filesToCopy).pipe(gulp.dest(`./build-tauri/${getPlatform(os.platform())}`));
}

function getPlatform(platform) {
  if (platform === 'win32') return 'windows';
  else if (platform === 'darwin') return 'macOS';
  return platform;
}

export { cleanBuildFolder as clean, cleanAll, optimizeIcons, copyTauriFiles };
