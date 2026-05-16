const worker = new Worker(new URL('./inference.worker.ts', import.meta.url), { type: 'module' });

export const initializeInference = async (onProgress: (progress: number) => void) => {
  return new Promise<void>((resolve) => {
    worker.onmessage = (event) => {
      if (event.data.type === 'PROGRESS') onProgress(event.data.payload);
      if (event.data.type === 'INITIALIZED') resolve();
    };
    worker.postMessage({ type: 'INITIALIZE' });
  });
};

export const localInference = async (
  input: string,
  onToken: (token: string) => void
): Promise<string> => {
  return new Promise((resolve) => {
    worker.onmessage = (event) => {
      if (event.data.type === 'TOKEN') onToken(event.data.payload);
      if (event.data.type === 'COMPLETE') resolve(event.data.payload);
    };
    worker.postMessage({ type: 'INFERENCE', payload: { input } });
  });
};


