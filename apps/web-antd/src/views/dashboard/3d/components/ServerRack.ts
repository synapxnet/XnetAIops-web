import * as THREE from 'three';
import {
  RACK_WIDTH,
  RACK_HEIGHT,
  RACK_DEPTH,
} from '../constants';

/**
 * 创建服务器机架 3D 模型
 * 由金属框架 + 内部空间组成
 */
export function createServerRack(rackName: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `rack_${rackName}`;
  group.userData = { type: 'rack', rackName };

  // 机架框架（半透明金属外壳）
  const frameGeometry = new THREE.BoxGeometry(RACK_WIDTH, RACK_HEIGHT, RACK_DEPTH);
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a4a,
    transparent: true,
    opacity: 0.3,
    roughness: 0.4,
    metalness: 0.8,
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.y = RACK_HEIGHT / 2;
  frame.castShadow = true;
  frame.receiveShadow = true;
  group.add(frame);

  // 机架边框线条
  const edgesGeometry = new THREE.EdgesGeometry(frameGeometry);
  const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x5555aa, linewidth: 2 });
  const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
  edges.position.y = RACK_HEIGHT / 2;
  group.add(edges);

  // 机架顶部标签板
  const labelGeometry = new THREE.PlaneGeometry(RACK_WIDTH * 0.8, 0.3);
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#00ccff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(rackName, 128, 42);
  const labelTexture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture });
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.set(0, RACK_HEIGHT + 0.2, RACK_DEPTH / 2 + 0.01);
  group.add(label);

  return group;
}
