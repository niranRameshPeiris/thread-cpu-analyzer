const fs = require('fs');
const path = require('path');

// Parse a thread usage file and return an array of { tidDec, tidHex, cpu }
function parseUsageFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const usage = [];

  for (const line of lines) {
    const tokens = line.trim().split(/\s+/);
    if (tokens.length < 6 || isNaN(tokens[1]) || isNaN(tokens[2])) continue;

    const tidDec = parseInt(tokens[1]);
    const cpu = parseFloat(tokens[2]);
    const tidHex = '0x' + tidDec.toString(16);
    usage.push({ tidDec, tidHex, cpu });
  }

  usage.sort((a, b) => b.cpu - a.cpu);
  return usage;
}

// Parse a thread dump file and return a map of nid -> { name, tid }
function parseThreadDump(filePath) {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const threadMap = {};

  for (const line of lines) {
    if (line.startsWith('"')) {
      const match = line.match(/^"(.+?)".*tid=([^ ]+).*nid=(0x[0-9a-f]+)/);
      if (match) {
        const [, name, tid, nid] = match;
        threadMap[nid] = { name, tid };
      }
    }
  }

  return threadMap;
}

// Discover all matching usage + dump file pairs by timestamp
function discoverFiles(dir) {
  const files = fs.readdirSync(dir);
  const usageMap = new Map();
  const dumpMap = new Map();

  for (const file of files) {
    const usageMatch = file.match(/^thread_usage_(.+)\.txt$/);
    const dumpMatch = file.match(/^thread_dump_(.+)\.txt$/);

    if (usageMatch) usageMap.set(usageMatch[1], path.join(dir, file));
    if (dumpMatch) dumpMap.set(dumpMatch[1], path.join(dir, file));
  }

  const commonKeys = [...usageMap.keys()].filter(k => dumpMap.has(k)).sort();

  const usageFiles = commonKeys.map(k => usageMap.get(k));
  const dumpFiles = commonKeys.map(k => dumpMap.get(k));
  return { usage: usageFiles, dumps: dumpFiles, labels: commonKeys };
}

// Build the CPU usage comparison table
function buildTable(usageFiles, dumpFiles) {
  const rows = new Map(); // tidDec -> [col1, col2, ...]

  for (let i = 0; i < usageFiles.length; i++) {
    const usage = parseUsageFile(usageFiles[i]);
    const dump = parseThreadDump(dumpFiles[i]);

    for (const entry of usage) {
      const { tidDec, tidHex, cpu } = entry;
      const info = dump[tidHex];
      const column = info
        ? `${cpu.toFixed(1)}% - ${info.name} - ${info.tid} - ${tidHex}`
        : `${cpu.toFixed(1)}% - UNKNOWN - ? - ${tidHex}`;

      if (!rows.has(tidDec)) rows.set(tidDec, Array(usageFiles.length).fill(''));
      rows.get(tidDec)[i] = column;
    }
  }

  return rows;
}

// Write the table to a text file
function writeTableToFile(rows, labels, outPath) {
  const header = ['TID', ...labels.map(label => `Dump ${label}`)];
  const lines = [header.join(' | ')];

  for (const [tid, cols] of rows.entries()) {
    lines.push([tid, ...cols].join(' | '));
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`✔ Output written to ${outPath}`);
}

// ===== MAIN =====
const inputDir = process.argv[2];

if (!inputDir) {
  console.error('❌ Please provide a directory: node analyze.js ./your-dir');
  process.exit(1);
}

const { usage, dumps, labels } = discoverFiles(inputDir);

if (usage.length === 0 || usage.length !== dumps.length) {
  console.error('❌ Could not find matching usage and dump files.');
  process.exit(1);
}

const table = buildTable(usage, dumps);
const outputPath = path.join('./', 'cpu_analysis_result.txt');
writeTableToFile(table, labels, outputPath);