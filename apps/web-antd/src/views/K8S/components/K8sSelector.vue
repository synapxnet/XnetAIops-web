<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Select, SelectOption, Space } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getNamespaces } from '../api/namespace';
import type { K8sCluster } from '../api/types';
import { demoK8sNamespaces, isDemoK8sCluster } from '../demo-data';

const props = withDefaults(defineProps<{
  showNamespace?: boolean;
}>(), {
  showNamespace: true,
});

const clusterId = defineModel<number | null>('clusterId', { default: null });
const namespace = defineModel<string>('namespace', { default: '' });

const clusters = ref<K8sCluster[]>([]);
const namespaces = ref<string[]>([]);

const emit = defineEmits<{
  change: [];
}>();

async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    let targetClusterId = clusterId.value;
    if (!targetClusterId) {
      const active = clusters.value.filter((c) => c.status === 'active');
      if (active.length > 0) {
        targetClusterId = active[0]!.id;
        clusterId.value = targetClusterId;
      }
    }
    if (targetClusterId && props.showNamespace !== false) {
      await fetchNamespaces(targetClusterId);
    } else {
      emit('change');
    }
  } catch {
    // The cluster list has no safe local fallback.
  }
}

async function fetchNamespaces(targetClusterId = clusterId.value) {
  if (!targetClusterId) return;
  if (isDemoSelection(targetClusterId)) {
    applyDemoNamespaces();
    return;
  }
  try {
    const res = await getNamespaces(targetClusterId);
    const namespaceList = (Array.isArray(res) ? res : []).map(
      (n: any) => n.name,
    );
    namespaces.value = namespaceList.length === 0 && isDemoSelection(targetClusterId)
      ? demoK8sNamespaces.map((item) => item.name)
      : namespaceList;
    if (
      !namespace.value ||
      !namespaces.value.includes(namespace.value)
    ) {
      namespace.value = namespaces.value.includes('default')
        ? 'default'
        : namespaces.value[0] || '';
    }
    emit('change');
  } catch {
    // Real cluster namespace errors remain non-blocking in the shared selector.
  }
}

function applyDemoNamespaces() {
  namespaces.value = demoK8sNamespaces.map((item) => item.name);
  namespace.value = namespaces.value.includes('default')
    ? 'default'
    : namespaces.value[0] || '';
  emit('change');
}

function onClusterChange(v: number) {
  clusterId.value = v;
  if (props.showNamespace !== false) {
    fetchNamespaces(v);
  } else {
    emit('change');
  }
}

function onNamespaceChange(v: string) {
  namespace.value = v;
  emit('change');
}

function isDemoSelection(targetClusterId = clusterId.value) {
  return isDemoK8sCluster(clusters.value, targetClusterId);
}

onMounted(fetchClusters);

defineExpose({ fetchClusters, fetchNamespaces, isDemoSelection });
</script>

<template>
  <Space>
    <Select
      :value="clusterId"
      style="width: 160px"
      placeholder="选择集群"
      @change="onClusterChange"
    >
      <SelectOption v-for="c in clusters" :key="c.id" :value="c.id">{{
        c.name
      }}</SelectOption>
    </Select>
    <Select
      v-if="showNamespace !== false"
      :value="namespace"
      style="width: 160px"
      placeholder="选择命名空间"
      show-search
      @change="onNamespaceChange"
    >
      <SelectOption v-for="ns in namespaces" :key="ns" :value="ns">{{
        ns
      }}</SelectOption>
    </Select>
  </Space>
</template>
