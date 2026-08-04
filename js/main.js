// Master Game Engine Configuration & Bootstrap Init
const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: false,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MainScene]
};

window.addEventListener('load', () => {
    // Instantiate Phaser Game Core
    window.game = new Phaser.Game(gameConfig);

    // Auto load previous saved state if present
    window.gameState.load();

    // Window Resize Handler
    window.addEventListener('resize', () => {
        if (window.game) {
            window.game.scale.resize(window.innerWidth, window.innerHeight);
        }
    });
});
