class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    const { W, H } = window.VOIDSTRIKE;
    this.W = W; this.H = H;

    this.score = 0;
    this.wave = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this._waveActive = false;
    this._spawnComplete = false;
    this._bossWave = false;
    this._paused = false;
    this._shootTimer = 0;
    this._gridTime = 0;

    this._buildBackground();
    this._buildRetroGrid();
    this._buildPools();
    this._buildPlayer();
    this._buildUI();
    this._buildPauseOverlay();
    this._setupInput();
    this._setupEvents();

    this.time.delayedCall(800, () => this._startWave());
  }

  // ─── BACKGROUND ─────────────────────────────────────────────────────────────

  _buildBackground() {
    const { W, H } = window.VOIDSTRIKE;

    // Deep-space gradient: black-blue top → dark purple bottom
    const bg = this.add.graphics().setDepth(-20);
    bg.fillGradientStyle(0x05050f, 0x05050f, 0x150825, 0x12062a, 1);
    bg.fillRect(0, 0, W, H);

    // Nebula wisps — drawn once, static
    const neb = this.add.graphics().setDepth(-18);
    const nebDef = [
      { x: W * 0.25, y: H * 0.18, r: 110, color: 0x1a0050 },
      { x: W * 0.78, y: H * 0.32, r: 90,  color: 0x002040 },
      { x: W * 0.5,  y: H * 0.08, r: 140, color: 0x0e0035 },
      { x: W * 0.15, y: H * 0.48, r: 70,  color: 0x200015 },
    ];
    for (const n of nebDef) {
      neb.fillStyle(n.color, 0.55);
      neb.fillCircle(n.x, n.y, n.r);
      neb.fillStyle(n.color, 0.2);
      neb.fillCircle(n.x, n.y, n.r * 1.6);
    }

    // Starfield
    this._bgGfx = this.add.graphics().setDepth(-16);
    this._stars1 = Array.from({ length: 70 }, () => ({
      x: Phaser.Math.Between(0, W), y: Phaser.Math.Between(0, H),
      s: Math.random() * 1.2 + 0.3, bright: Math.random()
    }));
    this._stars2 = Array.from({ length: 35 }, () => ({
      x: Phaser.Math.Between(0, W), y: Phaser.Math.Between(0, H),
      s: Math.random() * 1.8 + 0.6, bright: Math.random()
    }));
  }

  _updateBackground(delta) {
    const { W, H } = window.VOIDSTRIKE;
    this._bgGfx.clear();
    for (const s of this._stars1) {
      s.y += 0.45 * (delta / 16);
      if (s.y > H) { s.y = 0; s.x = Phaser.Math.Between(0, W); }
      const a = 0.3 + s.bright * 0.35;
      this._bgGfx.fillStyle(0xffffff, a);
      this._bgGfx.fillRect(s.x, s.y, s.s, s.s);
    }
    for (const s of this._stars2) {
      s.y += 1.3 * (delta / 16);
      if (s.y > H) { s.y = 0; s.x = Phaser.Math.Between(0, W); }
      this._bgGfx.fillStyle(0xaad4ff, 0.55 + s.bright * 0.2);
      this._bgGfx.fillRect(s.x, s.y, s.s * 0.7, s.s * 1.6);
    }
  }

  // ─── RETRO SYNTHWAVE GRID ────────────────────────────────────────────────────

  _buildRetroGrid() {
    const { H } = window.VOIDSTRIKE;
    this._gridGfx = this.add.graphics().setDepth(-14);
    this._gridHorizon = H * 0.68; // horizon y
  }

  _drawRetroGrid(delta) {
    const { W, H } = window.VOIDSTRIKE;
    const g = this._gridGfx;
    g.clear();

    this._gridTime = (this._gridTime + delta) % 99999;
    const scroll = (this._gridTime / 700) % 1; // cells scroll forward every 700ms

    const hy = this._gridHorizon;
    const bot = H + 10;
    const span = bot - hy;

    // ── Horizontal lines with perspective scrolling ──────────────────────────
    const numH = 14;
    for (let i = 0; i < numH + 1; i++) {
      // Evenly spaced in perspective (1/z space), scroll shifts them downward
      const t = ((i / numH) + scroll) % 1; // 0=horizon, 1=bottom
      const y = hy + span * Math.pow(t, 2.2); // power>2 = lines denser near horizon
      if (y < hy || y > bot) continue;

      const alpha = Math.pow(t, 0.6) * 0.55;
      const lw = 1 + t * 0.8;
      g.lineStyle(lw, 0xff00aa, alpha);
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath();
    }

    // ── Vertical lines converging to vanishing point ─────────────────────────
    const numV = 14;
    const vp = { x: W / 2, y: hy }; // vanishing point
    for (let i = 0; i <= numV; i++) {
      const t = i / numV;
      const xBot = t * W;
      // Fade lines on the far edges
      const edge = 1 - Math.abs(t - 0.5) * 0.6;
      g.lineStyle(1, 0xff00aa, 0.28 * edge);
      g.beginPath(); g.moveTo(vp.x, vp.y); g.lineTo(xBot, bot); g.strokePath();
    }

    // ── Horizon glow line ────────────────────────────────────────────────────
    // Outer soft glow
    g.lineStyle(8, 0xff00aa, 0.10);
    g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.strokePath();
    // Core bright line
    g.lineStyle(2, 0xff00aa, 0.75);
    g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.strokePath();
    // Hot center pixel
    g.lineStyle(1, 0xffffff, 0.5);
    g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.strokePath();

    // ── Sun / lens flare at vanishing point ──────────────────────────────────
    const sunR = 22 + Math.sin(this._gridTime / 600) * 2;
    g.fillStyle(0xff00aa, 0.06); g.fillCircle(vp.x, hy, sunR * 3);
    g.fillStyle(0xff00aa, 0.12); g.fillCircle(vp.x, hy, sunR * 1.6);
    g.fillStyle(0xff66cc, 0.30); g.fillCircle(vp.x, hy, sunR);
    g.fillStyle(0xffffff, 0.70); g.fillCircle(vp.x, hy, sunR * 0.35);
  }

  // ─── POOLS ──────────────────────────────────────────────────────────────────

  _buildPools() {
    this._bulletPool  = Array.from({ length: 40 }, () => this._makeBullet(false));
    this._ebulletPool = Array.from({ length: 20 }, () => this._makeBullet(true));
    this._enemyPool   = Array.from({ length: 24 }, () => {
      const e = new Enemy(this);
      e.setActive(false).setVisible(false);
      return e;
    });
    this._powerupPool = Array.from({ length: 8 }, () => {
      const p = new PowerUp(this);
      p.setActive(false).setVisible(false);
      return p;
    });
  }

  _makeBullet(isEnemy) {
    const tex = isEnemy ? 'ebullet_tex' : 'bullet_tex';
    const b = this.physics.add.image(0, -100, tex).setActive(false).setVisible(false);
    b.isEnemy = isEnemy;
    // PostFX glow on bullets
    try {
      b.postFX.addGlow(isEnemy ? 0xff3300 : 0x00f5ff, 5, 1, false, 0.1, 8);
    } catch(e) {}
    b._kill = () => {
      b.setActive(false).setVisible(false);
      b.body.reset(0, -100);
    };
    return b;
  }

  // ─── PLAYER ─────────────────────────────────────────────────────────────────

  _buildPlayer() {
    this.player = new Player(this);
    this.player.body.setCollideWorldBounds(true);
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────

  _buildUI() {
    const { W, H } = window.VOIDSTRIKE;

    const glowStyle = (size, color) => ({
      fontSize: `${size}px`, fontFamily: 'Courier New', fontStyle: 'bold', color,
      shadow: { offsetX: 0, offsetY: 0, color, blur: 14, fill: true }
    });

    // Score — top-left
    this._scoreTxt = this.add.text(16, 16, 'SCORE 0', glowStyle(17, '#00f5ff')).setDepth(5);

    // Wave — top-center
    this._waveTxt = this.add.text(W / 2, 16, 'WAVE 1', glowStyle(17, '#ffffff'))
      .setOrigin(0.5, 0).setDepth(5);

    // Lives — top-right (icons drawn separately)
    this._lifesCont = this.add.container(W - 14, 14).setDepth(5);
    this._updateLivesUI();

    // Power-up bar — bottom-center
    this._powerBar   = this.add.graphics().setDepth(5);
    this._powerLabel = this.add.text(W / 2, H - 12, '', {
      fontSize: '12px', fontFamily: 'Courier New', color: '#ffdd00',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffdd00', blur: 8, fill: true }
    }).setOrigin(0.5, 1).setDepth(5);
  }

  _updateLivesUI() {
    this._lifesCont.removeAll(true);
    for (let i = 0; i < this.player.lives; i++) {
      const g = this.add.graphics();
      g.fillStyle(0x00f5ff, 0.9);
      g.fillTriangle(0, -9, -6, 7, 6, 7);
      g.lineStyle(1, 0x00f5ff, 0.6);
      g.strokeTriangle(0, -9, -6, 7, 6, 7);
      g.x = -(i * 20);
      this._lifesCont.add(g);
    }
  }

  // ─── PAUSE ──────────────────────────────────────────────────────────────────

  _buildPauseOverlay() {
    const { W, H } = window.VOIDSTRIKE;
    this._pauseOverlay = this.add.container(0, 0).setDepth(20).setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.78);
    bg.fillRect(0, 0, W, H);
    const txt = this.add.text(W / 2, H / 2 - 30, 'PAUSED', {
      fontSize: '44px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#00f5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f5ff', blur: 22, fill: true }
    }).setOrigin(0.5);
    const hint = this.add.text(W / 2, H / 2 + 30, 'Tap to resume', {
      fontSize: '18px', fontFamily: 'Courier New', color: '#556677'
    }).setOrigin(0.5);
    this._pauseOverlay.add([bg, txt, hint]);

    const pauseBtn = this.add.text(this.W - 14, 16, '[ II ]', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#334455'
    }).setOrigin(1, 0).setDepth(6).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this._togglePause());

    this._pauseOverlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, W, H),
      Phaser.Geom.Rectangle.Contains
    );
    this._pauseOverlay.on('pointerdown', () => this._togglePause());
  }

  _togglePause() {
    this._paused = !this._paused;
    this._pauseOverlay.setVisible(this._paused);
    this.physics.world.isPaused = this._paused;
  }

  // ─── INPUT ──────────────────────────────────────────────────────────────────

  _setupInput() {
    const { W } = window.VOIDSTRIKE;
    this._targetX = W / 2;
    this.input.on('pointermove', (ptr) => {
      if (!ptr.isDown) return;
      this._targetX = Phaser.Math.Clamp(ptr.worldX, 30, W - 30);
    });
    this.input.on('pointerdown', (ptr) => {
      this._targetX = Phaser.Math.Clamp(ptr.worldX, 30, W - 30);
    });
  }

  // ─── EVENTS ─────────────────────────────────────────────────────────────────

  _setupEvents() {
    this.events.on('enemyShoot', (enemy) => {
      if (!enemy.active) return;
      const b = this._ebulletPool.find(x => !x.active);
      if (!b) return;
      b.setActive(true).setVisible(true).setPosition(enemy.x, enemy.y + 20);
      b.body.reset(enemy.x, enemy.y + 20);
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      const spd = enemy.type === 'boss' ? 380 : 280;
      b.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
    });
  }

  // ─── WAVE SYSTEM ────────────────────────────────────────────────────────────

  _startWave() {
    this._waveActive = true;
    this._bossWave = this.wave % 5 === 0;
    window.audio.warp();
    this._showWarpEffect(() => {
      this._bossWave ? this._spawnBoss() : this._spawnFormation();
    });
  }

  _showWarpEffect(cb) {
    const { W, H } = window.VOIDSTRIKE;
    const warpGfx = this.add.graphics().setDepth(15);
    this.tweens.addCounter({
      from: 0, to: 1, duration: 650,
      onUpdate: (tw) => {
        const t = tw.getValue();
        warpGfx.clear();
        warpGfx.fillStyle(0x00f5ff, (1 - t) * 0.12);
        warpGfx.fillRect(0, 0, W, H);
        for (let i = 0; i < 28; i++) {
          const x = (i / 28) * W;
          const len = t * H * (0.4 + (i % 3) * 0.25);
          warpGfx.lineStyle(1, 0x00f5ff, (1 - t) * 0.6);
          warpGfx.beginPath();
          warpGfx.moveTo(x, 0);
          warpGfx.lineTo(x, len);
          warpGfx.strokePath();
        }
      },
      onComplete: () => { warpGfx.destroy(); cb(); }
    });
  }

  _spawnFormation() {
    const { W } = window.VOIDSTRIKE;
    const wave = this.wave;
    const formations = ['row', 'V', 'zigzag'];
    const formation = formations[(wave - 1) % formations.length];
    const count = Math.min(6 + wave, 14);
    const positions = this._getFormationPositions(formation, count, W);

    this._spawnComplete = false;
    positions.forEach((pos, i) => {
      this.time.delayedCall(i * 110, () => {
        const e = this._enemyPool.find(x => !x.active);
        if (!e) return;
        let type = 'drone';
        const r = Math.random();
        if (wave >= 3 && r < 0.25) type = 'bomber';
        else if (wave >= 2 && r < 0.5) type = 'tank';
        e.spawn(pos.x, pos.y - 80, type);
        if (i === positions.length - 1) this._spawnComplete = true;
      });
    });
  }

  _spawnBoss() {
    const { W } = window.VOIDSTRIKE;
    this._spawnComplete = false;
    this._showBossWarning(() => {
      const e = this._enemyPool.find(x => !x.active);
      if (!e) return;
      e.spawn(W / 2, -100, 'boss');
      this._spawnComplete = true;
    });
  }

  _showBossWarning(cb) {
    const { W, H } = window.VOIDSTRIKE;
    const txt = this.add.text(W / 2, H / 2, '⚠ BOSS INCOMING ⚠', {
      fontSize: '30px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#ff0000',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff0000', blur: 20, fill: true }
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({
      targets: txt, alpha: 1, duration: 280, yoyo: true, hold: 900,
      onComplete: () => { txt.destroy(); cb(); }
    });
  }

  _getFormationPositions(type, count, W) {
    const positions = [];
    if (type === 'row') {
      const spacing = (W - 80) / Math.max(count - 1, 1);
      for (let i = 0; i < count; i++)
        positions.push({ x: 40 + i * spacing, y: -20 - (i % 2) * 10 });
    } else if (type === 'V') {
      const half = Math.ceil(count / 2);
      for (let i = 0; i < half; i++)
        positions.push({ x: W / 2 - i * 52, y: -20 - i * 38 });
      for (let i = 1; i <= Math.floor(count / 2); i++)
        positions.push({ x: W / 2 + i * 52, y: -20 - i * 38 });
    } else {
      const spacing = (W - 80) / Math.max(count - 1, 1);
      for (let i = 0; i < count; i++)
        positions.push({ x: 40 + i * spacing, y: -20 - (i % 2 === 0 ? 0 : 48) });
    }
    return positions;
  }

  _checkWaveEnd() {
    if (!this._spawnComplete) return;
    const alive = this._enemyPool.filter(e => e.active).length;
    if (alive === 0 && this._waveActive) {
      this._waveActive = false;
      this._onWaveComplete();
    }
  }

  _onWaveComplete() {
    const bonus = this.wave * 500;
    this._addScore(bonus);
    const { W, H } = window.VOIDSTRIKE;

    const txt = this.add.text(W / 2, H / 2, `WAVE ${this.wave} COMPLETE\n+${bonus} BONUS`, {
      fontSize: '28px', fontFamily: 'Courier New', fontStyle: 'bold',
      color: '#00f5ff', align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f5ff', blur: 22, fill: true }
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    this.tweens.add({
      targets: txt, alpha: 1, scaleX: 1.06, scaleY: 1.06,
      duration: 380, yoyo: true, hold: 1100,
      onComplete: () => {
        txt.destroy();
        this.wave++;
        this._waveTxt.setText(`WAVE ${this.wave}`);
        this.time.delayedCall(600, () => this._startWave());
      }
    });
  }

  // ─── SHOOTING ───────────────────────────────────────────────────────────────

  _playerShoot() {
    window.audio.shoot();
    if (this.player.tripleShot) {
      this._fireBullet(this.player.x - 16, this.player.y - 20, -70, -880);
      this._fireBullet(this.player.x,      this.player.y - 32, 0,  -920);
      this._fireBullet(this.player.x + 16, this.player.y - 20, 70, -880);
    } else {
      this._fireBullet(this.player.x - 4, this.player.y - 30, -8, -920);
      this._fireBullet(this.player.x + 4, this.player.y - 30,  8, -920);
    }
  }

  _fireBullet(x, y, vx, vy) {
    const b = this._bulletPool.find(bl => !bl.active);
    if (!b) return;
    b.setActive(true).setVisible(true).setPosition(x, y);
    b.body.reset(x, y);
    b.setVelocity(vx, vy);
  }

  // ─── SCORE / COMBO ──────────────────────────────────────────────────────────

  _addScore(pts) {
    this.score += pts * this.player.scoreMultiplier;
    this._scoreTxt.setText(`SCORE ${this.score}`);
  }

  _onEnemyKilled(enemy, bx, by) {
    this.combo++;
    this.comboTimer = 1800;

    const base = enemy.getPoints();
    const multi = this.combo >= 4 ? 3 : this.combo >= 2 ? 2 : 1;
    const pts = base * multi * this.player.scoreMultiplier;
    this._addScore(pts);

    const label = multi > 1 ? `x${multi}  +${pts}` : `+${pts}`;
    this._floatText(bx, by, label, multi > 1 ? '#ffdd00' : '#ffffff');
    if (multi > 1) this._floatText(bx, by - 34, `COMBO x${this.combo}!`, '#ff00aa');

    const big = enemy.type === 'boss';
    this._explodeAt(bx, by, big ? 60 : 22, big);
    enemy.kill();

    if (Math.random() < 0.2) this._dropPowerup(bx, by);
  }

  _floatText(x, y, msg, color) {
    const txt = this.add.text(x, y, msg, {
      fontSize: '19px', fontFamily: 'Courier New', fontStyle: 'bold', color,
      shadow: { offsetX: 0, offsetY: 0, color, blur: 10, fill: true }
    }).setOrigin(0.5).setDepth(8);
    this.tweens.add({
      targets: txt, y: y - 75, alpha: 0, duration: 950,
      onComplete: () => txt.destroy()
    });
  }

  // ─── EXPLOSIONS ─────────────────────────────────────────────────────────────

  _explodeAt(x, y, count, big = false) {
    const colors = [0xff2200, 0xff6600, 0xffcc00, 0xffffff, 0xff44aa];

    // Particles
    for (let i = 0; i < count; i++) {
      const g = this.add.graphics().setDepth(7);
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      const angle = Math.random() * Math.PI * 2;
      const spd = (big ? 5 : 2.5) + Math.random() * (big ? 7 : 3.5);
      const size = (big ? 4 : 2) + Math.random() * (big ? 5 : 3);
      const life = (big ? 1.0 : 0.65) * (0.7 + Math.random() * 0.6);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;

      g.fillStyle(color, 1);
      g.fillCircle(0, 0, size);
      g.setPosition(x, y);

      this.tweens.add({
        targets: g, alpha: 0, duration: life * 1000,
        onUpdate: () => { g.x += vx; g.y += vy; },
        onComplete: () => g.destroy()
      });
    }

    // Shockwave ring — the star of the show
    const ring = this.add.graphics().setDepth(7);
    const ringColor = big ? 0xaa00ff : 0xff6600;
    const maxR = big ? 110 : 55;
    this.tweens.addCounter({
      from: 0, to: 1, duration: big ? 420 : 280,
      onUpdate: (tw) => {
        const t = tw.getValue();
        ring.clear();
        const r = maxR * t;
        const a = (1 - t) * (big ? 0.9 : 0.75);
        ring.lineStyle(big ? 5 : 3, ringColor, a);
        ring.strokeCircle(x, y, r);
        // Second inner ring
        ring.lineStyle(big ? 3 : 2, 0xffffff, a * 0.5);
        ring.strokeCircle(x, y, r * 0.55);
      },
      onComplete: () => ring.destroy()
    });

    // Flash
    const flash = this.add.graphics().setDepth(7);
    flash.fillStyle(0xffffff, big ? 0.95 : 0.85);
    flash.fillCircle(x, y, big ? 70 : 35);
    this.tweens.add({
      targets: flash, alpha: 0, scaleX: big ? 3.5 : 2.2, scaleY: big ? 3.5 : 2.2,
      duration: 200, onComplete: () => flash.destroy()
    });
  }

  _dropPowerup(x, y) {
    const p = this._powerupPool.find(pw => !pw.active);
    if (!p) return;
    p.spawn(x, y);
  }

  // ─── COLLISION ──────────────────────────────────────────────────────────────

  _bodyRect(obj) {
    const b = obj.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  _checkCollisions() {
    const player = this.player;
    const playerRect = this._bodyRect(player);

    const activeBullets  = this._bulletPool.filter(b => b.active);
    const activeEBullets = this._ebulletPool.filter(b => b.active);
    const activeEnemies  = this._enemyPool.filter(e => e.active);
    const activePowerups = this._powerupPool.filter(p => p.active);

    for (const bullet of activeBullets) {
      for (const enemy of activeEnemies) {
        if (!enemy.active) continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), this._bodyRect(enemy))) {
          bullet._kill();
          if (enemy.hit()) this._onEnemyKilled(enemy, enemy.x, enemy.y);
        }
      }
    }

    if (!player.invincible) {
      for (const eb of activeEBullets) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(eb.getBounds(), playerRect)) {
          eb._kill();
          player.takeDamage();
          this.cameras.main.shake(200, 0.018);
          this._updateLivesUI();
          if (player.lives <= 0) { this._gameOver(); return; }
          break;
        }
      }

      for (const enemy of activeEnemies) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this._bodyRect(enemy), playerRect)) {
          enemy.kill();
          player.takeDamage();
          this.cameras.main.shake(260, 0.024);
          this._updateLivesUI();
          if (player.lives <= 0) { this._gameOver(); return; }
        }
      }
    }

    for (const pw of activePowerups) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(this._bodyRect(pw), playerRect)) {
        pw.apply(player);
      }
    }
  }

  // ─── POWER BAR ──────────────────────────────────────────────────────────────

  _updatePowerBar() {
    this._powerBar.clear();
    this._powerLabel.setText('');
    const { W, H } = window.VOIDSTRIKE;

    const statuses = [];
    if (this.player.tripleShot)         statuses.push({ label: 'TRIPLE', color: 0x00f5ff });
    if (this.player.shield)             statuses.push({ label: 'SHIELD', color: 0x00ff88 });
    if (this.player.scoreMultiplier > 1) statuses.push({ label: 'x2 PTS', color: 0xffdd00 });

    statuses.forEach((s, i) => {
      const bx = W / 2 + (i - statuses.length / 2 + 0.5) * 112;
      const by = H - 14;
      this._powerBar.fillStyle(s.color, 0.15);
      this._powerBar.fillRect(bx - 44, by - 13, 88, 20);
      this._powerBar.lineStyle(1.5, s.color, 0.8);
      this._powerBar.strokeRect(bx - 44, by - 13, 88, 20);
    });

    if (statuses.length > 0)
      this._powerLabel.setText(statuses.map(s => s.label).join('  ·  '));
  }

  // ─── GAME OVER ──────────────────────────────────────────────────────────────

  _gameOver() {
    const hs = parseInt(localStorage.getItem('voidstrike_hs') || '0');
    if (this.score > hs) localStorage.setItem('voidstrike_hs', this.score);
    this.time.delayedCall(600, () => {
      this.scene.start('GameOverScene', { score: this.score, wave: this.wave });
    });
  }

  // ─── UPDATE ─────────────────────────────────────────────────────────────────

  update(time, delta) {
    if (this._paused) return;

    this._updateBackground(delta);
    this._drawRetroGrid(delta);

    // Smooth player movement
    const dx = this._targetX - this.player.x;
    if (Math.abs(dx) > 2) this.player.x += dx * 0.18;
    this.player.update(time, delta);

    // Auto-shoot
    this._shootTimer -= delta;
    if (this._shootTimer <= 0) {
      this._shootTimer = 350;
      this._playerShoot();
    }

    for (const e of this._enemyPool) { if (e.active) e.update(time, delta); }
    for (const p of this._powerupPool) { if (p.active) p.update(time, delta); }

    for (const b of this._bulletPool) {
      if (b.active && (b.y < -20 || b.y > this.H + 20)) b._kill();
    }
    for (const b of this._ebulletPool) {
      if (b.active && (b.y < -20 || b.y > this.H + 20 || b.x < -20 || b.x > this.W + 20)) b._kill();
    }

    this._checkCollisions();
    this._updatePowerBar();

    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    if (this._waveActive) this._checkWaveEnd();
  }
}
