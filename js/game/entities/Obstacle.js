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
            // Stage 1: Green Forest
            this.color = '#00ff88';
            this.type = 'tree';
        } else if (mapLevel === 2) {
            // Stage 2: Lava Zone
            this.color = '#ff8844';
            this.type = 'rock';
        } else if (mapLevel === 3) {
            // Stage 3: Void Realm
            this.color = '#ff00ff';
            this.type = 'crystal';
        } else if (mapLevel === 4) {
            // Stage 4: Ice Cave
            this.color = '#88ffff';
            this.type = 'ice';
        } else if (mapLevel === 5) {
            // Stage 5: Desert Ruins
            this.color = '#ffff88';
            this.type = 'cactus';
        } else if (mapLevel === 6) {
            // Stage 6: Deep Ocean
            this.color = '#4488ff';
            this.type = 'coral';
        } else if (mapLevel === 7) {
            // Stage 7: Volcanic Core
            this.color = '#ff4400';
            this.type = 'lava_rock';
        } else if (mapLevel === 8) {
            // Stage 8: Storm Plains
            this.color = '#aaaaff';
            this.type = 'lightning';
        } else if (mapLevel === 9) {
            // Stage 9: Neon City
            this.color = '#ff00ff';
            this.type = 'neon';
        } else {
            // Stage 10: Chaos Dimension
            this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
            this.type = 'chaos';
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
        } else if (this.type === 'ice') {
            // Ice Crystal: Six-pointed star
            const sparkle = Math.sin(this.time * 3) * 0.1 + 0.9;
            ctx.scale(sparkle, sparkle);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6;
                const x1 = Math.cos(angle) * this.radius;
                const y1 = Math.sin(angle) * this.radius;
                const x2 = Math.cos(angle + Math.PI / 6) * (this.radius * 0.4);
                const y2 = Math.sin(angle + Math.PI / 6) * (this.radius * 0.4);
                if (i === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'cactus') {
            // Cactus: Main body + arms
            ctx.fillStyle = this.color;
            // Main body
            ctx.fillRect(-8, -this.radius, 16, this.radius * 2);
            // Left arm
            ctx.fillRect(-this.radius * 0.6, -10, 10, 20);
            // Right arm
            ctx.fillRect(this.radius * 0.3, -5, 10, 15);
            // Add spikes
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const y = -this.radius + (i / 8) * this.radius * 2;
                ctx.beginPath();
                ctx.moveTo(-10, y);
                ctx.lineTo(-13, y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(10, y);
                ctx.lineTo(13, y);
                ctx.stroke();
            }
        } else if (this.type === 'coral') {
            // Coral: Branching structure
            ctx.fillStyle = this.color;
            const wave = Math.sin(this.time * 2) * 3;
            // Main stem
            ctx.fillRect(-4, 0, 8, this.radius);
            // Branches
            ctx.beginPath();
            ctx.arc(-10 + wave, this.radius * 0.3, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(10 + wave, this.radius * 0.5, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-8 - wave, this.radius * 0.7, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'lava_rock') {
            // Lava Rock: Jagged rock with glowing cracks
            const pulse = Math.sin(this.time * 2) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius * 0.9, -this.radius * 0.3);
            ctx.lineTo(this.radius * 0.7, this.radius * 0.4);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius * 0.7, this.radius * 0.4);
            ctx.lineTo(-this.radius * 0.9, -this.radius * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Glowing cracks
            ctx.strokeStyle = `rgba(255, 200, 0, ${pulse})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(0, this.radius);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.5, 0);
            ctx.lineTo(this.radius * 0.5, 0);
            ctx.stroke();
        } else if (this.type === 'lightning') {
            // Lightning Pillar: Vertical jagged line with glow
            const flicker = Math.random() > 0.8 ? 1.5 : 1;
            ctx.shadowBlur = 20 * flicker;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(5, -this.radius * 0.5);
            ctx.lineTo(-5, 0);
            ctx.lineTo(7, this.radius * 0.5);
            ctx.lineTo(0, this.radius);
            ctx.stroke();
            // Core glow
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (this.type === 'neon') {
            // Neon Pillar: Glowing box with grid
            ctx.shadowBlur = 15;
            ctx.fillRect(-this.radius * 0.4, -this.radius, this.radius * 0.8, this.radius * 2);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.radius * 0.4, -this.radius, this.radius * 0.8, this.radius * 2);
            // Horizontal lines
            for (let i = 0; i < 3; i++) {
                const y = -this.radius + (i + 1) * (this.radius * 2 / 4);
                ctx.beginPath();
                ctx.moveTo(-this.radius * 0.4, y);
                ctx.lineTo(this.radius * 0.4, y);
                ctx.stroke();
            }
        } else if (this.type === 'chaos') {
            // Chaos Orb: Shifting random shape
            const segments = 8;
            const shift = Math.sin(this.time * 3);
            ctx.beginPath();
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const r = this.radius * (0.7 + Math.sin(this.time * 2 + i) * 0.3);
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Rotating inner shapes
            ctx.rotate(this.time);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * (0.3 + i * 0.2), 0, Math.PI * 2);
                ctx.stroke();
            }
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
