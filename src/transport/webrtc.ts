import { SignalingClient } from './signaling';
import { TransportMessage, encode, decode } from './types';

export interface PeerConnection {
  targetId: string;
  pc: RTCPeerConnection;
  dc?: RTCDataChannel;
  connectionState: RTCIceConnectionState;
  send: (msg: TransportMessage) => void;
  close: () => void;
}

const config: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export async function createPeerConnection(
  targetId: string,
  signaling: SignalingClient,
  options: {
    isInitiator: boolean;
    onMessage: (msg: TransportMessage) => void;
    onStatusChange?: (status: RTCIceConnectionState) => void;
  }
): Promise<PeerConnection> {
  const pc = new RTCPeerConnection(config);
  let dataChannel: RTCDataChannel | undefined;
  let currentStatus: RTCIceConnectionState = 'new';

  const updateStatus = (status: RTCIceConnectionState) => {
    currentStatus = status;
    console.log(`PeerConnection [${targetId}] state: ${status}`);
    if (options.onStatusChange) options.onStatusChange(status);
  };

  const handleDataChannel = (dc: RTCDataChannel) => {
    dc.binaryType = 'arraybuffer';
    dc.onmessage = (event) => {
      try {
        const msg = decode(event.data);
        options.onMessage(msg);
      } catch (e) {
        console.error(`Failed to decode message from ${targetId}`, e);
      }
    };
    dc.onopen = () => {
      console.log(`DataChannel with ${targetId} opened`);
      updateStatus(pc.iceConnectionState);
    };
    dc.onclose = () => {
      console.log(`DataChannel with ${targetId} closed`);
    };
    dataChannel = dc;
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      signaling.sendSignal(targetId, { candidate: event.candidate });
    }
  };

  pc.oniceconnectionstatechange = () => {
    updateStatus(pc.iceConnectionState);
  };

  if (options.isInitiator) {
    const dc = pc.createDataChannel('darkshark-transport');
    handleDataChannel(dc);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signaling.sendSignal(targetId, { sdp: pc.localDescription });
    } catch (e) {
      console.error(`Failed to initiate connection with ${targetId}`, e);
      throw e;
    }
  } else {
    pc.ondatachannel = (event) => {
      handleDataChannel(event.channel);
    };
  }

  return {
    targetId,
    pc,
    get connectionState() { return currentStatus; },
    dc: dataChannel,
    send: (msg) => {
      if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(encode(msg) as any);
      } else {
        console.warn(`Cannot send message to ${targetId}, DataChannel not open (state: ${currentStatus})`);
      }
    },
    close: () => {
      if (dataChannel) dataChannel.close();
      pc.close();
    }
  };
}

export async function handleIncomingSignal(
  pc: RTCPeerConnection,
  targetId: string,
  signaling: SignalingClient,
  signal: any
) {
  if (signal.sdp) {
    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    if (signal.sdp.type === 'offer') {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signaling.sendSignal(targetId, { sdp: pc.localDescription });
    }
  } else if (signal.candidate) {
    await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
  }
}
