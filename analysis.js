// analysis.js
const fs = require('fs');

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

function parseThreadDump(filePath) {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const threadMap = {};

  for (const line of lines) {
    if (line.startsWith('"')) {
      const match = line.match(/^"(.+?)".*tid=([^ ]+).*nid=(0x[0-9a-f]+)/);
      if (match) {
        const [, name, tid, nid] = match;
        threadMap[nid] = { name, jvmTid: tid };
      }
    }
  }

  return threadMap;
}

function buildDisplayRows(usage, dump) {
  return usage.map(({ tidDec, tidHex, cpu }) => {
    const info = dump[tidHex] || { name: 'UNKNOWN', jvmTid: '?' };
    return {
      cpu: cpu.toFixed(1) + '%',
      tidDec,
      tidHex,
      jvmTid: info.jvmTid,
      name: info.name
    };
  });
}

module.exports = { parseUsageFile, parseThreadDump, buildDisplayRows };