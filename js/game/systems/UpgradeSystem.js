export class UpgradeSystem {
    constructor(game) {
        this.game = game;
        this.upgrades = {
            maxHp: { level: 0, cost: 100, increment: 20, name: "Max HP" },
            damage: { level: 0, cost: 150, increment: 2, name: "Damage" },
            magnet: { level: 0, cost: 80, increment: 20, name: "Magnet Range" }
        };
        this.load();
    }

    purchase(type) {
        const upgrade = this.upgrades[type];
        if (!upgrade) return false;

        if (this.game.money >= upgrade.cost) {
            this.game.money -= upgrade.cost;
            upgrade.level++;
            upgrade.cost = Math.floor(upgrade.cost * 1.5);
            this.save();
            return true;
        }
        return false;
    }

    applyUpgrades(player) {
        player.maxHp += this.upgrades.maxHp.level * this.upgrades.maxHp.increment;
        player.hp = player.maxHp; // Heal to full
        player.damage += this.upgrades.damage.level * this.upgrades.damage.increment;
        // Magnet handled in Drop.js, need to pass player or game to drop
    }

    save() {
        const data = {
            money: this.game.money,
            upgrades: this.upgrades
        };
        localStorage.setItem('yurufuwa_save', JSON.stringify(data));
    }

    load() {
        const json = localStorage.getItem('yurufuwa_save');
        if (json) {
            const data = JSON.parse(json);
            this.game.money = data.money || 0;
            if (data.upgrades) {
                for (const key in data.upgrades) {
                    if (this.upgrades[key]) {
                        this.upgrades[key].level = data.upgrades[key].level;
                        this.upgrades[key].cost = data.upgrades[key].cost;
                    }
                }
            }
        }
    }
}
