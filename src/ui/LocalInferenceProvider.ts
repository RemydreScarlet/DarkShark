import { pipeline, env, TextStreamer } from '@huggingface/transformers';

env.allowRemoteModels = true;
env.allowLocalModels = false;

let generator: any = null;
let chatHistory: any[] = [];

const MODEL_ID = 'onnx-community/Qwen3-0.6B-ONNX';

export const initializeInference = async (onProgress: (progress: number) => void) => {
  if (generator) return;

  onProgress(0.1);
  generator = await pipeline('text-generation', MODEL_ID, {
    device: 'wasm',
    progress_callback: (p: any) => onProgress(p.progress / 100),
  });
  onProgress(1.0);
};

export const localInference = async (input: string): Promise<string> => {
  if (!generator) {
    throw new Error("Generator not initialized");
  }

  chatHistory.push({ role: 'user', content: input });

  const output = await generator(chatHistory, {
    max_new_tokens: 128,
    temperature: 0.7,
    do_sample: true,
  });

  const response = output[0].generated_text.at(-1).content;
  chatHistory.push({ role: 'assistant', content: response });

  return response;
};


