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
  }

  spawn(x, y, type) {
    this.type = type;
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this._shootTimer = Phaser.Math.Between(800, 2200);
    this._draw();

    // PostFX glow matching enemy color
    try {
      this._gfx.postFX.clear();
      this._gfx.postFX.addGlow(this._color(), 8, 1, false, 0.1, 10);
    } catch(e) {}

    switch (type) {
      case 'drone':
        this.hp = this.maxHp = 1;
        this.body.setSize(28, 26);
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
    const baseColor = this._color();
    const color = flash ? 0xffffff : baseColor;
    const a = flash ? 1 : 0.92;

    if (this.type === 'drone') {
      // Arrowhead body
      g.fillStyle(color, a);
      g.fillTriangle(0, 14, -13, -8, 13, -8);
      // Side fins
      g.fillStyle(color, 0.6);
      g.fillTriangle(-13, -8, -22, -16, -6, 4);
      g.fillTriangle( 13, -8,  22, -16,  6, 4);
      // Glow outline
      g.lineStyle(1.5, baseColor, 0.9);
      g.strokeTriangle(0, 14, -13, -8, 13, -8);
      g.lineStyle(3, baseColor, 0.3);
      g.strokeTriangle(0, 16, -15, -10, 15, -10);
      // Center eye
      g.fillStyle(0xffaaaa, 1);
      g.fillCircle(0, 2, 3);

    } else if (this.type === 'tank') {
      // Heavy block
      g.fillStyle(color, a);
      g.fillRect(-20, -22, 40, 44);
      // Armor ridges
      g.fillStyle(flash ? 0xffffff : 0xff8800, a * 0.8);
      g.fillRect(-16, -16, 32, 6);
      g.fillRect(-16,  -4, 32, 6);
      g.fillRect(-16,   8, 32, 6);
      // Outline
      g.lineStyle(2, baseColor, 0.9);
      g.strokeRect(-20, -22, 40, 44);
      g.lineStyle(4, baseColor, 0.25);
      g.strokeRect(-22, -24, 44, 48);
      // HP bar
      const ratio = this.hp / this.maxHp;
      g.fillStyle(0x330000, 0.9);
      g.fillRect(-18, 28, 36, 5);
      g.fillStyle(0xff4400, 1);
      g.fillRect(-18, 28, 36 * ratio, 5);

    } else if (this.type === 'bomber') {
      // Diamond fuselage
      g.fillStyle(color, a);
      g.fillPoints([{x:0,y:-20},{x:14,y:0},{x:0,y:20},{x:-14,y:0}], true);
      // Wings
      g.fillStyle(color, 0.55);
      g.fillTriangle(-14, 0, -30, -10, -14, 12);
      g.fillTriangle( 14, 0,  30, -10,  14, 12);
      // Outline
      g.lineStyle(2, baseColor, 0.9);
      g.strokePoints([{x:0,y:-20},{x:14,y:0},{x:0,y:20},{x:-14,y:0}], true);
      g.lineStyle(4, baseColor, 0.25);
      g.strokePoints([{x:0,y:-22},{x:16,y:0},{x:0,y:22},{x:-16,y:0}], true);
      // Bomb hardpoint
      g.fillStyle(0xffaaff, 0.9);
      g.fillCircle(0, 0, 4);

    } else if (this.type === 'boss') {
      // Heptagon hull
      const pts = [
        {x:0,y:-52},{x:42,y:-22},{x:52,y:22},{x:22,y:52},
        {x:-22,y:52},{x:-52,y:22},{x:-42,y:-22}
      ];
      const outer = pts.map(p => ({x: p.x * 1.12, y: p.y * 1.12}));
      g.fillStyle(color, a);
      g.fillPoints(pts, true);
      // Inner detail
      g.fillStyle(flash ? 0xffffff : 0x6600cc, 0.6);
      const inner = pts.map(p => ({x: p.x * 0.55, y: p.y * 0.55}));
      g.fillPoints(inner, true);
      g.fillStyle(flash ? 0xffffff : 0xcc00ff, 0.4);
      const core = [{x:0,y:-20},{x:16,y:-8},{x:20,y:8},{x:8,y:20},{x:-8,y:20},{x:-20,y:8},{x:-16,y:-8}];
      g.fillPoints(core, true);
      // Rings
      g.lineStyle(3, baseColor, 0.95);
      g.strokePoints(pts, true);
      g.lineStyle(6, baseColor, 0.22);
      g.strokePoints(outer, true);
      // HP bar
      const ratio = this.hp / this.maxHp;
      g.fillStyle(0x110022, 0.95);
      g.fillRect(-48, 66, 96, 9);
      g.fillStyle(ratio > 0.5 ? 0xaa00ff : ratio > 0.25 ? 0xff4400 : 0xff0000, 1);
      g.fillRect(-48, 66, 96 * ratio, 9);
      g.lineStyle(1, 0x9900ff, 0.5);
      g.strokeRect(-48, 66, 96, 9);
    }
  }

  _color() {
    return { drone: 0xff2200, tank: 0xff6600, bomber: 0xff00aa, boss: 0xaa00ff }[this.type];
  }

  hit() {
    this.hp--;
    this._draw(true);
    this.scene.time.delayedCall(55, () => { if (this.active) this._draw(); });
    return this.hp <= 0;
  }

  update(time, delta) {
    if (!this.active) return;

    const { H } = window.VOIDSTRIKE;
    if (this.y > H + 80) { this.kill(); return; }

    if (this.type === 'boss') {
      const { W } = window.VOIDSTRIKE;
      if (this.y >= 140) { this.body.setVelocityY(0); this.y = 140; }
      this.body.setVelocityX(this._bossDir * 115);
      if (this.x > W - 70) this._bossDir = -1;
      if (this.x < 70)     this._bossDir = 1;
    }

    if (this.type === 'bomber' || this.type === 'boss') {
      this._shootTimer -= delta;
      if (this._shootTimer <= 0) {
        this._shootTimer = this.type === 'boss' ? 750 : 1900;
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
