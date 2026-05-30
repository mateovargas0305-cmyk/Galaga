const GAME_W = 540;
const GAME_H = 960;

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'game-container',
  backgroundColor: '#0a0a0f',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene]
};

window.VOIDSTRIKE = { W: GAME_W, H: GAME_H };
window.game = new Phaser.Game(config);
