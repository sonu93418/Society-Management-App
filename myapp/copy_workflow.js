const fs = require('fs');
const path = require('path');

const srcFiles = [
  'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\3b34aeae-38e5-4f1f-b59d-f7cf155bb961\\splash_3d_workflow_poster_1784994179780.png',
  'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\3b34aeae-38e5-4f1f-b59d-f7cf155bb961\\splash_roadmap_poster_1784993040570.png',
  'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\3b34aeae-38e5-4f1f-b59d-f7cf155bb961\\vertical_mobile_roadmap_poster_1784993290973.png'
];

const destPath = path.join(__dirname, 'assets', 'images', 'splash_workflow.png');

let copied = false;
for (const src of srcFiles) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, destPath);
    console.log('Successfully copied:', src, 'to splash_workflow.png');
    copied = true;
    break;
  }
}

if (!copied) {
  // Fallback: copy splash_poster.png to splash_workflow.png so require() never fails
  const fallback = path.join(__dirname, 'assets', 'images', 'splash_poster.png');
  fs.copyFileSync(fallback, destPath);
  console.log('Copied fallback splash_poster.png to splash_workflow.png');
}
