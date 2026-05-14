import { describe, it, expect } from 'vitest';
import { ExpertOrchestrator } from '../src/expert/orchestrator';
import { ExpertNode } from '../src/expert/node';
import { SignalingClient } from '../src/signaling/server';

// Mock Signaling
const mockSignaling = {
  sendSignal: (targetId: string, signal: any) => {}
} as unknown as SignalingClient;

describe('Expert Orchestration System', () => {
  it('should initialize orchestrator and worker', () => {
    const orchestrator = new ExpertOrchestrator('orch-1', mockSignaling);
    const worker = new ExpertNode('worker-1', 'worker', mockSignaling);

    expect(orchestrator.metadata.role).toBe('orchestrator');
    expect(worker.metadata.role).toBe('worker');
  });

  // Further integration tests would require setting up a real RTC environment,
  // which might be done using JSDOM or a dedicated browser test runner.
});
