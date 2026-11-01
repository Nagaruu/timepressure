/**
 * Web Audio API Synthesizer
 * Zero external asset dependencies; ultra-low-latency non-blocking audio with automatic node cleanup.
 */
(function (global) {
  class SoundFX {
    constructor() {
      this.enabled = true;
      this.ctx = null;
      this.colorFreqs = {
        red: 330,     // E4
        blue: 392,    // G4
        yellow: 440,  // A4
        black: 261.6, // C4
        white: 523.2, // C5
        purple: 587.3 // D5
      };
    }

    _ensureCtx() {
      if (!this.enabled) return null;
      try {
        if (!this.ctx) {
          const AudioCtx = global.AudioContext || global.webkitAudioContext;
          if (AudioCtx) {
            this.ctx = new AudioCtx();
          }
        }
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }
        return this.ctx;
      } catch (_e) {
        return null;
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    _playTone(type, freq, startOffset, duration, peakGain = 0.16, rampFreq = null) {
      const ctx = this._ensureCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + startOffset;
        const attack = Math.min(0.008, duration * 0.2);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        if (rampFreq) {
          osc.frequency.exponentialRampToValueAtTime(rampFreq, start + duration * 0.85);
        }

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(peakGain, start + attack);
        gain.gain.exponentialRampToValueAtTime(0.0008, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (_e) {}
        };

        osc.start(start);
        osc.stop(start + duration + 0.015);
      } catch (_e) {
        // Ignore audio errors so gameplay never lags or blocks
      }
    }

    /**
     * Warm, mellow synth voice in low-mid register with soft attack,
     * gentle low-pass roll-off, and zero harsh high frequencies.
     */
    _playModernVoice({
      freq,
      startOffset = 0,
      duration = 0.42,
      peakGain = 0.06,
      filterStart = 950,
      filterEnd = 360,
      pan = 0
    }) {
      const ctx = this._ensureCtx();
      if (!ctx) return;
      try {
        const start = ctx.currentTime + startOffset;
        const attack = 0.024; // Soft rounded attack so it never clicks or pierces

        const oscMain = ctx.createOscillator();
        const oscSub = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const voiceGain = ctx.createGain();

        oscMain.type = "sine";
        oscMain.frequency.setValueAtTime(freq, start);

        // Soft lower octave sine for warm body instead of bright harmonics
        oscSub.type = "sine";
        oscSub.frequency.setValueAtTime(freq * 0.5, start);

        filter.type = "lowpass";
        filter.Q.setValueAtTime(0.5, start); // Flat, non-resonant roll-off
        filter.frequency.setValueAtTime(filterStart, start);
        filter.frequency.exponentialRampToValueAtTime(Math.max(180, filterEnd), start + duration);

        voiceGain.gain.setValueAtTime(0.0001, start);
        voiceGain.gain.linearRampToValueAtTime(peakGain, start + attack);
        voiceGain.gain.exponentialRampToValueAtTime(0.0006, start + duration);

        oscMain.connect(filter);
        oscSub.connect(filter);
        filter.connect(voiceGain);

        let panner = null;
        if (typeof ctx.createStereoPanner === "function" && pan !== 0) {
          panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(pan, start);
          voiceGain.connect(panner);
          panner.connect(ctx.destination);
        } else {
          voiceGain.connect(ctx.destination);
        }

        let cleaned = false;
        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;
          try {
            oscMain.disconnect();
            oscSub.disconnect();
            filter.disconnect();
            voiceGain.disconnect();
            if (panner) panner.disconnect();
          } catch (_e) {}
        };

        oscMain.onended = cleanup;
        oscMain.start(start);
        oscSub.start(start);
        oscMain.stop(start + duration + 0.02);
        oscSub.stop(start + duration + 0.02);
      } catch (_e) {
        // Ignore audio errors
      }
    }

    playButtonPress(color) {
      const baseFreq = this.colorFreqs[color] || 360;
      this._playTone("sine", baseFreq, 0, 0.07, 0.12, baseFreq * 1.08);
    }

    playTick(urgent = false) {
      this._playTone("sine", urgent ? 580 : 440, 0, 0.04, urgent ? 0.22 : 0.16);
    }

    /**
     * Warm, soft, modern UI confirmation chime (low-mid register 220Hz - 523Hz,
     * similar to warm marimba / Rhodes pad, zero piercing high frequencies).
     */
    playSuccess(roundIndex = 0) {
      const ctx = this._ensureCtx();
      if (!ctx) return;

      // Warm low-mid palettes (C4–B4 range, all below 590Hz so it is never piercing)
      const palettes = [
        // Cmaj7 warm voicing: C4 -> G4 -> B4
        [261.63, 392.00, 493.88],
        // Dmaj7 warm voicing: D4 -> A4 -> C#5
        [293.66, 440.00, 554.37],
        // Fmaj7 warm voicing: F3 -> C4 -> E4
        [174.61, 261.63, 329.63],
        // G6 warm voicing: G3 -> D4 -> B4
        [196.00, 293.66, 493.88]
      ];
      const notes = palettes[Math.abs(roundIndex) % palettes.length];

      // Gentle warm 3-note Rhodes/marimba-like confirmation
      const pans = [-0.15, 0, 0.15];
      notes.forEach((freq, idx) => {
        const isLast = idx === notes.length - 1;
        this._playModernVoice({
          freq,
          startOffset: idx * 0.065,
          duration: isLast ? 0.48 : 0.32,
          peakGain: isLast ? 0.16 : 0.12,
          filterStart: 850,
          filterEnd: 320,
          pan: pans[idx] || 0
        });
      });
    }

    playFail() {
      const notes = [220, 164.81];
      notes.forEach((freq, idx) => {
        this._playTone("sawtooth", freq, idx * 0.14, 0.2, 0.15);
      });
    }

    playRuleUnlock() {
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, idx) => {
        this._playTone("sine", freq, idx * 0.07, 0.18, 0.14);
      });
    }
  }

  global.PressGame = global.PressGame || {};
  global.PressGame.SoundFX = SoundFX;
})(typeof window !== "undefined" ? window : globalThis);
