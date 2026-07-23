<script lang="ts" setup>
import ClusterScene from './3d/ClusterScene.vue';
</script>

<template>
  <div class="cluster-overview">
    <ClusterScene />
  </div>
</template>

<style scoped>
.cluster-overview {
  width: 100%;
  min-height: calc(100dvh - 112px);
}
</style>
