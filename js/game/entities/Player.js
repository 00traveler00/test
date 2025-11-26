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
