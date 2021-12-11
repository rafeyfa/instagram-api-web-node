const fse = require('fs-extra');
const path = require('path');
const { zip } = require('zip-a-folder');

function getVersion() {
  return "v2.0.1"
}


const REQUIRED_FILES = [
  '../package.json',
  '../README.md',
]

async function copyingRequiredFiles() {
  const VERSION = getVersion();

  for (const file of REQUIRED_FILES) {
    const filePath = path.resolve(__dirname, file).trimEnd();
    console.log(`Copying ${filePath}`);
    await fse.copyFile(filePath, path.resolve(__dirname, '../dist') + '/' +file.substr(3));
  }

  console.log(`Create version file`);
  const versionPath = path.resolve(__dirname, '../dist', 'version');
  await fse.ensureFile(versionPath);
  await fse.writeFile(versionPath, VERSION);
  await fse.ensureDir(path.resolve(__dirname, `../releases/`));
  await zip(path.resolve(__dirname, '../dist'), path.resolve(__dirname, `../releases/ig-${VERSION}.zip`));
  // await fse.remove(path.resolve(__dirname, '../dist'));
}

(async function run() {
  const VERSION = getVersion();
  try {
    console.log(`dist new version ${VERSION}!`);
    await copyingRequiredFiles();
    console.log('\ndist success!');
  } catch (err) {
    console.error('Failed to run scripts dist!: ', err.message);
  }
})();
