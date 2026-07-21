<div align="center">

[简体中文](./README.md) | **English** | [日本語](./README.ja-JP.md)

# XnetAIops Web

**Web console for the XnetAIops intelligent operations platform**

[![Version](https://img.shields.io/badge/version-1.0.0-1677ff.svg)](https://www.xnetaiops.synapxnet.cn) [![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/license-MIT-2ea44f.svg)](./LICENSE)

[Live Demo](https://www.xnetaiops.synapxnet.cn) · [Backend: XnetAIops](https://github.com/synapxnet/XnetAIops) · [OpenXnet](https://openxnet.synapxnet.com) · [License](./LICENSE)

</div>

![XnetAIops 3D cluster overview](./docs/images/xnetaiops-overview.jpg)

## Product Tour

| Demo login | About |
| --- | --- |
| ![Demo login](./docs/images/xnetaiops-login.png) | ![About XnetAIops](./docs/images/xnetaiops-about.png) |
| Cluster management | Host onboarding |
| ![Cluster management](./docs/images/xnetaiops-clusters.png) | ![Host onboarding](./docs/images/xnetaiops-host-add.png) |
| Kubernetes | Service orchestration |
| ![Kubernetes](./docs/images/xnetaiops-kubernetes.png) | ![Service orchestration](./docs/images/xnetaiops-service.png) |
| Monitoring and alerts | Image registry |
| ![Monitoring](./docs/images/xnetaiops-monitor.png) | ![Registry](./docs/images/xnetaiops-registry.png) |
| Multi-tenant users | 3D overview |
| ![Users](./docs/images/xnetaiops-users.png) | ![3D overview](./docs/images/xnetaiops-overview.jpg) |

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

| Module | Capability |
| --- | --- |
| 3D Overview | Cluster, rack, host, and topology visualization |
| CLM | Cluster lifecycle plus MySQL, Redis, Hadoop, and Jenkins |
| HOM | Host inventory, racks, SSH connectivity, and capacity |
| SVM | Service definitions, commands, roles, and lifecycle |
| MON | Metrics, alert rules, alert history, and status overview |
| K8S | Resources, Helm, monitoring, app catalog, and CI/CD |
| REG | Registries, projects, repositories, tags, and replication |
| USR | Users, roles, and platform access control |

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
