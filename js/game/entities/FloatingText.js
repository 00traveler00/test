export class FloatingText {
    constructor(x, y, text, color, borderColor = null) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.borderColor = borderColor;
        this.velocity = { x: (Math.random() - 0.5) * 20, y: -50 };
        this.life = 1.0; // Seconds
        this.opacity = 1.0;
        this.markedForDeletion = false;
    }

    update(dt) {
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        this.life -= dt;
        this.opacity = Math.max(0, this.life);

        if (this.life <= 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.font = 'bold 20px "Courier New", monospace';

        // Draw outline if specified
        if (this.borderColor) {
            ctx.strokeStyle = this.borderColor;
            ctx.lineWidth = 3;
            ctx.strokeText(this.text, this.x, this.y);
        }

        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
