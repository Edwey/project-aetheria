/**
 * Ground module - Chunked terrain mesh rendering (6x6 chunks, 40m each)
 * Ported from game.js buildGround() with chunking + frustum culling.
 */

import * as THREE from 'three';
import { makeToon } from './toon.js';

const CHUNK_SIZE = 40; // meters per chunk
const CHUNKS_PER_SIDE = 6; // 6x6 = 36 chunks for 240m world
const CHUNK_SEGMENTS = 80; // 40m / 0.5m cell size = 80 segments

function createCheckerTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 2; const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 2, 2); g.fillStyle = '#e3e8e0'; g.fillRect(1, 0, 1, 1); g.fillRect(0, 1, 1, 1);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; t.encoding = THREE.sRGBEncoding; return t;
}

/**
 * Build all ground chunks for a world.
 * @param {THREE.Scene} scene - Three.js scene
 * @param {object} world - World object from Terrain.build()
 * @param {THREE.Material} material - Ground material (shared)
 * @returns {object} { chunks: Array<THREE.Mesh>, updateCulling: function(cam) }
 */
export function buildGroundChunks(scene, world, material) {
  const A = world.A; // 120
  const cs = world.cs; // 0.5
  const N = world.N; // 240
  const W = N + 1; // 241
  const hg = world.hg;
  const chunkCount = CHUNKS_PER_SIDE;
  const chunkSegments = CHUNK_SEGMENTS;
  const chunkVertices = chunkSegments + 1;
  const chunkWorldSize = CHUNK_SIZE; // 40m

  const chunks = [];

  // Pre-compute UV scale
  const uvScale = 1 / (2 * A); // world is -A to A

  for (let cz = 0; cz < chunkCount; cz++) {
    for (let cx = 0; cx < chunkCount; cx++) {
      // Chunk world bounds
      const chunkMinX = -A + cx * chunkWorldSize;
      const chunkMaxX = chunkMinX + chunkWorldSize;
      const chunkMinZ = -A + cz * chunkWorldSize;
      const chunkMaxZ = chunkMinZ + chunkWorldSize;

      // Grid indices for this chunk
      const startI = cx * chunkSegments;
      const endI = startI + chunkSegments;
      const startJ = cz * chunkSegments;
      const endJ = startJ + chunkSegments;

      const vertCount = chunkVertices * chunkVertices;
      const pos = new Float32Array(vertCount * 3);
      const uv = new Float32Array(vertCount * 2);
      const col = new Float32Array(vertCount * 3);

      let idx = 0;
      for (let j = startJ; j <= endJ; j++) {
        for (let i = startI; i <= endI; i++) {
          const k = j * (N + 1) + i;
          const x = -A + i * cs;
          const z = -A + j * cs;
          const h = hg[k];

          pos[idx * 3] = x;
          pos[idx * 3 + 1] = hg[k];
          pos[idx * 3 + 2] = z;

          uv[idx * 2] = (x + A) * uvScale;
          uv[idx * 2 + 1] = (z + A) * uvScale;

          idx++;
        }
      }

      // Build index buffer
      const triCount = chunkSegments * chunkSegments * 2;
      const idxBuf = new Uint32Array(triCount * 3);
      let q = 0;
      for (let j = 0; j < chunkSegments; j++) {
        for (let i = 0; i < chunkSegments; i++) {
          const a = j * chunkVertices + i;
          const b = a + 1;
          const c = a + chunkVertices;
          const d = c + 1;
          idxBuf[q++] = a; idxBuf[q++] = c; idxBuf[q++] = b;
          idxBuf[q++] = b; idxBuf[q++] = c; idxBuf[q++] = d;
        }
      }

      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(new THREE.BufferAttribute(idxBuf, 1));
      g.computeVertexNormals();

      // Compute vertex colors
      const nrm = g.attributes.normal;
      const colArr = new Float32Array(vertCount * 3);
      for (let k = 0; k < vertCount; k++) {
        const ny = nrm.getY(k);
        const x = pos[k * 3];
        const z = pos[k * 3 + 2];
        const h = pos[k * 3 + 1];
        if (world.colorAt) {
          const c = world.colorAt(x, z, h, ny);
          colArr[k * 3] = c[0];
          colArr[k * 3 + 1] = c[1];
          colArr[k * 3 + 2] = c[2];
        } else {
          const t = Math.min(1, Math.max(0, (0.94 - ny) / 0.2));
          const lift = 0.04 * h;
          for (let m = 0; m < 3; m++) {
            colArr[k * 3 + m] = Math.min(1, world.ground[m] * (1 - t) + world.dirt[m] * t + lift);
          }
        }
      }
      g.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

      const mesh = new THREE.Mesh(g, material);
      mesh.receiveShadow = true;
      mesh.frustumCulled = false; // We'll do manual culling
      mesh.userData = {
        chunkBounds: {
          minX: chunkMinX, maxX: chunkMaxX,
          minZ: chunkMinZ, maxZ: chunkMaxZ,
          minY: -10, maxY: 20 // generous Y bounds
        }
      };
      scene.add(mesh);
      chunks.push(mesh);
    }
  }

  // Frustum culling
  const frustum = new THREE.Frustum();
  const projScreenMatrix = new THREE.Matrix4();

  function updateCulling(camera) {
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    for (const mesh of chunks) {
      const bounds = mesh.userData.chunkBounds;
      const box = new THREE.Box3(
        new THREE.Vector3(bounds.minX, bounds.minY, bounds.minZ),
        new THREE.Vector3(bounds.maxX, bounds.maxY, bounds.maxZ)
      );
      mesh.visible = frustum.intersectsBox(box);
    }
  }

  return { chunks, updateCulling };
}

/**
 * Create ground material (shared across chunks) using toon shading.
 */
export function createGroundMaterial(world, checkerTexture) {
  return makeToon({
    color: 0xffffff,
    roughness: 0.95,
    vertexColors: true,
    map: world.checker ? checkerTexture : null
  });
}