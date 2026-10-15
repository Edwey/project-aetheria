/**
 * Weather module - Weather particle rendering (rain, sand, snow, spore).
 * Ported from game.js seedWeather/setWeather/updateWeather().
 */

import * as THREE from 'three';

/**
 * Weather particle system state.
 */
export class WeatherSystem {
  constructor(scene, coarse) {
    this.scene = scene;
    this.coarse = coarse;
    this.WN = coarse ? 350 : 650;
    this.RX = 18;
    this.YLO = -6;
    this.YHI = 11;

    this.wxBase = new Float32Array(this.WN * 3);
    this.wxVel = new Float32Array(this.WN * 3);
    this.wxPosArr = new Float32Array(this.WN * 3);
    this.wxGeo = new THREE.BufferGeometry();
    this.wxGeo.setAttribute('position', new THREE.BufferAttribute(this.wxPosArr, 3));

    this.wxMat = new THREE.PointsMaterial({
      size: 4,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      color: 0xffffff
    });
    this.wxPoints = new THREE.Points(this.wxGeo, this.wxMat);
    this.wxPoints.frustumCulled = false;
    this.wxPoints.visible = false;
    scene.add(this.wxPoints);

    this.rainPos = new Float32Array(this.WN * 6);
    this.rainGeo = new THREE.BufferGeometry();
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3));
    this.rainLines = new THREE.LineSegments(
      this.rainGeo,
      new THREE.LineBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.55 })
    );
    this.rainLines.frustumCulled = false;
    this.rainLines.visible = false;
    scene.add(this.rainLines);

    this.wxCur = 'none';
    this.wxAmt = 0;
    this.wxCur = 'none';
    this.wxAmt = 0;
    this.wxBase = new Float32Array(this.WN * 3);
    this.wxVel = new Float32Array(this.WN * 3);
    this.wxPosArr = new Float32Array(this.WN * 3);
    this.wxGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.WN * 3), 3));
    this.wxPoints = null;
    this.rainLines = null;
    this.rainGeo = null;
    this.rainPos = null;
  }

  /**
   * Seed weather particles.
   * @param {string} type - Weather type ('rain', 'sand', 'snow', 'spore')
   * @param {THREE.Vector3} tgt - Target position
   */
  seedWeather(type, tgt) {
    const { wxBase, wxVel, WN, RX, YLO, YHI } = this;
    for (let i = 0; i < this.WN; i++) {
      wxBase[3*i] = tgt.x + (Math.random() * 2 - 1) * this.RX;
      wxBase[3*i+1] = tgt.y + this.YLO + Math.random() * (this.YHI - this.YLO);
      wxBase[3*i+2] = tgt.z + (Math.random() * 2 - 1) * this.RX;
      let vx = 0, vy = 0, vz = 0;
      if (type === 'rain') { vy = -24 - Math.random() * 4; }
      else if (type === 'sand') { vx = 2 + Math.random() * 2; vy = (Math.random() - 0.5) * 0.8; }
      else if (type === 'snow') { vx = (Math.random() - 0.5) * 0.8; vy = -1.4 - Math.random() * 0.8; vz = (Math.random() - 0.5) * 0.8; }
      else if (type === 'spore') { vx = (Math.random() - 0.5) * 0.7; vy = 0.7 + Math.random() * 0.8; vz = (Math.random() - 0.5) * 0.7; }
      this.wxVel[3*i] = vx; this.wxVel[3*i+1] = vy; this.wxVel[3*i+2] = vz;
    }
    this.wxMat.color.setHex(type === 'sand' ? 0xf3d58a : type === 'spore' ? 0xa5ffe6 : 0xffffff);
    this.wxMat.blending = type === 'spore' ? THREE.AdditiveBlending : THREE.NormalBlending;
    this.wxMat.needsUpdate = true;
    this.wxMat.size = type === 'snow' ? 5 : 4;
  }

  setWeather(type) {
    this.wxCur = type;
    this.wxPoints.visible = type === 'sand' || type === 'snow' || type === 'spore';
    this.rainLines.visible = type === 'rain';
    if (type !== 'none') this.seedWeather(type);
  }

  updateWeather(dt, tgt, cx, cy, cz, inpWind, curWxType, curWxAmt) {
    // Update weather transition
    this.wxCur = curWxType;
    this.wxAmt += (curWxAmt - this.wxAmt) * Math.min(1, dt * 3);
    
    if (this.wxCur !== 'none') {
      const cx = tgt.x, cy = tgt.y, cz = tgt.z;
      const d2 = this.RX * 2;
      const WFAC = { rain: 0.3, sand: 1.0, snow: 0.6, spore: 0.5 };
      const wf = WFAC[this.wxCur] || 1.0;
      const wd = inpWind;
      const live = Math.max(1, Math.floor(this.WN * Math.min(1, this.wxAmt + 0.02)));

      for (let i = 0; i < this.WN; i++) {
        const k = 3 * i;
        this.wxBase[k] += (this.wxVel[k] + wd[0] * wf) * dt;
        this.wxBase[k+1] += (this.wxVel[k+1] + (this.wxCur === 'rain' ? 0 : inpWind[1] * 0.4)) * dt;
        this.wxBase[k+2] += (this.wxVel[k+2] + inpWind[2] * 1.0) * dt;
        
        if (this.wxCur === 'snow' || this.wxCur === 'spore') {
          this.wxBase[k] += Math.sin(this.wxBase[k+1] * 1.3 + i) * 0.4 * dt;
          this.wxBase[k+2] += Math.cos(this.wxBase[k+1] * 1.1 + i) * 0.4 * dt;
        }
        
        if (this.wxBase[k] < cx - this.RX) this.wxBase[k] += this.RX * 2;
        else if (this.wxBase[k] > cx + this.RX) this.wxBase[k] -= this.RX * 2;
        
        if (this.wxBase[k+2] < cz - this.RX) this.wxBase[k+2] += this.RX * 2;
        else if (this.wxBase[k+2] > cz + this.RX) this.wxBase[k+2] -= this.RX * 2;
        
        if (this.wxBase[k+1] < cy + this.YLO) this.wxBase[k+1] += (this.YHI - this.YLO);
        else if (this.wxBase[k+1] > cy + this.YHI) this.wxBase[k+1] -= (this.YHI - this.YLO);

        if (this.wxCur === 'rain') {
          const j = 6 * i;
          this.rainPos[j] = this.wxBase[k];
          this.rainPos[j+1] = this.wxBase[k+1];
          this.rainPos[j+2] = this.wxBase[k+2];
          this.rainPos[j+3] = this.wxBase[k] - (this.wxVel[k] + inpWind[0] * 1.0) * 0.025;
          this.rainPos[j+4] = this.wxBase[k+1] - this.wxVel[k+1] * 0.025;
          this.rainPos[j+5] = this.wxBase[k+2] - (this.wxVel[k+2] + inpWind[2] * 1.0) * 0.025;
        } else {
          this.wxPosArr[k] = this.wxBase[k];
          this.wxPosArr[k+1] = this.wxBase[k+1];
          this.wxPosArr[k+2] = this.wxBase[k+2];
        }
      }
      
      if (this.wxCur === 'rain') {
        this.rainGeo.attributes.position.needsUpdate = true;
        this.rainGeo.setDrawRange(0, 2 * Math.max(1, Math.floor(this.WN * Math.min(1, this.wxAmt + 0.02))));
      } else {
        this.wxGeo.attributes.position.needsUpdate = true;
        this.wxGeo.setDrawRange(0, Math.max(1, Math.floor(this.WN * Math.min(1, this.wxAmt + 0.02))));
      }
    }
  }
}

export function createWeatherSystem(scene, coarse) {
  return new WeatherSystem(scene, coarse);
}