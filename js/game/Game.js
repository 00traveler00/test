import { InputHandler } from './InputHandler.js';
import { Player } from './entities/Player.js';
import { WaveManager } from './systems/WaveManager.js';
import { Drop } from './entities/Drop.js';
import { UIManager } from '../ui/UIManager.js';
import { UpgradeSystem } from './systems/UpgradeSystem.js';
import { EnemyProjectile } from './entities/EnemyProjectile.js';
import { Chest } from './entities/Chest.js';
import { FloatingText } from './ui/FloatingText.js';
import { Obstacle } from './entities/Obstacle.js';
import { AudioManager } from './audio/AudioManager.js';
import { Minimap } from './ui/Minimap.js';
import { Particle } from './entities/Particle.js';
import { Drone } from './entities/Drone.js';
import { NextStageAltar } from './entities/NextStageAltar.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // World & Camera
        this.worldWidth = 2000;
        this.worldHeight = 2000;
        this.camera = { x: 0, y: 0 };

        // Game Entities
        this.waveManager = null;
        this.player = null;
        this.drops = [];
        this.enemyProjectiles = [];
        this.chests = [];
        this.floatingTexts = [];
        this.acquiredRelics = [];
        this.obstacles = [];
        this.particles = []; // New Particle System
        this.currentChest = null; // Track which chest is currently open

        // No more sprite assets - Procedural Neon Graphics

        this.state = 'title'; // title, home, playing, reward, result
        this.money = 0;
        this.ene = 0;
        this.mapLevel = 1;
        this.selectedCharacter = 'girl';
        this.debugMode = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new InputHandler();
        this.ui = new UIManager(this);
        this.upgradeSystem = new UpgradeSystem(this);
        this.audio = new AudioManager();
        this.minimap = null; // Created after game starts

        this.setState('title');
        this.running = false;
        this.lastTime = 0;
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }

    setState(newState) {
        this.state = newState;
        this.ui.showScreen(newState === 'playing' ? 'hud' : newState);

        if (newState === 'playing') {
            if (!this.player) this.startRun(); // Only start run if not resuming
        } else if (newState === 'title') {
            // Reset
        } else if (newState === 'home') {
            this.ui.updateHome();
        }
    }

    startRun(preserveStats = false) {
        // Initialize audio on first start
        this.audio.init();
        this.audio.playBGM();

        // Create minimap
        this.minimap = new Minimap(this);

        // Save previous stats if preserving
        let prevHp = this.player ? this.player.hp : null;
        let prevMaxHp = this.player ? this.player.maxHp : null;
        let prevDamage = this.player ? this.player.damage : null;
        let prevSpeed = this.player ? this.player.speed : null;
        let prevRelics = this.acquiredRelics;

        // Calculate difficulty based on map level
        // Map 1: 1.0, Map 2: 1.5, Map 3: 2.0, Loop: +0.5 per loop
        const baseDifficulty = 1.0 + (this.mapLevel - 1) * 0.5;

        let initialTime = 0;
        if (preserveStats && this.waveManager) {
            initialTime = this.waveManager.time;
        }

        this.waveManager = new WaveManager(this, baseDifficulty, initialTime);
        this.player = new Player(this, this.worldWidth / 2, this.worldHeight / 2);
        this.drones = []; // Initialize before applying upgrades (which might add drones)

        // Re-apply upgrades (Base stats)
        this.upgradeSystem.applyUpgrades(this.player);

        if (preserveStats) {
            // Restore Relics FIRST to establish Max Stats correctly
            // (Base Stats + Upgrades are already applied by new Player() and applyUpgrades())
            this.acquiredRelics = prevRelics;
            this.acquiredRelics.forEach(relic => {
                relic.effect(this.player);
            });

            // Restore HP (Maintain percentage from previous run)
            if (prevHp && prevMaxHp) {
                const hpPercent = prevHp / prevMaxHp;
                this.player.hp = this.player.maxHp * hpPercent;
            }

            // Heal player slightly on new stage
            this.player.hp = Math.min(this.player.hp + 20, this.player.maxHp);
        } else {
            this.acquiredRelics = [];
            this.ene = 0;
            this.totalEneCollected = 0; // Reset total collected
        }

        this.killCount = {}; // Track kills by type

        this.drops = [];
        this.enemyProjectiles = [];
        this.chests = [];
        this.floatingTexts = [];
        this.particles = [];
        // this.drones = []; // Moved to top

        // Generate obstacles
        this.obstacles = [];
        const obstacleCount = 15 + this.mapLevel * 5;
        for (let i = 0; i < obstacleCount; i++) {
            const x = Math.random() * this.worldWidth;
            const y = Math.random() * this.worldHeight;
            // Avoid spawning near player start
            const dx = x - this.worldWidth / 2;
            const dy = y - this.worldHeight / 2;
            if (Math.sqrt(dx * dx + dy * dy) > 200) {
                this.obstacles.push(new Obstacle(this, x, y));
            }
        }

        // Spawn Boss Altar (Far from player)
        this.waveManager.spawnAltar();

        // Spawn Initial Chests (Scattered)
        const chestCount = 10;
        for (let i = 0; i < chestCount; i++) {
            const x = Math.random() * (this.worldWidth - 100) + 50;
            const y = Math.random() * (this.worldHeight - 100) + 50;
            // Simple check to avoid spawning on top of player
            const dx = x - this.player.x;
            const dy = y - this.player.y;
            if (dx * dx + dy * dy > 40000) { // > 200px away
                this.chests.push(new Chest(this, x, y));
            }
        }

        // Update HUD immediately
        this.ui.updateAcquiredItems(this.acquiredRelics);
    }

    loop(timestamp) {
        if (!this.running) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        if (this.state === 'reward') return; // Pause for reward selection

        if (this.state === 'playing') {
            if (this.player) {
                this.player.update(dt);
                this.updateCamera();
            }
            if (this.waveManager) this.waveManager.update(dt);

            // Update Next Stage Altar
            if (this.nextStageAltar) {
                this.nextStageAltar.update(dt);
            }

            this.drops.forEach(d => d.update(dt));
            this.drops = this.drops.filter(d => !d.markedForDeletion);

            this.enemyProjectiles.forEach(p => p.update(dt));
            this.enemyProjectiles = this.enemyProjectiles.filter(p => !p.markedForDeletion);

            this.chests.forEach(c => c.update(dt));

            this.particles.forEach(p => p.update(dt));
            this.particles = this.particles.filter(p => !p.markedForDeletion);

            this.floatingTexts.forEach(t => t.update(dt));
            this.floatingTexts = this.floatingTexts.filter(t => !t.markedForDeletion);

            this.obstacles.forEach(o => o.update(dt));

            this.drones.forEach(d => d.update(dt));

            this.checkCollisions(dt);

            // Global Death Check (catches non-collision damage like self-destructs)
            if (this.player && this.player.hp <= 0) {
                this.gameOver();
            }

            // Update HUD
            if (this.player && this.waveManager) {
                const hpPercent = (this.player.hp / this.player.maxHp) * 100;

                // Calculate effective difficulty for display
                const mapMultiplier = 1 + (this.mapLevel - 1) * 0.5;
                const effectiveDifficulty = this.waveManager.difficulty * mapMultiplier;

                this.ui.updateHUD(
                    hpPercent,
                    this.ene,
                    this.player.hp,
                    this.player.maxHp,
                    this.waveManager.time,
                    effectiveDifficulty
                );
            }
        }
    }

    updateCamera() {
        // Center camera on player
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        // Clamp camera to world bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight - this.canvas.height));
    }

    checkCollisions(dt) {
        if (!this.player || !this.waveManager) return;

        // Player vs Enemies
        this.waveManager.enemies.forEach(enemy => {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < enemy.radius + this.player.radius) {
                const dmg = enemy.damage * dt; // Scale damage by dt
                this.player.hp -= dmg;
                if (this.player.hp <= 0) {
                    this.gameOver();
                }
            }
        });

        // Player vs Obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.collidesWith(this.player.x, this.player.y, this.player.radius)) {
                // Push player back
                const dx = this.player.x - obstacle.x;
                const dy = this.player.y - obstacle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const overlap = (obstacle.radius + this.player.radius) - dist;
                    this.player.x += (dx / dist) * overlap;
                    this.player.y += (dy / dist) * overlap;
                }
            }
        });

        // Projectiles vs Enemies
        this.player.projectiles.forEach(proj => {
            this.waveManager.enemies.forEach(enemy => {
                if (proj.markedForDeletion || enemy.markedForDeletion) return;

                const dx = enemy.x - proj.x;
                const dy = enemy.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < enemy.radius + proj.radius) {
                    // Check if damage is taken
                    if (enemy.takeDamage(proj.damage)) {
                        this.showDamage(enemy.x, enemy.y, Math.round(proj.damage), '#fff');
                        this.audio.playHit(); // Sound effect

                        // Spawn Particles
                        for (let i = 0; i < 5; i++) {
                            this.particles.push(new Particle(this, enemy.x, enemy.y, enemy.color));
                        }

                        if (enemy.hp <= 0) {
                            enemy.markedForDeletion = true;
                            // Drop Scaling: Value based on Max HP
                            const dropValue = Math.max(1, Math.floor(enemy.maxHp / 10));
                            this.drops.push(new Drop(this, enemy.x, enemy.y, 'energy', dropValue));

                            // Track Kill
                            if (!this.killCount[enemy.type]) this.killCount[enemy.type] = 0;
                            this.killCount[enemy.type]++;
                        }
                    } else {
                        // Damage Blocked (Sound effect?)
                        this.audio.playHit(); // Maybe a different sound for block?
                    }
                    proj.markedForDeletion = true;
                }
            });
        });

        // Enemy Projectiles vs Player
        this.enemyProjectiles.forEach(proj => {
            if (proj.markedForDeletion) return;
            const dx = this.player.x - proj.x;
            const dy = this.player.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + proj.radius) {
                this.player.hp -= proj.damage;
                this.showDamage(this.player.x, this.player.y, Math.round(proj.damage), '#ff0000');
                proj.markedForDeletion = true;
                if (this.player.hp <= 0) {
                    this.setState('result');
                }
            }
        });
    }

    showDamage(x, y, amount, color) {
        this.floatingTexts.push(new FloatingText(x, y, Math.round(amount), color));
    }

    openChest(chest) {
        console.log("Chest Opened!");
        this.currentChest = chest; // Track this chest
        this.audio.playLevelUp(); // Sound effect
        this.setState('reward');
        this.ui.showRewardSelection(chest.contents, chest.difficulty);
    }

    closeRewardWithoutPurchase() {
        // Re-activate the chest but require player to step away
        if (this.currentChest) {
            const chest = this.currentChest;
            chest.active = true;
            chest.requiresExit = true;
        }
        this.currentChest = null;
        this.setState('playing');
    }

    applyRelic(relic) {
        console.log(`Applied Relic: ${relic.name}`);

        // Deduct Ene
        this.ene -= relic.cost;

        // Apply effect
        relic.effect(this.player);
        this.acquiredRelics.push(relic);

        // Update acquired items HUD
        this.ui.updateAcquiredItems(this.acquiredRelics);

        // Clear current chest (purchase was made)
        this.currentChest = null;

        this.setState('playing');
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#101018';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'playing' || this.state === 'reward') {
            this.ctx.save();
            this.ctx.translate(-this.camera.x, -this.camera.y);

            this.drawBackground();
            this.drawGrid();

            this.ctx.lineWidth = 5;
            this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

            // Draw Entities
            this.obstacles.forEach(o => o.draw(this.ctx));
            this.chests.forEach(c => c.draw(this.ctx));
            this.drops.forEach(d => d.draw(this.ctx));

            if (this.player) this.player.draw(this.ctx);
            if (this.waveManager) this.waveManager.draw(this.ctx);

            if (this.nextStageAltar) this.nextStageAltar.draw(this.ctx);

            this.drones.forEach(d => d.draw(this.ctx));
            this.enemyProjectiles.forEach(p => p.draw(this.ctx));
            this.particles.forEach(p => p.draw(this.ctx));
            this.floatingTexts.forEach(t => t.draw(this.ctx));

            this.ctx.restore();

            this.minimap.draw();
        } else {
            this.drawGrid(); // Static grid for menus
        }
    }

    drawBackground() {
        // Map-specific background
        const mapLevel = this.mapLevel || 1;

        if (mapLevel === 1) {
            // Green/Teal theme
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#0a2a1a');
            gradient.addColorStop(1, '#051510');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Particles (stars/sparkles)
            this.ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            for (let i = 0; i < 50; i++) {
                const x = (i * 317 + this.waveManager.time * 10) % this.worldWidth;
                const y = (i * 213 + this.waveManager.time * 5) % this.worldHeight;
                this.ctx.fillRect(x, y, 2, 2);
            }
        } else if (mapLevel === 2) {
            // Orange/Red theme
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#2a1a0a');
            gradient.addColorStop(1, '#150a05');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Rocky textures (rectangles)
            this.ctx.fillStyle = 'rgba(255, 136, 68, 0.2)';
            for (let i = 0; i < 20; i++) {
                const x = (i * 457) % this.worldWidth;
                const y = (i * 283) % this.worldHeight;
                this.ctx.fillRect(x, y, 50, 30);
            }
        } else {
            // Purple/Pink theme
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#1a0a2a');
            gradient.addColorStop(1, '#0a0515');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Glitch effects (random stripes)
            const time = this.waveManager ? this.waveManager.time : 0;
            this.ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
            for (let i = 0; i < 10; i++) {
                const y = (i * 137 + time * 50) % this.worldHeight;
                const h = 10 + Math.sin(time + i) * 5;
                this.ctx.fillRect(0, y, this.worldWidth, h);
            }
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        const gridSize = 100;

        // Draw grid based on world coordinates
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = startX + this.canvas.width + gridSize;
        const endY = startY + this.canvas.height + gridSize;

        for (let x = startX; x < endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.camera.y);
            this.ctx.lineTo(x, this.camera.y + this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = startY; y < endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.camera.x, y);
            this.ctx.lineTo(this.camera.x + this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    addDrone() {
        if (!this.player) return;
        const drone = new Drone(this, this.player);
        // Offset angle for multiple drones
        drone.angle = (Math.PI * 2 / (this.drones.length + 1)) * this.drones.length;
        this.drones.push(drone);
        console.log("Drone added!");
    }

    nextMap() {
        // Loop back to stage 1 after stage 3
        if (this.mapLevel >= 3) {
            this.mapLevel = 1;
        } else {
            this.mapLevel++;
        }
        this.startRun(true); // Preserve stats
        this.setState('playing');
    }

    bossDefeated() {
        console.log("BOSS DEFEATED!");
        this.audio.playLevelUp(); // Victory sound

        // Stop Spawning
        this.waveManager.stopSpawning();

        // Spawn Next Stage Altar at the location where the boss altar was
        const pos = this.waveManager.bossAltarPos;
        // Fallback if pos is missing (shouldn't happen if waveManager is correct)
        const tx = pos ? pos.x : this.player.x;
        const ty = pos ? pos.y : this.player.y - 100;

        this.nextStageAltar = new NextStageAltar(this, tx, ty);

        // Show message
        this.ui.showMessage("BOSS DEFEATED! GO TO THE ALTAR!", 5000);
    }

    nextStage() {
        // Called by Altar
        this.completeStage();
    }

    completeStage() {
        this.nextStageAltar = null;
        this.setState('result');
        const bonusMoney = Math.floor(this.ene * 0.5) + (this.mapLevel * 100);
        this.money += bonusMoney;
        this.upgradeSystem.save();

        document.getElementById('result-ene').innerText = this.ene;
        document.getElementById('result-money').innerText = bonusMoney;

        const btnLoop = document.getElementById('btn-loop');
        if (this.mapLevel >= 3) {
            btnLoop.innerText = "LOOP (Restart Map 1)";
        } else {
            btnLoop.innerText = `NEXT MAP (Level ${this.mapLevel + 1})`;
        }
    }

    gameOver() {
        this.setState('gameover');
        this.ui.updateGameOverStats(this.totalEneCollected, this.killCount, this.acquiredRelics, this.mapLevel);
        // Reset map level on game over
        this.mapLevel = 1;
        this.upgradeSystem.save();
    }
}
