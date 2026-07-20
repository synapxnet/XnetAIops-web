<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Form, FormItem, Input, Select, SelectOption, Button, Space, message } from 'ant-design-vue';
import { getNamespaces } from '../api/namespace';
import { installHelmRelease } from '../api/helm';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.query.clusterId);
const repoId = Number(route.query.repoId);
const chartName = route.query.chartName as string;
const chartVersion = route.query.chartVersion as string;

const namespaces = ref<string[]>([]);
const submitting = ref(false);
const formData = ref({
  releaseName: chartName || '',
  namespace: 'default',
  chartVersion: chartVersion || '',
  values: '',
});

async function fetchNamespaces() {
  try {
    const res = await getNamespaces(clusterId);
    namespaces.value = (Array.isArray(res) ? res : []).map((n: any) => n.name);
    if (namespaces.value.includes('default')) formData.value.namespace = 'default';
    else if (namespaces.value.length > 0) formData.value.namespace = namespaces.value[0]!;
  } catch { /* ignore */ }
}

async function handleInstall() {
  if (!formData.value.releaseName || !formData.value.namespace) {
    message.warning('请填写Release名称和命名空间');
    return;
  }
  submitting.value = true;
  try {
    await installHelmRelease(clusterId, {
      namespace: formData.value.namespace,
      releaseName: formData.value.releaseName,
      chartName,
      chartVersion: formData.value.chartVersion,
      repoId,
      values: formData.value.values || undefined,
    });
    message.success('应用部署成功');
    router.push('/K8S/appstore/releases?clusterId=' + clusterId);
  } catch (e: any) { message.error('部署失败: ' + e.message); }
  finally { submitting.value = false; }
}

function goBack() { router.back(); }
onMounted(fetchNamespaces);
</script>

<template>
  <div class="p-4">
    <Card :title="`部署应用 — ${chartName}`">
      <template #extra>
        <Button @click="goBack">返回</Button>
      </template>
      <Form layout="vertical" style="max-width:600px">
        <FormItem label="Chart">
          <Input :value="chartName" disabled />
        </FormItem>
        <FormItem label="Chart 版本">
          <Input v-model:value="formData.chartVersion" placeholder="Chart版本" />
        </FormItem>
        <FormItem label="Release 名称">
          <Input v-model:value="formData.releaseName" placeholder="Release名称（唯一标识）" />
        </FormItem>
        <FormItem label="命名空间">
          <Select v-model:value="formData.namespace" style="width:100%">
            <SelectOption v-for="ns in namespaces" :key="ns" :value="ns">{{ ns }}</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="自定义Values (YAML)">
          <Input.TextArea v-model:value="formData.values" :rows="12" placeholder="# 可选: 在此输入自定义values.yaml配置覆盖默认值" style="font-family:monospace;font-size:12px" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleInstall" :loading="submitting">部署</Button>
            <Button @click="goBack">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>
  </div>
</template>
