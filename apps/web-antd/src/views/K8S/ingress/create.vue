<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Card, Form, FormItem, Button, Space, Alert, message } from 'ant-design-vue';
import { createIngress } from '../api/ingress';
import YamlEditor from '../components/YamlEditor.vue';

const router = useRouter();
const route = useRoute();
const clusterId = Number(route.query.clusterId);
const namespace = (route.query.namespace as string) || 'default';
const submitting = ref(false);

const form = ref({
  yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  namespace: ${namespace}
spec:
  ingressClassName: nginx
  rules:
    - host: example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-service
                port:
                  number: 80`,
});

async function handleSubmit() {
  if (!form.value.yaml.trim()) { message.warning('请输入YAML内容'); return; }
  submitting.value = true;
  try {
    await createIngress(clusterId, namespace, form.value.yaml);
    message.success('创建成功');
    router.push('/K8S/ingress/list');
  } catch (e: any) { message.error('创建失败: ' + e.message); }
  finally { submitting.value = false; }
}

function goBack() { router.push('/K8S/ingress/list'); }
</script>

<template>
  <div class="p-4">
    <Card title="创建 Ingress">
      <template #extra><Button @click="goBack">返回</Button></template>
      <Alert type="info" message="请填写YAML格式的Ingress定义" show-icon class="mb-4" style="max-width:900px" />
      <Form layout="vertical" :model="form" style="max-width:900px">
        <FormItem label="YAML定义" required>
          <YamlEditor v-model="form.yaml" height="400px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" :loading="submitting" @click="handleSubmit">创建</Button>
            <Button @click="goBack">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
