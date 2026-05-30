// Types: 'drone', 'tank', 'bomber', 'boss'
class Enemy extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, -60);
    this.scene = scene;
    this._gfx = scene.add.graphics();
    this.add(this._gfx);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
    this._shootTimer = 0;
    this.type = 'drone';
    this.hp = 1;
    this.maxHp = 1;
    this._flashTimer = 0;
  }

  spawn(x, y, type) {
    this.type = type;
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this._shootTimer = Phaser.Math.Between(1000, 2500);
    this._draw();

    switch (type) {
      case 'drone':
        this.hp = this.maxHp = 1;
        this.body.setSize(28, 28);
        this.body.setVelocityY(220);
        break;
      case 'tank':
        this.hp = this.maxHp = 3;
        this.body.setSize(44, 40);
        this.body.setVelocityY(90);
        break;
      case 'bomber':
        this.hp = this.maxHp = 2;
        this.body.setSize(34, 30);
        this.body.setVelocityY(140);
        break;
      case 'boss':
        this.hp = this.maxHp = 20;
        this.body.setSize(90, 70);
        this.body.setVelocityY(50);
        this._bossDir = 1;
        break;
    }
  }

  _draw(flash = false) {
    const g = this._gfx;
    g.clear();
    const color = flash ? 0xffffff : this._color();
    const alpha = flash ? 1 : 0.9;

    if (this.type === 'drone') {
      g.fillStyle(color, alpha);
      g.fillTriangle(0, 12, -14, -10, 14, -10);
      g.lineStyle(1.5, 0xff0000, 0.9);
      g.strokeTriangle(0, 12, -14, -10, 14, -10);
      // Outline glow
      g.lineStyle(3, this._color(), 0.4);
      g.strokeTriangle(0, 14, -16, -12, 16, -12);

    } else if (this.type === 'tank') {
      g.fillStyle(color, alpha);
      g.fillRect(-22, -20, 44, 40);
      g.lineStyle(2, 0xff6600, 0.9);
      g.strokeRect(-22, -20, 44, 40);
      g.lineStyle(4, this._color(), 0.3);
      g.strokeRect(-24, -22, 48, 44);
      // HP bar
      const ratio = this.hp / this.maxHp;
      g.fillStyle(0x333333, 0.8);
      g.fillRect(-20, 26, 40, 5);
      g.fillStyle(0xff6600, 1);
      g.fillRect(-20, 26, 40 * ratio, 5);

    } else if (this.type === 'bomber') {
      g.fillStyle(color, alpha);
      g.fillTriangle(0, -16, -18, 14, 18, 14);
      g.fillStyle(color, 0.6);
      g.fillTriangle(-18, 14, -28, -4, -8, 14);
      g.fillTriangle(18, 14, 28, -4, 8, 14);
      g.lineStyle(2, 0xff00aa, 0.9);
      g.strokeTriangle(0, -16, -18, 14, 18, 14);
      g.lineStyle(4, this._color(), 0.3);
      g.strokeTriangle(0, -18, -20, 16, 20, 16);

    } else if (this.type === 'boss') {
      // Large angular shape
      g.fillStyle(color, alpha);
      g.fillPoints([
        {x:0, y:-50}, {x:40, y:-20}, {x:50, y:20}, {x:20, y:50},
        {x:-20, y:50}, {x:-50, y:20}, {x:-40, y:-20}
      ], true);
      g.lineStyle(3, this._color(), 1);
      g.strokePoints([
        {x:0, y:-50}, {x:40, y:-20}, {x:50, y:20}, {x:20, y:50},
        {x:-20, y:50}, {x:-50, y:20}, {x:-40, y:-20}
      ], true);
      g.lineStyle(6, this._color(), 0.25);
      g.strokePoints([
        {x:0, y:-54}, {x:44, y:-24}, {x:54, y:24}, {x:24, y:54},
        {x:-24, y:54}, {x:-54, y:24}, {x:-44, y:-24}
      ], true);
      // HP bar
      const ratio = this.hp / this.maxHp;
      const bw = 100;
      g.fillStyle(0x222222, 0.9);
      g.fillRect(-bw/2, 62, bw, 8);
      g.fillStyle(0xff0000, 1);
      g.fillRect(-bw/2, 62, bw * ratio, 8);
    }
  }

  _color() {
    return { drone: 0xff2200, tank: 0xff6600, bomber: 0xff00aa, boss: 0x9900ff }[this.type];
  }

  hit() {
    this.hp--;
    this._draw(true);
    this.scene.time.delayedCall(60, () => { if (this.active) this._draw(); });
    return this.hp <= 0;
  }

  update(time, delta) {
    if (!this.active) return;

    const { H } = window.VOIDSTRIKE;
    if (this.y > H + 80) {
      this.kill();
      return;
    }

    if (this.type === 'boss') {
      const { W } = window.VOIDSTRIKE;
      if (this.y >= 140) {
        this.body.setVelocityY(0);
        this.y = 140;
      }
      const spd = 110;
      this.body.setVelocityX(this._bossDir * spd);
      if (this.x > W - 70) this._bossDir = -1;
      if (this.x < 70) this._bossDir = 1;
    }

    // Bomber shoots
    if (this.type === 'bomber' || this.type === 'boss') {
      this._shootTimer -= delta;
      if (this._shootTimer <= 0) {
        this._shootTimer = this.type === 'boss' ? 800 : 2000;
        this.scene.events.emit('enemyShoot', this);
      }
    }
  }

  kill() {
    this.setActive(false).setVisible(false);
    this.body.reset(0, -100);
    this.body.setVelocity(0, 0);
  }

  getPoints() {
    return { drone: 100, tank: 300, bomber: 200, boss: 5000 }[this.type];
  }
}
