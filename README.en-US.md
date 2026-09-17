<div align="center">

[简体中文](./README.md) | **English** | [日本語](./README.ja-JP.md)

# XnetAIops Web

**Web console for the XnetAIops intelligent operations platform**

[![GOAI release](https://img.shields.io/badge/GOAI%20release-1.3.0-1677ff.svg)](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0) [![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/license-MIT-2ea44f.svg)](./LICENSE)

[Live Demo](https://goai.xnetaiops.synapxnet.online) · [Backend: XnetAIops](https://github.com/synapxnet/XnetAIops/tree/v1.3.0) · [OpenXnet](https://openxnet.synapxnet.com) · [License](./LICENSE)

</div>

## GOAI finals release · v1.3.0

[Release & checksums](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0) · [Download source ZIP](https://github.com/synapxnet/XnetAIops-web/releases/download/v1.3.0/XnetAIops-web-v1.3.0-source.zip) · [v1.3.0 source](https://github.com/synapxnet/XnetAIops-web/tree/v1.3.0) · [Companion XnetAIops](https://github.com/synapxnet/XnetAIops/releases/tag/v1.3.0) · [OpenXnet desktop](https://github.com/synapxnet/OpenXnet/releases/tag/v1.3.0)

> This default `display` branch retains historical code. The badge points to the GOAI release; use the `v1.3.0` tag or release assets for that version.

The console includes a unified sign-in design, skins, resident Agent chat and configuration, operations assurance and controlled terminal interaction. Cross-platform collaboration and approval are coordinated through OpenXnet and AgentTeams; the UI alone does not grant execution permission.

See [program verification baseline, setup and delivery notes](https://github.com/synapxnet/XnetAIops-web/blob/a5e9c2c057ba29d94ee90d7e3acd645e89475f1c/docs/GOAI-FINALS-V1.3.0-SOURCE-DELIVERY.md) for deployment dependencies and known limits. This repository release does not indicate that a live service has been redeployed. The production build passed; the full type check still reports 135 issues.

> Historical screenshots below illustrate earlier layouts and are not evidence of the v1.3.0 UI.

![XnetAIops 3D cluster overview](./docs/images/xnetaiops-overview-2026.png)

## Product Tour

| Demo login | About |
| --- | --- |
| ![Demo login](./docs/images/xnetaiops-login.png) | ![About XnetAIops](./docs/images/xnetaiops-about.png) |
| Cluster management | Host onboarding |
| ![Cluster management](./docs/images/xnetaiops-clusters.png) | ![Host onboarding](./docs/images/xnetaiops-host-add.png) |
| Kubernetes | Service orchestration |
| ![Kubernetes](./docs/images/xnetaiops-kubernetes.png) | ![Service orchestration](./docs/images/xnetaiops-service.png) |
| Monitoring and alerts | Image registry |
| ![Monitoring](./docs/images/xnetaiops-monitor-2026.png) | ![Registry](./docs/images/xnetaiops-registry.png) |
| Multi-tenant users | Kubernetes nodes |
| ![Users](./docs/images/xnetaiops-users.png) | ![Kubernetes nodes](./docs/images/xnetaiops-k8s-nodes.png) |
| Kubernetes namespaces | Kubernetes workloads |
| ![Kubernetes namespaces](./docs/images/xnetaiops-k8s-namespaces.png) | ![Kubernetes workloads](./docs/images/xnetaiops-workloads-2026.png) |

## Overview

XnetAIops Web is the open-source operations console maintained by the **SynapXnet team**. It unifies hosts, infrastructure clusters, services, monitoring, Kubernetes, image registries, and access control.

Together with the [XnetAIops backend](https://github.com/synapxnet/XnetAIops/tree/v1.3.0), it forms an enterprise-grade, multi-tenant, frontend/backend-separated system. The console is built with Vue 3, TypeScript, Vite, Ant Design Vue, and the [Vue Vben Admin framework](https://github.com/vbenjs/vue-vben-admin).

## Highlights

- Enterprise multi-tenancy with role and resource boundaries.
- One workspace for infrastructure, services, Kubernetes, monitoring, and registries.
- Independent frontend delivery for gateway and deployment flexibility.
- Modular routes and API clients for secondary development.
- Continuous updates from the SynapXnet team.

## Modules

| Module      | Capability                                                |
| ----------- | --------------------------------------------------------- |
| 3D Overview | Cluster, rack, host, and topology visualization           |
| CLM         | Cluster lifecycle plus MySQL, Redis, Hadoop, and Jenkins  |
| HOM         | Host inventory, racks, SSH connectivity, and capacity     |
| SVM         | Service definitions, commands, roles, and lifecycle       |
| MON         | Metrics, alert rules, alert history, and status overview  |
| K8S         | Resources, Helm, monitoring, app catalog, and CI/CD       |
| REG         | Registries, projects, repositories, tags, and replication |
| USR         | Users, roles, and platform access control                 |

## Get and Build v1.3.0

Use **Node.js 20.10.0+** and **pnpm 9.15.7**. The application uses Vue 3, TypeScript 5, Vite, Ant Design Vue and the Vben workspace:

```bash
git clone --branch v1.3.0 --depth 1 https://github.com/synapxnet/XnetAIops-web.git
cd XnetAIops-web
corepack enable
corepack prepare pnpm@9.15.7 --activate
pnpm install --frozen-lockfile
pnpm exec turbo build --filter=@vben/web-antd --env-mode=loose
```

Output is `apps/web-antd/dist`; serve it through the companion Nginx or an HTTPS gateway. Starting the static frontend does not start backend or resident Agent services.

### Local development and APIs

Run `pnpm dev:antd` on default port `5777` after adapting `apps/web-antd/vite.config.mts`: existing LAN proxy targets must point to your backend for `/usr`, `/clm`, `/hom`, `/svm`, `/mon`, `/k8s` and `/reg`. K8s supports `AIOPS_K8S_DEV_URL`. Development proxies do not discover servers or fully configure the resident endpoint automatically.

Production `.env.production` uses same-origin `/api/usr`, `/api/clm`, `/api/hom`, `/api/svm`, `/api/mon`, `/api/k8s` and `/api/reg`. Configure `/api/resident/v1/` separately in the gateway for the independent Node service. Configure backend access, resident service, model credentials and login authorization separately; do not put model API keys in the browser.

The production build and 45 frontend regression tests passed. The complete type check still reports 135 known issues; see the delivery notes. Build success is not a type-check pass.

## Demo Access

- Current GOAI entry: <https://goai.xnetaiops.synapxnet.online/#/auth/login>.
- Demo phone: `17870171303`; demo verification code: `000000` (six digits, demo environment only).
- Sign in with a phone number and code, not the OpenXnet desktop password. This screen does not send SMS; the project supplies the demo code.
- Verified on 2026-09-18: login as `goai_operator` / `OPERATOR`; page title `XnetAIops`; resident status `platform=aiops`, `agentVersion=1.3.0`, `ONLINE`.
- This code is separate from an AgentTeams demo access code, Live execution authorization and model API keys. Those credentials are not interchangeable and are not published here.

The same-origin API gateway is `https://goai.xnetaiops.synapxnet.online`. Login: `POST /api/usr/login`; identity: `GET /api/usr/user/info`; resident status: `GET /api/resident/v1/status`. The last two require the platform Bearer token. Business prefixes are `/api/clm`, `/api/hom`, `/api/svm`, `/api/mon`, `/api/k8s` and `/api/reg`.

This check performed login and read-only identity/resident requests, without business changes or model calls. `modelConfigured=true` means configuration exists, not that inference was tested. Public demo authentication must not be used for production.

## License and Upstream

Released under the [MIT License](./LICENSE). The frontend uses [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin); its upstream MIT copyright and license notices are retained.

XnetAIops is part of [OpenXnet](https://openxnet.synapxnet.com). Copyright © 2026 SynapXnet.
