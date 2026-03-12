<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Tag, Space, Button, Progress, Table, Spin, Descriptions, DescriptionsItem, Modal, message } from 'ant-design-vue';
import { getDeployPlan, getDeployLogs, executeDeployPlan, validateDeployPlan } from '../api/deploy';

const route = useRoute();
const router = useRouter();
const planId = Number(route.params.id);
const loading = ref(true);
const detail = ref<any>(null);
const logs = ref<any[]>([]);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const statusColors: Record<string, string> = {
  pending: 'default', validated: 'cyan', preparing: 'blue', installing: 'blue',
  ready: 'green', failed: 'red', running: 'blue', completed: 'green',
};
const statusLabels: Record<string, string> = {
  pending: '待执行', validated: '已验证', preparing: '准备中', installing: '安装中',
  ready: '就绪', failed: '失败', running: '部署中', completed: '已完成',
};

const nodeColumns = [
  { title: 'IP地址', dataIndex: 'host', key: 'host' },
  { title: '角色', key: 'role', width: 100 },
  { title: '主机名', dataIndex: 'hostname', key: 'hostname', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '状态信息', dataIndex: 'statusMessage', key: 'statusMessage' },
];

async function fetchData() {
  try {
    detail.value = await getDeployPlan(planId);
    const logRes = await getDeployLogs(planId);
    logs.value = Array.isArray(logRes) ? logRes : [];
  } catch (e: any) { message.error('获取部署详情失败: ' + e.message); }
  finally { loading.value = false; }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    const status = detail.value?.plan?.status;
    // Poll during deployment or when scale-out nodes are being added
    if (status === 'running') {
      fetchData();
    } else if (status === 'completed') {
      const nodes = detail.value?.nodes || [];
      const hasActiveNode = nodes.some((n: any) =>
        n.status === 'pending' || n.status === 'preparing' || n.status === 'installing'
      );
      if (hasActiveNode) fetchData();
      else if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    } else if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }, 3000);
}

async function handleValidate() {
  try {
    message.loading({ content: '验证节点中...', key: 'validate' });
    const res = await validateDeployPlan(planId);
    if (res?.allValid) {
      message.success({ content: '所有节点验证通过', key: 'validate' });
    } else {
      message.warning({ content: `${res?.valid}/${res?.total} 节点验证通过`, key: 'validate' });
    }
    fetchData();
  } catch (e: any) { message.error({ content: '验证失败: ' + e.message, key: 'validate' }); }
}

function handleExecute() {
  Modal.confirm({
    title: '确认部署', content: '确定要开始部署Kubernetes集群吗？此操作将在所有节点上安装和配置组件。',
    async onOk() {
      try {
        await executeDeployPlan(planId);
        message.success('部署已开始');
        fetchData();
        startPolling();
      } catch (e: any) { message.error('执行失败: ' + e.message); }
    },
  });
}

function goBack() { router.push('/K8S/deploy/list'); }

onMounted(() => {
  fetchData();
  startPolling();
});
onBeforeUnmount(() => { if (pollTimer) clearInterval(pollTimer); });
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loading">
      <Card class="mb-4">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h2 style="margin:0">
              {{ detail?.plan?.planName || '加载中...' }}
              <Tag :color="statusColors[detail?.plan?.status] || 'default'" style="margin-left:8px">
                {{ statusLabels[detail?.plan?.status] || detail?.plan?.status }}
              </Tag>
            </h2>
          </div>
          <Space>
            <Button v-if="detail?.plan?.status === 'pending'" @click="handleValidate">验证节点</Button>
            <Button v-if="detail?.plan?.status === 'pending' || detail?.plan?.status === 'validated' || detail?.plan?.status === 'completed'" @click="router.push(`/K8S/deploy/add-node/${planId}`)">添加节点</Button>
            <Button v-if="detail?.plan?.status === 'pending' || detail?.plan?.status === 'failed'" type="primary" @click="handleExecute">开始部署</Button>
            <Button @click="fetchData">刷新</Button>
            <Button @click="goBack">返回</Button>
          </Space>
        </div>
      </Card>

      <!-- Progress -->
      <Card size="small" title="部署进度" class="mb-4" v-if="detail?.plan?.status === 'running' || detail?.plan?.status === 'completed'">
        <Progress :percent="detail?.progress || 0" :status="detail?.plan?.status === 'failed' ? 'exception' : detail?.plan?.status === 'completed' ? 'success' : 'active'" />
        <div style="margin-top:8px;color:#8c8c8c">
          节点就绪: {{ detail?.readyNodes || 0 }} / {{ detail?.totalNodes || 0 }}
          <span v-if="detail?.failedNodes > 0" style="color:#ff4d4f"> (失败: {{ detail?.failedNodes }})</span>
        </div>
      </Card>

      <!-- Plan Info -->
      <Card size="small" title="计划信息" class="mb-4">
        <Descriptions bordered :column="3" size="small">
          <DescriptionsItem label="K8s版本">{{ detail?.plan?.k8sVersion }}</DescriptionsItem>
          <DescriptionsItem label="部署模式">{{ detail?.plan?.deployType === 'ha' ? '高可用' : '单Master' }}</DescriptionsItem>
          <DescriptionsItem label="网络插件">{{ detail?.plan?.networkPlugin }}</DescriptionsItem>
          <DescriptionsItem label="容器运行时">{{ detail?.plan?.containerRuntime }}</DescriptionsItem>
          <DescriptionsItem label="Pod CIDR">{{ detail?.plan?.podCidr }}</DescriptionsItem>
          <DescriptionsItem label="Service CIDR">{{ detail?.plan?.serviceCidr }}</DescriptionsItem>
        </Descriptions>
      </Card>

      <!-- Nodes -->
      <Card size="small" title="节点列表" class="mb-4">
        <Table :columns="nodeColumns" :data-source="detail?.nodes || []" :pagination="false" row-key="id" size="small">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'role'">
              <Tag :color="record.role === 'master' ? 'blue' : 'green'">{{ record.role }}</Tag>
            </template>
            <template v-if="column.key === 'status'">
              <Tag :color="statusColors[record.status] || 'default'">{{ statusLabels[record.status] || record.status }}</Tag>
            </template>
          </template>
        </Table>
      </Card>

      <!-- Logs -->
      <Card size="small" title="部署日志">
        <div style="background:#1e1e1e;color:#d4d4d4;border-radius:6px;padding:16px;max-height:500px;overflow:auto;font-family:monospace;font-size:12px">
          <div v-for="log in logs" :key="log.id" style="margin-bottom:4px">
            <span style="color:#6a9955">{{ log.createdAt }}</span>
            <span :style="{ color: log.logLevel === 'ERROR' ? '#f44747' : log.logLevel === 'WARN' ? '#dcdcaa' : '#569cd6', marginLeft: '8px' }">[{{ log.logLevel }}]</span>
            <span v-if="log.nodeHost" style="color:#ce9178;margin-left:8px">[{{ log.nodeHost }}]</span>
            <span style="margin-left:8px">{{ log.message }}</span>
          </div>
          <div v-if="logs.length === 0" style="color:#8c8c8c">暂无日志</div>
        </div>
      </Card>
    </Spin>
  </div>
</template>
