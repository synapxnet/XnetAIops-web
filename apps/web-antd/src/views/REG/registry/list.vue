<script lang="ts" setup>
import type { Registry } from '../api/types';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Card,
  message,
  Modal,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { deleteRegistry, getRegistries } from '../api/registry';
import {
  cancelDeploy,
  deployRegistry,
  restartRegistry,
  startRegistry,
  stopRegistry,
  undeployRegistry,
} from '../api/deploy';

const router = useRouter();
const loading = ref(false);
const registries = ref<Registry[]>([]);

const typeColorMap: Record<string, string> = {
  harbor: 'blue',
  gitlab: 'orange',
  docker_distribution: 'green',
};

const typeLabelMap: Record<string, string> = {
  harbor: 'Harbor',
  gitlab: 'GitLab',
  docker_distribution: 'Registry',
};

const statusColorMap: Record<string, string> = {
  not_deployed: 'default',
  deploying: 'processing',
  running: 'success',
  stopped: 'warning',
  failed: 'error',
  uninstalling: 'processing',
};

const statusLabelMap: Record<string, string> = {
  not_deployed: '未部署',
  deploying: '部署中',
  running: '运行中',
  stopped: '已停止',
  failed: '失败',
  uninstalling: '卸载中',
};

const columns = [
  { title: '仓库名称', dataIndex: 'registryName', key: 'registryName', width: 180 },
  { title: '类型', dataIndex: 'registryType', key: 'registryType', width: 120 },
  { title: '部署方式', dataIndex: 'deployMode', key: 'deployMode', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '访问地址', dataIndex: 'endpoint', key: 'endpoint', width: 250 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 280, fixed: 'right' as const },
];

async function fetchData() {
  loading.value = true;
  try {
    const res = await getRegistries();
    registries.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取仓库列表失败: ' + (e.message || e));
  } finally {
    loading.value = false;
  }
}

function goCreate() {
  router.push('/REG/registry/create');
}

function goDetail(id: number) {
  router.push(`/REG/registry/detail/${id}`);
}

async function handleDeploy(record: Registry) {
  Modal.confirm({
    title: '确认部署',
    content: `确定要部署仓库 "${record.registryName}" 吗？`,
    async onOk() {
      try {
        await deployRegistry(record.id);
        message.success('部署任务已提交');
        fetchData();
      } catch (e: any) {
        message.error('部署失败: ' + (e.message || e));
      }
    },
  });
}

async function handleCancelDeploy(record: Registry) {
  Modal.confirm({
    title: '取消部署',
    content: `确定要取消仓库 "${record.registryName}" 的当前部署/卸载操作吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await cancelDeploy(record.id);
        message.success('已取消部署');
        fetchData();
      } catch (e: any) {
        message.error('取消失败: ' + (e.message || e));
      }
    },
  });
}

async function handleAction(record: Registry, action: string, label: string) {
  Modal.confirm({
    title: `确认${label}`,
    content: `确定要${label}仓库 "${record.registryName}" 吗？`,
    async onOk() {
      try {
        const actionMap: Record<string, (id: number) => Promise<any>> = {
          start: startRegistry,
          stop: stopRegistry,
          restart: restartRegistry,
          undeploy: undeployRegistry,
        };
        await actionMap[action]!(record.id);
        message.success(`${label}操作已提交`);
        fetchData();
      } catch (e: any) {
        message.error(`${label}失败: ` + (e.message || e));
      }
    },
  });
}

async function handleDelete(record: Registry) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除仓库 "${record.registryName}" 吗？此操作不可恢复。`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteRegistry(record.id);
        message.success('删除成功');
        fetchData();
      } catch (e: any) {
        message.error('删除失败: ' + (e.message || e));
      }
    },
  });
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <Card title="仓库管理">
      <template #extra>
        <Button type="primary" @click="goCreate">创建仓库</Button>
      </template>
      <Table
        :columns="columns"
        :data-source="registries"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        row-key="id"
        :scroll="{ x: 1300 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'registryType'">
            <Tag :color="typeColorMap[record.registryType] || 'default'">
              {{ typeLabelMap[record.registryType] || record.registryType }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'deployMode'">
            <Tag :color="record.deployMode === 'ssh' ? 'purple' : 'cyan'">
              {{ record.deployMode === 'ssh' ? 'SSH' : 'K8s' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status] || 'default'">
              {{ statusLabelMap[record.status] || record.status }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'endpoint'">
            <a
              v-if="record.endpoint"
              :href="record.endpoint"
              target="_blank"
            >
              {{ record.endpoint }}
            </a>
            <span v-else class="text-gray-400">-</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button size="small" type="link" @click="goDetail(record.id)">
                详情
              </Button>
              <template v-if="record.status === 'deploying' || record.status === 'uninstalling'">
                <Button size="small" type="link" danger @click="handleCancelDeploy(record)">
                  取消
                </Button>
              </template>
              <template v-if="record.status === 'not_deployed' || record.status === 'failed'">
                <Button size="small" type="link" @click="handleDeploy(record)">
                  部署
                </Button>
              </template>
              <template v-if="record.status === 'running'">
                <Button size="small" type="link" @click="handleAction(record, 'stop', '停止')">
                  停止
                </Button>
                <Button size="small" type="link" @click="handleAction(record, 'restart', '重启')">
                  重启
                </Button>
              </template>
              <template v-if="record.status === 'stopped'">
                <Button size="small" type="link" @click="handleAction(record, 'start', '启动')">
                  启动
                </Button>
              </template>
              <template v-if="record.status === 'running' || record.status === 'stopped'">
                <Button size="small" type="link" danger @click="handleAction(record, 'undeploy', '卸载')">
                  卸载
                </Button>
              </template>
              <Button
                v-if="record.status !== 'deploying' && record.status !== 'uninstalling'"
                size="small"
                type="link"
                danger
                @click="handleDelete(record)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
