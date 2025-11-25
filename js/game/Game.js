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

        // Debug Mode: Super stats
        if (this.debugMode) {
            this.player.hp = 999999999;
            this.player.maxHp = 999999999;
            this.player.damage = 1000;
            console.log('DEBUG MODE ACTIVE: Super HP and Damage enabled!');
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
        const time = this.waveManager ? this.waveManager.time : 0;

        if (mapLevel === 1) {
            // Stage 1: Green Forest
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#0a2a1a');
            gradient.addColorStop(1, '#051510');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Sparkles
            this.ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            for (let i = 0; i < 50; i++) {
                const x = (i * 317 + time * 10) % this.worldWidth;
                const y = (i * 213 + time * 5) % this.worldHeight;
                this.ctx.fillRect(x, y, 2, 2);
            }
        } else if (mapLevel === 2) {
            // Stage 2: Lava Zone
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#2a1a0a');
            gradient.addColorStop(1, '#150a05');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Rocky textures
            this.ctx.fillStyle = 'rgba(255, 136, 68, 0.2)';
            for (let i = 0; i < 20; i++) {
                const x = (i * 457) % this.worldWidth;
                const y = (i * 283) % this.worldHeight;
                this.ctx.fillRect(x, y, 50, 30);
            }
        } else if (mapLevel === 3) {
            // Stage 3: Void Realm
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#1a0a2a');
            gradient.addColorStop(1, '#0a0515');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Glitch stripes
            this.ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
            for (let i = 0; i < 10; i++) {
                const y = (i * 137 + time * 50) % this.worldHeight;
                const h = 10 + Math.sin(time + i) * 5;
                this.ctx.fillRect(0, y, this.worldWidth, h);
            }
        } else if (mapLevel === 4) {
            // Stage 4: Ice Cave
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#0a1a2a');
            gradient.addColorStop(1, '#050a15');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Ice crystals
            this.ctx.fillStyle = 'rgba(136, 255, 255, 0.2)';
            for (let i = 0; i < 30; i++) {
                const x = (i * 241 + time * 3) % this.worldWidth;
                const y = (i * 191 - time * 2) % this.worldHeight;
                const size = 3 + Math.sin(time + i) * 2;
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - size);
                this.ctx.lineTo(x + size, y + size);
                this.ctx.lineTo(x - size, y + size);
                this.ctx.fill();
            }
        } else if (mapLevel === 5) {
            // Stage 5: Desert Ruins
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#2a2a0a');
            gradient.addColorStop(1, '#151005');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Sand particles
            this.ctx.fillStyle = 'rgba(255, 255, 136, 0.15)';
            for (let i = 0; i < 40; i++) {
                const x = (i * 373 + time * 30) % this.worldWidth;
                const y = (i * 251 + Math.sin(time * 0.5 + i) * 100) % this.worldHeight;
                this.ctx.fillRect(x, y, 1, 1);
            }
        } else if (mapLevel === 6) {
            // Stage 6: Deep Ocean
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#0a151a');
            gradient.addColorStop(1, '#020508');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Bubbles
            this.ctx.fillStyle = 'rgba(136, 255, 255, 0.2)';
            for (let i = 0; i < 25; i++) {
                const x = (i * 311) % this.worldWidth;
                const y = (this.worldHeight - (i * 197 + time * 40) % (this.worldHeight + 200));
                const r = 2 + (i % 3);
                this.ctx.beginPath();
                this.ctx.arc(x, y, r, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (mapLevel === 7) {
            // Stage 7: Volcanic Core
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#3a1a0a');
            gradient.addColorStop(1, '#1a0a05');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Lava flows
            this.ctx.fillStyle = 'rgba(255, 100, 0, 0.2)';
            for (let i = 0; i < 15; i++) {
                const y = (i * 133 + time * 20) % this.worldHeight;
                const w = 80 + Math.sin(time + i) * 40;
                this.ctx.fillRect(0, y, w, 15);
                this.ctx.fillRect(this.worldWidth - w, y, w, 15);
            }
        } else if (mapLevel === 8) {
            // Stage 8: Storm Plains
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#1a1a2a');
            gradient.addColorStop(1, '#0a0a15');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Lightning
            if (Math.floor(time * 3) % 5 === 0) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 3;
                for (let i = 0; i < 3; i++) {
                    const x = (i * 700) % this.worldWidth;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, 0);
                    this.ctx.lineTo(x + 50, 300);
                    this.ctx.lineTo(x, 600);
                    this.ctx.lineTo(x + 30, 1000);
                    this.ctx.lineTo(x, this.worldHeight);
                    this.ctx.stroke();
                }
            }
        } else if (mapLevel === 9) {
            // Stage 9: Neon City
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            gradient.addColorStop(0, '#1a0a1a');
            gradient.addColorStop(1, '#0a050a');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Neon grid
            this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.1)';
            this.ctx.lineWidth = 1;
            const gridSize = 50;
            for (let x = 0; x < this.worldWidth; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.worldHeight);
                this.ctx.stroke();
            }
            for (let y = 0; y < this.worldHeight; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.worldWidth, y);
                this.ctx.stroke();
            }

            // Scanlines
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
            for (let i = 0; i < 20; i++) {
                const y = (i * 100 + time * 80) % this.worldHeight;
                this.ctx.fillRect(0, y, this.worldWidth, 2);
            }
        } else {
            // Stage 10: Chaos Dimension
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth
            );
            const hue1 = (time * 50) % 360;
            const hue2 = (time * 50 + 180) % 360;
            gradient.addColorStop(0, `hsl(${hue1}, 50%, 15%)`);
            gradient.addColorStop(1, `hsl(${hue2}, 50%, 5%)`);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Random shapes
            for (let i = 0; i < 20; i++) {
                const hue = (time * 100 + i * 36) % 360;
                this.ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.1)`;
                const x = (i * 317 + time * 50) % this.worldWidth;
                const y = (i * 241 + time * 30) % this.worldHeight;
                const size = 20 + Math.sin(time + i) * 15;
                if (i % 3 === 0) {
                    this.ctx.fillRect(x, y, size, size);
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
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
        // Loop back to stage 1 after stage 10
        if (this.mapLevel >= 10) {
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
        // Deprecated - 互換性のために残す
        this.showStageResult();
    }

    showStageResult() {
        // 台座に触れた時に呼ばれる - 結果画面のみ表示
        this.setState('result');

        // Eneとボーナスマネーを表示（まだ保存しない）
        const bonusMoney = Math.floor(this.ene * 0.5) + (this.mapLevel * 100);
        document.getElementById('result-ene').innerText = this.ene;
        document.getElementById('result-money').innerText = bonusMoney;

        // ボタンテキストを設定
        const btnLoop = document.getElementById('btn-loop');
        const btnReturnHome = document.getElementById('btn-return-home');

        if (this.mapLevel >= 10) {
            btnLoop.innerText = "NEXT STAGE (Loop to Stage 1)";
            btnReturnHome.style.display = 'inline-block';  // ステージ10のみ表示
        } else {
            btnLoop.innerText = `NEXT STAGE (Stage ${this.mapLevel + 1})`;
            btnReturnHome.style.display = 'none';  // 非表示
        }
    }

    cancelStageTransition() {
        // CANCELボタン押下時 - ゲームプレイに戻る
        this.setState('playing');
        // 台座はそのまま残る
    }

    proceedToNextStage() {
        // NEXT STAGEボタン押下時 - 次のマップへ
        // 台座を削除
        this.nextStageAltar = null;

        // 次のマップへ（お金は保存しない）
        this.nextMap();
    }

    returnToHomeAfterVictory() {
        // ステージ10クリア後、RETURN HOMEボタン押下時
        // 台座を削除
        this.nextStageAltar = null;

        // お金を保存
        const bonusMoney = Math.floor(this.ene * 0.5) + (this.mapLevel * 100);
        this.money += bonusMoney;
        this.upgradeSystem.save();

        // 勝利画面を表示
        this.setState('victory');
        document.getElementById('victory-ene').innerText = this.totalEneCollected;
        document.getElementById('victory-money').innerText = bonusMoney;

        // 敵の表示
        const enemyContainer = document.getElementById('victory-enemies');
        enemyContainer.innerHTML = '';

        const enemyTypes = {
            'slime': { color: '#00ff88', name: 'Slime' },
            'lizard': { color: '#aa00ff', name: 'Lizard' },
            'golem': { color: '#ff4444', name: 'Golem' },
            'totem': { color: '#ff00ff', name: 'Totem' },
            'kamikaze': { color: '#ffaa00', name: 'Kamikaze' },
            'missile_enemy': { color: '#ff0088', name: 'Missile Bot' },
            'beam_enemy': { color: '#0088ff', name: 'Beam Bot' }
        };

        for (const [type, count] of Object.entries(this.killCount)) {
            if (count <= 0) continue;
            const data = enemyTypes[type] || { color: '#fff', name: 'Unknown' };

            const wrapper = document.createElement('div');
            wrapper.className = 'result-item-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '5px';

            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            canvas.className = 'result-item-icon';
            const ctx = canvas.getContext('2d');
            this.ui.drawEnemyIcon(ctx, type, data.color);

            wrapper.appendChild(canvas);

            const badge = document.createElement('div');
            badge.innerText = `${count}`;
            badge.className = 'result-count-badge';

            wrapper.appendChild(badge);
            enemyContainer.appendChild(wrapper);
        }

        // アイテムの表示
        const itemContainer = document.getElementById('victory-items');
        itemContainer.innerHTML = '';

        const itemCounts = {};
        this.acquiredRelics.forEach(r => {
            if (!itemCounts[r.id]) itemCounts[r.id] = { count: 0, data: r };
            itemCounts[r.id].count++;
        });

        for (const [id, info] of Object.entries(itemCounts)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'result-item-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '5px';

            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            canvas.className = 'result-item-icon';
            const ctx = canvas.getContext('2d');
            this.ui.drawRelicIcon(ctx, id, 40, 40, info.data.color);

            wrapper.appendChild(canvas);

            const badge = document.createElement('div');
            badge.innerText = `${info.count}`;
            badge.className = 'result-count-badge';

            wrapper.appendChild(badge);
            itemContainer.appendChild(wrapper);
        }
    }

    completeStage() {
        // Deprecated - 互換性のために残す
        this.showStageResult();
    }

    gameOver() {
        // お金を保存
        const bonusMoney = Math.floor(this.ene * 0.5) + (this.mapLevel * 100);
        this.money += bonusMoney;
        this.upgradeSystem.save();

        this.setState('gameover');
        this.ui.updateGameOverStats(this.totalEneCollected, this.killCount, this.acquiredRelics, this.mapLevel);
        // Reset map level on game over
        this.mapLevel = 1;
    }
}
