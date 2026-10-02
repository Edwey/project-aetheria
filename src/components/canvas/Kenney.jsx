import { useMemo } from 'react';
import { Clone, useGLTF } from '@react-three/drei';
import { clone as cloneGltf } from 'three/addons/utils/SkeletonUtils.js';
import { applyToon } from '../../utils/toon';

const prepared = new Map();

function usePrepared(url, glow, emissive) {
  const gltf = useGLTF(url);
  return useMemo(() => {
    const key = `${url}|${glow}|${emissive}`;
    const hit = prepared.get(key);
    if (hit) return hit;
    const root = cloneGltf(gltf.scene);
    applyToon(root, { glow, emissive });
    prepared.set(key, root);
    return root;
  }, [gltf.scene, url, glow, emissive]);
}

export default function Kenney({
  url,
  glow = 0.28,
  emissive = '#5eead4',
  position,
  rotation,
  scale = 1,
}) {
  const source = usePrepared(url, glow, emissive);
  return <Clone object={source} position={position} rotation={rotation} scale={scale} />;
}
