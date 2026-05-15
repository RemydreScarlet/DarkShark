import * as webllm from "@mlc-ai/web-llm";

export class QwenModelLoader {
    private static engine: webllm.MLCEngine | null = null;
    private static readonly modelId = "Qwen3.5-2B-Instruct-q4f16_1-MLC";

    static async getEngine() {
        if (!this.engine) {
            this.engine = await webllm.CreateMLCEngine(this.modelId, {
                initProgressCallback: (report: webllm.InitProgressReport) => {
                    console.log(`[WebLLM] ${report.text}`);
                },
            });
        }
        return this.engine;
    }

    static async generate(prompt: string) {
        const engine = await this.getEngine();
        const messages: webllm.ChatCompletionMessageParam[] = [
            { role: "user", content: prompt },
        ];
        const reply = await engine.chat.completions.create({ messages });
        return reply.choices[0].message.content;
    }
}
