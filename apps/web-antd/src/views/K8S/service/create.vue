<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Card, Form, FormItem, Button, Space, Alert, message } from 'ant-design-vue';
import { createService } from '../api/service';
import YamlEditor from '../components/YamlEditor.vue';

const router = useRouter();
const route = useRoute();
const clusterId = Number(route.query.clusterId);
const namespace = (route.query.namespace as string) || 'default';
const submitting = ref(false);

const form = ref({
  yaml: `apiVersion: v1
kind: Service
metadata:
  name: my-service
  namespace: ${namespace}
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP`,
});

async function handleSubmit() {
  if (!form.value.yaml.trim()) { message.warning('请输入YAML内容'); return; }
  submitting.value = true;
  try {
    await createService(clusterId, namespace, form.value.yaml);
    message.success('创建成功');
    router.push(`/K8S/service/list?clusterId=${clusterId}&namespace=${namespace}`);
  } catch (e: any) { message.error('创建失败: ' + e.message); }
  finally { submitting.value = false; }
}

function goBack() { router.push('/K8S/service/list'); }
</script>

<template>
  <div class="p-4">
    <Card title="创建 Service">
      <template #extra><Button @click="goBack">返回</Button></template>
      <Alert type="info" message="请填写YAML格式的Service定义" show-icon class="mb-4" style="max-width:900px" />
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
