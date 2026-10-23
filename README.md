<!-- Copyright (C) 2026 Synapxnet. All rights reserved.
Synapxnet Proprietary and Confidential. No copying, distribution or use without authorization.
Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0 | Security Level: INTERNAL -->
# XnetAIOps Web

[English](README.en-US.md) · [日本語](README.ja-JP.md)

XnetAIOps 的企业运维工作台，使用 Vue 3、TypeScript、Vite 和 Ant Design Vue。支持 3D 总览、集群/主机/服务管理、监控告警、Kubernetes、制品仓库、组织权限，以及驻场 Agent 聊天、任务、模型配置、知识与 Skill 工作台、运行保障和跨平台执行证据。

主线开发分支为 `main`；历史发布版本继续保留独立分支和标签。

## 本地开发

使用 Node.js 22 与仓库锁定的 pnpm 9.15.7。

```bash
pnpm install --frozen-lockfile
pnpm dev:antd
pnpm test:unit
pnpm --filter @vben/web-antd typecheck
pnpm build:antd
```

应用位于 `apps/web-antd`，构建产物位于 `apps/web-antd/dist`。开发 API 代理使用 `vite.config.mts` 中的 `AIOPS_*_DEV_URL`；未配置时连接对应的本机服务端口。

## 服务与登录

生产 API 默认同源，由网关转发到 [XnetAIOps 后端](https://github.com/synapxnet/XnetAIops)。驻场 Agent 由 `/api/resident/v1/` 接入，需要部署时单独配置网关及权限。

登录使用管理员开通的账号和短信一次性验证码，不预填比赛账号或通用验证码。短信服务、身份与权限由后端负责；没有真实资源时页面保留空态，不制造成功记录或监控指标。

按需配置 `VITE_XNET_AIOPS_URL`、`VITE_XNET_DATAOPS_URL`、`VITE_XNET_MLOPS_URL` 为完整 HTTP(S) 地址，未配置的平台不显示登录页外链。`VITE_XNET_REHEARSAL_ENABLED` 默认关闭；只有隔离演练环境才应显式开启。

## 功能与证据

驻场 Agent、组织权限、可复用 Skill、知识管理、皮肤与 3D 能力继续保留。跨平台工作台分别展示生产与演练证据；缺失数据保持未采集，不以工具执行成功代替业务恢复结论。

CI 仅支持手动触发检查和构建，使用只读仓库权限，不部署、不发布，也不上传制品。

[主线说明](docs/MAINLINE-TRANSITION.md) · [OpenXnet](https://openxnet.synapxnet.com)

## 许可

参见 [LICENSE](LICENSE) 和各文件中的版权与授权声明。
