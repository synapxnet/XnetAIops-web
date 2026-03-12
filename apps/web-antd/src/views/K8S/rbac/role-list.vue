<script lang="ts" setup>
import { ref } from 'vue';
import { Card, Table, Tag, Space, Button, Modal, message } from 'ant-design-vue';
import { getRoles, getRoleBindings, deleteRole, deleteRoleBinding } from '../api/rbac';
import { Tabs, TabPane } from 'ant-design-vue';
import K8sSelector from '../components/K8sSelector.vue';

const selectedClusterId = ref<number | null>(null);
const selectedNamespace = ref('');
const loading = ref(false);
const activeTab = ref('roles');
const roles = ref<any[]>([]);
const roleBindings = ref<any[]>([]);

const roleColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '规则数', dataIndex: 'ruleCount', key: 'ruleCount', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

const rbColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: '角色引用', key: 'roleRef', width: 200 },
  { title: '主体数', key: 'subjectCount', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

async function fetchData() {
  if (!selectedClusterId.value || !selectedNamespace.value) return;
  loading.value = true;
  try {
    const [r, rb] = await Promise.all([
      getRoles(selectedClusterId.value, selectedNamespace.value),
      getRoleBindings(selectedClusterId.value, selectedNamespace.value),
    ]);
    roles.value = Array.isArray(r) ? r : [];
    roleBindings.value = Array.isArray(rb) ? rb : [];
  } catch (e: any) { message.error('获取角色数据失败: ' + e.message); }
  finally { loading.value = false; }
}

function handleDeleteRole(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除Role「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteRole(selectedClusterId.value!, selectedNamespace.value, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

function handleDeleteRB(r: any) {
  Modal.confirm({
    title: '确认删除', content: `确定要删除RoleBinding「${r.name}」吗？`, okType: 'danger',
    async onOk() {
      try { await deleteRoleBinding(selectedClusterId.value!, selectedNamespace.value, r.name); message.success('删除成功'); fetchData(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}
</script>

<template>
  <div class="p-4">
    <Card title="角色 (Role)">
      <template #extra>
        <Space>
          <K8sSelector v-model:clusterId="selectedClusterId" v-model:namespace="selectedNamespace" @change="fetchData" />
          <Button @click="fetchData">刷新</Button>
        </Space>
      </template>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="roles" tab="Role">
          <Table :columns="roleColumns" :data-source="roles" :loading="loading" row-key="name" :scroll="{ x: 700 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action'">
                <Button type="link" size="small" danger @click="handleDeleteRole(record)">删除</Button>
              </template>
            </template>
          </Table>
        </TabPane>
        <TabPane key="rolebindings" tab="RoleBinding">
          <Table :columns="rbColumns" :data-source="roleBindings" :loading="loading" row-key="name" :scroll="{ x: 800 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'roleRef'">
                <Tag color="blue">{{ record.roleRef?.kind }}: {{ record.roleRef?.name }}</Tag>
              </template>
              <template v-if="column.key === 'subjectCount'">{{ record.subjects?.length || 0 }}</template>
              <template v-if="column.key === 'action'">
                <Button type="link" size="small" danger @click="handleDeleteRB(record)">删除</Button>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>
