class WorkerManager {
    constructor(scene) {
        this.scene = scene;
        this.survivors = [];
        this.roles = ['Worker', 'Farmer', 'Guard', 'Builder', 'Medic'];
    }

    spawnSurvivor(x, y) {
        const survivor = this.scene.physics.add.sprite(x, y, 'player');
        survivor.setTint(0x00ffcc);
        survivor.role = 'Worker';
        survivor.targetBuilding = null;

        this.survivors.push(survivor);
        window.gameState.population.current = this.survivors.length;
        window.uiManager.updateTopBar();

        this.assignAutonomousRoutine(survivor);
    }

    assignAutonomousRoutine(survivor) {
        this.scene.time.addEvent({
            delay: 3000,
            loop: true,
            callback: () => {
                if (!survivor.active) return;

                if (survivor.role === 'Farmer') {
                    // Collect bonus food periodically
                    window.gameState.addResource('food', 2);
                } else if (survivor.role === 'Guard') {
                    // Patrol near base boundary
                    const rx = 1600 + Phaser.Math.Between(-300, 300);
                    const ry = 1600 + Phaser.Math.Between(-300, 300);
                    this.scene.physics.moveTo(survivor, rx, ry, 40);
                } else if (survivor.role === 'Medic') {
                    // Heal commander if nearby
                    if (Phaser.Math.Distance.Between(survivor.x, survivor.y, this.scene.player.x, this.scene.player.y) < 100) {
                        window.gameState.player.hp = Math.min(window.gameState.player.maxHp, window.gameState.player.hp + 2);
                        window.uiManager.updatePlayerStatus();
                    }
                }
            }
        });
    }

    setRole(index, newRole) {
        if (this.survivors[index]) {
            this.survivors[index].role = newRole;
            window.uiManager.showToast(`Survivor assigned as ${newRole}`);
        }
    }
}
