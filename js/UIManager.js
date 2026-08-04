class UIManager {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('btn-build').onclick = () => this.toggleModal('modal-build');
        document.getElementById('btn-craft').onclick = () => this.toggleModal('modal-craft');
        document.getElementById('btn-inventory').onclick = () => this.toggleModal('modal-inventory');
        document.getElementById('btn-skills').onclick = () => this.toggleModal('modal-skills');
        document.getElementById('btn-save').onclick = () => window.gameState.save();

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.target.closest('.modal').classList.add('hidden');
            };
        });

        // Keybind Shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'b' || e.key === 'B') this.toggleModal('modal-build');
            if (e.key === 'c' || e.key === 'C') this.toggleModal('modal-craft');
            if (e.key === 'i' || e.key === 'I') this.toggleModal('modal-inventory');
            if (e.key === 'k' || e.key === 'K') this.toggleModal('modal-skills');
        });
    }

    toggleModal(modalId) {
        const target = document.getElementById(modalId);
        const isHidden = target.classList.contains('hidden');

        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));

        if (isHidden) {
            target.classList.remove('hidden');
            this.renderModalContents(modalId);
        }
    }

    renderModalContents(modalId) {
        if (modalId === 'modal-build') this.renderBuildCatalog();
        if (modalId === 'modal-craft') this.renderCraftingCatalog();
        if (modalId === 'modal-skills') this.renderSkillsCatalog();
        if (modalId === 'modal-inventory') this.renderInventory();
    }

    renderBuildCatalog() {
        const container = document.getElementById('building-options');
        container.innerHTML = '';
        const catalog = window.buildingSystem.buildingCatalog;

        catalog.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';

            let costText = Object.entries(item.cost).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(', ');

            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
                <div class="costs">Cost: ${costText}</div>
                <button class="card-btn">Construct</button>
            `;

            card.querySelector('button').onclick = () => {
                this.toggleModal('modal-build');
                window.buildingSystem.startPlacement(item.id);
            };

            container.appendChild(card);
        });
    }

    renderCraftingCatalog() {
        const container = document.getElementById('crafting-options');
        container.innerHTML = '';
        const recipes = [
            { id: 'fire_sword', name: '🔥 Fire Sword', cost: { iron: 30, gold: 100 }, desc: '+20 Attack Damage' },
            { id: 'iron_shield', name: '🛡️ Reinforced Shield', cost: { iron: 40, wood: 50 }, desc: '+10 Defense' },
            { id: 'hp_potion', name: '🧪 Health Potion', cost: { food: 15 }, desc: 'Restores 50 HP instantly' }
        ];

        recipes.forEach(r => {
            const card = document.createElement('div');
            card.className = 'card';
            let costText = Object.entries(r.cost).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(', ');

            card.innerHTML = `
                <h3>${r.name}</h3>
                <p>${r.desc}</p>
                <div class="costs">Cost: ${costText}</div>
                <button class="card-btn">Craft</button>
            `;

            card.querySelector('button').onclick = () => {
                if (window.gameState.deductResources(r.cost)) {
                    if (r.id === 'fire_sword') window.gameState.player.damage += 20;
                    if (r.id === 'iron_shield') window.gameState.player.defense += 10;
                    if (r.id === 'hp_potion') {
                        window.gameState.inventory.push({ id: 'hp_potion', name: 'Health Potion', count: 1 });
                    }
                    window.soundEngine.playCoin();
                    this.showToast(`Crafted ${r.name}!`);
                } else {
                    this.showToast("Missing materials!");
                }
            };

            container.appendChild(card);
        });
    }

    renderSkillsCatalog() {
        const container = document.getElementById('skills-options');
        document.getElementById('skill-points-val').innerText = window.gameState.player.skillPoints;
        container.innerHTML = '';

        const skills = [
            { id: 'str', name: 'Strength Upgrade', desc: '+5 Sword Damage' },
            { id: 'vit', name: 'Vitality Upgrade', desc: '+25 Max Health' },
            { id: 'agi', name: 'Agility Upgrade', desc: '+20 Movement Speed' }
        ];

        skills.forEach(s => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${s.name}</h3>
                <p>${s.desc}</p>
                <button class="card-btn">Upgrade (1 SP)</button>
            `;

            card.querySelector('button').onclick = () => {
                if (window.gameState.player.skillPoints > 0) {
                    window.gameState.player.skillPoints--;
                    if (s.id === 'str') window.gameState.player.damage += 5;
                    if (s.id === 'vit') {
                        window.gameState.player.maxHp += 25;
                        window.gameState.player.hp += 25;
                    }
                    if (s.id === 'agi') window.gameState.player.speed += 20;

                    this.updatePlayerStatus();
                    this.renderSkillsCatalog();
                    this.showToast(`Upgraded ${s.name}!`);
                }
            };

            container.appendChild(card);
        });
    }

    renderInventory() {
        const container = document.getElementById('inventory-slots');
        container.innerHTML = '';

        window.gameState.inventory.forEach(item => {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            slot.innerHTML = `<div>${item.name}</div><div class="count">x${item.count || 1}</div>`;
            container.appendChild(slot);
        });
    }

    updateTopBar() {
        const res = window.gameState.resources;
        document.getElementById('res-wood').innerText = res.wood;
        document.getElementById('res-stone').innerText = res.stone;
        document.getElementById('res-iron').innerText = res.iron;
        document.getElementById('res-gold').innerText = res.gold;
        document.getElementById('res-food').innerText = res.food;
        document.getElementById('res-pop').innerText = `${window.gameState.population.current}/${window.gameState.population.max}`;
    }

    updatePlayerStatus() {
        const p = window.gameState.player;
        document.getElementById('hp-bar').style.width = `${(p.hp / p.maxHp) * 100}%`;
        document.getElementById('hp-text').innerText = `${Math.floor(p.hp)}/${p.maxHp}`;

        document.getElementById('stamina-bar').style.width = `${(p.stamina / p.maxStamina) * 100}%`;
        document.getElementById('stamina-text').innerText = `${Math.floor(p.stamina)}/${p.maxStamina}`;

        document.getElementById('xp-bar').style.width = `${(p.xp / p.xpToNext) * 100}%`;
        document.getElementById('xp-text').innerText = `${p.xp}/${p.xpToNext}`;
        document.getElementById('player-lvl').innerText = p.level;
    }

    updateTimeDisplay(timeStr, isNight) {
        document.getElementById('time-display').innerText = timeStr;
        const warn = document.getElementById('wave-warning');
        if (isNight) {
            warn.classList.remove('hidden');
        } else {
            warn.classList.add('hidden');
        }
    }

    showToast(msg) {
        const area = document.getElementById('notification-area');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = msg;
        area.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    updateAll() {
        this.updateTopBar();
        this.updatePlayerStatus();
    }
}

window.uiManager = new UIManager();
