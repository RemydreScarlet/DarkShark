import { describe, it, expect, vi } from 'vitest';
import { ExpertOrchestrator } from '../src/expert/orchestrator';
import { ExpertNode } from '../src/expert/node';
import { SignalingClient } from '../src/signaling/server';
import { QwenModelLoader } from '../src/expert/model';

// Mock Signaling
const mockSignaling = {
  sendSignal: (targetId: string, signal: any) => {}
} as unknown as SignalingClient;

// Mock Transformers.js pipeline
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(vi.fn().mockResolvedValue([{ generated_text: 'Hello, world!' }])),
  env: {
    allowLocalModels: true,
    allowRemoteModels: false,
    localModelPath: '',
  }
}));

describe('Expert Orchestration System', () => {
  it('should initialize orchestrator and worker', () => {
    const orchestrator = new ExpertOrchestrator('orch-1', mockSignaling);
    const worker = new ExpertNode('worker-1', 'worker', mockSignaling);

    expect(orchestrator.metadata.role).toBe('orchestrator');
    expect(worker.metadata.role).toBe('worker');
  });

  it('should generate text using QwenModelLoader', async () => {
    const response = await QwenModelLoader.generate('Hello');
    expect(response[0].generated_text).toBe('Hello, world!');
  });
});
