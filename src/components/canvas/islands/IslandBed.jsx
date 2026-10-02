import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getToonRamp } from '../../../utils/toon';

export default function IslandBed({
  radius = 7.5,
  top = '#6f8f6a',
  cliff = '#564d42',
  under = '#3b342e',
  accentGlow = '#5eead4',
}) {
  const motesRef = useRef();
  const satellitesRef = useRef();

  // Procedural satellite mini-crags around the island perimeter
  const satellites = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const angle = (i / 5) * Math.PI * 2 + (i % 2) * 0.35;
      const dist = radius + 1.2 + (i % 3) * 0.9;
      return {
        pos: [
          Math.cos(angle) * dist,
          -0.8 - (i % 3) * 0.6,
          Math.sin(angle) * dist,
        ],
        scale: [0.65 + (i % 2) * 0.35, 0.5 + (i % 3) * 0.25, 0.65 + (i % 2) * 0.3],
        rot: [0.2 * i, 0.5 * i, 0.1 * i],
        speed: 0.8 + (i % 3) * 0.4,
        phase: i * 1.3,
      };
    });
  }, [radius]);

  // Subtle floating motes / bioluminescent dust underneath
  const motes = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + i;
      const r = (radius * 0.45) + (i % 4) * 0.6;
      return {
        baseX: Math.cos(angle) * r,
        baseY: -2.8 - (i % 3) * 0.7,
        baseZ: Math.sin(angle) * r,
        phase: i * 0.9,
      };
    });
  }, [radius]);

  useFrame((_, delta) => {
    if (satellitesRef.current) {
      satellitesRef.current.children.forEach((child, i) => {
        const sat = satellites[i];
        if (sat) {
          child.position.y = sat.pos[1] + Math.sin(performance.now() * 0.0012 * sat.speed + sat.phase) * 0.18;
          child.rotation.y += delta * 0.08 * (i % 2 === 0 ? 1 : -1);
        }
      });
    }
    if (motesRef.current) {
      motesRef.current.children.forEach((child, i) => {
        const m = motes[i];
        if (m) {
          child.position.y = m.baseY + Math.sin(performance.now() * 0.0018 + m.phase) * 0.35;
        }
      });
    }
  });

  const ramp = getToonRamp();

  return (
    <group>
      {/* 1. Lush Grassy Rim & Top Soil Shelf */}
      <mesh receiveShadow castShadow position={[0, -0.4, 0]}>
        <cylinderGeometry args={[radius, radius * 0.92, 0.85, 10]} />
        <meshToonMaterial color={top} gradientMap={ramp} />
      </mesh>

      {/* 2. Stratified Rocky Cliff Midsection */}
      <mesh receiveShadow castShadow position={[0.2, -1.25, -0.15]}>
        <cylinderGeometry args={[radius * 0.88, radius * 0.65, 1.4, 8]} />
        <meshToonMaterial color={cliff} gradientMap={ramp} />
      </mesh>

      {/* 3. Deep Tapered Crag Keystone (Inverted Mountain Base) */}
      <mesh castShadow position={[-0.15, -2.6, 0.2]}>
        <cylinderGeometry args={[radius * 0.62, radius * 0.12, 1.9, 7]} />
        <meshToonMaterial color={under} gradientMap={ramp} />
      </mesh>

      {/* 4. Sharp Hanging Keystone Tip */}
      <mesh castShadow position={[-0.1, -3.9, 0.15]}>
        <coneGeometry args={[radius * 0.16, 1.5, 5]} />
        <meshToonMaterial color={under} gradientMap={ramp} />
      </mesh>

      {/* 5. Floating Satellite Mini-Crags */}
      <group ref={satellitesRef}>
        {satellites.map((sat, i) => (
          <mesh
            key={i}
            position={sat.pos}
            scale={sat.scale}
            rotation={sat.rot}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[0.9, 0]} />
            <meshToonMaterial color={i % 2 === 0 ? top : cliff} gradientMap={ramp} />
          </mesh>
        ))}
      </group>

      {/* 6. Subtle Bioluminescent Floating Motes underneath */}
      <group ref={motesRef}>
        {motes.map((m, i) => (
          <mesh key={i} position={[m.baseX, m.baseY, m.baseZ]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshBasicMaterial color={accentGlow} transparent opacity={0.65} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
