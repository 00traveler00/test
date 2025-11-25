export class Drop {
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
                const val = Math.ceil(this.value * multiplier);
                this.game.ene += val;
                if (this.game.totalEneCollected !== undefined) {
                    this.game.totalEneCollected += val;
                }
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
