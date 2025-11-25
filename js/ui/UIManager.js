export class UIManager {
    constructor(game) {
        this.game = game;
        this.uiLayer = document.getElementById('ui-layer');
        this.screens = {};

        // Relic Data (Moved from ShopSystem)
        this.relics = [
            { id: 'atk_up', name: 'Cyber Katana', desc: 'Attack Damage +20%', cost: 15, color: '#ff4444', effect: (p) => p.damage *= 1.2 },
            { id: 'spd_up', name: 'Neko Headphones', desc: 'Move Speed +15%', cost: 20, color: '#4444ff', effect: (p) => p.speed *= 1.15 },
            { id: 'hp_up', name: 'Energy Drink', desc: 'Max HP +30', cost: 25, color: '#44ff44', effect: (p) => { p.maxHp += 30; p.hp += 30; } },
            { id: 'rate_up', name: 'Overclock Chip', desc: 'Fire Rate +10%', cost: 18, color: '#ffaa00', effect: (p) => p.shootInterval *= 0.9 },
            { id: 'range_up', name: 'Scope Lens', desc: 'Magnet Range +50%', cost: 12, color: '#00ffff', effect: (p) => { /* Handled in Drop */ } },
            { id: 'drone', name: 'Support Drone', desc: 'Summons a drone', cost: 40, color: '#00ffaa', effect: (p) => p.game.addDrone() },
            { id: 'missile', name: 'Missile Pod', desc: 'Fires homing missiles', cost: 50, color: '#ff0088', effect: (p) => p.missileCount++ },
            { id: 'full_heal', name: 'Emergency Repair', desc: 'Fully Restores HP', cost: 300, color: '#ff00ff', effect: (p) => p.hp = p.maxHp }
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
        `);

        // HUD (Heads Up Display)
        this.screens.hud = this.createScreen('hud-screen', `
            <div class="hud-top">
                <div class="hud-left">
                    <div class="hud-hp-ene-row">
                        <div class="bar-container">
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
            <h2 style="color: #ff0000;">GAME OVER</h2>
            <div class="result-stats-container">
                <div class="result-section">
                    <h3>Total Ene</h3>
                    <p class="result-big-text"><span id="go-ene">0</span></p>
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
            <button id="btn-go-home" class="cyber-btn">RETURN HOME</button>
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

    updateHUD(hpPercent, ene, currentHp, maxHp, time, difficulty) {
        document.getElementById('hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('score-ene').innerText = ene;

        // Update HP Text
        if (currentHp !== undefined && maxHp !== undefined) {
            document.getElementById('hp-text').innerText = `${Math.ceil(currentHp)}/${Math.ceil(maxHp)}`;
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

        // Display Map Level (Create element if not exists)
        let levelDisplay = document.getElementById('go-level');
        if (!levelDisplay) {
            const container = document.querySelector('.result-stats-container');
            const section = document.createElement('div');
            section.className = 'result-section';
            section.innerHTML = `<h3>Reached Stage</h3><p class="result-big-text"><span id="go-level">1</span></p>`;
            container.insertBefore(section, container.firstChild);
            levelDisplay = document.getElementById('go-level');
        }
        levelDisplay.innerText = mapLevel;

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
            'beam_enemy': { color: '#0088ff', name: 'Beam Bot' }
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
            this.drawEnemyIcon(ctx, type, data.color);

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

        // Scale down slightly (0.8x)
        const s = 0.8;

        if (type === 'slime') {
            ctx.beginPath(); ctx.arc(cx, cy, 10 * s, 0, Math.PI * 2); ctx.fill();
        } else if (type === 'kamikaze') {
            // Spiky
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 * i) / 8;
                const r = (i % 2 === 0 ? 12 : 6) * s;
                ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            ctx.fill();
        } else if (type === 'golem') {
            ctx.fillRect(cx - 10 * s, cy - 10 * s, 20 * s, 20 * s);
        } else if (type === 'lizard') {
            ctx.beginPath();
            ctx.moveTo(cx + 10 * s, cy);
            ctx.lineTo(cx - 10 * s, cy + 8 * s);
            ctx.lineTo(cx - 10 * s, cy - 8 * s);
            ctx.fill();
        } else {
            ctx.beginPath(); ctx.arc(cx, cy, 10 * s, 0, Math.PI * 2); ctx.stroke();
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
