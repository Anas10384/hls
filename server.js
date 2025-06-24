const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// ✅ URL of the live .ts stream
const inputStream = 'https://air-stream-ts.onrender.com/box.ts?id=3';

// ✅ Output HLS directory inside /tmp (safe for Render)
const hlsDir = path.join('/tmp', 'hls');
const playlistPath = path.join(hlsDir, 'SonyYay.m3u8');

// Create /tmp/hls directory if it doesn't exist
if (!fs.existsSync(hlsDir)) {
  fs.mkdirSync(hlsDir, { recursive: true });
}

// Clean old segments on startup
fs.readdirSync(hlsDir).forEach(file => fs.unlinkSync(path.join(hlsDir, file)));

// Start FFmpeg live loop
function startFFmpeg() {
  console.log('⏯️ Starting FFmpeg...');

  ffmpeg(inputStream)
    .addOptions([
      '-c:v copy',
      '-c:a aac',
      '-f hls',
      '-hls_time 6',
      '-hls_list_size 3',
      '-hls_flags delete_segments',
      `-hls_segment_filename ${hlsDir}/index%d.ts`,
    ])
    .output(playlistPath)
    .on('start', cmd => console.log('🎬 FFmpeg cmd:', cmd))
    .on('error', (err) => {
      console.error('💥 FFmpeg error:', err.message);
      console.log('🔁 Restarting FFmpeg in 3s...');
      setTimeout(startFFmpeg, 3000);
    })
    .on('end', () => {
      console.log('⛔ FFmpeg ended. Restarting...');
      startFFmpeg();
    })
    .run();
}

// Serve HLS files
app.use('/hls', express.static(hlsDir));

// Simple preview page
app.get('/', (req, res) => {
  res.send(`
    <h2>📺 SonyYay Live</h2>
    <video controls autoplay width="640" height="360">
      <source src="/hls/SonyYay.m3u8" type="application/x-mpegURL" />
    </video>
  `);
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
  startFFmpeg();
});
