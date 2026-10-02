import { ISLANDS } from '../../../utils/constants';
import Kenney from '../Kenney';
import { MODEL } from '../../../utils/models';
import IslandBed from './IslandBed';

// Generous organic cluster of grass/stone platforms forming the main plaza
const TILES = [
  [0, 0, 0],
  [2.4, 0, 0.2],
  [-2.4, 0, -0.2],
  [1.3, 0, 2.2],
  [-1.2, 0, 2.3],
  [1.3, 0, -2.2],
  [-1.4, 0, -2.1],
  [4.4, 0, 1.3],
  [-4.2, 0, 1.5],
  [4.1, 0, -1.8],
  [-3.9, 0, -1.9],
  [0.2, 0, 4.2],
  [0.4, 0, -4.1],
  [2.8, 0, 3.4],
  [-2.9, 0, -3.3],
  [5.2, 0, -0.4],
];

const GRASS_TUFT = [
  [2.9, 0, 2.6],
  [-2.7, 0, 2.9],
  [3.7, 0, -0.8],
  [-3.8, 0, 0.5],
  [1.9, 0, -3.4],
  [-1.1, 0, 3.8],
  [4.8, 0, 0.4],
  [-4.6, 0, -1.1],
  [0.5, 0, 4.9],
];

const FLOWERS = [
  [2.1, 0, 1.3],
  [-1.7, 0, 1.9],
  [3.1, 0, -1.4],
  [-3.3, 0, -0.9],
  [0.8, 0, 3.1],
  [-2.1, 0, -2.6],
  [3.6, 0, 1.9],
];

export default function ArrivalPlaza() {
  const { position, radius } = ISLANDS.plaza;

  return (
    <group position={position}>
      {/* Sculpted floating island base with crags and satellites */}
      <IslandBed
        radius={radius}
        top="#6e916a"
        cliff="#53493e"
        under="#362f29"
        accentGlow="#5eead4"
      />

      {/* Surface platform tiles */}
      {TILES.map((p, i) => (
        <Kenney
          key={`t${i}`}
          url={MODEL.platform}
          position={p}
          scale={2.1}
          rotation={[0, (i * Math.PI) / 3.5, 0]}
        />
      ))}

      {/* Centerpiece: The Ancient Reflection Pool */}
      <Kenney
        url={MODEL.fountain}
        position={[0.1, 0, 0.15]}
        scale={1.25}
        glow={0.8}
        emissive="#5eead4"
      />

      {/* Welcoming Waypoint Signs */}
      <Kenney
        url={MODEL.sign}
        position={[-2.8, 0, 3.6]}
        rotation={[0, 0.55, 0]}
        scale={1.3}
      />

      {/* Bioluminescent Plaza Lanterns */}
      <Kenney
        url={MODEL.lantern}
        position={[1.8, 0, -1.1]}
        scale={1.25}
        glow={1.4}
        emissive="#ffb347"
      />
      <Kenney
        url={MODEL.lantern}
        position={[-1.7, 0, 1.1]}
        scale={1.2}
        glow={1.4}
        emissive="#ffb347"
      />
      <Kenney
        url={MODEL.lantern}
        position={[4.8, 0, 2.2]}
        scale={1.1}
        glow={1.25}
        emissive="#ffb347"
      />

      {/* Ancient Grove Trees */}
      <Kenney
        url={MODEL.oak}
        position={[-4.8, 0, 2.8]}
        scale={1.5}
        glow={0.2}
        emissive="#86efac"
      />
      <Kenney
        url={MODEL.tree}
        position={[5.1, 0, -2.5]}
        scale={1.35}
        glow={0.2}
        emissive="#86efac"
      />
      <Kenney
        url={MODEL.tree}
        position={[4.2, 0, 3.4]}
        scale={1.15}
        glow={0.18}
        emissive="#86efac"
      />
      <Kenney
        url={MODEL.pine}
        position={[-5.2, 0, -2.2]}
        scale={1.3}
        glow={0.22}
        emissive="#86efac"
      />

      {/* Pier / Departure Railing toward the Bridge */}
      <Kenney
        url={MODEL.fence}
        position={[5.6, 0, -2.9]}
        rotation={[0, 0.45, 0]}
        scale={1.2}
      />
      <Kenney
        url={MODEL.fence}
        position={[6.4, 0, -4.1]}
        rotation={[0, 0.45, 0]}
        scale={1.2}
      />

      {/* Natural Vegetation & Stacking Rocks */}
      {GRASS_TUFT.map((p, i) => (
        <Kenney
          key={`g${i}`}
          url={MODEL.grass}
          position={p}
          scale={0.95 + (i % 3) * 0.15}
          rotation={[0, i * 1.1, 0]}
        />
      ))}
      {FLOWERS.map((p, i) => (
        <Kenney
          key={`f${i}`}
          url={MODEL.flower}
          position={p}
          scale={0.9}
          rotation={[0, i * 1.3, 0]}
          glow={0.6}
          emissive="#fb7185"
        />
      ))}

      <Kenney url={MODEL.rockSmall} position={[-4.5, 0, -3.1]} scale={1.2} />
      <Kenney url={MODEL.rockLarge} position={[-3.5, 0, -4.2]} scale={1.1} />
      <Kenney url={MODEL.stone} position={[3.4, 0, 3.9]} scale={1.35} />
    </group>
  );
}
