class TextureGenerator {
    static generateAll(scene) {
        this.createTerrainTextures(scene);
        this.createPlayerTexture(scene);
        this.createZombieTextures(scene);
        this.createResourceTextures(scene);
        this.createBuildingTextures(scene);
        this.createEffectTextures(scene);
    }

    static createTerrainTextures(scene) {
        // Grass Tile
        let g = scene.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0x388e3c, 1);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x2e7d32, 1);
        g.fillCircle(16, 16, 4);
        g.fillCircle(48, 40, 6);
        g.generateTexture('tile_grass', 64, 64);
        g.destroy();

        // Dirt Tile
        g = scene.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0x795548, 1);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x5d4037, 1);
        g.fillRect(8, 8, 16, 16);
        g.fillRect(36, 32, 20, 20);
        g.generateTexture('tile_dirt', 64, 64);
        g.destroy();
    }

    static createPlayerTexture(scene) {
        const g = scene.make.graphics({x: 0, y: 0, add: false});
        // Body (Blue Commander)
        g.fillStyle(0x2980b9, 1);
        g.fillCircle(24, 24, 18);
        // Armor Plate
        g.fillStyle(0xbdc3c7, 1);
        g.fillCircle(24, 24, 10);
        // Head / Helmet
        g.fillStyle(0xf39c12, 1);
        g.fillCircle(24, 24, 6);
        // Sword Indicator
        g.fillStyle(0xecf0f1, 1);
        g.fillRect(36, 20, 10, 8);
        g.generateTexture('player', 48, 48);
        g.destroy();
    }

    static createZombieTextures(scene) {
        const types = [
            { key: 'zombie_normal', color: 0x27ae60, size: 20 },
            { key: 'zombie_runner', color: 0xc0392b, size: 16 },
            { key: 'zombie_tank', color: 0x2c3e50, size: 28 },
            { key: 'zombie_poison', color: 0x8e44ad, size: 22 },
            { key: 'zombie_exploder', color: 0xd35400, size: 22 },
            { key: 'zombie_boss', color: 0x880e4f, size: 40 }
        ];

        types.forEach(z => {
            const g = scene.make.graphics({x: 0, y: 0, add: false});
            const center = z.size + 4;
            g.fillStyle(z.color, 1);
            g.fillCircle(center, center, z.size);
            // Red eyes
            g.fillStyle(0xff0000, 1);
            g.fillCircle(center + z.size/2 - 2, center - 4, 3);
            g.fillCircle(center + z.size/2 - 2, center + 4, 3);
            g.generateTexture(z.key, center * 2, center * 2);
            g.destroy();
        });
    }

    static createResourceTextures(scene) {
        // Tree Node
        let g = scene.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0x27ae60, 1);
        g.fillCircle(24, 24, 22);
        g.fillStyle(0x1e8449, 1);
        g.fillCircle(20, 20, 14);
        g.generateTexture('node_wood', 48, 48);
        g.destroy();

        // Rock Node
        g = scene.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0x7f8c8d, 1);
        g.fillRect(6, 6, 36, 36);
        g.fillStyle(0x95a5a6, 1);
        g.fillRect(12, 12, 24, 24);
        g.generateTexture('node_stone', 48, 48);
        g.destroy();

        // Iron Node
        g = scene.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0x34495e, 1);
        g.fillRect(6, 6, 36, 36);
        g.fillStyle(0xd5dbdb, 1);
        g.fillCircle(24, 24, 10);
        g.generateTexture('node_iron', 48, 48);
        g.destroy();
    }

    static createBuildingTextures(scene) {
        const bldgs = [
            { key: 'bldg_townhall', color: 0xf39c12, w: 96, h: 96 },
            { key: 'bldg_wall', color: 0x7f8c8d, w: 32, h: 32 },
            { key: 'bldg_turret', color: 0xe74c3c, w: 48, h: 48 },
            { key: 'bldg_goldmine', color: 0xf1c40f, w: 64, h: 64 },
            { key: 'bldg_lumbermill', color: 0xa0522d, w: 64, h: 64 },
            { key: 'bldg_farm', color: 0x2ecc71, w: 64, h: 64 },
            { key: 'bldg_hospital', color: 0x3498db, w: 64, h: 64 }
        ];

        bldgs.forEach(b => {
            const g = scene.make.graphics({x: 0, y: 0, add: false});
            g.fillStyle(b.color, 1);
            g.fillRect(0, 0, b.w, b.h);
            g.lineStyle(4, 0x000000, 0.4);
            g.strokeRect(0, 0, b.w, b.h);
            g.generateTexture(b.key, b.w, b.h);
            g.destroy();
        });
    }

    static createEffectTextures(scene) {
        // Bullet
        let g = scene.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0xf1c40f, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('bullet', 8, 8);
        g.destroy();

        // Slash Trail
        g = scene.make.graphics({x: 0, y: 0, add: false});
        g.lineStyle(4, 0xffffff, 1);
        g.beginPath();
        g.arc(32, 32, 28, Phaser.Math.DegToRad(-45), Phaser.Math.DegToRad(45), false);
        g.strokePath();
        g.generateTexture('slash_fx', 64, 64);
        g.destroy();

        // Blood Particle
        g = scene.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0xc0392b, 1);
        g.fillCircle(3, 3, 3);
        g.generateTexture('blood', 6, 6);
        g.destroy();
    }
}
