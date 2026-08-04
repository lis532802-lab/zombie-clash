class BuildingSystem {
    constructor(scene) {
        this.scene = scene;
        this.buildingCatalog = [
            { id: 'bldg_townhall', name: 'Town Hall', cost: { wood: 100, stone: 100 }, hp: 1000, desc: 'Core settlement base.' },
            { id: 'bldg_wall', name: 'Defensive Wall', cost: { wood: 10, stone: 10 }, hp: 300, desc: 'Blocks zombie pathing.' },
            { id: 'bldg_turret', name: 'Guard Turret', cost: { iron: 20, gold: 50 }, hp: 200, desc: 'Automatically shoots nearby zombies.' },
            { id: 'bldg_goldmine', name: 'Gold Mine', cost: { wood: 50, stone: 50 }, hp: 250, desc: 'Generates Gold over time.' },
            { id: 'bldg_lumbermill', name: 'Lumber Mill', cost: { stone: 30 }, hp: 200, desc: 'Generates Wood over time.' },
            { id: 'bldg_farm', name: 'Wheat Farm', cost: { wood: 30 }, hp: 150, desc: 'Generates Food over time.' },
            { id: 'bldg_hospital', name: 'Hospital', cost: { wood: 60, iron: 15 }, hp: 250, desc: 'Heals commander when standing nearby.' }
        ];

        this.placedBuildings = [];
        this.inPlacementMode = false;
        this.selectedBuildingType = null;
        this.previewSprite = null;

        this.setupIncomeTimer();
    }

    startPlacement(bldgId) {
        this.selectedBuildingType = this.buildingCatalog.find(b => b.id === bldgId);
        if (!this.selectedBuildingType) return;

        this.inPlacementMode = true;
        if (this.previewSprite) this.previewSprite.destroy();

        this.previewSprite = this.scene.add.sprite(0, 0, bldgId);
        this.previewSprite.setAlpha(0.6);
    }

    updatePlacement(worldX, worldY) {
        if (!this.inPlacementMode || !this.previewSprite) return;

        // Snap to Grid (32px)
        const snapX = Math.floor(worldX / 32) * 32 + 16;
        const snapY = Math.floor(worldY / 32) * 32 + 16;

        this.previewSprite.setPosition(snapX, snapY);
    }

    tryPlace(worldX, worldY) {
        if (!this.inPlacementMode || !this.selectedBuildingType) return;

        const snapX = Math.floor(worldX / 32) * 32 + 16;
        const snapY = Math.floor(worldY / 32) * 32 + 16;

        if (!window.gameState.deductResources(this.selectedBuildingType.cost)) {
            window.uiManager.showToast("Not enough resources to construct this!");
            this.cancelPlacement();
            return;
        }

        const bldgSprite = this.scene.physics.add.staticSprite(snapX, snapY, this.selectedBuildingType.id);
        bldgSprite.bData = {
            id: this.selectedBuildingType.id,
            hp: this.selectedBuildingType.hp,
            maxHp: this.selectedBuildingType.hp
        };

        this.placedBuildings.push(bldgSprite);
        this.scene.buildingGroup.add(bldgSprite);

        window.soundEngine.playBuild();
        window.uiManager.showToast(`Built ${this.selectedBuildingType.name}!`);

        this.cancelPlacement();
    }

    cancelPlacement() {
        this.inPlacementMode = false;
        this.selectedBuildingType = null;
        if (this.previewSprite) {
            this.previewSprite.destroy();
            this.previewSprite = null;
        }
    }

    setupIncomeTimer() {
        setInterval(() => {
            let woodGen = 0, goldGen = 0, foodGen = 0;

            this.placedBuildings.forEach(b => {
                if (b.bData.id === 'bldg_goldmine') goldGen += 5;
                if (b.bData.id === 'bldg_lumbermill') woodGen += 5;
                if (b.bData.id === 'bldg_farm') foodGen += 3;
                if (b.bData.id === 'bldg_turret') this.handleTurretFiring(b);
                if (b.bData.id === 'bldg_hospital') this.handleHospitalHealing(b);
            });

            if (woodGen > 0) window.gameState.addResource('wood', woodGen);
            if (goldGen > 0) window.gameState.addResource('gold', goldGen);
            if (foodGen > 0) window.gameState.addResource('food', foodGen);

        }, 3000);
    }

    handleTurretFiring(turret) {
        const enemies = this.scene.zombiesGroup.getChildren();
        for (let enemy of enemies) {
            if (enemy.isAlive && Phaser.Math.Distance.Between(turret.x, turret.y, enemy.x, enemy.y) < 250) {
                // Shoot projectile
                const bullet = this.scene.add.sprite(turret.x, turret.y, 'bullet');
                this.scene.tweens.add({
                    targets: bullet,
                    x: enemy.x,
                    y: enemy.y,
                    duration: 150,
                    onComplete: () => {
                        bullet.destroy();
                        if (enemy.isAlive) enemy.takeDamage(15);
                    }
                });
                break;
            }
        }
    }

    handleHospitalHealing(hospital) {
        const player = this.scene.player;
        if (Phaser.Math.Distance.Between(hospital.x, hospital.y, player.x, player.y) < 150) {
            const pStats = window.gameState.player;
            if (pStats.hp < pStats.maxHp) {
                pStats.hp = Math.min(pStats.maxHp, pStats.hp + 5);
                window.uiManager.updatePlayerStatus();
                this.scene.showFloatingText(player.x, player.y, "+5 HP", 0x2ecc71);
            }
        }
    }
}
