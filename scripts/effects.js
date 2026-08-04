class EffectsEngine {
    constructor(scene) {
        this.scene = scene;
        this.weatherType = 'clear'; // clear, rain, fog, storm
    }

    setWeather(type) {
        this.weatherType = type;
        document.getElementById('weather-display').innerText = `${this.getWeatherIcon(type)} ${type.toUpperCase()}`;

        if (type === 'rain' || type === 'storm') {
            this.createRainParticles();
        } else {
            if (this.rainEmitter) this.rainEmitter.destroy();
        }
    }

    getWeatherIcon(type) {
        switch(type) {
            case 'rain': return '🌧️';
            case 'fog': return '🌫️';
            case 'storm': return '⛈️';
            default: return '☀️';
        }
    }

    createRainParticles() {
        if (this.rainEmitter) this.rainEmitter.destroy();

        const rainTex = this.scene.make.graphics({x: 0, y: 0, add: false});
        rainTex.fillStyle(0x73b9ff, 0.7);
        rainTex.fillRect(0, 0, 2, 10);
        rainTex.generateTexture('rain_drop', 2, 10);
        rainTex.destroy();

        this.rainEmitter = this.scene.add.particles(0, 0, 'rain_drop', {
            x: { min: 0, max: 3200 },
            y: 0,
            lifespan: 1000,
            speedY: { min: 400, max: 600 },
            speedX: { min: -50, max: -20 },
            quantity: 4,
            blendMode: 'ADD'
        });
        this.rainEmitter.setDepth(90);
    }

    spawnSlashArc(x, y, facingVec, colorHex = 0xffffff) {
        const slash = this.scene.add.sprite(x, y, 'slash_fx');
        slash.setTint(colorHex);
        slash.rotation = Math.atan2(facingVec.y, facingVec.x);
        slash.setScale(1.2);

        this.scene.tweens.add({
            targets: slash,
            alpha: 0,
            scale: 1.6,
            duration: 180,
            onComplete: () => slash.destroy()
        });
    }
}
