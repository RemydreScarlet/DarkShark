import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    deps: {
      optimizer: {
        web: {
          include: ['@mlc-ai/web-llm']
        }
      }
    }
  }
});
