<script lang="ts" setup>
import ClusterScene from './3d/ClusterScene.vue';
</script>

<template>
  <BusinessPage
    :show-heading="false"
    title="集群3D视图"
    description="从空间关系了解集群、机架和主机，选择对象查看真实资料。"
    family="拓扑"
    route-key="/dashboard/overview"
  >
    <div class="cluster-overview">
      <ClusterScene />
    </div>
  </BusinessPage>
</template>

<style scoped>
.cluster-overview {
  width: 100%;
  min-height: calc(100dvh - 112px);
}
</style>
