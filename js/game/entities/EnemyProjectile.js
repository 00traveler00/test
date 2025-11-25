export class EnemyProjectile {
    constructor(game, x, y, target, type = 'normal', damage = 10) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type; // normal, fireball, void, slime, plasma
        this.speed = 200;
        this.radius = 6;
        this.damage = damage;
        this.markedForDeletion = false;
        this.color = '#ff4400';
        this.timer = 0; // For animation

        // Calculate direction to target (player)
        // Target can be an object {x, y} or the player entity
        const dx = target.x - x;
        const dy = target.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        } else {
            this.vx = this.speed;
            this.vy = 0;
        }

        // Set default colors based on type
        if (this.type === 'fireball') this.color = '#ffaa00';
        else if (this.type === 'void') this.color = '#aa00ff';
        else if (this.type === 'slime') this.color = '#00ff88';
        else if (this.type === 'plasma') this.color = '#00ffff';
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.timer += dt;

        // Check world bounds instead of canvas bounds
        if (this.x < 0 || this.x > this.game.worldWidth ||
            this.y < 0 || this.y > this.game.worldHeight) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.type === 'fireball') {
            // Fireball Effect
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(0.4, '#ff4400');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'void') {
            // Void Orb Effect
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Orbiting particles
            const angle = this.timer * 10;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + Math.cos(angle) * this.radius, this.y + Math.sin(angle) * this.radius, 2, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'slime') {
            // Slime Ball Effect
            const wobble = Math.sin(this.timer * 10) * 2;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + wobble, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();

        } else if (this.type === 'plasma') {
            // Plasma Bolt Effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
            ctx.stroke();

        } else {
            // Normal
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }
        ctx.restore();
    }
}
