// Types: 'triple', 'shield', 'multiplier'
class PowerUp extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, -50);
    this.scene = scene;
    this._gfx = scene.add.graphics();
    this._label = scene.add.text(0, 0, '', {
      fontSize: '11px', fontFamily: 'Courier New',
      color: '#ffffff', align: 'center'
    }).setOrigin(0.5);
    this.add([this._gfx, this._label]);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
    this._time = 0;
  }

  spawn(x, y) {
    const types = ['triple', 'shield', 'multiplier'];
    this.type = types[Phaser.Math.Between(0, 2)];
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.body.setVelocityY(150);
    this.body.setSize(32, 32);
    this._draw();
  }

  _draw() {
    const g = this._gfx;
    g.clear();
    const cfg = {
      triple:     { color: 0x00f5ff, symbol: '3x', label: 'TRIPLE' },
      shield:     { color: 0x00ff88, symbol: 'S',  label: 'SHIELD' },
      multiplier: { color: 0xffdd00, symbol: 'x2', label: 'x2 PTS' }
    }[this.type];

    g.lineStyle(2, cfg.color, 1);
    g.strokeRect(-16, -16, 32, 32);
    g.lineStyle(4, cfg.color, 0.3);
    g.strokeRect(-20, -20, 40, 40);
    g.fillStyle(cfg.color, 0.15);
    g.fillRect(-16, -16, 32, 32);

    this._label.setText(cfg.symbol);
    this._label.setStyle({ color: '#' + cfg.color.toString(16).padStart(6, '0') });
  }

  update(time, delta) {
    if (!this.active) return;
    this._time += delta;
    this.rotation = Math.sin(this._time / 400) * 0.3;
    const { H } = window.VOIDSTRIKE;
    if (this.y > H + 40) this.kill();
  }

  kill() {
    this.setActive(false).setVisible(false);
    this.body.setVelocity(0, 0);
  }

  apply(player) {
    window.audio.powerup();
    switch (this.type) {
      case 'triple':     player.activateTriple(15000); break;
      case 'shield':     player.activateShield();      break;
      case 'multiplier': player.activateMultiplier(10000); break;
    }
    this.kill();
  }

  getColor() {
    return { triple: 0x00f5ff, shield: 0x00ff88, multiplier: 0xffdd00 }[this.type];
  }
}
