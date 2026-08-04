class CombatEngine {
    constructor(scene) {
        this.scene = scene;
    }

    processPlayerAttack(player, targetsGroup, currentWeaponKey = 'standard') {
        const stats = window.gameState.player;
        const weaponInfo = WeaponSystem.WEAPONS[currentWeaponKey] || WeaponSystem.WEAPONS.standard;

        const hitArcCenter = new Phaser.Math.Vector2(
            player.x + player.lastFacing.x * 35,
            player.y + player.lastFacing.y * 35
        );

        // Visual Slash Spray
        window.effectsEngine.spawnSlashArc(hitArcCenter.x, hitArcCenter.y, player.lastFacing, weaponInfo.color);

        targetsGroup.getChildren().forEach(enemy => {
            if (!enemy.isAlive) return;

            const dist = Phaser.Math.Distance.Between(hitArcCenter.x, hitArcCenter.y, enemy.x, enemy.y);
            if (dist < 45) {
                // Calculate Damage
                let totalDamage = stats.damage + weaponInfo.damage;
                const isCrit = Math.random() < (stats.critChance + weaponInfo.critChance);
                
                if (isCrit) {
                    totalDamage = Math.floor(totalDamage * 1.8);
                }

                // Apply Damage & Knockback
                enemy.takeDamage(totalDamage, player.lastFacing);
                this.scene.showFloatingText(enemy.x, enemy.y, `${totalDamage}${isCrit ? ' CRIT!' : ''}`, isCrit ? 0xff3333 : 0xffffff);

                // Trigger Weapon Elemental Effect
                WeaponSystem.applyElementalEffect(this.scene, currentWeaponKey, enemy);
            }
        });
    }
}
