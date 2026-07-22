<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card, Form, FormItem, Input, Select, SelectOption,
  Button, Space, Descriptions, DescriptionsItem, Tag, Alert, message, Spin,
} from 'ant-design-vue';
import { getAppTemplate, installAppTemplate } from '../api/helm';
import { getClusters } from '../api/cluster';
import { getNamespaces } from '../api/namespace';
import YamlEditor from '../components/YamlEditor.vue';
import type { K8sCluster } from '../api/types';

const route = useRoute();
const router = useRouter();
const templateId = Number(route.query.templateId);

const template = ref<any>(null);
const clusters = ref<K8sCluster[]>([]);
const namespaces = ref<string[]>([]);
const loadingTemplate = ref(true);
const submitting = ref(false);

const formData = ref({
  clusterId: null as number | null,
  namespace: 'default',
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

async function fetchTemplate() {
  loadingTemplate.value = true;
  try {
    const res = await getAppTemplate(templateId);
    template.value = res;
    if (res) {
      formData.value.releaseName = res.name || '';
      formData.value.values = res.defaultValues || '';
    }
  } catch { message.error('获取模板详情失败'); }
  finally { loadingTemplate.value = false; }
}

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = (Array.isArray(res) ? res : []).filter((c: K8sCluster) => c.status === 'active');
    if (clusters.value.length > 0) {
      formData.value.clusterId = clusters.value[0]!.id;
      fetchNamespaces();
    }
  } catch { /* ignore */ }
}

async function fetchNamespaces() {
  if (!formData.value.clusterId) return;
  try {
    const res = await getNamespaces(formData.value.clusterId);
    namespaces.value = (Array.isArray(res) ? res : []).map((n: any) => n.name);
    if (namespaces.value.includes('default')) formData.value.namespace = 'default';
    else if (namespaces.value.length > 0) formData.value.namespace = namespaces.value[0]!;
  } catch { /* ignore */ }
}

async function handleInstall() {
  if (!formData.value.clusterId) {
    message.warning('请选择集群');
    return;
  }
  if (!formData.value.releaseName || !formData.value.namespace) {
    message.warning('请填写Release名称和命名空间');
    return;
  }
  submitting.value = true;
  try {
    await installAppTemplate(templateId, {
      clusterId: formData.value.clusterId,
      namespace: formData.value.namespace,
      releaseName: formData.value.releaseName,
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

function goBack() { router.push('/K8S/appstore/index'); }

onMounted(() => {
  fetchTemplate();
  fetchClusters();
});
</script>

<template>
  <div class="p-4">
    <Spin :spinning="loadingTemplate">
      <Card>
        <template #title>
          <div style="display:flex;align-items:center;gap:12px">
            <Button @click="goBack" size="small">返回</Button>
            <span>一键部署</span>
            <template v-if="template">
              <span style="font-weight:700;font-size:18px">{{ template.displayName }}</span>
              <Tag :color="
                template.category === 'database' ? 'blue' :
                template.category === 'middleware' ? 'orange' :
                template.category === 'messaging' ? 'purple' :
                template.category === 'storage' ? 'cyan' :
                template.category === 'devops' ? 'green' :
                template.category === 'monitoring' ? 'red' : 'default'
              ">{{ categoryLabels[template.category] || template.category }}</Tag>
            </template>
          </div>
        </template>

        <!-- Template Info -->
        <div v-if="template" style="margin-bottom:24px">
          <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px">
            <div style="width:64px;height:64px;border-radius:12px;background:hsl(var(--primary) / 10%);display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <img v-if="template.icon" :src="template.icon" style="width:48px;height:48px;object-fit:contain" />
              <span v-else style="font-size:28px;color:#1890ff;font-weight:bold">{{ (template.displayName || '?')[0] }}</span>
            </div>
            <div>
              <p class="text-muted-foreground m-0 text-sm">{{ template.description }}</p>
              <div style="margin-top:8px">
                <Descriptions size="small" :column="3" bordered>
                  <DescriptionsItem label="Chart">{{ template.helmRepoName }}/{{ template.chartName }}</DescriptionsItem>
                  <DescriptionsItem label="推荐版本">{{ template.chartVersion || 'latest' }}</DescriptionsItem>
                  <DescriptionsItem label="文档">
                    <a v-if="template.docUrl" :href="template.docUrl" target="_blank" rel="noopener">查看文档</a>
                    <span v-else>-</span>
                  </DescriptionsItem>
                </Descriptions>
              </div>
            </div>
          </div>

          <Alert type="info" showIcon message="请确保目标集群已配置SSH连接信息，且master节点上已安装helm CLI工具。" style="margin-bottom:16px" />
        </div>

        <!-- Install Form -->
        <Form layout="vertical" style="max-width:800px">
          <FormItem label="目标集群" required>
            <Select v-model:value="formData.clusterId" style="width:100%" placeholder="选择集群" @change="fetchNamespaces">
              <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
            </Select>
          </FormItem>

          <FormItem label="命名空间" required>
            <Select v-model:value="formData.namespace" style="width:100%" placeholder="选择或输入命名空间" showSearch>
              <SelectOption v-for="ns in namespaces" :key="ns" :value="ns">{{ ns }}</SelectOption>
            </Select>
          </FormItem>

          <FormItem label="Release 名称" required>
            <Input v-model:value="formData.releaseName" placeholder="Release名称（在命名空间内唯一）" />
          </FormItem>

          <FormItem label="Values 配置 (YAML)">
            <div style="border:1px solid hsl(var(--border));border-radius:6px;overflow:hidden">
              <YamlEditor v-model="formData.values" height="350px" placeholder="# 自定义 values.yaml 配置" />
            </div>
            <div style="font-size:12px;color:#8c8c8c;margin-top:4px">
              以上为模板预设的默认配置，您可以根据需要修改
            </div>
          </FormItem>

          <FormItem>
            <Space>
              <Button type="primary" @click="handleInstall" :loading="submitting" size="large">
                一键部署
              </Button>
              <Button @click="goBack" size="large">取消</Button>
            </Space>
          </FormItem>
        </Form>
      </Card>
    </Spin>
  </div>
</template>
