<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Card, Form, FormItem, Textarea, Button, Space, Alert, message } from 'ant-design-vue';
import { createPVC } from '../api/storage';

const router = useRouter();
const route = useRoute();
const clusterId = Number(route.query.clusterId);
const namespace = (route.query.namespace as string) || 'default';
const submitting = ref(false);

const form = ref({
  yaml: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
  namespace: ${namespace}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: standard`,
});

async function handleSubmit() {
  if (!form.value.yaml.trim()) { message.warning('请输入YAML'); return; }
  submitting.value = true;
  try {
    await createPVC(clusterId, namespace, form.value.yaml);
    message.success('创建成功');
    router.push('/K8S/storage/pvc-list');
  } catch (e: any) { message.error('创建失败: ' + e.message); }
  finally { submitting.value = false; }
}

function goBack() { router.push('/K8S/storage/pvc-list'); }
</script>

<template>
  <div class="p-4">
    <Card title="创建 PVC">
      <template #extra><Button @click="goBack">返回</Button></template>
      <Alert type="info" message="请填写YAML格式的PVC定义" show-icon class="mb-4" style="max-width:900px" />
      <Form layout="vertical" :model="form" style="max-width:900px">
        <FormItem label="YAML定义" required>
          <Textarea v-model:value="form.yaml" :rows="14" style="font-family:monospace;font-size:12px" />
        </FormItem>
        <FormItem><Space><Button type="primary" :loading="submitting" @click="handleSubmit">创建</Button><Button @click="goBack">取消</Button></Space></FormItem>
      </Form>
    </Card>
  </div>
</template>
