<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Table, Tag, Space, Button, Tabs, TabPane, Modal, message } from 'ant-design-vue';
import { getClusterRoles, getClusterRoleBindings, deleteClusterRole, deleteClusterRoleBinding } from '../api/rbac';
import K8sSelector from '../components/K8sSelector.vue';

const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const activeTab = ref('clusterroles');
const clusterRoles = ref<any[]>([]);
const clusterRoleBindings = ref<any[]>([]);

const crColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '规则数', dataIndex: 'ruleCount', key: 'ruleCount', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

const crbColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '角色引用', key: 'roleRef', width: 200 },
  { title: '主体数', key: 'subjectCount', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const [cr, crb] = await Promise.all([
      getClusterRoles(selectedClusterId.value),
      getClusterRoleBindings(selectedClusterId.value),
    ]);
    clusterRoles.value = Array.isArray(cr) ? cr : [];
    clusterRoleBindings.value = Array.isArray(crb) ? crb : [];
  } catch (e: any) { message.error('获取RBAC数据失败: ' + e.message); }
  finally { loading.value = false; }
}

function handleDeleteCR(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除ClusterRole「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteClusterRole(selectedClusterId.value!, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

function handleDeleteCRB(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除ClusterRoleBinding「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteClusterRoleBinding(selectedClusterId.value!, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="集群角色 (ClusterRole)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" :show-namespace="false" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
        </Space>
      </template>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="clusterroles" tab="ClusterRole">
          <Table :columns="crColumns" :data-source="clusterRoles" :loading="loading" row-key="name" :scroll="{ x: 600 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Button type="link" size="small" danger @click="handleDeleteCR(record)">删除</Button>
              </template>
            </template>
          </Table>
        </TabPane>
        <TabPane key="clusterrolebindings" tab="ClusterRoleBinding">
          <Table :columns="crbColumns" :data-source="clusterRoleBindings" :loading="loading" row-key="name" :scroll="{ x: 700 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'roleRef'">
                <Tag color="blue">{{ record.roleRef?.kind }}: {{ record.roleRef?.name }}</Tag>
              </template>
              <template v-if="column.key === 'subjectCount'">{{ record.subjects?.length || 0 }}</template>
              <template v-if="column.key === 'action'">
                <Button type="link" size="small" danger @click="handleDeleteCRB(record)">删除</Button>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>
