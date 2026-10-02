import { ISLANDS } from '../../../utils/constants';
import Kenney from '../Kenney';
import { MODEL } from '../../../utils/models';
import IslandBed from './IslandBed';

const TILES = [
  [0, 0, 0],
  [2.2, 0, 0.25],
  [-2.25, 0, -0.2],
  [1.1, 0, 2.1],
  [-1.15, 0, 2.0],
  [1.2, 0, -2.0],
  [-1.05, 0, -2.1],
  [3.7, 0, 1.2],
  [-3.65, 0, -1.1],
  [0.25, 0, 3.65],
  [-0.3, 0, -3.7],
  [2.9, 0, -2.6],
  [-2.8, 0, 2.7],
];

// Pentatonic Harmonic Ring: C4, D4, E4, G4, A4 arranged in an open circle
const PENTATONIC_PILLARS = [
  { note: 'C4', pos: [-2.1, 0, -1.4], rot: 0.3 },
  { note: 'D4', pos: [0.05, 0, -2.35], rot: 0.0 },
  { note: 'E4', pos: [2.15, 0, -1.3], rot: -0.3 },
  { note: 'G4', pos: [2.35, 0, 1.45], rot: -0.8 },
  { note: 'A4', pos: [-1.45, 0, 2.1], rot: 0.8 },
];

export default function ZenChimeIsle() {
  const { position, radius } = ISLANDS.zen;

  return (
    <group position={position}>
      <IslandBed
        radius={radius}
        top="#5b7d60"
        cliff="#484e44"
        under="#2f342d"
        accentGlow="#67e8f9"
      />

      {TILES.map((p, i) => (
        <Kenney
          key={`t${i}`}
          url={MODEL.platform}
          position={p}
          scale={1.9}
          rotation={[0, (i * Math.PI) / 3, 0]}
        />
      ))}

      {/* 5 Pentatonic Chime Pillars with celestial teal glow */}
      {PENTATONIC_PILLARS.map((p, i) => (
        <Kenney
          key={`p${i}`}
          url={MODEL.pillar}
          position={p.pos}
          scale={1.3 + (i % 2) * 0.1}
          rotation={[0, p.rot, 0]}
          glow={1.15}
          emissive="#67e8f9"
        />
      ))}

      {/* Central Meditation Altar: Zen Cairn Rock Stack */}
      <Kenney
        url={MODEL.rockLarge}
        position={[0.1, 0, 0.1]}
        scale={1.5}
        glow={0.45}
        emissive="#a5b4fc"
      />
      <Kenney url={MODEL.rockSmall} position={[0.95, 0, 0.7]} scale={1.05} />
      <Kenney url={MODEL.rockSmall} position={[-0.8, 0, 0.85]} scale={0.9} />
      <Kenney url={MODEL.stone} position={[0.2, 0, -0.65]} scale={1.25} />
      <Kenney url={MODEL.stone} position={[-0.1, 0.95, 0.1]} scale={0.7} />

      {/* Contemplative Whispering Pine Grove */}
      <Kenney
        url={MODEL.pine}
        position={[-3.9, 0, 2.1]}
        scale={1.4}
        glow={0.25}
        emissive="#86efac"
      />
      <Kenney
        url={MODEL.pine}
        position={[3.85, 0, -1.8]}
        scale={1.25}
        glow={0.25}
        emissive="#86efac"
      />
      <Kenney
        url={MODEL.pine}
        position={[2.8, 0, 2.9]}
        scale={0.95}
        glow={0.22}
        emissive="#86efac"
      />
      <Kenney
        url={MODEL.tree}
        position={[-4.2, 0, -1.9]}
        scale={1.1}
        glow={0.2}
        emissive="#86efac"
      />

      {/* Meditation Lanterns */}
      <Kenney
        url={MODEL.lantern}
        position={[-2.6, 0, 2.6]}
        scale={1.15}
        glow={1.3}
        emissive="#fde68a"
      />
      <Kenney
        url={MODEL.lantern}
        position={[3.2, 0, -2.4]}
        scale={1.1}
        glow={1.3}
        emissive="#fde68a"
      />

      {/* Zen Garden Moss & Grass */}
      <Kenney url={MODEL.grass} position={[2.4, 0, 0.5]} scale={0.9} />
      <Kenney url={MODEL.grass} position={[-2.7, 0, -1.5]} scale={0.95} />
      <Kenney url={MODEL.grass} position={[0.6, 0, 2.7]} scale={0.85} />
      <Kenney
        url={MODEL.flower}
        position={[-2.0, 0, 0.3]}
        scale={0.8}
        glow={0.5}
        emissive="#c084fc"
      />
    </group>
  );
}
