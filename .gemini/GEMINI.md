# DarkShark

ブラウザP2Pノードを繋ぎ、分散型 Product of Experts (PoE) で協調推論を行うシステム。
各ノードは Transformers.js で動作する 0.8B LLM + LoRAマージ済みONNXモデルをExpertとして機能する。

## アーキテクチャ概要

```
クエリ → コーディネーター（埋め込み + ルーティング）
       → WebRTC P2P → 各Expertノード（10トークン分logits返送）
       → Product of Experts 統合 → サンプリング → 次ラウンド
```

- **ベースモデル**: Qwen3.5-2B（全ノード同一ONNXチェックポイント）
- **LoRA**: オフラインで `merge_and_unload()` → ONNX変換済み。Attention含む全層に適用
- **通信**: WebRTC DataChannel。KVキャッシュ + logitsをArrayBufferで転送
- **シグナリング**: Node.js + ws（最小構成）

詳細仕様 → `docs/architecture.md`

## ディレクトリ構成

```
darkshark/
├── CLAUDE.md
├── docs/
│   ├── architecture.md       # 詳細仕様（アーキテクチャ・通信プロトコル）
│   ├── expert-metadata.md    # ExpertMetadata フォーマット仕様
│   └── roadmap.md            # フェーズ別実装計画
├── src/
│   ├── coordinator/          # ルーティング・PoE統合ロジック
│   ├── expert/               # Expertノード（Transformers.js + ONNX）
│   ├── transport/            # WebRTC DataChannel 通信層
│   └── signaling/            # シグナリングサーバー（Node.js）
├── scripts/
│   └── convert_lora.py       # LoRA → ONNX変換スクリプト（Python/optimum）
└── tests/
```

## 技術スタック

|レイヤー   |技術                                      |
|-------|----------------------------------------|
|モデル実行  |`@xenova/transformers`（ONNX Runtime Web）|
|P2P通信  |WebRTC DataChannel                      |
|シリアライズ |MessagePack                             |
|フロントエンド|TypeScript + Vite                       |
|LoRA変換 |Python + peft + optimum                 |

## ビルド・開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# 型チェック
pnpm typecheck

# テスト
pnpm test

# シグナリングサーバー単体起動
pnpm signaling

# LoRA → ONNX 変換（Python）
python scripts/convert_lora.py --model ./lora_model --output ./public/models/expert_name
```

## 実装ルール

### アルゴリズム（変更禁止）

- Expert重み: `w_i = (cosine_similarity + 1)²`
- PoE統合: `log p_final = Σ (w_i / Σw_j) × log p_i(x)`（log空間で計算）
- クエリ埋め込み: 最終トークンの last hidden state（mean poolingしない）
- 生成単位: 10トークン固定

### Transformers.js の使い方

- モデルロード時は必ず `dtype: 'q4'` と `device: 'webgpu'` を指定
- `output_hidden_states: true` と `use_cache: true` を常に有効化
- KVキャッシュ転送時は Tensor → Float32Array にフラット化し shape を添付

### 型・コード規約

- `Float32Array` を数値計算の基本型とする（`number[]` は使わない）
- WebRTC メッセージは `ArrayBuffer` で送受信（JSON禁止、帯域節約）
- 非同期処理は `async/await` で統一（`.then()` チェーン禁止）
- ファイル名: `kebab-case`、クラス名: `PascalCase`、変数/関数: `camelCase`

### やるべきこと
- テスト駆動型開発

### やってはいけないこと

- KVキャッシュを受信側で再計算しない（PoEに任せる設計）
- LoRAをブラウザでリアルタイム適用しない（必ずオフラインでマージ済みONNXを使う）
- CLAUDE.md に詳細手順を書かない（`docs/` に置いて `@docs/filename.md` で参照）

## 参照ドキュメント

詳細が必要なときは以下を参照すること：

- 通信プロトコル・KVキャッシュ形式 → `@docs/architecture.md`
- ExpertMetadata JSON スキーマ → `@docs/expert-metadata.md`
- フェーズ別タスク・チェックリスト → `@docs/roadmap.md`