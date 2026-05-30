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
    this._engineTime = 0;

    this._buildGraphics();
    this._buildTrail();
    this._buildShieldGraphic();

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(34, 34);

    // PostFX glow — cyan halo around the ship
    try { this._hull.postFX.addGlow(0x00f5ff, 6, 1, false, 0.1, 12); } catch(e) {}
  }

  _buildGraphics() {
    const g = this.scene.add.graphics();

    // Engine exhausts
    g.fillStyle(0x004455, 0.7);
    g.fillRect(-7, 16, 6, 10);
    g.fillRect(1, 16, 6, 10);

    // Wings
    g.fillStyle(0x005566, 1);
    g.fillTriangle(-18, 14, -32, 2, -10, 20);
    g.fillTriangle( 18, 14,  32, 2,  10, 20);

    // Wing accent lines
    g.lineStyle(1.5, 0x00f5ff, 0.5);
    g.beginPath(); g.moveTo(-18, 14); g.lineTo(-30, 4); g.strokePath();
    g.beginPath(); g.moveTo( 18, 14); g.lineTo( 30, 4); g.strokePath();

    // Main hull
    g.fillStyle(0x00aacc, 1);
    g.fillTriangle(0, -30, -14, 18, 14, 18);

    // Hull edge glow lines
    g.lineStyle(1.5, 0x00f5ff, 0.8);
    g.strokeTriangle(0, -30, -14, 18, 14, 18);

    // Center stripe
    g.fillStyle(0x00f5ff, 0.9);
    g.fillTriangle(0, -24, -5, 6, 5, 6);

    // Cockpit
    g.fillStyle(0xffffff, 0.95);
    g.fillTriangle(0, -20, -5, 0, 5, 0);

    this.add(g);
    this._hull = g;

    // Engine glow (updated every frame)
    this._engine = this.scene.add.graphics();
    this.add(this._engine);
  }

  _buildTrail() {
    // Two separate trails for left/right engine nozzles
    this._trailL = [];
    this._trailR = [];
    this._trailGfx = this.scene.add.graphics().setDepth(2);
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
    this._drawShield(1.0);
    try { this._shieldGfx.postFX.addGlow(0x00ff88, 10, 2, false, 0.1, 12); } catch(e) {}
  }

  activateMultiplier(duration) {
    this.scoreMultiplier = 2;
    this.scene.time.delayedCall(duration, () => { this.scoreMultiplier = 1; });
  }

  _drawShield(alpha = 1) {
    this._shieldGfx.clear();
    if (!this.shield) return;
    this._shieldGfx.lineStyle(2.5, 0x00ff88, 0.75 * alpha);
    this._shieldGfx.strokeCircle(0, 0, 44);
    this._shieldGfx.lineStyle(5, 0x00ff88, 0.18 * alpha);
    this._shieldGfx.strokeCircle(0, 0, 46);
  }

  takeDamage() {
    if (this.invincible) return false;
    if (this.shield) {
      this.shield = false;
      this._shieldGfx.clear();
      try { this._shieldGfx.postFX.clear(); } catch(e) {}
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
      alpha: 0.15,
      duration: 100,
      yoyo: true,
      repeat: 10,
      onComplete: () => {
        this.alpha = 1;
        this.invincible = false;
      }
    });
  }

  update(time, delta) {
    this._engineTime += delta;
    const pulse = Math.sin(this._engineTime / 70) * 0.5 + 0.5;

    // Engine flame
    this._engine.clear();
    // Left nozzle
    this._engine.fillStyle(0xff8800, 0.7 + pulse * 0.3);
    this._engine.fillTriangle(-7, 20, -1, 20, -4, 34 + pulse * 10);
    this._engine.fillStyle(0xffff00, 0.5 + pulse * 0.3);
    this._engine.fillTriangle(-6, 20, -2, 20, -4, 27 + pulse * 6);
    // Right nozzle
    this._engine.fillStyle(0xff8800, 0.7 + pulse * 0.3);
    this._engine.fillTriangle(1, 20, 7, 20, 4, 34 + pulse * 10);
    this._engine.fillStyle(0xffff00, 0.5 + pulse * 0.3);
    this._engine.fillTriangle(2, 20, 6, 20, 4, 27 + pulse * 6);

    // Twin-engine trail
    const lx = this.x - 4, ly = this.y + 22;
    const rx = this.x + 4, ry = this.y + 22;

    this._trailL.unshift({ x: lx, y: ly });
    this._trailR.unshift({ x: rx, y: ry });
    const maxLen = 22;
    if (this._trailL.length > maxLen) this._trailL.pop();
    if (this._trailR.length > maxLen) this._trailR.pop();

    this._trailGfx.clear();
    this._drawStream(this._trailL);
    this._drawStream(this._trailR);

    // Shield shimmer
    if (this.shield) {
      const shimmerA = 0.75 + Math.sin(this._engineTime / 120) * 0.15;
      this._drawShield(shimmerA);
    }
  }

  _drawStream(pts) {
    for (let i = 1; i < pts.length; i++) {
      const t = 1 - i / pts.length;
      const w = t * 3.5;
      // Gradient from yellow-white near ship to cyan at tail
      const r = Math.floor(Phaser.Math.Linear(0, 255, t));
      const g = Math.floor(Phaser.Math.Linear(245, 255, t));
      const b = 255;
      const color = (r << 16) | (g << 8) | b;
      this._trailGfx.lineStyle(w, color, t * 0.55);
      this._trailGfx.beginPath();
      this._trailGfx.moveTo(pts[i - 1].x, pts[i - 1].y);
      this._trailGfx.lineTo(pts[i].x, pts[i].y);
      this._trailGfx.strokePath();
    }
  }

  destroy() {
    this._trailGfx.destroy();
    super.destroy();
  }
}
