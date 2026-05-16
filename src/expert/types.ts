export type NodeRole = 'orchestrator' | 'worker' | 'observer';

export interface ExpertMetadata {
  nodeId: string;
  role: NodeRole;
  capabilities: string[];
  status: 'online' | 'busy' | 'offline';
  lastSeen: number;
}

export interface ExpertTask {
  taskId: string;
  payload: any;
  priority: number;
  deadline?: number;
}

export interface ExpertMessage {
  type: 'metadata_update' | 'task_request' | 'task_response' | 'heartbeat' | 'inference_request' | 'inference_response';
  senderId: string;
  timestamp: number;
  data: any;
}
