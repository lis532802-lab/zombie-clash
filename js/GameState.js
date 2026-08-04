class GameState {
    constructor() {
        this.resetDefaults();
    }

    resetDefaults() {
        this.player = {
            level: 1,
            xp: 0,
            xpToNext: 100,
            hp: 100,
            maxHp: 100,
            stamina: 100,
            maxStamina: 100,
            damage: 25,
            defense: 5,
            speed: 180,
            critChance: 0.1,
            skillPoints: 0,
            weapon: 'Standard Sword'
        };

        this.resources = {
            wood: 120,
            stone: 80,
            iron: 30,
            gold: 150,
            food: 60
        };

        this.population = {
            current: 2,
            max: 10
        };

        this.time = {
            day: 1,
            hour: 8,
            minute: 0,
            totalMinutes: 8 * 60
        };

        this.inventory = [
            { id: 'health_potion', name: 'Health Potion', count: 3, type: 'consumable' },
            { id: 'wood', name: 'Wood', count: 120, type: 'resource' },
            { id: 'stone', name: 'Stone', count: 80, type: 'resource' }
        ];

        this.buildings = [];
        this.unlockedSkills = [];
    }

    addResource(type, amount) {
        if (this.resources[type] !== undefined) {
            this.resources[type] += amount;
            window.uiManager.updateTopBar();
        }
    }

    useResource(type, amount) {
        if (this.resources[type] !== undefined && this.resources[type] >= amount) {
            this.resources[type] -= amount;
            window.uiManager.updateTopBar();
            return true;
        }
        return false;
    }

    hasResources(costObj) {
        for (let res in costObj) {
            if ((this.resources[res] || 0) < costObj[res]) return false;
        }
        return true;
    }

    deductResources(costObj) {
        if (!this.hasResources(costObj)) return false;
        for (let res in costObj) {
            this.resources[res] -= costObj[res];
        }
        window.uiManager.updateTopBar();
        return true;
    }

    addXP(amount) {
        this.player.xp += amount;
        window.uiManager.showToast(`+${amount} XP`);
        if (this.player.xp >= this.player.xpToNext) {
            this.player.xp -= this.player.xpToNext;
            this.player.level++;
            this.player.skillPoints += 2;
            this.player.maxHp += 15;
            this.player.hp = this.player.maxHp;
            this.player.xpToNext = Math.floor(this.player.xpToNext * 1.5);
            window.soundEngine.playCoin();
            window.uiManager.showToast(`LEVEL UP! You are now Level ${this.player.level}!`);
        }
        window.uiManager.updatePlayerStatus();
    }

    save() {
        const data = {
            player: this.player,
            resources: this.resources,
            time: this.time,
            inventory: this.inventory
        };
        localStorage.setItem('zombie_clash_save', JSON.stringify(data));
        window.uiManager.showToast("Game Saved Successfully!");
    }

    load() {
        const raw = localStorage.getItem('zombie_clash_save');
        if (!raw) return false;
        try {
            const data = JSON.parse(raw);
            this.player = data.player;
            this.resources = data.resources;
            this.time = data.time;
            this.inventory = data.inventory;
            window.uiManager.updateAll();
            return true;
        } catch (e) {
            console.error("Failed to parse save game", e);
            return false;
        }
    }
}

window.gameState = new GameState();
