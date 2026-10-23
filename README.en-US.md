<!-- Copyright (C) 2026 Synapxnet. All rights reserved.
Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0 | Security Level: INTERNAL -->
# XnetAIOps Web

[简体中文](README.md) · [日本語](README.ja-JP.md)

The XnetAIOps operations workspace uses Vue 3, TypeScript, Vite and Ant Design Vue. It includes 3D overview, clusters, hosts, services, alerts, Kubernetes, registries, organizational access, resident Agent chat/tasks/model settings, knowledge and Skill workbenches, operational assurance and cross-platform execution evidence.

Active development uses `main`; historical release branches and tags remain available.

## Development

Use Node.js 22 and the repository-pinned pnpm 9.15.7.

```bash
pnpm install --frozen-lockfile
pnpm dev:antd
pnpm test:unit
pnpm --filter @vben/web-antd typecheck
pnpm build:antd
```

The application lives in `apps/web-antd`; builds are written to `apps/web-antd/dist`. Development API targets use the `AIOPS_*_DEV_URL` settings in `vite.config.mts`, defaulting to local service ports.

## Services and authentication

Production API requests use the same origin and a gateway to the [XnetAIOps backend](https://github.com/synapxnet/XnetAIops). Resident Agents use `/api/resident/v1/`, with separately configured gateway routes and authorization.

Sign in with an administrator-provisioned account and a one-time SMS code. No competition account or shared code is prefilled. The backend owns SMS delivery, identity and permissions. Missing resources remain empty instead of producing fabricated success records or monitoring metrics.

Optional login-page platform links use complete HTTP(S) values in `VITE_XNET_AIOPS_URL`, `VITE_XNET_DATAOPS_URL` and `VITE_XNET_MLOPS_URL`. Unconfigured links are hidden. `VITE_XNET_REHEARSAL_ENABLED` defaults to false and is intended only for isolated rehearsal environments.

## Capabilities and evidence

Resident Agents, organizational access, reusable Skills, knowledge management, skins and 3D capabilities are retained. Evidence distinguishes production from rehearsal and preserves missing measurements. Successful tool execution does not establish business recovery.

CI runs only on manual dispatch with read-only repository permissions. It checks and builds without deploying, publishing or uploading artifacts.

[Transition notes](docs/MAINLINE-TRANSITION.md) · [OpenXnet](https://openxnet.synapxnet.com)

## License

See [LICENSE](LICENSE) and the notices in individual files.
