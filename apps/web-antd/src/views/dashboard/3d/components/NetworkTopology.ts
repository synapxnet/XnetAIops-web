import * as THREE from 'three';

function addCableSegment(
  group: THREE.Group,
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: number,
  pulse = true,
) {
  const dx = Math.abs(to.x - from.x);
  const dz = Math.abs(to.z - from.z);
  const length = Math.max(dx, dz);
  const geometry = new THREE.BoxGeometry(
    dx > dz ? length : 0.055,
    0.045,
    dz >= dx ? length : 0.055,
  );
  const material = new THREE.MeshBasicMaterial({
    blending: THREE.AdditiveBlending,
    color,
    opacity: pulse ? 0.62 : 0.38,
    transparent: true,
  });
  const cable = new THREE.Mesh(geometry, material);
  cable.position.set((from.x + to.x) / 2, 0.255, (from.z + to.z) / 2);
  cable.userData.pulse = pulse;
  group.add(cable);
}

export function createNetworkLines(
  rackPositions: THREE.Vector3[],
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'networkTopology';
  if (rackPositions.length < 2) return group;

  const minX = Math.min(...rackPositions.map((position) => position.x)) - 1.3;
  const maxX = Math.max(...rackPositions.map((position) => position.x)) + 1.3;
  const busZ = 0;
  addCableSegment(
    group,
    new THREE.Vector3(minX, 0, busZ),
    new THREE.Vector3(maxX, 0, busZ),
    0x2f9bff,
  );

  rackPositions.forEach((position, index) => {
    const cableColor = index % 5 === 4 ? 0xffb02e : 0x20b8ff;
    const elbow = new THREE.Vector3(position.x, 0, busZ);
    addCableSegment(group, position, elbow, cableColor);

    const junction = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.055, 16),
      new THREE.MeshBasicMaterial({
        color: cableColor,
        opacity: 0.9,
        transparent: true,
      }),
    );
    junction.position.set(position.x, 0.285, busZ);
    group.add(junction);
  });

  return group;
}
