export class PiercingProjectile {
    constructor(game, x, y, target, angleOffset = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speed = 250; // Slightly slower than normal
        this.radius = 7; // Slightly larger
        this.damage = game.player.damage * 0.8; // 80% damage for balance
        this.markedForDeletion = false;
        this.color = '#00aaff'; // Cyan/blue color
        this.isCrit = false; // Lucky Dice: Critical hit flag
        this.hitEnemies = new Set(); // Track hit enemies to avoid multiple hits

        // Lucky Dice: Critical hit chance
        if (game.player.critChance && Math.random() < game.player.critChance) {
            this.isCrit = true;
            this.damage *= 2; // Critical damage is 2x
        }

        // Safeguard: Ensure damage is a valid number
        if (isNaN(this.damage)) {
            console.warn("PiercingProjectile damage was NaN, resetting to default 8");
            this.damage = 8;
        }

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
        // Outer glow
        ctx.save();
        ctx.globalAlpha = 0.6; // Semi-transparent
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    hasHit(enemyId) {
        return this.hitEnemies.has(enemyId);
    }

    markHit(enemyId) {
        this.hitEnemies.add(enemyId);
    }
}
