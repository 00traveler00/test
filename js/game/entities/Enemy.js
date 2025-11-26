import { EnemyProjectile } from './EnemyProjectile.js';
import { EnemyMissile } from './EnemyMissile.js';
import { Particle } from './Particle.js';

export class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speed = 50;
        this.radius = 15;
        this.hp = 10;
        this.maxHp = 10;
        this.damage = 5;
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

    takeDamage(amount) {
        this.hp -= amount;
        return true;
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

export class Slime extends Enemy {
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

export class Golem extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 40;
        this.hp = 100;
        this.maxHp = 100;
        this.radius = 25;
        this.damage = 10;
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

export class Lizard extends Enemy {
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
            new EnemyProjectile(this.game, this.x, this.y, this.game.player, 'normal', this.damage)
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

export class Totem extends Enemy {
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
            this.game.player.hp -= this.damage * 2.0 * 0.016; // Rapid damage (scaled)
            if (this.game.player.hp <= 0) this.game.gameOver();
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

export class KamikazeEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.speed = 180;
        this.hp = 15;
        this.maxHp = 15;
        this.damage = 20; // High damage
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
        let dmg = this.damage * (this.game.player.damageMultiplier || 1.0); // Titanium Plating effect

        // Energy Barrier: Shield absorbs damage first
        if (this.game.player.shield && this.game.player.shield > 0) {
            const shieldAbsorb = Math.min(this.game.player.shield, dmg);
            this.game.player.shield -= shieldAbsorb;
            dmg -= shieldAbsorb;
            if (shieldAbsorb > 0) {
                this.game.showDamage(this.game.player.x, this.game.player.y - 20, Math.round(shieldAbsorb), '#8888ff');
            }
        }

        // Reset shield regeneration timer on hit
        if (this.game.player.shieldRegenTimer !== undefined) {
            this.game.player.shieldRegenTimer = 0;
        }

        this.game.player.hp -= dmg;
        this.game.showDamage(this.game.player.x, this.game.player.y, Math.round(dmg), '#ffaa00');

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

export class MissileEnemy extends Enemy {
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
            new EnemyMissile(this.game, this.x, this.y, this.game.player, this.damage)
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

export class BeamEnemy extends Enemy {
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
                p.hp -= this.damage * 2.0 * 0.016; // Rapid damage (scaled)
                if (p.hp <= 0) this.game.gameOver();
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
