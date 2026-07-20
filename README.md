<div align="center">

# XnetAIops Web

**XnetAIops 智能运维平台的 Web 控制台**

[![Version](https://img.shields.io/badge/version-1.0.0-1677ff.svg)](https://www.xnetaiops.synapxnet.cn)
[![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-2ea44f.svg)](./LICENSE)

[在线体验](https://www.xnetaiops.synapxnet.cn) · [OpenXnet 开源社区](https://openxnet.synapxnet.com) · [查看许可](./LICENSE)

</div>

![XnetAIops 集群 3D 概览](./docs/images/xnetaiops-overview.jpg)

## 项目简介

XnetAIops Web 是由 **SynapXnet 团队**开源的智能运维控制台，也是 XnetAIops 微服务体系的统一交互入口。控制台将主机、集群、服务、监控、Kubernetes 与镜像仓库集中到同一套界面中，便于运维人员在一个工作区完成日常巡检与变更操作。

项目基于 Vue 3、TypeScript、Vite、Ant Design Vue 与 Vben Admin 构建，采用模块化路由、集中状态管理和可复用组件体系，适合继续扩展企业级运维场景。

## 功能模块

| 模块 | 主要功能 |
| --- | --- |
| 3D 总览 | 以三维场景展示集群与节点拓扑，提供运维态势入口 |
| CLM 集群管理 | 集群纳管、基础组件部署、部署任务与生命周期操作 |
| HOM 主机管理 | 主机、机架、SSH 连接与资源信息维护 |
| SVM 服务管理 | 服务概览、命令执行、框架配置及服务生命周期管理 |
| MON 监控告警 | 监控指标、告警历史、告警规则与异常追踪 |
| K8S 管理 | 集群资源、工作负载、网络、存储、RBAC、Helm 与交付流水线 |
| REG 仓库管理 | 镜像仓库、项目、标签、同步和部署日志 |
| USR 系统管理 | 用户、角色、权限码与平台访问控制 |

## 前端架构

```mermaid
flowchart LR
    Browser["浏览器"] --> Router["Vue Router"]
    Router --> Views["AIOps 业务视图"]
    Views --> Store["Pinia 状态管理"]
    Views --> Client["统一 API Client"]
    Client --> Services["XnetAIops 微服务"]
    Design["Ant Design Vue / Vben"] --> Views
```

## 技术栈

- Vue 3 + TypeScript
- Vite + Turbo
- Ant Design Vue + Vben Admin
- Pinia + Vue Router
- pnpm 9.15.7

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9.15.7

### 本地开发

```bash
corepack enable
pnpm install
pnpm dev:antd
```

### 生产构建

```bash
pnpm build:antd
```

部署前请根据目标环境检查 `apps/web-antd` 下的环境变量和 API 地址配置。不要将真实密钥、生产令牌或服务器凭据提交到仓库。

## 在线体验

- 访问地址：<https://www.xnetaiops.synapxnet.cn>
- 演示手机号：`12345678900`
- 演示验证码：`000000`

固定验证码仅用于公开演示。生产部署应接入安全的身份认证与验证码服务。

## SynapXnet 开源生态

本项目属于 SynapXnet 开源项目矩阵。访问 [OpenXnet](https://openxnet.synapxnet.com) 获取更多团队项目与社区信息。

## 参与贡献

欢迎提交 Issue 与 Pull Request。新增页面时请复用现有布局、权限、路由与请求层约定，并确保桌面端常见分辨率下的交互完整性。

## 开源许可

本项目基于 [MIT License](./LICENSE) 开源。前端基础工程沿用 Vben 的 MIT 授权，相关版权声明已保留在许可文件中。
