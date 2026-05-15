# Architecture

## Communication Protocol
WebRTC DataChannels are used for P2P transport, utilizing `@msgpack/msgpack` for efficient binary serialization of `TransportMessage`.

## Inference Engine
`@mlc-ai/web-llm` is used as the primary engine for WebGPU-accelerated model inference (e.g., Qwen3.5-2B-Instruct).

## Expert Node
- `ExpertNode`: Manages local state, peer connections, and model inference.
- `ExpertMessage`: Structured messages exchanged between nodes.
- Roles: `orchestrator`, `worker`, `observer`.
