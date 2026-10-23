<!-- Copyright (C) 2026 Synapxnet. All rights reserved.
Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0 | Security Level: INTERNAL -->
# XnetAIOps Web

[简体中文](README.md) · [English](README.en-US.md)

Vue 3、TypeScript、Vite、Ant Design Vue による XnetAIOps 運用画面です。3D 概要、クラスター、ホスト、サービス、アラート、Kubernetes、レジストリ、組織権限に加え、常駐 Agent の会話・タスク・モデル設定、知識と Skill、運用管理、プラットフォーム横断の実行証拠を提供します。

開発の主ブランチは `main` です。過去のリリースブランチとタグも保持します。

## 開発

Node.js 22 と、リポジトリ指定の pnpm 9.15.7 を使用します。

```bash
pnpm install --frozen-lockfile
pnpm dev:antd
pnpm test:unit
pnpm --filter @vben/web-antd typecheck
pnpm build:antd
```

アプリケーションは `apps/web-antd`、成果物は `apps/web-antd/dist` に配置されます。開発 API は `vite.config.mts` の `AIOPS_*_DEV_URL` で指定し、既定ではローカルの対応するサービスポートへ接続します。

## サービスと認証

本番 API は同一オリジンのゲートウェイ経由で [XnetAIOps バックエンド](https://github.com/synapxnet/XnetAIops) に接続します。常駐 Agent の `/api/resident/v1/` には別途ゲートウェイと権限の設定が必要です。

管理者が登録したアカウントと SMS のワンタイムコードでログインします。大会用アカウントや共通コードは初期入力されません。SMS 送信、本人確認、権限はバックエンドが管理します。リソースがない場合は空の状態を表示し、成功記録や監視値を生成しません。

ログイン画面の任意のリンクは `VITE_XNET_AIOPS_URL`、`VITE_XNET_DATAOPS_URL`、`VITE_XNET_MLOPS_URL` に完全な HTTP(S) URL を設定します。未設定のリンクは非表示です。`VITE_XNET_REHEARSAL_ENABLED` は既定で無効とし、隔離された演習環境でのみ有効にします。

## 機能と証拠

常駐 Agent、組織権限、再利用可能な Skill、知識管理、スキン、3D 機能を保持します。本番と演習の証拠を分け、未取得の測定値を補いません。ツールの成功だけでは業務復旧と判定しません。

CI は手動起動のみで、リポジトリ権限は読み取り専用です。検査とビルドを行い、デプロイ、公開、成果物アップロードは行いません。

[移行情報](docs/MAINLINE-TRANSITION.md) · [OpenXnet](https://openxnet.synapxnet.com)

## ライセンス

[LICENSE](LICENSE) と各ファイルの表記を参照してください。
