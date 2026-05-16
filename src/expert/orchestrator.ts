import { ExpertNode } from './node';
import { ExpertTask, ExpertMessage } from './types';
import { SignalingClient } from '../transport/signaling';
import { InferenceEngine } from './engine';

export class ExpertOrchestrator extends ExpertNode {
  private tasks: Map<string, ExpertTask> = new Map();
  private inferenceEngine: InferenceEngine = new InferenceEngine();

  constructor(nodeId: string, signaling: SignalingClient, capabilities: string[] = []) {
    super(nodeId, 'orchestrator', signaling, capabilities);
    
    // Start heartbeat interval
    setInterval(() => this.sendHeartbeat(), 5000);

    this.on('inference_request', (msg: ExpertMessage) => this.handleInferenceRequest(msg));
  }

  private async handleInferenceRequest(msg: ExpertMessage) {
    const { input, requestId } = msg.data;

    // Initialize engine if not yet
    if (!this.inferenceEngine) await this.inferenceEngine.initialize((p) => {
        this.sendToPeer(msg.senderId, {
            type: 'inference_response',
            senderId: this.metadata.nodeId,
            timestamp: Date.now(),
            data: { type: 'PROGRESS', payload: p, requestId }
        });
    });

    const response = await this.inferenceEngine.generate(input, (token) => {
      this.sendToPeer(msg.senderId, {
        type: 'inference_response',
        senderId: this.metadata.nodeId,
        timestamp: Date.now(),
        data: { type: 'TOKEN', payload: token, requestId }
      });
    });

    this.sendToPeer(msg.senderId, {
      type: 'inference_response',
      senderId: this.metadata.nodeId,
      timestamp: Date.now(),
      data: { type: 'COMPLETE', payload: response, requestId }
    });
  }

  private sendHeartbeat() {
    const msg: ExpertMessage = {
      type: 'heartbeat',
      senderId: this.metadata.nodeId,
      timestamp: Date.now(),
      data: { status: this.metadata.status }
    };
    this.broadcast(msg);
  }

  async dispatchTask(workerId: string, task: ExpertTask) {
    this.tasks.set(task.taskId, task);
    const msg: ExpertMessage = {
      type: 'task_request',
      senderId: this.metadata.nodeId,
      timestamp: Date.now(),
      data: task
    };
    await this.sendToPeer(workerId, msg);
  }
}
