import { describe, it, expect, vi } from 'vitest';
import { createPeerConnection } from '../src/transport/webrtc';
import { TransportMessage } from '../src/transport/types';

// Mocking RTCPeerConnection for the test environment
class MockRTCPeerConnection {
  onicecandidate: any;
  oniceconnectionstatechange: any;
  ondatachannel: any;
  iceConnectionState = 'new';
  createDataChannel() { return { send: vi.fn(), close: vi.fn(), readyState: 'open' }; }
  createOffer() { return Promise.resolve({}); }
  setLocalDescription() { return Promise.resolve(); }
  setRemoteDescription() { return Promise.resolve(); }
  close() {}
}
(global as any).RTCPeerConnection = MockRTCPeerConnection;
(global as any).RTCSessionDescription = class {};
(global as any).RTCIceCandidate = class {};

describe('WebRTC Integration', () => {
  it('should initiate a connection and handle messages', async () => {
    const signalingMock: any = { sendSignal: vi.fn() };
    const onMessage = vi.fn();
    
    const pc = await createPeerConnection('peer1', signalingMock, {
      isInitiator: true,
      onMessage
    });
    
    expect(pc.targetId).toBe('peer1');
    expect(signalingMock.sendSignal).toHaveBeenCalled();
  });
});
