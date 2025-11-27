import { Projectile } from './Projectile.js';
import { Missile } from './Missile.js';
import { PiercingProjectile } from './PiercingProjectile.js';

export class Player {
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
        this.missileCount = 0; // Number of missile launchers acquired
        this.missileTimer = 0;
        this.missileQueue = 0; // Number of missiles waiting to fire
        this.missileBurstTimer = 0; // Timer for burst firing
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
        console.log(`Player initialized: ${charType}, Damage: ${this.damage}`);
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
            if (target) {
                this.shoot(target);
                this.shootTimer = 0;
            }
        }

        // Update Projectiles
        this.projectiles.forEach(p => p.update(dt));
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);

        // Missile Launcher Logic - Fire missiles sequentially
        if (this.missileCount > 0) {
            this.missileTimer += dt;

            // Queue missiles to fire
            if (this.missileTimer >= 1.5 && this.missileQueue === 0) {
                const target = this.findNearestEnemy();
                if (target) {
                    this.missileQueue = this.missileCount; // Queue all missiles
                    this.missileBurstTimer = 0;
                    this.missileTimer = 0;
                }
            }

            // Fire missiles from queue sequentially
            if (this.missileQueue > 0) {
                this.missileBurstTimer += dt;
                if (this.missileBurstTimer >= 0.1) { // Fire one every 0.1s
                    const target = this.findNearestEnemy();
                    if (target) {
                        this.projectiles.push(new Missile(this.game, this.x, this.y, target));
                        this.missileQueue--;
                        this.missileBurstTimer = 0;
                    } else {
                        // No target, cancel queue
                        this.missileQueue = 0;
                    }
                }
            }
        }
    }

    shoot(target) {
        this.game.audio.playShoot(); // Sound effect

        // Calculate base shots (1 for normal, 3 for dog)
        let baseShots = [];
        if (this.charType === 'dog') {
            // Dog Skill: 3-way shot
            baseShots = [0, 0.2, -0.2];
        } else {
            // Normal shot
            baseShots = [0];
        }

        // Splitter Module: Add extra shots with wider angles
        if (this.multiShotCount && this.multiShotCount > 1) {
            const extraShots = this.multiShotCount - 1;
            const angleStep = 0.15; // Spread angle between extra shots

            for (let i = 0; i < extraShots; i++) {
                const angleOffset = angleStep * (i + 1);
                baseShots.push(angleOffset);
                baseShots.push(-angleOffset);
            }
        }

        // Fire all shots
        baseShots.forEach(angle => {
            this.projectiles.push(new Projectile(this.game, this.x, this.y, target, angle));
        });

        // Plasma Orb: Fire piercing projectiles
        if (this.pierceShotCount && this.pierceShotCount > 0) {
            for (let i = 0; i < this.pierceShotCount; i++) {
                // Offset piercing shots slightly to avoid complete overlap
                const pierceAngle = i * 0.05;
                this.projectiles.push(new PiercingProjectile(this.game, this.x, this.y, target, pierceAngle));
            }
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

        // Electric Sparks (Cat specific)
        if (this.charType === 'cat' && Math.random() < 0.1) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const angle = Math.random() * Math.PI * 2;
            ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            ctx.lineTo(Math.cos(angle) * (r + 10), Math.sin(angle) * (r + 10));
            ctx.stroke();
        }

        // Accessories
        this.drawAccessories(ctx, r);

        ctx.restore();
    }

    drawAccessories(ctx, r) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        if (this.charType === 'cat') {
            // Obtuse Cat Ears (Wider and Shorter)
            ctx.beginPath();
            ctx.moveTo(-15, -10);
            ctx.lineTo(-22, -20);
            ctx.lineTo(-5, -18);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(15, -10);
            ctx.lineTo(22, -20);
            ctx.lineTo(5, -18);
            ctx.fill();
            ctx.stroke();

            // Whiskers
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Left
            ctx.moveTo(-5, 2); ctx.lineTo(-18, 0);
            ctx.moveTo(-5, 5); ctx.lineTo(-18, 6);
            // Right
            ctx.moveTo(5, 2); ctx.lineTo(18, 0);
            ctx.moveTo(5, 5); ctx.lineTo(18, 6);
            ctx.stroke();

            // Cyber Tail (Animated)
            const tailWag = Math.sin(this.time * 4) * 10;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, r * 0.8);
            ctx.quadraticCurveTo(15 + tailWag, r + 5, 18 + tailWag, r - 5);
            ctx.stroke();

        } else if (this.charType === 'girl') {
            // Small Halo at Top (Blue Archive style)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fff';
            ctx.beginPath();
            ctx.arc(0, -r * 2.2, r * 0.4, 0, Math.PI * 2);
            ctx.stroke();

            // Inner glow
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, -r * 2.2, r * 0.3, 0, Math.PI * 2);
            ctx.stroke();

            // Crystal Halo (Hexagon)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + this.time;
                const hx = Math.cos(angle) * (r * 1.6);
                const hy = Math.sin(angle) * (r * 1.6);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.stroke();

            // Orbital Ring
            ctx.strokeStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 2.0, r * 0.6, this.time * 2, 0, Math.PI * 2);
            ctx.stroke();

            // Particle Tail (Simulated)
            const tailY = Math.sin(this.time * 5) * 5;
            ctx.fillStyle = this.color;
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(-i * 10, 15 + tailY * (i / 2), 4 - i, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (this.charType === 'dog') {
            // Animated Ears (Synchronized up/down)
            const earWiggle = Math.sin(this.time * 10) * 3;

            ctx.fillStyle = '#ffaa00';
            // Both ears move together
            ctx.beginPath();
            ctx.ellipse(-18, -5 + earWiggle, 8, 14, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(18, -5 + earWiggle, 8, 14, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Collar
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 10, 12, 0, Math.PI);
            ctx.stroke();

        } else if (this.charType === 'boy') {
            // Cooler Cyber Ninja - Dark tactical helmet
            ctx.fillStyle = '#001100';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            // Helmet shape
            ctx.arc(0, -2, r * 1.1, Math.PI * 0.8, Math.PI * 0.2);
            ctx.lineTo(r * 0.9, 5);
            ctx.lineTo(-r * 0.9, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Glowing Eye Visor (horizontal line)
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.rect(-r * 0.8, -4, r * 1.6, 3);
            ctx.fill();

            // Forehead plate detail
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(-6, -8);
            ctx.lineTo(0, -12);
            ctx.lineTo(6, -8);
            ctx.stroke();

            // Shoulder guards
            ctx.fillStyle = '#003300';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(-r, 8);
            ctx.lineTo(-r * 1.4, 12);
            ctx.lineTo(-r * 1.2, 18);
            ctx.lineTo(-r * 0.8, 15);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(r, 8);
            ctx.lineTo(r * 1.4, 12);
            ctx.lineTo(r * 1.2, 18);
            ctx.lineTo(r * 0.8, 15);
            ctx.fill();
            ctx.stroke();
        }
    }
}
