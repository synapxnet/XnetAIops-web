<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';
import { Select, SelectOption, Space } from 'ant-design-vue';
import { getClusters } from '../api/cluster';
import { getNamespaces } from '../api/namespace';
import type { K8sCluster } from '../api/types';

const props = withDefaults(defineProps<{
  showNamespace?: boolean;
}>(), { showNamespace: true });

const clusterId = defineModel<number | null>('clusterId', { default: null });
const namespace = defineModel<string>('namespace', { default: '' });

const clusters = ref<K8sCluster[]>([]);
const namespaces = ref<string[]>([]);

const emit = defineEmits<{
  change: [];
}>();

/** 默认读取当前集群及命名空间，启动依赖数据查询。 / Load the default cluster and namespace before dependent queries. */
async function fetchClusters() {
  try {
    const res = await getClusters();
    clusters.value = Array.isArray(res) ? res : [];
    if (!clusterId.value) {
      const active = clusters.value.filter((c) => c.status === 'active');
      if (active.length > 0) {
        clusterId.value = active[0]!.id;
        // 等待父级 v-model 回传，再读取关联范围。 / Wait for the parent model before reading its dependent scope.
        await nextTick();
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

/** 只在已选集群内选择有效的命名空间。 / Select a namespace that exists within the chosen cluster. */
async function fetchNamespaces() {
  if (!clusterId.value) return;
  const requestedClusterId = clusterId.value;
  try {
    const res = await getNamespaces(requestedClusterId);
    if (clusterId.value !== requestedClusterId) return;
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
    await nextTick();
    if (clusterId.value !== requestedClusterId) return;
    emit('change');
  } catch {
    // silent
  }
}

/** 切换集群后刷新其命名空间。 / Refresh namespace options after a cluster change. */
async function onClusterChange(v: number) {
  clusterId.value = v;
  namespace.value = '';
  namespaces.value = [];
  await nextTick();
  if (props.showNamespace !== false) {
    await fetchNamespaces();
  } else {
    emit('change');
  }
}

/** 通知业务页重新读取选定命名空间。 / Notify the business page to reload the selected namespace. */
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
