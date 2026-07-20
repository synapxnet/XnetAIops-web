<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Card,
  Form,
  FormItem,
  Button,
  Space,
  Alert,
  message,
} from 'ant-design-vue';
import {
  createDeployment, createStatefulSet, createDaemonSet,
} from '../api/workload';
import YamlEditor from '../components/YamlEditor.vue';

const router = useRouter();
const route = useRoute();
const clusterId = Number(route.query.clusterId);
const namespace = route.query.namespace as string || 'default';
const kind = (route.query.kind as string || 'deployment').toLowerCase();
const submitting = ref(false);

const kindLabel: Record<string, string> = {
  deployment: 'Deployment',
  statefulset: 'StatefulSet',
  daemonset: 'DaemonSet',
};

const yamlTemplates: Record<string, string> = {
  deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-deployment
  namespace: ${namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-container
          image: nginx:latest
          ports:
            - containerPort: 80`,
  statefulset: `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: my-statefulset
  namespace: ${namespace}
spec:
  serviceName: my-statefulset
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-container
          image: nginx:latest
          ports:
            - containerPort: 80`,
  daemonset: `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: my-daemonset
  namespace: ${namespace}
spec:
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-container
          image: nginx:latest`,
};

const form = ref({
  yaml: yamlTemplates[kind] || yamlTemplates.deployment,
});

async function handleSubmit() {
  if (!form.value.yaml.trim()) {
    message.warning('请输入YAML内容');
    return;
  }
  submitting.value = true;
  try {
    if (kind === 'deployment') {
      await createDeployment(clusterId, namespace, form.value.yaml);
    } else if (kind === 'statefulset') {
      await createStatefulSet(clusterId, namespace, form.value.yaml);
    } else if (kind === 'daemonset') {
      await createDaemonSet(clusterId, namespace, form.value.yaml);
    }
    message.success('创建成功');
    router.push(`/K8S/workload/list?clusterId=${clusterId}&namespace=${namespace}`);
  } catch (e: any) {
    message.error('创建失败: ' + e.message);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push(`/K8S/workload/list?clusterId=${clusterId}&namespace=${namespace}`);
}
</script>

<template>
  <div class="p-4">
    <Card :title="`创建 ${kindLabel[kind] || 'Deployment'}`">
      <template #extra>
        <Button @click="goBack">返回</Button>
      </template>

      <Alert
        type="info"
        message="请填写YAML格式的资源定义，也可以直接修改下方模板"
        show-icon
        class="mb-4"
        style="max-width: 900px;"
      />

      <Form layout="vertical" :model="form" style="max-width: 900px;">
        <FormItem label="YAML定义" required>
          <YamlEditor v-model="form.yaml" height="500px" />
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
