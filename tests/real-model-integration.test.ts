import { describe, it, expect, vi } from 'vitest';
import * as webllm from "@mlc-ai/web-llm";

// Mock the entire webllm module
vi.mock("@mlc-ai/web-llm", () => {
  const mockEngine = {
    chat: {
      completions: {
        create: vi.fn().mockImplementation((args) => {
          const prompt = args.messages[0].content;
          return Promise.resolve({
            choices: [{ message: { content: `Echoing: ${prompt}` } }]
          });
        })
      }
    }
  };
  return {
    CreateMLCEngine: vi.fn().mockResolvedValue(mockEngine)
  };
});

describe('Qwen Model Integration', () => {
  it('should pass the prompt to the engine and return the correct response', async () => {
    const { QwenModelLoader } = await import('../src/expert/model');
    const prompt = 'Hello, Qwen!';
    const response = await QwenModelLoader.generate(prompt);
    expect(response).toBe(`Echoing: ${prompt}`);
  });
});
