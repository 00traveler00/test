import { Enemy } from './Enemy.js';
import { EnemyProjectile } from './EnemyProjectile.js';
import { Particle } from './Particle.js';

// --- Base Boss Class ---
export class BaseBoss extends Enemy {
    constructor(game, x, y, type = 'boss') {
        super(game, x, y);
        this.type = type;
        this.isBoss = true;

        // Base Stats (Will be scaled by WaveManager)
        this.radius = 60;
        this.speed = 80;
        this.hp = 1000;
        this.maxHp = 1000;
        this.damage = 15;
        this.color = '#ff0000';

        // State Machine
        this.state = 'chase';
        this.stateTimer = 0;
        this.stateDuration = 5.0;

        this.pulse = 0;
        this.angle = 0; // Facing angle
    }

    update(dt) {
        this.pulse += dt * 5;
        this.stateTimer += dt;

        // State Transitions
        if (this.stateTimer >= this.stateDuration) {
            this.switchState();
        }

        this.updateState(dt);

        // Always check bounds
        this.x = Math.max(this.radius, Math.min(this.x, this.game.worldWidth - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, this.game.worldHeight - this.radius));
    }

    switchState() {
        this.stateTimer = 0;
        this.state = 'chase';
        this.stateDuration = 2.0;
    }

    updateState(dt) {
        if (this.state === 'chase') {
            this.behaviorChase(dt);
        }
    }

    behaviorChase(dt) {
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    drawShape(ctx) {
        // Default Boss Shape
        ctx.save();
        ctx.rotate(this.pulse * 0.2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// --- Boss 1: Overlord (Balanced) ---
export class Overlord extends BaseBoss {
    constructor(game, x, y) {
        super(game, x, y, 'overlord');
        this.color = '#ff0000';

        // Attack Vars
        this.chargeTarget = { x: 0, y: 0 };
        this.barrageCount = 0;
        this.laserAngle = 0;
        this.isFiringLaser = false;
    }

    switchState() {
        this.stateTimer = 0;
        const rand = Math.random();

        if (this.state === 'chase') {
            if (rand < 0.4) this.startBarrage();
            else if (rand < 0.7) this.startCharge();
            else this.startLaser();
        } else {
            this.state = 'chase';
            this.stateDuration = 2.0 + Math.random() * 2.0;
            this.speed = 80;
            this.color = '#ff0000';
        }
    }

    updateState(dt) {
        switch (this.state) {
            case 'chase': this.behaviorChase(dt); break;
            case 'charge': this.behaviorCharge(dt); break;
            case 'barrage': this.behaviorBarrage(dt); break;
            case 'laser': this.behaviorLaser(dt); break;
        }
    }

    // -- Overlord Attacks --
    startCharge() {
        this.state = 'charge';
        this.stateDuration = 2.0;
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.chargeTarget = {
            x: this.x + (dx / dist) * 1000,
            y: this.y + (dy / dist) * 1000
        };
        this.color = '#ffaa00';
    }

    behaviorCharge(dt) {
        const dx = this.chargeTarget.x - this.x;
        const dy = this.chargeTarget.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
            this.x += (dx / dist) * 400 * dt;
            this.y += (dy / dist) * 400 * dt;
        } else {
            this.stateTimer = this.stateDuration;
        }
        if (Math.random() < 0.5) this.game.particles.push(new Particle(this.game, this.x, this.y, '#ffaa00'));
    }

    startBarrage() {
        this.state = 'barrage';
        this.stateDuration = 3.0;
        this.barrageCount = 0;
        this.color = '#ff00ff';
    }

    behaviorBarrage(dt) {
        this.behaviorChase(dt * 0.2);
        if (this.stateTimer > this.barrageCount * 0.2) {
            this.barrageCount++;
            const projectiles = 12;
            const offset = this.barrageCount * 0.2;
            for (let i = 0; i < projectiles; i++) {
                const angle = (Math.PI * 2 / projectiles) * i + offset;
                const tx = this.x + Math.cos(angle) * 100;
                const ty = this.y + Math.sin(angle) * 100;
                const p = new EnemyProjectile(this.game, this.x, this.y, { x: tx, y: ty }, 'plasma', this.damage);
                p.speed = 250;
                p.color = '#ff00ff'; // Override color for Overlord plasma
                this.game.enemyProjectiles.push(p);
            }
            this.game.audio.playHit();
        }
    }

    startLaser() {
        this.state = 'laser';
        this.stateDuration = 4.0;
        this.isFiringLaser = false;
        this.color = '#00ffff';
    }

    behaviorLaser(dt) {
        if (this.stateTimer < 1.0) {
            const dx = this.game.player.x - this.x;
            const dy = this.game.player.y - this.y;
            this.laserAngle = Math.atan2(dy, dx);
        } else {
            this.isFiringLaser = true;
            this.laserAngle += dt * 0.5;
            this.checkLaserCollision();
        }
    }

    checkLaserCollision() {
        const range = 600;
        const p = this.game.player;
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < range) {
            const angleToPlayer = Math.atan2(dy, dx);
            let angleDiff = angleToPlayer - this.laserAngle;
            while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (Math.abs(angleDiff) < 0.2) {
                const dmg = this.damage * 2.0 * 0.016; // Rapid damage
                p.hp -= dmg;
                if (p.hp <= 0) this.game.gameOver();
                this.game.showDamage(p.x, p.y, Math.ceil(dmg), '#00ffff');
            }
        }
    }

    drawShape(ctx) {
        // Complex Rotating Rings
        ctx.save();

        // Outer Ring (Slow)
        ctx.rotate(this.pulse * 0.2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        const r = this.radius + Math.sin(this.pulse) * 5;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Middle Ring (Fast Reverse)
        ctx.rotate(-this.pulse * 0.5);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // Nodes on Middle Ring
        for (let i = 0; i < 4; i++) {
            const a = (Math.PI * 2 / 4) * i;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * this.radius * 0.7, Math.sin(a) * this.radius * 0.7, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Inner Core (Pulsing)
        ctx.rotate(this.pulse * 0.3);
        const coreSize = this.radius * 0.4 + Math.sin(this.pulse * 5) * 5;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Laser Visuals
        if (this.state === 'laser' && this.isFiringLaser) {
            ctx.save();
            ctx.rotate(this.laserAngle);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(600, 0);
            ctx.lineWidth = 30 + Math.sin(this.pulse * 10) * 10;
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; ctx.stroke();
            ctx.lineWidth = 10; ctx.strokeStyle = '#fff'; ctx.stroke();
            ctx.restore();
        } else if (this.state === 'laser') {
            ctx.save();
            ctx.rotate(this.laserAngle);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(600, 0);
            ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.setLineDash([10, 10]); ctx.stroke();
            ctx.restore();
        }
    }
}

// --- Boss 2: Slime King (Giant Slime) ---
export class SlimeKing extends BaseBoss {
    constructor(game, x, y) {
        super(game, x, y, 'slime_king');
        this.name = 'SLIME KING';
        this.color = '#00ff88';
        this.radius = 80;
        this.jumpTarget = { x: 0, y: 0 };
        this.bubbles = [];
        for (let i = 0; i < 10; i++) {
            this.bubbles.push({
                x: (Math.random() - 0.5) * 40,
                y: (Math.random() - 0.5) * 40,
                r: Math.random() * 5 + 2,
                s: Math.random() * 20 + 10
            });
        }
    }

    switchState() {
        this.stateTimer = 0;
        const rand = Math.random();
        if (this.state === 'chase') {
            if (rand < 0.6) this.startJump();
            else this.startSpawnMinions();
        } else {
            this.state = 'chase';
            this.stateDuration = 2.0;
            this.speed = 60;
        }
    }

    updateState(dt) {
        if (this.state === 'chase') this.behaviorChase(dt);
        else if (this.state === 'jump') this.behaviorJump(dt);
        else if (this.state === 'spawn') this.behaviorSpawn(dt);

        // Update bubbles
        this.bubbles.forEach(b => {
            b.y -= dt * b.s;
            if (b.y < -40) b.y = 40;
        });
    }

    // --- Boss 2: Slime King (Giant Slime) ---
    startJump() {
        this.state = 'jump';
        this.stateDuration = 2.0;
        this.jumpTarget = { x: this.game.player.x, y: this.game.player.y };
        this.jumpProgress = 0;
    }

    behaviorJump(dt) {
        this.jumpProgress += dt;

        // 0.0s - 1.0s: Charge up / Jump Up (Visual only)
        if (this.jumpProgress < 1.0) {
            // Shadow at target
            // Handled in drawShape
        }
        // 1.0s: Impact
        else if (this.jumpProgress >= 1.0 && this.jumpProgress - dt < 1.0) {
            this.x = this.jumpTarget.x;
            this.y = this.jumpTarget.y;
            const dist = Math.hypot(this.game.player.x - this.x, this.game.player.y - this.y);
            if (dist < 150) {
                this.game.player.hp -= this.damage;
                this.game.showDamage(this.game.player.x, this.game.player.y, Math.round(this.damage), '#00ff88');
            }
            // Impact Particles
            for (let i = 0; i < 30; i++) {
                const p = new Particle(this.game, this.x, this.y, this.color);
                p.speed *= 2;
                this.game.particles.push(p);
            }
            this.game.audio.playHit();
        }
        // 1.0s - 2.0s: Recovery
    }

    startSpawnMinions() {
        this.state = 'spawn';
        this.stateDuration = 1.0;
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const p = new EnemyProjectile(this.game, this.x, this.y, { x: this.x + Math.cos(angle) * 100, y: this.y + Math.sin(angle) * 100 }, 'slime', this.damage);
            p.radius = 10;
            this.game.enemyProjectiles.push(p);
        }
    }

    behaviorSpawn(dt) { }

    drawShape(ctx) {
        // Wobbling Giant Slime
        const wobble = Math.sin(this.pulse) * 5;
        let scale = 1.0;
        let alpha = 1.0;

        if (this.state === 'jump') {
            if (this.jumpProgress < 1.0) {
                // Jumping up (scale down to simulate height)
                scale = 1.0 + Math.sin(this.jumpProgress * Math.PI) * 0.5;
                // Draw Target Indicator
                ctx.save();
                ctx.translate(this.jumpTarget.x - this.x, this.jumpTarget.y - this.y); // Relative to current pos
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * (this.jumpProgress), 0, Math.PI * 2); // Growing circle
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fill();
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.restore();
            } else {
                // Landing squish
                scale = 1.0 - Math.sin((this.jumpProgress - 1.0) * Math.PI) * 0.3;
            }
        }

        ctx.save();
        ctx.scale(scale, scale);

        // Outer Shell (Translucent)
        ctx.fillStyle = `rgba(0, 255, 136, ${0.3 * alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + wobble, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner Core
        ctx.fillStyle = `rgba(0, 255, 136, ${0.8 * alpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6 + wobble * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Bubbles
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * alpha})`;
        this.bubbles.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Crown (Detailed)
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-25, -this.radius + 5);
        ctx.lineTo(-15, -this.radius - 25);
        ctx.lineTo(0, -this.radius - 10);
        ctx.lineTo(15, -this.radius - 25);
        ctx.lineTo(25, -this.radius + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gem on Crown
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, -this.radius - 8, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// --- Boss 3: Mecha Golem (Giant Golem) ---
export class MechaGolem extends BaseBoss {
    constructor(game, x, y) {
        super(game, x, y, 'mecha_golem');
        this.name = 'MECHA GOLEM';
        this.color = '#ff4444';
        this.radius = 90;
    }

    switchState() {
        this.stateTimer = 0;
        const rand = Math.random();
        if (this.state === 'chase') {
            if (rand < 0.5) this.startRocketPunch();
            else this.startShield();
        } else {
            this.state = 'chase';
            this.stateDuration = 3.0;
        }
    }

    updateState(dt) {
        if (this.state === 'chase') this.behaviorChase(dt);
        else if (this.state === 'rocket') this.behaviorRocket(dt);
        else if (this.state === 'shield') this.behaviorShield(dt);
    }

    startRocketPunch() {
        this.state = 'rocket';
        this.stateDuration = 2.0;
        for (let i = -1; i <= 1; i++) {
            const angle = Math.atan2(this.game.player.y - this.y, this.game.player.x - this.x) + i * 0.3;
            const tx = this.x + Math.cos(angle) * 100;
            const ty = this.y + Math.sin(angle) * 100;
            const p = new EnemyProjectile(this.game, this.x, this.y, { x: tx, y: ty }, 'plasma', this.damage * 1.5);
            p.radius = 20;
            // p.damage = 40; // Removed hardcode
            p.color = '#ff0000';
            this.game.enemyProjectiles.push(p);
        }
    }

    behaviorRocket(dt) { }

    startShield() {
        this.state = 'shield';
        this.stateDuration = 4.0;
        this.hp = Math.min(this.hp + 10, this.maxHp);
    }

    behaviorShield(dt) { }

    takeDamage(amount) {
        if (this.state === 'shield') {
            // Block damage
            this.game.showDamage(this.x, this.y, 0, '#ffff00'); // Show 0 or "BLOCK"
            return false;
        }
        return super.takeDamage(amount);
    }

    drawShape(ctx) {
        // Hexagonal Golem Body
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
        ctx.beginPath();
        const r = this.radius;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mechanical Joints
        ctx.fillStyle = '#444';
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Glowing Eyes
        const eyeOffset = Math.sin(this.pulse * 2) * 2;
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillRect(-20, -10 + eyeOffset, 15, 5);
        ctx.fillRect(5, -10 + eyeOffset, 15, 5);
        ctx.shadowBlur = 0;

        // Shield Effect
        if (this.state === 'shield') {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r + 15, 0, Math.PI * 2);
            ctx.stroke();

            // Scanlines
            ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
            ctx.beginPath();
            ctx.arc(0, 0, r + 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            for (let i = -r; i < r; i += 10) {
                ctx.moveTo(-r, i + (this.pulse * 20) % 20);
                ctx.lineTo(r, i + (this.pulse * 20) % 20);
            }
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
            ctx.stroke();
        }
    }
}

// --- Boss 4: Void Phantom (Teleporter) ---
export class VoidPhantom extends BaseBoss {
    constructor(game, x, y) {
        super(game, x, y, 'void_phantom');
        this.name = 'VOID PHANTOM';
        this.color = '#aa00ff';
        this.radius = 50;
        this.teleportTarget = { x: 0, y: 0 };
        this.teleportTimer = 0;
    }

    switchState() {
        this.stateTimer = 0;
        const rand = Math.random();
        if (this.state === 'chase') {
            if (rand < 0.5) this.startTeleport();
            else this.startVoidOrbs();
        } else {
            this.state = 'chase';
            this.stateDuration = 2.0;
        }
    }

    updateState(dt) {
        if (this.state === 'chase') this.behaviorChase(dt);
        else if (this.state === 'teleport') this.behaviorTeleport(dt);
        else if (this.state === 'orbs') this.behaviorOrbs(dt);
    }

    startTeleport() {
        this.state = 'teleport';
        this.stateDuration = 1.5;
        this.teleportTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        this.teleportTarget.x = this.game.player.x + Math.cos(angle) * 200;
        this.teleportTarget.y = this.game.player.y + Math.sin(angle) * 200;
        // Clamp
        this.teleportTarget.x = Math.max(50, Math.min(this.teleportTarget.x, this.game.worldWidth - 50));
        this.teleportTarget.y = Math.max(50, Math.min(this.teleportTarget.y, this.game.worldHeight - 50));
    }

    behaviorTeleport(dt) {
        this.teleportTimer += dt;

        // 0.0s - 1.0s: Fade Out & Show Portal
        if (this.teleportTimer >= 1.0 && this.teleportTimer - dt < 1.0) {
            this.x = this.teleportTarget.x;
            this.y = this.teleportTarget.y;
        }
    }

    startVoidOrbs() {
        this.state = 'orbs';
        this.stateDuration = 2.0;
        const projectiles = 8;
        for (let i = 0; i < projectiles; i++) {
            const angle = (Math.PI * 2 / projectiles) * i;
            const tx = this.x + Math.cos(angle) * 100;
            const ty = this.y + Math.sin(angle) * 100;
            const p = new EnemyProjectile(this.game, this.x, this.y, { x: tx, y: ty }, 'void', this.damage);
            this.game.enemyProjectiles.push(p);
        }
    }

    behaviorOrbs(dt) { }

    drawShape(ctx) {
        let alpha = 1.0;
        if (this.state === 'teleport') {
            if (this.teleportTimer < 1.0) {
                alpha = 1.0 - this.teleportTimer; // Fade out

                // Draw Portal at target
                ctx.save();
                ctx.translate(this.teleportTarget.x - this.x, this.teleportTarget.y - this.y);
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * this.teleportTimer, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(170, 0, 255, 0.3)';
                ctx.fill();
                ctx.strokeStyle = '#aa00ff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Swirl
                ctx.rotate(this.teleportTimer * 10);
                ctx.beginPath();
                ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
                ctx.moveTo(0, -20); ctx.lineTo(0, 20);
                ctx.stroke();
                ctx.restore();
            } else {
                alpha = (this.teleportTimer - 1.0) * 2; // Fade in
            }
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        // Distortion Effect (Multiple Arcs)
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(170, 0, 255, ${0.5 - i * 0.1})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const r = this.radius + Math.sin(this.pulse + i) * 10;
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Void Center (Black Hole)
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Glowing Eyes
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#aa00ff';
        ctx.beginPath();
        ctx.arc(-15, -10, 6, 0, Math.PI * 2);
        ctx.arc(15, -10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

// --- Boss 5: Crimson Dragon (Fire Beast) ---
export class CrimsonDragon extends BaseBoss {
    constructor(game, x, y) {
        super(game, x, y, 'crimson_dragon');
        this.name = 'CRIMSON DRAGON';
        this.color = '#ffaa00';
        this.radius = 100;
        this.angle = 0;
    }

    switchState() {
        this.stateTimer = 0;
        const rand = Math.random();
        if (this.state === 'chase') {
            if (rand < 0.5) this.startFireBreath();
            else this.startMeteor();
        } else {
            this.state = 'chase';
            this.stateDuration = 3.0;
        }
    }

    updateState(dt) {
        // Always face player
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        this.angle = Math.atan2(dy, dx);

        if (this.state === 'chase') this.behaviorChase(dt);
        else if (this.state === 'breath') this.behaviorBreath(dt);
        else if (this.state === 'meteor') this.behaviorMeteor(dt);
    }

    startFireBreath() {
        this.state = 'breath';
        this.stateDuration = 2.0;
    }

    behaviorBreath(dt) {
        if (this.stateTimer % 0.1 < dt) {
            const angleToPlayer = Math.atan2(this.game.player.y - this.y, this.game.player.x - this.x);
            const spread = (Math.random() - 0.5) * 0.5;
            const angle = angleToPlayer + spread;
            const tx = this.x + Math.cos(angle) * 100;
            const ty = this.y + Math.sin(angle) * 100;
            const p = new EnemyProjectile(this.game, this.x, this.y, { x: tx, y: ty }, 'fireball', this.damage);
            p.radius = 12;
            this.game.enemyProjectiles.push(p);
        }
    }

    startMeteor() {
        this.state = 'meteor';
        this.stateDuration = 1.0;
        const p = new EnemyProjectile(this.game, this.x, this.y, this.game.player, 'fireball', this.damage * 2.0);
        p.speed = 400;
        p.radius = 30;
        this.game.enemyProjectiles.push(p);
    }

    behaviorMeteor(dt) { }

    drawShape(ctx) {
        // Rotate entire dragon to face player
        ctx.save();
        ctx.rotate(this.angle);

        // Dragon Head Shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0); // Nose
        ctx.lineTo(-this.radius * 0.5, this.radius * 0.6);
        ctx.lineTo(-this.radius, this.radius * 0.4); // Back Head
        ctx.lineTo(-this.radius, -this.radius * 0.4);
        ctx.lineTo(-this.radius * 0.5, -this.radius * 0.6);
        ctx.closePath();
        ctx.fill();

        // Scales
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(-this.radius * 0.5 + i * 10, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Wings (Detailed)
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Left Wing
        ctx.moveTo(0, 0);
        ctx.lineTo(-this.radius * 0.5, -this.radius * 1.8);
        ctx.lineTo(-this.radius * 1.5, -this.radius * 1.2);
        ctx.lineTo(-this.radius * 0.5, 0);
        // Right Wing
        ctx.moveTo(0, 0);
        ctx.lineTo(-this.radius * 0.5, this.radius * 1.8);
        ctx.lineTo(-this.radius * 1.5, this.radius * 1.2);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.stroke();

        // Wing Membranes
        ctx.fillStyle = 'rgba(255, 100, 0, 0.2)';
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.radius * 0.2, -this.radius * 0.2, 5, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.2, this.radius * 0.2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Fire Breath Particles (Visual only)
        if (this.state === 'breath') {
            ctx.fillStyle = `rgba(255, 170, 0, ${Math.random()})`;
            ctx.beginPath();
            ctx.arc(this.radius + 20, 0, 10 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
