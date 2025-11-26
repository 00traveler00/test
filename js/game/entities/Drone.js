import { Projectile } from './Projectile.js';

export class Drone {
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
        this.shootInterval = 1.0;
        this.shootTimer = 0;
        this.range = 300;
    }

    update(dt) {
        // Determine orbit center
        let centerX = this.player.x;
        let centerY = this.player.y;
        let orbitSpeed = this.speed;

        if (this.game.droneTarget && !this.game.droneTarget.markedForDeletion) {
            centerX = this.game.droneTarget.x;
            centerY = this.game.droneTarget.y;
            orbitSpeed = this.speed * 2; // Orbit faster around enemies
        }

        // Orbit logic
        this.angle += orbitSpeed * dt;

        // Target position
        const targetX = centerX + Math.cos(this.angle) * this.distance;
        const targetY = centerY + Math.sin(this.angle) * this.distance;

        // Smooth movement to target position (Lerp)
        const lerpFactor = 5.0 * dt;
        this.x += (targetX - this.x) * lerpFactor;
        this.y += (targetY - this.y) * lerpFactor;

        // Shoot nearest enemy
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = this.player.shootInterval; // Sync with player attack speed
        }
    }

    shoot() {
        if (!this.game.waveManager) return;

        // Shared Target Logic
        // Check if current target is valid
        if (this.game.droneTarget && (this.game.droneTarget.markedForDeletion || this.game.droneTarget.hp <= 0)) {
            this.game.droneTarget = null;
        }

        // If no target, find new one
        if (!this.game.droneTarget) {
            let nearest = null;
            let minDist = Infinity;

            this.game.waveManager.enemies.forEach(enemy => {
                if (enemy.markedForDeletion) return;

                const dx = enemy.x - this.player.x; // Find nearest to player, not drone
                const dy = enemy.y - this.player.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.range && dist < minDist) {
                    minDist = dist;
                    nearest = enemy;
                }
            });

            if (nearest) {
                this.game.droneTarget = nearest;
            }
        }

        // Attack shared target
        if (this.game.droneTarget) {
            const target = this.game.droneTarget;

            // Check if target is within range of THIS drone
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.range) {
                // Drones shoot standard projectiles for now
                const proj = new Projectile(this.game, this.x, this.y, target);
                proj.damage = this.game.player.damage * 1.0; // 100% of player damage
                proj.color = this.color;   // Override color
                this.game.player.projectiles.push(proj);
            }
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
