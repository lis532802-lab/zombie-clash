class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        TextureGenerator.generateAll(this);
    }

    create() {
        // World Bounds (3200 x 3200 px)
        this.cameras.main.setBounds(0, 0, 3200, 3200);
        this.physics.world.setBounds(0, 0, 3200, 3200);

        // Tilemap Simulation (Grass Terrain)
        for (let x = 0; x < 3200; x += 64) {
            for (let y = 0; y < 3200; y += 64) {
                this.add.image(x + 32, y + 32, 'tile_grass');
            }
        }

        // Object Groups
        this.buildingGroup = this.physics.add.staticGroup();
        this.resourceNodesGroup = this.physics.add.staticGroup();
        this.zombiesGroup = this.physics.add.group({ runChildUpdate: true });

        // Initialize Systems
        window.buildingSystem = new BuildingSystem(this);

        // Spawn Initial Townhall at Center Map
        const centerTH = this.physics.add.staticSprite(1600, 1600, 'bldg_townhall');
        centerTH.bData = { id: 'bldg_townhall', hp: 1000, maxHp: 1000 };
        this.buildingGroup.add(centerTH);
        window.buildingSystem.placedBuildings.push(centerTH);

        // Create Player Commander
        this.player = new PlayerEntity(this, 1650, 1650);

        // Camera Setup
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.2);

        // Input Controls Setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            keyW: Phaser.Input.Keyboard.KeyCodes.W,
            keyA: Phaser.Input.Keyboard.KeyCodes.A,
            keyS: Phaser.Input.Keyboard.KeyCodes.S,
            keyD: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Mouse Controls for Building & Attack
        this.input.on('pointermove', (pointer) => {
            const worldPoint = pointer.positionToCamera(this.cameras.main);
            window.buildingSystem.updatePlacement(worldPoint.x, worldPoint.y);
        });

        this.input.on('pointerdown', (pointer) => {
            window.soundEngine.init(); // AudioContext Unlock
            const worldPoint = pointer.positionToCamera(this.cameras.main);

            if (window.buildingSystem.inPlacementMode) {
                if (pointer.leftButtonDown()) {
                    window.buildingSystem.tryPlace(worldPoint.x, worldPoint.y);
                } else if (pointer.rightButtonDown()) {
                    window.buildingSystem.cancelPlacement();
                }
            } else {
                if (pointer.leftButtonDown()) {
                    this.player.attack(this, this.zombiesGroup);
                }
            }
        });

        // Collisions & Overlaps
        this.physics.add.collider(this.player, this.buildingGroup);
        this.physics.add.collider(this.zombiesGroup, this.buildingGroup, (zombie, bldg) => {
            if (zombie.isAlive && !zombie.bldgAttackCooldown) {
                zombie.bldgAttackCooldown = true;
                bldg.bData.hp -= zombie.damage;
                window.soundEngine.playHit();

                if (bldg.bData.hp <= 0) {
                    bldg.destroy();
                    window.uiManager.showToast("A building was destroyed by zombies!");
                }

                this.time.delayedCall(1000, () => { zombie.bldgAttackCooldown = false; });
            }
        });

        // Spawn Environmental Resource Nodes
        this.spawnResourceNodes();

        // Day / Night & Horde Spawners
        this.timeOfDay = 8 * 60; // 08:00 AM start
        this.dayCount = 1;
        this.nightHordeSpawned = false;

        // Overlay Dynamic Darkness Tensor
        this.darknessOverlay = this.add.rectangle(1600, 1600, 3200, 3200, 0x050515, 0);
        this.darknessOverlay.setDepth(100);

        // Auto Save Interval (Every 2 mins)
        this.time.addEvent({
            delay: 120000,
            callback: () => window.gameState.save(),
            loop: true
        });

        window.uiManager.updateAll();
    }

    spawnResourceNodes() {
        for (let i = 0; i < 60; i++) {
            const rx = Phaser.Math.Between(200, 3000);
            const ry = Phaser.Math.Between(200, 3000);
            const type = Math.random() < 0.5 ? 'node_wood' : (Math.random() < 0.8 ? 'node_stone' : 'node_iron');

            const node = this.physics.add.staticSprite(rx, ry, type);
            node.nodeType = type;
            node.hp = 3;
            this.resourceNodesGroup.add(node);
        }

        // Harvesting Overlap Interaction
        this.physics.add.overlap(this.player, this.resourceNodesGroup, (player, node) => {
            if (player.isAttacking && !node.harvestCooldown) {
                node.harvestCooldown = true;
                node.hp -= 1;
                window.soundEngine.playHit();

                let resKey = 'wood';
                if (node.nodeType === 'node_stone') resKey = 'stone';
                if (node.nodeType === 'node_iron') resKey = 'iron';

                window.gameState.addResource(resKey, 5);
                this.showFloatingText(node.x, node.y, `+5 ${resKey.toUpperCase()}`, 0xf1c40f);

                if (node.hp <= 0) {
                    node.destroy();
                }

                this.time.delayedCall(300, () => { node.harvestCooldown = false; });
            }
        });
    }

    update(time, delta) {
        // Player Controls Tick
        this.player.updateControls(this.cursors, this.keys);

        // Update Zombies State Engine
        this.zombiesGroup.getChildren().forEach(zombie => {
            zombie.updateAI(this.player, this);
        });

        // Day/Night Cycle Loop
        this.updateDayNightCycle(delta);

        // Render Minimap
        this.updateMinimap();
    }

    updateDayNightCycle(delta) {
        this.timeOfDay += (delta / 1000) * 2; // Real-time 1 sec = 2 game mins
        if (this.timeOfDay >= 24 * 60) {
            this.timeOfDay = 0;
            this.dayCount++;
            this.nightHordeSpawned = false;
        }

        const hours = Math.floor(this.timeOfDay / 60);
        const mins = Math.floor(this.timeOfDay % 60);
        const pad = (n) => n < 10 ? '0' + n : n;
        const timeStr = `Day ${this.dayCount} - ${pad(hours)}:${pad(mins)}`;

        const isNight = hours >= 20 || hours < 6;

        // Darkness Alpha Interpolation
        if (hours >= 18 && hours < 22) {
            this.darknessOverlay.fillAlpha = ((hours - 18) / 4) * 0.7;
        } else if (hours >= 22 || hours < 5) {
            this.darknessOverlay.fillAlpha = 0.7;
        } else if (hours >= 5 && hours < 8) {
            this.darknessOverlay.fillAlpha = (1 - (hours - 5) / 3) * 0.7;
        } else {
            this.darknessOverlay.fillAlpha = 0;
        }

        window.uiManager.updateTimeDisplay(timeStr, isNight);

        // Night Horde Spawner Trigger
        if (isNight && !this.nightHordeSpawned && hours === 21) {
            this.spawnNightHorde();
        }
    }

    spawnNightHorde() {
        this.nightHordeSpawned = true;
        window.soundEngine.playGrowl();
        window.uiManager.showToast("SURVIVAL WAVE: A massive zombie horde is attacking!");

        const hordeCount = 8 + this.dayCount * 5;
        for (let i = 0; i < hordeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spawnDist = 1200;
            const sx = this.player.x + Math.cos(angle) * spawnDist;
            const sy = this.player.y + Math.sin(angle) * spawnDist;

            let zType = 'zombie_normal';
            const rand = Math.random();
            if (rand < 0.3) zType = 'zombie_runner';
            else if (rand < 0.5) zType = 'zombie_tank';
            else if (rand < 0.6) zType = 'zombie_exploder';

            if (this.dayCount % 3 === 0 && i === 0) {
                zType = 'zombie_boss'; // Boss wave every 3 days
                window.uiManager.showToast("⚠️ GIANT BOSS ZOMBIE HAS SPAWNED! ⚠️");
            }

            const zombie = new ZombieEntity(this, sx, sy, zType);
            this.zombiesGroup.add(zombie);
        }
    }

    showFloatingText(x, y, text, color = 0xffffff) {
        const floatText = this.add.text(x, y - 20, text, {
            fontFamily: 'Segoe UI',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#' + color.toString(16)
        });
        floatText.setDepth(200);

        this.tweens.add({
            targets: floatText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => floatText.destroy()
        });
    }

    updateMinimap() {
        const canvas = document.getElementById('minimap');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 140, 140);

        const scale = 140 / 3200;

        // Draw Player
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(this.player.x * scale, this.player.y * scale, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw Buildings
        ctx.fillStyle = '#f1c40f';
        window.buildingSystem.placedBuildings.forEach(b => {
            ctx.fillRect(b.x * scale - 2, b.y * scale - 2, 4, 4);
        });

        // Draw Enemies
        ctx.fillStyle = '#e74c3c';
        this.zombiesGroup.getChildren().forEach(z => {
            if (z.isAlive) {
                ctx.fillRect(z.x * scale - 1, z.y * scale - 1, 2, 2);
            }
        });
    }
}
