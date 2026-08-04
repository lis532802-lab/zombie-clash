// Player Entity Class
class PlayerEntity extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBodySize(32, 32);

        this.isAttacking = false;
        this.isDashing = false;
        this.dashCooldown = false;
        this.lastFacing = new Phaser.Math.Vector2(1, 0);
    }

    updateControls(cursors, keys) {
        if (this.isDashing) return;

        const state = window.gameState.player;
        let vx = 0;
        let vy = 0;

        if (cursors.left.isDown || keys.keyA.isDown) vx -= 1;
        if (cursors.right.isDown || keys.keyD.isDown) vx += 1;
        if (cursors.up.isDown || keys.keyW.isDown) vy -= 1;
        if (cursors.down.isDown || keys.keyS.isDown) vy += 1;

        const vec = new Phaser.Math.Vector2(vx, vy).normalize();
        this.setVelocity(vec.x * state.speed, vec.y * state.speed);

        if (vx !== 0 || vy !== 0) {
            this.lastFacing.set(vec.x, vec.y);
            this.rotation = Math.atan2(vec.y, vec.x);
        }

        // Stamina Regenerate
        if (!this.isDashing && state.stamina < state.maxStamina) {
            state.stamina = Math.min(state.maxStamina, state.stamina + 0.15);
            window.uiManager.updatePlayerStatus();
        }

        // Space -> Dash
        if (Phaser.Input.Keyboard.JustDown(keys.space) && !this.dashCooldown && state.stamina >= 20) {
            this.performDash();
        }
    }

    performDash() {
        const state = window.gameState.player;
        state.stamina -= 20;
        window.uiManager.updatePlayerStatus();

        this.isDashing = true;
        this.dashCooldown = true;
        this.setVelocity(this.lastFacing.x * state.speed * 2.8, this.lastFacing.y * state.speed * 2.8);

        this.scene.tweens.add({
            targets: this,
            alpha: 0.4,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                this.isDashing = false;
                this.alpha = 1.0;
            }
        });

        this.scene.time.delayedCall(800, () => {
            this.dashCooldown = false;
        });
    }

    attack(scene, targetGroup) {
        if (this.isAttacking) return;
        this.isAttacking = true;

        window.soundEngine.playSwing();

        // Create Slash Graphic Effect
        const slashX = this.x + this.lastFacing.x * 30;
        const slashY = this.y + this.lastFacing.y * 30;
        const slash = scene.add.sprite(slashX, slashY, 'slash_fx');
        slash.rotation = Math.atan2(this.lastFacing.y, this.lastFacing.x);

        scene.tweens.add({
            targets: slash,
            alpha: 0,
            scale: 1.3,
            duration: 150,
            onComplete: () => slash.destroy()
        });

        // Hit Detection
        scene.physics.overlap(slash, targetGroup, (fx, enemy) => {
            if (enemy.isAlive) {
                const stats = window.gameState.player;
                let damage = stats.damage;

                const isCrit = Math.random() < stats.critChance;
                if (isCrit) damage *= 2;

                enemy.takeDamage(damage, this.lastFacing);
                scene.showFloatingText(enemy.x, enemy.y, `${damage}${isCrit ? '!' : ''}`, isCrit ? 0xff0000 : 0xffffff);
            }
        });

        scene.time.delayedCall(250, () => {
            this.isAttacking = false;
        });
    }
}

// Zombie Enemy Entity Class
class ZombieEntity extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'zombie_normal') {
        super(scene, x, y, type);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.zType = type;
        this.isAlive = true;
        this.configureStats();
    }

    configureStats() {
        switch (this.zType) {
            case 'zombie_runner':
                this.hp = 40;
                this.speed = 130;
                this.damage = 8;
                this.xpVal = 20;
                break;
            case 'zombie_tank':
                this.hp = 250;
                this.speed = 55;
                this.damage = 25;
                this.xpVal = 60;
                break;
            case 'zombie_boss':
                this.hp = 1000;
                this.speed = 40;
                this.damage = 50;
                this.xpVal = 500;
                break;
            default: // normal
                this.hp = 80;
                this.speed = 80;
                this.damage = 12;
                this.xpVal = 30;
        }
        this.maxHp = this.hp;
    }

    updateAI(player, scene) {
        if (!this.isAlive) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Simple State Machine AI: Chase when close, else target town hall
        if (dist < 400) {
            scene.physics.moveToObject(this, player, this.speed);
            this.rotation = Math.atan2(player.y - this.y, player.x - this.x);

            if (dist < 32 && !this.attackCooldown) {
                this.attackPlayer(player);
            }
        } else {
            // Patrol towards origin center (Town Hall)
            scene.physics.moveTo(this, 1600, 1600, this.speed * 0.5);
        }
    }

    attackPlayer(player) {
        this.attackCooldown = true;
        const pStats = window.gameState.player;
        const takenDamage = Math.max(1, this.damage - pStats.defense);

        pStats.hp = Math.max(0, pStats.hp - takenDamage);
        window.uiManager.updatePlayerStatus();
        window.soundEngine.playHit();

        this.scene.cameras.main.shake(100, 0.005);

        if (pStats.hp <= 0) {
            window.uiManager.showToast("YOU DIED! Respawning at base...");
            pStats.hp = pStats.maxHp;
            player.setPosition(1600, 1600);
        }

        this.scene.time.delayedCall(1200, () => {
            this.attackCooldown = false;
        });
    }

    takeDamage(amount, knockbackVec) {
        this.hp -= amount;
        window.soundEngine.playHit();

        // Knockback physics impulse
        if (knockbackVec) {
            this.x += knockbackVec.x * 12;
            this.y += knockbackVec.y * 12;
        }

        // Blood particles
        const p = this.scene.add.particles(this.x, this.y, 'blood', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            quantity: 5
        });
        this.scene.time.delayedCall(300, () => p.destroy());

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isAlive = false;
        window.gameState.addXP(this.xpVal);
        window.gameState.addResource('gold', Math.floor(Math.random() * 8 + 2));

        if (this.zType === 'zombie_exploder') {
            window.soundEngine.playExplosion();
            this.scene.cameras.main.shake(200, 0.01);
        }

        this.destroy();
    }
}
