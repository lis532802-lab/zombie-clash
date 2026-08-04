class CraftingEngine {
    constructor() {
        this.recipes = [
            { id: 'fire_sword', name: 'Fire Sword', cost: { iron: 30, gold: 100 }, resultType: 'weapon', resultKey: 'fire' },
            { id: 'ice_sword', name: 'Ice Sword', cost: { iron: 25, stone: 50, gold: 80 }, resultType: 'weapon', resultKey: 'ice' },
            { id: 'lightning_sword', name: 'Lightning Blade', cost: { iron: 50, gold: 200 }, resultType: 'weapon', resultKey: 'lightning' },
            { id: 'iron_armor', name: 'Iron Plate Armor', cost: { iron: 60, wood: 40 }, resultType: 'stat', stat: 'defense', amount: 15 },
            { id: 'health_potion', name: 'Large Health Potion', cost: { food: 20 }, resultType: 'item', count: 2 }
        ];
    }

    craftItem(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return false;

        if (window.gameState.deductResources(recipe.cost)) {
            if (recipe.resultType === 'weapon') {
                window.gameState.player.weapon = recipe.resultKey;
                window.uiManager.showToast(`Equipped ${recipe.name}!`);
            } else if (recipe.resultType === 'stat') {
                window.gameState.player[recipe.stat] += recipe.amount;
                window.uiManager.showToast(`Upgraded Defense by +${recipe.amount}`);
            } else if (recipe.resultType === 'item') {
                window.gameState.inventory.push({ id: recipe.id, name: recipe.name, count: recipe.count });
            }
            window.soundEngine.playCoin();
            return true;
        } else {
            window.uiManager.showToast("Insufficient resources to craft this!");
            return false;
        }
    }
}

window.craftingEngine = new CraftingEngine();
