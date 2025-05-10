// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseUsageFile, parseThreadDump, buildDisplayRows } = require('./analysis');

const app = express();
const PORT = 3000;

// Upload config
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Serve frontend
app.use(express.static('public'));

app.post('/upload', upload.fields([
  { name: 'usageFile', maxCount: 1 },
  { name: 'dumpFile', maxCount: 1 }
]), (req, res) => {
  try {
    const usagePath = req.files['usageFile'][0].path;
    const dumpPath = req.files['dumpFile'][0].path;

    const usageData = parseUsageFile(usagePath);
    const dumpData = parseThreadDump(dumpPath);
    const rows = buildDisplayRows(usageData, dumpData);

    let html = `
      <table class="styled-table">
        <thead>
          <tr><th>CPU Usage</th><th>TID (dec)</th><th>NID (hex)</th><th>TID (JVM)</th><th>Thread Name</th></tr>
        </thead>
        <tbody>
          ${rows.map(r => `<tr>
            <td>${r.cpu}</td>
            <td>${r.tidDec}</td>
            <td>${r.tidHex}</td>
            <td>${r.jvmTid}</td>
            <td>${r.name}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <style>
        body { font-family: sans-serif; padding: 20px; background: #f4f4f9; }
        .styled-table { border-collapse: collapse; margin: 25px 0; font-size: 1em; width: 100%; }
        .styled-table thead tr { background-color: #009879; color: #ffffff; text-align: left; }
        .styled-table th, .styled-table td { padding: 12px 15px; }
        .styled-table tbody tr { border-bottom: 1px solid #dddddd; }
        .styled-table tbody tr:nth-of-type(even) { background-color: #f3f3f3; }
        .styled-table tbody tr:last-of-type { border-bottom: 2px solid #009879; }
      </style>
    `;

    res.send(html);
  } catch (e) {
    console.error(e);
    res.status(500).send('Internal server error.');
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
