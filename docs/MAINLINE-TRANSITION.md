<!-- Copyright (C) 2026 Synapxnet. All rights reserved.
Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.0.0 | Security Level: INTERNAL -->
# AIOps Web 主线迁移

以 `9a7502c` 为基线，保留比赛期间形成的完整产品能力，并补齐 9 月 19 日部署源码中的驻场能力工作台。相关代码来自 `E:/SynapXnet/.sandbox-preview/goai-finals-aiops/frontend`。

移除固定 GOAI 外链和演示登录依赖，验证码登录恢复真实发送按钮与服务器校验。跨平台链接由部署环境明确配置，无配置时不展示跳转；全部原生菜单、驻场聊天、模型配置、知识/Skill/工具能力、运行保障与跨域恢复证据继续保留。

后端契约和测试范围见配套后端 `docs/MAINLINE-TRANSITION.md`。本轮只修改源码，不更新旧发布包或线上部署。

## 验证记录（2026-10-23）

- Vite 生产构建成功；驻场能力工作台、真实验证码入口及最新证据来源校验已包含在 `apps/web-antd/dist`。
- 前端现有皮肤与业务页面测试 8 项通过，执行证据测试 7 项通过，覆盖生产/演练来源组合、跨事件隔离与缺失指标。
- 全量 Vue 类型检查仍有基线中的 135 项诊断；本轮修改的认证、驻场、执行证据、3D 总览及认证布局未出现诊断。构建成功不代表全仓库类型检查已通过。
- 未连接真实短信网关或线上服务；没有把本地构建与模拟网关测试表述为线上登录或业务验收。
