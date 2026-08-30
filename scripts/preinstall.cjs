#!/usr/bin/env node
// Cross-platform preinstall script (CommonJS)
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const lockFiles = ['package-lock.json', 'yarn.lock'];

for (const f of lockFiles) {
  const p = path.join(repoRoot, f);
  try {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`Removed ${f}`);
    }
  } catch (err) {
    console.error(`Failed to remove ${f}: ${err.message}`);
  }
}

const ua = process.env.npm_config_user_agent || '';
if (!ua.startsWith('pnpm/')) {
  console.error('Use pnpm instead');
  process.exit(1);
}

process.exit(0);
