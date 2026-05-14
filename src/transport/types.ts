import { encode as mpEncode, decode as mpDecode } from '@msgpack/msgpack';

export type MessageType = 'inference_request' | 'inference_response' | 'kv_sync';

export interface TransportMessage {
  type: MessageType;
  payload: any;
  timestamp: number;
}

export function encode(message: TransportMessage): Uint8Array {
  return mpEncode(message);
}

export function decode(buffer: ArrayBuffer | Uint8Array): TransportMessage {
  const uint8Array = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  return mpDecode(uint8Array) as TransportMessage;
}
