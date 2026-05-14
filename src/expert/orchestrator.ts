import { ExpertNode } from './node';
import { ExpertTask, ExpertMessage } from './types';
import { SignalingClient } from '../signaling/server';

export class ExpertOrchestrator extends ExpertNode {
  private tasks: Map<string, ExpertTask> = new Map();

  constructor(nodeId: string, signaling: SignalingClient, capabilities: string[] = []) {
    super(nodeId, 'orchestrator', signaling, capabilities);
    
    // Start heartbeat interval
    setInterval(() => this.sendHeartbeat(), 5000);
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
