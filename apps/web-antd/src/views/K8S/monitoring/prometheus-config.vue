<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Select, SelectOption, Form, FormItem, Input, Button, Space, Tag, Alert, message } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getPrometheusConfig, savePrometheusConfig, testPrometheusConnection } from '../api/monitoring';
import type { K8sCluster } from '../api/types';

const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(null);
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

const form = ref({
  prometheusUrl: '',
  username: '',
  password: '',
});

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    const active = clusters.value.filter(c => c.status === 'active');
    if (active.length > 0) {
      selectedClusterId.value = active[0]!.id;
      fetchConfig();
    }
  } catch { message.error('获取集群列表失败'); }
}

async function fetchConfig() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  testResult.value = null;
  try {
    const res = await getPrometheusConfig(selectedClusterId.value);
    if (res) {
      form.value.prometheusUrl = res.prometheusUrl || '';
      form.value.username = res.username || '';
      form.value.password = res.password || '';
    } else {
      form.value = { prometheusUrl: '', username: '', password: '' };
    }
  } catch {
    form.value = { prometheusUrl: '', username: '', password: '' };
  } finally { loading.value = false; }
}

async function handleSave() {
  if (!selectedClusterId.value) return;
  if (!form.value.prometheusUrl) { message.warning('请输入Prometheus地址'); return; }
  saving.value = true;
  try {
    await savePrometheusConfig(selectedClusterId.value, form.value);
    message.success('配置已保存');
  } catch (e: any) { message.error('保存失败: ' + e.message); }
  finally { saving.value = false; }
}

async function handleTest() {
  if (!selectedClusterId.value) return;
  if (!form.value.prometheusUrl) { message.warning('请先输入Prometheus地址'); return; }
  testing.value = true;
  testResult.value = null;
  try {
    const res = await testPrometheusConnection(selectedClusterId.value);
    testResult.value = { success: !!res, message: res ? '连接成功' : '连接失败' };
  } catch (e: any) {
    testResult.value = { success: false, message: '连接失败: ' + e.message };
  } finally { testing.value = false; }
}

function onClusterChange(v: number) {
  selectedClusterId.value = v;
  fetchConfig();
}

onMounted(fetchClusters);
</script>

<template>
  <div class="p-4">
    <Card title="Prometheus 监控配置">
      <template #extra>
        <Select :value="selectedClusterId" style="width: 180px;" @change="onClusterChange" placeholder="选择集群">
          <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
        </Select>
      </template>

      <Alert
        message="监控配置说明"
        description="配置Prometheus地址后，集群状态监控、节点监控、ETCD监控、API Server监控等功能才能正常使用。请确保Prometheus可以从本服务端访问。"
        type="info"
        show-icon
        class="mb-4"
      />

      <Form layout="vertical" style="max-width: 600px;" :disabled="loading">
        <FormItem label="Prometheus地址" required>
          <Input v-model:value="form.prometheusUrl" placeholder="http://prometheus.example.com:9090" />
          <div style="font-size: 12px; color: #8c8c8c; margin-top: 4px;">
            例: http://127.0.0.1:9090 或 http://prometheus.monitoring.svc:9090
          </div>
        </FormItem>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <FormItem label="用户名（可选）">
            <Input v-model:value="form.username" placeholder="Basic Auth用户名" />
          </FormItem>
          <FormItem label="密码（可选）">
            <Input.Password v-model:value="form.password" placeholder="Basic Auth密码" />
          </FormItem>
        </div>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSave" :loading="saving">保存配置</Button>
            <Button @click="handleTest" :loading="testing">测试连接</Button>
          </Space>
        </FormItem>
      </Form>

      <div v-if="testResult" style="margin-top: 16px;">
        <Tag :color="testResult.success ? 'green' : 'red'" style="font-size: 14px; padding: 4px 12px;">
          {{ testResult.message }}
        </Tag>
      </div>
    </Card>
  </div>
</template>
