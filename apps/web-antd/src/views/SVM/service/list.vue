<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card, Table, Button, Tag, Space, Modal, message, Select, SelectOption,
} from 'ant-design-vue';
import {
  getServiceInstances, deleteServiceInstance, getRoleInstances,
  installService, startService, stopService, restartService,
} from '../api/service';
import { getClusters } from '../../CLM/api/cluster';
import type { ServiceInstance, RoleInstance } from '../api/types';
import type { Cluster } from '../../CLM/api/types';

const router = useRouter();
const loading = ref(false);
const services = ref<ServiceInstance[]>([]);
const clusters = ref<Cluster[]>([]);
const selectedClusterId = ref<number | undefined>(undefined);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const columns = [
  { title: '服务名称', dataIndex: 'serviceName', key: 'serviceName' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '配置版本', dataIndex: 'configVersion', key: 'configVersion', width: 100 },
  { title: '需要重启', dataIndex: 'needRestart', key: 'needRestart', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 340, fixed: 'right' as const },
];

const statusColorMap: Record<string, string> = {
  running: 'green', stopped: 'orange', not_installed: 'default',
  installing: 'blue', error: 'red',
};

const statusLabelMap: Record<string, string> = {
  running: '运行中', stopped: '已停止', not_installed: '未安装',
  installing: '安装中', error: '异常',
};

// Role instances modal
const roleModalVisible = ref(false);
const roleModalTitle = ref('');
const roleInstances = ref<RoleInstance[]>([]);
const roleLoading = ref(false);

const roleColumns = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
  { title: '角色类型', dataIndex: 'roleType', key: 'roleType', width: 100 },
  { title: '主机', dataIndex: 'hostname', key: 'hostname' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
];

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

async function fetchServices() {
  loading.value = true;
  try {
    const res = await getServiceInstances(selectedClusterId.value);
    services.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取服务列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function onClusterChange(value: any) {
  selectedClusterId.value = value;
  fetchServices();
}

function goDetail(record: ServiceInstance) {
  router.push(`/SVM/service/detail/${record.id}`);
}

function goCreate() {
  router.push('/SVM/service/create');
}

// --- Lifecycle actions ---
async function handleAction(record: ServiceInstance, action: string) {
  const actionMap: Record<string, { fn: (id: number) => Promise<any>; label: string }> = {
    install: { fn: installService, label: '安装' },
    start: { fn: startService, label: '启动' },
    stop: { fn: stopService, label: '停止' },
    restart: { fn: restartService, label: '重启' },
  };

  const { fn, label } = actionMap[action] || {};
  if (!fn) return;

  Modal.confirm({
    title: `确认${label}`,
    content: `确定要${label}服务「${record.serviceName}」吗？`,
    async onOk() {
      try {
        await fn(record.id);
        message.success(`${label}命令已发送`);
        fetchServices();
        startAutoRefresh();
      } catch (e: any) {
        message.error(`${label}失败: ` + e.message);
      }
    },
  });
}

function handleDelete(record: ServiceInstance) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除服务「${record.serviceName}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteServiceInstance(record.id);
        message.success('删除成功');
        fetchServices();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

async function showRoles(record: ServiceInstance) {
  roleModalTitle.value = `${record.serviceName} - 角色实例`;
  roleModalVisible.value = true;
  roleLoading.value = true;
  try {
    const res = await getRoleInstances(record.id);
    roleInstances.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取角色实例失败: ' + e.message);
  } finally {
    roleLoading.value = false;
  }
}

// Auto-refresh when there are active operations
function startAutoRefresh() {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    const hasActive = services.value.some(s => s.status === 'installing');
    if (hasActive) {
      fetchServices();
    } else {
      stopAutoRefresh();
    }
  }, 5000);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

onMounted(() => {
  fetchClusters();
  fetchServices();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="p-4">
    <Card title="服务总览">
      <template #extra>
        <Space>
          <Select
            v-model:value="selectedClusterId"
            placeholder="选择集群"
            style="width: 200px"
            allow-clear
            @change="onClusterChange"
          >
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">
              {{ c.clusterName }}
            </SelectOption>
          </Select>
          <Button @click="fetchServices">刷新</Button>
          <Button type="primary" @click="goCreate">创建服务</Button>
        </Space>
      </template>
      <Table
        :columns="columns"
        :data-source="services"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1100 }"
        size="small"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'serviceName'">
            <a @click="goDetail(_record as ServiceInstance)">{{ (_record as any).serviceName }}</a>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">
              {{ statusLabelMap[(_record as any).status] || (_record as any).status }}
            </Tag>
          </template>
          <template v-if="column.key === 'needRestart'">
            <Tag v-if="(_record as any).needRestart" color="orange">需要重启</Tag>
            <Tag v-else color="green">正常</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="showRoles(_record as ServiceInstance)">角色</Button>
              <Button
                v-if="(_record as any).status === 'not_installed'"
                type="link" size="small"
                @click="handleAction(_record as ServiceInstance, 'install')"
              >安装</Button>
              <Button
                v-if="(_record as any).status === 'stopped'"
                type="link" size="small"
                @click="handleAction(_record as ServiceInstance, 'start')"
              >启动</Button>
              <Button
                v-if="(_record as any).status === 'running'"
                type="link" size="small"
                @click="handleAction(_record as ServiceInstance, 'stop')"
              >停止</Button>
              <Button
                v-if="(_record as any).status === 'running' || (_record as any).status === 'error'"
                type="link" size="small"
                @click="handleAction(_record as ServiceInstance, 'restart')"
              >重启</Button>
              <Button
                v-if="(_record as any).status !== 'installing'"
                type="link" size="small" danger
                @click="handleDelete(_record as ServiceInstance)"
              >删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Role Instances Modal -->
    <Modal
      v-model:open="roleModalVisible"
      :title="roleModalTitle"
      :footer="null"
      width="700px"
    >
      <Table
        :columns="roleColumns"
        :data-source="roleInstances"
        :loading="roleLoading"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">
              {{ statusLabelMap[(_record as any).status] || (_record as any).status }}
            </Tag>
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>
