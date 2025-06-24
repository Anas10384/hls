const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8080;

const inputStreamURL = 'https://air-stream-ts.onrender.com/box.ts?id=3';
const outputDir = path.join(__dirname, 'hls');
const playlistFile = path.join(outputDir, 'SonyYay.m3u8');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Clear HLS folder before start
fs.readdirSync(outputDir).forEach(file => fs.unlinkSync(path.join(outputDir, file)));

console.log('Starting FFmpeg...');

ffmpeg(inputStreamURL)
  .inputOptions('-re') // Read input in real-time
  .addOptions([
    '-c:v copy',
    '-c:a aac',
    '-f hls',
    '-hls_time 6',
    '-hls_list_size 3',
    '-hls_flags delete_segments',
    `-hls_segment_filename ${outputDir}/index%d.ts`,
  ])
  .output(playlistFile)
  .on('start', commandLine => console.log('FFmpeg started:', commandLine))
  .on('error', (err, stdout, stderr) => console.error('FFmpeg error:', err.message))
  .on('end', () => console.log('FFmpeg stopped'))
  .run();

// Serve HLS files
app.use('/hls', express.static(outputDir));

app.get('/', (req, res) => {
  res.send(`<video controls autoplay src="/hls/SonyYay.m3u8" type="application/x-mpegURL"></video>`);
});

app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}/`);
});
