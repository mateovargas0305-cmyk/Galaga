class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // Pre-generate textures used as blank Physics.Arcade.Image base
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 14);
    g.generateTexture('bullet_tex', 4, 14);

    g.clear();
    g.fillStyle(0xff4444);
    g.fillRect(0, 0, 4, 10);
    g.generateTexture('ebullet_tex', 4, 10);
    g.destroy();

    this.scene.start('MenuScene');
  }
}
