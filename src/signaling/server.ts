import { WebSocketServer, WebSocket } from 'ws';

interface Peer {
  id: string;
  role: 'coordinator' | 'expert';
  ws: WebSocket;
}

const port = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port });

const peers = new Map<string, Peer>();

console.log(`Signaling server started on ws://localhost:${port}`);

function broadcastPeerList() {
  const peerList = Array.from(peers.values()).map(p => ({ id: p.id, role: p.role }));
  const message = JSON.stringify({ type: 'peer_list', peers: peerList });
  
  peers.forEach(peer => {
    if (peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  let peerId: string | null = null;

  console.log('New connection attempt');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join':
          peerId = message.id;
          const role = message.role;
          if (!peerId || !role) {
            console.error('Invalid join message:', message);
            return;
          }
          peers.set(peerId, { id: peerId, role, ws });
          console.log(`Peer joined: ${peerId} (${role})`);
          broadcastPeerList();
          break;

        case 'signal':
          const { targetId, signal } = message;
          const targetPeer = peers.get(targetId);
          if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
            targetPeer.ws.send(JSON.stringify({
              type: 'signal',
              senderId: peerId,
              signal
            }));
          } else {
            console.warn(`Target peer ${targetId} not found or disconnected`);
          }
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  });

  ws.on('close', () => {
    if (peerId) {
      peers.delete(peerId);
      console.log(`Peer disconnected: ${peerId}`);
      broadcastPeerList();
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for peer ${peerId}:`, err);
  });
});
