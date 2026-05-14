import { SignalingClient } from '../signaling/server';
import { createPeerConnection, PeerConnection } from '../transport/webrtc';
import { ExpertMetadata, ExpertMessage } from './types';
import { createMetadata } from './metadata';
import { TransportMessage } from '../transport/types';

export class ExpertNode {
  private peers: Map<string, PeerConnection> = new Map();
  public metadata: ExpertMetadata;

  constructor(
    private nodeId: string,
    private role: 'orchestrator' | 'worker' | 'observer',
    private signaling: SignalingClient,
    capabilities: string[] = []
  ) {
    this.metadata = createMetadata(nodeId, role, capabilities);
  }

  async connectToPeer(targetId: string, isInitiator: boolean) {
    const pc = await createPeerConnection(targetId, this.signaling, {
      isInitiator,
      onMessage: (msg: TransportMessage) => this.handleIncomingMessage(msg),
      onStatusChange: (status) => console.log(`Peer ${targetId} status: ${status}`)
    });
    this.peers.set(targetId, pc);
  }

  private handleIncomingMessage(msg: TransportMessage) {
    // Logic to dispatch messages based on type
    if (msg.type === 'expert_message') {
      const expertMsg = msg.payload as ExpertMessage;
      console.log(`Received ${expertMsg.type} from ${expertMsg.senderId}`);
    }
  }

  async sendToPeer(targetId: string, message: ExpertMessage) {
    const peer = this.peers.get(targetId);
    if (peer) {
      peer.send({ type: 'expert_message', payload: message });
    } else {
      console.warn(`Peer ${targetId} not found`);
    }
  }

  async broadcast(message: ExpertMessage) {
    for (const [id, peer] of this.peers) {
      peer.send({ type: 'expert_message', payload: message });
    }
  }

  async disconnect() {
    for (const [id, peer] of this.peers) {
      peer.close();
    }
    this.peers.clear();
  }
}
