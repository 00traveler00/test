
window.onerror = function(msg, url, line, col, error) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.background = 'rgba(255, 0, 0, 0.8)';
    div.style.color = 'white';
    div.style.padding = '10px';
    div.style.zIndex = '9999';
    div.style.fontSize = '12px';
    div.style.wordBreak = 'break-all';
    div.innerText = 'Error: ' + msg + '\n' + url + ':' + line + ':' + col;
    document.body.appendChild(div);
    return false;
};
console.log = (function(oldLog) {
    return function(...args) {
        oldLog(...args);
        // Optional: display logs on screen if needed
    };
})(console.log);


// --- js/game/InputHandler.js ---
class InputHandler {
    constructor() {
        this.keys = {};
        this.touchActive = false;
        this.touchStart = { x: 0, y: 0 };
        this.touchCurrent = { x: 0, y: 0 };
        this.joystickVector = { x: 0, y: 0 };

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch events for virtual joystick
        window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.touchActive = true;
        this.touchStart.x = e.touches[0].clientX;
        this.touchStart.y = e.touches[0].clientY;
        this.touchCurrent.x = this.touchStart.x;
        this.touchCurrent.y = this.touchStart.y;
        this.updateJoystickVector();
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchActive) return;
        this.touchCurrent.x = e.touches[0].clientX;
        this.touchCurrent.y = e.touches[0].clientY;
        this.updateJoystickVector();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.touchActive = false;
        this.joystickVector = { x: 0, y: 0 };
    }

    updateJoystickVector() {
        const dx = this.touchCurrent.x - this.touchStart.x;
        const dy = this.touchCurrent.y - this.touchStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50; // Max joystick radius

        if (distance > 0) {
            const normalized = distance > maxDist ? maxDist : distance;
            this.joystickVector.x = (dx / distance) * (normalized / maxDist);
            this.joystickVector.y = (dy / distance) * (normalized / maxDist);
        } else {
            this.joystickVector = { x: 0, y: 0 };
        }
    }

    getMovementVector() {
        let x = 0;
        let y = 0;

        if (this.keys['ArrowUp'] || this.keys['KeyW']) y -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) y += 1;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) x -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) x += 1;

        // Normalize keyboard vector
        if (x !== 0 || y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        // Combine with joystick (priority to joystick if active)
        if (this.touchActive) {
            return this.joystickVector;
        }

        return { x, y };
    }
}


// --- js/game/audio/AudioManager.js ---
class AudioManager {
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


// --- js/game/entities/Particle.js ---
class Particle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0; // Seconds
        this.decay = Math.random() * 0.5 + 0.5;
        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= this.decay * dt;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}


// --- js/game/entities/FloatingText.js ---
class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.velocity = { x: (Math.random() - 0.5) * 20, y: -50 };
        this.life = 1.0; // Seconds
        this.opacity = 1.0;
        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        this.life -= dt;
        this.opacity = Math.max(0, this.life);

        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}


// --- js/game/entities/Projectile.js ---
class Projectile {
    constructor(game, x, y, target, angleOffset = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speed = 300;
        this.radius = 5;
        this.damage = game.player.damage; // Use player damage
        this.markedForDeletion = false;
        this.color = '#ffff00';

        // Calculate direction to target
        const dx = target.x - x;
        const dy = target.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Base angle
        let angle = Math.atan2(dy, dx);

        // Apply offset
        angle += angleOffset;

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check world bounds instead of canvas bounds
        if (this.x < 0 || this.x > this.game.worldWidth ||
            this.y < 0 || this.y > this.game.worldHeight) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}


// --- js/game/entities/Missile.js ---



class Missile extends Projectile {
    constructor(game, x, y, target) {
        super(game, x, y, target);
        this.target = target;

        // Missile Stats
        this.speed = 450;
        this.turnSpeed = 5.0; // Radians per second
        this.damage = game.player.damage * 2.5;
        this.color = '#ff0088';
        this.radius = 8;
        this.lifeTime = 2.5;

        // Initial Launch: Randomize angle slightly for "spread" effect
        const currentAngle = Math.atan2(this.vy, this.vx);
        const spread = (Math.random() - 0.5) * 1.5; // +/- 0.75 rad spread
        const startSpeed = 100; // Start slow

        this.vx = Math.cos(currentAngle + spread) * startSpeed;
        this.vy = Math.sin(currentAngle + spread) * startSpeed;
    }

    update(dt) {
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) {
            this.markedForDeletion = true;
            // TODO: Explosion effect?
            return;
        }

        // Accelerate
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed < this.speed) {
            const newSpeed = currentSpeed + 300 * dt; // Acceleration
            const angle = Math.atan2(this.vy, this.vx);
            this.vx = Math.cos(angle) * newSpeed;
            this.vy = Math.sin(angle) * newSpeed;
        }

        // Homing Logic
        if (this.target && !this.target.markedForDeletion) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            let currentAngle = Math.atan2(this.vy, this.vx);

            let diff = targetAngle - currentAngle;
            // Normalize angle difference
            while (diff <= -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            const maxTurn = this.turnSpeed * dt;
            if (Math.abs(diff) > maxTurn) {
                currentAngle += Math.sign(diff) * maxTurn;
            } else {
                currentAngle = targetAngle;
            }

            // Apply new direction while maintaining speed
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.vx = Math.cos(currentAngle) * speed;
            this.vy = Math.sin(currentAngle) * speed;
        } else {
            // If target lost, find new target? Or just fly straight.
            // For now, fly straight.
        }

        // Move
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Bounds check
        if (this.x < 0 || this.x > this.game.worldWidth ||
            this.y < 0 || this.y > this.game.worldHeight) {
            this.markedForDeletion = true;
        }

        // Particle Trail
        if (Math.random() < 0.4) {
            this.game.particles.push(new Particle(this.game, this.x, this.y, '#ffaa00'));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));

        // Missile Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, 6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-6, -6);
        ctx.fill();

        // Thruster Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffaa00';
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-12, 4);
        ctx.lineTo(-12, -4);
        ctx.fill();

        ctx.restore();
    }
}


// --- js/game/entities/Drone.js ---


class Drone {
    constructor(game, player) {
        this.game = game;
        this.player = player;
        this.x = player.x;
        this.y = player.y;
        this.radius = 10;
        this.color = '#00ffaa';

        // Orbit parameters
        this.angle = Math.random() * Math.PI * 2;
        this.distance = 60;
        this.speed = 2; // Orbit speed

        // Combat
        this.damage = 10;
        this.shootInterval = 1.0;
        this.shootTimer = 0;
        this.range = 300;
    }

    update(dt) {
        // Orbit player
        this.angle += this.speed * dt;
        this.x = this.player.x + Math.cos(this.angle) * this.distance;
        this.y = this.player.y + Math.sin(this.angle) * this.distance;

        // Shoot nearest enemy
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = this.shootInterval;
        }
    }

    shoot() {
        if (!this.game.waveManager) return;

        let nearest = null;
        let minDist = Infinity;

        this.game.waveManager.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.range && dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        if (nearest) {
            const dx = nearest.x - this.x;
            const dy = nearest.y - this.y;
            const angle = Math.atan2(dy, dx);

            // Drones shoot standard projectiles for now
            const proj = new Projectile(this.game, this.x, this.y, nearest);
            proj.damage = this.damage; // Override damage
            proj.color = this.color;   // Override color
            this.game.player.projectiles.push(proj);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Rotors animation
        const time = performance.now() / 100;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        ctx.save();
        ctx.rotate(time);
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
        ctx.restore();

        ctx.restore();
    }
}


// --- js/game/entities/EnemyProjectile.js ---
class EnemyProjectile {
    constructor(game, x, y, target) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speed = 200;
        this.radius = 6;
        this.damage = 10;
        this.markedForDeletion = false;
        this.color = '#ff4400';

        // Calculate direction to target (player)
        const dx = target.x - x;
        const dy = target.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check world bounds instead of canvas bounds
        if (this.x < 0 || this.x > this.game.worldWidth ||
            this.y < 0 || this.y > this.game.worldHeight) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }
}


// --- js/game/entities/EnemyMissile.js ---



class EnemyMissile extends EnemyProjectile {
    constructor(game, x, y, target) {
        super(game, x, y, target);
        this.target = target;
        this.speed = 250;
        this.turnSpeed = 2.5;
        this.color = '#ff0000';
        this.lifeTime = 4.0;

        // Initial random spread
        const angle = Math.atan2(this.vy, this.vx) + (Math.random() - 0.5) * 1.0;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(dt) {
        this.lifeTime -= dt;
        if (this.lifeTime <= 0) {
            this.markedForDeletion = true;
            return;
        }

        // Homing Logic
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            let currentAngle = Math.atan2(this.vy, this.vx);

            let diff = targetAngle - currentAngle;
            while (diff <= -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            const maxTurn = this.turnSpeed * dt;
            if (Math.abs(diff) > maxTurn) {
                currentAngle += Math.sign(diff) * maxTurn;
            } else {
                currentAngle = targetAngle;
            }

            this.vx = Math.cos(currentAngle) * this.speed;
            this.vy = Math.sin(currentAngle) * this.speed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Bounds check
        if (this.x < 0 || this.x > this.game.worldWidth ||
            this.y < 0 || this.y > this.game.worldHeight) {
            this.markedForDeletion = true;
        }

        // Trail
        if (Math.random() < 0.3) {
            this.game.particles.push(new Particle(this.game, this.x, this.y, '#ff4400'));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, 4);
        ctx.lineTo(-4, -4);
        ctx.fill();

        // Glow
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff0000';
        ctx.fill();

        ctx.restore();
    }
}


// --- js/game/entities/Drop.js ---
class Drop {
    constructor(game, x, y, type = 'energy', value = 1) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // 'energy' or 'money'
        this.value = value;
        this.radius = 6;
        this.magnetRadius = 100; // Distance to start flying to player
        this.speed = 400;
        this.markedForDeletion = false;
        this.color = type === 'energy' ? '#00ffff' : '#ffd700';
        this.time = Math.random() * 100;
    }

    update(dt) {
        this.time += dt;
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.magnetRadius) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        if (dist < this.game.player.radius) {
            // Collected
            this.markedForDeletion = true;
            if (this.type === 'energy') {
                const multiplier = this.game.debugMode ? 100 : 1;
                this.game.ene += Math.ceil(this.value * multiplier);
                this.game.audio.playCollect(); // Sound effect
            }
            // console.log("Collected " + this.type, "Value:", this.value);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Rotate
        ctx.rotate(this.time * 2);

        // Neon Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Diamond shape (Data Crystal)
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius, 0);
        ctx.closePath();
        ctx.fill();

        // Inner white core
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius * 0.5);
        ctx.lineTo(this.radius * 0.5, 0);
        ctx.lineTo(0, this.radius * 0.5);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}


// --- js/game/entities/Obstacle.js ---
class Obstacle {
    constructor(game, x, y, type = 'rock') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 30;
        this.color = '#888888';
        this.time = Math.random() * 100;

        // Set visuals based on map level
        const mapLevel = game.mapLevel || 1;
        if (mapLevel === 1) {
            this.color = '#00ff88'; // Green teal
            this.type = 'tree';
        } else if (mapLevel === 2) {
            this.color = '#ff8844'; // Orange rock
            this.type = 'rock';
        } else {
            this.color = '#ff00ff'; // Purple crystal
            this.type = 'crystal';
        }
    }

    update(dt) {
        this.time += dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        if (this.type === 'tree') {
            // Tree: Trunk + Crown
            // Trunk
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(-5, 0, 10, 30);

            // Crown (triangle)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(-20, 20);
            ctx.lineTo(20, 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'rock') {
            // Rock: Irregular hexagon
            const sway = Math.sin(this.time) * 2;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius + sway);
            ctx.lineTo(this.radius * 0.8, -this.radius * 0.4);
            ctx.lineTo(this.radius, this.radius * 0.2);
            ctx.lineTo(this.radius * 0.3, this.radius);
            ctx.lineTo(-this.radius * 0.3, this.radius);
            ctx.lineTo(-this.radius, this.radius * 0.2);
            ctx.lineTo(-this.radius * 0.8, -this.radius * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'crystal') {
            // Crystal: Floating diamond
            const hover = Math.sin(this.time * 2) * 5;
            ctx.rotate(this.time * 0.5);

            ctx.beginPath();
            ctx.moveTo(0, -this.radius + hover);
            ctx.lineTo(this.radius * 0.7, 0);
            ctx.lineTo(0, this.radius + hover);
            ctx.lineTo(-this.radius * 0.7, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner glow
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.3 + hover);
            ctx.lineTo(this.radius * 0.3, 0);
            ctx.lineTo(0, this.radius * 0.3 + hover);
            ctx.lineTo(-this.radius * 0.3, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    // Check collision with circle (player/projectile)
    collidesWith(x, y, radius) {
        const dx = this.x - x;
        const dy = this.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.radius + radius;
    }
}


// --- js/game/entities/Chest.js ---
class Chest {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.active = true;
        this.color = '#ffd700'; // Gold
        this.glow = 0;

        // Pre-roll rewards
        this.contents = this.generateRewards();

        // Store difficulty at generation time for price scaling
        this.difficulty = (game.waveManager) ? game.waveManager.difficulty : 1.0;
    }

    generateRewards() {
        // Access relics from UIManager via Game
        // Note: This assumes UIManager is initialized. If not, we might need a static list or callback.
        // Since Chest is created in startRun, UI should be ready.
        if (!this.game.ui || !this.game.ui.relics) return [];

        const shuffled = [...this.game.ui.relics].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    update(dt) {
        if (!this.active) return;

        this.glow += dt * 3;

        // Check interaction (smaller radius to prevent immediate reopening)
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only open if player is very close and chest is active
        if (dist < this.radius + 10) {
            // Open Chest
            this.game.openChest(this);
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing effect
        const scale = 1 + Math.sin(this.glow) * 0.1;
        ctx.scale(scale, scale);

        // Draw Chest Box (Simple rect for now, or sprite later)
        ctx.fillStyle = this.color;
        ctx.fillRect(-15, -10, 30, 20);

        // Lid
        ctx.fillStyle = '#ffec8b';
        ctx.fillRect(-15, -10, 30, 5);

        // Lock
        ctx.fillStyle = '#000';
        ctx.fillRect(-2, -2, 4, 6);

        // Text hint
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("OPEN", 0, -15);

        ctx.restore();
    }
}


// --- js/game/entities/BossAltar.js ---
class BossAltar {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 40;
        this.active = true;
        this.color = '#ff00ff';
        this.glow = 0;
    }

    update(dt) {
        if (!this.active) return;

        this.glow += dt * 5;

        // Check interaction
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius + this.game.player.radius) {
            // Summon Boss!
            this.game.waveManager.summonBoss();
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing effect
        const scale = 1 + Math.sin(this.glow) * 0.1;
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.fill();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("SUMMON BOSS", 0, 5);

        ctx.restore();
    }
}


// --- js/game/entities/Enemy.js ---




class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speed = 50;
        this.radius = 15;
        this.hp = 10;
        this.maxHp = 10;
        this.damage = 10;
        this.markedForDeletion = false;
        this.type = 'enemy';
        this.color = '#ff0000';
        this.time = Math.random() * 100; // For animation
    }

    update(dt) {
        this.time += dt;

        // Move towards player (default behavior)
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    draw(ctx) {
        // Draw Neon Shape
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        this.drawShape(ctx);

        ctx.restore();

        // Draw HP Bar
        this.drawHpBar(ctx);
    }

    drawShape(ctx) {
        // Default Circle
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHpBar(ctx) {
        let width = 30;
        let height = 4;
        let yOffset = -this.radius - 15;

        if (this.isBoss) {
            width = 100;
            height = 10;
            yOffset = -this.radius - 30;
        }

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.x - width / 2, this.y + yOffset, width, height);

        // HP
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#ff0000'; // Red
        ctx.fillRect(this.x - width / 2, this.y + yOffset, width * hpPercent, height);
    }
}

class Slime extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 80;
        this.hp = 20;
        this.maxHp = 20;
        this.type = 'slime';
        this.color = '#00ff88'; // Neon Green
    }

    drawShape(ctx) {
        // Wobbling Shell with Glitch Effect
        const wobble = Math.sin(this.time * 5) * 2;
        const r = this.radius + wobble;

        // Glitch offset
        const gx = (Math.random() - 0.5) * 4;
        const gy = (Math.random() - 0.5) * 4;

        ctx.beginPath();
        ctx.arc(gx, gy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 136, 0.3)'; // Translucent shell
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        // Digital Noise Lines
        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();

        // Nucleus
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-5, -5 + wobble, 2, 0, Math.PI * 2);
        ctx.arc(5, -5 + wobble, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Golem extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 40;
        this.hp = 100;
        this.maxHp = 100;
        this.radius = 25;
        this.damage = 20;
        this.type = 'golem';
        this.color = '#ff4444'; // Neon Red
    }

    drawShape(ctx) {
        const s = this.radius;

        // Energy Lines connecting parts
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-s - 5, -s / 2); // To Left Arm
        ctx.moveTo(0, 0); ctx.lineTo(s / 2 + 5, -s / 2); // To Right Arm
        ctx.moveTo(0, 0); ctx.lineTo(0, -s); // To Head
        ctx.stroke();

        // Torso (Hexagon-ish)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-s / 2, -s / 2);
        ctx.lineTo(s / 2, -s / 2);
        ctx.lineTo(s / 2, s / 2);
        ctx.lineTo(-s / 2, s / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.fillRect(-s / 4, -s, s / 2, s / 2);

        // Arms (floating)
        const armOffset = Math.sin(this.time * 3) * 5;
        ctx.fillRect(-s - 5, -s / 2 + armOffset, s / 2, s); // Left
        ctx.fillRect(s / 2 + 5, -s / 2 - armOffset, s / 2, s); // Right

        // Core
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-5, -5, 10, 10);
    }
}

class Lizard extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 100;
        this.hp = 30;
        this.maxHp = 30;
        this.type = 'lizard';
        this.color = '#aa00ff'; // Neon Purple

        this.shootTimer = 0;
        this.shootInterval = 2.0;
    }

    update(dt) {
        super.update(dt);

        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval) {
            this.shoot();
            this.shootTimer = 0;
        }
    }

    shoot() {
        this.game.enemyProjectiles.push(
            new EnemyProjectile(this.game, this.x, this.y, this.game.player)
        );
    }

    drawShape(ctx) {
        // Calculate angle to player for rotation
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const angle = Math.atan2(dy, dx);

        ctx.rotate(angle);

        // Cyber Spine
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, 0);
        ctx.stroke();

        // Body (Triangle)
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, this.radius * 0.8);
        ctx.lineTo(-this.radius, -this.radius * 0.8);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.stroke();

        // Scales / Armor Plates
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, 5);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, -5);
        ctx.fill();

        // Tail
        const tailWag = Math.sin(this.time * 10) * 5;
        ctx.beginPath();
        ctx.moveTo(-this.radius, 0);
        ctx.lineTo(-this.radius * 2, tailWag);
        ctx.strokeStyle = this.color;
        ctx.stroke();

        // Limbs
        ctx.beginPath();
        ctx.moveTo(0, this.radius * 0.5);
        ctx.lineTo(5, this.radius + 5); // Leg R
        ctx.moveTo(0, -this.radius * 0.5);
        ctx.lineTo(5, -this.radius - 5); // Leg L
        ctx.stroke();

        ctx.rotate(-angle); // Reset rotation
    }
}

class Totem extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 0; // Stationary
        this.hp = 50;
        this.maxHp = 50;
        this.radius = 20;
        this.type = 'totem';
        this.color = '#ff00ff'; // Magenta

        this.laserTimer = 0;
        this.laserInterval = 3.0;
        this.isFiring = false;
        this.laserDuration = 0.5;
        this.firingTimer = 0;
    }

    update(dt) {
        if (this.isFiring) {
            this.firingTimer += dt;
            if (this.firingTimer > this.laserDuration) {
                this.isFiring = false;
                this.firingTimer = 0;
            }
            this.checkLaserCollision();
        } else {
            this.laserTimer += dt;
            if (this.laserTimer > this.laserInterval) {
                this.isFiring = true;
                this.laserTimer = 0;
            }
        }
    }

    checkLaserCollision() {
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) { // Blast radius
            this.game.player.hp -= 0.5; // Rapid damage
            if (this.game.player.hp <= 0) this.game.setState('result');
        }
    }

    draw(ctx) {
        // Draw Laser/Blast warning
        if (this.isFiring) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 150, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'magenta';
            ctx.stroke();
        } else if (this.laserTimer > this.laserInterval - 1.0) {
            // Warning charge
            ctx.beginPath();
            ctx.arc(this.x, this.y, 150 * (this.laserTimer - (this.laserInterval - 1.0)), 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
            ctx.stroke();
        }

        super.draw(ctx);
    }

    drawShape(ctx) {
        // Stacked segments
        const hover = Math.sin(this.time * 2) * 5;

        // Rotating Rings
        ctx.save();
        ctx.rotate(this.time);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, -10 + hover, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Base
        ctx.fillStyle = this.color;
        ctx.fillRect(-10, 10, 20, 10);

        // Middle (Floating)
        ctx.fillRect(-15, -5 + hover, 30, 10);

        // Top (Floating)
        ctx.fillRect(-10, -20 + hover, 20, 10);

        // Eye (Pulsating)
        const pulse = (Math.sin(this.time * 10) + 1) * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.5})`;
        ctx.shadowBlur = 10 + pulse * 10;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(0, -15 + hover, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class KamikazeEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 180;
        this.hp = 15;
        this.maxHp = 15;
        this.damage = 40; // High damage
        this.type = 'kamikaze';
        this.color = '#ffaa00'; // Orange
        this.radius = 12;
    }

    update(dt) {
        super.update(dt);

        // Self-destruct check
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius + this.game.player.radius + 5) {
            this.explode();
        }
    }

    explode() {
        this.markedForDeletion = true;
        this.game.player.hp -= this.damage;
        this.game.showDamage(this.game.player.x, this.game.player.y, this.damage, '#ffaa00');

        // Explosion visual
        for (let i = 0; i < 20; i++) {
            const p = new Particle(this.game, this.x, this.y, this.color);
            p.speed *= 2; // Faster particles
            this.game.particles.push(p);
        }

        // Sound (using hit sound for now, ideally explosion sound)
        this.game.audio.playHit();
    }

    drawShape(ctx) {
        // Spiky shape
        const spikes = 8;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (Math.PI * 2 * i) / (spikes * 2);
            const r = i % 2 === 0 ? this.radius : this.radius * 0.5;
            const x = Math.cos(angle + this.time * 15) * r; // Faster rotation
            const y = Math.sin(angle + this.time * 15) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();

        // Pulse effect
        if (Math.floor(this.time * 10) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }
    }
}

class MissileEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 60;
        this.hp = 40;
        this.maxHp = 40;
        this.type = 'missile_enemy';
        this.color = '#ff0088';
        this.radius = 20;

        this.shootTimer = 0;
        this.shootInterval = 3.0;
    }

    update(dt) {
        super.update(dt);
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval) {
            this.shoot();
            this.shootTimer = 0;
        }
    }

    shoot() {
        this.game.enemyProjectiles.push(
            new EnemyMissile(this.game, this.x, this.y, this.game.player)
        );
    }

    drawShape(ctx) {
        // Boxy with missile pods
        ctx.fillStyle = this.color;
        ctx.fillRect(-15, -15, 30, 30);

        // Pods
        ctx.fillStyle = '#440022';
        ctx.fillRect(-20, -10, 5, 20);
        ctx.fillRect(15, -10, 5, 20);
    }
}

class BeamEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 30;
        this.hp = 60;
        this.maxHp = 60;
        this.type = 'beam_enemy';
        this.color = '#0088ff';
        this.radius = 25;

        this.chargeTimer = 0;
        this.chargeDuration = 2.0;
        this.fireDuration = 1.0;
        this.isFiring = false;
        this.beamAngle = 0;
    }

    update(dt) {
        // Stop moving when charging/firing
        if (this.chargeTimer > 1.0 || this.isFiring) {
            // Don't move
        } else {
            super.update(dt);
        }

        if (this.isFiring) {
            this.chargeTimer += dt;
            if (this.chargeTimer > this.fireDuration) {
                this.isFiring = false;
                this.chargeTimer = 0;
            } else {
                // Check collision
                this.checkBeamCollision();
            }
        } else {
            this.chargeTimer += dt;
            // Track player while charging
            const dx = this.game.player.x - this.x;
            const dy = this.game.player.y - this.y;
            this.beamAngle = Math.atan2(dy, dx);

            if (this.chargeTimer > this.chargeDuration) {
                this.isFiring = true;
                this.chargeTimer = 0;
            }
        }
    }

    checkBeamCollision() {
        // Raycast check
        const range = 400;
        const p = this.game.player;

        // Simplified: Check if player is within angle cone and distance
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < range) {
            const angleToPlayer = Math.atan2(dy, dx);
            let angleDiff = angleToPlayer - this.beamAngle;
            while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            if (Math.abs(angleDiff) < 0.15) { // Narrow beam
                p.hp -= 0.5; // Rapid damage
                if (p.hp <= 0) this.game.setState('result');
            }
        }
    }

    draw(ctx) {
        super.draw(ctx);

        // Draw Beam
        if (this.isFiring) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.beamAngle);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(400, 0);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 10 + Math.sin(this.game.waveManager.time * 20) * 5;
            ctx.stroke();

            // Core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.restore();
        } else if (this.chargeTimer > 1.0) {
            // Charging line
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.beamAngle);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(400, 0);
            ctx.strokeStyle = `rgba(0, 255, 255, 0.2)`;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }
    }

    drawShape(ctx) {
        // Eye shape
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();

        // Pupil
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}


// --- js/game/entities/Player.js ---



class Player {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.projectiles = [];
        this.shootTimer = 0;
        this.time = 0; // For animation

        // Character specific stats
        this.initCharacter(this.game.selectedCharacter);

        // Relic Stats
        this.hasMissileLauncher = false;
        this.missileTimer = 0;
    }

    initCharacter(charType) {
        switch (charType) {
            case 'girl':
                this.speed = 200;
                this.maxHp = 100;
                this.shootInterval = 0.5;
                this.damage = 10;
                this.color = '#ff00ff'; // Pink
                break;
            case 'cat':
                this.speed = 250;
                this.maxHp = 80;
                this.shootInterval = 0.3;
                this.damage = 5;
                this.color = '#00ffff'; // Cyan
                break;
            case 'boy':
                this.speed = 180;
                this.maxHp = 150;
                this.shootInterval = 0.8;
                this.damage = 20;
                this.color = '#00ff00'; // Green
                break;
            case 'dog':
                this.speed = 220;
                this.maxHp = 120;
                this.shootInterval = 0.5;
                this.damage = 10;
                this.color = '#ff8800'; // Orange
                break;
            default:
                this.speed = 200;
                this.maxHp = 100;
                this.shootInterval = 0.5;
                this.damage = 10;
                this.color = '#ffffff';
                break;
        }
        this.hp = this.maxHp;
        this.charType = charType;
    }

    update(dt) {
        this.time += dt;
        // Movement
        const input = this.game.input.getMovementVector();
        this.x += input.x * this.speed * dt;
        this.y += input.y * this.speed * dt;

        // Boundary checks (World Bounds)
        if (this.x < this.radius) this.x = this.radius;
        if (this.y < this.radius) this.y = this.radius;
        if (this.x > this.game.worldWidth - this.radius) this.x = this.game.worldWidth - this.radius;
        if (this.y > this.game.worldHeight - this.radius) this.y = this.game.worldHeight - this.radius;

        // Shooting
        this.shootTimer += dt;
        if (this.shootTimer >= this.shootInterval) {
            const target = this.findNearestEnemy();
            // console.log('Finding target...', target); // DEBUG
            if (target) {
                // console.log('Shooting at enemy!', target.type); // DEBUG
                this.shoot(target);
                this.shootTimer = 0;
            }
        }

        // Update Projectiles
        this.projectiles.forEach(p => p.update(dt));
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        // Missile Launcher Logic
        if (this.hasMissileLauncher) {
            this.missileTimer += dt;
            if (this.missileTimer >= 1.5) { // Fire every 1.5s
                const target = this.findNearestEnemy();
                if (target) {
                    this.projectiles.push(new Missile(this.game, this.x, this.y, target));
                    this.missileTimer = 0;
                    // Optional: Add specific missile sound here if available
                }
            }
        }
    }

    shoot(target) {
        this.game.audio.playShoot(); // Sound effect

        if (this.charType === 'dog') {
            // Dog Skill: 3-way shot
            this.projectiles.push(new Projectile(this.game, this.x, this.y, target, 0));
            this.projectiles.push(new Projectile(this.game, this.x, this.y, target, 0.2)); // +angle
            this.projectiles.push(new Projectile(this.game, this.x, this.y, target, -0.2)); // -angle
        } else {
            // Normal shot
            this.projectiles.push(new Projectile(this.game, this.x, this.y, target, 0));
        }
    }

    findNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;

        // Safety check
        if (!this.game.waveManager || !this.game.waveManager.enemies) {
            return null;
        }

        this.game.waveManager.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = dx * dx + dy * dy;

            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        return nearest;
    }

    draw(ctx) {
        this.projectiles.forEach(p => p.draw(ctx));

        // Draw Neon Character
        ctx.save();
        ctx.translate(this.x, this.y);

        // Breathing Animation
        const breath = Math.sin(this.time * 4) * 2;
        const r = this.radius + breath;

        // Outer Glow (Aura)
        ctx.shadowBlur = 30 + Math.sin(this.time * 10) * 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Main Body Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Tech Lines / Circuitry
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2); // Inner ring
        ctx.stroke();

        // Inner White Core
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Accessories
        this.drawAccessories(ctx);

        ctx.restore();
    }

    drawAccessories(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        if (this.charType === 'cat') {
            // Cyber Cat Ears
            ctx.beginPath();
            ctx.moveTo(-12, -15);
            ctx.lineTo(-18, -28);
            ctx.lineTo(-6, -20);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(12, -15);
            ctx.lineTo(18, -28);
            ctx.lineTo(6, -20);
            ctx.fill();
            ctx.stroke();

            // Cyber Tail (Animated)
            const tailWag = Math.sin(Date.now() / 200) * 10;
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.quadraticCurveTo(20, 20, 20 + tailWag, 5);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.stroke();

        } else if (this.charType === 'girl') {
            // Halo / Drone
            const hover = Math.sin(Date.now() / 300) * 5;
            ctx.beginPath();
            ctx.ellipse(0, -25 + hover, 15, 5, 0, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Ribbon
            ctx.fillStyle = '#ff66ff';
            ctx.beginPath();
            ctx.arc(0, -15, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(-12, -25);
            ctx.lineTo(-12, -5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(12, -25);
            ctx.lineTo(12, -5);
            ctx.fill();

        } else if (this.charType === 'dog') {
            // Floppy Cyber Ears
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.ellipse(-18, -5, 6, 12, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(18, -5, 6, 12, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Collar
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 10, 12, 0, Math.PI);
            ctx.stroke();

        } else if (this.charType === 'boy') {
            // Cyber Cap
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(0, -8, this.radius, Math.PI, 0);
            ctx.fill();
            ctx.stroke();
            // Visor
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(10, -5);
            ctx.stroke();
        }
    }
}


// --- js/game/ui/Minimap.js ---
class Minimap {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('minimapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 150;
        this.height = 150;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Scaling factor
        this.scaleX = this.width / game.worldWidth;
        this.scaleY = this.height / game.worldHeight;
    }

    worldToMinimap(x, y) {
        return {
            x: x * this.scaleX,
            y: y * this.scaleY
        };
    }

    draw() {
        // Clear
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw world border
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.width, this.height);

        // Draw obstacles (optional, might be too cluttered)
        // this.game.obstacles.forEach(obstacle => {
        //     const pos = this.worldToMinimap(obstacle.x, obstacle.y);
        //     this.ctx.fillStyle = '#444';
        //     this.ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
        // });

        // Draw enemies
        if (this.game.waveManager) {
            this.game.waveManager.enemies.forEach(enemy => {
                const pos = this.worldToMinimap(enemy.x, enemy.y);

                if (enemy.isBoss) {
                    // Boss - large red circle
                    this.ctx.fillStyle = '#ff0000';
                    this.ctx.shadowBlur = 5;
                    this.ctx.shadowColor = '#ff0000';
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                } else {
                    // Normal enemy - small red dot
                    this.ctx.fillStyle = '#ff4444';
                    this.ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
                }
            });
        }

        // Draw chests
        this.game.chests.forEach(chest => {
            if (chest.active) {
                const pos = this.worldToMinimap(chest.x, chest.y);
                this.ctx.fillStyle = '#ffd700';
                this.ctx.shadowBlur = 3;
                this.ctx.shadowColor = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });

        // Draw boss altar
        if (this.game.waveManager && this.game.waveManager.bossAltar) {
            const altar = this.game.waveManager.bossAltar;
            const pos = this.worldToMinimap(altar.x, altar.y);
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Draw player (always on top)
        if (this.game.player) {
            const pos = this.worldToMinimap(this.game.player.x, this.game.player.y);
            this.ctx.fillStyle = '#00ffff';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = '#00ffff';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
}


// --- js/game/systems/UpgradeSystem.js ---
class UpgradeSystem {
    constructor(game) {
        this.game = game;
        this.upgrades = {
            maxHp: { level: 0, cost: 100, increment: 20, name: "Max HP" },
            damage: { level: 0, cost: 150, increment: 2, name: "Damage" },
            magnet: { level: 0, cost: 80, increment: 20, name: "Magnet Range" }
        };
        this.load();
    }

    purchase(type) {
        const upgrade = this.upgrades[type];
        if (!upgrade) return false;

        if (this.game.money >= upgrade.cost) {
            this.game.money -= upgrade.cost;
            upgrade.level++;
            upgrade.cost = Math.floor(upgrade.cost * 1.5);
            this.save();
            return true;
        }
        return false;
    }

    applyUpgrades(player) {
        player.maxHp += this.upgrades.maxHp.level * this.upgrades.maxHp.increment;
        player.hp = player.maxHp; // Heal to full
        player.damage += this.upgrades.damage.level * this.upgrades.damage.increment;
        // Magnet handled in Drop.js, need to pass player or game to drop
    }

    save() {
        const data = {
            money: this.game.money,
            upgrades: this.upgrades
        };
        localStorage.setItem('yurufuwa_save', JSON.stringify(data));
    }

    load() {
        const json = localStorage.getItem('yurufuwa_save');
        if (json) {
            const data = JSON.parse(json);
            this.game.money = data.money || 0;
            if (data.upgrades) {
                for (const key in data.upgrades) {
                    if (this.upgrades[key]) {
                        this.upgrades[key].level = data.upgrades[key].level;
                        this.upgrades[key].cost = data.upgrades[key].cost;
                    }
                }
            }
        }
    }
}


// --- js/game/systems/WaveManager.js ---




class WaveManager {
    constructor(game, initialDifficulty = 1.0) {
        this.game = game;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;

        this.time = 0; // Total run time in seconds
        this.initialDifficulty = initialDifficulty;
        this.difficulty = initialDifficulty; // Difficulty coefficient

        this.bossAltar = null;
        this.bossActive = false;
    }

    spawnAltar() {
        if (this.bossActive) return;
        // Spawn near player but offset (Called by Game.js now)
        const angle = Math.random() * Math.PI * 2;
        const dist = 800; // Far enough
        const x = this.game.player.x + Math.cos(angle) * dist;
        const y = this.game.player.y + Math.sin(angle) * dist;

        // Clamp to world
        const cx = Math.max(100, Math.min(x, this.game.worldWidth - 100));
        const cy = Math.max(100, Math.min(y, this.game.worldHeight - 100));

        this.bossAltar = new BossAltar(this.game, cx, cy);
        console.log("Boss Altar Spawned at", cx, cy);
    }

    summonBoss() {
        this.bossActive = true;
        this.bossAltar = null; // Remove altar

        // Select boss type based on map level
        let boss;
        const mapLevel = this.game.mapLevel || 1;

        if (mapLevel === 1) {
            // Map 1: Giant Slime
            boss = new Slime(this.game, this.game.player.x, this.game.player.y - 300);
        } else if (mapLevel === 2) {
            // Map 2: Giant Golem
            boss = new Golem(this.game, this.game.player.x, this.game.player.y - 300);
        } else {
            // Map 3+: Giant Lizard or Totem
            if (Math.random() < 0.5) {
                boss = new Lizard(this.game, this.game.player.x, this.game.player.y - 300);
            } else {
                boss = new Totem(this.game, this.game.player.x, this.game.player.y - 300);
            }
        }

        // Boss stats
        boss.radius = 100;
        boss.hp = 500 * this.difficulty;
        boss.maxHp = 500 * this.difficulty;
        boss.speed = Math.max(20, boss.speed * 0.5); // Slower than normal
        boss.damage = 30 * this.difficulty;
        boss.isBoss = true;
        this.enemies.push(boss);

        this.game.audio.playBossSummon(); // Sound effect
        console.log(`BOSS SUMMONED: ${boss.type.toUpperCase()}`);
    }

    update(dt) {
        if (this.bossAltar) this.bossAltar.update(dt);

        this.time += dt;
        this.spawnTimer += dt;

        // RoR2 Style Difficulty Scaling
        // Difficulty increases by 20% every 60 seconds
        // Base difficulty is set in constructor (increases with loops)
        const timeScaling = 1.0 + (this.time / 60.0) * 0.5;
        this.difficulty = this.initialDifficulty * timeScaling;

        // Spawn Interval decreases with difficulty
        // Base 1.5s -> limit to 0.2s
        const currentInterval = Math.max(0.2, 1.5 / Math.sqrt(this.difficulty));

        if (this.spawnTimer >= currentInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        this.enemies.forEach(enemy => {
            enemy.update(dt);
            if (enemy.isBoss && enemy.hp <= 0) {
                this.game.bossDefeated();
            }
        });
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
    }

    draw(ctx) {
        if (this.bossAltar) this.bossAltar.draw(ctx);
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }

    spawnChest() {
        // Spawn chest near player
        const angle = Math.random() * Math.PI * 2;
        const dist = 200 + Math.random() * 200;
        const x = this.game.player.x + Math.cos(angle) * dist;
        const y = this.game.player.y + Math.sin(angle) * dist;

        // Clamp to world
        const cx = Math.max(50, Math.min(x, this.game.worldWidth - 50));
        const cy = Math.max(50, Math.min(y, this.game.worldHeight - 50));

        this.game.chests.push(new Chest(this.game, cx, cy));
        console.log("Chest Spawned!");
    }

    spawnEnemy() {
        // Spawn Count scales with difficulty
        // Cap at 5 per interval to prevent performance kill
        const spawnCount = Math.min(5, Math.floor(this.difficulty));

        for (let i = 0; i < spawnCount; i++) {
            // Spawn around player (outside camera view)
            const angle = Math.random() * Math.PI * 2;
            const dist = 500 + Math.random() * 200; // Outside screen
            let x = this.game.player.x + Math.cos(angle) * dist;
            let y = this.game.player.y + Math.sin(angle) * dist;

            // Clamp to world bounds
            x = Math.max(0, Math.min(x, this.game.worldWidth));
            y = Math.max(0, Math.min(y, this.game.worldHeight));

            let enemyType;
            const rand = Math.random();
            const mapDifficulty = this.game.mapLevel;

            // Adjust probabilities based on difficulty
            // As difficulty rises, chance of weaker enemies decreases
            const diffFactor = Math.min(0.5, (this.difficulty - 1.0) * 0.1); // Shift up to 0.5

            // Unified Spawn Table (Map based)
            if (mapDifficulty === 1) {
                if (rand < 0.5 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.8 - diffFactor / 2) enemyType = new Lizard(this.game, x, y);
                else enemyType = new KamikazeEnemy(this.game, x, y);
            } else if (mapDifficulty === 2) {
                if (rand < 0.3 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.5 - diffFactor) enemyType = new Lizard(this.game, x, y);
                else if (rand < 0.7 - diffFactor / 2) enemyType = new Golem(this.game, x, y);
                else if (rand < 0.8) enemyType = new MissileEnemy(this.game, x, y);
                else enemyType = new KamikazeEnemy(this.game, x, y);
            } else {
                if (rand < 0.2 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.35 - diffFactor) enemyType = new Lizard(this.game, x, y);
                else if (rand < 0.5 - diffFactor / 2) enemyType = new Golem(this.game, x, y);
                else if (rand < 0.65) enemyType = new Totem(this.game, x, y);
                else if (rand < 0.75) enemyType = new MissileEnemy(this.game, x, y);
                else if (rand < 0.85) enemyType = new BeamEnemy(this.game, x, y);
                else enemyType = new KamikazeEnemy(this.game, x, y);
            }

            // Apply Difficulty Scaling
            enemyType.hp *= this.difficulty;
            enemyType.maxHp *= this.difficulty;
            enemyType.damage *= this.difficulty;

            this.enemies.push(enemyType);
        }
        // console.log('Enemies spawned:', spawnCount, 'Total:', this.enemies.length);
    }
}


// --- js/ui/UIManager.js ---
class UIManager {
    constructor(game) {
        this.game = game;
        this.uiLayer = document.getElementById('ui-layer');
        this.screens = {};

        // Relic Data (Moved from ShopSystem)
        this.relics = [
            { id: 'atk_up', name: 'Cyber Katana', desc: 'Attack Damage +20%', cost: 15, color: '#ff4444', effect: (p) => p.damage *= 1.2 },
            { id: 'spd_up', name: 'Neko Headphones', desc: 'Move Speed +15%', cost: 20, color: '#4444ff', effect: (p) => p.speed *= 1.15 },
            { id: 'hp_up', name: 'Energy Drink', desc: 'Max HP +30', cost: 25, color: '#44ff44', effect: (p) => { p.maxHp += 30; p.hp += 30; } },
            { id: 'rate_up', name: 'Overclock Chip', desc: 'Fire Rate +10%', cost: 18, color: '#ffaa00', effect: (p) => p.shootInterval *= 0.9 },
            { id: 'range_up', name: 'Scope Lens', desc: 'Magnet Range +50%', cost: 12, color: '#00ffff', effect: (p) => { /* Handled in Drop */ } },
            { id: 'drone', name: 'Support Drone', desc: 'Summons a drone', cost: 75, color: '#00ffaa', effect: (p) => p.game.addDrone() },
            { id: 'missile', name: 'Missile Pod', desc: 'Fires homing missiles', cost: 100, color: '#ff0088', effect: (p) => p.hasMissileLauncher = true },
            { id: 'full_heal', name: 'Emergency Repair', desc: 'Fully Restores HP', cost: 300, color: '#ff00ff', effect: (p) => p.hp = p.maxHp }
        ];

        this.setupScreens();
        console.log('UIManager initialized (v2 - Icons)');
    }

    setupScreens() {
        // Title Screen
        this.screens.title = this.createScreen('title-screen', `
            <h1 class="title-text">Cyber<br>Survivor</h1>
            <button id="btn-start" class="cyber-btn">START</button>
            <button id="btn-options" class="cyber-btn secondary">OPTIONS</button>
        `);

        // Options Screen
        this.screens.options = this.createScreen('options-screen', `
            <h2>OPTIONS</h2>
            <div class="options-container">
                <label class="cyber-checkbox">
                    <input type="checkbox" id="chk-debug">
                    <span class="checkmark"></span>
                    DEBUG MODE (x100 Ene)
                </label>
            </div>
            <button id="btn-close-options" class="cyber-btn secondary">CLOSE</button>
        `);

        // Home Screen
        this.screens.home = this.createScreen('home-screen', `
            <h2>Home Base</h2>
            <div class="character-select">
                <div class="char-card selected" data-char="girl">
                    <canvas width="64" height="64" class="char-preview"></canvas>
                    <span>Girl</span>
                </div>
                <div class="char-card" data-char="cat">
                    <canvas width="64" height="64" class="char-preview"></canvas>
                    <span>Cat</span>
                </div>
                <div class="char-card" data-char="boy">
                    <canvas width="64" height="64" class="char-preview"></canvas>
                    <span>Boy</span>
                </div>
                <div class="char-card" data-char="dog">
                    <canvas width="64" height="64" class="char-preview"></canvas>
                    <span>Dog</span>
                </div>
            </div>
            <div class="stats-panel">
                <p>Money: <span id="player-money">0</span></p>
                <div class="upgrades">
                    <button id="btn-up-hp" class="cyber-btn small">HP Up <span id="cost-hp">100</span></button>
                    <button id="btn-up-dmg" class="cyber-btn small">Dmg Up <span id="cost-dmg">150</span></button>
                </div>
            </div>
            <button id="btn-mission" class="cyber-btn">START MISSION</button>
        `);

        // HUD (Heads Up Display)
        this.screens.hud = this.createScreen('hud-screen', `
            <div class="hud-top">
                <div class="hud-left">
                    <div class="bar-container">
                        <div id="hp-bar" class="bar hp"></div>
                        <span id="hp-text" class="bar-text">100/100</span>
                    </div>
                </div>
                <div class="hud-center">
                    <div class="score-container">
                        Ene: <span id="score-ene">0</span>
                    </div>
                    <div class="time-container">
                        <span id="game-time">00:00</span>
                        <span id="game-difficulty" class="difficulty-text">Lv. 1.00</span>
                    </div>
                </div>
                <div class="hud-right">
                    <!-- Reserved for Minimap space -->
                </div>
            </div>
            <div id="acquired-items-container" class="acquired-items">
                <!-- Acquired item icons will be added here -->
            </div>
        `);

        // Result Screen
        this.screens.result = this.createScreen('result-screen', `
            <h2>MISSION COMPLETE</h2>
            <div class="result-stats">
                <p>Ene Collected: <span id="result-ene">0</span></p>
                <p>Bonus Money: <span id="result-money">0</span></p>
            </div>
            <div class="result-actions">
                <button id="btn-loop" class="cyber-btn">LOOP (Next Map)</button>
                <button id="btn-return" class="cyber-btn secondary">RETURN HOME</button>
            </div>
        `);

        // Game Over Screen
        this.screens.gameover = this.createScreen('gameover-screen', `
            <h2 style="color: #ff0000;">GAME OVER</h2>
            <div class="result-stats-container">
                <div class="result-section">
                    <h3>Total Ene</h3>
                    <p class="result-big-text"><span id="go-ene">0</span></p>
                </div>
                <div class="result-section">
                    <h3>Defeated Enemies</h3>
                    <div id="go-enemies" class="result-grid"></div>
                </div>
                <div class="result-section">
                    <h3>Acquired Items</h3>
                    <div id="go-items" class="result-grid"></div>
                </div>
            </div>
            <button id="btn-go-home" class="cyber-btn">RETURN HOME</button>
        `);

        // Reward Screen (New)
        this.screens.reward = this.createScreen('reward-screen', `
            <h2>LEVEL UP! CHOOSE A REWARD</h2>
            <div id="reward-container" class="shop-container">
                <!-- Relic cards injected here -->
            </div>
            <button id="btn-close-reward" class="cyber-btn secondary">CLOSE (Cancel)</button>
        `);

        // Bind Events
        this.bindEvents();

        // Draw Previews
        setTimeout(() => this.drawCharacterPreviews(), 100);
    }

    bindButton(id, action) {
        const btn = document.getElementById(id);
        if (!btn) return;

        const handlePress = (e) => {
            if (e.type === 'touchstart') {
                e.preventDefault(); // Prevent ghost click
            }
            try {
                console.log(`Button pressed: ${id}`);
                action(e);
            } catch (err) {
                console.error(err);
                alert(`Error: ${err.message}`);
            }
        };

        btn.addEventListener('touchstart', handlePress, { passive: false });
        btn.addEventListener('click', handlePress);
    }

    createScreen(id, content) {
        const div = document.createElement('div');
        div.id = id;
        div.className = 'ui-screen hidden';
        div.innerHTML = content;
        this.uiLayer.appendChild(div);
        return div;
    }

    bindEvents() {
        // Title
        this.bindButton('btn-start', () => this.game.setState('home'));
        this.bindButton('btn-options', () => this.showScreen('options'));

        // Options
        this.bindButton('btn-close-options', () => this.showScreen('title'));

        const chkDebug = document.getElementById('chk-debug');
        if (chkDebug) {
            chkDebug.addEventListener('change', (e) => {
                this.game.debugMode = e.target.checked;
                console.log('Debug Mode:', this.game.debugMode);
            });
        }

        // Home
        this.bindButton('btn-mission', () => {
            this.game.startRun();
            this.game.setState('playing');
        });

        this.bindButton('btn-up-hp', () => {
            this.game.upgradeSystem.purchase('maxHp');
            this.updateHome();
        });

        this.bindButton('btn-up-dmg', () => {
            this.game.upgradeSystem.purchase('damage');
            this.updateHome();
        });

        const charCards = document.querySelectorAll('.char-card');
        charCards.forEach(card => {
            const handleSelect = (e) => {
                if (e.type === 'touchstart') e.preventDefault();
                charCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.game.selectedCharacter = card.dataset.char;
            };
            card.addEventListener('touchstart', handleSelect, { passive: false });
            card.addEventListener('click', handleSelect);
        });

        // Result
        this.bindButton('btn-loop', () => this.game.nextMap());
        this.bindButton('btn-return', () => this.game.setState('home'));

        // Game Over
        this.bindButton('btn-go-home', () => this.game.setState('home'));

        // Reward close button
        this.bindButton('btn-close-reward', () => {
            this.game.closeRewardWithoutPurchase();
        });
    }

    drawCharacterPreviews() {
        const cards = document.querySelectorAll('.char-card');
        cards.forEach(card => {
            const canvas = card.querySelector('canvas');
            const ctx = canvas.getContext('2d');
            const charType = card.dataset.char;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Mock Player Draw
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = 15;

            let color = '#fff';
            if (charType === 'girl') color = '#ff00ff';
            if (charType === 'cat') color = '#00ffff';
            if (charType === 'boy') color = '#00ff00';
            if (charType === 'dog') color = '#ff8800';

            ctx.save();
            ctx.translate(cx, cy);

            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;

            // Body
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Inner
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            // Accessories (Simplified)
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            if (charType === 'cat') {
                ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-12, -20); ctx.lineTo(-4, -14); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(12, -20); ctx.lineTo(4, -14); ctx.stroke();
            } else if (charType === 'girl') {
                ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); ctx.fill();
            } else if (charType === 'dog') {
                ctx.beginPath(); ctx.ellipse(-12, -4, 4, 8, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(12, -4, 4, 8, -Math.PI / 4, 0, Math.PI * 2); ctx.fill();
            } else if (charType === 'boy') {
                ctx.beginPath(); ctx.arc(0, -4, radius, Math.PI, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(18, -4); ctx.stroke();
            }

            ctx.restore();
        });
    }

    showRewardSelection(predefinedRelics = null, fixedDifficulty = null) {
        const container = document.getElementById('reward-container');
        container.innerHTML = '';

        let choices;
        if (predefinedRelics && predefinedRelics.length > 0) {
            choices = predefinedRelics;
        } else {
            // Fallback: Pick 3 random relics
            const shuffled = [...this.relics].sort(() => 0.5 - Math.random());
            choices = shuffled.slice(0, 3);
        }

        // Calculate cost multiplier based on fixed difficulty (from chest) or current difficulty
        const difficulty = fixedDifficulty || (this.game.waveManager ? this.game.waveManager.difficulty : 1.0);
        // Cost scales with difficulty: Base * Difficulty
        const costMultiplier = difficulty;

        choices.forEach(relic => {
            const card = document.createElement('div');
            card.className = 'relic-card';

            // Create canvas for icon
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 64;
            iconCanvas.height = 64;
            iconCanvas.className = 'relic-icon';

            // Draw icon using helper
            const ctx = iconCanvas.getContext('2d');
            this.drawRelicIcon(ctx, relic.id, 64, 64, relic.color);

            card.appendChild(iconCanvas);

            // Calculate scaled cost
            const scaledCost = Math.floor(relic.cost * costMultiplier);

            // Add text info
            const info = document.createElement('div');
            info.innerHTML = `
                <h3>${relic.name}</h3>
                <p>${relic.desc}</p>
                <p class="relic-cost">Cost: ${scaledCost} Ene</p>
            `;
            card.appendChild(info);

            // Check affordability
            if (this.game.ene < scaledCost) {
                card.style.opacity = '0.5';
                card.style.pointerEvents = 'none'; // Disable interaction
                info.querySelector('.relic-cost').style.color = '#ff4444'; // Red cost
            }

            // Click handler
            const handleBuy = (e) => {
                if (e.type === 'touchstart') e.preventDefault();

                if (this.game.ene >= scaledCost) {
                    // Create a temporary relic object with the scaled cost to pass to applyRelic
                    const relicToBuy = { ...relic, cost: scaledCost };
                    this.game.applyRelic(relicToBuy);
                } else {
                    // Visual feedback: not enough Ene
                    card.style.border = '2px solid red';
                    setTimeout(() => card.style.border = '', 500);
                }
            };

            card.addEventListener('touchstart', handleBuy, { passive: false });
            card.addEventListener('click', handleBuy);

            // Disable if not enough Ene
            if (this.game.ene < relic.cost) {
                card.style.opacity = '0.5';
                card.style.cursor = 'not-allowed';
            }

            container.appendChild(card);
        });

        this.showScreen('reward');
    }

    drawRelicIcon(ctx, id, w, h, color) {
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        if (id === 'atk_up') {
            // Cyber Katana (Sword)
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + 10);
            ctx.lineTo(cx + 15, cy - 15); // Blade
            ctx.stroke();
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + 10);
            ctx.lineTo(cx - 15, cy + 15); // Handle
            ctx.stroke();
            // Tsuba (Guard)
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy + 8);
            ctx.lineTo(cx - 12, cy + 12);
            ctx.stroke();
        } else if (id === 'spd_up') {
            // Neko Headphones
            ctx.beginPath();
            ctx.arc(cx, cy, 15, Math.PI, 0); // Band
            ctx.stroke();
            // Ear cups
            ctx.fillRect(cx - 18, cy - 5, 6, 15);
            ctx.fillRect(cx + 12, cy - 5, 6, 15);
            // Cat ears
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy - 15);
            ctx.lineTo(cx - 5, cy - 25);
            ctx.lineTo(cx, cy - 15);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy - 15);
            ctx.lineTo(cx + 5, cy - 25);
            ctx.lineTo(cx, cy - 15);
            ctx.fill();
        } else if (id === 'hp_up') {
            // Energy Drink (Can)
            ctx.fillRect(cx - 10, cy - 15, 20, 30);
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx - 5, cy - 5, 10, 10); // Logo
        } else if (id === 'rate_up') {
            // Overclock Chip
            ctx.strokeRect(cx - 12, cy - 12, 24, 24);
            ctx.fillRect(cx - 6, cy - 6, 12, 12); // Core
            // Pins
            ctx.beginPath();
            ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 18, cy);
            ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 18, cy);
            ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 18);
            ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy + 18);
            ctx.stroke();
        } else if (id === 'range_up') {
            // Scope Lens
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
            // Crosshair
            ctx.beginPath();
            ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy);
            ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15);
            ctx.stroke();
        } else if (id === 'drone') {
            // Drone Icon
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2); // Body
            ctx.fill();
            // Rotors
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx - 12, cy - 12); ctx.lineTo(cx + 12, cy + 12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 12, cy - 12); ctx.lineTo(cx - 12, cy + 12); ctx.stroke();
        } else if (id === 'missile') {
            // Missile Icon
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 15);
            ctx.lineTo(cx + 8, cy + 10);
            ctx.lineTo(cx, cy + 5);
            ctx.lineTo(cx - 8, cy + 10);
            ctx.fill();
        } else {
            // Default Circle
            ctx.beginPath();
            ctx.arc(cx, cy, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        if (this.screens[name]) {
            this.screens[name].classList.remove('hidden');
        }
        if (name === 'home') {
            this.drawCharacterPreviews();
        }
    }

    updateHUD(hpPercent, ene, currentHp, maxHp, time, difficulty) {
        document.getElementById('hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('score-ene').innerText = ene;

        // Update HP Text
        if (currentHp !== undefined && maxHp !== undefined) {
            document.getElementById('hp-text').innerText = `${Math.ceil(currentHp)}/${Math.ceil(maxHp)}`;
        }

        // Update Time
        if (time !== undefined) {
            const m = Math.floor(time / 60).toString().padStart(2, '0');
            const s = Math.floor(time % 60).toString().padStart(2, '0');
            document.getElementById('game-time').innerText = `${m}:${s}`;
        }

        // Update Difficulty
        if (difficulty !== undefined) {
            document.getElementById('game-difficulty').innerText = `Lv. ${difficulty.toFixed(2)}`;
        }
    }

    updateHome() {
        document.getElementById('player-money').innerText = this.game.money;
        document.getElementById('cost-hp').innerText = this.game.upgradeSystem.upgrades.maxHp.cost;
        document.getElementById('cost-dmg').innerText = this.game.upgradeSystem.upgrades.damage.cost;
    }

    updateAcquiredItems(relics) {
        const container = document.getElementById('acquired-items-container');
        container.innerHTML = '';

        // Group relics by ID
        const counts = {};
        const uniqueRelics = [];

        relics.forEach(relic => {
            if (!counts[relic.id]) {
                counts[relic.id] = 0;
                uniqueRelics.push(relic);
            }
            counts[relic.id]++;
        });

        uniqueRelics.forEach(relic => {
            const wrapper = document.createElement('div');
            wrapper.className = 'acquired-item-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '0 5px';

            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 40;
            iconCanvas.height = 40;
            iconCanvas.className = 'acquired-item-icon';
            iconCanvas.title = relic.name; // Tooltip

            const ctx = iconCanvas.getContext('2d');
            // Use helper to draw icon (scaled down)
            this.drawRelicIcon(ctx, relic.id, 40, 40, relic.color);

            wrapper.appendChild(iconCanvas);

            // Add count badge if > 1
            if (counts[relic.id] > 1) {
                const badge = document.createElement('div');
                badge.className = 'item-count-badge';
                badge.innerText = `x${counts[relic.id]}`;
                badge.style.position = 'absolute';
                badge.style.bottom = '0';
                badge.style.right = '0';
                badge.style.background = 'rgba(0,0,0,0.8)';
                badge.style.color = '#fff';
                badge.style.fontSize = '10px';
                badge.style.padding = '2px 4px';
                badge.style.borderRadius = '4px';
                badge.style.border = '1px solid #fff';
                wrapper.appendChild(badge);
            }

            container.appendChild(wrapper);
        });
    }

    updateGameOverStats(ene, killCount, relics) {
        document.getElementById('go-ene').innerText = ene;

        // Enemies
        const enemyContainer = document.getElementById('go-enemies');
        enemyContainer.innerHTML = '';

        // Define enemy display data
        const enemyTypes = {
            'slime': { color: '#00ff88', name: 'Slime' },
            'lizard': { color: '#aa00ff', name: 'Lizard' },
            'golem': { color: '#ff4444', name: 'Golem' },
            'totem': { color: '#ff00ff', name: 'Totem' },
            'kamikaze': { color: '#ffaa00', name: 'Kamikaze' },
            'missile_enemy': { color: '#ff0088', name: 'Missile Bot' },
            'beam_enemy': { color: '#0088ff', name: 'Beam Bot' }
        };

        for (const [type, count] of Object.entries(killCount)) {
            if (count <= 0) continue;
            const data = enemyTypes[type] || { color: '#fff', name: 'Unknown' };

            const wrapper = document.createElement('div');
            wrapper.className = 'result-item-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '5px';

            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            canvas.className = 'result-item-icon';
            const ctx = canvas.getContext('2d');
            this.drawEnemyIcon(ctx, type, data.color);

            wrapper.appendChild(canvas);

            const badge = document.createElement('div');
            badge.innerText = `${count}`;
            badge.className = 'result-count-badge';

            wrapper.appendChild(badge);
            enemyContainer.appendChild(wrapper);
        }

        // Items
        const itemContainer = document.getElementById('go-items');
        itemContainer.innerHTML = '';

        const itemCounts = {};
        relics.forEach(r => {
            if (!itemCounts[r.id]) itemCounts[r.id] = { count: 0, data: r };
            itemCounts[r.id].count++;
        });

        for (const [id, info] of Object.entries(itemCounts)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'result-item-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '5px';

            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            canvas.className = 'result-item-icon';
            const ctx = canvas.getContext('2d');
            this.drawRelicIcon(ctx, id, 40, 40, info.data.color);

            wrapper.appendChild(canvas);

            const badge = document.createElement('div');
            badge.innerText = `${info.count}`;
            badge.className = 'result-count-badge';

            wrapper.appendChild(badge);
            itemContainer.appendChild(wrapper);
        }
    }

    drawEnemyIcon(ctx, type, color) {
        const cx = 20;
        const cy = 20;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        // Scale down slightly (0.8x)
        const s = 0.8;

        if (type === 'slime') {
            ctx.beginPath(); ctx.arc(cx, cy, 10 * s, 0, Math.PI * 2); ctx.fill();
        } else if (type === 'kamikaze') {
            // Spiky
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 * i) / 8;
                const r = (i % 2 === 0 ? 12 : 6) * s;
                ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            ctx.fill();
        } else if (type === 'golem') {
            ctx.fillRect(cx - 10 * s, cy - 10 * s, 20 * s, 20 * s);
        } else if (type === 'lizard') {
            ctx.beginPath();
            ctx.moveTo(cx + 10 * s, cy);
            ctx.lineTo(cx - 10 * s, cy + 8 * s);
            ctx.lineTo(cx - 10 * s, cy - 8 * s);
            ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(cx, cy, 10 * s, 0, Math.PI * 2); ctx.stroke();
        }
    }
}


// --- js/game/Game.js ---















class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // World & Camera
        this.worldWidth = 2000;
        this.worldHeight = 2000;
        this.camera = { x: 0, y: 0 };

        // Game Entities
        this.waveManager = null;
        this.player = null;
        this.drops = [];
        this.enemyProjectiles = [];
        this.chests = [];
        this.floatingTexts = [];
        this.acquiredRelics = [];
        this.obstacles = [];
        this.particles = []; // New Particle System
        this.currentChest = null; // Track which chest is currently open

        // No more sprite assets - Procedural Neon Graphics

        this.state = 'title'; // title, home, playing, reward, result
        this.money = 0;
        this.ene = 0;
        this.mapLevel = 1;
        this.mapLevel = 1;
        this.selectedCharacter = 'girl';
        this.debugMode = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new InputHandler();
        this.ui = new UIManager(this);
        this.upgradeSystem = new UpgradeSystem(this);
        this.audio = new AudioManager();
        this.minimap = null; // Created after game starts

        this.setState('title');
        this.running = false;
        this.lastTime = 0;
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }

    setState(newState) {
        this.state = newState;
        this.ui.showScreen(newState === 'playing' ? 'hud' : newState);

        if (newState === 'playing') {
            if (!this.player) this.startRun(); // Only start run if not resuming
        } else if (newState === 'title') {
            // Reset
        } else if (newState === 'home') {
            this.ui.updateHome();
        }
    }

    startRun(preserveStats = false) {
        // Initialize audio on first start
        this.audio.init();
        this.audio.playBGM();

        // Create minimap
        this.minimap = new Minimap(this);

        // Save previous stats if preserving
        let prevHp = this.player ? this.player.hp : null;
        let prevMaxHp = this.player ? this.player.maxHp : null;
        let prevDamage = this.player ? this.player.damage : null;
        let prevSpeed = this.player ? this.player.speed : null;
        let prevRelics = this.acquiredRelics;

        // Calculate difficulty based on map level
        // Map 1: 1.0, Map 2: 1.5, Map 3: 2.0, Loop: +0.5 per loop
        const baseDifficulty = 1.0 + (this.mapLevel - 1) * 0.5;

        this.waveManager = new WaveManager(this, baseDifficulty);
        this.player = new Player(this, this.worldWidth / 2, this.worldHeight / 2);
        this.drones = []; // Initialize before applying upgrades (which might add drones)

        // Re-apply upgrades (Base stats)
        this.upgradeSystem.applyUpgrades(this.player);

        if (preserveStats) {
            // Restore Relics FIRST to establish Max Stats correctly
            // (Base Stats + Upgrades are already applied by new Player() and applyUpgrades())
            this.acquiredRelics = prevRelics;
            this.acquiredRelics.forEach(relic => {
                relic.effect(this.player);
            });

            // Restore HP (Maintain percentage from previous run)
            if (prevHp && prevMaxHp) {
                const hpPercent = prevHp / prevMaxHp;
                this.player.hp = this.player.maxHp * hpPercent;
            }

            // Heal player slightly on new stage
            this.player.hp = Math.min(this.player.hp + 20, this.player.maxHp);
        } else {
            this.acquiredRelics = [];
            this.ene = 0;
        }

        this.killCount = {}; // Track kills by type

        this.drops = [];
        this.enemyProjectiles = [];
        this.chests = [];
        this.floatingTexts = [];
        this.particles = [];
        // this.drones = []; // Moved to top

        // Generate obstacles
        this.obstacles = [];
        const obstacleCount = 15 + this.mapLevel * 5;
        for (let i = 0; i < obstacleCount; i++) {
            const x = Math.random() * this.worldWidth;
            const y = Math.random() * this.worldHeight;
            // Avoid spawning near player start
            const dx = x - this.worldWidth / 2;
            const dy = y - this.worldHeight / 2;
            if (Math.sqrt(dx * dx + dy * dy) > 200) {
                this.obstacles.push(new Obstacle(this, x, y));
            }
        }

        // Spawn Boss Altar (Far from player)
        this.waveManager.spawnAltar();

        // Spawn Initial Chests (Scattered)
        const chestCount = 10;
        for (let i = 0; i < chestCount; i++) {
            const x = Math.random() * (this.worldWidth - 100) + 50;
            const y = Math.random() * (this.worldHeight - 100) + 50;
            // Simple check to avoid spawning on top of player
            const dx = x - this.player.x;
            const dy = y - this.player.y;
            if (dx * dx + dy * dy > 40000) { // > 200px away
                this.chests.push(new Chest(this, x, y));
            }
        }

        // Update HUD immediately
        this.ui.updateAcquiredItems(this.acquiredRelics);
    }

    loop(timestamp) {
        if (!this.running) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        if (this.state === 'reward') return; // Pause for reward selection

        if (this.state === 'playing') {
            if (this.player) {
                this.player.update(dt);
                this.updateCamera();
            }
            if (this.waveManager) this.waveManager.update(dt);

            this.drops.forEach(d => d.update(dt));
            this.drops = this.drops.filter(d => !d.markedForDeletion);

            this.enemyProjectiles.forEach(p => p.update(dt));
            this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.markedForDeletion);

            this.chests.forEach(c => c.update(dt));

            this.particles.forEach(p => p.update(dt));
            this.particles = this.particles.filter(p => !p.markedForDeletion);

            this.floatingTexts.forEach(t => t.update(dt));
            this.floatingTexts = this.floatingTexts.filter(t => !t.markedForDeletion);

            this.obstacles.forEach(o => o.update(dt));

            this.drones.forEach(d => d.update(dt));

            this.checkCollisions();

            // Global Death Check (catches non-collision damage like self-destructs)
            if (this.player && this.player.hp <= 0) {
                this.gameOver();
            }

            // Update HUD
            if (this.player && this.waveManager) {
                const hpPercent = (this.player.hp / this.player.maxHp) * 100;
                this.ui.updateHUD(
                    hpPercent,
                    this.ene,
                    this.player.hp,
                    this.player.maxHp,
                    this.waveManager.time,
                    this.waveManager.difficulty
                );
            }
        }
    }

    updateCamera() {
        // Center camera on player
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        // Clamp camera to world bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight - this.canvas.height));
    }

    checkCollisions() {
        if (!this.player || !this.waveManager) return;

        // Player vs Enemies
        this.waveManager.enemies.forEach(enemy => {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.radius + this.player.radius) {
                const dmg = 10 * 0.016 * this.waveManager.difficulty; // Scale damage
                this.player.hp -= dmg;
                if (this.player.hp <= 0) {
                    this.gameOver();
                }
            }
        });

        // Player vs Obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.collidesWith(this.player.x, this.player.y, this.player.radius)) {
                // Push player back
                const dx = this.player.x - obstacle.x;
                const dy = this.player.y - obstacle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const overlap = (obstacle.radius + this.player.radius) - dist;
                    this.player.x += (dx / dist) * overlap;
                    this.player.y += (dy / dist) * overlap;
                }
            }
        });

        // Projectiles vs Enemies
        this.player.projectiles.forEach(proj => {
            this.waveManager.enemies.forEach(enemy => {
                if (proj.markedForDeletion || enemy.markedForDeletion) return;

                const dx = enemy.x - proj.x;
                const dy = enemy.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < enemy.radius + proj.radius) {
                    enemy.hp -= proj.damage;
                    this.showDamage(enemy.x, enemy.y, Math.round(proj.damage), '#fff');
                    this.audio.playHit(); // Sound effect
                    proj.markedForDeletion = true;

                    // Spawn Particles
                    for (let i = 0; i < 5; i++) {
                        this.particles.push(new Particle(this, enemy.x, enemy.y, enemy.color));
                    }

                    if (enemy.hp <= 0) {
                        enemy.markedForDeletion = true;
                        // Drop Scaling: Value based on Max HP
                        const dropValue = Math.max(1, Math.floor(enemy.maxHp / 10));
                        this.drops.push(new Drop(this, enemy.x, enemy.y, 'energy', dropValue));

                        // Track Kill
                        if (!this.killCount[enemy.type]) this.killCount[enemy.type] = 0;
                        this.killCount[enemy.type]++;
                    }
                }
            });
        });

        // Enemy Projectiles vs Player
        this.enemyProjectiles.forEach(proj => {
            if (proj.markedForDeletion) return;
            const dx = this.player.x - proj.x;
            const dy = this.player.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + proj.radius) {
                this.player.hp -= proj.damage;
                this.showDamage(this.player.x, this.player.y, Math.round(proj.damage), '#ff0000');
                proj.markedForDeletion = true;
                if (this.player.hp <= 0) {
                    this.setState('result');
                }
            }
        });
    }

    showDamage(x, y, amount, color) {
        this.floatingTexts.push(new FloatingText(x, y, Math.round(amount), color));
    }

    openChest(chest) {
        console.log("Chest Opened!");
        this.currentChest = chest; // Track this chest
        this.audio.playLevelUp(); // Sound effect
        this.setState('reward');
        this.ui.showRewardSelection(chest.contents, chest.difficulty);
    }

    closeRewardWithoutPurchase() {
        // Re-activate the chest after a short cooldown to avoid immediate re-open
        if (this.currentChest) {
            const chest = this.currentChest;
            chest.active = false; // temporarily deactivate
            setTimeout(() => {
                chest.active = true;
            }, 500); // 0.5s cooldown
        }
        this.currentChest = null;
        this.setState('playing');
    }

    applyRelic(relic) {
        console.log(`Applied Relic: ${relic.name}`);

        // Deduct Ene
        this.ene -= relic.cost;

        // Apply effect
        relic.effect(this.player);
        this.acquiredRelics.push(relic);

        // Update acquired items HUD
        this.ui.updateAcquiredItems(this.acquiredRelics);

        // Clear current chest (purchase was made)
        this.currentChest = null;

        this.setState('playing');
    }



    draw() {
        // Clear screen
        this.ctx.fillStyle = '#101018';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'playing' || this.state === 'reward') {
            this.ctx.save();
            this.ctx.translate(-this.camera.x, -this.camera.y);

            this.drawBackground();
            this.drawGrid();

            // Draw Entities
            this.obstacles.forEach(o => o.draw(this.ctx));
            this.chests.forEach(c => c.draw(this.ctx));
            this.drops.forEach(d => d.draw(this.ctx));

            if (this.player) this.player.draw(this.ctx);
            if (this.waveManager) this.waveManager.draw(this.ctx);

            this.drones.forEach(d => d.draw(this.ctx));
            this.enemyProjectiles.forEach(p => p.draw(this.ctx));
            this.particles.forEach(p => p.draw(this.ctx));
            this.floatingTexts.forEach(t => t.draw(this.ctx));

            // Draw World Border
            this.ctx.strokeStyle = '#ff00ff';
            this.ctx.lineWidth = 5;
            this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

            this.ctx.restore();

            this.minimap.draw();
        } else {
            this.drawGrid(); // Static grid for menus
        }
    }

    drawBackground() {
        // Map-specific background
        const mapLevel = this.mapLevel || 1;

        if (mapLevel === 1) {
            // Green/Teal theme
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#0a2a1a');
            gradient.addColorStop(1, '#051510');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Particles (stars/sparkles)
            this.ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            for (let i = 0; i < 50; i++) {
                const x = (i * 317 + this.waveManager.time * 10) % this.worldWidth;
                const y = (i * 213 + this.waveManager.time * 5) % this.worldHeight;
                this.ctx.fillRect(x, y, 2, 2);
            }
        } else if (mapLevel === 2) {
            // Orange/Red theme
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#2a1a0a');
            gradient.addColorStop(1, '#150a05');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Rocky textures (rectangles)
            this.ctx.fillStyle = 'rgba(255, 136, 68, 0.2)';
            for (let i = 0; i < 20; i++) {
                const x = (i * 457) % this.worldWidth;
                const y = (i * 283) % this.worldHeight;
                this.ctx.fillRect(x, y, 50, 30);
            }
        } else {
            // Purple/Pink theme
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#1a0a2a');
            gradient.addColorStop(1, '#0a0515');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Glitch effects (random stripes)
            const time = this.waveManager ? this.waveManager.time : 0;
            this.ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
            for (let i = 0; i < 10; i++) {
                const y = (i * 137 + time * 50) % this.worldHeight;
                const h = 10 + Math.sin(time + i) * 5;
                this.ctx.fillRect(0, y, this.worldWidth, h);
            }
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        const gridSize = 100;

        // Draw grid based on world coordinates
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = startX + this.canvas.width + gridSize;
        const endY = startY + this.canvas.height + gridSize;

        for (let x = startX; x < endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.camera.y);
            this.ctx.lineTo(x, this.camera.y + this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = startY; y < endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.camera.x, y);
            this.ctx.lineTo(this.camera.x + this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    addDrone() {
        if (!this.player) return;
        const drone = new Drone(this, this.player);
        // Offset angle for multiple drones
        drone.angle = (Math.PI * 2 / (this.drones.length + 1)) * this.drones.length;
        this.drones.push(drone);
        console.log("Drone added!");
    }

    nextMap() {
        this.mapLevel++;
        this.startRun(true); // Preserve stats
        this.setState('playing');
    }

    bossDefeated() {
        this.setState('result');
        const bonusMoney = Math.floor(this.ene * 0.5) + (this.mapLevel * 100);
        this.money += bonusMoney;
        this.upgradeSystem.save();

        document.getElementById('result-ene').innerText = this.ene;
        document.getElementById('result-money').innerText = bonusMoney;

        const btnLoop = document.getElementById('btn-loop');
        if (this.mapLevel >= 3) {
            btnLoop.innerText = "LOOP (Restart Map 1)";
        } else {
            btnLoop.innerText = `NEXT MAP (Level ${this.mapLevel + 1})`;
        }
    }

    gameOver() {
        this.setState('gameover');
        this.ui.updateGameOverStats(this.ene, this.killCount, this.acquiredRelics);
        // Reset map level on game over
        this.mapLevel = 1;
        this.upgradeSystem.save();
    }
}


// --- js/game/main.js ---


window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    game.start();
});


