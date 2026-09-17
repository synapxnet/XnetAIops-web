<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Button,
  Space,
  Descriptions,
  DescriptionsItem,
  Tag,
  Alert,
  message,
  Spin,
} from 'ant-design-vue';
import { getAppTemplate, installAppTemplate } from '../api/helm';
import { getClusters } from '../api/cluster';
import { getNamespaces } from '../api/namespace';
import YamlEditor from '../components/YamlEditor.vue';
import type { K8sCluster } from '../api/types';

const route = useRoute();
const router = useRouter();
const templateId = Number(route.query.templateId);
/** 模板部署入口必须携带有效模板编号。Template deployment requires a valid template identifier. */
const validContext =
  typeof route.query.templateId === 'string' &&
  Number.isSafeInteger(templateId) &&
  templateId > 0;

const template = ref<any>(null);
const clusters = ref<K8sCluster[]>([]);
const namespaces = ref<string[]>([]);
const loadingTemplate = ref(false);
const submitting = ref(false);
const templateError = ref('');
const clusterError = ref('');
const namespaceError = ref('');
let namespaceRequest = 0;

const formData = ref({
  clusterId: null as number | null,
  namespace: '',
  releaseName: '',
  values: '',
});

const categoryLabels: Record<string, string> = {
  database: '数据库',
  middleware: '中间件',
  messaging: '消息队列',
  storage: '存储',
  devops: 'DevOps',
  monitoring: '监控',
};

/** 有效入口才读取模板，读取失败时停止部署。Load templates only for valid context and block deployment on failure. */
async function fetchTemplate() {
  if (!validContext) return;
  loadingTemplate.value = true;
  templateError.value = '';
  try {
    const res = await getAppTemplate(templateId);
    template.value = res;
    if (res) {
      formData.value.releaseName = res.name || '';
      formData.value.values = res.defaultValues || '';
    } else templateError.value = '当前模板已不可用，请返回应用目录重新选择。';
  } catch {
    template.value = null;
    templateError.value = '暂时无法读取模板，请重试。';
  } finally {
    loadingTemplate.value = false;
  }
}

/** 从实际可用集群加载部署目标。Load deployment targets from available clusters. */
async function fetchClusters() {
  if (!validContext) return;
  clusterError.value = '';
  try {
    const res = await getClusters();
    clusters.value = (Array.isArray(res) ? res : []).filter(
      (c: K8sCluster) => c.status === 'active',
    );
    if (clusters.value.length > 0) {
      formData.value.clusterId = clusters.value[0]!.id;
      fetchNamespaces();
    }
  } catch {
    clusters.value = [];
    formData.value.clusterId = null;
    namespaces.value = [];
    formData.value.namespace = '';
    clusterError.value = '暂时无法读取集群，请重试。';
  }
}

/** 切换集群时清空旧命名空间并忽略迟到响应。Clear namespaces on cluster change and ignore stale responses. */
async function fetchNamespaces() {
  const requestId = ++namespaceRequest;
  const selectedCluster = formData.value.clusterId;
  namespaces.value = [];
  formData.value.namespace = '';
  namespaceError.value = '';
  if (
    !validContext ||
    !selectedCluster ||
    !clusters.value.some((c) => c.id === selectedCluster)
  )
    return;
  try {
    const res = await getNamespaces(selectedCluster);
    if (
      requestId !== namespaceRequest ||
      selectedCluster !== formData.value.clusterId
    )
      return;
    namespaces.value = (Array.isArray(res) ? res : []).map((n: any) => n.name);
    if (namespaces.value.includes('default'))
      formData.value.namespace = 'default';
    else if (namespaces.value.length > 0)
      formData.value.namespace = namespaces.value[0]!;
  } catch {
    if (
      requestId === namespaceRequest &&
      selectedCluster === formData.value.clusterId
    )
      namespaceError.value = '暂时无法读取命名空间，请重试后再部署。';
  }
}

/** 只提交已加载模板、实际集群和命名空间。Submit only a loaded template with a real cluster and namespace. */
async function handleInstall() {
  if (submitting.value) return;
  if (!validContext || !template.value || loadingTemplate.value) return;
  if (
    !formData.value.clusterId ||
    !clusters.value.some((c) => c.id === formData.value.clusterId)
  ) {
    message.warning('请选择集群');
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
    await installAppTemplate(templateId, {
      clusterId: formData.value.clusterId,
      namespace: formData.value.namespace,
      releaseName: formData.value.releaseName.trim(),
      values: formData.value.values || undefined,
    });
    message.success('应用部署请求已提交');
    router.push('/K8S/appstore/releases?clusterId=' + formData.value.clusterId);
  } catch (e: any) {
    message.error('部署失败: ' + (e.message || '未知错误'));
  } finally {
    submitting.value = false;
  }
}

/** 返回应用目录以重新选择模板。Return to the catalog to choose a template. */
function goBack() {
  router.push('/K8S/appstore/index');
}

/** 只为有效模板入口初始化数据。Initialize data only for a valid template entry. */
onMounted(() => {
  if (!validContext) return;
  fetchTemplate();
  fetchClusters();
});
</script>

<template>
  <BusinessPage
    title="模板部署"
    description="按步骤填写必要参数；提交状态以服务端实际回执为准。"
    family="表单"
    route-key="/K8S/appstore/template-install"
  >
    <div class="p-4">
      <Spin :spinning="loadingTemplate">
        <Card>
          <template #title>
            <div style="display: flex; align-items: center; gap: 12px">
              <Button @click="goBack" size="small">返回应用目录</Button>
              <span>一键部署</span>
              <template v-if="template">
                <span style="font-weight: 700; font-size: 18px">{{
                  template.displayName
                }}</span>
                <Tag
                  :color="
                    template.category === 'database'
                      ? 'blue'
                      : template.category === 'middleware'
                        ? 'orange'
                        : template.category === 'messaging'
                          ? 'purple'
                          : template.category === 'storage'
                            ? 'cyan'
                            : template.category === 'devops'
                              ? 'green'
                              : template.category === 'monitoring'
                                ? 'red'
                                : 'default'
                  "
                  >{{
                    categoryLabels[template.category] || template.category
                  }}</Tag
                >
              </template>
            </div>
          </template>

          <Alert
            v-if="!validContext"
            type="info"
            show-icon
            message="请先从应用目录选择模板"
          />
          <Alert
            v-else-if="templateError"
            type="warning"
            show-icon
            :message="templateError"
          >
            <template #action
              ><Button @click="fetchTemplate">重试</Button></template
            >
          </Alert>

          <!-- 模板信息。Template information. -->
          <div v-if="template" style="margin-bottom: 24px">
            <div
              style="
                display: flex;
                align-items: flex-start;
                gap: 16px;
                margin-bottom: 16px;
              "
            >
              <div
                style="
                  width: 64px;
                  height: 64px;
                  border-radius: 12px;
                  background: hsl(var(--primary) / 10%);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                "
              >
                <img
                  v-if="template.icon"
                  :src="template.icon"
                  style="width: 48px; height: 48px; object-fit: contain"
                />
                <span
                  v-else
                  style="font-size: 28px; color: #1890ff; font-weight: bold"
                  >{{ (template.displayName || '?')[0] }}</span
                >
              </div>
              <div>
                <p class="text-muted-foreground m-0 text-sm">
                  {{ template.description }}
                </p>
                <div style="margin-top: 8px">
                  <Descriptions size="small" :column="3" bordered>
                    <DescriptionsItem label="Chart"
                      >{{ template.helmRepoName }}/{{
                        template.chartName
                      }}</DescriptionsItem
                    >
                    <DescriptionsItem label="推荐版本">{{
                      template.chartVersion || 'latest'
                    }}</DescriptionsItem>
                    <DescriptionsItem label="文档">
                      <a
                        v-if="template.docUrl"
                        :href="template.docUrl"
                        target="_blank"
                        rel="noopener"
                        >查看文档</a
                      >
                      <span v-else>-</span>
                    </DescriptionsItem>
                  </Descriptions>
                </div>
              </div>
            </div>

            <Alert
              type="info"
              showIcon
              message="请确保目标集群已配置SSH连接信息，且master节点上已安装helm CLI工具。"
              style="margin-bottom: 16px"
            />
          </div>

          <!-- 部署表单。Deployment form. -->
          <Form
            v-if="validContext && template"
            layout="vertical"
            style="max-width: 800px"
          >
            <Alert
              v-if="clusterError"
              type="warning"
              show-icon
              :message="clusterError"
            >
              <template #action
                ><Button @click="fetchClusters">重试</Button></template
              >
            </Alert>
            <Alert
              v-if="namespaceError"
              type="warning"
              show-icon
              :message="namespaceError"
            >
              <template #action
                ><Button @click="fetchNamespaces">重试</Button></template
              >
            </Alert>
            <FormItem label="目标集群" required>
              <Select
                v-model:value="formData.clusterId"
                style="width: 100%"
                placeholder="选择集群"
                @change="fetchNamespaces"
              >
                <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{
                  c.name
                }}</SelectOption>
              </Select>
            </FormItem>

            <FormItem label="命名空间" required>
              <Select
                v-model:value="formData.namespace"
                style="width: 100%"
                placeholder="选择命名空间"
                showSearch
              >
                <SelectOption v-for="ns in namespaces" :key="ns" :value="ns">{{
                  ns
                }}</SelectOption>
              </Select>
            </FormItem>

            <FormItem label="Release 名称" required>
              <Input
                v-model:value="formData.releaseName"
                placeholder="Release名称（在命名空间内唯一）"
              />
            </FormItem>

            <FormItem label="Values 配置 (YAML)">
              <div
                style="
                  border: 1px solid hsl(var(--border));
                  border-radius: 6px;
                  overflow: hidden;
                "
              >
                <YamlEditor
                  v-model="formData.values"
                  height="350px"
                  placeholder="# 自定义 values.yaml 配置"
                />
              </div>
              <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px">
                以上为模板预设的默认配置，您可以根据需要修改
              </div>
            </FormItem>

            <FormItem>
              <Space>
                <Button
                  type="primary"
                  @click="handleInstall"
                  :loading="submitting"
                  :disabled="!namespaces.length || loadingTemplate"
                  size="large"
                >
                  一键部署
                </Button>
                <Button @click="goBack" size="large">取消</Button>
              </Space>
            </FormItem>
          </Form>
        </Card>
      </Spin>
    </div>
  </BusinessPage>
</template>
