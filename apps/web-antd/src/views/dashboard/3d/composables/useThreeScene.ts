import { ref, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  SCENE_BACKGROUND,
  AMBIENT_LIGHT_COLOR,
  AMBIENT_LIGHT_INTENSITY,
  DIRECTIONAL_LIGHT_COLOR,
  DIRECTIONAL_LIGHT_INTENSITY,
  CAMERA_POSITION,
  CAMERA_LOOK_AT,
  GRID_SIZE,
  GRID_DIVISIONS,
} from '../constants';

export function useThreeScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const renderer = ref<THREE.WebGLRenderer | null>(null);
  const controls = ref<OrbitControls | null>(null);
  let animationId = 0;

  function init(container: HTMLElement) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 场景
    scene.background = new THREE.Color(SCENE_BACKGROUND);

    // 相机
    camera.aspect = width / height;
    camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
    camera.lookAt(CAMERA_LOOK_AT.x, CAMERA_LOOK_AT.y, CAMERA_LOOK_AT.z);
    camera.updateProjectionMatrix();

    // 渲染器
    renderer.value = new THREE.WebGLRenderer({ antialias: true });
    renderer.value.setSize(width, height);
    renderer.value.setPixelRatio(window.devicePixelRatio);
    renderer.value.shadowMap.enabled = true;
    container.appendChild(renderer.value.domElement);

    // 控制器
    controls.value = new OrbitControls(camera, renderer.value.domElement);
    controls.value.enableDamping = true;
    controls.value.dampingFactor = 0.05;
    controls.value.minDistance = 5;
    controls.value.maxDistance = 80;
    controls.value.maxPolarAngle = Math.PI / 2.2;

    // 光照
    const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 地面网格
    const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, 0x444466, 0x222244);
    scene.add(gridHelper);

    // 地面
    const floorGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x16162a,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // 响应窗口大小变化
    window.addEventListener('resize', onResize);

    // 动画循环
    animate();
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.value?.update();
    if (renderer.value) {
      renderer.value.render(scene, camera);
    }
  }

  function onResize() {
    if (!renderer.value) return;
    const container = renderer.value.domElement.parentElement;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.value.setSize(width, height);
  }

  function dispose() {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onResize);
    controls.value?.dispose();
    renderer.value?.dispose();
  }

  onUnmounted(() => {
    dispose();
  });

  return {
    scene,
    camera,
    renderer,
    controls,
    init,
    dispose,
  };
}
