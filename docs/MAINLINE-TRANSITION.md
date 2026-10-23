<!-- Copyright (C) 2026 Synapxnet. All rights reserved.
Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0 | Security Level: INTERNAL
Maintainer: maoyo | Email: synapxnet@gmail.com -->
# AIOps Web 主线迁移与验收

保留完整 1.3.0 产品能力，并补齐 9 月 19 日驻场能力工作台。移除固定比赛外链和演示登录依赖，登录恢复真实发送验证码及服务器校验；跨平台地址由部署环境配置，缺失时不生成跳转。全部原生运维菜单、皮肤、三维总览、驻场聊天/任务/模型设置、知识/Skill/工具能力、运行保障与跨域恢复证据继续保留。

主产品明确使用前端静态菜单。原有 91 个页面全部保留，新增 2 个能力入口，现为 93 个组件页面；每页路径、操作、字段和 API 文件见 [页面矩阵](MAINLINE-PAGE-MATRIX.md)。隐藏详情与创建页同样纳入检查。

## 本轮修复

- 解决整个 workspace 的 135 项既有 Vue/TypeScript 诊断，包含空值、组件事件类型、表格行类型、布局可选树数据和实际部署按钮条件；未删除产品操作规避检查。
- Jenkins 节点/密钥调用路径与真实后端一致。流水线日志读取原生 `{log}` 字段，重放调用对应后端端点。
- 旧浮动助手组件不再导入不存在的 XAA API 或猜测未鉴权接口。其宿主适配器负责身份、范围、鉴权、存储和流式请求；未接入时明确断开，不发送请求。创建会话失败保留输入、不开始流式调用，卸载时清理连接/拖动监听。现用驻场 Agent 面板继续保留。
- 表单失败保留草稿，取消删除保持记录，确认成功才移除；生产/演练证据及缺失指标不混淆。
- CI 为手动触发的只读构建、类型和测试流程，没有推送触发发布或自动部署。

## 验证记录（2026-10-23）

| 检查 | 结果 | 覆盖边界 |
| --- | --- | --- |
| `pnpm build:antd` | 11 个构建任务通过 | 实际生产 bundle |
| `pnpm exec turbo run typecheck --concurrency=2` | 4 个 workspace 应用全部通过 | 包括 web-antd、web-ele、web-naive、playground |
| Vitest + Node 原生证据测试 | 317 + 7 = 324 项通过 | UI、权限状态、工具边界、证据来源和隔离等 |
| `tests/full-ui/smoke.mjs` | 登录通过，93 页 × 有样本/空数据/接口失败 = 279 次检查，0 页面异常 | 实际生产页面与本机明确合成夹具；不代表真实集群执行 |
| `tests/full-ui/interactions.mjs` | 6 项通过 | 空提交拒绝、失败保留草稿并重试、创建后列表、取消删除、确认删除、驻场面板打开 |
| `tests/full-ui/api-contracts.mjs` | 417 项调用，416 项有后端映射，0 意外缺失 | 方法/路径静态对照；1 项未使用的 Vben 后端菜单模板单独记录 |
| 配套后端真实 HTTP | 40 项通过，见后端 `tests/mainline-http-results.json` | 数据库迁移、实际短信协议接收、MySQL/Redis、登录/权限/组织树、CLM CRUD、各服务列表 |

对应数据位于 `tests/full-ui/current-routes.json`、`smoke-results.json`、`interaction-results.json` 和 `api-contract-results.json`。浏览器检查只允许访问本机测试站点，外部请求被阻止；未定义的设施请求明确返回失败，写操作仅对少量测试实体开放，没有自动替换为成功。

可选 `/api/usr/menu/all` 模板未进入产品的前端菜单模式，因此未另造一套后端菜单服务。静态接口匹配不证明外部 Kubernetes、Jenkins、SSH、Harbor、Helm 或模型服务已实际操作成功；这些能力需要真实依赖环境进一步验收。驻场服务独立部署，浏览器夹具仅验证面板和错误呈现，不冒充真实 Agent 对话结果。

本轮没有更新线上服务、旧发布包或比赛交付分支。数据库初始化/升级、首个管理员和真实短信配置见配套后端主线迁移说明。
