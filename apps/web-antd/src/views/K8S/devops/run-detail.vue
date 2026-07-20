<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Button,
  Tag,
  Space,
  Descriptions,
  DescriptionsItem,
  Spin,
  message,
  Input,
  Divider,
} from 'ant-design-vue';
import {
  getPipelineRun,
  getPipelineRunStages,
  getPipelineRunLog,
  getStageLog,
  stopPipelineRun,
  replayPipelineRun,
} from '../api/devops';
import StagePipeline from '../components/StagePipeline.vue';
import type { StageItem } from '../components/StagePipeline.vue';

const route = useRoute();
const router = useRouter();

const projectId = Number(route.params.projectId);
const pipelineId = Number(route.params.pipelineId);
const runId = Number(route.params.runId);

// ==================== State ====================
const loading = ref(true);
const runDetail = ref<any>(null);
const stages = ref<any[]>([]);
const selectedStageId = ref<string | null>(null);
const logContent = ref('');
const logLoading = ref(false);
const logSearchText = ref('');
const followLog = ref(true);
const activeLogTab = ref<'full' | string>('full');

let pollTimer: ReturnType<typeof setInterval> | null = null;
const logViewerRef = ref<HTMLDivElement | null>(null);

// ==================== Computed ====================
const runNumber = computed(
  () => runDetail.value?.number || runDetail.value?.id || runId,
);

const isRunning = computed(() => {
  const s = (
    runDetail.value?.result ||
    runDetail.value?.state ||
    ''
  ).toUpperCase();
  return ['RUNNING', 'QUEUED', 'PENDING', 'PAUSED_PENDING_INPUT'].includes(s);
});

const runStatus = computed(() => {
  const result =
    runDetail.value?.result || runDetail.value?.state || 'UNKNOWN';
  return result.toUpperCase();
});

const statusConfig: Record<string, { color: string; label: string }> = {
  SUCCESS: { color: 'success', label: '成功' },
  FAILURE: { color: 'error', label: '失败' },
  RUNNING: { color: 'processing', label: '运行中' },
  QUEUED: { color: 'processing', label: '排队中' },
  PENDING: { color: 'processing', label: '等待中' },
  ABORTED: { color: 'warning', label: '已中止' },
  NOT_BUILT: { color: 'default', label: '未构建' },
  PAUSED_PENDING_INPUT: { color: 'warning', label: '等待输入' },
  UNKNOWN: { color: 'default', label: '未知' },
};

const filteredLogLines = computed(() => {
  if (!logContent.value) return [];
  const lines = logContent.value.split('\n');
  if (!logSearchText.value.trim()) return lines;
  const keyword = logSearchText.value.trim().toLowerCase();
  return lines.filter((line) => line.toLowerCase().includes(keyword));
});

// ==================== Helper Functions ====================
// Use StagePipeline component's exposed helpers for stage status
const stagePipelineRef = ref<InstanceType<typeof StagePipeline> | null>(null);

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}分${secs}秒`;
  return `${secs}秒`;
}

function formatDateTime(ts: string | number | null): string {
  if (!ts) return '-';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getStageStatus(stage: any): string {
  const result = stage.result || stage.state || 'unknown';
  const map: Record<string, string> = {
    SUCCESS: 'success', FAILURE: 'failed', RUNNING: 'running',
    NOT_BUILT: 'not_built', ABORTED: 'aborted', QUEUED: 'queued',
    PAUSED_PENDING_INPUT: 'paused', IN_PROGRESS: 'running',
  };
  return map[result.toUpperCase()] || result.toLowerCase();
}

function getStageStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    success: '#52c41a', failed: '#f5222d', running: '#1890ff',
    not_built: '#d9d9d9', aborted: '#fa8c16', queued: '#1890ff', paused: '#fa8c16',
  };
  return colors[status] || '#d9d9d9';
}

function getTriggerLabel(type: string | null): string {
  if (!type) return '-';
  const map: Record<string, string> = {
    MANUAL: '手动触发',
    SCM: 'SCM变更',
    TIMER: '定时触发',
    WEBHOOK: 'Webhook',
    UPSTREAM: '上游触发',
    REPLAY: '重放',
  };
  return map[type.toUpperCase()] || type;
}

function isErrorLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes('[error]') ||
    lower.includes('error:') ||
    lower.includes('fatal')
  );
}

function isWarnLine(line: string): boolean {
  const lower = line.toLowerCase();
  return lower.includes('[warn') || lower.includes('warning:');
}

function highlightSearch(line: string): string {
  // HTML-escape first
  let escaped = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Highlight search matches
  if (logSearchText.value.trim()) {
    const keyword = logSearchText.value
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${keyword})`, 'gi');
    escaped = escaped.replace(
      regex,
      '<span style="background:#a68a0d;color:#fff;padding:0 2px;border-radius:2px">$1</span>',
    );
  }
  return escaped;
}

// ==================== API Calls ====================
async function fetchRunDetail() {
  try {
    const res = await getPipelineRun(projectId, pipelineId, runId);
    runDetail.value = res;
  } catch (e: any) {
    message.error('获取运行详情失败: ' + (e.message || e));
  }
}

async function fetchStages() {
  try {
    const res = await getPipelineRunStages(projectId, pipelineId, runId);
    stages.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    console.error('获取阶段信息失败', e);
  }
}

async function fetchLog() {
  logLoading.value = true;
  try {
    if (activeLogTab.value === 'full' || !selectedStageId.value) {
      const res = await getPipelineRunLog(projectId, pipelineId, runId);
      logContent.value =
        typeof res === 'string' ? res : (res as any)?.data || '';
    } else {
      const res = await getStageLog(
        projectId,
        pipelineId,
        runId,
        selectedStageId.value,
      );
      logContent.value =
        typeof res === 'string' ? res : (res as any)?.data || '';
    }
    if (followLog.value) {
      await nextTick();
      scrollLogToBottom();
    }
  } catch (e: any) {
    console.error('获取日志失败', e);
  } finally {
    logLoading.value = false;
  }
}

async function fetchAll() {
  await Promise.all([fetchRunDetail(), fetchStages()]);
  await fetchLog();
  loading.value = false;
}

// ==================== Actions ====================
function selectStage(stage: StageItem) {
  const stageId = String(stage.id);
  if (selectedStageId.value === stageId) {
    // Deselect: go back to full log
    selectedStageId.value = null;
    activeLogTab.value = 'full';
  } else {
    selectedStageId.value = stageId;
    activeLogTab.value = stageId;
  }
  fetchLog();
}

function switchLogTab(tab: 'full' | string) {
  activeLogTab.value = tab;
  if (tab === 'full') {
    selectedStageId.value = null;
  } else {
    selectedStageId.value = tab;
  }
  fetchLog();
}

async function handleStop() {
  try {
    await stopPipelineRun(projectId, pipelineId, runId);
    message.success('已发送停止请求');
    fetchAll();
  } catch (e: any) {
    message.error('停止失败: ' + (e.message || e));
  }
}

async function handleReplay() {
  try {
    const res = await replayPipelineRun(projectId, pipelineId, runId);
    message.success('重放已触发');
    if (res?.id) {
      router.push({
        name: route.name as string,
        params: { projectId, pipelineId, runId: res.id },
      });
    } else {
      router.back();
    }
  } catch (e: any) {
    message.error('重放失败: ' + (e.message || e));
  }
}

function scrollLogToBottom() {
  if (logViewerRef.value) {
    logViewerRef.value.scrollTop = logViewerRef.value.scrollHeight;
  }
}

function downloadLog() {
  const blob = new Blob([logContent.value || ''], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pipeline-run-${runNumber.value}-log.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==================== Polling ====================
function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (isRunning.value) {
      fetchRunDetail();
      fetchStages();
      fetchLog();
    } else {
      stopPolling();
    }
  }, 3000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// ==================== Watchers ====================
watch(isRunning, (val) => {
  if (val) {
    startPolling();
  } else {
    stopPolling();
  }
});

// ==================== Lifecycle ====================
onMounted(async () => {
  await fetchAll();
  if (isRunning.value) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <!-- ==================== Page Header ==================== -->
      <Card class="mb-4">
        <div class="run-header">
          <div class="run-header-left">
            <Button
              type="text"
              @click="router.back()"
              style="margin-right: 8px; padding: 4px 8px"
            >
              <span style="font-size: 18px">&larr;</span>
            </Button>
            <h2 class="run-title">运行 #{{ runNumber }}</h2>
            <Tag
              v-if="runDetail"
              :color="statusConfig[runStatus]?.color || 'default'"
              style="margin-left: 12px; font-size: 13px; padding: 2px 10px"
            >
              {{ statusConfig[runStatus]?.label || runStatus }}
            </Tag>
          </div>
          <Space>
            <Button v-if="isRunning" danger @click="handleStop">
              停止
            </Button>
            <Button type="primary" @click="handleReplay"> 重放 </Button>
            <Button @click="fetchAll">刷新</Button>
          </Space>
        </div>
      </Card>

      <!-- ==================== Section 1: Run Info ==================== -->
      <Card size="small" title="运行信息" class="mb-4">
        <Descriptions bordered :column="3" size="small">
          <DescriptionsItem label="状态">
            <Tag :color="statusConfig[runStatus]?.color || 'default'">
              {{ statusConfig[runStatus]?.label || runStatus }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="触发方式">
            {{ getTriggerLabel(runDetail?.trigger || runDetail?.triggerType) }}
          </DescriptionsItem>
          <DescriptionsItem label="触发人">
            {{
              runDetail?.triggerUser ||
              runDetail?.causes?.[0]?.userName ||
              '-'
            }}
          </DescriptionsItem>
          <DescriptionsItem label="开始时间">
            {{
              formatDateTime(
                runDetail?.startTime || runDetail?.startTimeMillis,
              )
            }}
          </DescriptionsItem>
          <DescriptionsItem label="结束时间">
            {{
              formatDateTime(runDetail?.endTime || runDetail?.endTimeMillis)
            }}
          </DescriptionsItem>
          <DescriptionsItem label="持续时间">
            {{
              formatDuration(
                runDetail?.durationInMillis || runDetail?.duration,
              )
            }}
          </DescriptionsItem>
        </Descriptions>
      </Card>

      <!-- ==================== Section 2: Stage Visualization ==================== -->
      <Card size="small" title="阶段可视化" class="mb-4">
        <StagePipeline
          ref="stagePipelineRef"
          :stages="stages"
          :selected-stage-id="selectedStageId"
          clickable
          @stage-click="selectStage"
        />
      </Card>

      <!-- ==================== Section 3: Build Log ==================== -->
      <Card size="small" class="mb-4">
        <template #title>
          <div class="log-header">
            <span class="log-header-title">构建日志</span>
            <Space style="margin-left: auto">
              <label class="follow-toggle">
                <input
                  type="checkbox"
                  v-model="followLog"
                  style="margin-right: 4px"
                />
                跟随日志
              </label>
              <Input
                v-model:value="logSearchText"
                placeholder="搜索日志..."
                allow-clear
                style="width: 200px"
                size="small"
              />
              <Button size="small" @click="downloadLog">下载日志</Button>
            </Space>
          </div>
        </template>

        <!-- Log Tabs: Full log + per-stage tabs -->
        <div class="log-tabs">
          <div
            class="log-tab"
            :class="{ 'log-tab-active': activeLogTab === 'full' }"
            @click="switchLogTab('full')"
          >
            全量日志
          </div>
          <div
            v-for="stage in stages"
            :key="'tab-' + stage.id"
            class="log-tab"
            :class="{
              'log-tab-active': activeLogTab === String(stage.id),
            }"
            @click="switchLogTab(String(stage.id))"
          >
            <span
              class="log-tab-dot"
              :style="{
                background: getStageStatusDotColor(
                  getStageStatus(stage),
                ),
              }"
            />
            {{ stage.displayName || stage.name }}
          </div>
        </div>

        <Divider style="margin: 0 0 12px 0" />

        <!-- Log Content Viewer -->
        <Spin :spinning="logLoading">
          <div ref="logViewerRef" class="log-viewer">
            <template v-if="filteredLogLines.length > 0">
              <div
                v-for="(line, idx) in filteredLogLines"
                :key="idx"
                class="log-line"
                :class="{
                  'log-line-error': isErrorLine(line),
                  'log-line-warn': isWarnLine(line),
                }"
              >
                <span class="log-line-number">{{ idx + 1 }}</span>
                <span
                  class="log-line-text"
                  v-html="highlightSearch(line)"
                ></span>
              </div>
            </template>
            <div v-else class="log-empty">
              {{ logContent ? '没有匹配的日志行' : '暂无日志' }}
            </div>
          </div>
        </Spin>
      </Card>
    </Spin>
  </div>
</template>

<style scoped>
/* ==================== Page Header ==================== */
.run-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.run-header-left {
  display: flex;
  align-items: center;
}

.run-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

/* ==================== Log Section ==================== */
.log-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.log-header-title {
  font-weight: 500;
}

.follow-toggle {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #595959;
  cursor: pointer;
  user-select: none;
}

.log-tabs {
  display: flex;
  gap: 4px;
  padding: 0 0 12px 0;
  overflow-x: auto;
  flex-wrap: nowrap;
}

.log-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  color: #595959;
  background: #f5f5f5;
  border: 1px solid transparent;
  transition: all 0.2s;
  user-select: none;
}

.log-tab:hover {
  background: #e8e8e8;
}

.log-tab-active {
  background: #e6f7ff;
  color: #1890ff;
  border-color: #91d5ff;
  font-weight: 500;
}

.log-tab-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ==================== Log Viewer ==================== */
.log-viewer {
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 16px;
  border-radius: 8px;
  max-height: 600px;
  overflow-y: auto;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #555 #1e1e1e;
}

.log-viewer::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.log-viewer::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.log-viewer::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.log-viewer::-webkit-scrollbar-thumb:hover {
  background: #777;
}

.log-line {
  display: flex;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 1px 0;
}

.log-line:hover {
  background: rgba(255, 255, 255, 0.04);
}

.log-line-error {
  background: rgba(245, 34, 45, 0.12);
  color: #f5726c;
}

.log-line-error:hover {
  background: rgba(245, 34, 45, 0.18);
}

.log-line-warn {
  background: rgba(250, 140, 22, 0.1);
  color: #dcdcaa;
}

.log-line-warn:hover {
  background: rgba(250, 140, 22, 0.16);
}

.log-line-number {
  display: inline-block;
  min-width: 48px;
  padding-right: 12px;
  text-align: right;
  color: #595959;
  user-select: none;
  flex-shrink: 0;
  border-right: 1px solid #333;
  margin-right: 12px;
}

.log-line-text {
  flex: 1;
}

.log-empty {
  color: #8c8c8c;
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
}
</style>
