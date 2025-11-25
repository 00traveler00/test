export class NextStageAltar {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 40;
        this.active = true;
        this.pulse = 0;
    }

    update(dt) {
        this.pulse += dt * 3;

        // Check collision with player
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius + this.game.player.radius) {
            this.game.nextStage();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow effect
        const glowSize = 50 + Math.sin(this.pulse) * 10;
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, glowSize);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Base
        ctx.fillStyle = '#222';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(26, 15);
        ctx.lineTo(-26, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Floating Icon (Arrow Up or Portal)
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▲', 0, -10 + Math.sin(this.pulse * 2) * 5);

        // Text
        ctx.fillStyle = '#00ffff';
        ctx.font = '16px monospace';
        ctx.fillText('NEXT STAGE', 0, 40);

        ctx.restore();
    }
}
