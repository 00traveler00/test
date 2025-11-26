export class UIManager {
    constructor(game) {
        this.game = game;
        this.uiLayer = document.getElementById('ui-layer');
        this.screens = {};

        // Relic Data (Moved from ShopSystem)
        // レアリティ: common (70%), rare (20%), epic (8%), legendary (2%)
        this.relics = [
            // Common (コモン) - 基本的な強化
            { id: 'atk_up', name: 'Cyber Katana', desc: 'Attack Damage +10%', cost: 15, rarity: 'common', color: '#ff4444', rarityBorder: '#888888', weight: 5, effect: (p) => p.damage *= 1.1 },
            { id: 'spd_up', name: 'Neko Headphones', desc: 'Move Speed +15%', cost: 20, rarity: 'common', color: '#4444ff', rarityBorder: '#888888', weight: 5, effect: (p) => p.speed *= 1.15 },
            { id: 'hp_up', name: 'Energy Drink', desc: 'Max HP +30', cost: 25, rarity: 'common', color: '#44ff44', rarityBorder: '#888888', weight: 5, effect: (p) => { p.maxHp += 30; p.hp += 30; } },
            { id: 'rate_up', name: 'Overclock Chip', desc: 'Fire Rate +10%', cost: 18, rarity: 'common', color: '#ffaa00', rarityBorder: '#888888', weight: 5, effect: (p) => p.shootInterval *= 0.9 },
            { id: 'pierce_shot', name: 'Plasma Orb', desc: 'Fire penetrating orbs +1', cost: 20, rarity: 'common', color: '#00aaff', rarityBorder: '#888888', weight: 5, effect: (p) => { if (!p.pierceShotCount) p.pierceShotCount = 0; p.pierceShotCount++; } },
            { id: 'hp_regen', name: 'Nano Repair', desc: 'HP Regen +0.5/sec', cost: 22, rarity: 'common', color: '#44ff88', rarityBorder: '#888888', weight: 5, effect: (p) => { if (!p.hpRegen) p.hpRegen = 0; p.hpRegen += 0.5; } },
            { id: 'crit_chance', name: 'Lucky Dice', desc: 'Crit Chance +10%', cost: 18, rarity: 'common', color: '#ffdd00', rarityBorder: '#888888', weight: 5, effect: (p) => { if (!p.critChance) p.critChance = 0; p.critChance += 0.1; } },
            { id: 'projectile_size', name: 'Amplifier Core', desc: 'Projectile Size +25%', cost: 16, rarity: 'common', color: '#ff6600', rarityBorder: '#888888', weight: 5, effect: (p) => { if (!p.projectileSize) p.projectileSize = 1; p.projectileSize *= 1.25; } },

            // Rare (レア) - 便利な強化
            { id: 'range_up', name: 'Scope Lens', desc: 'Magnet Range +50%', cost: 12, rarity: 'rare', color: '#00ffff', rarityBorder: '#4466ff', weight: 6, effect: (p) => { /* Handled in Drop */ } },
            { id: 'shield_gen', name: 'Energy Barrier', desc: 'Shield absorbs 20 damage', cost: 35, rarity: 'rare', color: '#8888ff', rarityBorder: '#4466ff', weight: 6, effect: (p) => { if (!p.shield) p.shield = 0; p.shield += 20; if (!p.maxShield) p.maxShield = 0; p.maxShield += 20; } },
            { id: 'multishot', name: 'Splitter Module', desc: 'Shoot 2 extra bullets', cost: 40, rarity: 'rare', color: '#ff4488', rarityBorder: '#4466ff', weight: 6, effect: (p) => { if (!p.multiShotCount) p.multiShotCount = 1; p.multiShotCount += 1; } },
            { id: 'armor_plate', name: 'Titanium Plating', desc: 'Damage taken -15%', cost: 38, rarity: 'rare', color: '#999999', rarityBorder: '#4466ff', weight: 6, effect: (p) => { if (!p.damageMultiplier) p.damageMultiplier = 1.0; p.damageMultiplier *= 0.85; } },

            // Epic (エピック) - 強力な強化
            { id: 'drone', name: 'Support Drone', desc: 'Summons a drone', cost: 40, rarity: 'epic', color: '#00ffaa', rarityBorder: '#aa00ff', weight: 7, effect: (p) => p.game.addDrone() },
            { id: 'lifesteal', name: 'Vampire Fang', desc: 'Heal 10% of damage dealt', cost: 50, rarity: 'epic', color: '#cc0044', rarityBorder: '#aa00ff', weight: 7, effect: (p) => { if (!p.lifeSteal) p.lifeSteal = 0; p.lifeSteal += 0.10; } },
            { id: 'time_warp', name: 'Chrono Lens', desc: 'Speed +20%, Fire Rate +15%', cost: 55, rarity: 'epic', color: '#00ccff', rarityBorder: '#aa00ff', weight: 6, effect: (p) => { p.speed *= 1.2; p.shootInterval *= 0.85; } },
            { id: 'missile', name: 'Missile Pod', desc: 'Fires homing missiles', cost: 50, rarity: 'epic', color: '#ff0088', rarityBorder: '#aa00ff', weight: 7, effect: (p) => p.missileCount++ },

            // Legendary (レジェンダリー) - 超強力
            { id: 'phoenix_heart', name: 'Phoenix Heart', desc: 'Revive once on death', cost: 80, rarity: 'legendary', color: '#ffaa00', rarityBorder: '#ff8800', weight: 5, effect: (p) => { if (!p.reviveCount) p.reviveCount = 0; p.reviveCount++; } },
            { id: 'phoenix_heart_used', name: 'Phoenix Heart (Used)', desc: 'Already consumed', cost: 0, rarity: 'legendary', color: '#666666', rarityBorder: '#444444', weight: 0, effect: (p) => { /* No effect */ } }
        ];

        this.setupScreens();
        console.log('UIManager initialized (v2 - Icons)');
    }

    setupScreens() {
        // Title Screen
        this.screens.title = this.createScreen('title-screen', `
            <h1 class="title-text">Cyber<br>Survivor</h1>
            <button id="btn-start" class="cyber-btn">START</button>
            <button id="btn-options" class="cyber-btn secondary">OPTIONS</button>
            <button id="btn-reset" class="cyber-btn secondary" style="margin-top: 20px; background: #ff4444;">RESET DATA</button>
        `);

        // Options Screen
        this.screens.options = this.createScreen('options-screen', `
            <h2>OPTIONS</h2>
            <div class="options-container">
                <label class="cyber-checkbox">
                    <input type="checkbox" id="chk-debug">
                    <span class="checkmark"></span>
                    DEBUG MODE (x100 Ene)
                </label>
            </div>
            <button id="btn-close-options" class="cyber-btn secondary">CLOSE</button>
        `);

        // Home Screen
        this.screens.home = this.createScreen('home-screen', `
            <h2>Home Base</h2>
            <div class="character-select">
                <div class="char-card selected" data-char="girl">
                    <canvas width="64" height="64" class="char-preview"></canvas>
                    <span>Girl</span>
                </div>
                <div class="char-card" data-char="cat">
                    <canvas width="64" height="64" class="char-preview"></canvas>
                    <span>Cat</span>
                </div>
                <div class="char-card" data-char="boy">
                    <canvas width="64" height="64" class="char-preview"></canvas>
                    <span>Boy</span>
                </div>
                <div class="char-card" data-char="dog">
                    <canvas width="64" height="64" class="char-preview"></canvas>
                    <span>Dog</span>
                </div>
            </div>
            <div class="stats-panel">
                <p>Money: <span id="player-money">0</span></p>
                <div class="upgrades">
                    <button id="btn-up-hp" class="cyber-btn small">HP Up <span id="cost-hp">100</span></button>
                    <button id="btn-up-dmg" class="cyber-btn small">Dmg Up <span id="cost-dmg">150</span></button>
                </div>
            </div>
            <button id="btn-mission" class="cyber-btn">START MISSION</button>
            <button id="btn-back-title" class="cyber-btn secondary" style="margin-top: 10px;">BACK TO TITLE</button>
        `);

        // HUD (Heads Up Display)
        this.screens.hud = this.createScreen('hud-screen', `
            <div class="hud-top">
                <div class="hud-left">
                    <div class="hud-hp-ene-row">
                        <div class="bar-container">
                            <div id="shield-bar" class="bar shield"></div>
                            <div id="hp-bar" class="bar hp"></div>
                            <span id="hp-text" class="bar-text">100/100</span>
                        </div>
                        <div class="score-container">
                            Ene: <span id="score-ene">0</span>
                        </div>
                    </div>
                    <div class="time-container">
                        <span id="game-time">00:00</span>
                        <span id="game-difficulty" class="difficulty-text">Lv. 1.00</span>
                    </div>
                </div>
                <div class="hud-center">
                    <!-- Center is now empty or can be used for other things -->
                </div>
                <div class="hud-right">
                    <!-- Minimap will be positioned here via absolute positioning -->
                </div>
            </div>
            <div id="acquired-items-container" class="acquired-items">
                <!-- Acquired item icons will be added here -->
            </div>
        `);

        // Result Screen
        this.screens.result = this.createScreen('result-screen', `
            <h2>MISSION COMPLETE</h2>
            <div class="result-stats">
                <p>Ene Collected: <span id="result-ene">0</span></p>
                <p>Bonus Money: <span id="result-money">0</span></p>
            </div>
            <div class="result-actions">
                <button id="btn-loop" class="cyber-btn">NEXT STAGE</button>
                <button id="btn-return-home" class="cyber-btn" style="display:none;">RETURN HOME</button>
                <button id="btn-cancel-result" class="cyber-btn secondary">CANCEL</button>
            </div>
        `);

        // Victory Screen
        this.screens.victory = this.createScreen('victory-screen', `
            <div class="victory-container">
                <h1 class="victory-title">🎉 VICTORY! 🎉</h1>
                <h2 class="victory-subtitle">ALL STAGES COMPLETED!</h2>
                <div class="result-stats-container">
                    <div class="result-section">
                        <h3>Total Ene Collected</h3>
                        <p class="result-big-text"><span id="victory-ene">0</span></p>
                    </div>
                    <div class="result-section">
                        <h3>Money Earned</h3>
                        <p class="result-big-text"><span id="victory-money">0</span></p>
                    </div>
                    <div class="result-section">
                        <h3>Stages Cleared</h3>
                        <p class="result-big-text">10 / 10</p>
                    </div>
                    <div class="result-section">
                        <h3>Character Used</h3>
                        <div style="display: flex; justify-content: center; align-items: center; height: 60px; width: 100%;">
                            <canvas id="victory-character" width="50" height="50" style="width: 50px; height: 50px; display: block;"></canvas>
                        </div>
                    </div>
                    <div class="result-section">
                        <h3>Defeated Enemies</h3>
                        <div id="victory-enemies" class="result-grid"></div>
                    </div>
                    <div class="result-section">
                        <h3>Acquired Items</h3>
                        <div id="victory-items" class="result-grid"></div>
                    </div>
                </div>
                <button id="btn-victory-home" class="cyber-btn">RETURN TO HOME</button>
            </div>
        `);

        // Game Over Screen
        this.screens.gameover = this.createScreen('gameover-screen', `
            <div class="gameover-container">
                <h2 style="color: #ff0000;">GAME OVER</h2>
                <div class="result-stats-container">
                    <div class="result-summary-row">
                        <div class="result-summary-item">
                            <h3>Character</h3>
                            <div style="display: flex; justify-content: center; align-items: center; height: 60px; width: 100%;">
                                <canvas id="go-character" width="50" height="50" style="width: 50px; height: 50px; display: block;"></canvas>
                            </div>
                        </div>
                        <div class="result-summary-item">
                            <h3>Reached Stage</h3>
                            <p class="result-big-text"><span id="go-level">1</span></p>
                        </div>
                        <div class="result-summary-item">
                            <h3>Total Ene</h3>
                            <p class="result-big-text"><span id="go-ene">0</span></p>
                        </div>
                    </div>
                    <div class="result-section">
                        <h3>Defeated Enemies</h3>
                        <div id="go-enemies" class="result-grid"></div>
                    </div>
                    <div class="result-section">
                        <h3>Acquired Items</h3>
                        <div id="go-items" class="result-grid"></div>
                    </div>
                </div>
                <div style="display: flex; justify-content: center; width: 100%;">
                    <button id="btn-go-home" class="cyber-btn">RETURN HOME</button>
                </div>
            </div>
        `);

        // Reward Screen (New)
        this.screens.reward = this.createScreen('reward-screen', `
            <h2>LEVEL UP! CHOOSE A REWARD</h2>
            <div id="reward-container" class="shop-container">
                <!-- Relic cards injected here -->
            </div>
            <button id="btn-close-reward" class="cyber-btn secondary">CLOSE (Cancel)</button>
        `);

        // Bind Events
        this.bindEvents();

        // Draw Previews
        setTimeout(() => this.drawCharacterPreviews(), 100);
    }

    bindButton(id, action) {
        const btn = document.getElementById(id);
        if (!btn) return;

        const handlePress = (e) => {
            if (e.type === 'touchstart') {
                e.preventDefault(); // Prevent ghost click
            }
            try {
                console.log(`Button pressed: ${id}`);
                action(e);
            } catch (err) {
                console.error(err);
                alert(`Error: ${err.message}`);
            }
        };

        btn.addEventListener('touchstart', handlePress, { passive: false });
        btn.addEventListener('click', handlePress);
    }

    createScreen(id, content) {
        const div = document.createElement('div');
        div.id = id;
        div.className = 'ui-screen hidden';
        div.innerHTML = content;
        this.uiLayer.appendChild(div);
        return div;
    }

    bindEvents() {
        // Title
        this.bindButton('btn-start', () => this.game.setState('home'));
        this.bindButton('btn-options', () => this.showScreen('options'));

        // Reset Button
        this.bindButton('btn-reset', () => {
            if (confirm('全てのゲームデータをリセットしますか？\nReset all game data?')) {
                localStorage.clear();
                alert('データがリセットされました！\nData has been reset!');
                location.reload();
            }
        });

        // Options
        this.bindButton('btn-close-options', () => this.showScreen('title'));

        const chkDebug = document.getElementById('chk-debug');
        if (chkDebug) {
            chkDebug.addEventListener('change', (e) => {
                this.game.debugMode = e.target.checked;
                console.log('Debug Mode:', this.game.debugMode);
            });
        }

        // Home
        this.bindButton('btn-mission', () => {
            this.game.startRun();
            this.game.setState('playing');
        });

        this.bindButton('btn-up-hp', () => {
            this.game.upgradeSystem.purchase('maxHp');
            this.updateHome();
        });

        this.bindButton('btn-up-dmg', () => {
            this.game.upgradeSystem.purchase('damage');
            this.updateHome();
        });

        // Back to Title from Home
        this.bindButton('btn-back-title', () => this.game.setState('title'));

        const charCards = document.querySelectorAll('.char-card');
        charCards.forEach(card => {
            const handleSelect = (e) => {
                if (e.type === 'touchstart') e.preventDefault();
                charCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.game.selectedCharacter = card.dataset.char;
            };
            card.addEventListener('touchstart', handleSelect, { passive: false });
            card.addEventListener('click', handleSelect);
        });

        // Result
        this.bindButton('btn-loop', () => this.game.proceedToNextStage());
        this.bindButton('btn-return-home', () => this.game.returnToHomeAfterVictory());
        this.bindButton('btn-cancel-result', () => this.game.cancelStageTransition());

        // Victory
        this.bindButton('btn-victory-home', () => this.game.setState('home'));

        // Game Over
        this.bindButton('btn-go-home', () => this.game.setState('home'));

        // Reward close button
        this.bindButton('btn-close-reward', () => {
            this.game.closeRewardWithoutPurchase();
        });
    }

    drawCharacterPreviews() {
        const cards = document.querySelectorAll('.char-card');
        cards.forEach(card => {
            const canvas = card.querySelector('canvas');
            const ctx = canvas.getContext('2d');
            const charType = card.dataset.char;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Mock Player Draw
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = 15;

            let color = '#fff';
            if (charType === 'girl') color = '#ff00ff';
            if (charType === 'cat') color = '#00ffff';
            if (charType === 'boy') color = '#00ff00';
            if (charType === 'dog') color = '#ff8800';

            ctx.save();
            ctx.translate(cx, cy);

            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;

            // Body
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Inner
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();

            // Accessories (Simplified)
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            if (charType === 'cat') {
                ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-12, -20); ctx.lineTo(-4, -14); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(12, -20); ctx.lineTo(4, -14); ctx.stroke();
            } else if (charType === 'girl') {
                ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); ctx.fill();
            } else if (charType === 'dog') {
                ctx.beginPath(); ctx.ellipse(-12, -4, 4, 8, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(12, -4, 4, 8, -Math.PI / 4, 0, Math.PI * 2); ctx.fill();
            } else if (charType === 'boy') {
                ctx.beginPath(); ctx.arc(0, -4, radius, Math.PI, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(18, -4); ctx.stroke();
            }

            ctx.restore();
        });
    }

    showRewardSelection(predefinedRelics = null, fixedDifficulty = null) {
        const container = document.getElementById('reward-container');
        container.innerHTML = '';

        let choices;
        if (predefinedRelics && predefinedRelics.length > 0) {
            choices = predefinedRelics;
        } else {
            // Fallback: Pick 3 random relics
            const shuffled = [...this.relics].sort(() => 0.5 - Math.random());
            choices = shuffled.slice(0, 3);
        }

        // Calculate cost multiplier based on fixed difficulty (from chest) or current difficulty
        const difficulty = fixedDifficulty || (this.game.waveManager ? this.game.waveManager.difficulty : 1.0);
        // Cost scales with difficulty: Base * Difficulty
        const costMultiplier = difficulty;

        choices.forEach(relic => {
            const card = document.createElement('div');
            card.className = 'relic-card';

            // Create canvas for icon
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 64;
            iconCanvas.height = 64;
            iconCanvas.className = 'relic-icon';

            // Draw icon using helper
            const ctx = iconCanvas.getContext('2d');
            this.drawRelicIcon(ctx, relic.id, 64, 64, relic.color);

            card.appendChild(iconCanvas);

            // Set rarity border color
            card.style.borderColor = relic.rarityBorder;
            card.style.borderWidth = '3px';

            // Calculate scaled cost
            const scaledCost = Math.floor(relic.cost * costMultiplier);

            // Add text info
            const info = document.createElement('div');
            info.innerHTML = `
                <h3>${relic.name}</h3>
                <p>${relic.desc}</p>
                <p class="relic-cost">Cost: ${scaledCost} Ene</p>
            `;
            card.appendChild(info);

            // Check affordability
            if (this.game.ene < scaledCost) {
                card.style.opacity = '0.5';
                card.style.pointerEvents = 'none'; // Disable interaction
                info.querySelector('.relic-cost').style.color = '#ff4444'; // Red cost
            }

            // Click handler
            const handleBuy = (e) => {
                if (e.type === 'touchstart') e.preventDefault();

                if (this.game.ene >= scaledCost) {
                    // Create a temporary relic object with the scaled cost to pass to applyRelic
                    const relicToBuy = { ...relic, cost: scaledCost };
                    this.game.applyRelic(relicToBuy);
                } else {
                    // Visual feedback: not enough Ene
                    card.style.border = '2px solid red';
                    setTimeout(() => card.style.border = '', 500);
                }
            };

            card.addEventListener('touchstart', handleBuy, { passive: false });
            card.addEventListener('click', handleBuy);

            // Disable if not enough Ene
            if (this.game.ene < relic.cost) {
                card.style.opacity = '0.5';
                card.style.cursor = 'not-allowed';
            }

            container.appendChild(card);
        });

        this.showScreen('reward');
    }

    drawRelicIcon(ctx, id, w, h, color) {
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        if (id === 'atk_up') {
            // Cyber Katana (Sword)
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + 10);
            ctx.lineTo(cx + 15, cy - 15); // Blade
            ctx.stroke();
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + 10);
            ctx.lineTo(cx - 15, cy + 15); // Handle
            ctx.stroke();
            // Tsuba (Guard)
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy + 8);
            ctx.lineTo(cx - 12, cy + 12);
            ctx.stroke();
        } else if (id === 'spd_up') {
            // Neko Headphones
            ctx.beginPath();
            ctx.arc(cx, cy, 15, Math.PI, 0); // Band
            ctx.stroke();
            // Ear cups
            ctx.fillRect(cx - 18, cy - 5, 6, 15);
            ctx.fillRect(cx + 12, cy - 5, 6, 15);
            // Cat ears
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy - 15);
            ctx.lineTo(cx - 5, cy - 25);
            ctx.lineTo(cx, cy - 15);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy - 15);
            ctx.lineTo(cx + 5, cy - 25);
            ctx.lineTo(cx, cy - 15);
            ctx.fill();
        } else if (id === 'hp_up') {
            // Energy Drink (Can)
            ctx.fillRect(cx - 10, cy - 15, 20, 30);
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx - 5, cy - 5, 10, 10); // Logo
        } else if (id === 'rate_up') {
            // Overclock Chip
            ctx.strokeRect(cx - 12, cy - 12, 24, 24);
            ctx.fillRect(cx - 6, cy - 6, 12, 12); // Core
            // Pins
            ctx.beginPath();
            ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 18, cy);
            ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 18, cy);
            ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 18);
            ctx.moveTo(cx, cy + 12); ctx.lineTo(cx, cy + 18);
            ctx.stroke();
        } else if (id === 'range_up') {
            // Scope Lens
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
            // Crosshair
            ctx.beginPath();
            ctx.moveTo(cx - 15, cy); ctx.lineTo(cx + 15, cy);
            ctx.moveTo(cx, cy - 15); ctx.lineTo(cx, cy + 15);
            ctx.stroke();
        } else if (id === 'drone') {
            // Drone Icon
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2); // Body
            ctx.fill();
            // Rotors
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx - 12, cy - 12); ctx.lineTo(cx + 12, cy + 12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 12, cy - 12); ctx.lineTo(cx - 12, cy + 12); ctx.stroke();
        } else if (id === 'missile') {
            // Missile Icon
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 15);
            ctx.lineTo(cx + 8, cy + 10);
            ctx.lineTo(cx, cy + 5);
            ctx.lineTo(cx - 8, cy + 10);
            ctx.fill();
        } else if (id === 'pierce_shot') {
            // Plasma Orb (貫通弾)
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
            // Inner glow
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();
            // Energy trails
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(cx - 15 - i * 3, cy);
                ctx.lineTo(cx - 10 - i * 3, cy);
                ctx.stroke();
            }
        } else if (id === 'hp_regen') {
            // Nano Repair (HP回復)
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.stroke();
            // Plus sign
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx - 6, cy);
            ctx.lineTo(cx + 6, cy);
            ctx.moveTo(cx, cy - 6);
            ctx.lineTo(cx, cy + 6);
            ctx.stroke();
            // Pulse rings
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 16, 0, Math.PI * 2);
            ctx.stroke();
        } else if (id === 'crit_chance') {
            // Lucky Dice (クリティカル)
            ctx.strokeRect(cx - 10, cy - 10, 20, 20);
            ctx.fillRect(cx - 10, cy - 10, 20, 20);
            // Dots
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(cx - 4, cy - 4, 2, 0, Math.PI * 2);
            ctx.arc(cx + 4, cy + 4, 2, 0, Math.PI * 2);
            ctx.arc(cx, cy, 2, 0, Math.PI * 2);
            ctx.fill();
            // Star sparkle
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(cx + 8, cy - 8);
            ctx.lineTo(cx + 10, cy - 10);
            ctx.lineTo(cx + 12, cy - 8);
            ctx.lineTo(cx + 10, cy - 6);
            ctx.fill();
        } else if (id === 'projectile_size') {
            // Amplifier Core (弾サイズ)
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
            // Expanding waves
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.stroke();
            // Arrow indicators
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy);
            ctx.lineTo(cx - 14, cy);
            ctx.lineTo(cx - 11, cy - 3);
            ctx.moveTo(cx - 14, cy);
            ctx.lineTo(cx - 11, cy + 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + 8, cy);
            ctx.lineTo(cx + 14, cy);
            ctx.lineTo(cx + 11, cy - 3);
            ctx.moveTo(cx + 14, cy);
            ctx.lineTo(cx + 11, cy + 3);
            ctx.stroke();
        } else if (id === 'shield_gen') {
            // Energy Barrier (シールド)
            ctx.beginPath();
            ctx.moveTo(cx, cy - 15);
            ctx.lineTo(cx + 12, cy - 5);
            ctx.lineTo(cx + 12, cy + 10);
            ctx.lineTo(cx, cy + 15);
            ctx.lineTo(cx - 12, cy + 10);
            ctx.lineTo(cx - 12, cy - 5);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            // Inner shield pattern
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 10);
            ctx.lineTo(cx + 8, cy - 2);
            ctx.lineTo(cx + 8, cy + 8);
            ctx.lineTo(cx, cy + 12);
            ctx.lineTo(cx - 8, cy + 8);
            ctx.lineTo(cx - 8, cy - 2);
            ctx.closePath();
            ctx.stroke();
        } else if (id === 'multishot') {
            // Splitter Module (マルチショット)
            ctx.lineWidth = 3;
            // Main beam
            ctx.beginPath();
            ctx.moveTo(cx - 15, cy);
            ctx.lineTo(cx - 5, cy);
            ctx.stroke();
            // Split arrows
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy);
            ctx.lineTo(cx + 10, cy - 8);
            ctx.lineTo(cx + 15, cy - 8);
            ctx.lineTo(cx + 12, cy - 11);
            ctx.moveTo(cx + 15, cy - 8);
            ctx.lineTo(cx + 12, cy - 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy);
            ctx.lineTo(cx + 10, cy);
            ctx.lineTo(cx + 15, cy);
            ctx.lineTo(cx + 12, cy - 3);
            ctx.moveTo(cx + 15, cy);
            ctx.lineTo(cx + 12, cy + 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy);
            ctx.lineTo(cx + 10, cy + 8);
            ctx.lineTo(cx + 15, cy + 8);
            ctx.lineTo(cx + 12, cy + 5);
            ctx.moveTo(cx + 15, cy + 8);
            ctx.lineTo(cx + 12, cy + 11);
            ctx.stroke();
        } else if (id === 'armor_plate') {
            // Titanium Plating (防御)
            ctx.fillRect(cx - 12, cy - 10, 24, 20);
            // Rivets
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx - 8, cy - 6, 2, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy - 6, 2, 0, Math.PI * 2);
            ctx.arc(cx - 8, cy + 6, 2, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy + 6, 2, 0, Math.PI * 2);
            ctx.fill();
            // Armor lines
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy);
            ctx.lineTo(cx + 10, cy);
            ctx.stroke();
        } else if (id === 'lifesteal') {
            // Vampire Fang (ライフスティール)
            ctx.beginPath();
            ctx.arc(cx, cy + 5, 10, Math.PI, 0);
            ctx.fill();
            // Fangs
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy + 5);
            ctx.lineTo(cx - 3, cy + 12);
            ctx.lineTo(cx - 1, cy + 5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 1, cy + 5);
            ctx.lineTo(cx + 3, cy + 12);
            ctx.lineTo(cx + 5, cy + 5);
            ctx.fill();
            // Blood drops
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx - 3, cy + 14, 2, 0, Math.PI * 2);
            ctx.arc(cx + 3, cy + 14, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (id === 'time_warp') {
            // Chrono Lens (時間加速)
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.stroke();
            // Clock hands
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx, cy - 8);
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + 6, cy);
            ctx.stroke();
            // Speed lines
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + 15, cy - 5);
            ctx.lineTo(cx + 20, cy - 5);
            ctx.moveTo(cx + 15, cy + 5);
            ctx.lineTo(cx + 20, cy + 5);
            ctx.stroke();
        } else if (id === 'phoenix_heart' || id === 'phoenix_heart_used') {
            // Phoenix Heart (復活) - same design for both active and used versions
            ctx.beginPath();
            ctx.moveTo(cx, cy + 10);
            ctx.bezierCurveTo(cx - 8, cy + 2, cx - 12, cy - 6, cx, cy - 12);
            ctx.bezierCurveTo(cx + 12, cy - 6, cx + 8, cy + 2, cx, cy + 10);
            ctx.fill();
            // Flame effect
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 8);
            ctx.lineTo(cx - 2, cy - 4);
            ctx.lineTo(cx, cy);
            ctx.lineTo(cx + 2, cy - 4);
            ctx.closePath();
            ctx.fill();
            // Phoenix wings
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy);
            ctx.lineTo(cx - 14, cy - 8);
            ctx.lineTo(cx - 10, cy - 12);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + 8, cy);
            ctx.lineTo(cx + 14, cy - 8);
            ctx.lineTo(cx + 10, cy - 12);
            ctx.stroke();
        } else {
            // Default Circle
            ctx.beginPath();
            ctx.arc(cx, cy, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.add('hidden'));
        if (this.screens[name]) {
            this.screens[name].classList.remove('hidden');
        }
        if (name === 'home') {
            this.drawCharacterPreviews();
        }
    }

    updateHUD(hpPercent, ene, currentHp, maxHp, time, difficulty, currentShield = 0, maxShield = 0) {
        document.getElementById('hp-bar').style.width = `${hpPercent}%`;

        // Update Shield Bar
        const shieldBar = document.getElementById('shield-bar');
        if (shieldBar) {
            console.log('Shield Debug:', { currentShield, maxShield, shieldBar });
            if (maxShield > 0) {
                const shieldPercent = (currentShield / maxShield) * 100;
                shieldBar.style.width = `${shieldPercent}%`;
                shieldBar.style.display = 'block';
                console.log('Shield Bar Updated:', shieldPercent + '%', shieldBar.style.width);
            } else {
                shieldBar.style.display = 'none';
            }
        }

        document.getElementById('score-ene').innerText = ene;

        // Update HP Text (with shield)
        if (currentHp !== undefined && maxHp !== undefined) {
            let hpText = `${Math.ceil(currentHp)}/${Math.ceil(maxHp)}`;
            if (maxShield > 0) {
                hpText += ` (+${Math.ceil(currentShield)})`;
            }
            document.getElementById('hp-text').innerText = hpText;
        }

        // Update Time
        if (time !== undefined) {
            const m = Math.floor(time / 60).toString().padStart(2, '0');
            const s = Math.floor(time % 60).toString().padStart(2, '0');
            document.getElementById('game-time').innerText = `${m}:${s}`;
        }

        // Update Difficulty
        if (difficulty !== undefined) {
            document.getElementById('game-difficulty').innerText = `Lv. ${difficulty.toFixed(2)}`;
        }
    }

    updateHome() {
        document.getElementById('player-money').innerText = this.game.money;
        document.getElementById('cost-hp').innerText = this.game.upgradeSystem.upgrades.maxHp.cost;
        document.getElementById('cost-dmg').innerText = this.game.upgradeSystem.upgrades.damage.cost;
    }

    updateAcquiredItems(relics) {
        const container = document.getElementById('acquired-items-container');
        container.innerHTML = '';

        // Group relics by ID
        const counts = {};
        const uniqueRelics = [];

        relics.forEach(relic => {
            if (!counts[relic.id]) {
                counts[relic.id] = 0;
                uniqueRelics.push(relic);
            }
            counts[relic.id]++;
        });

        uniqueRelics.forEach(relic => {
            const wrapper = document.createElement('div');
            wrapper.className = 'acquired-item-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '0 5px';

            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 40;
            iconCanvas.height = 40;
            iconCanvas.className = 'acquired-item-icon';
            iconCanvas.title = relic.name; // Tooltip

            const ctx = iconCanvas.getContext('2d');
            // Use helper to draw icon (scaled down)
            this.drawRelicIcon(ctx, relic.id, 40, 40, relic.color);

            wrapper.appendChild(iconCanvas);

            // Add count badge if > 1
            if (counts[relic.id] > 1) {
                const badge = document.createElement('div');
                badge.className = 'item-count-badge';
                badge.innerText = `x${counts[relic.id]}`;
                badge.style.position = 'absolute';
                badge.style.bottom = '0';
                badge.style.right = '0';
                badge.style.background = 'rgba(0,0,0,0.8)';
                badge.style.color = '#fff';
                badge.style.fontSize = '10px';
                badge.style.padding = '2px 4px';
                badge.style.borderRadius = '4px';
                badge.style.border = '1px solid #fff';
                wrapper.appendChild(badge);
            }

            container.appendChild(wrapper);
        });
    }

    updateGameOverStats(ene, killCount, relics, mapLevel) {
        document.getElementById('go-ene').innerText = ene;

        // Display Map Level
        const levelDisplay = document.getElementById('go-level');
        if (levelDisplay) {
            levelDisplay.innerText = mapLevel;
        }

        // Draw Player Character
        const charCanvas = document.getElementById('go-character');
        if (charCanvas) {
            const ctx = charCanvas.getContext('2d');
            this.drawPlayerCharacter(ctx, this.game.selectedCharacter, 25, 25);
        }

        // Enemies
        const enemyContainer = document.getElementById('go-enemies');
        enemyContainer.innerHTML = '';

        // Define enemy display data
        const enemyTypes = {
            'slime': { color: '#00ff88', name: 'Slime' },
            'lizard': { color: '#aa00ff', name: 'Lizard' },
            'golem': { color: '#ff4444', name: 'Golem' },
            'totem': { color: '#ff00ff', name: 'Totem' },
            'kamikaze': { color: '#ffaa00', name: 'Kamikaze' },
            'missile_enemy': { color: '#ff0088', name: 'Missile Bot' },
            'beam_enemy': { color: '#0088ff', name: 'Beam Bot' },
            // Bosses
            'overlord': { color: '#ff00ff', name: 'Overlord', isBoss: true },
            'slime_king': { color: '#00ff88', name: 'Slime King', isBoss: true },
            'mecha_golem': { color: '#ff4444', name: 'Mecha Golem', isBoss: true },
            'void_phantom': { color: '#8800ff', name: 'Void Phantom', isBoss: true },
            'crimson_dragon': { color: '#ff0000', name: 'Crimson Dragon', isBoss: true }
        };

        for (const [type, count] of Object.entries(killCount)) {
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

            if (data.isBoss) {
                this.drawBossIcon(ctx, type, data.color);
            } else {
                this.drawEnemyIcon(ctx, type, data.color);
            }

            wrapper.appendChild(canvas);

            const badge = document.createElement('div');
            badge.innerText = `${count}`;
            badge.className = 'result-count-badge';

            wrapper.appendChild(badge);
            enemyContainer.appendChild(wrapper);
        }

        // Items
        const itemContainer = document.getElementById('go-items');
        itemContainer.innerHTML = '';

        const itemCounts = {};
        relics.forEach(r => {
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
            this.drawRelicIcon(ctx, id, 40, 40, info.data.color);

            wrapper.appendChild(canvas);

            const badge = document.createElement('div');
            badge.innerText = `${info.count}`;
            badge.className = 'result-count-badge';

            wrapper.appendChild(badge);
            itemContainer.appendChild(wrapper);
        }
    }

    drawEnemyIcon(ctx, type, color) {
        const cx = 20;
        const cy = 20;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        if (type === 'slime') {
            // Slime: Blob shape with highlights
            ctx.beginPath();
            ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(cx - 3, cy - 2, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'kamikaze') {
            // Kamikaze: Spiky ball
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 * i) / 8;
                const r = (i % 2 === 0 ? 14 : 8);
                if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
                else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
            // Center core
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'golem') {
            // Golem: Solid square with details
            ctx.fillRect(cx - 10, cy - 10, 20, 20);
            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx - 6, cy - 4, 3, 3);
            ctx.fillRect(cx + 3, cy - 4, 3, 3);
            // Cracks
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + 5);
            ctx.lineTo(cx + 10, cy + 5);
            ctx.stroke();
        } else if (type === 'lizard') {
            // Lizard: Triangle with tail
            ctx.beginPath();
            ctx.moveTo(cx + 12, cy);
            ctx.lineTo(cx - 8, cy + 10);
            ctx.lineTo(cx - 8, cy - 10);
            ctx.closePath();
            ctx.fill();
            // Tail
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy);
            ctx.quadraticCurveTo(cx - 14, cy - 4, cx - 12, cy);
            ctx.quadraticCurveTo(cx - 14, cy + 4, cx - 8, cy);
            ctx.fill();
        } else if (type === 'totem') {
            // Totem: Vertical rectangles stacked
            ctx.fillRect(cx - 8, cy - 12, 16, 8);
            ctx.fillRect(cx - 6, cy - 4, 12, 16);
            // Eyes on top
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx - 5, cy - 10, 3, 3);
            ctx.fillRect(cx + 2, cy - 10, 3, 3);
        } else if (type === 'missile_enemy') {
            // Missile Enemy: Robot with launcher
            ctx.fillRect(cx - 8, cy - 8, 16, 16);
            // Launcher
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx - 2, cy - 12, 4, 8);
            // Eyes
            ctx.fillStyle = color;
            ctx.fillRect(cx - 5, cy - 2, 3, 3);
            ctx.fillRect(cx + 2, cy - 2, 3, 3);
        } else if (type === 'beam_enemy') {
            // Beam Enemy: Robot with beam emitter
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
            // Beam emitter (triangle)
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 10);
            ctx.lineTo(cx - 4, cy - 4);
            ctx.lineTo(cx + 4, cy - 4);
            ctx.closePath();
            ctx.fill();
        } else {
            // Default: Circle
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawPlayerCharacter(ctx, charType, cx, cy) {
        ctx.clearRect(0, 0, 50, 50);

        const radius = 15;
        let color = '#fff';
        if (charType === 'girl') color = '#ff00ff';
        if (charType === 'cat') color = '#00ffff';
        if (charType === 'boy') color = '#00ff00';
        if (charType === 'dog') color = '#ff8800';

        ctx.save();
        ctx.translate(cx, cy);

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        // Body
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Inner
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Accessories
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        if (charType === 'cat') {
            ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(-12, -20); ctx.lineTo(-4, -14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(12, -20); ctx.lineTo(4, -14); ctx.stroke();
        } else if (charType === 'girl') {
            ctx.beginPath(); ctx.arc(0, -12, 4, 0, Math.PI * 2); ctx.fill();
        } else if (charType === 'dog') {
            ctx.beginPath(); ctx.ellipse(-12, -4, 4, 8, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(12, -4, 4, 8, -Math.PI / 4, 0, Math.PI * 2); ctx.fill();
        } else if (charType === 'boy') {
            ctx.beginPath(); ctx.arc(0, -4, radius, Math.PI, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(18, -4); ctx.stroke();
        }

        ctx.restore();
    }

    drawBossIcon(ctx, type, color) {
        const cx = 20;
        const cy = 20;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        if (type === 'overlord') {
            // Overlord: Evil sorcerer with tentacles
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.fill();

            // Horns
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(cx - 8, cy - 8);
            ctx.lineTo(cx - 12, cy - 16);
            ctx.lineTo(cx - 6, cy - 10);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 8, cy - 8);
            ctx.lineTo(cx + 12, cy - 16);
            ctx.lineTo(cx + 6, cy - 10);
            ctx.fill();

            // Evil eyes
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(cx - 4, cy - 2, 2, 0, Math.PI * 2);
            ctx.arc(cx + 4, cy - 2, 2, 0, Math.PI * 2);
            ctx.fill();

            // Tentacles
            ctx.strokeStyle = '#aa00aa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + 8);
            ctx.quadraticCurveTo(cx - 14, cy + 12, cx - 12, cy + 16);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy + 8);
            ctx.quadraticCurveTo(cx + 14, cy + 12, cx + 12, cy + 16);
            ctx.stroke();

        } else if (type === 'slime_king') {
            // Slime King: Large slime with crown
            ctx.beginPath();
            ctx.ellipse(cx, cy + 3, 14, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Shine/highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(cx - 4, cy - 1, 5, 0, Math.PI * 2);
            ctx.fill();

            // Crown
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy - 8);
            ctx.lineTo(cx - 7, cy - 14);
            ctx.lineTo(cx - 3, cy - 10);
            ctx.lineTo(cx, cy - 16);
            ctx.lineTo(cx + 3, cy - 10);
            ctx.lineTo(cx + 7, cy - 14);
            ctx.lineTo(cx + 10, cy - 8);
            ctx.lineTo(cx - 10, cy - 8);
            ctx.fill();

        } else if (type === 'mecha_golem') {
            // Mecha Golem: Robot with mechanical parts
            ctx.fillRect(cx - 12, cy - 10, 24, 20);

            // Head antenna
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(cx - 2, cy - 16, 4, 6);
            ctx.beginPath();
            ctx.arc(cx, cy - 16, 3, 0, Math.PI * 2);
            ctx.fill();

            // Glowing eye visor
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(cx - 8, cy - 4, 16, 4);

            // Shoulder cannons
            ctx.fillStyle = color;
            ctx.fillRect(cx - 14, cy - 6, 3, 8);
            ctx.fillRect(cx + 11, cy - 6, 3, 8);

            // Panel lines
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 10);
            ctx.lineTo(cx, cy + 10);
            ctx.stroke();

        } else if (type === 'void_phantom') {
            // Void Phantom: Ghostly, ethereal
            // Wispy body
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 12, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Trailing wisps
            ctx.globalAlpha = 0.5;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(cx - 5 + i * 5, cy + 10 + i * 3, 4, 6, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1.0;

            // Hollow eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
            ctx.arc(cx + 5, cy - 3, 3, 0, Math.PI * 2);
            ctx.fill();

            // Inner glow in eyes
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx - 5, cy - 3, 1.5, 0, Math.PI * 2);
            ctx.arc(cx + 5, cy - 3, 1.5, 0, Math.PI * 2);
            ctx.fill();

        } else if (type === 'crimson_dragon') {
            // Crimson Dragon: Dragon head with wings
            // Head
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();

            // Horns
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.moveTo(cx - 6, cy - 8);
            ctx.lineTo(cx - 10, cy - 14);
            ctx.lineTo(cx - 4, cy - 10);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 6, cy - 8);
            ctx.lineTo(cx + 10, cy - 14);
            ctx.lineTo(cx + 4, cy - 10);
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(cx - 3, cy - 2, 2, 0, Math.PI * 2);
            ctx.arc(cx + 3, cy - 2, 2, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(cx - 3, cy - 2, 1, 0, Math.PI * 2);
            ctx.arc(cx + 3, cy - 2, 1, 0, Math.PI * 2);
            ctx.fill();

            // Nostrils breathing fire
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(cx - 2, cy + 4, 1.5, 0, Math.PI * 2);
            ctx.arc(cx + 2, cy + 4, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Wings (simplified)
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy);
            ctx.lineTo(cx - 18, cy - 8);
            ctx.lineTo(cx - 14, cy + 4);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy);
            ctx.lineTo(cx + 18, cy - 8);
            ctx.lineTo(cx + 14, cy + 4);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    showMessage(text, duration = 3000) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'floating-message';
        msgDiv.innerText = text;
        msgDiv.style.position = 'absolute';
        msgDiv.style.top = '20%';
        msgDiv.style.left = '50%';
        msgDiv.style.transform = 'translate(-50%, -50%)';
        msgDiv.style.background = 'rgba(0, 0, 0, 0.8)';
        msgDiv.style.color = '#00ffff';
        msgDiv.style.padding = '20px 40px';
        msgDiv.style.border = '2px solid #00ffff';
        msgDiv.style.borderRadius = '10px';
        msgDiv.style.fontSize = '24px';
        msgDiv.style.fontWeight = 'bold';
        msgDiv.style.zIndex = '1000';
        msgDiv.style.pointerEvents = 'none';
        msgDiv.style.animation = 'fadeInOut 0.5s ease-in-out';

        this.uiLayer.appendChild(msgDiv);

        setTimeout(() => {
            msgDiv.style.opacity = '0';
            setTimeout(() => msgDiv.remove(), 500);
        }, duration);
    }
}
