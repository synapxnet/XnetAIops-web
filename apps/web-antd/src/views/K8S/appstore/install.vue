<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Alert,
  Card,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Button,
  Space,
  message,
} from 'ant-design-vue';
import { getNamespaces } from '../api/namespace';
import { installHelmRelease } from '../api/helm';

const route = useRoute();
const router = useRouter();
const clusterId = Number(route.query.clusterId);
const repoId =
  route.query.repoId === undefined ? undefined : Number(route.query.repoId);
const chartName =
  typeof route.query.chartName === 'string' ? route.query.chartName : '';
const chartVersion =
  typeof route.query.chartVersion === 'string' ? route.query.chartVersion : '';
/** 直达页面必须携带有效的资源参数。Direct navigation requires valid resource parameters. */
const validContext = computed(
  () =>
    typeof route.query.clusterId === 'string' &&
    Number.isSafeInteger(clusterId) &&
    clusterId > 0 &&
    (repoId === undefined ||
      (typeof route.query.repoId === 'string' &&
        Number.isSafeInteger(repoId) &&
        repoId > 0)) &&
    Boolean(chartName.trim()),
);
const namespaceError = ref('');

const namespaces = ref<string[]>([]);
const submitting = ref(false);
const formData = ref({
  releaseName: chartName || '',
  namespace: '',
  chartVersion: chartVersion || '',
  values: '',
});

/** 只加载有效集群的命名空间，失败时不假定default存在。Load namespaces only for a valid cluster without assuming default exists on failure. */
async function fetchNamespaces() {
  if (!validContext.value) return;
  namespaceError.value = '';
  namespaces.value = [];
  formData.value.namespace = '';
  try {
    const res = await getNamespaces(clusterId);
    namespaces.value = (Array.isArray(res) ? res : []).map((n: any) => n.name);
    if (namespaces.value.includes('default'))
      formData.value.namespace = 'default';
    else if (namespaces.value.length > 0)
      formData.value.namespace = namespaces.value[0]!;
  } catch {
    namespaces.value = [];
    namespaceError.value = '无法取得命名空间，请重试后再部署。';
  }
}

/** 参数和命名空间通过校验后才发送原生部署请求。Send native deployment requests only after context and namespace validation. */
async function handleInstall() {
  if (submitting.value) return;
  if (!validContext.value) {
    message.warning('部署来源不完整，请返回应用目录重新选择。');
    return;
  }
  if (
    !formData.value.releaseName.trim() ||
    !namespaces.value.includes(formData.value.namespace)
  ) {
    message.warning('请填写Release名称和命名空间');
    return;
  }
  submitting.value = true;
  try {
    await installHelmRelease(clusterId, {
      namespace: formData.value.namespace,
      releaseName: formData.value.releaseName.trim(),
      chartName,
      chartVersion: formData.value.chartVersion,
      repoId,
      values: formData.value.values || undefined,
    });
    message.success('应用部署成功');
    router.push('/K8S/appstore/releases?clusterId=' + clusterId);
  } catch (e: any) {
    message.error('部署失败: ' + e.message);
  } finally {
    submitting.value = false;
  }
}

/** 始终返回应用目录，直接打开页面也可安全导航。Always return to the application catalog, including direct page visits. */
function goBack() {
  router.push('/K8S/appstore/index');
}
onMounted(fetchNamespaces);
</script>

<template>
  <BusinessPage
    title="部署应用"
    description="按步骤填写必要参数；提交状态以服务端实际回执为准。"
    family="表单"
    route-key="/K8S/appstore/install"
  >
    <div class="p-4">
      <Card :title="chartName ? '部署应用 — ' + chartName : '选择部署来源'">
        <template #extra>
          <Button @click="goBack">返回应用目录</Button>
        </template>
        <Alert
          v-if="!validContext"
          type="info"
          show-icon
          message="请先选择部署应用"
          description="从应用目录选择一个应用后再进入部署页面。"
        />
        <Alert
          v-if="namespaceError"
          type="error"
          show-icon
          :message="namespaceError"
          ><template #action
            ><Button size="small" @click="fetchNamespaces"
              >重试</Button
            ></template
          ></Alert
        >
        <Form v-if="validContext" layout="vertical" style="max-width: 600px">
          <FormItem label="Chart">
            <Input :value="chartName" disabled />
          </FormItem>
          <FormItem label="Chart 版本">
            <Input
              v-model:value="formData.chartVersion"
              placeholder="Chart版本"
            />
          </FormItem>
          <FormItem label="Release 名称">
            <Input
              v-model:value="formData.releaseName"
              placeholder="Release名称（唯一标识）"
            />
          </FormItem>
          <FormItem label="命名空间">
            <Select v-model:value="formData.namespace" style="width: 100%">
              <SelectOption v-for="ns in namespaces" :key="ns" :value="ns">{{
                ns
              }}</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="自定义Values (YAML)">
            <Input.TextArea
              v-model:value="formData.values"
              :rows="12"
              placeholder="# 可选: 在此输入自定义values.yaml配置覆盖默认值"
              style="font-family: monospace; font-size: 12px"
            />
          </FormItem>
          <FormItem>
            <Space>
              <Button
                type="primary"
                @click="handleInstall"
                :loading="submitting"
                :disabled="!namespaces.length"
                >部署</Button
              >
              <Button @click="goBack">取消</Button>
            </Space>
          </FormItem>
        </Form>
      </Card>
    </div>
  </BusinessPage>
</template>
