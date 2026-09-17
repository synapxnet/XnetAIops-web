<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Card,
  Table,
  Alert,
  Space,
  Button,
  Select,
  SelectOption,
  Modal,
  message,
} from 'ant-design-vue';
import { getNamespaces } from '../api/namespace';
import { getCustomResources, deleteCustomResource } from '../api/crd';

const route = useRoute();
const router = useRouter();

const clusterId = ref(Number(route.query.clusterId));
const crdName = ref(
  typeof route.query.crdName === 'string' ? route.query.crdName.trim() : '',
);
const group = ref(
  typeof route.query.group === 'string' ? route.query.group.trim() : '',
);
const version = ref(
  typeof route.query.version === 'string' ? route.query.version.trim() : '',
);
const plural = ref(
  typeof route.query.plural === 'string' ? route.query.plural.trim() : '',
);
const scope = ref(
  typeof route.query.scope === 'string' ? route.query.scope : '',
);
const kind = ref(
  typeof route.query.kind === 'string' ? route.query.kind.trim() : '',
);
/** CRD接口必须关联具体资源类型；kind仅作展示。CRD APIs require full resource context; kind is display-only. */
const validContext = computed(
  () =>
    typeof route.query.clusterId === 'string' &&
    Number.isSafeInteger(clusterId.value) &&
    clusterId.value > 0 &&
    Boolean(crdName.value && group.value && version.value && plural.value) &&
    ['Namespaced', 'Cluster'].includes(scope.value),
);

const namespaces = ref<string[]>([]);
const selectedNamespace = ref('');
const loading = ref(false);
const resources = ref<any[]>([]);
const namespaceError = ref('');
const loadError = ref('');
let resourceRequest = 0;
/** 命名空间资源不能在缺少命名空间时退化成全局查询。Namespaced resources cannot fall back to a global query. */
const canLoad = computed(
  () =>
    validContext.value &&
    (scope.value === 'Cluster' ||
      namespaces.value.includes(selectedNamespace.value)),
);

const columns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 130 },
  { title: 'Kind', dataIndex: 'kind', key: 'kind', width: 150 },
  { title: 'API版本', dataIndex: 'apiVersion', key: 'apiVersion', width: 200 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' as const },
];

/** 先确认命名空间，再读取实例。Resolve a namespace before reading its instances. */
async function fetchNamespaces() {
  if (!validContext.value || scope.value !== 'Namespaced') return;
  namespaceError.value = '';
  namespaces.value = [];
  selectedNamespace.value = '';
  resources.value = [];
  try {
    const res = await getNamespaces(clusterId.value);
    namespaces.value = (Array.isArray(res) ? res : []).map((n: any) => n.name);
    selectedNamespace.value = namespaces.value.includes('default')
      ? 'default'
      : namespaces.value[0] || '';
    await fetchData();
  } catch {
    namespaceError.value = '暂时无法读取命名空间，请重试。';
  }
}

/** 校验资源上下文并忽略命名空间切换后的迟到响应。Validate resource context and ignore stale namespace responses. */
async function fetchData() {
  if (!canLoad.value) return;
  const requestId = ++resourceRequest;
  const namespace = selectedNamespace.value;
  resources.value = [];
  loadError.value = '';
  loading.value = true;
  try {
    const ns = scope.value === 'Namespaced' ? namespace : undefined;
    const res = await getCustomResources(
      clusterId.value,
      crdName.value,
      group.value,
      version.value,
      plural.value,
      ns,
    );
    if (requestId === resourceRequest && namespace === selectedNamespace.value)
      resources.value = Array.isArray(res) ? res : [];
  } catch {
    if (requestId === resourceRequest)
      loadError.value = '暂时无法读取实例列表，请重试。';
  } finally {
    if (requestId === resourceRequest) loading.value = false;
  }
}

/** 只为当前列表的明确资源发起删除确认。Request deletion confirmation only for an identified current resource. */
function handleDelete(r: any) {
  if (
    !canLoad.value ||
    !resources.value.includes(r) ||
    typeof r.name !== 'string' ||
    !r.name.trim()
  )
    return;
  if (scope.value === 'Namespaced' && r.namespace !== selectedNamespace.value)
    return;
  const resourceNamespace =
    scope.value === 'Namespaced' ? r.namespace : undefined;
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除「${r.name}」吗？`,
    okType: 'danger',
    /** 确认前再次校验页面仍指向原资源。Recheck the original resource before confirmed deletion. */
    async onOk() {
      if (
        !canLoad.value ||
        !resources.value.includes(r) ||
        (scope.value === 'Namespaced' &&
          resourceNamespace !== selectedNamespace.value)
      )
        return;
      try {
        await deleteCustomResource(
          clusterId.value,
          crdName.value,
          r.name,
          group.value,
          version.value,
          plural.value,
          resourceNamespace,
        );
        message.success('删除成功');
        fetchData();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
      }
    },
  });
}

/** 返回CRD列表重新选择资源类型。Return to the CRD list to select a resource type. */
function goBack() {
  router.push('/K8S/crd/list');
}

/** 根据经过验证的资源作用域加载数据。Load data using a validated resource scope. */
onMounted(() => {
  if (!validContext.value) return;
  if (scope.value === 'Namespaced') {
    fetchNamespaces();
  } else {
    fetchData();
  }
});
</script>

<template>
  <BusinessPage
    title="CRD实例"
    description="将状态、配置与关联资料放在一起，继续处理当前资源。"
    family="详情"
    route-key="/K8S/crd/instances"
  >
    <div class="p-4">
      <Card
        :title="
          validContext ? `${kind || plural} 实例 (${crdName})` : 'CRD实例'
        "
      >
        <template #extra>
          <Space>
            <Select
              v-if="validContext && scope === 'Namespaced'"
              :value="selectedNamespace"
              style="width: 150px"
              @change="
                (v: string) => {
                  selectedNamespace = v;
                  fetchData();
                }
              "
            >
              <SelectOption v-for="ns in namespaces" :key="ns" :value="ns">{{
                ns
              }}</SelectOption>
            </Select>
            <Button v-if="validContext" :disabled="!canLoad" @click="fetchData"
              >刷新</Button
            >
            <Button @click="goBack">返回CRD列表</Button>
          </Space>
        </template>
        <Alert
          v-if="!validContext"
          type="info"
          show-icon
          message="请先从CRD列表选择资源类型"
        />
        <Alert
          v-else-if="namespaceError"
          type="warning"
          show-icon
          :message="namespaceError"
        >
          <template #action
            ><Button @click="fetchNamespaces">重试</Button></template
          >
        </Alert>
        <Alert
          v-else-if="loadError"
          type="warning"
          show-icon
          :message="loadError"
        >
          <template #action><Button @click="fetchData">重试</Button></template>
        </Alert>
        <Table
          v-else
          :columns="columns"
          :data-source="resources"
          :loading="loading"
          row-key="name"
          :scroll="{ x: 900 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <Button
                type="link"
                size="small"
                danger
                @click="handleDelete(record)"
                >删除</Button
              >
            </template>
          </template>
        </Table>
      </Card>
    </div>
  </BusinessPage>
</template>
