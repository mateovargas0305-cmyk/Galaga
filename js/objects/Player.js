class Player extends Phaser.GameObjects.Container {
  constructor(scene) {
    const { W, H } = window.VOIDSTRIKE;
    super(scene, W / 2, H - 120);

    this.scene = scene;
    this.lives = 3;
    this.invincible = false;
    this.tripleShot = false;
    this.shield = false;
    this.scoreMultiplier = 1;
    this._trailPoints = [];

    this._buildGraphics();
    this._buildTrail();
    this._buildShieldGraphic();

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(36, 36);

    this._engineTime = 0;
  }

  _buildGraphics() {
    const g = this.scene.add.graphics();
    // Main hull
    g.fillStyle(0x00f5ff, 1);
    g.fillTriangle(0, -28, -18, 18, 18, 18);
    // Wing accents
    g.fillStyle(0xff00aa, 1);
    g.fillTriangle(-18, 18, -28, 8, -12, 22);
    g.fillTriangle(18, 18, 28, 8, 12, 22);
    // Cockpit
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(0, -18, -7, 4, 7, 4);
    this.add(g);
    this._hull = g;

    // Engine glow
    this._engine = this.scene.add.graphics();
    this.add(this._engine);
  }

  _buildTrail() {
    this._trailGfx = this.scene.add.graphics();
    this.scene.children.sendToBack(this._trailGfx);
  }

  _buildShieldGraphic() {
    this._shieldGfx = this.scene.add.graphics();
    this.add(this._shieldGfx);
  }

  activateTriple(duration) {
    this.tripleShot = true;
    this.scene.time.delayedCall(duration, () => { this.tripleShot = false; });
  }

  activateShield() {
    this.shield = true;
    this._drawShield();
  }

  activateMultiplier(duration) {
    this.scoreMultiplier = 2;
    this.scene.time.delayedCall(duration, () => { this.scoreMultiplier = 1; });
  }

  _drawShield() {
    this._shieldGfx.clear();
    if (!this.shield) return;
    this._shieldGfx.lineStyle(3, 0x00f5ff, 0.8);
    this._shieldGfx.strokeCircle(0, 0, 42);
  }

  takeDamage() {
    if (this.invincible) return false;
    if (this.shield) {
      this.shield = false;
      this._shieldGfx.clear();
      window.audio.hit();
      return false;
    }
    this.lives--;
    this._startInvincibility();
    window.audio.hit();
    return true;
  }

  _startInvincibility() {
    this.invincible = true;
    this._blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      duration: 120,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        this.alpha = 1;
        this.invincible = false;
      }
    });
  }

  update(time, delta) {
    this._engineTime += delta;

    // Animated engine glow
    const pulse = Math.sin(this._engineTime / 80) * 0.5 + 0.5;
    this._engine.clear();
    this._engine.fillStyle(0xff6600, 0.6 + pulse * 0.4);
    this._engine.fillTriangle(-8, 22, 8, 22, 0, 38 + pulse * 8);
    this._engine.fillStyle(0xffff00, 0.4 + pulse * 0.3);
    this._engine.fillTriangle(-4, 22, 4, 22, 0, 30 + pulse * 5);

    // Trail
    this._trailPoints.unshift({ x: this.x, y: this.y + 20 });
    if (this._trailPoints.length > 18) this._trailPoints.pop();

    this._trailGfx.clear();
    for (let i = 1; i < this._trailPoints.length; i++) {
      const alpha = (1 - i / this._trailPoints.length) * 0.5;
      const width = (1 - i / this._trailPoints.length) * 4;
      this._trailGfx.lineStyle(width, 0x00f5ff, alpha);
      this._trailGfx.beginPath();
      this._trailGfx.moveTo(this._trailPoints[i - 1].x, this._trailPoints[i - 1].y);
      this._trailGfx.lineTo(this._trailPoints[i].x, this._trailPoints[i].y);
      this._trailGfx.strokePath();
    }

    // Pulse shield
    if (this.shield) this._drawShield();
  }

  destroy() {
    this._trailGfx.destroy();
    super.destroy();
  }
}
