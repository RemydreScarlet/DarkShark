import { pipeline, TextStreamer, env } from '@huggingface/transformers';

env.allowRemoteModels = true;
env.allowLocalModels = false;

export class InferenceEngine {
  private generator: any = null;
  private chatHistory: any[] = [];
  private readonly MODEL_ID = 'onnx-community/Qwen3-0.6B-ONNX';

  async initialize(onProgress: (progress: number) => void): Promise<void> {
    this.generator = await pipeline('text-generation', this.MODEL_ID, {
      device: 'cpu', // Node.js環境用に明示的指定
      progress_callback: (p: any) => {
        onProgress(p.progress / 100);
      },
    });
  }

  async generate(
    input: string,
    onToken: (token: string) => void
  ): Promise<string> {
    if (!this.generator) throw new Error('Engine not initialized');

    this.chatHistory.push({ role: 'user', content: input });

    const streamer = new TextStreamer(this.generator.tokenizer, {
      skip_prompt: true,
      callback_function: (token: string) => {
        onToken(token);
      },
    });

    const output = await this.generator(this.chatHistory, {
      max_new_tokens: 128,
      temperature: 0.7,
      do_sample: true,
      streamer,
    });

    const response = output[0].generated_text.at(-1).content;
    this.chatHistory.push({ role: 'assistant', content: response });
    return response;
  }
}
