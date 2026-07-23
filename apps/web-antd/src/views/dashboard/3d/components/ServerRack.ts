import * as THREE from 'three';

import { RACK_DEPTH, RACK_HEIGHT, RACK_WIDTH } from '../constants';

function addBeam(
  group: THREE.Group,
  geometry: THREE.BoxGeometry,
  material: THREE.MeshStandardMaterial,
  position: [number, number, number],
) {
  const beam = new THREE.Mesh(geometry, material);
  beam.position.set(...position);
  beam.castShadow = true;
  group.add(beam);
}

export function createServerRack(rackName: string, isDark = true): THREE.Group {
  const group = new THREE.Group();
  group.name = `rack_${rackName}`;
  group.userData = { type: 'rack', rackName };

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: isDark ? 0x4b7793 : 0x6686a0,
    metalness: 0.42,
    roughness: 0.4,
  });
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: isDark ? 0x1a4059 : 0xd7e2eb,
    metalness: 0.28,
    opacity: isDark ? 0.82 : 0.88,
    roughness: 0.5,
    transparent: true,
  });
  const beamWidth = 0.09;
  const verticalGeometry = new THREE.BoxGeometry(
    beamWidth,
    RACK_HEIGHT,
    beamWidth,
  );
  const horizontalGeometry = new THREE.BoxGeometry(
    RACK_WIDTH,
    beamWidth,
    beamWidth,
  );
  const depthGeometry = new THREE.BoxGeometry(beamWidth, beamWidth, RACK_DEPTH);
  const xEdge = RACK_WIDTH / 2;
  const zEdge = RACK_DEPTH / 2;

  for (const x of [-xEdge, xEdge]) {
    for (const z of [-zEdge, zEdge]) {
      addBeam(group, verticalGeometry, frameMaterial, [x, RACK_HEIGHT / 2, z]);
    }
  }

  for (const y of [0, RACK_HEIGHT]) {
    for (const z of [-zEdge, zEdge]) {
      addBeam(group, horizontalGeometry, frameMaterial, [0, y, z]);
    }
    for (const x of [-xEdge, xEdge]) {
      addBeam(group, depthGeometry, frameMaterial, [x, y, 0]);
    }
  }

  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(RACK_WIDTH - 0.16, RACK_HEIGHT - 0.16, 0.06),
    shellMaterial,
  );
  backPanel.position.set(0, RACK_HEIGHT / 2, -zEdge + 0.04);
  backPanel.receiveShadow = true;
  group.add(backPanel);

  for (const x of [-xEdge, xEdge]) {
    const sidePanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, RACK_HEIGHT - 0.18, RACK_DEPTH - 0.16),
      shellMaterial,
    );
    sidePanel.position.set(x, RACK_HEIGHT / 2, 0);
    sidePanel.castShadow = true;
    sidePanel.receiveShadow = true;
    group.add(sidePanel);
  }

  const topPanel = new THREE.Mesh(
    new THREE.BoxGeometry(RACK_WIDTH + 0.08, 0.12, RACK_DEPTH + 0.08),
    frameMaterial,
  );
  topPanel.position.y = RACK_HEIGHT + 0.08;
  topPanel.castShadow = true;
  group.add(topPanel);

  const accentMaterial = new THREE.MeshBasicMaterial({
    color: isDark ? 0x31a8ff : 0x1677b8,
    opacity: 0.88,
    transparent: true,
  });
  const accentStrip = new THREE.Mesh(
    new THREE.BoxGeometry(RACK_WIDTH - 0.24, 0.045, 0.04),
    accentMaterial,
  );
  accentStrip.position.set(0, RACK_HEIGHT - 0.2, zEdge + 0.035);
  group.add(accentStrip);

  for (const x of [-xEdge + 0.045, xEdge - 0.045]) {
    const verticalAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, RACK_HEIGHT - 0.42, 0.04),
      accentMaterial,
    );
    verticalAccent.position.set(x, RACK_HEIGHT / 2, zEdge + 0.035);
    group.add(verticalAccent);
  }

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 320;
  labelCanvas.height = 72;
  const context = labelCanvas.getContext('2d')!;
  context.fillStyle = isDark ? '#0b2234' : '#e9f1f7';
  context.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  context.strokeStyle = isDark ? '#2f9bff' : '#1677b8';
  context.lineWidth = 4;
  context.strokeRect(2, 2, labelCanvas.width - 4, labelCanvas.height - 4);
  context.fillStyle = isDark ? '#dff4ff' : '#12344d';
  context.font = '600 30px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(rackName, labelCanvas.width / 2, labelCanvas.height / 2);

  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(RACK_WIDTH * 0.84, 0.42),
    new THREE.MeshBasicMaterial({ map: labelTexture }),
  );
  label.position.set(0, RACK_HEIGHT + 0.38, zEdge + 0.02);
  group.add(label);

  return group;
}
