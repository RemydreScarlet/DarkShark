import { ExpertMetadata } from './types';

export function createMetadata(nodeId: string, role: 'orchestrator' | 'worker' | 'observer', capabilities: string[] = []): ExpertMetadata {
  return {
    nodeId,
    role,
    capabilities,
    status: 'online',
    lastSeen: Date.now(),
  };
}

export function serializeMetadata(metadata: ExpertMetadata): string {
  return JSON.stringify(metadata);
}

export function deserializeMetadata(data: string): ExpertMetadata {
  return JSON.parse(data) as ExpertMetadata;
}
