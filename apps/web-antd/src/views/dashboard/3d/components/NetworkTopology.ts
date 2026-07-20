import * as THREE from 'three';
import { RACK_HEIGHT } from '../constants';

/**
 * 创建机架间的网络连接线
 */
export function createNetworkLines(rackPositions: THREE.Vector3[]): THREE.Group {
  const group = new THREE.Group();
  group.name = 'networkTopology';

  if (rackPositions.length < 2) return group;

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00aaff,
    transparent: true,
    opacity: 0.5,
  });

  // 连接相邻的机架（顶部连线）
  for (let i = 0; i < rackPositions.length - 1; i++) {
    const from = rackPositions[i]!;
    const to = rackPositions[i + 1]!;
    const midY = RACK_HEIGHT + 1.0;

    const points = [
      new THREE.Vector3(from.x, midY, from.z),
      new THREE.Vector3((from.x + to.x) / 2, midY + 0.5, (from.z + to.z) / 2),
      new THREE.Vector3(to.x, midY, to.z),
    ];

    const curve = new THREE.QuadraticBezierCurve3(points[0]!, points[1]!, points[2]!);
    const curvePoints = curve.getPoints(20);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    group.add(line);
  }

  // 如果有多排，连接首尾形成环路
  if (rackPositions.length > 2) {
    const first = rackPositions[0]!;
    const last = rackPositions[rackPositions.length - 1]!;
    const midY = RACK_HEIGHT + 1.5;

    const points = [
      new THREE.Vector3(last.x, midY, last.z),
      new THREE.Vector3((first.x + last.x) / 2, midY + 1.0, (first.z + last.z) / 2 - 2),
      new THREE.Vector3(first.x, midY, first.z),
    ];

    const curve = new THREE.QuadraticBezierCurve3(points[0]!, points[1]!, points[2]!);
    const curvePoints = curve.getPoints(30);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const dashMaterial = new THREE.LineDashedMaterial({
      color: 0xff6600,
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.4,
    });
    const line = new THREE.Line(lineGeometry, dashMaterial);
    line.computeLineDistances();
    group.add(line);
  }

  return group;
}
