class Bullet extends Phaser.Physics.Arcade.Image {
  constructor(scene) {
    super(scene, 0, 0, '__DEFAULT');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
    this.isEnemy = false;
  }

  fire(x, y, vx, vy, isEnemy = false) {
    this.isEnemy = isEnemy;
    this.setActive(true).setVisible(true);
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.setVelocity(vx, vy);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    const { W, H } = window.VOIDSTRIKE;
    if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
      this.kill();
    }
  }

  kill() {
    this.setActive(false).setVisible(false);
    this.setVelocity(0, 0);
  }
}
