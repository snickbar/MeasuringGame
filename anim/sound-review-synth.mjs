// Generated from the game's actual synth functions.
export async function playSynth(name,volume=1){
const ctx=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();if(volume<=0)return ctx;
const animAudio={ctx},localSoundEnabled=true,hsVol=v=>v*volume;let hsLaughCtx=ctx;function animAudioInit(){}
  function animTone(freq, at, len, vol, type) {
    const ctx = animAudio.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(at);
    o.stop(at + len + 0.05);
  }
const ANIM_SYNTH={
    // Zoom back out: a soft descending "bloop".
    zoomback(vol) {
      const ctx = animAudio.ctx;
      const at = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(620, at);
      o.frequency.exponentialRampToValueAtTime(170, at + 0.5);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(at);
      o.stop(at + 0.6);
    },
    // The answer: a bright little bell run, three notes climbing, with a sparkle on top.
    reveal(vol) {
      const at = animAudio.ctx.currentTime;
      [[784, 0], [988, 0.11], [1319, 0.22]].forEach(([f, d]) => {
        animTone(f, at + d, 0.55, vol * 0.7, "triangle");
        animTone(f * 2, at + d, 0.35, vol * 0.25, "sine");
      });
      animTone(2637, at + 0.36, 0.7, vol * 0.3, "sine");
    },
  };
  function hsClink() {
    if (!localSoundEnabled) return;
    try {
      animAudioInit(); if (!animAudio) return;
      const at = animAudio.ctx.currentTime, f = 2300 + Math.random() * 600;
      animTone(f, at, 0.14, hsVol(0.22), "triangle"); animTone(f * 1.5, at + 0.025, 0.12, hsVol(0.13), "sine"); animTone(f * 2.4, at, 0.06, hsVol(0.06), "sine");
    } catch (e) { /* sound is optional */ }
  }
  function hsKnock() {
    if (!localSoundEnabled) return;
    try {
      animAudioInit(); if (!animAudio) return;
      const at = animAudio.ctx.currentTime;
      // phone speakers can't play low thumps, so it's a bright wooden "tok-tok" instead
      animTone(920, at, 0.07, hsVol(0.55), "triangle"); animTone(1840, at, 0.03, hsVol(0.2), "square");
      animTone(760, at + 0.14, 0.08, hsVol(0.55), "triangle"); animTone(1520, at + 0.14, 0.03, hsVol(0.2), "square");
    } catch (e) { /* sound is optional */ }
  }
  function hsLaugh() {
    try {
      const vol = volume;
      if (vol <= 0) return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      hsLaughCtx = hsLaughCtx || new AC();
      const c = hsLaughCtx; if (c.state === "suspended") c.resume();
      const t0 = c.currentTime + 0.02;
      for (let k = 0; k < 4; k++) {
        const t = t0 + k * 0.17, f = 330 - k * 28;
        const o = c.createOscillator(), o2 = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain();
        o.type = "sawtooth"; o2.type = "square";
        o.frequency.setValueAtTime(f * 1.25, t); o.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.14);
        o2.frequency.setValueAtTime(f * 2.5, t); o2.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.14);
        bp.type = "bandpass"; bp.frequency.value = 900 + k * 60; bp.Q.value = 2.2;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * vol, t + 0.025); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        o.connect(bp); o2.connect(bp); bp.connect(g); g.connect(c.destination);
        o.start(t); o2.start(t); o.stop(t + 0.16); o2.stop(t + 0.16);
      }
    } catch (e) { /* sound is optional */ }
  }
if(name==='reveal')ANIM_SYNTH.reveal(.5*volume);else if(name==='hs-clink')hsClink();else if(name==='hs-knock')hsKnock();else if(name==='hs-laugh')hsLaugh();return ctx;}
