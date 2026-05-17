export class UpgradeSystem {
    constructor(game) {
        this.game = game;
        this.reservedRelicId = null;
        this.gachaCost = 100;
        this.gachaMultiplier = 1.1;
        this.baseGachaCost = 100;
        this.unlockedCharacters = ['girl'];

        this.load();
    }

    performGacha() {
        if (this.game.money >= this.gachaCost) {
            this.game.money -= this.gachaCost;

            // Pick a random relic from UIManager
            const availableRelics = this.game.ui.relics.filter(r => r.id !== 'phoenix_heart_used');
            const randomRelic = availableRelics[Math.floor(Math.random() * availableRelics.length)];

            this.reservedRelicId = randomRelic.id;

            // Increase cost
            this.gachaCost = Math.floor(this.gachaCost * this.gachaMultiplier);

            this.save();
            return randomRelic;
        }
        return null;
    }

    resetGachaCost() {
        this.gachaCost = this.baseGachaCost;
        this.reservedRelicId = null;
        this.save();
    }

    applyUpgrades(player) {
        // Reserved item is now handled directly in Game.startRun
        
        // Apply unlocked skill tree nodes
        if (this.game.skillTree && this.game.skillTree.unlockedNodes) {
            for (const id of this.game.skillTree.unlockedNodes) {
                const node = this.game.skillTree.nodes[id];
                if (node && node.effect) {
                    node.effect(player);
                }
            }
        }
    }

    save() {
        const data = {
            money: this.game.money,
            totalStagesCleared: this.game.totalStagesCleared,
            reservedRelicId: this.reservedRelicId,
            gachaCost: this.gachaCost,
            unlockedSkillNodes: this.game.skillTree ? this.game.skillTree.unlockedNodes : ['core'],
            unlockedCharacters: this.unlockedCharacters
        };
        localStorage.setItem('yurufuwa_save', JSON.stringify(data));
    }

    load() {
        const json = localStorage.getItem('yurufuwa_save');
        if (json) {
            const data = JSON.parse(json);
            this.game.money = data.money || 0;
            this.game.totalStagesCleared = data.totalStagesCleared || 0;
            this.reservedRelicId = data.reservedRelicId || null;
            this.gachaCost = data.gachaCost || this.baseGachaCost;
            if (data.unlockedSkillNodes && this.game.skillTree) {
                this.game.skillTree.unlockedNodes = data.unlockedSkillNodes;
            }
            if (data.unlockedCharacters) {
                this.unlockedCharacters = data.unlockedCharacters;
            }
        }
    }
}
