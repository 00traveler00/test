export class Minimap {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('minimapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 150;
        this.height = 150;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Scaling factor
        this.scaleX = this.width / game.worldWidth;
        this.scaleY = this.height / game.worldHeight;
    }

    worldToMinimap(x, y) {
        return {
            x: x * this.scaleX,
            y: y * this.scaleY
        };
    }

    draw() {
        // Clear
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw world border
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.width, this.height);

        // Draw obstacles (optional, might be too cluttered)
        // this.game.obstacles.forEach(obstacle => {
        //     const pos = this.worldToMinimap(obstacle.x, obstacle.y);
        //     this.ctx.fillStyle = '#444';
        //     this.ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
        // });

        // Draw enemies
        if (this.game.waveManager) {
            this.game.waveManager.enemies.forEach(enemy => {
                const pos = this.worldToMinimap(enemy.x, enemy.y);

                if (enemy.isBoss) {
                    // Boss - large red circle
                    this.ctx.fillStyle = '#ff0000';
                    this.ctx.shadowBlur = 5;
                    this.ctx.shadowColor = '#ff0000';
                    this.ctx.beginPath();
                    this.ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                } else {
                    // Normal enemy - small red dot
                    this.ctx.fillStyle = '#ff4444';
                    this.ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
                }
            });
        }

        // Draw chests
        this.game.chests.forEach(chest => {
            if (chest.active) {
                const pos = this.worldToMinimap(chest.x, chest.y);
                this.ctx.fillStyle = '#ffd700';
                this.ctx.shadowBlur = 3;
                this.ctx.shadowColor = '#ffd700';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
        });

        // Draw boss altar
        if (this.game.waveManager && this.game.waveManager.bossAltar) {
            const altar = this.game.waveManager.bossAltar;
            const pos = this.worldToMinimap(altar.x, altar.y);
            this.ctx.fillStyle = '#ff00ff';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = '#ff00ff';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Draw player (always on top)
        if (this.game.player) {
            const pos = this.worldToMinimap(this.game.player.x, this.game.player.y);
            this.ctx.fillStyle = '#00ffff';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = '#00ffff';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
}
