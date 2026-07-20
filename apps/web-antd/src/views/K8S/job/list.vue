<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  SelectOption,
  Tabs,
  TabPane,
  Modal,
  message,
} from 'ant-design-vue';
import { getJobs, deleteJob, rerunJob, getCronJobs, deleteCronJob, triggerCronJob, createJob, createCronJob } from '../api/job';
import YamlEditor from '../components/YamlEditor.vue';
import K8sSelector from '../components/K8sSelector.vue';

const router = useRouter();
const loading = ref(false);
const selectedClusterId = ref<number | null>(null);
const selectedNamespace = ref<string>('');
const activeTab = ref('jobs');

// Create state
const createVisible = ref(false);
const createType = ref<'job' | 'cronjob'>('job');
const createYaml = ref('');
const createLoading = ref(false);

function openCreate() {
  createType.value = 'job';
  createYaml.value = '';
  createVisible.value = true;
}

async function handleCreate() {
  if (!createYaml.value.trim()) { message.warning('请输入YAML内容'); return; }
  if (!selectedClusterId.value || !selectedNamespace.value) { message.warning('请选择集群和命名空间'); return; }
  createLoading.value = true;
  try {
    if (createType.value === 'job') {
      await createJob(selectedClusterId.value, selectedNamespace.value, createYaml.value);
    } else {
      await createCronJob(selectedClusterId.value, selectedNamespace.value, createYaml.value);
    }
    message.success('创建成功');
    createVisible.value = false;
    fetchJobs();
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  } finally {
    createLoading.value = false;
  }
}

const jobs = ref<any[]>([]);
const cronJobs = ref<any[]>([]);

const jobColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '状态', key: 'status', width: 100 },
  { title: '完成/总数', key: 'completion', width: 100 },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
  { title: '完成时间', dataIndex: 'completionTime', key: 'completionTime', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const cronJobColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '调度', dataIndex: 'schedule', key: 'schedule', width: 140 },
  { title: '状态', key: 'status', width: 100 },
  { title: '活跃', dataIndex: 'activeJobs', key: 'activeJobs', width: 60 },
  { title: '上次调度', dataIndex: 'lastScheduleTime', key: 'lastScheduleTime', width: 180 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 220, fixed: 'right' as const },
];

const jobStatusColor: Record<string, string> = {
  Completed: 'green',
  Running: 'blue',
  Failed: 'red',
  Pending: 'orange',
  Active: 'green',
  Suspended: 'default',
};

async function fetchJobs() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const cid = selectedClusterId.value;
    const ns = selectedNamespace.value;
    const [jobsRes, cronJobsRes] = await Promise.all([
      getJobs(cid, ns),
      getCronJobs(cid, ns),
    ]);
    jobs.value = Array.isArray(jobsRes) ? jobsRes : [];
    cronJobs.value = Array.isArray(cronJobsRes) ? cronJobsRes : [];
  } catch (e: any) {
    message.error('获取任务列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function goDetail(record: any, type: string) {
  router.push(`/K8S/job/detail/${selectedClusterId.value}/${record.namespace}/${type}/${record.name}`);
}

function handleRerun(record: any) {
  Modal.confirm({
    title: '确认重新执行',
    content: `确定要重新执行Job「${record.name}」吗？`,
    async onOk() {
      try {
        await rerunJob(selectedClusterId.value!, record.namespace, record.name);
        message.success('已重新执行');
        fetchJobs();
      } catch (e: any) {
        message.error('操作失败: ' + e.message);
      }
    },
  });
}

function handleDeleteJob(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除Job「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteJob(selectedClusterId.value!, record.namespace, record.name);
        message.success('删除成功');
        fetchJobs();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

function handleTrigger(record: any) {
  Modal.confirm({
    title: '确认触发',
    content: `确定要手动触发CronJob「${record.name}」吗？`,
    async onOk() {
      try {
        await triggerCronJob(selectedClusterId.value!, record.namespace, record.name);
        message.success('已触发');
        fetchJobs();
      } catch (e: any) {
        message.error('操作失败: ' + e.message);
      }
    },
  });
}

function handleDeleteCronJob(record: any) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除CronJob「${record.name}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteCronJob(selectedClusterId.value!, record.namespace, record.name);
        message.success('删除成功');
        fetchJobs();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="任务管理">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchJobs" />
          <Button @click="fetchJobs">刷新</Button>
          <Button type="primary" @click="openCreate">创建</Button>
        </Space>
      </template>

      <Tabs v-model:activeKey="activeTab">
        <TabPane key="jobs" :tab="`Jobs (${jobs.length})`">
          <Table
            :columns="jobColumns"
            :data-source="jobs"
            :loading="loading"
            row-key="name"
            :scroll="{ x: 1100 }"
            :pagination="{ pageSize: 20 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <a @click="goDetail(record, 'Job')">{{ record.name }}</a>
              </template>
              <template v-if="column.key === 'status'">
                <Tag :color="jobStatusColor[record.status] || 'default'">{{ record.status }}</Tag>
              </template>
              <template v-if="column.key === 'completion'">
                {{ record.succeeded || 0 }}/{{ record.active !== undefined ? (record.succeeded || 0) + (record.active || 0) + (record.failed || 0) : '-' }}
              </template>
              <template v-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="goDetail(record, 'Job')">详情</Button>
                  <Button type="link" size="small" @click="handleRerun(record)">重新执行</Button>
                  <Button type="link" size="small" danger @click="handleDeleteJob(record)">删除</Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="cronjobs" :tab="`CronJobs (${cronJobs.length})`">
          <Table
            :columns="cronJobColumns"
            :data-source="cronJobs"
            :loading="loading"
            row-key="name"
            :scroll="{ x: 1200 }"
            :pagination="{ pageSize: 20 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <a @click="goDetail(record, 'CronJob')">{{ record.name }}</a>
                <Tag v-if="record.suspend" color="default" size="small" class="ml-1">已暂停</Tag>
              </template>
              <template v-if="column.key === 'status'">
                <Tag :color="jobStatusColor[record.status] || 'default'">{{ record.status }}</Tag>
              </template>
              <template v-if="column.key === 'action'">
                <Space>
                  <Button type="link" size="small" @click="goDetail(record, 'CronJob')">详情</Button>
                  <Button type="link" size="small" @click="handleTrigger(record)">触发</Button>
                  <Button type="link" size="small" danger @click="handleDeleteCronJob(record)">删除</Button>
                </Space>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>

    <!-- 创建Job/CronJob Modal -->
    <Modal v-model:open="createVisible" title="创建任务" :confirm-loading="createLoading" @ok="handleCreate" :width="700">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">类型</label>
        <Select v-model:value="createType" style="width: 200px;">
          <SelectOption value="job">Job</SelectOption>
          <SelectOption value="cronjob">CronJob</SelectOption>
        </Select>
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">YAML</label>
        <YamlEditor v-model="createYaml" height="400px" />
      </div>
    </Modal>
  </div>
</template>
