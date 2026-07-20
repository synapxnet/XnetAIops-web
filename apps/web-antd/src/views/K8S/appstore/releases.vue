<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Card, Table, Tag, Space, Button, Select, SelectOption, Modal, Input, InputNumber, message } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getHelmReleases, uninstallHelmRelease, upgradeHelmRelease, rollbackHelmRelease } from '../api/helm';
import YamlEditor from '../components/YamlEditor.vue';
import type { K8sCluster } from '../api/types';

const route = useRoute();
const clusters = ref<K8sCluster[]>([]);
const selectedClusterId = ref<number | null>(route.query.clusterId ? Number(route.query.clusterId) : null);
const loading = ref(false);
const releases = ref<any[]>([]);

const columns = [
  { title: 'Release名称', dataIndex: 'releaseName', key: 'releaseName' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: 'Chart', dataIndex: 'chartName', key: 'chartName', width: 150 },
  { title: 'Chart版本', dataIndex: 'chartVersion', key: 'chartVersion', width: 100 },
  { title: '应用版本', dataIndex: 'appVersion', key: 'appVersion', width: 100 },
  { title: '修订版', dataIndex: 'revision', key: 'revision', width: 80 },
  { title: '状态', key: 'status', width: 100 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const statusColors: Record<string, string> = {
  deployed: 'green', deploying: 'blue', failed: 'red', uninstalling: 'orange', superseded: 'default',
};

// Upgrade state
const upgradeVisible = ref(false);
const upgradeRelease = ref<any>(null);
const upgradeVersion = ref('');
const upgradeValues = ref('');
const upgradeLoading = ref(false);

// Rollback state
const rollbackVisible = ref(false);
const rollbackRelease = ref<any>(null);
const rollbackRevision = ref(1);
const rollbackLoading = ref(false);

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    const active = clusters.value.filter(c => c.status === 'active');
    if (!selectedClusterId.value && active.length > 0) {
      selectedClusterId.value = active[0]!.id;
    }
    if (selectedClusterId.value) fetchData();
  } catch { message.error('获取集群列表失败'); }
}

async function fetchData() {
  if (!selectedClusterId.value) return;
  loading.value = true;
  try {
    const res = await getHelmReleases(selectedClusterId.value);
    releases.value = Array.isArray(res) ? res : [];
  } catch (e: any) { message.error('获取Release列表失败: ' + e.message); }
  finally { loading.value = false; }
}

function handleUninstall(r: any) {
  Modal.confirm({
    title: '确认卸载', content: `确定要卸载Release「${r.releaseName}」吗？此操作不可撤销。`, okType: 'danger',
    async onOk() {
      try {
        await uninstallHelmRelease(selectedClusterId.value!, r.releaseName, r.namespace);
        message.success('卸载成功');
        fetchData();
      } catch (e: any) { message.error('卸载失败: ' + e.message); }
    },
  });
}

onMounted(fetchClusters);

function openUpgrade(r: any) {
  upgradeRelease.value = r;
  upgradeVersion.value = r.chartVersion || '';
  upgradeValues.value = '';
  upgradeVisible.value = true;
}

async function handleUpgrade() {
  if (!upgradeRelease.value || !upgradeVersion.value.trim()) { message.warning('请输入Chart版本'); return; }
  upgradeLoading.value = true;
  try {
    await upgradeHelmRelease(selectedClusterId.value!, upgradeRelease.value.releaseName, {
      namespace: upgradeRelease.value.namespace,
      chartVersion: upgradeVersion.value.trim(),
      values: upgradeValues.value || undefined,
    });
    message.success('升级成功');
    upgradeVisible.value = false;
    fetchData();
  } catch (e: any) { message.error('升级失败: ' + e.message); }
  finally { upgradeLoading.value = false; }
}

function openRollback(r: any) {
  rollbackRelease.value = r;
  rollbackRevision.value = Math.max(1, (r.revision || 1) - 1);
  rollbackVisible.value = true;
}

async function handleRollback() {
  if (!rollbackRelease.value) return;
  rollbackLoading.value = true;
  try {
    await rollbackHelmRelease(selectedClusterId.value!, rollbackRelease.value.releaseName, rollbackRelease.value.namespace, rollbackRevision.value);
    message.success('回滚成功');
    rollbackVisible.value = false;
    fetchData();
  } catch (e: any) { message.error('回滚失败: ' + e.message); }
  finally { rollbackLoading.value = false; }
}
</script>

<template>
  <div class="p-4">
    <Card title="已安装应用">
      <template #extra>
        <Space>
          <Select :value="selectedClusterId" style="width:150px" @change="(v: number) => { selectedClusterId = v; fetchData(); }">
            <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{ c.name }}</SelectOption>
          </Select>
          <Button @click="fetchData">刷新</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="releases" :loading="loading" row-key="id" :scroll="{ x: 1100 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColors[record.status] || 'default'">{{ record.status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openUpgrade(record)">升级</Button>
              <Button type="link" size="small" @click="openRollback(record)" :disabled="(record.revision || 1) <= 1">回滚</Button>
              <Button type="link" size="small" danger @click="handleUninstall(record)">卸载</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Upgrade Modal -->
    <Modal v-model:open="upgradeVisible" title="升级Release" :confirm-loading="upgradeLoading" @ok="handleUpgrade" width="600px">
      <div style="margin-bottom:12px">
        <label>Release: </label><strong>{{ upgradeRelease?.releaseName }}</strong>
        <span style="margin-left:12px;color:#8c8c8c">当前版本: {{ upgradeRelease?.chartVersion }}</span>
      </div>
      <div style="margin-bottom:12px">
        <label>目标Chart版本</label>
        <Input v-model:value="upgradeVersion" placeholder="e.g. 1.2.0" style="margin-top:4px" />
      </div>
      <div style="margin-bottom:8px">
        <label>自定义Values (YAML, 可选)</label>
      </div>
      <YamlEditor v-model="upgradeValues" height="300px" />
    </Modal>

    <!-- Rollback Modal -->
    <Modal v-model:open="rollbackVisible" title="回滚Release" :confirm-loading="rollbackLoading" @ok="handleRollback" width="400px">
      <div style="margin-bottom:12px">
        <label>Release: </label><strong>{{ rollbackRelease?.releaseName }}</strong>
        <span style="margin-left:12px;color:#8c8c8c">当前修订版: {{ rollbackRelease?.revision }}</span>
      </div>
      <div style="margin-bottom:12px">
        <label>目标修订版号</label>
        <InputNumber v-model:value="rollbackRevision" :min="1" :max="(rollbackRelease?.revision || 2) - 1" style="width:100%;margin-top:4px" />
      </div>
    </Modal>
  </div>
</template>
