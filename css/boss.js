class BossZombie extends ZombieEntity {
    constructor(scene, x, y) {
        super(scene, x, y, 'zombie_boss');
        this.phase = 1;
        this.maxHp = 1200;
        this.hp = this.maxHp;
        this.speed = 45;
        this.damage = 40;
        this.isCastingAOE = false;
        
        // Create Overhead Boss Health UI
        this.createBossUI();
    }

    createBossUI() {
        let container = document.getElementById('boss-ui');
        if (!container) {
            container = document.createElement('div');
            container.id = 'boss-ui';
            container.className = 'boss-health-bar-overlay';
            container.innerHTML = `
                <div class="boss-name">TITAN ZOMBIE BOSS - PHASE <span id="boss-phase-num">1</span></div>
                <div class="boss-hp-bg"><div id="boss-hp-bar" class="boss-hp-fill"></div></div>
            `;
            document.getElementById('ui-overlay').appendChild(container);
        }
        this.updateBossUI();
    }

    updateBossUI() {
        const bar = document.getElementById('boss-hp-bar');
        const phaseNum = document.getElementById('boss-phase-num');
        if (bar) bar.style.width = `${Math.max(0, (this.hp / this.maxHp) * 100)}%`;
        if (phaseNum) phaseNum.innerText = this.phase;
    }

    takeDamage(amount, knockbackVec) {
        // Boss resists knockback partially
        super.takeDamage(amount, knockbackVec ? new Phaser.Math.Vector2(knockbackVec.x * 0.2, knockbackVec.y * 0.2) : null);
        this.updateBossUI();
        this.checkPhaseTransition();
    }

    checkPhaseTransition() {
        const ratio = this.hp / this.maxHp;
        if (ratio < 0.6 && this.phase === 1) {
            this.phase = 2;
            this.speed = 60;
            this.damage = 50;
            this.setTint(0xff5555);
            window.uiManager.showToast("BOSS PHASE 2: Titan Enraged! Attack speed increased!");
            this.triggerGroundSlam();
        } else if (ratio < 0.25 && this.phase === 2) {
            this.phase = 3;
            this.speed = 75;
            this.damage = 65;
            this.setTint(0x990000);
            window.uiManager.showToast("BOSS FINAL PHASE: Summoning Minion Horde!");
            this.summonMinions();
        }
    }

    triggerGroundSlam() {
        if (!this.isAlive || this.isCastingAOE) return;
        this.isCastingAOE = true;

        this.scene.cameras.main.shake(400, 0.015);
        window.soundEngine.playExplosion();

        // Create Shockwave Graphic
        const shock = this.scene.add.circle(this.x, this.y, 10, 0xff0000, 0.5);
        this.scene.tweens.add({
            targets: shock,
            radius: 180,
            alpha: 0,
            duration: 600,
            onComplete: () => shock.destroy()
        });

        // AOE Damage to Player
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
        if (dist < 180) {
            const pStats = window.gameState.player;
            pStats.hp = Math.max(0, pStats.hp - 35);
            window.uiManager.updatePlayerStatus();
        }

        this.scene.time.delayedCall(4000, () => { this.isCastingAOE = false; });
    }

    summonMinions() {
        if (!this.isAlive) return;
        for (let i = 0; i < 4; i++) {
            const z = new ZombieEntity(this.scene, this.x + (i * 30 - 45), this.y + 40, 'zombie_runner');
            this.scene.zombiesGroup.add(z);
        }
    }

    die() {
        const ui = document.getElementById('boss-ui');
        if (ui) ui.remove();
        window.uiManager.showToast("VICTORY! The Titan Boss has been defeated!");
        super.die();
    }
}
