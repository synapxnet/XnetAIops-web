import { ref } from 'vue';
import * as THREE from 'three';

export interface HoveredNode {
  id: number;
  hostname: string;
  ipAddress: string;
  status: string;
  cpuUsage: number;
  usedMemGb: number;
  totalMemGb: number;
  screenX: number;
  screenY: number;
}

export function useInteraction(
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const hoveredNode = ref<HoveredNode | null>(null);
  const selectedNode = ref<HoveredNode | null>(null);

  function onMouseMove(event: MouseEvent, container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let found = false;
    for (const intersect of intersects) {
      let obj: THREE.Object3D | null = intersect.object;
      while (obj) {
        if (obj.userData?.type === 'serverNode') {
          const pos = new THREE.Vector3();
          obj.getWorldPosition(pos);
          pos.project(camera);
          const rect2 = container.getBoundingClientRect();
          hoveredNode.value = {
            id: obj.userData.id,
            hostname: obj.userData.hostname,
            ipAddress: obj.userData.ipAddress,
            status: obj.userData.status,
            cpuUsage: obj.userData.cpuUsage || 0,
            usedMemGb: obj.userData.usedMemGb || 0,
            totalMemGb: obj.userData.totalMemGb || 0,
            screenX: ((pos.x + 1) / 2) * rect2.width,
            screenY: ((-pos.y + 1) / 2) * rect2.height,
          };
          found = true;
          container.style.cursor = 'pointer';
          break;
        }
        obj = obj.parent;
      }
      if (found) break;
    }

    if (!found) {
      hoveredNode.value = null;
      container.style.cursor = 'default';
    }
  }

  function onClick(event: MouseEvent, container: HTMLElement) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const intersect of intersects) {
      let obj: THREE.Object3D | null = intersect.object;
      while (obj) {
        if (obj.userData?.type === 'serverNode') {
          selectedNode.value = {
            id: obj.userData.id,
            hostname: obj.userData.hostname,
            ipAddress: obj.userData.ipAddress,
            status: obj.userData.status,
            cpuUsage: obj.userData.cpuUsage || 0,
            usedMemGb: obj.userData.usedMemGb || 0,
            totalMemGb: obj.userData.totalMemGb || 0,
            screenX: 0,
            screenY: 0,
          };
          return;
        }
        obj = obj.parent;
      }
    }
    selectedNode.value = null;
  }

  return {
    hoveredNode,
    selectedNode,
    onMouseMove,
    onClick,
  };
}
