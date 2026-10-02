import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TRAVERSAL } from '../../../utils/constants';
import { getToonRamp } from '../../../utils/toon';
import Kenney from '../Kenney';
import { MODEL } from '../../../utils/models';

export default function UpdraftVent() {
  const ring1 = useRef();
  const ring2 = useRef();
  const vortexMotes = useRef();

  useFrame((_, delta) => {
    const time = performance.now();

    // Cascading ascending breeze rings
    if (ring1.current) {
      ring1.current.rotation.y += delta * 0.9;
      ring1.current.position.y = 0.5 + ((time * 0.001) % 2.5) * 1.2;
      const progress = ((time * 0.001) % 2.5) / 2.5;
      ring1.current.scale.setScalar(0.7 + progress * 0.5);
    }
    if (ring2.current) {
      ring2.current.rotation.y -= delta * 1.1;
      ring2.current.position.y = 0.5 + (((time * 0.001 + 1.25) % 2.5) * 1.2);
      const progress = ((time * 0.001 + 1.25) % 2.5) / 2.5;
      ring2.current.scale.setScalar(0.7 + progress * 0.5);
    }

    // Swirling ascending wind vortex motes
    if (vortexMotes.current) {
      vortexMotes.current.children.forEach((mote, i) => {
        const offset = i * 0.8;
        const progress = ((time * 0.0008 + offset) % 3) / 3; // 0 to 1
        const angle = time * 0.002 + (i * Math.PI) / 3;
        const radius = 0.35 + progress * 0.45;
        mote.position.x = Math.cos(angle) * radius;
        mote.position.z = Math.sin(angle) * radius;
        mote.position.y = 0.3 + progress * 3.8;
        mote.scale.setScalar((1 - progress) * 0.1);
      });
    }
  });

  const ramp = getToonRamp();

  return (
    <group position={TRAVERSAL.updraft.position}>
      {/* Stone Crater Vent Perimeter */}
      <Kenney url={MODEL.stone} position={[0.7, 0, 0.3]} scale={1.25} />
      <Kenney url={MODEL.stone} position={[-0.65, 0, -0.35]} scale={1.1} />
      <Kenney url={MODEL.stone} position={[0.1, 0, -0.8]} scale={1.15} />
      <Kenney url={MODEL.grass} position={[0.45, 0, 0.75]} scale={0.8} />

      {/* Geyser Base Opening */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[0.75, 16]} />
        <meshToonMaterial color="#2d5254" gradientMap={ramp} />
      </mesh>

      {/* Ascending Breeze Torus Rings */}
      <mesh ref={ring1} position={[0, 0.5, 0]}>
        <torusGeometry args={[0.7, 0.045, 8, 20]} />
        <meshToonMaterial
          color="#5eead4"
          emissive="#5eead4"
          emissiveIntensity={0.85}
          gradientMap={ramp}
        />
      </mesh>
      <mesh ref={ring2} position={[0, 1.2, 0]}>
        <torusGeometry args={[0.85, 0.04, 8, 20]} />
        <meshToonMaterial
          color="#99f6e4"
          emissive="#5eead4"
          emissiveIntensity={0.7}
          gradientMap={ramp}
        />
      </mesh>

      {/* Rising Ethereal Spiral Motes */}
      <group ref={vortexMotes}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[0, 0, 0]}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color="#a7f3d0" transparent opacity={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
