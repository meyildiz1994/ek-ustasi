/**
 * Sound effects and ambient music (spec §12). All sounds are synthesised by tools/audio/synth.ts.
 * Effects use one preloaded player each and restart from 0 on every play; music loops.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const SFX = {
  tick_0: require('../../assets/sounds/tick_0.wav'),
  tick_1: require('../../assets/sounds/tick_1.wav'),
  tick_2: require('../../assets/sounds/tick_2.wav'),
  tick_3: require('../../assets/sounds/tick_3.wav'),
  tick_4: require('../../assets/sounds/tick_4.wav'),
  tick_5: require('../../assets/sounds/tick_5.wav'),
  tick_6: require('../../assets/sounds/tick_6.wav'),
  tick_7: require('../../assets/sounds/tick_7.wav'),
  tick_8: require('../../assets/sounds/tick_8.wav'),
  tick_9: require('../../assets/sounds/tick_9.wav'),
  word: require('../../assets/sounds/word.wav'),
  bonk: require('../../assets/sounds/bonk.wav'),
  already: require('../../assets/sounds/already.wav'),
  bonus: require('../../assets/sounds/bonus.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  star: require('../../assets/sounds/star.wav'),
  levelEnd: require('../../assets/sounds/levelEnd.wav'),
  ek_0: require('../../assets/sounds/ek_0.wav'),
  ek_1: require('../../assets/sounds/ek_1.wav'),
  ek_2: require('../../assets/sounds/ek_2.wav'),
  ek_3: require('../../assets/sounds/ek_3.wav'),
  ek_4: require('../../assets/sounds/ek_4.wav'),
  ek_5: require('../../assets/sounds/ek_5.wav'),
  ek_6: require('../../assets/sounds/ek_6.wav'),
  ek_7: require('../../assets/sounds/ek_7.wav'),
  ekBreak: require('../../assets/sounds/ekBreak.wav'),
  collect: require('../../assets/sounds/collect.wav'),
  tap: require('../../assets/sounds/tap.wav'),
} as const;

export type Sfx = keyof typeof SFX;

const MUSIC = require('../../assets/sounds/music.wav');

const players = new Map<Sfx, AudioPlayer>();
let music: AudioPlayer | null = null;
let ready = false;

function init() {
  if (ready) return;
  ready = true;
  // Respect the silent switch; mix with the player's own music.
  void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
    () => {},
  );
}

export function playSfx(name: Sfx, volume = 1): void {
  init();
  try {
    let p = players.get(name);
    if (!p) {
      p = createAudioPlayer(SFX[name]);
      players.set(name, p);
    }
    p.volume = volume;
    void p.seekTo(0).then(() => p.play());
  } catch {
    // Audio is a nicety: never let it break the game.
  }
}

export function setMusic(on: boolean): void {
  init();
  try {
    if (on) {
      if (!music) {
        music = createAudioPlayer(MUSIC);
        music.loop = true;
        music.volume = 0.35;
      }
      music.play();
    } else music?.pause();
  } catch {
    // ignore
  }
}

/** Preloads the effects so the first tap is not late. */
export function warmUp(): void {
  init();
  for (const name of Object.keys(SFX) as Sfx[])
    if (!players.has(name)) players.set(name, createAudioPlayer(SFX[name]));
}
