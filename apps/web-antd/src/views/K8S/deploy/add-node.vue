<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Form, FormItem, Input, InputNumber, Select, SelectOption, Button, Space, Table, Tag, message } from 'ant-design-vue';
import { getDeployPlan, addDeployNode } from '../api/deploy';

const route = useRoute();
const router = useRouter();
const planId = Number(route.params.planId);
const loading = ref(true);
const detail = ref<any>(null);
const submitting = ref(false);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const isCompleted = computed(() => detail.value?.plan?.status === 'completed');

const form = ref({
  host: '',
  sshPort: 22,
  sshUser: 'root',
  sshPassword: '',
  role: 'worker',
  hostname: '',
});

const statusColors: Record<string, string> = {
  pending: 'default', validated: 'cyan', preparing: 'blue', installing: 'blue',
  ready: 'green', failed: 'red',
};
const statusLabels: Record<string, string> = {
  pending: '待处理', validated: '已验证', preparing: '准备中', installing: '安装中',
  ready: '就绪', failed: '失败',
};

async function fetchData() {
  try {
    detail.value = await getDeployPlan(planId);
  } catch (e: any) { message.error('获取计划详情失败: ' + e.message); }
  finally { loading.value = false; }
}

async function handleAdd() {
  if (!form.value.host) { message.warning('请输入节点IP'); return; }
  if (isCompleted.value) {
    form.value.role = 'worker';
  }
  submitting.value = true;
  try {
    await addDeployNode(planId, form.value);
    if (isCompleted.value) {
      message.success('节点正在加入集群，请查看日志');
      startPolling();
    } else {
      message.success('节点添加成功');
    }
    form.value = { host: '', sshPort: 22, sshUser: 'root', sshPassword: '', role: 'worker', hostname: '' };
    fetchData();
  } catch (e: any) { message.error('添加失败: ' + e.message); }
  finally { submitting.value = false; }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    const nodes = detail.value?.nodes || [];
    const hasActive = nodes.some((n: any) =>
      n.status === 'pending' || n.status === 'preparing' || n.status === 'installing'
    );
    if (hasActive) fetchData();
    else stopPolling();
  }, 3000);
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

function goBack() { router.push(`/K8S/deploy/detail/${planId}`); }
onMounted(fetchData);
onUnmounted(stopPolling);
</script>

<template>
  <div class="p-4">
    <Card :title="isCompleted ? `扩容节点 — ${detail?.plan?.planName || ''}` : `添加节点 — ${detail?.plan?.planName || ''}`">
      <template #extra>
        <Button @click="goBack">返回</Button>
      </template>

      <Card size="small" title="当前节点" class="mb-4" v-if="detail?.nodes">
        <Table
          :data-source="detail.nodes"
          :pagination="false"
          row-key="id"
          size="small"
          :columns="[
            { title: 'IP地址', dataIndex: 'host', key: 'host' },
            { title: '角色', key: 'role', width: 100 },
            { title: '主机名', dataIndex: 'hostname', key: 'hostname', width: 120 },
            { title: '状态', key: 'status', width: 100 },
            { title: '状态信息', dataIndex: 'statusMessage', key: 'statusMessage' },
          ]"
        >
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

      <Card size="small" :title="isCompleted ? '添加Worker节点（将自动加入集群）' : '添加新节点'">
        <Form layout="vertical" style="max-width:500px">
          <FormItem label="节点IP" required>
            <Input v-model:value="form.host" placeholder="192.168.1.x" />
          </FormItem>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <FormItem label="SSH端口">
              <InputNumber v-model:value="form.sshPort" :min="1" :max="65535" style="width:100%" />
            </FormItem>
            <FormItem label="SSH用户">
              <Input v-model:value="form.sshUser" />
            </FormItem>
          </div>
          <FormItem label="SSH密码">
            <Input.Password v-model:value="form.sshPassword" />
          </FormItem>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <FormItem label="角色">
              <Select v-model:value="form.role" :disabled="isCompleted">
                <SelectOption value="worker">Worker</SelectOption>
                <SelectOption v-if="!isCompleted" value="master">Master</SelectOption>
              </Select>
            </FormItem>
            <FormItem label="主机名（可选）">
              <Input v-model:value="form.hostname" />
            </FormItem>
          </div>
          <FormItem>
            <Space>
              <Button type="primary" @click="handleAdd" :loading="submitting">
                {{ isCompleted ? '添加并加入集群' : '添加节点' }}
              </Button>
              <Button @click="goBack">取消</Button>
            </Space>
          </FormItem>
        </Form>
      </Card>
    </Card>
  </div>
</template>
