#!/usr/bin/env node
const { spawn } = require('child_process');

const cwd = process.cwd();
const env = {
  ...process.env,
  PORT: process.env.PORT || '8081',
  BASE_PATH: process.env.BASE_PATH || '/__mockup',
};

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['vite', 'dev'];

const child = spawn(command, args, {
  cwd,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
