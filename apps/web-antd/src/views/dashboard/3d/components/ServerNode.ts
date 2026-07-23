import * as THREE from 'three';

import {
  NODE_DEPTH,
  NODE_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
  STATUS_COLORS,
} from '../constants';

export interface ServerNodeData {
  id: number;
  hostname: string;
  ipAddress: string;
  status: string;
  cpuUsage: number;
  usedMemGb: number;
  totalMemGb: number;
  interactive?: boolean;
}

export function createServerNode(
  data: ServerNodeData,
  slotIndex: number,
  isDark = true,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `node_${data.id}`;
  group.userData = {
    type: data.interactive === false ? 'capacityNode' : 'serverNode',
    ...data,
  };

  const statusColor = STATUS_COLORS[data.status] || STATUS_COLORS.unknown!;
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: isDark ? 0x2b5670 : 0x8ca7bb,
    metalness: 0.4,
    roughness: 0.42,
  });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(NODE_WIDTH, NODE_HEIGHT, NODE_DEPTH),
    bodyMaterial,
  );
  body.castShadow = true;
  group.add(body);

  const frontMaterial = new THREE.MeshStandardMaterial({
    color: isDark ? 0x10354d : 0x304f66,
    emissive: isDark ? 0x092436 : 0x000000,
    emissiveIntensity: 0.72,
    metalness: 0.3,
    roughness: 0.4,
  });
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(NODE_WIDTH - 0.08, NODE_HEIGHT - 0.07, 0.035),
    frontMaterial,
  );
  front.position.z = NODE_DEPTH / 2 + 0.02;
  group.add(front);

  const ledMaterial = new THREE.MeshStandardMaterial({
    color: statusColor,
    emissive: statusColor,
    emissiveIntensity: 2.6,
  });
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.09, 0.045),
    ledMaterial,
  );
  led.position.set(-NODE_WIDTH / 2 + 0.18, 0, NODE_DEPTH / 2 + 0.055);
  led.name = 'statusLed';
  group.add(led);

  const usageWidth = Math.max(
    0.08,
    ((NODE_WIDTH - 0.48) * Math.min(Math.max(data.cpuUsage, 0), 100)) / 100,
  );
  const usage = new THREE.Mesh(
    new THREE.BoxGeometry(usageWidth, 0.055, 0.03),
    new THREE.MeshBasicMaterial({
      color: data.cpuUsage > 80 ? 0xff7a45 : 0x2f9bff,
      opacity: 0.92,
      transparent: true,
    }),
  );
  usage.position.set(
    -NODE_WIDTH / 2 + 0.32 + usageWidth / 2,
    -0.08,
    NODE_DEPTH / 2 + 0.06,
  );
  group.add(usage);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: statusColor,
      opacity: 0.28,
      transparent: true,
    }),
  );
  glow.position.copy(led.position);
  glow.name = 'statusGlow';
  group.add(glow);

  group.position.y = 0.5 + slotIndex * (NODE_HEIGHT + NODE_GAP);
  return group;
}

export function updateServerNodeStatus(
  nodeGroup: THREE.Group,
  newStatus: string,
) {
  const statusColor = STATUS_COLORS[newStatus] || STATUS_COLORS.unknown!;
  nodeGroup.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (child.name === 'statusLed') {
      const material = child.material as THREE.MeshStandardMaterial;
      material.color.setHex(statusColor);
      material.emissive.setHex(statusColor);
    }
    if (child.name === 'statusGlow') {
      (child.material as THREE.MeshBasicMaterial).color.setHex(statusColor);
    }
  });
  nodeGroup.userData.status = newStatus;
}
