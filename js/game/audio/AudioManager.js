export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.compressor = null;
        this.bgmOscillators = [];
        this.enabled = true;

        // Initialize on user interaction (required by browsers)
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Dynamics Compressor to handle overlapping sounds
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
            this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
            this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
            this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
            this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
            this.compressor.connect(this.audioContext.destination);

            // Master gain nodes
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.gain.value = 0.5;
            this.bgmGain.connect(this.compressor);

            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.compressor);

            this.initialized = true;
            console.log('AudioManager initialized (v2 - Fixed)');
        } catch (e) {
            console.error('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    playBGM() {
        if (!this.enabled || !this.initialized) return;

        // Ensure context is running (fixes "BGM not playing" issue)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.stopBGM();
        // Simple ambient chord progression loop
        const chordProgression = [
            // A minor (A C E)
            [220, 261.63, 329.63],
            // B diminished (B D F)
            [246.94, 293.66, 369.99],
            // C major (C E G)
            [261.63, 329.63, 392.00],
            // D minor (D F A)
            [293.66, 369.99, 440.00]
        ];
        let step = 0;
        const scheduleChord = () => {
            const now = this.audioContext.currentTime;
            const freqs = chordProgression[step % chordProgression.length];
            freqs.forEach(freq => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
                osc.connect(gain);
                gain.connect(this.bgmGain);
                osc.start(now);
                osc.stop(now + 2.5);
                this.bgmOscillators.push(osc);
            });
            step++;
        };
        // Start first chord immediately
        scheduleChord();
        // Repeat every 3 seconds
        this.bgmInterval = setInterval(() => {
            if (!this.enabled || !this.initialized) return;
            scheduleChord();
        }, 3000);
        console.log('Ambient BGM loop started');
    }

    stopBGM() {
        if (!this.enabled || !this.initialized) return;
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        this.bgmOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) { }
        });
        this.bgmOscillators = [];
    }

    // Simple short sound effects for actions
    // Volume lowered significantly to reduce noise
    playShoot() { this._playOneShot('square', 800, 0.02, 0.05, 0.01); }
    playHit() { this._playOneShot('sawtooth', 200, 0.1, 0.1, 0.01); }
    playCollect() { this._playOneShot('sine', 800, 0.1, 0.1, 0.01, 1200); }

    playLevelUp() {
        if (!this.enabled || !this.initialized) return;
        const now = this.audioContext.currentTime;
        // Ascending arpeggio
        [523, 659, 784, 1047].forEach((freq, i) => {
            const start = now + i * 0.1;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.1, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(start);
            osc.stop(start + 0.2);
        });
    }

    playBossSummon() { this._playOneShot('sawtooth', 100, 0.2, 1.0, 0.01, 50); }

    // Helper for one‑shot effects – optional endFreq for pitch slide
    _playOneShot(type, startFreq, startGain, duration, endGain, endFreq) {
        if (!this.enabled || !this.initialized) return;

        // Resume context if suspended (e.g. user clicked but audio didn't start)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, now);
        if (endFreq !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
        }
        gain.gain.setValueAtTime(startGain, now);
        gain.gain.exponentialRampToValueAtTime(endGain, now + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + duration);
    }

    setVolume(bgmVolume, sfxVolume) {
        if (!this.enabled || !this.initialized) return;

        if (bgmVolume !== undefined) {
            this.bgmGain.gain.value = bgmVolume;
        }
        if (sfxVolume !== undefined) {
            this.sfxGain.gain.value = sfxVolume;
        }
    }
}
