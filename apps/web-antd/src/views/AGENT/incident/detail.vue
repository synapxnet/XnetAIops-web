<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  SyncOutlined,
} from '@ant-design/icons-vue';
import { Alert, Button, Empty, message, Table, Tag, Tooltip } from 'ant-design-vue';

import {
  getAlertEvidence,
  getServiceHealthEvidence,
  getWorkloadEvidence,
} from '../api/aiopsTool';
import type { AlertEvidence, ServiceHealthEvidence, WorkloadEvidence } from '../api/aiopsTool';
import type { ToolMeta, TraceStep } from '../api/types';
import IncidentContextBar from '../components/IncidentContextBar.vue';
import { useIncidentContext } from '../composables/useIncidentContext';

const route = useRoute();
const { context, isComplete } = useIncidentContext();
const loading = ref(false);
const errorMessage = ref('');
const selectedStep = ref('alert');
const alert = ref<AlertEvidence>();
const workload = ref<WorkloadEvidence>();
const service = ref<ServiceHealthEvidence>();
const meta = ref<Record<string, ToolMeta>>({});
const selectedMeta = computed(() => meta.value[selectedStep.value]);

const steps = computed<TraceStep[]>(() => [
  step('alert', '告警发现', 'aiops.alert.get', alert.value, '错误率从 0.8% 升至 18%'),
  step('workload', '工作负载定位', 'aiops.k8s.workload.get', workload.value, '核对镜像、修订、Pod 与事件'),
  step('service', '服务健康', 'aiops.service.health', service.value, '独立确认角色实例和健康结论'),
]);

const podColumns = [
  { dataIndex: 'name', key: 'name', title: 'Pod' },
  { dataIndex: 'phase', key: 'phase', title: '阶段', width: 110 },
  { dataIndex: 'ready', key: 'ready', title: '就绪', width: 90 },
  { dataIndex: 'restartCount', key: 'restartCount', title: '重启', width: 80 },
];

/** 根据证据加载状态生成 Trace 步骤。 */
function step(
  id: string,
  title: string,
  toolName: string,
  evidence: unknown,
  description: string,
): TraceStep {
  return {
    description,
    evidenceId: meta.value[id]?.evidenceId,
    id,
    status: evidence ? 'completed' : loading.value ? 'running' : errorMessage.value ? 'failed' : 'pending',
    title,
    toolName,
  };
}

/** 并行加载三个独立 AIOps 证据，允许部分结果正常展示。 */
async function loadEvidence() {
  if (!isComplete.value) return;
  loading.value = true;
  errorMessage.value = '';
  const alertUid = String(route.query.alertUid ?? 'alert_risk_error_rate');
  const serviceUid = String(route.query.serviceUid ?? 'service_risk_inference');
  const results = await Promise.allSettled([
    getAlertEvidence(alertUid, context.value),
    getWorkloadEvidence({
      clusterId: String(route.query.clusterId ?? '1'),
      kind: 'Deployment',
      name: String(route.query.workload ?? 'risk-inference'),
      namespace: String(route.query.namespace ?? 'risk-prod'),
      windowMinutes: 15,
    }, context.value),
    getServiceHealthEvidence(serviceUid, context.value),
  ]);
  applyResult('alert', results[0], alert);
  applyResult('workload', results[1], workload);
  applyResult('service', results[2], service);
  const failed = results.filter((result) => result.status === 'rejected').length;
  if (failed) errorMessage.value = `${failed} 项证据暂不可用，可刷新重试。`;
  loading.value = false;
}

/** 将单项 ToolResponse 写入对应证据和元数据状态。 */
function applyResult<T>(
  key: string,
  result: PromiseSettledResult<{ data: null | T; meta: ToolMeta; success: boolean }>,
  target: { value?: T },
) {
  if (result.status === 'fulfilled' && result.value.success && result.value.data) {
    target.value = result.value.data;
    meta.value[key] = result.value.meta;
  }
}

/** 复制 Evidence ID，不复制请求 Header 或令牌。 */
async function copyEvidenceId(id?: string) {
  if (!id) return;
  await navigator.clipboard.writeText(id);
  message.success('Evidence ID 已复制');
}

/** 将 0 到 1 的比率格式化为百分数。 */
function percent(value?: number) {
  return value === undefined || value === null ? '不可用' : `${(value * 100).toFixed(2)}%`;
}

onMounted(loadEvidence);
</script>

<template>
  <div class="agent-page">
    <IncidentContextBar
      :context="context"
      :loading="loading"
      severity="P1"
      status="调查中"
      @refresh="loadEvidence"
    />
    <Alert
      v-if="!isComplete"
      banner
      message="深链缺少 workspaceId 或 traceId，无法恢复事件上下文。"
      type="warning"
    />
    <Alert v-else-if="errorMessage" banner :message="errorMessage" show-icon type="warning" />

    <main class="evidence-layout">
      <nav class="trace-list" aria-label="Trace 步骤">
        <button
          v-for="item in steps"
          :key="item.id"
          :class="['trace-step', { active: selectedStep === item.id }]"
          type="button"
          @click="selectedStep = item.id"
        >
          <CheckCircleOutlined v-if="item.status === 'completed'" class="status success" />
          <CloseCircleOutlined v-else-if="item.status === 'failed'" class="status danger" />
          <SyncOutlined v-else-if="item.status === 'running'" class="status running" spin />
          <ClockCircleOutlined v-else class="status" />
          <span><strong>{{ item.title }}</strong><small>{{ item.description }}</small></span>
        </button>
      </nav>

      <section class="evidence-detail">
        <template v-if="selectedStep === 'alert' && alert">
          <div class="section-heading"><div><span>MON</span><h2>{{ alert.alertName }}</h2></div><Tag color="error">{{ alert.level }}</Tag></div>
          <dl class="fact-grid">
            <div><dt>当前状态</dt><dd>{{ alert.status }}</dd></div>
            <div><dt>主机</dt><dd>{{ alert.hostname || '未关联' }}</dd></div>
            <div><dt>触发时间</dt><dd>{{ alert.triggeredAt }}</dd></div>
            <div><dt>集群</dt><dd>{{ alert.clusterId || '未建立资源关联' }}</dd></div>
          </dl>
          <div class="narrative"><strong>告警事实</strong><p>{{ alert.description || '无描述' }}</p><strong>处理建议</strong><p>{{ alert.advice || '暂无建议' }}</p></div>
        </template>

        <template v-else-if="selectedStep === 'workload' && workload">
          <div class="section-heading"><div><span>Kubernetes</span><h2>{{ workload.namespace }}/{{ workload.name }}</h2></div><Tag>{{ workload.kind }}</Tag></div>
          <dl class="fact-grid">
            <div><dt>修订</dt><dd>{{ workload.currentRevision || '-' }}</dd></div>
            <div><dt>resourceVersion</dt><dd>{{ workload.resourceVersion || '-' }}</dd></div>
            <div><dt>副本</dt><dd>{{ workload.readyReplicas }}/{{ workload.desiredReplicas }}</dd></div>
            <div><dt>错误率 / P95</dt><dd>{{ percent(workload.metrics.errorRate) }} / {{ workload.metrics.p95Ms ?? '不可用' }}</dd></div>
          </dl>
          <div class="image-list"><span v-for="image in workload.imageRefs" :key="image">{{ image }}</span></div>
          <Table :columns="podColumns" :data-source="workload.pods" :pagination="false" row-key="name" size="small">
            <template #bodyCell="{ column, record }">
              <Tag v-if="column.key === 'ready'" :color="record.ready ? 'success' : 'error'">{{ record.ready ? '就绪' : '未就绪' }}</Tag>
            </template>
          </Table>
          <Alert v-for="warning in workload.warnings" :key="warning" :message="warning" show-icon type="warning" />
        </template>

        <template v-else-if="selectedStep === 'service' && service">
          <div class="section-heading"><div><span>SVM</span><h2>{{ service.serviceName }}</h2></div><Tag :color="service.conclusion === 'HEALTHY' ? 'success' : 'warning'">{{ service.conclusion }}</Tag></div>
          <dl class="fact-grid">
            <div><dt>服务状态</dt><dd>{{ service.status }}</dd></div>
            <div><dt>配置版本</dt><dd>{{ service.configVersion ?? '-' }}</dd></div>
            <div><dt>角色实例</dt><dd>{{ service.roleCount }}</dd></div>
            <div><dt>失败实例</dt><dd>{{ service.failedRoleCount }}</dd></div>
          </dl>
          <div class="reason-list"><Tag v-for="reason in service.reasonCodes" :key="reason">{{ reason }}</Tag></div>
        </template>

        <Empty v-else description="当前证据尚未加载" />

        <footer v-if="selectedMeta" class="technical-meta">
          <span>{{ selectedMeta.source }} · {{ selectedMeta.observedAt }}</span>
          <Tooltip title="复制 Evidence ID">
            <Button size="small" type="text" @click="copyEvidenceId(selectedMeta.evidenceId)">
              <template #icon><CopyOutlined /></template>{{ selectedMeta.evidenceId }}
            </Button>
          </Tooltip>
        </footer>
      </section>
    </main>
  </div>
</template>

<style scoped>
.agent-page { background: hsl(var(--background)); color: hsl(var(--foreground)); min-height: 100%; }
.evidence-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); min-height: 620px; }
.trace-list { border-right: 1px solid hsl(var(--border)); padding: 16px 10px; }
.trace-step { align-items: flex-start; background: transparent; border: 0; border-radius: 6px; color: inherit; cursor: pointer; display: flex; gap: 10px; padding: 12px; text-align: left; width: 100%; }
.trace-step:hover, .trace-step.active { background: hsl(var(--accent)); }
.trace-step span { display: grid; gap: 4px; min-width: 0; }
.trace-step small { color: hsl(var(--muted-foreground)); line-height: 1.4; }
.status { color: hsl(var(--muted-foreground)); margin-top: 2px; }
.status.success { color: #16a34a; }.status.danger { color: #dc2626; }.status.running { color: #2563eb; }
.evidence-detail { min-width: 0; padding: 22px 26px; }
.section-heading { align-items: center; border-bottom: 1px solid hsl(var(--border)); display: flex; justify-content: space-between; padding-bottom: 14px; }
.section-heading span { color: hsl(var(--muted-foreground)); font-size: 11px; }.section-heading h2 { font-size: 18px; margin: 4px 0 0; }
.fact-grid { display: grid; gap: 1px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 18px 0; }
.fact-grid div { background: hsl(var(--muted)); min-width: 0; padding: 12px; }.fact-grid dt { color: hsl(var(--muted-foreground)); font-size: 11px; }.fact-grid dd { font-size: 13px; margin: 6px 0 0; overflow-wrap: anywhere; }
.narrative { border-left: 3px solid hsl(var(--primary)); padding: 4px 14px; }.narrative p { color: hsl(var(--muted-foreground)); }
.image-list, .reason-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }.image-list span { background: hsl(var(--muted)); border-radius: 4px; font-family: ui-monospace, monospace; padding: 5px 8px; }
.technical-meta { align-items: center; border-top: 1px solid hsl(var(--border)); color: hsl(var(--muted-foreground)); display: flex; font-size: 11px; justify-content: space-between; margin-top: 20px; padding-top: 12px; }
:deep(.ant-alert) { margin-top: 10px; }
@media (max-width: 900px) { .evidence-layout { grid-template-columns: 1fr; }.trace-list { border-bottom: 1px solid hsl(var(--border)); border-right: 0; display: flex; overflow-x: auto; }.trace-step { min-width: 220px; }.fact-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .evidence-detail { padding: 16px; }.fact-grid { grid-template-columns: 1fr; }.technical-meta { align-items: flex-start; flex-direction: column; gap: 8px; } }
</style>
