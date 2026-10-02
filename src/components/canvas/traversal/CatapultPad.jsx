import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TRAVERSAL } from '../../../utils/constants';
import Kenney from '../Kenney';
import { MODEL } from '../../../utils/models';

export default function CatapultPad() {
  const shroomRef = useRef();
  const sporesRef = useRef();
  const runeRef = useRef();

  useFrame(() => {
    const time = performance.now();
    // Subtle rhythmic squish-and-stretch breathing pulse (anticipating bounce)
    if (shroomRef.current) {
      const pulse = Math.sin(time * 0.0035);
      shroomRef.current.scale.y = 1.5 + pulse * 0.08;
      shroomRef.current.scale.x = 1.5 - pulse * 0.04;
      shroomRef.current.scale.z = 1.5 - pulse * 0.04;
    }
    // Rotating ground rune
    if (runeRef.current) {
      runeRef.current.rotation.z += 0.008;
    }
    // Drifting bioluminescent spores
    if (sporesRef.current) {
      sporesRef.current.children.forEach((spore, i) => {
        const offset = i * 1.5;
        const progress = ((time * 0.001 + offset) % 2) / 2; // 0 to 1
        spore.position.y = 0.4 + progress * 1.8;
        spore.position.x = Math.cos(time * 0.002 + i) * (0.35 + progress * 0.25);
        spore.position.z = Math.sin(time * 0.002 + i) * (0.35 + progress * 0.25);
        spore.scale.setScalar((1 - progress) * 0.12);
      });
    }
  });

  return (
    <group position={TRAVERSAL.catapult.position}>
      {/* Stone Pedestal Base */}
      <Kenney url={MODEL.stone} position={[0.4, 0, 0.2]} scale={1.3} />
      <Kenney url={MODEL.stone} position={[-0.45, 0, -0.3]} scale={1.2} />
      <Kenney url={MODEL.grass} position={[0.65, 0, -0.4]} scale={0.75} />

      {/* Bioluminescent Launch Glyph Ring */}
      <mesh
        ref={runeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.08, 0]}
      >
        <ringGeometry args={[0.55, 0.85, 16]} />
        <meshBasicMaterial color="#fb7185" transparent opacity={0.7} />
      </mesh>

      {/* Pulsing Giant Bouncy Mushroom */}
      <group ref={shroomRef} position={[0, 0.1, 0]}>
        <Kenney
          url={MODEL.mushroom}
          position={[0, 0, 0]}
          scale={1}
          glow={1.25}
          emissive="#fb7185"
        />
      </group>

      {/* Ascending Spore Motes */}
      <group ref={sporesRef}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, 0, 0]}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color="#fda4af" transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
