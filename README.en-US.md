<div align="center">

[简体中文](./README.md) | **English** | [日本語](./README.ja-JP.md)

# XnetAIops Web

**Web console for the XnetAIops intelligent operations platform**

[![GOAI release](https://img.shields.io/badge/GOAI%20release-1.3.0-1677ff.svg)](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0) [![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/license-MIT-2ea44f.svg)](./LICENSE)

[Live Demo](https://www.xnetaiops.synapxnet.cn) · [Backend: XnetAIops](https://github.com/synapxnet/XnetAIops) · [OpenXnet](https://openxnet.synapxnet.com) · [License](./LICENSE)

</div>

## GOAI finals release · v1.3.0

[Release & checksums](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0) · [Download source ZIP](https://github.com/synapxnet/XnetAIops-web/releases/download/v1.3.0/XnetAIops-web-v1.3.0-a5e9c2c0-source.zip) · [v1.3.0 source](https://github.com/synapxnet/XnetAIops-web/tree/v1.3.0) · [Companion XnetAIops](https://github.com/synapxnet/XnetAIops/releases/tag/v1.3.0) · [OpenXnet desktop](https://github.com/synapxnet/OpenXnet/releases/tag/v1.3.0)

> This default `display` branch retains historical code. The badge points to the GOAI release; use the `v1.3.0` tag or release assets for that version.

The console includes a unified sign-in design, skins, resident Agent chat and configuration, operations assurance and controlled terminal interaction. Cross-platform collaboration and approval are coordinated through OpenXnet and AgentTeams; the UI alone does not grant execution permission.

See [source delivery, setup and actual test results](https://github.com/synapxnet/XnetAIops-web/blob/a5e9c2c057ba29d94ee90d7e3acd645e89475f1c/docs/GOAI-FINALS-V1.3.0-SOURCE-DELIVERY.md) for deployment dependencies and known limits. This repository release does not indicate that a live service has been redeployed. The production build passed; the full type check still reports 135 issues.

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

Together with the [XnetAIops backend](https://github.com/synapxnet/XnetAIops), it forms an enterprise-grade, multi-tenant, frontend/backend-separated system. The console is built with Vue 3, TypeScript, Vite, Ant Design Vue, and the [Vue Vben Admin framework](https://github.com/vbenjs/vue-vben-admin).

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

## Development

```bash
corepack enable
pnpm install
pnpm dev:antd
pnpm build:antd
```

Use Node.js 20+ and pnpm 9.15.7. Never commit production credentials or access tokens.

## Demo

- URL: <https://www.xnetaiops.synapxnet.cn>
- Phone: `12345678900`
- Verification code: `000000`

The fixed code is only for the public showcase. Production must use secure authentication.

## License and Upstream

Released under the [MIT License](./LICENSE). The frontend uses [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin); its upstream MIT copyright and license notices are retained.

XnetAIops is part of [OpenXnet](https://openxnet.synapxnet.com). Copyright © 2026 SynapXnet.
