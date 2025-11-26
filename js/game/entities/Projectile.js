export class Projectile {
    constructor(game, x, y, target, angleOffset = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.speed = 300;
        this.radius = 5 * (game.player.projectileSize || 1); // Amplifier Core effect
        this.damage = game.player.damage; // Use player damage

        // Debug: Check initial damage
        if (isNaN(this.damage)) {
            console.error("Projectile created with NaN damage!", { playerDamage: game.player.damage, player: game.player });
        }

        this.markedForDeletion = false;
        this.color = '#ffff00';
        this.isCrit = false; // Lucky Dice: Critical hit flag

        // Lucky Dice: Critical hit chance
        if (game.player.critChance && Math.random() < game.player.critChance) {
            this.isCrit = true;
            this.damage *= 2; // Critical damage is 2x
            // this.color = '#ff8800'; // REMOVED: Keep original bullet color

            // Debug: Check damage after crit
            if (isNaN(this.damage)) {
                console.error("Projectile damage became NaN after crit calculation!", { damage: this.damage });
            }
        }

        // Safeguard: Ensure damage is a valid number
        if (isNaN(this.damage)) {
            console.warn("Projectile damage was NaN, resetting to default 10");
            this.damage = 10;
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
        ctx.save();
        ctx.globalAlpha = 0.6; // Semi-transparent for better visibility
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}
