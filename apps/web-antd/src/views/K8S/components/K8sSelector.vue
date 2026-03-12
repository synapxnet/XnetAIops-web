<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { Select, SelectOption, Space } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getNamespaces } from '../api/namespace';
import type { K8sCluster } from '../api/types';

const props = defineProps<{
  showNamespace?: boolean;
}>();

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
    if (!clusterId.value) {
      const active = clusters.value.filter((c) => c.status === 'active');
      if (active.length > 0) {
        clusterId.value = active[0]!.id;
      }
    }
    if (clusterId.value && props.showNamespace !== false) {
      await fetchNamespaces();
    } else {
      emit('change');
    }
  } catch {
    // silent
  }
}

async function fetchNamespaces() {
  if (!clusterId.value) return;
  try {
    const res = await getNamespaces(clusterId.value);
    namespaces.value = (Array.isArray(res) ? res : []).map(
      (n: any) => n.name,
    );
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
    // silent
  }
}

function onClusterChange(v: number) {
  clusterId.value = v;
  if (props.showNamespace !== false) {
    fetchNamespaces();
  } else {
    emit('change');
  }
}

function onNamespaceChange(v: string) {
  namespace.value = v;
  emit('change');
}

onMounted(fetchClusters);

defineExpose({ fetchClusters, fetchNamespaces });
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
