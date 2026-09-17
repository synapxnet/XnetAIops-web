# XnetAIops Web 中文说明

[![GOAI release](https://img.shields.io/badge/GOAI%20release-1.3.0-1677ff.svg)](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0)

## GOAI 决赛版 · v1.3.0

[发布页与校验文件](https://github.com/synapxnet/XnetAIops-web/releases/tag/v1.3.0) · [下载源码 ZIP](https://github.com/synapxnet/XnetAIops-web/releases/download/v1.3.0/XnetAIops-web-v1.3.0-a5e9c2c0-source.zip) · [查看 v1.3.0 源码](https://github.com/synapxnet/XnetAIops-web/tree/v1.3.0) · [配套后端 XnetAIops](https://github.com/synapxnet/XnetAIops/releases/tag/v1.3.0) · [OpenXnet 桌面安装包](https://github.com/synapxnet/OpenXnet/releases/tag/v1.3.0)

> 当前默认 `display` 分支保留历史代码。徽章表示已公开的 GOAI 版本；复现 v1.3.0 请使用上方固定标签或发布附件，不以此分支代码代替。

包含统一登录与皮肤、驻场 Agent 聊天和配置入口、运行保障工作台及受控终端交互。跨平台协作和审批通过 OpenXnet 与 AgentTeams 组织，页面状态本身不代表已经取得执行授权。

部署依赖、实测结果和能力边界见[本仓源码交付与构建说明](https://github.com/synapxnet/XnetAIops-web/blob/a5e9c2c057ba29d94ee90d7e3acd645e89475f1c/docs/GOAI-FINALS-V1.3.0-SOURCE-DELIVERY.md)。发布源码不代表线上服务已重新部署。本轮生产构建通过，全量类型检查仍有 135 处问题。

> 主 README 中的图片为历史界面截图，仅用于了解原有功能与布局，不作为 v1.3.0 新界面的验收证据。

完整功能、构建命令和部署条件见[本仓 README](./README.md)。

## 在线体验与登录

- 当前 GOAI 演示入口：<https://goai.xnetaiops.synapxnet.online/#/auth/login>。
- 演示手机号：`17870171303`；演示验证码：`000000`（6 位，仅用于本演示环境）。
- 登录方式为“手机号 + 验证码”，不使用 OpenXnet 桌面端的密码登录。当前页面不发送短信，演示验证码由项目方约定。
- 2026-09-18 已核验：登录成功，身份为 `goai_operator` / `OPERATOR`；页面标题为 `XnetAIops`，驻场状态返回 `platform=aiops`、`agentVersion=1.3.0`、`ONLINE`。
- 此验证码只用于平台登录。AgentTeams 演示访问码、Live 执行授权和模型 API Key 是独立凭据，不可互换；后者不在公开 README 提供。

API 网关与网页同源，基址为 `https://goai.xnetaiops.synapxnet.online`。登录为 `POST /api/usr/login`；身份读取为 `GET /api/usr/user/info`；驻场状态为 `GET /api/resident/v1/status`，后两项使用平台登录返回的 Bearer 令牌。业务模块前缀为 `/api/clm`、`/api/hom`、`/api/svm`、`/api/mon`、`/api/k8s`、`/api/reg`。

本轮仅执行登录及身份/驻场状态读取，未执行业务变更或模型调用。`modelConfigured=true` 表示存在服务端配置，不等于本轮已验证模型推理。公共演示账号不应用作生产认证方案。

## 上游来源与许可

本平台前端使用 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin)，原维护者 [Vben](https://github.com/anncwb)。保留 [MIT © Vben-2020](./LICENSE) 及 SynapXnet 许可说明；上游框架文档不等同于 XnetAIops 产品版本或部署流程。
