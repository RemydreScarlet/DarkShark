import { AutoProcessor, AutoModelForCausalLM } from '@huggingface/transformers';

export class QwenModelLoader {
    private static model: any = null;
    private static processor: any = null;
    private static readonly modelId = 'onnx-community/Qwen3-0.6b-heretic-ONNX';

    static async getModelAndProcessor() {
        if (!this.model || !this.processor) {
            this.processor = await AutoProcessor.from_pretrained(this.modelId);
            this.model = await AutoModelForCausalLM.from_pretrained(this.modelId, {
                device: 'wasm',
            });
        }
        return { model: this.model, processor: this.processor };
    }

    static async generate(prompt: string) {
        const { model, processor } = await this.getModelAndProcessor();
        const inputs = await processor(prompt, { return_tensor: false });
        const outputs = await model.generate({
            ...inputs,
            max_new_tokens: 50,
        });
        const decoded = processor.batch_decode(outputs, { skip_special_tokens: true });
        return decoded[0];
    }
}
