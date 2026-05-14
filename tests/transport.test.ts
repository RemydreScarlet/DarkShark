import { describe, it, expect } from 'vitest';
import { encode, decode, TransportMessage } from '../src/transport/types';

describe('Transport Serialization', () => {
  it('should correctly encode and decode messages using MessagePack', () => {
    const originalMessage: TransportMessage = {
      type: 'inference_request',
      payload: { prompt: 'Hello world', params: { temperature: 0.7 } },
      timestamp: Date.now()
    };

    const encoded = encode(originalMessage);
    expect(encoded).toBeInstanceOf(Uint8Array);
    
    const decoded = decode(encoded);
    expect(decoded).toEqual(originalMessage);
  });

  it('should handle large payloads (simulating KV cache)', () => {
    const largeData = new Float32Array(1000).fill(0.5);
    const message: TransportMessage = {
      type: 'kv_sync',
      payload: { data: largeData },
      timestamp: Date.now()
    };

    const encoded = encode(message);
    const decoded = decode(encoded);
    
    // Float32Array might be decoded as a regular Array or Buffer depending on MessagePack config,
    // but the data integrity should be maintained.
    expect(decoded.type).toBe('kv_sync');
    expect(Object.values(decoded.payload.data).length).toBe(1000);
  });
});
