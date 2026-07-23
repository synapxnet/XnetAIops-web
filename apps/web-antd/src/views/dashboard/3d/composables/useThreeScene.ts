import { onUnmounted, shallowRef } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
  AMBIENT_LIGHT_COLOR,
  AMBIENT_LIGHT_INTENSITY,
  CAMERA_LOOK_AT,
  CAMERA_POSITION,
  DIRECTIONAL_LIGHT_COLOR,
  DIRECTIONAL_LIGHT_INTENSITY,
  GRID_DIVISIONS,
  GRID_SIZE,
  SCENE_THEME,
} from '../constants';

export type CameraView = 'overview' | 'top';

export function useThreeScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null);
  const controls = shallowRef<OrbitControls | null>(null);
  const floorMaterial = new THREE.MeshStandardMaterial({ roughness: 0.86 });
  const platformMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.2,
    roughness: 0.62,
  });
  const platformEdgeMaterial = new THREE.LineBasicMaterial();
  const hemisphereLight = new THREE.HemisphereLight(
    AMBIENT_LIGHT_COLOR,
    0x101820,
    AMBIENT_LIGHT_INTENSITY,
  );

  let animationId = 0;
  let containerElement: HTMLElement | null = null;
  let gridHelper: THREE.GridHelper | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let darkMode = true;

  function createStage() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE),
      floorMaterial,
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.12;
    floor.receiveShadow = true;
    floor.name = 'operationsFloor';
    scene.add(floor);

    const platformGeometry = new THREE.BoxGeometry(28, 0.34, 17.5);
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.02;
    platform.receiveShadow = true;
    platform.name = 'operationsPlatform';
    scene.add(platform);

    const platformEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(platformGeometry),
      platformEdgeMaterial,
    );
    platformEdges.position.copy(platform.position);
    platformEdges.name = 'operationsPlatformEdges';
    scene.add(platformEdges);

    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(
      DIRECTIONAL_LIGHT_COLOR,
      DIRECTIONAL_LIGHT_INTENSITY,
    );
    directionalLight.position.set(16, 24, 12);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.left = -22;
    directionalLight.shadow.camera.right = 22;
    directionalLight.shadow.camera.top = 18;
    directionalLight.shadow.camera.bottom = -18;
    scene.add(directionalLight);

    const coolFill = new THREE.PointLight(0x2f9bff, 22, 42, 2);
    coolFill.position.set(-12, 8, 6);
    scene.add(coolFill);

    const warmFill = new THREE.PointLight(0xffa940, 10, 28, 2);
    warmFill.position.set(11, 5, -5);
    scene.add(warmFill);
  }

  function rebuildGrid() {
    if (gridHelper) {
      scene.remove(gridHelper);
      gridHelper.geometry.dispose();
      const materials = Array.isArray(gridHelper.material)
        ? gridHelper.material
        : [gridHelper.material];
      materials.forEach((material) => material.dispose());
    }

    const palette = darkMode ? SCENE_THEME.dark : SCENE_THEME.light;
    gridHelper = new THREE.GridHelper(
      GRID_SIZE,
      GRID_DIVISIONS,
      palette.gridPrimary,
      palette.gridSecondary,
    );
    gridHelper.position.y = 0.205;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = darkMode ? 0.34 : 0.42;
    gridHelper.name = 'operationsGrid';
    scene.add(gridHelper);
  }

  function setTheme(isDark: boolean) {
    darkMode = isDark;
    const palette = isDark ? SCENE_THEME.dark : SCENE_THEME.light;
    scene.background = new THREE.Color(palette.background);
    scene.fog = new THREE.Fog(palette.fog, 24, 58);
    floorMaterial.color.setHex(palette.floor);
    platformMaterial.color.setHex(palette.platform);
    platformEdgeMaterial.color.setHex(palette.platformEdge);
    hemisphereLight.color.setHex(isDark ? 0x8eb7d8 : 0xffffff);
    hemisphereLight.groundColor.setHex(isDark ? 0x08131c : 0xaab8c4);
    rebuildGrid();
    renderer.value?.setClearColor(palette.background, 1);
  }

  function setCameraView(view: CameraView) {
    const nextPosition =
      view === 'top'
        ? new THREE.Vector3(0, 29, 0.01)
        : new THREE.Vector3(
            CAMERA_POSITION.x,
            CAMERA_POSITION.y,
            CAMERA_POSITION.z,
          );
    camera.position.copy(nextPosition);
    controls.value?.target.set(
      CAMERA_LOOK_AT.x,
      CAMERA_LOOK_AT.y,
      CAMERA_LOOK_AT.z,
    );
    camera.lookAt(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);
    controls.value?.update();
  }

  function setAutoRotate(enabled: boolean) {
    if (!controls.value) return;
    controls.value.autoRotate = enabled;
    controls.value.autoRotateSpeed = 0.6;
  }

  function resize() {
    if (!renderer.value || !containerElement) return;
    const width = Math.max(containerElement.clientWidth, 1);
    const height = Math.max(containerElement.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.value.setSize(width, height, false);
  }

  function init(container: HTMLElement, isDark: boolean) {
    containerElement = container;
    const nextRenderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    nextRenderer.outputColorSpace = THREE.SRGBColorSpace;
    nextRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    nextRenderer.toneMappingExposure = 1.12;
    nextRenderer.shadowMap.enabled = true;
    nextRenderer.shadowMap.type = THREE.PCFShadowMap;
    nextRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.value = nextRenderer;
    container.appendChild(nextRenderer.domElement);

    controls.value = new OrbitControls(camera, nextRenderer.domElement);
    controls.value.enableDamping = true;
    controls.value.dampingFactor = 0.055;
    controls.value.minDistance = 10;
    controls.value.maxDistance = 48;
    controls.value.maxPolarAngle = Math.PI / 2.08;
    controls.value.enablePan = false;

    createStage();
    setTheme(isDark);
    setCameraView('overview');
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    animate();
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.value?.update();

    const topology = scene.getObjectByName('networkTopology');
    if (
      topology &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const pulse = 0.5 + Math.sin(performance.now() * 0.0024) * 0.18;
      topology.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.pulse) {
          const material = child.material as THREE.MeshBasicMaterial;
          material.opacity = pulse;
        }
      });
    }

    if (renderer.value) renderer.value.render(scene, camera);
  }

  function dispose() {
    cancelAnimationFrame(animationId);
    resizeObserver?.disconnect();
    controls.value?.dispose();
    renderer.value?.dispose();
    renderer.value?.domElement.remove();
    floorMaterial.dispose();
    platformMaterial.dispose();
    platformEdgeMaterial.dispose();
    containerElement = null;
  }

  onUnmounted(dispose);

  return {
    camera,
    controls,
    dispose,
    init,
    renderer,
    scene,
    setAutoRotate,
    setCameraView,
    setTheme,
  };
}
