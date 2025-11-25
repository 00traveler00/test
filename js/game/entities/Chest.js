export class Chest {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.active = true;
        this.color = '#ffd700'; // Gold
        this.glow = 0;

        // Pre-roll rewards
        this.contents = this.generateRewards();

        this.requiresExit = false;
        // Store difficulty at generation time for price scaling
        this.difficulty = (game.waveManager) ? game.waveManager.difficulty : 1.0;
    }

    generateRewards() {
        // Access relics from UIManager via Game
        // Note: This assumes UIManager is initialized. If not, we might need a static list or callback.
        // Since Chest is created in startRun, UI should be ready.
        if (!this.game.ui || !this.game.ui.relics) return [];

        const shuffled = [...this.game.ui.relics].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    update(dt) {
        if (!this.active) return;

        this.glow += dt * 3;

        // Check interaction (smaller radius to prevent immediate reopening)
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If we require the player to exit, check if they are far enough away
        if (this.requiresExit) {
            if (dist > this.radius + 20) {
                this.requiresExit = false;
            }
            return; // Don't open yet
        }

        // Only open if player is very close and chest is active
        if (dist < this.radius + 10) {
            // Open Chest
            this.game.openChest(this);
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Pulsing effect
        const scale = 1 + Math.sin(this.glow) * 0.1;
        ctx.scale(scale, scale);

        // Draw Chest Box (Simple rect for now, or sprite later)
        ctx.fillStyle = this.color;
        ctx.fillRect(-15, -10, 30, 20);

        // Lid
        ctx.fillStyle = '#ffec8b';
        ctx.fillRect(-15, -10, 30, 5);

        // Lock
        ctx.fillStyle = '#000';
        ctx.fillRect(-2, -2, 4, 6);

        // Text hint
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("OPEN", 0, -15);

        ctx.restore();
    }
}
