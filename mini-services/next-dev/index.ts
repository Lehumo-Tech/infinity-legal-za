import { spawn, type ChildProcess } from 'child_process';
import { resolve } from 'path';

const NEXT_BIN = resolve(__dirname, '../../node_modules/.bin/next');
const PORT = 3000;
const MAX_RESTARTS = 50;

let nextProcess: ChildProcess | null = null;
let restartCount = 0;

function startNext() {
  console.log(`[NextDev] Starting Next.js on port ${PORT}...`);
  
  nextProcess = spawn('node', [NEXT_BIN, 'dev', '-p', PORT.toString()], {
    cwd: resolve(__dirname, '../..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    env: { ...process.env },
  });

  nextProcess.stdout?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    console.log(`[Next] ${msg}`);
  });

  nextProcess.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    console.error(`[Next ERR] ${msg}`);
  });

  nextProcess.on('close', (code, signal) => {
    console.log(`[NextDev] Process exited with code ${code}, signal ${signal}`);
    nextProcess = null;
    
    if (restartCount < MAX_RESTARTS) {
      restartCount++;
      console.log(`[NextDev] Restarting in 2s... (attempt ${restartCount}/${MAX_RESTARTS})`);
      setTimeout(startNext, 2000);
    } else {
      console.error(`[NextDev] Max restarts reached.`);
      process.exit(1);
    }
  });

  nextProcess.on('error', (err) => {
    console.error(`[NextDev] Process error:`, err);
    nextProcess = null;
  });
}

// Health check
const healthServer = Bun.serve({
  port: 3001,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        nextjs: nextProcess !== null ? 'running' : 'restarting',
        restartCount,
        port: PORT,
      });
    }
    return new Response('Not found', { status: 404 });
  },
});

console.log(`[NextDev] Health endpoint on port 3001`);

startNext();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[NextDev] Shutting down...');
  if (nextProcess) nextProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[NextDev] Received SIGTERM...');
  if (nextProcess) nextProcess.kill('SIGTERM');
  process.exit(0);
});
