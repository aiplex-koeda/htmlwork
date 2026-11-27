// Web Audio API で効果音を作る（音声ファイル不要）
window.Sound = (() => {
  let ctx = null;
  let enabled = true;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, type = 'sine', dur = 0.25, vol = 0.2, slideTo = null, delay = 0 } = {}) {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function arpeggio(freqs, opts = {}) {
    freqs.forEach((f, i) => tone({ ...opts, freq: f, delay: i * (opts.step || 0.1) }));
  }

  return {
    tone,
    arpeggio,
    setEnabled(v) { enabled = v; },
    isEnabled() { return enabled; },
  };
})();
