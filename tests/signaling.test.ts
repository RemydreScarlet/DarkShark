import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const PORT = 8081;
const URL = `ws://localhost:${PORT}`;

describe('Signaling Server', () => {
  let serverProcess: ChildProcess;

  beforeAll(async () => {
    // Start the signaling server in a separate process
    serverProcess = spawn('npx', ['tsx', 'src/signaling/server.ts'], {
      env: { ...process.env, PORT: PORT.toString() },
    });

    // Wait for server to start
    await new Promise((resolve) => {
      serverProcess.stdout?.on('data', (data) => {
        if (data.toString().includes('Signaling server started')) {
          resolve(true);
        }
      });
    });
  }, 10000);

  afterAll(() => {
    serverProcess.kill();
  });

  it('should allow peers to join and receive peer list', async () => {
    const ws = new WebSocket(URL);
    
    const promise = new Promise((resolve) => {
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'join', id: 'peer1', role: 'coordinator' }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'peer_list') {
          expect(message.peers).toContainEqual({ id: 'peer1', role: 'coordinator' });
          ws.close();
          resolve(true);
        }
      });
    });

    await promise;
  });

  it('should relay signals between peers', async () => {
    const ws1 = new WebSocket(URL);
    const ws2 = new WebSocket(URL);

    const promise = new Promise((resolve) => {
      ws1.on('open', () => {
        ws1.send(JSON.stringify({ type: 'join', id: 'coord', role: 'coordinator' }));
      });

      ws2.on('open', () => {
        ws2.send(JSON.stringify({ type: 'join', id: 'expert', role: 'expert' }));
      });

      ws2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'peer_list' && message.peers.length === 2) {
          // Both joined, send signal from ws1 to ws2
          ws1.send(JSON.stringify({
            type: 'signal',
            targetId: 'expert',
            signal: { sdp: 'test-sdp' }
          }));
        } else if (message.type === 'signal') {
          expect(message.senderId).toBe('coord');
          expect(message.signal.sdp).toBe('test-sdp');
          ws1.close();
          ws2.close();
          resolve(true);
        }
      });
    });

    await promise;
  });
});
