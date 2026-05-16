import { ExpertMessage } from '../expert/types';
import { signaling } from '../transport/signaling'; // 既存のシグナリングインスタンスを仮定

// ノードIDが必要
const ORCHESTRATOR_ID = 'orchestrator-node-id'; // 適切なID管理へ変更が必要

export const initializeInference = async (onProgress: (progress: number) => void) => {
  // バックエンド側ですでに初期化されていることが前提だが、必要なら通知を受ける
  return Promise.resolve();
};

export const remoteInference = async (
  input: string,
  onToken: (token: string) => void,
  onProgress: (progress: number) => void
): Promise<string> => {
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    const handler = (msg: ExpertMessage) => {
      if (msg.type === 'inference_response' && msg.data.requestId === requestId) {
        if (msg.data.type === 'TOKEN') onToken(msg.data.payload);
        if (msg.data.type === 'PROGRESS') onProgress(msg.data.payload);
        if (msg.data.type === 'COMPLETE') {
          signaling.off('inference_response', handler);
          resolve(msg.data.payload);
        }
      }
    };

    signaling.on('inference_response', handler);

    signaling.sendToPeer(ORCHESTRATOR_ID, {
      type: 'inference_request',
      senderId: 'ui-client',
      timestamp: Date.now(),
      data: { input, requestId }
    });
  });
};
