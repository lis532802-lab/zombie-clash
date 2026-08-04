class WeaponSystem {
    static WEAPONS = {
        standard: { name: 'Standard Sword', damage: 25, critChance: 0.1, element: 'physical', color: 0xffffff },
        fire: { name: 'Fire Sword', damage: 45, critChance: 0.15, element: 'fire', color: 0xe74c3c, dotDamage: 10 },
        ice: { name: 'Ice Sword', damage: 35, critChance: 0.2, element: 'ice', color: 0x3498db, slowDuration: 2000 },
        lightning: { name: 'Lightning Sword', damage: 50, critChance: 0.25, element: 'lightning', color: 0xf1c40f, chainTargets: 3 },
        poison: { name: 'Poison Dagger', damage: 30, critChance: 0.3, element: 'poison', color: 0x2ecc71, dotTicks: 5 }
    };

    static applyElementalEffect(scene, weaponType, target) {
        const config = this.WEAPONS[weaponType];
        if (!config || !target.isAlive) return;

        if (config.element === 'fire') {
            // Apply Burn Effect over time
            let ticks = 3;
            const burnTimer = scene.time.addEvent({
                delay: 500,
                repeat: ticks - 1,
                callback: () => {
                    if (target.isAlive) {
                        target.takeDamage(config.dotDamage);
                        scene.showFloatingText(target.x, target.y, `🔥 ${config.dotDamage}`, 0xe74c3c);
                    }
                }
            });
        } else if (config.element === 'ice') {
            // Slow down Zombie speed
            const origSpeed = target.speed;
            target.speed = origSpeed * 0.4;
            target.setTint(0x3498db);
            scene.time.delayedCall(config.slowDuration, () => {
                if (target.isAlive) {
                    target.speed = origSpeed;
                    target.clearTint();
                }
            });
        } else if (config.element === 'lightning') {
            // Chain to adjacent zombies
            const nearby = scene.zombiesGroup.getChildren().filter(z => z !== target && z.isAlive && Phaser.Math.Distance.Between(target.x, target.y, z.x, z.y) < 120);
            nearby.slice(0, config.chainTargets).forEach(chainTarget => {
                chainTarget.takeDamage(20);
                scene.showFloatingText(chainTarget.x, chainTarget.y, `⚡ 20`, 0xf1c40f);
            });
        }
    }
}
