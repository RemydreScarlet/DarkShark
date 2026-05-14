export interface PeerInfo {
  id: string;
  role: 'coordinator' | 'expert';
}

export interface SignalingClient {
  onPeerList: (peers: PeerInfo[]) => void;
  onSignal: (senderId: string, signal: any) => void;
  sendSignal: (targetId: string, signal: any) => void;
  close: () => void;
}

export function connectSignaling(
  url: string,
  peerId: string,
  role: 'coordinator' | 'expert',
  callbacks: {
    onPeerList?: (peers: PeerInfo[]) => void;
    onSignal?: (senderId: string, signal: any) => void;
  }
): Promise<SignalingClient> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', id: peerId, role }));
      
      const client: SignalingClient = {
        onPeerList: callbacks.onPeerList || (() => {}),
        onSignal: callbacks.onSignal || (() => {}),
        sendSignal: (targetId, signal) => {
          ws.send(JSON.stringify({ type: 'signal', targetId, signal }));
        },
        close: () => ws.close()
      };
      
      resolve(client);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'peer_list':
            if (callbacks.onPeerList) callbacks.onPeerList(message.peers);
            break;
          case 'signal':
            if (callbacks.onSignal) callbacks.onSignal(message.senderId, message.signal);
            break;
        }
      } catch (err) {
        console.error('Failed to parse signaling message', err);
      }
    };

    ws.onerror = (err) => {
      reject(err);
    };
  });
}
