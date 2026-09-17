<div align="center">

[简体中文](./README.md) | [English](./README.en-US.md) | **日本語**

# XnetAIops Web

**XnetAIops インテリジェント運用プラットフォームの Web コンソール**

[![GOAI release](https://img.shields.io/badge/GOAI%20release-1.3.0-1677ff.svg)](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0) [![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/license-MIT-2ea44f.svg)](./LICENSE)

[オンラインデモ](https://goai.xnetaiops.synapxnet.online) · [バックエンド: XnetAIops](https://github.com/synapxnet/XnetAIops/tree/v1.3.0) · [OpenXnet](https://openxnet.synapxnet.com) · [ライセンス](./LICENSE)

</div>

## GOAI 決勝版 · v1.3.0

[リリース・チェックサム](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0) · [ソース ZIP](https://github.com/synapxnet/XnetAIops-web/releases/download/v1.3.0/XnetAIops-web-v1.3.0-a5e9c2c0-source.zip) · [v1.3.0 ソース](https://github.com/synapxnet/XnetAIops-web/tree/v1.3.0) · [対応する XnetAIops](https://github.com/synapxnet/XnetAIops/releases/tag/v1.3.0) · [OpenXnet デスクトップ](https://github.com/synapxnet/OpenXnet/releases/tag/v1.3.0)

> 既定の `display` ブランチには過去のコードが残っています。バッジは GOAI リリースを示します。v1.3.0 の利用にはタグまたはリリース添付ファイルを選択してください。

統一ログイン画面、スキン、常駐 Agent のチャット・設定、運用確認、制御された端末操作を提供します。複数プラットフォームの協調と承認は OpenXnet と AgentTeams を通じて管理し、画面操作だけで実行権限は付与されません。

依存関係、検証結果、制限は[ソース配布・構築の説明](https://github.com/synapxnet/XnetAIops-web/blob/a5e9c2c057ba29d94ee90d7e3acd645e89475f1c/docs/GOAI-FINALS-V1.3.0-SOURCE-DELIVERY.md)を参照してください。この公開はオンライン環境の再デプロイを意味しません。 本番ビルドは成功しましたが、全体の型チェックには 135 件の問題が残っています。

> 以下は旧版の画面例です。v1.3.0 の UI 検証画像ではありません。

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

[XnetAIops バックエンド](https://github.com/synapxnet/XnetAIops/tree/v1.3.0) と組み合わせることで、企業向けマルチテナント、フロントエンド・バックエンド分離システムを構成します。Vue 3、TypeScript、Vite、Ant Design Vue、および [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) を採用しています。

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

## v1.3.0 の取得とビルド

**Node.js 20.10.0 以上**、**pnpm 9.15.7** を使用します。Vue 3、TypeScript 5、Vite、Ant Design Vue、Vben ワークスペースに基づいています。

```bash
git clone --branch v1.3.0 --depth 1 https://github.com/synapxnet/XnetAIops-web.git
cd XnetAIops-web
corepack enable
corepack prepare pnpm@9.15.7 --activate
pnpm install --frozen-lockfile
pnpm exec turbo build --filter=@vben/web-antd --env-mode=loose
```

出力は `apps/web-antd/dist` です。対応 Nginx または HTTPS ゲートウェイで公開します。静的フロントエンドだけではバックエンドや常駐 Agent は起動しません。

### ローカル開発と API

`pnpm dev:antd` の既定ポートは `5777` です。先に `apps/web-antd/vite.config.mts` の旧 LAN プロキシを自分のバックエンドへ変更し、`/usr`、`/clm`、`/hom`、`/svm`、`/mon`、`/k8s`、`/reg` を設定してください。K8s は `AIOPS_K8S_DEV_URL` を使えます。サーバー自動検出や完全な常駐サービス設定は行いません。

本番 `.env.production` は同一オリジンの `/api/usr`、`/api/clm`、`/api/hom`、`/api/svm`、`/api/mon`、`/api/k8s`、`/api/reg` を使用します。独立 Node 常駐サービスへの `/api/resident/v1/` 転送はゲートウェイで別途設定します。モデル API キーはブラウザーに置かず、バックエンド・常駐・モデル・認証を個別に設定してください。

本番ビルドと 45 件の回帰テストは成功しました。全体の型チェックには 135 件の既知問題が残っています。詳細は配布説明を参照してください。

## デモへのアクセス

- 現在の GOAI 入口: <https://goai.xnetaiops.synapxnet.online/#/auth/login>。
- デモ電話番号: `17870171303`。確認コード: `000000`（6 桁、このデモ環境専用）。
- 電話番号と確認コードでログインします。OpenXnet デスクトップのパスワードではありません。この画面は SMS を送信せず、コードはプロジェクトから提供されます。
- 2026-09-18 の確認結果: `goai_operator` / `OPERATOR` でログイン成功。ページ名は `XnetAIops`、常駐 Agent は `platform=aiops`、`agentVersion=1.3.0`、`ONLINE`。
- このコードはログイン専用です。AgentTeams デモアクセスコード、Live 実行承認、モデル API キーとは別であり、後者は公開しません。

API ゲートウェイは同一オリジンの `https://goai.xnetaiops.synapxnet.online` です。ログインは `POST /api/usr/login`、身元確認は `GET /api/usr/user/info`、常駐状態は `GET /api/resident/v1/status`。後二者にはプラットフォームの Bearer トークンが必要です。業務の接頭辞は `/api/clm`、`/api/hom`、`/api/svm`、`/api/mon`、`/api/k8s`、`/api/reg` です。

今回確認したのはログインと読み取り専用の身元・常駐状態です。業務変更やモデル呼び出しは行っていません。`modelConfigured=true` は設定の存在を示し、推論の検証結果ではありません。公開デモの認証を本番環境で使用しないでください。

## ライセンスと上流プロジェクト

[MIT License](./LICENSE) の下で公開されています。フロントエンドは [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) を採用し、上流プロジェクトの MIT 著作権・ライセンス表示を保持しています。

XnetAIops は [OpenXnet](https://openxnet.synapxnet.com) の一部です。Copyright © 2026 SynapXnet.
