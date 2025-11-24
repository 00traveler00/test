export class Obstacle {
    constructor(game, x, y, type = 'rock') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 30;
        this.color = '#888888';
        this.time = Math.random() * 100;

        // Set visuals based on map level
        const mapLevel = game.mapLevel || 1;
        if (mapLevel === 1) {
            this.color = '#00ff88'; // Green teal
            this.type = 'tree';
        } else if (mapLevel === 2) {
            this.color = '#ff8844'; // Orange rock
            this.type = 'rock';
        } else {
            this.color = '#ff00ff'; // Purple crystal
            this.type = 'crystal';
        }
    }

    update(dt) {
        this.time += dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        if (this.type === 'tree') {
            // Tree: Trunk + Crown
            // Trunk
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(-5, 0, 10, 30);

            // Crown (triangle)
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(-20, 20);
            ctx.lineTo(20, 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'rock') {
            // Rock: Irregular hexagon
            const sway = Math.sin(this.time) * 2;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius + sway);
            ctx.lineTo(this.radius * 0.8, -this.radius * 0.4);
            ctx.lineTo(this.radius, this.radius * 0.2);
            ctx.lineTo(this.radius * 0.3, this.radius);
            ctx.lineTo(-this.radius * 0.3, this.radius);
            ctx.lineTo(-this.radius, this.radius * 0.2);
            ctx.lineTo(-this.radius * 0.8, -this.radius * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'crystal') {
            // Crystal: Floating diamond
            const hover = Math.sin(this.time * 2) * 5;
            ctx.rotate(this.time * 0.5);

            ctx.beginPath();
            ctx.moveTo(0, -this.radius + hover);
            ctx.lineTo(this.radius * 0.7, 0);
            ctx.lineTo(0, this.radius + hover);
            ctx.lineTo(-this.radius * 0.7, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner glow
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(0, -this.radius * 0.3 + hover);
            ctx.lineTo(this.radius * 0.3, 0);
            ctx.lineTo(0, this.radius * 0.3 + hover);
            ctx.lineTo(-this.radius * 0.3, 0);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    // Check collision with circle (player/projectile)
    collidesWith(x, y, radius) {
        const dx = this.x - x;
        const dy = this.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.radius + radius;
    }
}
