import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { CYCLE_DURATION_MS, PALETTE } from '../../utils/constants';
import { cycleClock } from '../../utils/cycleClock';
import { useWorldStore } from '../../stores/useWorldStore';

const daySun = new THREE.Color(PALETTE.daySun);
const nightSun = new THREE.Color(PALETTE.nightSun);
const dayFog = new THREE.Color(PALETTE.dayFog);
const nightFog = new THREE.Color(PALETTE.nightFog);
const dayAmbient = new THREE.Color(PALETTE.dayAmbient);
const nightAmbient = new THREE.Color(PALETTE.nightAmbient);
const daySky = new THREE.Color(PALETTE.daySky);
const nightSky = new THREE.Color(PALETTE.nightSky);
const fogScratch = new THREE.Color();
const skyScratch = new THREE.Color();

export default function DayNightCycle() {
  const sunRef = useRef();
  const ambientRef = useRef();
  const hemiRef = useRef();
  const sunOrb = useRef();
  const moonOrb = useRef();
  const lastLog = useRef(0);
  const lastHud = useRef(0);

  useFrame(({ scene }) => {
    const progress = (Date.now() % CYCLE_DURATION_MS) / CYCLE_DURATION_MS;
    const angle = progress * Math.PI * 2;
    const elevation = Math.sin(angle);
    const isDay = elevation > 0;
    const dayMix = THREE.MathUtils.smoothstep(elevation, -0.18, 0.16);
    const nightGlow = 1 - dayMix;

    cycleClock.progress = progress;
    cycleClock.dayMix = dayMix;
    cycleClock.nightGlow = nightGlow;
    cycleClock.isDay = isDay;

    const sx = Math.cos(angle) * 65;
    const sy = elevation * 55;
    const sz = Math.sin(angle) * 35;

    if (sunRef.current) {
      sunRef.current.position.set(sx, sy, sz);
      sunRef.current.intensity = THREE.MathUtils.lerp(0.28, 1.45, dayMix);
      sunRef.current.color.lerpColors(nightSun, daySun, dayMix);
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.35, 0.48, dayMix);
      ambientRef.current.color.lerpColors(nightAmbient, dayAmbient, dayMix);
    }

    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.22, 0.36, dayMix);
    }

    if (sunOrb.current) {
      sunOrb.current.position.set(sx, sy, sz);
      sunOrb.current.material.opacity = THREE.MathUtils.lerp(0.05, 1, dayMix);
    }
    if (moonOrb.current) {
      moonOrb.current.position.set(-sx, -sy, -sz);
      moonOrb.current.material.opacity = THREE.MathUtils.lerp(0.08, 1, nightGlow);
    }

    fogScratch.lerpColors(nightFog, dayFog, dayMix);
    skyScratch.lerpColors(nightSky, daySky, dayMix);
    if (scene.fog) {
      scene.fog.color.copy(fogScratch);
      scene.fog.near = THREE.MathUtils.lerp(65, 78, dayMix);
      scene.fog.far = THREE.MathUtils.lerp(185, 230, dayMix);
    }
    if (scene.background?.isColor) {
      scene.background.copy(skyScratch);
    }

    scene.traverse((obj) => {
      const mat = obj.material;
      if (!mat || mat.userData?.glow == null) return;
      mat.emissiveIntensity = mat.userData.glow * (0.12 + 0.88 * nightGlow);
    });

    const now = performance.now();
    if (now - lastHud.current > 120) {
      lastHud.current = now;
      const bloomIntensity = THREE.MathUtils.lerp(1.15, 0.08, dayMix);
      useWorldStore.getState().setCycle(progress, isDay, bloomIntensity, dayMix);
    }

    if (import.meta.env.DEV && now - lastLog.current > 1000) {
      lastLog.current = now;
      console.log(
        `[aetheria] t=${progress.toFixed(4)} ${isDay ? 'day' : 'night'} elevation=${elevation.toFixed(3)}`,
      );
    }
  });

  return (
    <>
      <directionalLight
        ref={sunRef}
        castShadow
        intensity={1.3}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
      />
      <ambientLight ref={ambientRef} intensity={0.42} color={PALETTE.dayAmbient} />
      <hemisphereLight
        ref={hemiRef}
        args={[PALETTE.daySky, PALETTE.mossDark, 0.32]}
      />
      <mesh ref={sunOrb}>
        <sphereGeometry args={[1.6, 14, 14]} />
        <meshBasicMaterial color="#ffe9b0" transparent />
      </mesh>
      <mesh ref={moonOrb}>
        <sphereGeometry args={[1.25, 14, 14]} />
        <meshBasicMaterial color="#c7d2fe" transparent />
      </mesh>
      <fog attach="fog" args={[PALETTE.dayFog, 72, 210]} />
    </>
  );
}
