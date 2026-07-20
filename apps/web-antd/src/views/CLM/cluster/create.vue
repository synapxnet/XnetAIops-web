<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Form, FormItem, Input, Select, Button, message } from 'ant-design-vue';
import { createCluster } from '../api/cluster';

const router = useRouter();
const submitting = ref(false);

const form = reactive({
  clusterName: '',
  clusterCode: '',
  description: '',
  clusterType: 'hadoop',
});

const clusterTypes = [
  { label: 'Hadoop', value: 'hadoop' },
  { label: 'Kubernetes', value: 'k8s' },
  { label: '自定义', value: 'custom' },
];

async function handleSubmit() {
  if (!form.clusterName || !form.clusterCode) {
    message.warning('请填写集群名称和编码');
    return;
  }
  submitting.value = true;
  try {
    await createCluster(form);
    message.success('集群创建成功');
    router.push('/CLM/cluster/list');
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push('/CLM/cluster/list');
}
</script>

<template>
  <div class="p-4">
    <Card title="创建集群">
      <Form layout="vertical" :model="form" style="max-width: 600px">
        <FormItem label="集群名称" required>
          <Input v-model:value="form.clusterName" placeholder="请输入集群名称" />
        </FormItem>
        <FormItem label="集群编码" required>
          <Input v-model:value="form.clusterCode" placeholder="请输入集群编码（唯一标识）" />
        </FormItem>
        <FormItem label="集群类型">
          <Select v-model:value="form.clusterType" :options="clusterTypes" />
        </FormItem>
        <FormItem label="描述">
          <Input.TextArea v-model:value="form.description" placeholder="请输入集群描述" :rows="3" />
        </FormItem>
        <FormItem>
          <Button type="primary" :loading="submitting" @click="handleSubmit" style="margin-right: 12px">
            创建
          </Button>
          <Button @click="goBack">取消</Button>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
