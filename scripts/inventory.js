class InventoryManager {
    constructor() {
        this.slots = 15;
    }

    addItem(itemObj) {
        const existing = window.gameState.inventory.find(i => i.id === itemObj.id);
        if (existing) {
            existing.count += (itemObj.count || 1);
        } else {
            if (window.gameState.inventory.length < this.slots) {
                window.gameState.inventory.push(itemObj);
            } else {
                window.uiManager.showToast("Inventory full!");
                return false;
            }
        }
        window.uiManager.renderInventory();
        return true;
    }

    useItem(index) {
        const item = window.gameState.inventory[index];
        if (!item) return;

        if (item.id === 'hp_potion' || item.id === 'health_potion') {
            const p = window.gameState.player;
            p.hp = Math.min(p.maxHp, p.hp + 50);
            window.uiManager.updatePlayerStatus();
            window.uiManager.showToast("Used Health Potion (+50 HP)");

            item.count--;
            if (item.count <= 0) {
                window.gameState.inventory.splice(index, 1);
            }
            window.uiManager.renderInventory();
        }
    }
}

window.inventoryManager = new InventoryManager();
