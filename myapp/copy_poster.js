const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\3b34aeae-38e5-4f1f-b59d-f7cf155bb961\\splash_3d_workflow_poster_1784994179780.png';
const destPath = path.join(__dirname, 'assets', 'images', 'splash_workflow.png');

try {
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('Successfully copied splash_workflow.png to assets/images!');
  } else {
    console.error('Source file does not exist:', srcPath);
  }
} catch (err) {
  console.error('Error copying file:', err);
}
