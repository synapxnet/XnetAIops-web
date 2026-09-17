<!-- Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly forbidden to copy,
distribute, or use without explicit authorization.
用途：记录决赛前端源码与构建边界。 Purpose: Record finals frontend source and build boundaries.
Author: maoyo | Department: 研发部 | Date: 2026-09-17 | Version: 1.3.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com -->

# XnetAIOps Web GOAI V1.3.0

本提交延续 GitHub `GOAI-Competition` 分支，纳入已优化的 `goai-finals-aiops/frontend` 源码。根包及实际应用 `apps/web-antd` 版本为 `1.3.0`；上游 Vben 框架工作区包保留自身版本，不以产品版本覆盖第三方组件版本。

主要交付：统一登录视觉、品牌配色与自定义皮肤、驻场 Agent 聊天与配置入口、业务页面层级、运行保障工作台、清晰的错误状态、真实 Pod 详情及受控终端交互。保持原有业务模块入口。

## 构建与接入

使用 Node 20+ 和锁定的 pnpm 9.15.7：

```sh
pnpm install --frozen-lockfile
pnpm --filter @vben/web-antd typecheck
pnpm exec vitest run --dom
pnpm build:antd
```

生产配置通过同源 `/api/usr`、`/api/clm`、`/api/hom`、`/api/svm`、`/api/mon`、`/api/k8s`、`/api/reg` 和 `/api/resident/v1/` 接入；平台 IP 由网关配置管理，无须把模型密钥放入浏览器。后端配套源码见 [XnetAIops GOAI 分支](https://github.com/synapxnet/XnetAIops/tree/GOAI-Competition)。

驻场服务固定源码见 [OpenXnet c841ef84](https://github.com/synapxnet/OpenXnet/tree/c841ef841da8477fc312e27cd390aecac8ed2d7e/services/platform-resident-agent)。登录状态、平台身份、组织授权与模型配置互相独立，不能以页面显示在线推断执行已授权。

## 验证与限制

2026-09-17 本轮 `vitest run --dom apps/web-antd/src`：8 个测试文件、45 项全部通过，覆盖登录状态、皮肤、业务页、运行保障、Pod 路由与异步读取、终端交互。完整 Turbo 生产构建链（`turbo build --filter=@vben/web-antd --env-mode=loose`）11 项任务全部成功、0 缓存命中；实际生成 `apps/web-antd/dist/index.html` 与构建压缩包。存在既有大分块提示。

**本轮全量 `vue-tsc --noEmit --skipLibCheck` 未通过，报告 135 处类型问题。** 主要为旧助手引用缺少的 XAA 类型、列表槽位 Record 类型、事件签名与未使用声明。历史优化分支日志为 139 处，只作为参考，不替代本轮结果。未通过检查不可描述为“类型验收通过”；本次源码提交保留这项已知限制，没有借此扩展为全框架类型重构。

使用锁定 pnpm 9.15.7 完成离线 frozen 安装；依赖安装脚本未自动执行，工作区构建准备与正式 Turbo 链单独运行。本次发布源码，不切换线上前端，也不把此前网页验收记录冒充本轮浏览器验收。

构建输出、依赖目录、缓存、浏览器用户数据和部署凭据不提交。原有许可证、框架来源说明及 GitHub 分支历史保留。
