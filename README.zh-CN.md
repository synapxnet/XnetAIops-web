# XnetAIops Web 中文说明

[![GOAI release](https://img.shields.io/badge/GOAI%20release-1.3.0-1677ff.svg)](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0)

## GOAI 决赛版 · v1.3.0

[发布页与校验文件](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0) · [下载源码 ZIP](https://github.com/synapxnet/XnetAIops-web/releases/download/v1.3.0/XnetAIops-web-v1.3.0-a5e9c2c0-source.zip) · [查看 v1.3.0 源码](https://github.com/synapxnet/XnetAIops-web/tree/v1.3.0) · [配套后端 XnetAIops](https://github.com/synapxnet/XnetAIops/releases/tag/v1.3.0) · [OpenXnet 桌面安装包](https://github.com/synapxnet/OpenXnet/releases/tag/v1.3.0)

> 当前默认 `display` 分支保留历史代码。徽章表示已公开的 GOAI 版本；复现 v1.3.0 请使用上方固定标签或发布附件，不以此分支代码代替。

包含统一登录与皮肤、驻场 Agent 聊天和配置入口、运行保障工作台及受控终端交互。跨平台协作和审批通过 OpenXnet 与 AgentTeams 组织，页面状态本身不代表已经取得执行授权。

部署依赖、实测结果和能力边界见[本仓源码交付与构建说明](https://github.com/synapxnet/XnetAIops-web/blob/a5e9c2c057ba29d94ee90d7e3acd645e89475f1c/docs/GOAI-FINALS-V1.3.0-SOURCE-DELIVERY.md)。发布源码不代表线上服务已重新部署。本轮生产构建通过，全量类型检查仍有 135 处问题。

> 主 README 中的图片为历史界面截图，仅用于了解原有功能与布局，不作为 v1.3.0 新界面的验收证据。

XnetAIops Web 是由 **SynapXnet 团队**开源的企业级、多租户智能运维控制台，与后端仓库共同组成前后端分离系统。项目覆盖主机、集群、服务、监控、Kubernetes、镜像仓库与平台权限管理。

完整的项目介绍、模块说明、在线体验、页面截图、部署方式与开源许可统一维护在 [README.md](./README.md)。

- 在线体验：<https://www.xnetaiops.synapxnet.cn>
- 后端仓库：[synapxnet/XnetAIops](https://github.com/synapxnet/XnetAIops)
- OpenXnet 开源社区：<https://openxnet.synapxnet.com>

前端基于 Vue 3、TypeScript、Ant Design Vue，并采用 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) 框架构建。项目遵循 MIT License，并依法保留上游框架的版权与许可声明。
