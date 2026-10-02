import { ISLANDS } from '../../../utils/constants';
import Kenney from '../Kenney';
import { MODEL } from '../../../utils/models';
import IslandBed from './IslandBed';

const TILES = [
  [0, 0, 0],
  [2.15, 0, 0.15],
  [-2.2, 0, 0.1],
  [1.1, 0, 2.05],
  [-1.15, 0, 2.0],
  [1.2, 0, -2.0],
  [-1.05, 0, -2.1],
  [3.5, 0, -0.95],
  [-3.55, 0, 1.25],
  [0.3, 0, 3.5],
  [-0.3, 0, -3.4],
  [2.7, 0, 2.6],
  [-2.6, 0, -2.5],
];

export default function CreatorWell() {
  const { position, radius } = ISLANDS.well;

  return (
    <group position={position}>
      <IslandBed
        radius={radius}
        top="#657b66"
        cliff="#443e4f"
        under="#2a2533"
        accentGlow="#a78bfa"
      />

      {TILES.map((p, i) => (
        <Kenney
          key={`t${i}`}
          url={MODEL.platform}
          position={p}
          scale={1.85}
          rotation={[0, (i * Math.PI) / 3, 0]}
        />
      ))}

      {/* The Creator's Wishing Well / Starlight Font */}
      <Kenney
        url={MODEL.fountain}
        position={[0, 0, 0.15]}
        scale={1.15}
        glow={1.1}
        emissive="#818cf8"
      />

      {/* Mysterious Starlight Lanterns */}
      <Kenney
        url={MODEL.lantern}
        position={[1.9, 0, 1.5]}
        scale={1.15}
        glow={1.5}
        emissive="#c4b5fd"
      />
      <Kenney
        url={MODEL.lantern}
        position={[-1.85, 0, -1.35]}
        scale={1.1}
        glow={1.5}
        emissive="#c4b5fd"
      />

      {/* Changelog & Dev Wishing Tablets */}
      <Kenney
        url={MODEL.sign}
        position={[2.9, 0, -1.5]}
        rotation={[0, -0.65, 0]}
        scale={1.25}
      />
      <Kenney
        url={MODEL.sign}
        position={[3.45, 0, -0.4]}
        rotation={[0, -0.5, 0]}
        scale={1.15}
      />

      {/* Ancient Grove Trees */}
      <Kenney
        url={MODEL.oak}
        position={[-3.8, 0, -1.8]}
        scale={1.35}
        glow={0.22}
        emissive="#86efac"
      />
      <Kenney
        url={MODEL.tree}
        position={[3.8, 0, 1.9]}
        scale={1.15}
        glow={0.2}
        emissive="#86efac"
      />
      <Kenney
        url={MODEL.pine}
        position={[-1.2, 0, -3.6]}
        scale={1.2}
        glow={0.22}
        emissive="#86efac"
      />

      {/* Overlook Observation Railing overlooking the cloud abyss */}
      <Kenney
        url={MODEL.fence}
        position={[-3.9, 0, 0.25]}
        rotation={[0, Math.PI / 2.1, 0]}
        scale={1.15}
      />
      <Kenney
        url={MODEL.fence}
        position={[-3.85, 0, 1.55]}
        rotation={[0, Math.PI / 2.1, 0]}
        scale={1.15}
      />

      {/* Altar rocks & flora */}
      <Kenney url={MODEL.rockLarge} position={[-2.5, 0, 2.5]} scale={1.1} />
      <Kenney url={MODEL.stone} position={[1.8, 0, 3.1]} scale={1.2} />
      <Kenney
        url={MODEL.flower}
        position={[1.5, 0, -2.1]}
        scale={0.9}
        glow={0.65}
        emissive="#c4b5fd"
      />
      <Kenney url={MODEL.grass} position={[-1.7, 0, 2.3]} scale={0.9} />
      <Kenney url={MODEL.grass} position={[2.8, 0, 0.8]} scale={0.85} />
    </group>
  );
}
