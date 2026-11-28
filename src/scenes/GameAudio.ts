import Phaser from "phaser";
import {
  EXPLOSION_SHAKE_DURATION_MS,
  EXPLOSION_SHAKE_INTENSITY,
} from "../core/config";
import type { RoundOutcomeCue, SoundCueType } from "../core/sound";

const MUTE_REGISTRY_KEY = "isMuted";
const PANEL_CENTER_X = 240;
const PLAYER_PANEL_Y = 266;
const AI_PANEL_Y = 462;
const PLAYER_FUSE_Y = 326;
const AI_FUSE_Y = 522;

// Plays a synthesized sound cue via Web Audio unless the game is muted.
export function playSoundCue(scene: Phaser.Scene, cue: SoundCueType): void {
  if (Boolean(scene.registry.get(MUTE_REGISTRY_KEY))) {
    return;
  }
  if (!(scene.sound instanceof Phaser.Sound.WebAudioSoundManager)) {
    return;
  }

  const context = scene.sound.context;
  if (context.state === "suspended") {
    void context.resume();
  }

  if (cue === "tick") {
    playToneSweep(context, "triangle", 920, 580, 0.04, 0.12, 0);
  } else if (cue === "defuse") {
    playToneSweep(context, "triangle", 523, 523, 0.11, 0.18, 0);
    playToneSweep(context, "triangle", 659, 659, 0.16, 0.2, 0.1);
  } else if (cue === "perfect-defuse") {
    playToneSweep(context, "triangle", 523, 523, 0.1, 0.2, 0);
    playToneSweep(context, "triangle", 659, 659, 0.1, 0.2, 0.09);
    playToneSweep(context, "triangle", 1046, 1046, 0.24, 0.24, 0.18);
  } else if (cue === "spark") {
    playToneSweep(context, "sawtooth", 680, 140, 0.22, 0.18, 0);
  } else if (cue === "explosion") {
    playToneSweep(context, "sawtooth", 150, 32, 0.65, 0.3, 0);
    playNoiseBurst(context, 0.45, 0.25);
  }
}

// Plays the round-end sound and shows a fuse spark or match-end explosion.
export function playRoundOutcomeFeedback(
  scene: Phaser.Scene,
  cue: RoundOutcomeCue,
): void {
  if (cue.sound !== null) {
    playSoundCue(scene, cue.sound);
  }
  if (cue.targetSide === null) {
    return;
  }

  const isPlayerTarget = cue.targetSide === "player";
  if (cue.visualEffect === "spark") {
    drawSparkBurst(scene, isPlayerTarget ? PLAYER_FUSE_Y : AI_FUSE_Y);
  } else if (cue.visualEffect === "explosion") {
    drawExplosionBurst(scene, isPlayerTarget ? PLAYER_PANEL_Y : AI_PANEL_Y);
  }
}

function playToneSweep(
  context: AudioContext,
  waveType: OscillatorType,
  startHz: number,
  endHz: number,
  durationSeconds: number,
  peakGain: number,
  delaySeconds: number,
): void {
  const startTime = context.currentTime + delaySeconds;
  const endTime = startTime + durationSeconds;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = waveType;
  oscillator.frequency.setValueAtTime(startHz, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(endHz, endTime);

  gainNode.gain.setValueAtTime(peakGain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime);
}

function playNoiseBurst(
  context: AudioContext,
  durationSeconds: number,
  peakGain: number,
): void {
  const sampleCount = Math.floor(context.sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let state = 13579;
  for (let index = 0; index < sampleCount; index += 1) {
    state = (state * 16807) % 2147483647;
    channel[index] = state / 1073741823.5 - 1;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gainNode = context.createGain();
  const now = context.currentTime;

  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(480, now);
  gainNode.gain.setValueAtTime(peakGain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(context.destination);
  source.start(now);
  source.stop(now + durationSeconds);
}

function drawSparkBurst(scene: Phaser.Scene, centerY: number): void {
  const outerGlow = scene.add.circle(
    PANEL_CENTER_X,
    centerY,
    28,
    0xf97316,
    0.85,
  );
  const innerCore = scene.add.circle(
    PANEL_CENTER_X,
    centerY,
    14,
    0xfef08a,
    0.95,
  );

  scene.tweens.add({
    targets: [outerGlow, innerCore],
    scale: 1.8,
    alpha: 0,
    duration: 700,
    onComplete: () => {
      outerGlow.destroy();
      innerCore.destroy();
    },
  });
}

function drawExplosionBurst(scene: Phaser.Scene, centerY: number): void {
  scene.cameras.main.flash(350, 255, 165, 60, true);
  scene.cameras.main.shake(
    EXPLOSION_SHAKE_DURATION_MS,
    EXPLOSION_SHAKE_INTENSITY,
    true,
  );

  const fireball = scene.add.circle(
    PANEL_CENTER_X,
    centerY,
    92,
    0xef4444,
    0.85,
  );
  const core = scene.add.circle(PANEL_CENTER_X, centerY, 52, 0xfef08a, 0.95);

  scene.tweens.add({
    targets: [fireball, core],
    scale: 1.9,
    alpha: 0,
    duration: 1100,
    onComplete: () => {
      fireball.destroy();
      core.destroy();
    },
  });
}
