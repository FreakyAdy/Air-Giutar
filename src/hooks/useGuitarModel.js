import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { buildGuitarGroup } from '../utils/guitarGeometry';
import {
  landmarkToWorld,
  wristToNeckAngle,
  handBoundingSpan,
  mirrorLandmark,
  WRIST,
  FINGERS,
} from '../utils/landmarkHelpers';

export function useGuitarModel(containerRef, { bodyStyle = 'classic', showFretLabels = true } = {}) {
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const guitarRef = useRef(null);
  const animIdRef = useRef(null);
  const bodyStyleRef = useRef(bodyStyle);

  const initScene = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(2, 3, 4);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-2, 1, 2);
    scene.add(fill);

    const guitar = buildGuitarGroup(bodyStyleRef.current);
    guitar.visible = false;
    scene.add(guitar);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    guitarRef.current = guitar;

    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animIdRef.current);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [containerRef]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  const rebuildGuitar = useCallback((style) => {
    const scene = sceneRef.current;
    const old = guitarRef.current;
    if (!scene) return;

    if (old) scene.remove(old);
    bodyStyleRef.current = style;
    const guitar = buildGuitarGroup(style);
    guitar.visible = old?.visible ?? false;
    scene.add(guitar);
    guitarRef.current = guitar;
  }, []);

  const updateGuitarFromHand = useCallback(
    (leftLandmarks, videoWidth, videoHeight, mirror = true) => {
      const guitar = guitarRef.current;
      const camera = cameraRef.current;
      if (!guitar || !camera || !leftLandmarks) {
        if (guitar) guitar.visible = false;
        return null;
      }

      guitar.visible = true;

      const wrist = mirrorLandmark(leftLandmarks[WRIST], mirror);
      const midMCP = mirrorLandmark(leftLandmarks[FINGERS.middle.mcp], mirror);

      const wristWorld = landmarkToWorld(wrist, videoWidth, videoHeight, camera);
      const span = handBoundingSpan(leftLandmarks);
      const scale = THREE.MathUtils.clamp(span * 3.5, 0.4, 1.8);

      const angle = Math.atan2(midMCP.y - wrist.y, midMCP.x - wrist.x);

      guitar.position.copy(wristWorld);
      guitar.rotation.z = angle + Math.PI / 2;
      guitar.scale.setScalar(scale);

      // Normalized string X positions along neck for pluck detection
      const stringCount = guitar.userData.stringCount ?? 6;
      const spread = 0.12;
      const centerX = wrist.x;
      const stringPositions = [];
      for (let i = 0; i < stringCount; i++) {
        const offset = (i - (stringCount - 1) / 2) * (spread / Math.max(1, stringCount - 1));
        stringPositions.push(centerX + offset * (mirror ? -1 : 1));
      }

      return { stringPositions, wrist, scale };
    },
    []
  );

  const setFretLabelsVisible = useCallback((visible) => {
    const markers = guitarRef.current?.getObjectByName('fretMarkers');
    if (markers) markers.visible = visible;
  }, []);

  return {
    sceneRef,
    cameraRef,
    rendererRef,
    guitarRef,
    updateGuitarFromHand,
    rebuildGuitar,
    setFretLabelsVisible,
  };
}
