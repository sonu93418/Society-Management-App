const fs = require('fs');
const path = require('path');

function findRecentPng(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (!file.startsWith('.') && !file.includes('node_modules') && !file.includes('myapp')) {
          results = results.concat(findRecentPng(filePath));
        }
      } else if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.webp')) {
        results.push({ path: filePath, mtime: stat.mtimeMs, size: stat.size });
      }
    });
  } catch (e) {}
  return results;
}

const baseDir = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide';
const allFiles = findRecentPng(baseDir);
allFiles.sort((a, b) => b.mtime - a.mtime);

console.log('Top 10 recent image files:');
allFiles.slice(0, 10).forEach(f => console.log(f.path, new Date(f.mtime).toISOString(), f.size));

if (allFiles.length > 0) {
  const latestImage = allFiles[0].path;
  const destPath1 = path.join(__dirname, 'assets', 'images', 'splash_community.png');
  const destPath2 = path.join(__dirname, 'assets', 'images', 'splash_workflow.png');
  
  fs.copyFileSync(latestImage, destPath1);
  fs.copyFileSync(latestImage, destPath2);
  console.log(`Copied ${latestImage} to splash_community.png and splash_workflow.png!`);
}
