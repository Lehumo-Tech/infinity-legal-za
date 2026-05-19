/**
 * PocketBase Service Wrapper
 * Keeps PocketBase running with auto-restart and health monitoring
 */

import { spawn, type ChildProcess } from 'child_process';
import { resolve } from 'path';

const PB_BIN = resolve(__dirname, '../pocketbase/pocketbase');
const PB_DATA = resolve(__dirname, '../pocketbase/pb_data');
const PB_PORT = 8090;
const PB_HOST = '0.0.0.0';

let pbProcess: ChildProcess | null = null;
let restartCount = 0;
const MAX_RESTARTS = 10;

function startPocketBase() {
  console.log(`[PB-Service] Starting PocketBase on ${PB_HOST}:${PB_PORT}...`);
  
  pbProcess = spawn(PB_BIN, [
    'serve',
    `--http=${PB_HOST}:${PB_PORT}`,
    `--dir=${PB_DATA}`,
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  pbProcess.stdout?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    console.log(`[PocketBase] ${msg}`);
  });

  pbProcess.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    console.error(`[PocketBase ERR] ${msg}`);
  });

  pbProcess.on('close', (code, signal) => {
    console.log(`[PB-Service] Process exited with code ${code}, signal ${signal}`);
    pbProcess = null;
    
    if (restartCount < MAX_RESTARTS) {
      restartCount++;
      console.log(`[PB-Service] Restarting... (attempt ${restartCount}/${MAX_RESTARTS})`);
      setTimeout(startPocketBase, 2000);
    } else {
      console.error(`[PB-Service] Max restarts reached. Exiting.`);
      process.exit(1);
    }
  });

  pbProcess.on('error', (err) => {
    console.error(`[PB-Service] Process error:`, err);
    pbProcess = null;
  });
}

// Health check endpoint (simple HTTP server)
const healthServer = Bun.serve({
  port: 8091,
  fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === '/health') {
      return Response.json({ 
        status: 'ok', 
        pocketbase: pbProcess !== null ? 'running' : 'stopped',
        restartCount,
        port: PB_PORT,
      });
    }
    
    return new Response('Not found', { status: 404 });
  },
});

console.log(`[PB-Service] Health endpoint on port 8091`);

// Start PocketBase
startPocketBase();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[PB-Service] Shutting down...');
  if (pbProcess) {
    pbProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[PB-Service] Received SIGTERM...');
  if (pbProcess) {
    pbProcess.kill('SIGTERM');
  }
  process.exit(0);
});
