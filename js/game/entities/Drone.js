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
