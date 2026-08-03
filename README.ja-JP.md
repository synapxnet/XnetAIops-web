<div align="center">

[简体中文](./README.md) | [English](./README.en-US.md) | **日本語**

# XnetAIops Web

**XnetAIops インテリジェント運用プラットフォームの Web コンソール**

[![Version](https://img.shields.io/badge/version-1.0.0-1677ff.svg)](https://www.xnetaiops.synapxnet.cn) [![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/license-MIT-2ea44f.svg)](./LICENSE)

[オンラインデモ](https://www.xnetaiops.synapxnet.cn) · [バックエンド: XnetAIops](https://github.com/synapxnet/XnetAIops) · [OpenXnet](https://openxnet.synapxnet.com) · [ライセンス](./LICENSE)

</div>

![XnetAIops 3D クラスター概要](./docs/images/xnetaiops-overview-2026.png)

## 画面プレビュー

| デモログイン | プロジェクト情報 |
| --- | --- |
| ![デモログイン](./docs/images/xnetaiops-login.png) | ![XnetAIops について](./docs/images/xnetaiops-about.png) |
| クラスター管理 | ホスト登録 |
| ![クラスター管理](./docs/images/xnetaiops-clusters.png) | ![ホスト登録](./docs/images/xnetaiops-host-add.png) |
| Kubernetes | サービス編成 |
| ![Kubernetes](./docs/images/xnetaiops-kubernetes.png) | ![サービス編成](./docs/images/xnetaiops-service.png) |
| 監視とアラート | イメージレジストリ |
| ![監視](./docs/images/xnetaiops-monitor-2026.png) | ![レジストリ](./docs/images/xnetaiops-registry.png) |
| マルチテナントユーザー | Kubernetes ノード |
| ![ユーザー](./docs/images/xnetaiops-users.png) | ![Kubernetes ノード](./docs/images/xnetaiops-k8s-nodes.png) |
| Kubernetes 名前空間 | Kubernetes ワークロード |
| ![Kubernetes 名前空間](./docs/images/xnetaiops-k8s-namespaces.png) | ![Kubernetes ワークロード](./docs/images/xnetaiops-workloads-2026.png) |

## 概要

XnetAIops Web は **SynapXnet チーム**が公開する運用管理コンソールです。ホスト、インフラクラスター、サービス、監視、Kubernetes、イメージレジストリ、アクセス制御を統合します。

[XnetAIops バックエンド](https://github.com/synapxnet/XnetAIops) と組み合わせることで、企業向けマルチテナント、フロントエンド・バックエンド分離システムを構成します。Vue 3、TypeScript、Vite、Ant Design Vue、および [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) を採用しています。

## GOAI Competition 1.0.0

`GOAI-Competition` ブランチは `/agent/incidents/:incidentId` 証拠ディープリンクを追加します。単一 Trace 上でアラート、ワークロード、サービス正常性を表示し、部分失敗、再読み込み、ライト/ダークテーマ、狭い画面に対応します。

[ルート引数、連携、検証結果](./docs/goai-handoff/HANDOFF-GOAI-COMPETITION-1.0.0.md) · [XnetAIops バックエンド](https://github.com/synapxnet/XnetAIops/tree/GOAI-Competition)

## 特長

- ロールとリソース境界を備えた企業向けマルチテナント。
- インフラ、サービス、Kubernetes、監視、レジストリを一つの画面で管理。
- フロントエンドを独立配備し、既存ゲートウェイへ柔軟に統合。
- モジュール化されたルートと API クライアント。
- SynapXnet チームによる継続的な更新。

## モジュール

| モジュール | 主な機能                                       |
| ---------- | ---------------------------------------------- |
| 3D 概要    | クラスター、ラック、ホスト、トポロジーの可視化 |
| CLM        | クラスター、MySQL、Redis、Hadoop、Jenkins      |
| HOM        | ホスト台帳、ラック、SSH、容量管理              |
| SVM        | サービス定義、コマンド、ロール、ライフサイクル |
| MON        | メトリクス、アラートルール、履歴、状態概要     |
| K8S        | リソース、Helm、監視、アプリカタログ、CI/CD    |
| REG        | レジストリ、プロジェクト、タグ、同期           |
| USR        | ユーザー、ロール、アクセス制御                 |

## 開発

```bash
corepack enable
pnpm install
pnpm dev:antd
pnpm build:antd
```

Node.js 20+ と pnpm 9.15.7 を使用してください。本番の認証情報やトークンをコミットしないでください。

## デモ

- URL: <https://www.xnetaiops.synapxnet.cn>
- 電話番号: `12345678900`
- 確認コード: `000000`

固定確認コードは公開デモ専用です。本番環境では安全な認証方式を使用してください。

## ライセンスと上流プロジェクト

[MIT License](./LICENSE) の下で公開されています。フロントエンドは [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) を採用し、上流プロジェクトの MIT 著作権・ライセンス表示を保持しています。

XnetAIops は [OpenXnet](https://openxnet.synapxnet.com) の一部です。Copyright © 2026 SynapXnet.
