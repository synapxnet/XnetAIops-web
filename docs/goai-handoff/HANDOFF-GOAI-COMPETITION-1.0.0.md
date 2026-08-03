# GOAI Competition 1.0.0 前端交接

- 仓库：`synapxnet/XnetAIops-web`
- 任务：`AIOPS-FE-01`
- Worktree：`D:\synapxnet\.codex-build\goai-competition-1.0.0\XnetAIops-web`
- 分支：`GOAI-Competition`
- 基线提交：`64bd4dc3cabda236d717696f54ffadea5541c462`
- 结束提交：见 `GOAI-Competition` 分支候选 HEAD
- 产品/契约版本：`1.0.0`

## 页面与数据边界

深链：

```text
/agent/incidents/inc_model_contract_001?workspaceId=ws_goai_demo&traceId=trace_model_contract_001&alertUid=alert_risk_error_rate&serviceUid=service_risk_inference&clusterId=1&namespace=risk-prod&workload=risk-inference
```

页面并行调用 `aiops.alert.get`、`aiops.k8s.workload.get` 和 `aiops.service.health`，允许部分证据失败。Evidence ID、来源和观测时间来自 `ToolResponse.meta`，不会显示或缓存委托令牌。

文件所有权：

- `apps/web-antd/src/views/AGENT/`
- `apps/web-antd/src/router/routes/modules/AGENT.ts`
- `apps/web-antd/src/api/request.ts` 中的 Agent Service Client

## 配置与联调

沿用仓库现有 Vite API 基址配置；Agent Client 分别指向 MON、K8s 和 SVM Service。配置值由部署环境注入，仓库不保存 Token。后端比赛分支：[`synapxnet/XnetAIops`](https://github.com/synapxnet/XnetAIops/tree/GOAI-Competition)。

## 验证记录

本次新增路由、TypeScript、Vue SFC 采用严格独立配置执行：

```powershell
node node_modules\vue-tsc\bin\vue-tsc.js --noEmit --skipLibCheck -p <isolated-aiops-tsconfig>
```

结果：本次新增文件 0 类型错误；`pnpm build:antd` 生产构建通过，Turbo 11/11 任务成功。全仓 `pnpm -F @vben/web-antd run typecheck` 已执行，但仍被比赛改造前既有的 XAA/CLM 页面、preferences 命名和表格行类型问题阻塞；这些存量错误不来自 AGENT 页面，需作为仓库级技术债单独关闭。发布 CI 仍需复跑全仓 typecheck、单测、lint 和生产构建。

## 已知限制与回退

- 真实 403/404/503 和 K8s 指标缺失仍需连接受控联调环境验收。
- 回退仅删除新增 AGENT 路由/页面和 Agent Client；不修改公共 Vben 页面。
- 页面使用现有主题 CSS 变量，桌面和窄屏布局均有稳定网格约束。
