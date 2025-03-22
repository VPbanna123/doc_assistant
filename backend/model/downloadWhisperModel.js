const fs = require('fs');
const https = require('https');
const path = require('path');

// Create directory for models if it doesn't exist
const modelDir = path.join(process.env.USERPROFILE || process.env.HOME, '.cache', 'whisper-node');
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir, { recursive: true });
}

// URL for the tiny model
const modelUrl = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin';
const modelPath = path.join(modelDir, 'ggml-tiny.bin');

console.log(`Downloading Whisper tiny model to: ${modelPath}`);
console.log('This may take a few minutes...');

const file = fs.createWriteStream(modelPath);
https.get(modelUrl, function(response) {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log(`Model downloaded successfully to ${modelPath}`);
  });
}).on('error', (err) => {
  fs.unlink(modelPath);
  console.error(`Error downloading model: ${err.message}`);
});
