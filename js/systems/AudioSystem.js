class AudioSystem {
  constructor() {
    this._ctx = null;
  }

  _getCtx() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this._ctx;
  }

  _play(type, freq, duration, gain = 0.18, decay = true) {
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.connect(env);
      env.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      env.gain.setValueAtTime(gain, ctx.currentTime);
      if (decay) env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  shoot() {
    this._play('square', 880, 0.08, 0.12);
  }

  explode() {
    try {
      const ctx = this._getCtx();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ctx.createBufferSource();
      const env = ctx.createGain();
      src.buffer = buf;
      src.connect(env);
      env.connect(ctx.destination);
      env.gain.setValueAtTime(0.4, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      src.start();
    } catch (e) {}
  }

  powerup() {
    try {
      const ctx = this._getCtx();
      [440, 660, 880].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.connect(env);
        env.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
        env.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
        env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.15);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.15);
      });
    } catch (e) {}
  }

  hit() {
    this._play('sawtooth', 200, 0.1, 0.2);
  }

  warp() {
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.connect(env);
      env.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.6);
      env.gain.setValueAtTime(0.2, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  }

  menuSelect() {
    this._play('sine', 660, 0.1, 0.15);
  }
}

window.audio = new AudioSystem();
