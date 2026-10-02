import { useGLTF } from '@react-three/drei';

export const MODEL = {
  platform: '/models/platform_grass.glb',
  bridge: '/models/bridge_wood.glb',
  pillar: '/models/pillar-stone.glb',
  fountain: '/models/fountain-round.glb',
  mushroom: '/models/mushroom_redTall.glb',
  sign: '/models/sign.glb',
  lantern: '/models/lantern.glb',
  fence: '/models/fence.glb',
  pine: '/models/tree_pineTallA.glb',
  oak: '/models/tree_oak.glb',
  tree: '/models/tree_default.glb',
  rockLarge: '/models/rock_largeA.glb',
  rockSmall: '/models/rock_smallA.glb',
  stone: '/models/stone_smallA.glb',
  flower: '/models/flower_redA.glb',
  grass: '/models/grass.glb',
};

Object.values(MODEL).forEach((url) => useGLTF.preload(url));
