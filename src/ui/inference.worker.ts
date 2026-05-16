import { pipeline, env, TextStreamer } from '@huggingface/transformers';

env.allowRemoteModels = true;
env.allowLocalModels = false;

let generator: any = null;
const chatHistory: any[] = [];
const MODEL_ID = 'onnx-community/Qwen3-0.6B-ONNX';

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'INITIALIZE') {
    generator = await pipeline('text-generation', MODEL_ID, {
      device: 'wasm',
      progress_callback: (p: any) => {
        self.postMessage({ type: 'PROGRESS', payload: p.progress / 100 });
      },
    });
    self.postMessage({ type: 'INITIALIZED' });
  }

  if (type === 'INFERENCE') {
    const { input } = payload;
    chatHistory.push({ role: 'user', content: input });

    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      callback_function: (token: string) => {
        self.postMessage({ type: 'TOKEN', payload: token });
      },
    });

    const output = await generator(chatHistory, {
      max_new_tokens: 128,
      temperature: 0.7,
      do_sample: true,
      streamer,
    });

    const response = output[0].generated_text.at(-1).content;
    chatHistory.push({ role: 'assistant', content: response });
    self.postMessage({ type: 'COMPLETE', payload: response });
  }
};
