<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Table, Tag, Space, Button, Modal, message } from 'ant-design-vue';
import { getDeployPlans, deleteDeployPlan } from '../api/deploy';

const router = useRouter();
const loading = ref(false);
const plans = ref<any[]>([]);

const columns = [
  { title: '计划名称', dataIndex: 'planName', key: 'planName' },
  { title: 'K8s版本', dataIndex: 'k8sVersion', key: 'k8sVersion', width: 110 },
  { title: '部署类型', dataIndex: 'deployType', key: 'deployType', width: 100 },
  { title: '网络插件', dataIndex: 'networkPlugin', key: 'networkPlugin', width: 100 },
  { title: '容器运行时', dataIndex: 'containerRuntime', key: 'containerRuntime', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const statusColors: Record<string, string> = {
  pending: 'default', running: 'blue', completed: 'green', failed: 'red',
};
const statusLabels: Record<string, string> = {
  pending: '待执行', running: '部署中', completed: '已完成', failed: '失败',
};

async function fetchData() {
  loading.value = true;
  try {
    const res = await getDeployPlans();
    plans.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取部署计划失败: ' + e.message); }
  finally { loading.value = false; }
}

function goCreate() { router.push('/K8S/deploy/create'); }
function goDetail(r: any) { router.push(`/K8S/deploy/detail/${r.id}`); }

function handleDelete(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除部署计划「${r.planName}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteDeployPlan(r.id); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Card title="集群部署">
      <template #extra>
        <Space>
          <Button @click="fetchData">刷新</Button>
          <Button type="primary" @click="goCreate">创建部署计划</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="plans" :loading="loading" row-key="id" :scroll="{ x: 1100 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'planName'"><a @click="goDetail(record)">{{ record.planName }}</a></template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColors[record.status] || 'default'">{{ statusLabels[record.status] || record.status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="goDetail(record)">详情</Button>
              <Button type="link" size="small" danger @click="handleDelete(record)" :disabled="record.status === 'running'">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
