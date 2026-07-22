<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card, Descriptions, DescriptionsItem, Table, Button, Tag, Space,
  Tabs, TabPane, Modal, message, Progress,
} from 'ant-design-vue';
import {
  getServiceDetail, installService, startService, stopService,
  restartService, pushConfig, getRoleInstances, removeRoleInstance,
} from '../api/service';
import { getCommands } from '../api/command';
import type { ServiceInstance, RoleInstance, Command } from '../api/types';

const route = useRoute();
const router = useRouter();
const serviceId = computed(() => Number(route.params.id));
const loading = ref(false);
const service = ref<ServiceInstance | null>(null);
const roles = ref<RoleInstance[]>([]);
const commands = ref<Command[]>([]);
const activeTab = ref('overview');
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const statusColorMap: Record<string, string> = {
  running: 'green', stopped: 'orange', not_installed: 'default',
  installing: 'blue', error: 'red',
  pending: 'default', success: 'green', failed: 'red', cancelled: 'orange',
};

const statusLabelMap: Record<string, string> = {
  running: '运行中', stopped: '已停止', not_installed: '未安装',
  installing: '安装中', error: '异常',
  pending: '等待中', success: '成功', failed: '失败', cancelled: '已取消',
};

const roleColumns = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
  { title: '角色类型', dataIndex: 'roleType', key: 'roleType', width: 100 },
  { title: '主机', dataIndex: 'hostname', key: 'hostname' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '需要重启', dataIndex: 'needRestart', key: 'needRestart', width: 100 },
  { title: '操作', key: 'action', width: 100 },
];

const commandColumns = [
  { title: '指令名称', dataIndex: 'commandName', key: 'commandName' },
  { title: '类型', dataIndex: 'commandType', key: 'commandType', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '进度', key: 'progress', width: 150 },
  { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
];

const typeColorMap: Record<string, string> = {
  install: 'blue', start: 'green', stop: 'orange',
  restart: 'cyan', config_update: 'purple',
};

const typeLabelMap: Record<string, string> = {
  install: '安装', start: '启动', stop: '停止',
  restart: '重启', config_update: '配置更新',
};

async function fetchDetail() {
  loading.value = true;
  try {
    const res = await getServiceDetail(serviceId.value);
    if (res) {
      service.value = res.service || res;
      roles.value = Array.isArray(res.roles) ? res.roles : [];
      commands.value = Array.isArray(res.commands) ? res.commands : [];
    }
  } catch (e: any) {
    message.error('获取服务详情失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

async function fetchRoles() {
  try {
    const res = await getRoleInstances(serviceId.value);
    roles.value = Array.isArray(res) ? res : [];
  } catch { /* ignore */ }
}

async function handleAction(action: string) {
  const actionMap: Record<string, { fn: (id: number) => Promise<any>; label: string }> = {
    install: { fn: installService, label: '安装' },
    start: { fn: startService, label: '启动' },
    stop: { fn: stopService, label: '停止' },
    restart: { fn: restartService, label: '重启' },
    config: { fn: pushConfig, label: '推送配置' },
  };

  const { fn, label } = actionMap[action] || {};
  if (!fn || !service.value) return;

  Modal.confirm({
    title: `确认${label}`,
    content: `确定要${label}服务「${service.value.serviceName}」吗？`,
    async onOk() {
      try {
        await fn(serviceId.value);
        message.success(`${label}命令已发送`);
        fetchDetail();
        startAutoRefresh();
      } catch (e: any) {
        message.error(`${label}失败: ` + e.message);
      }
    },
  });
}

function handleDeleteRole(record: RoleInstance) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除角色实例「${record.roleName}」吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await removeRoleInstance(record.id);
        message.success('删除成功');
        fetchRoles();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

function goBack() {
  router.push('/SVM/service/list');
}

// Auto-refresh
function startAutoRefresh() {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    if (service.value?.status === 'installing') {
      fetchDetail();
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
  fetchDetail();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="p-4">
    <Card :loading="loading">
      <template #title>
        <Space>
          <Button size="small" @click="goBack">返回</Button>
          <span>{{ service?.serviceName || '服务详情' }}</span>
          <Tag v-if="service" :color="statusColorMap[service.status] || 'default'">
            {{ statusLabelMap[service.status] || service.status }}
          </Tag>
        </Space>
      </template>
      <template #extra>
        <Space v-if="service">
          <Button @click="fetchDetail">刷新</Button>
          <Button
            v-if="service.status === 'not_installed'"
            type="primary"
            @click="handleAction('install')"
          >安装</Button>
          <Button
            v-if="service.status === 'stopped'"
            type="primary"
            @click="handleAction('start')"
          >启动</Button>
          <Button
            v-if="service.status === 'running'"
            @click="handleAction('stop')"
          >停止</Button>
          <Button
            v-if="service.status === 'running' || service.status === 'error'"
            @click="handleAction('restart')"
          >重启</Button>
          <Button
            v-if="service.status === 'running'"
            @click="handleAction('config')"
          >推送配置</Button>
        </Space>
      </template>

      <Tabs v-model:activeKey="activeTab">
        <TabPane key="overview" tab="概览">
          <Descriptions bordered :column="2" size="small" v-if="service">
            <DescriptionsItem label="服务名称">{{ service.serviceName }}</DescriptionsItem>
            <DescriptionsItem label="状态">
              <Tag :color="statusColorMap[service.status] || 'default'">
                {{ statusLabelMap[service.status] || service.status }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="服务ID">{{ service.id }}</DescriptionsItem>
            <DescriptionsItem label="UID">{{ service.uid }}</DescriptionsItem>
            <DescriptionsItem label="集群ID">{{ service.clusterId }}</DescriptionsItem>
            <DescriptionsItem label="服务定义ID">{{ service.serviceDefId }}</DescriptionsItem>
            <DescriptionsItem label="配置版本">{{ service.configVersion }}</DescriptionsItem>
            <DescriptionsItem label="需要重启">
              <Tag v-if="service.needRestart" color="orange">需要重启</Tag>
              <Tag v-else color="green">正常</Tag>
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">{{ service.createdAt }}</DescriptionsItem>
            <DescriptionsItem label="更新时间">{{ service.updatedAt }}</DescriptionsItem>
          </Descriptions>
        </TabPane>

        <TabPane key="roles" tab="角色实例">
          <Table
            :columns="roleColumns"
            :data-source="roles"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record: _record }">
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
                <Button
                  type="link" size="small" danger
                  @click="handleDeleteRole(_record as RoleInstance)"
                >删除</Button>
              </template>
            </template>
          </Table>
        </TabPane>

        <TabPane key="config" tab="配置">
          <pre v-if="service?.configJson" class="bg-muted max-h-[500px] overflow-auto rounded p-4">{{ service.configJson }}</pre>
          <div v-else class="text-muted-foreground p-10 text-center">暂无配置</div>
        </TabPane>

        <TabPane key="commands" tab="命令历史">
          <Table
            :columns="commandColumns"
            :data-source="commands"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record: _record }">
              <template v-if="column.key === 'commandType'">
                <Tag :color="typeColorMap[(_record as any).commandType] || 'default'">
                  {{ typeLabelMap[(_record as any).commandType] || (_record as any).commandType }}
                </Tag>
              </template>
              <template v-if="column.key === 'status'">
                <Tag :color="statusColorMap[(_record as any).status] || 'default'">
                  {{ statusLabelMap[(_record as any).status] || (_record as any).status }}
                </Tag>
              </template>
              <template v-if="column.key === 'progress'">
                <Progress
                  :percent="(_record as any).progress || 0"
                  size="small"
                  :status="
                    (_record as any).status === 'failed'
                      ? 'exception'
                      : (_record as any).status === 'success'
                        ? 'success'
                        : 'active'
                  "
                />
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>
