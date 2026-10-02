import { useMemo } from 'react';
import { TRAVERSAL } from '../../../utils/constants';
import Kenney from '../Kenney';
import { MODEL } from '../../../utils/models';

export default function WoodenBridge() {
  const { from, to } = TRAVERSAL.bridge;

  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const length = Math.hypot(dx, dy, dz);
  const yaw = Math.atan2(dx, dz);

  // Number of bridge segments along the span
  const pieceCount = Math.max(5, Math.round(length / 1.85));

  const pieces = useMemo(() => {
    return Array.from({ length: pieceCount }, (_, i) => {
      const t = (i + 0.5) / pieceCount; // 0 to 1 along bridge
      // Smooth catenary sag (slightly lower in the middle, natural suspension feel)
      const sag = Math.sin(t * Math.PI) * 0.22;
      const x = from[0] + dx * t;
      const y = from[1] + dy * t - sag;
      const z = from[2] + dz * t;
      return { pos: [x, y, z], key: i };
    });
  }, [dx, dy, dz, from, pieceCount]);

  // Intermediate floating support keystone midway across
  const midX = (from[0] + to[0]) / 2;
  const midY = (from[1] + to[1]) / 2 - 1.2;
  const midZ = (from[2] + to[2]) / 2;

  return (
    <group>
      {/* 1. Bridge Planks with natural suspension sag */}
      {pieces.map((p) => (
        <Kenney
          key={`br-${p.key}`}
          url={MODEL.bridge}
          position={p.pos}
          rotation={[0, yaw, 0]}
          scale={1.35}
          glow={0.15}
          emissive="#fbbf24"
        />
      ))}

      {/* 2. Anchor posts & lanterns at bridge touch-points */}
      <Kenney
        url={MODEL.stone}
        position={[from[0] - 0.4, from[1] - 0.1, from[2] + 0.3]}
        scale={1.2}
      />
      <Kenney
        url={MODEL.lantern}
        position={[from[0] - 0.5, from[1] + 0.1, from[2] - 0.8]}
        scale={1.05}
        glow={1.2}
        emissive="#ffb347"
      />
      <Kenney
        url={MODEL.lantern}
        position={[to[0] + 0.5, to[1] + 0.1, to[2] + 0.7]}
        scale={1.05}
        glow={1.2}
        emissive="#ffb347"
      />

      {/* 3. Floating Sub-Keystone & Mote underneath the mid-span */}
      <group position={[midX, midY, midZ]}>
        <Kenney url={MODEL.rockLarge} position={[0, 0, 0]} scale={0.9} />
        <mesh position={[0, -0.6, 0]}>
          <coneGeometry args={[0.7, 1.2, 5]} />
          <meshToonMaterial color="#443e37" />
        </mesh>
      </group>
    </group>
  );
}
