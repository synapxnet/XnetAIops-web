import * as THREE from 'three';
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_DEPTH,
  STATUS_COLORS,
  RACK_HEIGHT,
  NODE_GAP,
} from '../constants';

export interface ServerNodeData {
  id: number;
  hostname: string;
  ipAddress: string;
  status: string;
  cpuUsage: number;
  usedMemGb: number;
  totalMemGb: number;
}

/**
 * 创建单台服务器节点 3D 模型
 * 小方块 + 状态指示灯颜色
 */
export function createServerNode(data: ServerNodeData, slotIndex: number): THREE.Group {
  const group = new THREE.Group();
  group.name = `node_${data.id}`;
  group.userData = { type: 'serverNode', ...data };

  const statusColor = STATUS_COLORS[data.status] || STATUS_COLORS.unknown!;

  // 服务器主体
  const bodyGeometry = new THREE.BoxGeometry(NODE_WIDTH, NODE_HEIGHT, NODE_DEPTH);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a3a5a,
    roughness: 0.5,
    metalness: 0.6,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  group.add(body);

  // 状态指示灯（前面板小方块）
  const ledGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
  const ledMaterial = new THREE.MeshBasicMaterial({ color: statusColor });
  const led = new THREE.Mesh(ledGeometry, ledMaterial);
  led.position.set(-NODE_WIDTH / 2 + 0.2, 0, NODE_DEPTH / 2 + 0.01);
  led.name = 'statusLed';
  group.add(led);

  // 状态发光光晕
  const glowGeometry = new THREE.SphereGeometry(0.08, 8, 8);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: statusColor,
    transparent: true,
    opacity: 0.4,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.copy(led.position);
  group.add(glow);

  // 面板纹理（显示主机名）
  const panelCanvas = document.createElement('canvas');
  panelCanvas.width = 256;
  panelCanvas.height = 48;
  const ctx = panelCanvas.getContext('2d')!;
  ctx.fillStyle = '#3a3a5a';
  ctx.fillRect(0, 0, 256, 48);
  ctx.fillStyle = '#cccccc';
  ctx.font = '16px monospace';
  ctx.fillText(data.hostname.substring(0, 20), 40, 18);
  ctx.fillStyle = '#888888';
  ctx.font = '12px monospace';
  ctx.fillText(data.ipAddress, 40, 36);

  const panelTexture = new THREE.CanvasTexture(panelCanvas);
  const panelGeometry = new THREE.PlaneGeometry(NODE_WIDTH, NODE_HEIGHT);
  const panelMaterial = new THREE.MeshBasicMaterial({ map: panelTexture });
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  panel.position.z = NODE_DEPTH / 2 + 0.005;
  group.add(panel);

  // 定位到机架内的对应插槽
  const yPos = 0.3 + slotIndex * (NODE_HEIGHT + NODE_GAP);
  group.position.y = yPos;

  return group;
}

/**
 * 更新服务器节点状态颜色
 */
export function updateServerNodeStatus(nodeGroup: THREE.Group, newStatus: string) {
  const statusColor = STATUS_COLORS[newStatus] || STATUS_COLORS.unknown!;
  nodeGroup.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name === 'statusLed') {
      (child.material as THREE.MeshBasicMaterial).color.setHex(statusColor);
    }
  });
  nodeGroup.userData.status = newStatus;
}
