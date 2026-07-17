const fs = require('fs');
const path = require('path');

const base64Wav = 'UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const buffer = Buffer.from(base64Wav, 'base64');

const dir = path.join(__dirname, '../assets/sounds');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sounds = ['doorbell.wav', 'complaint.wav', 'success.wav', 'emergency.wav', 'general.wav'];

sounds.forEach(sound => {
  const filePath = path.join(dir, sound);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Created WAV asset: ${filePath}`);
});
