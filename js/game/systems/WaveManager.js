import { Slime, Golem, Lizard, Totem, KamikazeEnemy, MissileEnemy, BeamEnemy } from '../entities/Enemy.js';
import { BossAltar } from '../entities/BossAltar.js';
import { Chest } from '../entities/Chest.js';
import { Overlord, SlimeKing, MechaGolem, VoidPhantom, CrimsonDragon } from '../entities/Boss.js';

export class WaveManager {
    constructor(game, initialDifficulty = 1.0, initialTime = 0) {
        this.game = game;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;

        this.time = initialTime; // Total run time in seconds
        this.initialDifficulty = initialDifficulty;
        this.difficulty = initialDifficulty; // Difficulty coefficient

        this.bossAltar = null;
        this.bossActive = false;
        this.bossAltarPos = { x: 0, y: 0 }; // Track where the altar was
        this.spawningStopped = false;
    }

    spawnAltar() {
        if (this.bossActive) return;
        // Spawn near player but offset (Called by Game.js now)
        const angle = Math.random() * Math.PI * 2;
        const dist = 800; // Far enough
        const x = this.game.player.x + Math.cos(angle) * dist;
        const y = this.game.player.y + Math.sin(angle) * dist;

        // Clamp to world
        const cx = Math.max(100, Math.min(x, this.game.worldWidth - 100));
        const cy = Math.max(100, Math.min(y, this.game.worldHeight - 100));

        this.bossAltar = new BossAltar(this.game, cx, cy);
        this.bossAltarPos = { x: cx, y: cy }; // Save position
        console.log("Boss Altar Spawned at", cx, cy);
    }

    summonBoss() {
        this.bossActive = true;
        this.bossAltar = null; // Remove altar

        // Randomly select a boss type
        const bosses = [Overlord, SlimeKing, MechaGolem, VoidPhantom, CrimsonDragon];
        const BossClass = bosses[Math.floor(Math.random() * bosses.length)];

        // Spawn the new Boss entity
        const boss = new BossClass(this.game, this.game.player.x, this.game.player.y - 300);

        // Scale Boss stats
        boss.hp *= this.difficulty;
        boss.maxHp *= this.difficulty;
        boss.damage *= this.difficulty;

        // Map Level Scaling (Make later bosses even tougher)
        const mapLevel = this.game.mapLevel || 1;
        boss.hp *= (1 + (mapLevel - 1) * 0.15);
        boss.maxHp = boss.hp;

        this.enemies.push(boss);

        this.game.audio.playBossSummon(); // Sound effect
        console.log(`BOSS SUMMONED! Type: ${boss.type}, HP: ${boss.hp}`);
    }

    stopSpawning() {
        this.spawningStopped = true;
        // Optional: Clear existing non-boss enemies?
        // this.enemies = this.enemies.filter(e => e.isBoss);
    }

    update(dt) {
        if (this.bossAltar) this.bossAltar.update(dt);

        this.time += dt;

        if (!this.spawningStopped) {
            this.spawnTimer += dt;

            // RoR2 Style Difficulty Scaling
            // Difficulty increases by 20% every 60 seconds
            // Base difficulty is set in constructor (increases with loops)
            const timeScaling = 1.0 + (this.time / 60.0) * 0.5;
            this.difficulty = this.initialDifficulty * timeScaling;

            // Spawn Interval decreases with difficulty
            // Base 1.5s -> limit to 0.2s
            const currentInterval = Math.max(0.2, 1.5 / Math.sqrt(this.difficulty));

            if (this.spawnTimer >= currentInterval) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
        }

        this.enemies.forEach(enemy => {
            enemy.update(dt);
            if (enemy.isBoss && enemy.hp <= 0) {
                this.game.bossDefeated();
            }
        });
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
    }

    draw(ctx) {
        if (this.bossAltar) this.bossAltar.draw(ctx);
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }

    spawnChest() {
        // Spawn chest near player
        const angle = Math.random() * Math.PI * 2;
        const dist = 200 + Math.random() * 200;
        const x = this.game.player.x + Math.cos(angle) * dist;
        const y = this.game.player.y + Math.sin(angle) * dist;

        // Clamp to world
        const cx = Math.max(50, Math.min(x, this.game.worldWidth - 50));
        const cy = Math.max(50, Math.min(y, this.game.worldHeight - 50));

        this.game.chests.push(new Chest(this.game, cx, cy));
        console.log("Chest Spawned!");
    }

    spawnEnemy() {
        // Spawn Count scales with difficulty
        // Cap at 5 per interval to prevent performance kill
        const spawnCount = Math.min(5, Math.floor(this.difficulty));

        for (let i = 0; i < spawnCount; i++) {
            // Spawn around player (outside camera view)
            const angle = Math.random() * Math.PI * 2;
            const dist = 500 + Math.random() * 200; // Outside screen
            let x = this.game.player.x + Math.cos(angle) * dist;
            let y = this.game.player.y + Math.sin(angle) * dist;

            // Clamp to world bounds
            x = Math.max(0, Math.min(x, this.game.worldWidth));
            y = Math.max(0, Math.min(y, this.game.worldHeight));

            let enemyType;
            const rand = Math.random();
            const mapDifficulty = this.game.mapLevel;

            // Adjust probabilities based on difficulty
            const diffFactor = Math.min(0.5, (this.difficulty - 1.0) * 0.1);

            // Stage-based spawn tables
            if (mapDifficulty === 1) {
                // Stage 1: Green Forest
                if (rand < 0.55 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.9 - diffFactor / 2) enemyType = new Lizard(this.game, x, y);
                else enemyType = new KamikazeEnemy(this.game, x, y);
            } else if (mapDifficulty === 2) {
                // Stage 2: Lava Zone
                if (rand < 0.35 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.55 - diffFactor) enemyType = new Lizard(this.game, x, y);
                else if (rand < 0.75 - diffFactor / 2) enemyType = new Golem(this.game, x, y);
                else if (rand < 0.9) enemyType = new MissileEnemy(this.game, x, y);
                else enemyType = new KamikazeEnemy(this.game, x, y);
            } else if (mapDifficulty === 3) {
                // Stage 3: Void Realm
                if (rand < 0.25 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.4 - diffFactor) enemyType = new Lizard(this.game, x, y);
                else if (rand < 0.55 - diffFactor / 2) enemyType = new Golem(this.game, x, y);
                else if (rand < 0.7) enemyType = new Totem(this.game, x, y);
                else if (rand < 0.8) enemyType = new MissileEnemy(this.game, x, y);
                else if (rand < 0.95) enemyType = new BeamEnemy(this.game, x, y);
                else enemyType = new KamikazeEnemy(this.game, x, y);
            } else if (mapDifficulty === 4) {
                // Stage 4: Ice Cave
                if (rand < 0.1 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.25 - diffFactor) enemyType = new Lizard(this.game, x, y);
                else if (rand < 0.45) enemyType = new Golem(this.game, x, y);
                else if (rand < 0.65) enemyType = new Totem(this.game, x, y);
                else if (rand < 0.8) enemyType = new BeamEnemy(this.game, x, y);
                else enemyType = new MissileEnemy(this.game, x, y);
            } else if (mapDifficulty === 5) {
                // Stage 5: Desert Ruins
                if (rand < 0.2 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.4 - diffFactor) enemyType = new Lizard(this.game, x, y);
                else if (rand < 0.55) enemyType = new Totem(this.game, x, y);
                else if (rand < 0.75) enemyType = new MissileEnemy(this.game, x, y);
                else if (rand < 0.95) enemyType = new KamikazeEnemy(this.game, x, y);
                else enemyType = new Golem(this.game, x, y);
            } else if (mapDifficulty === 6) {
                // Stage 6: Deep Ocean
                if (rand < 0.3 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.45 - diffFactor) enemyType = new Lizard(this.game, x, y);
                else if (rand < 0.65) enemyType = new BeamEnemy(this.game, x, y);
                else if (rand < 0.9) enemyType = new MissileEnemy(this.game, x, y);
                else enemyType = new KamikazeEnemy(this.game, x, y);
            } else if (mapDifficulty === 7) {
                // Stage 7: Volcanic Core
                if (rand < 0.2 - diffFactor) enemyType = new Lizard(this.game, x, y);
                else if (rand < 0.4) enemyType = new Golem(this.game, x, y);
                else if (rand < 0.55) enemyType = new Totem(this.game, x, y);
                else if (rand < 0.75) enemyType = new BeamEnemy(this.game, x, y);
                else if (rand < 0.95) enemyType = new KamikazeEnemy(this.game, x, y);
                else enemyType = new MissileEnemy(this.game, x, y);
            } else if (mapDifficulty === 8) {
                // Stage 8: Storm Plains
                if (rand < 0.15 - diffFactor) enemyType = new Slime(this.game, x, y);
                else if (rand < 0.25 - diffFactor) enemyType = new Lizard(this.game, x, y);
                else if (rand < 0.4) enemyType = new Golem(this.game, x, y);
                else if (rand < 0.55) enemyType = new Totem(this.game, x, y);
                else if (rand < 0.7) enemyType = new MissileEnemy(this.game, x, y);
                else if (rand < 0.9) enemyType = new BeamEnemy(this.game, x, y);
                else enemyType = new KamikazeEnemy(this.game, x, y);
            } else if (mapDifficulty === 9) {
                // Stage 9: Neon City
                if (rand < 0.2) enemyType = new Golem(this.game, x, y);
                else if (rand < 0.35) enemyType = new Totem(this.game, x, y);
                else if (rand < 0.55) enemyType = new MissileEnemy(this.game, x, y);
                else if (rand < 0.75) enemyType = new BeamEnemy(this.game, x, y);
                else if (rand < 0.95) enemyType = new KamikazeEnemy(this.game, x, y);
                else enemyType = new Lizard(this.game, x, y);
            } else {
                // Stage 10: Chaos Dimension
                const types = [Slime, Lizard, Golem, Totem, MissileEnemy, BeamEnemy, KamikazeEnemy];
                const RandomEnemy = types[Math.floor(Math.random() * types.length)];
                enemyType = new RandomEnemy(this.game, x, y);
            }

            // Apply Difficulty Scaling
            enemyType.hp *= this.difficulty;
            enemyType.maxHp *= this.difficulty;
            enemyType.damage *= this.difficulty;

            // Map Level Scaling
            const stageMultiplier = 1 + (mapDifficulty - 1) * 0.15;
            enemyType.hp *= stageMultiplier;
            enemyType.maxHp *= stageMultiplier;
            enemyType.damage *= stageMultiplier;

            this.enemies.push(enemyType);
        }
    }
}
