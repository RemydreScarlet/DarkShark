import { pipeline, env } from '@huggingface/transformers';

// Configure environment for local models
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = '/models/'; 

export class QwenModelLoader {
    private static pipeline: any = null;

    static async getPipeline() {
        if (!this.pipeline) {
            this.pipeline = await pipeline('text-generation', 'qwen-3.5-2b', {
                device: 'webgpu',
            });
        }
        return this.pipeline;
    }

    static async generate(prompt: string) {
        const generator = await this.getPipeline();
        return await generator(prompt, {
            max_new_tokens: 128,
        });
    }
}
