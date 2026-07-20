<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Tabs,
  TabPane,
  Table,
  Button,
  Tag,
  Space,
  Descriptions,
  DescriptionsItem,
  Modal,
  message,
  Spin,
  Tooltip,
} from 'ant-design-vue';
import {
  getPipeline,
  getPipelineRuns,
  getPipelineRunStages,
  triggerPipelineRun,
  deletePipeline,
  stopPipelineRun,
  getJenkinsfile,
} from '../api/devops';
import StagePipeline from '../components/StagePipeline.vue';
import JenkinsfileEditor from '../components/JenkinsfileEditor.vue';

const route = useRoute();
const router = useRouter();
const projectId = Number(route.params.projectId);
const pipelineId = Number(route.params.pipelineId);

const loading = ref(true);
const pipeline = ref<any>(null);
const runs = ref<any[]>([]);
const jenkinsfile = ref('');
const activeTab = ref('runs');
const triggering = ref(false);

// Latest run stage visualization
const latestRunStages = ref<any[]>([]);
const latestRun = computed(() => runs.value[0] || null);

let pollTimer: ReturnType<typeof setInterval> | null = null;

// ---------- Status maps ----------

const statusColorMap: Record<string, string> = {
  success: 'green',
  failed: 'red',
  running: 'blue',
  aborted: 'orange',
  pending: 'default',
  queued: 'processing',
};

const pipelineStatusColorMap: Record<string, string> = {
  active: 'green',
  disabled: 'default',
  error: 'red',
};

const triggerTypeLabels: Record<string, string> = {
  manual: '手动触发',
  timer: '定时触发',
  webhook: 'Webhook',
  scm: '代码变更',
};

const sourceTypeLabels: Record<string, string> = {
  git: 'Git',
  svn: 'SVN',
  jenkins: 'Jenkins',
};

// ---------- Table columns ----------

const runColumns = [
  { title: '#运行号', dataIndex: 'runNumber', key: 'runNumber', width: 100 },
  { title: '状态', key: 'status', width: 120 },
  { title: '触发方式', key: 'triggerType', width: 120 },
  { title: '触发人', dataIndex: 'triggerUser', key: 'triggerUser', width: 120 },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
  { title: '耗时', key: 'durationMs', width: 120 },
  { title: '操作', key: 'action', width: 150 },
];

// ---------- Computed ----------

const hasActiveRun = computed(() =>
  runs.value.some((r) =>
    ['running', 'queued', 'pending'].includes(r.status),
  ),
);

// ---------- Helpers ----------

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) return `${minutes}分${secs}秒`;
  return `${secs}秒`;
}

// ---------- Data fetching ----------

async function fetchPipeline() {
  try {
    pipeline.value = await getPipeline(projectId, pipelineId);
  } catch (e: any) {
    message.error('获取流水线详情失败: ' + e.message);
  }
}

async function fetchRuns() {
  try {
    const res = await getPipelineRuns(projectId, pipelineId);
    runs.value = Array.isArray(res) ? res : (res as any)?.data || [];
    // Fetch stages for the latest run
    if (runs.value.length > 0) {
      await fetchLatestRunStages();
    } else {
      latestRunStages.value = [];
    }
  } catch (e: any) {
    message.error('获取运行记录失败: ' + e.message);
  }
}

async function fetchLatestRunStages() {
  const latest = runs.value[0];
  if (!latest) return;
  try {
    const res = await getPipelineRunStages(projectId, pipelineId, latest.id);
    latestRunStages.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch {
    latestRunStages.value = [];
  }
}

async function fetchJenkinsfile() {
  try {
    const res = await getJenkinsfile(projectId, pipelineId);
    jenkinsfile.value = typeof res === 'string' ? res : (res as any)?.jenkinsfile || '';
  } catch {
    jenkinsfile.value = '';
  }
}

async function fetchAll() {
  loading.value = true;
  try {
    await Promise.all([fetchPipeline(), fetchRuns(), fetchJenkinsfile()]);
  } finally {
    loading.value = false;
  }
}

// ---------- Polling ----------

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (hasActiveRun.value) {
      fetchRuns();
    } else if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }, 5000);
}

// ---------- Actions ----------

async function handleTriggerRun() {
  triggering.value = true;
  try {
    await triggerPipelineRun(projectId, pipelineId);
    message.success('流水线已触发运行');
    await fetchRuns();
    startPolling();
  } catch (e: any) {
    message.error('触发运行失败: ' + e.message);
  } finally {
    triggering.value = false;
  }
}

function handleEdit() {
  router.push({
    path: `/K8S/devops/projects/${projectId}/pipelines/create`,
    query: { edit: String(pipelineId) },
  });
}

function handleDelete() {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除流水线「${pipeline.value?.name || ''}」吗？此操作不可恢复。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await deletePipeline(projectId, pipelineId);
        message.success('删除成功');
        router.push(`/K8S/devops/projects/${projectId}/pipelines`);
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

function handleViewRun(runId: number) {
  router.push(
    `/K8S/devops/projects/${projectId}/pipelines/${pipelineId}/runs/${runId}`,
  );
}

async function handleStopRun(runId: number) {
  try {
    await stopPipelineRun(projectId, pipelineId, runId);
    message.success('已发送停止请求');
    await fetchRuns();
  } catch (e: any) {
    message.error('停止失败: ' + e.message);
  }
}

function goBack() {
  router.push(`/K8S/devops/projects/${projectId}/pipelines`);
}

// ---------- Lifecycle ----------

onMounted(() => {
  fetchAll();
  startPolling();
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <!-- Page Header -->
      <Card class="mb-4">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px">
            <Button size="small" @click="goBack">返回</Button>
            <h2 style="margin: 0; font-size: 20px">
              {{ pipeline?.name || '加载中...' }}
            </h2>
            <Tag
              v-if="pipeline?.status"
              :color="pipelineStatusColorMap[pipeline.status] || 'default'"
            >
              {{ pipeline.status === 'active' ? '运行中' : pipeline.status === 'disabled' ? '已禁用' : pipeline.status === 'error' ? '异常' : pipeline.status }}
            </Tag>
          </div>
          <Space>
            <Button type="primary" :loading="triggering" @click="handleTriggerRun">运行</Button>
            <Button @click="handleEdit">编辑</Button>
            <Button danger @click="handleDelete">删除</Button>
          </Space>
        </div>
      </Card>

      <!-- Latest Run Stage Visualization -->
      <Card v-if="latestRun" size="small" class="mb-4">
        <template #title>
          <div style="display: flex; align-items: center; gap: 12px">
            <span>最新运行</span>
            <a style="font-weight: 500" @click="handleViewRun(latestRun.id)">#{{ latestRun.runNumber }}</a>
            <Tag :color="statusColorMap[latestRun.status] || 'default'" style="margin: 0">
              {{ latestRun.status === 'success' ? '成功' : latestRun.status === 'failed' ? '失败' : latestRun.status === 'running' ? '运行中' : latestRun.status === 'aborted' ? '已中止' : latestRun.status }}
            </Tag>
            <span v-if="latestRun.durationMs" style="color: #8c8c8c; font-size: 12px">
              {{ formatDuration(latestRun.durationMs) }}
            </span>
          </div>
        </template>
        <StagePipeline
          :stages="latestRunStages"
          clickable
          @stage-click="() => handleViewRun(latestRun.id)"
        />
      </Card>

      <!-- Tabs -->
      <Card>
        <Tabs v-model:activeKey="activeTab">
          <!-- Tab 1: Run History -->
          <TabPane key="runs" tab="运行记录">
            <Table
              :columns="runColumns"
              :data-source="runs"
              :pagination="{ pageSize: 20 }"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'runNumber'">
                  <a style="font-weight: 500" @click="handleViewRun(record.id)">
                    #{{ record.runNumber }}
                  </a>
                </template>
                <template v-if="column.key === 'status'">
                  <Tag :color="statusColorMap[record.status] || 'default'">
                    <template v-if="record.status === 'running'">
                      <span style="display: inline-flex; align-items: center; gap: 4px;">
                        <span class="ant-spin-dot ant-spin-dot-spin" style="font-size: 10px">
                          <i class="ant-spin-dot-item" v-for="i in 4" :key="i" />
                        </span>
                        运行中
                      </span>
                    </template>
                    <template v-else>
                      {{ record.status === 'success' ? '成功' : record.status === 'failed' ? '失败' : record.status === 'aborted' ? '已中止' : record.status === 'pending' ? '等待中' : record.status === 'queued' ? '排队中' : record.status }}
                    </template>
                  </Tag>
                </template>
                <template v-if="column.key === 'triggerType'">
                  {{ triggerTypeLabels[record.triggerType] || record.triggerType }}
                </template>
                <template v-if="column.key === 'durationMs'">
                  {{ formatDuration(record.durationMs) }}
                </template>
                <template v-if="column.key === 'action'">
                  <Space>
                    <Tooltip title="查看详情">
                      <Button type="link" size="small" @click="handleViewRun(record.id)">查看</Button>
                    </Tooltip>
                    <Tooltip v-if="record.status === 'running' || record.status === 'queued'" title="停止运行">
                      <Button type="link" danger size="small" @click="handleStopRun(record.id)">停止</Button>
                    </Tooltip>
                  </Space>
                </template>
              </template>
            </Table>
          </TabPane>

          <!-- Tab 2: Configuration -->
          <TabPane key="config" tab="配置">
            <Descriptions bordered :column="2" size="small">
              <DescriptionsItem label="名称">{{ pipeline?.name }}</DescriptionsItem>
              <DescriptionsItem label="类型">{{ pipeline?.type }}</DescriptionsItem>
              <DescriptionsItem label="代码源类型">
                {{ sourceTypeLabels[pipeline?.sourceType] || pipeline?.sourceType }}
              </DescriptionsItem>
              <DescriptionsItem label="代码仓库地址">{{ pipeline?.sourceUrl || '-' }}</DescriptionsItem>
              <DescriptionsItem label="分支">{{ pipeline?.sourceBranch || '-' }}</DescriptionsItem>
              <DescriptionsItem label="禁止并发运行">{{ pipeline?.disableConcurrent ? '是' : '否' }}</DescriptionsItem>
              <DescriptionsItem label="定时触发">{{ pipeline?.timerTrigger || '-' }}</DescriptionsItem>
              <DescriptionsItem label="Jenkins Job">{{ pipeline?.jenkinsJobName || '-' }}</DescriptionsItem>
              <DescriptionsItem label="状态">
                <Tag :color="pipelineStatusColorMap[pipeline?.status] || 'default'">{{ pipeline?.status }}</Tag>
              </DescriptionsItem>
              <DescriptionsItem label="创建时间">{{ pipeline?.createdAt || '-' }}</DescriptionsItem>
            </Descriptions>
          </TabPane>

          <!-- Tab 3: Jenkinsfile -->
          <TabPane key="jenkinsfile" tab="Jenkinsfile">
            <div v-if="jenkinsfile">
              <JenkinsfileEditor v-model="jenkinsfile" height="500px" read-only />
            </div>
            <div v-else style="color: #8c8c8c; padding: 40px; text-align: center">
              暂无 Jenkinsfile 内容
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </Spin>
  </div>
</template>
