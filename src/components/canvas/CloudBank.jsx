import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getToonRamp } from '../../utils/toon';
import { cycleClock } from '../../utils/cycleClock';
import { PALETTE } from '../../utils/constants';

const COUNT = 64;
const cloudDay = new THREE.Color('#ffffff');
const cloudNight = new THREE.Color('#1e1c3c');
const seaDay = new THREE.Color('#8bc4e8');
const seaNight = new THREE.Color('#0a0e1c');

export default function CloudBank() {
  const mesh = useRef();
  const seaRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Outer expansive cloud formations spanning radius 28 to 85, down at y = -6 to -14
  const seeds = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2 + (i % 7) * 0.22;
      // Generous distance to frame the entire archipelago without blocking any island
      const r = 32 + (i % 8) * 6.5 + (i % 3) * 3;
      return {
        x: Math.cos(angle) * r,
        y: -7.5 - (i % 5) * 1.4,
        z: Math.sin(angle) * (r * 0.92),
        sx: 2.8 + (i % 5) * 0.8,
        sy: 1.6 + (i % 4) * 0.6,
        sz: 2.8 + (i % 5) * 0.8,
        rotY: i * 0.45,
        driftSpeed: 0.015 + (i % 4) * 0.008,
      };
    });
  }, []);

  useFrame(() => {
    const time = performance.now();
    const dayMix = cycleClock.dayMix;

    if (mesh.current) {
      seeds.forEach((c, i) => {
        const bob = Math.sin(time * 0.0003 + i) * 0.35;
        dummy.position.set(c.x, c.y + bob, c.z);
        dummy.rotation.set(0.08, c.rotY + time * 0.00003 * c.driftSpeed, 0.05);
        dummy.scale.set(c.sx, c.sy, c.sz);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
      if (mesh.current.material) {
        mesh.current.material.color.lerpColors(cloudNight, cloudDay, dayMix);
      }
    }

    if (seaRef.current && seaRef.current.material) {
      seaRef.current.material.color.lerpColors(seaNight, seaDay, dayMix);
    }
  });

  const ramp = getToonRamp();

  return (
    <group>
      {/* 1. Deep Vast Cloud-Sea Floor */}
      <mesh ref={seaRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -11, 0]}>
        <circleGeometry args={[140, 48]} />
        <meshToonMaterial color={PALETTE.abyss} gradientMap={ramp} />
      </mesh>

      {/* 2. Soft Distant Horizon Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8.5, 0]}>
        <ringGeometry args={[65, 120, 36]} />
        <meshBasicMaterial color="#3b4260" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* 3. Expansive Drifting Cloud Sea Puffs */}
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshToonMaterial color="#f0f4f8" gradientMap={ramp} />
      </instancedMesh>
    </group>
  );
}
