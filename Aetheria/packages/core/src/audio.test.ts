import { describe, it, expect } from 'vitest';
import { AudioManager } from './audio.js';

describe('AudioManager', () => {
  it('instantiates cleanly without throwing in headless environments', () => {
    const audio = new AudioManager();
    expect(audio).toBeDefined();

    // Volume settings update without crashing
    audio.setMasterVolume(0.5);
    audio.setSFXVolume(0.7);
    audio.setMusicVolume(0.4);
    audio.setMuted(true);
    audio.setMuted(false);
  });

  it('safely handles audio trigger calls when Web Audio is uninitialized or in test runner', () => {
    const audio = new AudioManager();

    // Should no-op gracefully without crashing
    expect(() => {
      audio.playBounce(0);
      audio.playBounce(3);
      audio.playFootstep('grass');
      audio.playFootstep('stone');
      audio.playHarvest();
      audio.playCraft();
      audio.playBuildPlace();
      audio.playBuildDismantle();
      audio.playPlateClick(true);
      audio.playWaterSplash(1.5);
      audio.playShockwave();
    }).not.toThrow();
  });
});
