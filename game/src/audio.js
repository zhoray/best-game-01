/**
 * ORBWARDEN - WebAudio Synthesized Sound Effects
 */

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

  function unlock() {
    if (ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.15;
    master.connect(ctx.destination);
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function tone({ freq, freqEnd, type, at = 0, dur = 0.1, vol = 0.5 }) {
    if (!ctx || muted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + at);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + at + dur);
    }

    const startTime = ctx.currentTime + at;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(master);

    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);
  }

  function catchSound(combo) {
    if (!ctx || muted) return;
    const basePitch = 440 * Math.pow(2, (Math.min(combo, 8) - 1) * 2 / 12);
    tone({ freq: basePitch, type: 'sine', dur: 0.09, vol: 0.5 });
  }

  function gold() {
    if (!ctx || muted) return;
    tone({ freq: 880, type: 'sine', at: 0, dur: 0.12, vol: 0.45 });
    tone({ freq: 1174.66, type: 'sine', at: 0.06, dur: 0.12, vol: 0.45 });
    tone({ freq: 1567.98, type: 'sine', at: 0.12, dur: 0.12, vol: 0.45 });
  }

  function damage() {
    if (!ctx || muted) return;
    tone({ freq: 110, freqEnd: 55, type: 'sawtooth', dur: 0.22, vol: 0.6 });
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(58, ctx.currentTime);
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.25);
  }

  function shift() {
    if (!ctx || muted) return;
    tone({ freq: 659.25, type: 'sine', at: 0, dur: 0.14, vol: 0.3 });
    tone({ freq: 987.77, type: 'sine', at: 0.07, dur: 0.14, vol: 0.3 });
  }

  function win() {
    if (!ctx || muted) return;
    tone({ freq: 523.25, type: 'sine', at: 0, dur: 0.3, vol: 0.45 });
    tone({ freq: 659.25, type: 'sine', at: 0.09, dur: 0.3, vol: 0.45 });
    tone({ freq: 783.99, type: 'sine', at: 0.18, dur: 0.3, vol: 0.45 });
    tone({ freq: 1046.5, type: 'sine', at: 0.27, dur: 0.3, vol: 0.45 });
  }

  function lose() {
    if (!ctx || muted) return;
    tone({ freq: 392, type: 'sine', at: 0, dur: 0.34, vol: 0.45 });
    tone({ freq: 329.63, type: 'sine', at: 0.13, dur: 0.34, vol: 0.45 });
    tone({ freq: 261.63, type: 'sine', at: 0.26, dur: 0.34, vol: 0.45 });
    tone({ freq: 196, type: 'sine', at: 0.39, dur: 0.34, vol: 0.45 });
  }

  function setMuted(b) {
    muted = !!b;
  }

  function isMuted() {
    return muted;
  }

  return { unlock, catchSound, gold, damage, shift, win, lose, setMuted, isMuted };
}
