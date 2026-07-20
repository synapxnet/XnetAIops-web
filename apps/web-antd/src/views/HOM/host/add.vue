<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Card, Form, FormItem, Input, InputNumber, Select, Button, Alert, Descriptions, DescriptionsItem, message,
} from 'ant-design-vue';
import { createHost, testSshConnection } from '../api/host';
import { getClusters } from '../../CLM/api/cluster';
import type { Cluster } from '../../CLM/api/types';

const router = useRouter();
const submitting = ref(false);
const testing = ref(false);
const testResult = ref<any>(null);
const clusters = ref<Cluster[]>([]);

const form = reactive({
  clusterId: undefined as number | undefined,
  hostname: '',
  ipAddress: '',
  sshPort: 22,
  sshUser: 'root',
  authType: 'password',
  password: '',
  rack: '',
  nodeLabel: '',
});

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : (res as any)?.data || [];
  } catch (e: any) {
    message.error('获取集群列表失败');
  }
}

async function handleTestConnection() {
  if (!form.ipAddress) {
    message.warning('请先填写IP地址');
    return;
  }
  testing.value = true;
  testResult.value = null;
  try {
    const res = await testSshConnection({
      host: form.ipAddress,
      port: form.sshPort,
      user: form.sshUser,
      password: form.password,
    });
    testResult.value = (res as any)?.data || res;
    if (testResult.value?.success) {
      message.success('连接成功');
      if (!form.hostname && form.ipAddress) {
        form.hostname = form.ipAddress;
      }
    } else {
      message.error(testResult.value?.message || '连接失败');
    }
  } catch (e: any) {
    message.error('连接测试失败: ' + e.message);
  } finally {
    testing.value = false;
  }
}

async function handleSubmit() {
  if (!form.clusterId || !form.ipAddress || !form.hostname) {
    message.warning('请填写必要字段');
    return;
  }
  submitting.value = true;
  try {
    await createHost({
      clusterId: form.clusterId,
      hostname: form.hostname,
      ipAddress: form.ipAddress,
      sshPort: form.sshPort,
      sshUser: form.sshUser,
      authType: form.authType,
      encryptedPassword: form.password,
      rack: form.rack,
      nodeLabel: form.nodeLabel,
    });
    message.success('主机添加成功');
    router.push('/HOM/host/list');
  } catch (e: any) {
    message.error('添加失败: ' + e.message);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push('/HOM/host/list');
}

onMounted(() => {
  fetchClusters();
});
</script>

<template>
  <div class="p-4">
    <Card title="添加主机">
      <Form layout="vertical" :model="form" style="max-width: 700px">
        <FormItem label="所属集群" required>
          <Select
            v-model:value="form.clusterId"
            placeholder="请选择集群"
            :options="clusters.map(c => ({ label: c.clusterName, value: c.id }))"
          />
        </FormItem>
        <FormItem label="IP地址" required>
          <Input v-model:value="form.ipAddress" placeholder="127.0.0.1" />
        </FormItem>
        <FormItem label="主机名">
          <Input v-model:value="form.hostname" placeholder="主机名（可通过SSH测试自动获取）" />
        </FormItem>
        <div style="display: flex; gap: 16px">
          <FormItem label="SSH端口" style="width: 120px">
            <InputNumber v-model:value="form.sshPort" :min="1" :max="65535" />
          </FormItem>
          <FormItem label="SSH用户" style="flex: 1">
            <Input v-model:value="form.sshUser" placeholder="root" />
          </FormItem>
        </div>
        <FormItem label="密码">
          <Input.Password v-model:value="form.password" placeholder="SSH密码" />
        </FormItem>
        <FormItem>
          <Button :loading="testing" @click="handleTestConnection" style="margin-right: 12px">
            测试连接
          </Button>
        </FormItem>

        <Alert
          v-if="testResult?.success"
          type="success"
          show-icon
          style="margin-bottom: 16px"
        >
          <template #message>连接成功</template>
          <template #description>
            <Descriptions size="small" :column="2" bordered>
              <DescriptionsItem label="操作系统">{{ testResult.osInfo || '-' }}</DescriptionsItem>
              <DescriptionsItem label="CPU架构">{{ testResult.cpuArch || '-' }}</DescriptionsItem>
              <DescriptionsItem label="CPU核数">{{ testResult.cpuCores || '-' }}</DescriptionsItem>
              <DescriptionsItem label="内存(GB)">{{ testResult.totalMemGb || '-' }}</DescriptionsItem>
              <DescriptionsItem label="磁盘(GB)">{{ testResult.totalDiskGb || '-' }}</DescriptionsItem>
            </Descriptions>
          </template>
        </Alert>

        <div style="display: flex; gap: 16px">
          <FormItem label="机架" style="flex: 1">
            <Input v-model:value="form.rack" placeholder="如: /rack1" />
          </FormItem>
          <FormItem label="节点标签" style="flex: 1">
            <Input v-model:value="form.nodeLabel" placeholder="如: worker" />
          </FormItem>
        </div>

        <FormItem>
          <Button type="primary" :loading="submitting" @click="handleSubmit" style="margin-right: 12px">
            添加主机
          </Button>
          <Button @click="goBack">取消</Button>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
