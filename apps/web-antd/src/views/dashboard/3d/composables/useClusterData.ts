import { ref } from 'vue';
import { getHosts } from '../../../HOM/api/host';
import { getClusters } from '../../../CLM/api/cluster';
import type { Host } from '../../../HOM/api/types';
import type { Cluster } from '../../../CLM/api/types';

export interface RackGroup {
  rackName: string;
  hosts: Host[];
}

export function useClusterData() {
  const clusters = ref<Cluster[]>([]);
  const hosts = ref<Host[]>([]);
  const rackGroups = ref<RackGroup[]>([]);
  const loading = ref(false);
  const selectedClusterId = ref<number | undefined>(undefined);

  async function fetchClusters() {
    try {
      const res = await getClusters();
      clusters.value = Array.isArray(res) ? res : (res as any)?.data || [];
      if (clusters.value.length > 0 && !selectedClusterId.value) {
        selectedClusterId.value = clusters.value[0]!.id;
      }
    } catch (_e) {
      // Silently fail - 3D scene will show empty
    }
  }

  async function fetchHosts() {
    if (!selectedClusterId.value) return;
    loading.value = true;
    try {
      const res = await getHosts(selectedClusterId.value);
      hosts.value = Array.isArray(res) ? res : (res as any)?.data || [];
      buildRackGroups();
    } catch (_e) {
      hosts.value = [];
      rackGroups.value = [];
    } finally {
      loading.value = false;
    }
  }

  function buildRackGroups() {
    const map = new Map<string, Host[]>();
    for (const host of hosts.value) {
      const rackName = host.rack || '/default';
      if (!map.has(rackName)) {
        map.set(rackName, []);
      }
      map.get(rackName)!.push(host);
    }
    rackGroups.value = Array.from(map.entries()).map(([rackName, hosts]) => ({
      rackName,
      hosts,
    }));
  }

  async function loadData() {
    await fetchClusters();
    await fetchHosts();
  }

  async function switchCluster(clusterId: number) {
    selectedClusterId.value = clusterId;
    await fetchHosts();
  }

  return {
    clusters,
    hosts,
    rackGroups,
    loading,
    selectedClusterId,
    loadData,
    switchCluster,
    fetchHosts,
  };
}
