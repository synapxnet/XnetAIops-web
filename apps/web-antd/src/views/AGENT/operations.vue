<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
运行保障 — 组织范围内的原生证据工作台。 Operations assurance through scoped native evidence.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
-->
<script setup lang="ts">
import FeatureDriftEntry from '#/components/feature-drift/FeatureDriftEntry.vue';
import type {
  OperationsCatalog,
  OperationsEvidence,
  OperationsResource,
  ResourceKind,
} from '#/api/operations-workspace';
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
} from 'vue';
import {
  getOperationsCatalog,
  getOperationsEvidence,
} from '#/api/operations-workspace';
import {
  createRequestGuard,
  evidenceError,
  metricText,
  ORGANIZATION_SCOPE_EVENT,
  readScopeKey,
} from './operations-state';

const kinds: { key: ResourceKind; label: string; subtitle: string }[] = [
  { key: 'alert', label: '告警', subtitle: '监控与异常' },
  { key: 'service', label: '服务', subtitle: '实例与角色' },
  { key: 'workload', label: '工作负载', subtitle: '容器与资源' },
];
const catalogGuard = createRequestGuard();
const detailGuard = createRequestGuard();
const scope = ref('');
const filter = ref<ResourceKind>('alert');
const query = ref('');
const catalogs = ref<Partial<Record<ResourceKind, OperationsCatalog>>>({});
const errors = ref<Partial<Record<ResourceKind, string>>>({});
const loading = ref(false);
const selected = ref<null | OperationsResource>(null);
const evidence = ref<null | OperationsEvidence>(null);
const detailLoading = ref(false);
const detailError = ref('');
// 将标题与当前来源绑定，只渲染当前标题。 Binds the caption to the selected source and renders only its current label.
const currentKind = computed(() =>
  kinds.find((kind) => kind.key === filter.value),
);
// 仅过滤当前来源的已授权目录。 Filters only the authorized catalog of the selected source.
const resources = computed(() =>
  (catalogs.value[filter.value]?.resources ?? []).filter((resource) =>
    resource.label.toLowerCase().includes(query.value.toLowerCase()),
  ),
);
// 目录统计来自真实响应，缺失来源不计作零资源。 Counts resources only from successful native catalogs.
const catalogCount = computed(() =>
  Object.values(catalogs.value).reduce(
    (total, catalog) => total + catalog.resources.length,
    0,
  ),
);
// 提取已验证响应内的详情数据。 Reads detail fields only from the validated response.
const data = computed(() => evidence.value?.data ?? {});
// 根据资源种类显示最多四项真实状态。 Shows at most four native status measures for the resource kind.
const measures = computed(() => {
  if (selected.value?.kind === 'workload') {
    const metrics = object(data.value.metrics);
    return [
      {
        label: '就绪 / 期望副本',
        value: `${field(data.value.readyReplicas)} / ${field(data.value.desiredReplicas)}`,
      },
      { label: '可用副本', value: field(data.value.availableReplicas) },
      { label: 'CPU · 核', value: metricText(metrics.cpu, 'cores') },
      {
        label: '内存',
        value: metricText(
          typeof metrics.memory === 'number'
            ? metrics.memory / 1_048_576
            : null,
          'MiB',
        ),
      },
    ];
  }
  if (selected.value?.kind === 'service')
    return [
      { label: '健康结论', value: statusText(data.value.conclusion) },
      {
        label: '运行角色 / 全部角色',
        value: `${field(data.value.runningRoleCount)} / ${field(data.value.roleCount)}`,
      },
      { label: '失败角色', value: field(data.value.failedRoleCount) },
      {
        label: '需要重启',
        value:
          typeof data.value.needRestart === 'boolean'
            ? data.value.needRestart
              ? '是'
              : '否'
            : '未知',
      },
    ];
  return [
    { label: '告警状态', value: statusText(data.value.status) },
    { label: '严重程度', value: statusText(data.value.level) },
    { label: '触发时间', value: time(data.value.triggeredAt) },
    { label: '恢复时间', value: time(data.value.resolvedAt) },
  ];
});
// 只展示类型正确的限制与缺失原因。 Shows only typed limitations and missing-source reasons.
const warnings = computed(() => [
  ...strings(data.value.warnings),
  ...strings(data.value.reasonCodes),
  ...(evidence.value?.limitations ?? []),
]);
// 提取有界行记录，不执行来源文本。 Extracts bounded row records without executing source text.
const rows = computed(() =>
  records(
    selected.value?.kind === 'workload' ? data.value.pods : data.value.roles,
  ),
);
const events = computed(() => records(data.value.events)); // 展示实际事件。 Shows actual source events.

/** 仅接受普通对象用于安全字段读取。 Accepts plain objects for safe field access. */
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
/** 约束列表行并保留源顺序。 Bounds record rows and preserves their source order. */
function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.slice(0, 100).map(object) : [];
}
/** 仅接收字符串原因，保持缺失字段为空。 Accepts textual reasons only and preserves missing fields as empty. */
function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
/** 以纯文本展示标量，缺失不伪装正常。 Renders scalar text and never treats missing values as healthy. */
function field(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '未知';
}
/** 显示来源时间，未知时间不使用当前时刻替代。 Formats source timestamps without substituting the current time. */
function time(value: unknown): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleString('zh-CN', { hour12: false })
    : '未提供';
}

/** 将已知来源状态转成明确中文，未知枚举保持原值。 Translates known source states into clear Chinese and preserves unknown enum values. */
function statusText(value: unknown): string {
  const labels: Record<string, string> = {
    firing: '触发中',
    warning: '警告',
    critical: '严重',
    resolved: '已恢复',
    running: '运行中',
    pending: '等待中',
    stopped: '已停止',
    healthy: '健康',
    degraded: '已降级',
    unhealthy: '不健康',
    unknown: '状态未知',
    failed: '失败',
    error: '错误',
    info: '提示',
  };
  return typeof value === 'string'
    ? labels[value.toLowerCase()] || value
    : '状态未知';
}
/** 清除旧详情并令所有在途详情失效。 Clears old details and invalidates all pending detail requests. */
function clearDetail() {
  detailGuard.invalidate();
  selected.value = null;
  evidence.value = null;
  detailError.value = '';
  detailLoading.value = false;
}
/** 切换来源时清除上一个资源，保留该来源独立错误。 Clears the previous resource on source changes and preserves source-specific errors. */
function chooseKind(kind: ResourceKind) {
  filter.value = kind;
  query.value = '';
  clearDetail();
}

/** 并行读取三类目录；组织变化时忽略旧响应。 Reads three catalogs independently and ignores responses from previous organizations. */
async function refresh() {
  scope.value = readScopeKey();
  const ticket = catalogGuard.begin(scope.value);
  clearDetail();
  catalogs.value = {};
  errors.value = {};
  if (!scope.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  // 各来源独立失败，另一来源仍可读取。 Allows individual source failures without discarding other catalogs.
  await Promise.allSettled(
    kinds.map(async ({ key }) => {
      try {
        const response = await getOperationsCatalog(key);
        if (!catalogGuard.accepts(ticket, readScopeKey())) return;
        if (
          response.schemaVersion !== '1.0.0' ||
          response.sourcePlatform !== 'aiops' ||
          response.executionMode !== 'live' ||
          !Array.isArray(response.resources) ||
          response.resources.some(
            (resource) =>
              resource.kind !== key || resource.executionMode !== 'live',
          )
        ) {
          errors.value[key] = '来源契约不匹配，当前结果未展示。';
          return;
        }
        const workspaceIds = Object.values(catalogs.value).map(
          (catalog) => catalog.workspaceId,
        );
        if (
          workspaceIds.some(
            (workspaceId) => workspaceId !== response.workspaceId,
          )
        ) {
          errors.value[key] = '来源工作区配置不一致，请检查组织映射。';
          return;
        }
        catalogs.value[key] = response;
      } catch (error) {
        if (catalogGuard.accepts(ticket, readScopeKey()))
          errors.value[key] = evidenceError(error);
      }
    }),
  );
  if (catalogGuard.accepts(ticket, readScopeKey())) loading.value = false;
}

/** 每次选择清空旧证据；返回资源必须与本次选择一致。 Clears old evidence on every selection and requires a matching response resource. */
async function selectResource(resource: OperationsResource) {
  clearDetail();
  selected.value = resource;
  detailLoading.value = true;
  const ticket = detailGuard.begin(scope.value);
  try {
    const result = await getOperationsEvidence(resource);
    if (!detailGuard.accepts(ticket, readScopeKey())) return;
    if (
      result.resourceId !== resource.id ||
      result.schemaVersion !== '1.0.0' ||
      result.sourcePlatform !== 'aiops' ||
      result.executionMode !== resource.executionMode ||
      result.sourceOrigin !== 'native' ||
      result.availability !== 'available'
    ) {
      detailError.value = '返回证据与所选资源不匹配，当前结果未展示。';
      return;
    }
    evidence.value = result;
  } catch (error) {
    if (detailGuard.accepts(ticket, readScopeKey()))
      detailError.value = evidenceError(error);
  } finally {
    if (detailGuard.accepts(ticket, readScopeKey()))
      detailLoading.value = false;
  }
}

/** 同步同页组织切换并即时清理旧内容。 Synchronizes same-tab organization changes and clears old content immediately. */
function onScopeChange() {
  void refresh();
}
/** 页面暂停时停止接受旧结果。 Stops accepting old results when the page becomes inactive. */
function deactivate() {
  catalogGuard.invalidate();
  clearDetail();
  catalogs.value = {};
  scope.value = '';
  loading.value = false;
}
// 首次挂载注册组织变更监听并读取。 Registers organization changes and loads data on first mount.
onMounted(() => {
  window.addEventListener(ORGANIZATION_SCOPE_EVENT, onScopeChange);
  void refresh();
});
// 缓存页面恢复时重新验证范围。 Revalidates scope when a cached page becomes active.
onActivated(() => {
  if (scope.value !== readScopeKey()) void refresh();
});
onDeactivated(deactivate);
// 卸载移除监听并失效请求。 Removes listeners and invalidates requests on unmount.
onBeforeUnmount(() => {
  window.removeEventListener(ORGANIZATION_SCOPE_EVENT, onScopeChange);
  deactivate();
});
</script>

<template>
  <BusinessPage
    :show-heading="false"
    title="运行保障"
    description="把异常、服务和工作负载证据连接起来，形成下一步判断依据。"
    family="证据工作台"
    route-key="/AGENT/operations"
  >
    <main class="operations-workspace">
      <FeatureDriftEntry label="跨域恢复 · 独立运行采样" />
      <header class="workspace-header">
        <div class="workspace-intro">
          <p class="eyebrow">XNET AIOPS <span>运行保障</span></p>
          <h1>让每一次判断，都有运行证据</h1>
          <p class="muted">
            从告警到服务和工作负载，在当前组织范围内查看真实状态与来源。
          </p>
        </div>
        <button class="refresh-button" :disabled="loading" @click="refresh">
          {{ loading ? '正在读取…' : '刷新证据' }}
        </button>
      </header>
      <div class="scope-strip">
        <span class="scope-dot"></span><span>当前范围</span
        ><strong>{{ scope ? '已选择组织' : '尚未选择组织' }}</strong
        ><span class="scope-summary"
          >{{ Object.keys(catalogs).length }} / 3 目录已取得 ·
          {{
            Object.keys(catalogs).length
              ? `${catalogCount} 项授权目标`
              : '目标数量待取得'
          }}</span
        >
      </div>
      <section class="workspace-body">
        <aside class="resource-panel" aria-label="运行资源">
          <div class="panel-heading">
            <h2>授权目标</h2>
            <span class="muted">只读</span>
          </div>
          <div class="source-tabs" role="tablist" aria-label="证据来源">
            <button
              v-for="kind in kinds"
              :id="`source-${kind.key}`"
              :key="kind.key"
              role="tab"
              :aria-selected="filter === kind.key"
              :class="{ active: filter === kind.key }"
              @click="chooseKind(kind.key)"
            >
              {{ kind.label }}
            </button>
          </div>
          <label class="search-label"
            ><span class="sr-only">搜索已授权资源</span
            ><input v-model="query" placeholder="搜索资源名称" type="search"
          /></label>
          <div class="source-caption">
            {{ currentKind?.subtitle
            }}<span>{{
              errors[filter]
                ? '来源不可用'
                : catalogs[filter]
                  ? `${catalogs[filter]?.resources.length} 项授权目标`
                  : loading
                    ? '读取中'
                    : '等待接入'
            }}</span>
          </div>
          <div
            class="resource-list"
            role="tabpanel"
            :aria-labelledby="`source-${filter}`"
            :aria-busy="loading"
          >
            <p v-if="!scope" class="inline-state">
              请在顶部选择已授权的租户、部门和团队。
            </p>
            <p
              v-else-if="errors[filter]"
              class="inline-state error-state"
              role="alert"
            >
              {{ errors[filter] }}
            </p>
            <p
              v-else-if="loading && !catalogs[filter]"
              class="inline-state"
              role="status"
            >
              正在读取该来源的授权目标目录…
            </p>
            <p v-else-if="resources.length === 0" class="inline-state">
              {{
                query
                  ? '没有匹配的已授权资源。'
                  : '此来源暂未分配可读资源。配置资源授权后，将在这里显示。'
              }}
            </p>
            <button
              v-for="resource in resources"
              :key="resource.id"
              class="resource-item"
              :class="{
                selected:
                  selected?.id === resource.id &&
                  selected?.kind === resource.kind,
              }"
              :aria-pressed="
                selected?.id === resource.id && selected?.kind === resource.kind
              "
              @click="selectResource(resource)"
            >
              <span class="resource-glyph">{{
                resource.kind === 'alert'
                  ? '!'
                  : resource.kind === 'service'
                    ? 'S'
                    : 'K'
              }}</span
              ><span
                ><strong>{{ resource.label }}</strong
                ><small>{{
                  resource.namespace || resource.resourceUid || resource.id
                }}</small></span
              ><span class="item-arrow">›</span>
            </button>
          </div>
          <p class="resource-footnote">
            目录来自授权配置。选择目标后，才核实其存在性与运行状态。
          </p>
        </aside>
        <section
          class="evidence-panel"
          :aria-busy="detailLoading"
          aria-label="运行证据详情"
        >
          <div v-if="!selected" class="welcome-state">
            <div class="evidence-symbol" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <p class="eyebrow">从一项资源开始</p>
            <h2>把状态、变化与来源放在一起</h2>
            <p>选择左侧告警、服务或工作负载，查看资源状态、版本和观测记录。</p>
            <div class="evidence-path">
              <span>发现异常</span><i>→</i><span>核对资源</span><i>→</i
              ><span>保留证据</span>
            </div>
          </div>
          <template v-else>
            <header class="detail-heading">
              <div>
                <p class="eyebrow">
                  {{
                    kinds.find((kind) => kind.key === selected?.kind)?.subtitle
                  }}
                </p>
                <h2>{{ selected.label }}</h2>
                <p class="muted">
                  {{
                    selected.namespace || selected.resourceUid || selected.id
                  }}
                </p>
              </div>
              <span class="source-badge">原生来源 · 只读</span>
            </header>
            <div v-if="detailLoading" class="inline-state" role="status">
              正在读取此资源的运行证据…
            </div>
            <div
              v-else-if="detailError"
              class="inline-state error-state"
              role="alert"
            >
              <p>{{ detailError }}</p>
              <button class="text-button" @click="selectResource(selected)">
                重新读取此资源
              </button>
            </div>
            <template v-else-if="evidence">
              <div class="measures">
                <div v-for="measure in measures" :key="measure.label">
                  <span>{{ measure.label }}</span
                  ><strong>{{ measure.value }}</strong>
                </div>
              </div>
              <div class="observation-note">
                采集于 {{ time(evidence.capturedAt) }} · 原始观测
                {{ time(evidence.observedAt) }} · 新鲜度未验证<span
                  v-if="selected.kind === 'workload'"
                >
                  · 请求窗口
                  {{ field(object(data.metrics).windowMinutes) }} 分钟</span
                >
              </div>
              <section v-if="selected.kind === 'alert'" class="detail-section">
                <h3>异常描述</h3>
                <p class="source-text">{{ field(data.description) }}</p>
                <h3>来源建议</h3>
                <p class="source-text">{{ field(data.advice) }}</p>
              </section>
              <section v-else class="detail-section">
                <div class="section-title">
                  <h3>
                    {{
                      selected.kind === 'workload' ? '容器组状态' : '角色实例'
                    }}
                  </h3>
                  <span class="muted">{{ rows.length }} 条已返回记录</span>
                </div>
                <div class="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>名称</th>
                        <th>状态</th>
                        <th>
                          {{
                            selected.kind === 'workload' ? '重启次数' : '主机'
                          }}
                        </th>
                        <th>来源时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, index) in rows" :key="index">
                        <td>{{ field(row.name || row.roleName) }}</td>
                        <td>
                          {{ field(row.phase || row.status)
                          }}<small v-if="selected.kind === 'workload'">
                            · {{ row.ready ? '已就绪' : '未就绪' }}</small
                          >
                        </td>
                        <td>
                          {{
                            field(
                              selected.kind === 'workload'
                                ? row.restartCount
                                : row.hostname,
                            )
                          }}
                        </td>
                        <td>{{ time(row.startedAt || row.observedAt) }}</td>
                      </tr>
                      <tr v-if="rows.length === 0">
                        <td colspan="4" class="muted">
                          此来源未返回实例记录，请结合下方证据边界判断。
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
              <section
                v-if="selected.kind === 'workload'"
                class="detail-section"
              >
                <div class="section-title">
                  <h3>最近事件</h3>
                  <span class="muted">{{ events.length }} 条</span>
                </div>
                <div
                  v-for="(event, index) in events"
                  :key="index"
                  class="event-row"
                >
                  <span class="event-mark"></span>
                  <div>
                    <strong>{{ field(event.reason) }}</strong>
                    <p>{{ field(event.message) }}</p>
                    <small
                      >{{ time(event.lastAt) }} ·
                      {{ field(event.count) }} 次</small
                    >
                  </div>
                </div>
                <p v-if="!events.length" class="muted">
                  未返回事件；这不代表已验证无异常。
                </p>
              </section>
              <details class="provenance">
                <summary>
                  来源与证据边界 <span>{{ warnings.length }} 项说明</span>
                </summary>
                <dl>
                  <dt>平台 / 模式</dt>
                  <dd>
                    {{ evidence.sourcePlatform }} /
                    {{ evidence.executionMode }} /
                    {{ evidence.sourceOrigin }}
                  </dd>
                  <dt>资源版本</dt>
                  <dd>
                    {{ evidence.resourceVersion || '来源未提供不可变版本' }}
                  </dd>
                  <dt>请求标识</dt>
                  <dd>{{ evidence.requestId }}</dd>
                  <dt>来源状态原值</dt>
                  <dd>
                    {{ field(data.status) }} /
                    {{ field(data.conclusion || data.level) }}
                  </dd>
                  <dt>资源标识</dt>
                  <dd>{{ evidence.resourceId }}</dd>
                </dl>
                <ul>
                  <li v-for="warning in warnings" :key="warning">
                    {{ warning }}
                  </li>
                </ul>
              </details>
            </template>
          </template>
        </section>
      </section>
    </main>
  </BusinessPage>
</template>

<style scoped>
.operations-workspace {
  --ops-surface: hsl(var(--card));
  --ops-muted: hsl(var(--muted-foreground));
  --ops-line: hsl(var(--border));
  --ops-accent: hsl(var(--primary));
  color: hsl(var(--foreground));
  padding: 28px;
  min-height: calc(100vh - 96px);
  background: radial-gradient(
    ellipse at 100% 0%,
    color-mix(in srgb, var(--ops-accent) 7%, transparent),
    transparent 45%
  );
}
.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 25px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--ops-accent);
  margin-bottom: 10px;
}
.eyebrow span {
  letter-spacing: 0.03em;
  margin-left: 12px;
  color: var(--ops-muted);
}
h1 {
  font-size: 26px;
  line-height: 1.4;
  font-weight: 650;
  margin-bottom: 8px;
}
h2 {
  font-size: 18px;
  font-weight: 650;
}
h3 {
  font-size: 14px;
  font-weight: 600;
}
.muted {
  color: var(--ops-muted);
  font-size: 12px;
  line-height: 1.7;
}
.refresh-button {
  border: 1px solid var(--ops-accent);
  background: var(--ops-accent);
  color: hsl(var(--primary-foreground));
  padding: 10px 18px;
  border-radius: var(--radius);
  white-space: nowrap;
  font-weight: 600;
}
.refresh-button:disabled {
  opacity: 0.6;
}
.scope-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--ops-muted);
  padding: 14px 0;
  border-top: 1px solid var(--ops-line);
  flex-wrap: wrap;
}
.scope-strip strong {
  font-weight: 500;
  overflow-wrap: anywhere;
  color: inherit;
}
.scope-dot {
  height: 7px;
  width: 7px;
  border-radius: 50%;
  background: var(--ops-accent);
}
.scope-summary {
  margin-left: auto;
}
.workspace-body {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-height: 620px;
  border: 1px solid var(--ops-line);
  border-radius: calc(var(--radius) + 4px);
  background: var(--ops-surface);
  overflow: hidden;
}
.resource-panel {
  border-right: 1px solid var(--ops-line);
  display: flex;
  flex-direction: column;
  padding: 22px 16px 16px;
  background: color-mix(in srgb, var(--ops-accent) 2%, var(--ops-surface));
}
.panel-heading,
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.panel-heading {
  padding: 0 5px 19px;
}
.panel-heading h2 {
  font-size: 15px;
}
.source-tabs {
  display: flex;
  border-bottom: 1px solid var(--ops-line);
  gap: 8px;
  margin-bottom: 16px;
}
.source-tabs button {
  flex: 1;
  padding: 9px 2px;
  color: var(--ops-muted);
  border-bottom: 2px solid transparent;
  font-size: 13px;
}
.source-tabs button.active {
  color: var(--ops-accent);
  border-color: var(--ops-accent);
  font-weight: 650;
}
.search-label input {
  width: 100%;
  background: var(--ops-surface);
  border: 1px solid var(--ops-line);
  border-radius: var(--radius);
  padding: 9px 11px;
  font-size: 12px;
}
.source-caption {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--ops-muted);
  padding: 20px 5px 10px;
}
.resource-list {
  flex: 1;
}
.resource-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  text-align: left;
  padding: 13px 10px;
  border-radius: var(--radius);
  margin-bottom: 5px;
  border: 1px solid transparent;
}
.resource-item:hover {
  background: color-mix(in srgb, var(--ops-accent) 5%, transparent);
}
.resource-item.selected {
  border-color: color-mix(in srgb, var(--ops-accent) 22%, var(--ops-line));
  background: color-mix(in srgb, var(--ops-accent) 8%, var(--ops-surface));
}
.resource-glyph {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius);
  color: var(--ops-accent);
  background: color-mix(in srgb, var(--ops-accent) 10%, transparent);
  font-weight: 700;
}
.resource-item strong {
  font-size: 13px;
  font-weight: 600;
  display: block;
  overflow-wrap: anywhere;
}
.resource-item small {
  font-size: 11px;
  color: var(--ops-muted);
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
}
.item-arrow {
  margin-left: auto;
  color: var(--ops-muted);
}
.resource-footnote {
  color: var(--ops-muted);
  font-size: 11px;
  line-height: 1.8;
  padding: 16px 5px 0;
  border-top: 1px solid var(--ops-line);
  margin-top: 18px;
}
.evidence-panel {
  padding: 28px;
  min-width: 0;
}
.welcome-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 530px;
  text-align: center;
  gap: 14px;
}
.welcome-state > p:not(.eyebrow) {
  color: var(--ops-muted);
  max-width: 350px;
  line-height: 1.8;
  font-size: 13px;
}
.welcome-state .eyebrow {
  margin: 10px 0 0;
}
.evidence-symbol {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 90px;
  transform: rotate(-12deg);
}
.evidence-symbol span {
  width: 38px;
  height: 48px;
  border: 1px solid color-mix(in srgb, var(--ops-accent) 30%, transparent);
  border-radius: 9px;
  background: linear-gradient(
    150deg,
    color-mix(in srgb, var(--ops-accent) 13%, transparent),
    transparent
  );
}
.evidence-symbol span:nth-child(2) {
  height: 72px;
  background: linear-gradient(
    150deg,
    color-mix(in srgb, var(--ops-accent) 24%, transparent),
    transparent
  );
}
.evidence-path {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-top: 16px;
  color: var(--ops-muted);
  font-size: 11px;
}
.evidence-path i {
  font-style: normal;
  color: var(--ops-accent);
}
.detail-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
  border-bottom: 1px solid var(--ops-line);
  padding-bottom: 23px;
}
.detail-heading h2 {
  margin-bottom: 7px;
  overflow-wrap: anywhere;
}
.source-badge {
  color: var(--ops-accent);
  background: color-mix(in srgb, var(--ops-accent) 8%, transparent);
  padding: 6px 10px;
  border-radius: var(--radius);
  font-size: 11px;
  white-space: nowrap;
}
.measures {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
  padding: 25px 0;
}
.measures span {
  display: block;
  color: var(--ops-muted);
  font-size: 11px;
  margin-bottom: 10px;
}
.measures strong {
  font-size: 19px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.observation-note {
  font-size: 11px;
  color: var(--ops-muted);
  line-height: 1.8;
  padding: 10px 13px;
  background: color-mix(in srgb, var(--ops-accent) 4%, transparent);
  border-radius: var(--radius);
}
.detail-section {
  padding: 25px 0;
  border-bottom: 1px solid var(--ops-line);
}
.section-title {
  margin-bottom: 15px;
}
.table-scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  text-align: left;
  font-size: 12px;
  border-collapse: collapse;
}
th {
  font-size: 11px;
  font-weight: 500;
  color: var(--ops-muted);
  padding: 10px 12px;
  background: color-mix(in srgb, var(--ops-accent) 3%, transparent);
  white-space: nowrap;
}
td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--ops-line);
  overflow-wrap: anywhere;
}
td small {
  color: var(--ops-muted);
}
tbody tr:last-child td {
  border-bottom: 0;
}
.source-text {
  font-size: 13px;
  line-height: 1.85;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 12px 0 20px;
  color: var(--ops-muted);
}
.event-row {
  display: flex;
  gap: 12px;
  margin: 15px 0;
  font-size: 12px;
}
.event-row p {
  color: var(--ops-muted);
  margin: 6px 0;
  overflow-wrap: anywhere;
}
.event-row small {
  color: var(--ops-muted);
  font-size: 11px;
}
.event-mark {
  width: 7px;
  height: 7px;
  margin-top: 5px;
  border: 2px solid var(--ops-accent);
  border-radius: 50%;
  flex-shrink: 0;
}
.provenance {
  margin-top: 20px;
  font-size: 12px;
}
.provenance summary {
  cursor: pointer;
  font-weight: 600;
  line-height: 2;
}
.provenance summary span {
  font-weight: 400;
  font-size: 11px;
  color: var(--ops-muted);
  margin-left: 12px;
}
.provenance dl {
  display: grid;
  grid-template-columns: 95px 1fr;
  gap: 10px;
  margin: 17px 0;
  color: var(--ops-muted);
}
.provenance dd {
  overflow-wrap: anywhere;
}
.provenance ul {
  padding-left: 17px;
  color: var(--ops-muted);
  line-height: 1.9;
  list-style: disc;
  overflow-wrap: anywhere;
}
.inline-state {
  font-size: 12px;
  line-height: 1.85;
  color: var(--ops-muted);
  padding: 28px 10px;
}
.error-state {
  color: hsl(var(--destructive));
  overflow-wrap: anywhere;
}
.text-button {
  color: var(--ops-accent);
  margin-top: 12px;
  text-decoration: underline;
}
button,
input {
  transition:
    background-color 0.15s,
    border-color 0.15s;
}
button:focus-visible,
input:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--ops-accent);
  outline-offset: 3px;
}
@media (max-width: 1150px) {
  .operations-workspace {
    padding: 20px;
  }
  .workspace-body {
    grid-template-columns: 260px minmax(0, 1fr);
  }
  .evidence-panel {
    padding: 22px;
  }
  .measures {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .workspace-header h1 {
    font-size: 23px;
  }
}
@media (max-width: 780px) {
  .operations-workspace {
    padding: 14px;
  }
  .workspace-header {
    align-items: flex-start;
    gap: 14px;
  }
  .workspace-header h1 {
    font-size: 20px;
  }
  .workspace-body {
    grid-template-columns: 1fr;
  }
  .resource-panel {
    border-right: 0;
    border-bottom: 1px solid var(--ops-line);
  }
  .resource-list {
    max-height: 240px;
    overflow: auto;
  }
  .scope-summary {
    margin-left: 0;
    width: 100%;
  }
  .evidence-panel {
    padding: 20px;
  }
  .welcome-state {
    min-height: 320px;
  }
  .source-badge {
    white-space: normal;
  }
  .refresh-button {
    padding: 9px 11px;
  }
  .evidence-path {
    gap: 10px;
  }
  .detail-heading {
    flex-wrap: wrap;
  }
}
@media (prefers-reduced-motion: reduce) {
  button,
  input {
    transition: none;
  }
}
</style>
