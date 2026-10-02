import { Canvas, useThree } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Suspense, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { ISO_CAMERA, PALETTE } from '../../utils/constants';
import { useWorldStore } from '../../stores/useWorldStore';
import DayNightCycle from './DayNightCycle';
import CloudBank from './CloudBank';
import ArrivalPlaza from './islands/ArrivalPlaza';
import ZenChimeIsle from './islands/ZenChimeIsle';
import CreatorWell from './islands/CreatorWell';
import WoodenBridge from './traversal/WoodenBridge';
import CatapultPad from './traversal/CatapultPad';
import UpdraftVent from './traversal/UpdraftVent';

function FrameCamera() {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.lookAt(...ISO_CAMERA.lookAt);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function NightBloom() {
  const intensity = useWorldStore((s) => s.bloomIntensity);
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.62} intensity={intensity} mipmapBlur />
    </EffectComposer>
  );
}

export default function Scene() {
  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{
        position: ISO_CAMERA.position,
        zoom: ISO_CAMERA.zoom,
        near: ISO_CAMERA.near,
        far: ISO_CAMERA.far,
      }}
      onCreated={({ scene, camera }) => {
        scene.background = new THREE.Color(PALETTE.daySky);
        camera.lookAt(...ISO_CAMERA.lookAt);
      }}
    >
      <AdaptiveDpr />
      <FrameCamera />
      <DayNightCycle />
      <Suspense fallback={null}>
        <CloudBank />
        <ArrivalPlaza />
        <ZenChimeIsle />
        <CreatorWell />
        <WoodenBridge />
        <CatapultPad />
        <UpdraftVent />
      </Suspense>
      <NightBloom />
    </Canvas>
  );
}
