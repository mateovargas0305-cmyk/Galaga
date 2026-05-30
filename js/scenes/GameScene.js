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

    this._buildBackground();
    this._buildPools();
    this._buildPlayer();
    this._buildUI();
    this._buildPauseOverlay();
    this._setupInput();
    this._setupCollisions();
    this._setupEvents();

    this.time.delayedCall(800, () => this._startWave());
  }

  _buildBackground() {
    this._bgGfx = this.add.graphics();
    this._stars1 = Array.from({ length: 60 }, () => ({
      x: Phaser.Math.Between(0, this.W),
      y: Phaser.Math.Between(0, this.H),
      s: Math.random() + 0.3
    }));
    this._stars2 = Array.from({ length: 30 }, () => ({
      x: Phaser.Math.Between(0, this.W),
      y: Phaser.Math.Between(0, this.H),
      s: Math.random() * 1.5 + 0.8
    }));
  }

  _updateBackground(delta) {
    this._bgGfx.clear();
    // Layer 1: slow
    for (const s of this._stars1) {
      s.y += 0.5 * (delta / 16);
      if (s.y > this.H) { s.y = 0; s.x = Phaser.Math.Between(0, this.W); }
      this._bgGfx.fillStyle(0xffffff, 0.3 + s.s * 0.15);
      this._bgGfx.fillRect(s.x, s.y, s.s, s.s);
    }
    // Layer 2: faster, brighter
    for (const s of this._stars2) {
      s.y += 1.4 * (delta / 16);
      if (s.y > this.H) { s.y = 0; s.x = Phaser.Math.Between(0, this.W); }
      this._bgGfx.fillStyle(0xaaccff, 0.5 + s.s * 0.1);
      this._bgGfx.fillRect(s.x, s.y, s.s * 0.8, s.s * 1.4);
    }
  }

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
    b._kill = () => {
      b.setActive(false).setVisible(false);
      b.body.reset(0, -100);
    };
    return b;
  }

  _buildPlayer() {
    this.player = new Player(this);
    this.player.body.setCollideWorldBounds(true);
  }

  _buildUI() {
    const { W } = window.VOIDSTRIKE;
    const style = (size, color) => ({
      fontSize: `${size}px`, fontFamily: 'Courier New', color,
      shadow: { offsetX: 0, offsetY: 0, color, blur: 10, fill: true }
    });

    this._scoreTxt  = this.add.text(16, 14, 'SCORE 0',      style(18, '#00f5ff')).setDepth(5);
    this._waveTxt   = this.add.text(W / 2, 14, 'WAVE 1',    style(18, '#ffffff')).setOrigin(0.5, 0).setDepth(5);
    this._lifesCont = this.add.container(W - 16, 14).setDepth(5);

    this._powerBar  = this.add.graphics().setDepth(5);
    this._powerLabel = this.add.text(W / 2, this.H - 18, '', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#ffdd00'
    }).setOrigin(0.5, 1).setDepth(5);

    this._updateLivesUI();
  }

  _updateLivesUI() {
    this._lifesCont.removeAll(true);
    for (let i = 0; i < this.player.lives; i++) {
      const g = this.add.graphics();
      g.fillStyle(0x00f5ff, 0.9);
      g.fillTriangle(0, -8, -6, 6, 6, 6);
      g.x = -(i * 22);
      this._lifesCont.add(g);
    }
  }

  _buildPauseOverlay() {
    const { W, H } = window.VOIDSTRIKE;
    this._pauseOverlay = this.add.container(0, 0).setDepth(20).setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(0, 0, W, H);
    const txt = this.add.text(W / 2, H / 2, 'PAUSED', {
      fontSize: '42px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#00f5ff'
    }).setOrigin(0.5);
    const hint = this.add.text(W / 2, H / 2 + 60, 'Tap to resume', {
      fontSize: '18px', fontFamily: 'Courier New', color: '#888888'
    }).setOrigin(0.5);
    this._pauseOverlay.add([bg, txt, hint]);

    // Pause button
    const pauseBtn = this.add.text(this.W - 16, 14, '[ II ]', {
      fontSize: '14px', fontFamily: 'Courier New', color: '#446688'
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

  _setupInput() {
    const { W, H } = window.VOIDSTRIKE;
    this._targetX = W / 2;
    this.input.on('pointermove', (ptr) => {
      if (!ptr.isDown) return;
      this._targetX = Phaser.Math.Clamp(ptr.worldX, 30, W - 30);
    });
    this.input.on('pointerdown', (ptr) => {
      this._targetX = Phaser.Math.Clamp(ptr.worldX, 30, W - 30);
    });
  }

  _setupCollisions() {
    // handled manually in update for pool-based objects
  }

  _setupEvents() {
    this.events.on('enemyShoot', (enemy) => {
      if (!enemy.active) return;
      const b = this._ebulletPool.find(x => !x.active);
      if (!b) return;
      b.setActive(true).setVisible(true).setPosition(enemy.x, enemy.y + 20);
      b.body.reset(enemy.x, enemy.y + 20);
      // Aim at player
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
    let t = 0;
    const tween = this.tweens.addCounter({
      from: 0, to: 1, duration: 700,
      onUpdate: (tw) => {
        t = tw.getValue();
        warpGfx.clear();
        warpGfx.fillStyle(0x00f5ff, (1 - t) * 0.15);
        warpGfx.fillRect(0, 0, W, H);
        // Streaks
        for (let i = 0; i < 30; i++) {
          const x = (i / 30) * W;
          const len = t * H * (0.5 + Math.random() * 0.5);
          warpGfx.lineStyle(1, 0x00f5ff, (1 - t) * 0.7);
          warpGfx.beginPath();
          warpGfx.moveTo(x, 0);
          warpGfx.lineTo(x, len);
          warpGfx.strokePath();
        }
      },
      onComplete: () => {
        warpGfx.destroy();
        cb();
      }
    });
  }

  _spawnFormation() {
    const { W } = window.VOIDSTRIKE;
    const wave = this.wave;
    const formations = ['row', 'V', 'zigzag'];
    const formation = formations[(wave - 1) % formations.length];
    const count = Math.min(6 + wave, 14);
    const hasExtra = wave > 3;
    const positions = this._getFormationPositions(formation, count, W);

    this._spawnComplete = false;
    positions.forEach((pos, i) => {
      this.time.delayedCall(i * 120, () => {
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
      fontSize: '32px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#ff0000'
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({
      targets: txt, alpha: 1, duration: 300, yoyo: true, hold: 900,
      onComplete: () => { txt.destroy(); cb(); }
    });
  }

  _getFormationPositions(type, count, W) {
    const positions = [];
    if (type === 'row') {
      const spacing = (W - 80) / (count - 1);
      for (let i = 0; i < count; i++)
        positions.push({ x: 40 + i * spacing, y: -20 - (i % 2) * 10 });
    } else if (type === 'V') {
      const half = Math.ceil(count / 2);
      for (let i = 0; i < half; i++)   positions.push({ x: W / 2 - i * 55, y: -20 - i * 40 });
      for (let i = 1; i < Math.floor(count / 2) + 1; i++) positions.push({ x: W / 2 + i * 55, y: -20 - i * 40 });
    } else {
      const spacing = (W - 80) / (count - 1);
      for (let i = 0; i < count; i++)
        positions.push({ x: 40 + i * spacing, y: -20 - (i % 2 === 0 ? 0 : 50) });
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
      fontSize: '30px', fontFamily: 'Courier New', fontStyle: 'bold',
      color: '#00f5ff', align: 'center',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f5ff', blur: 20, fill: true }
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    this.tweens.add({
      targets: txt, alpha: 1, scaleX: 1.1, scaleY: 1.1,
      duration: 400, yoyo: true, hold: 1000,
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
      this._fireBullet(this.player.x - 16, this.player.y - 20, -60, -900);
      this._fireBullet(this.player.x,      this.player.y - 30, 0,   -900);
      this._fireBullet(this.player.x + 16, this.player.y - 20, 60,  -900);
    } else {
      this._fireBullet(this.player.x, this.player.y - 30, 0, -900);
    }
  }

  _fireBullet(x, y, vx, vy) {
    const b = this._bulletPool.find(bl => !bl.active);
    if (!b) return;
    b.setActive(true).setVisible(true).setPosition(x, y);
    b.body.reset(x, y);
    b.setVelocity(vx, vy);
  }

  // ─── SCORE & COMBO ──────────────────────────────────────────────────────────

  _addScore(pts) {
    this.score += pts * this.player.scoreMultiplier;
    this._scoreTxt.setText(`SCORE ${this.score}`);
  }

  _onEnemyKilled(enemy, bx, by) {
    this.combo++;
    this.comboTimer = 1800;

    const base = enemy.getPoints();
    const multiplier = this.combo >= 4 ? 3 : this.combo >= 2 ? 2 : 1;
    const pts = base * multiplier * this.player.scoreMultiplier;
    this._addScore(pts);

    const label = multiplier > 1 ? `x${multiplier} ${pts}` : `+${pts}`;
    this._floatText(bx, by, label, multiplier > 1 ? '#ffdd00' : '#ffffff');

    if (multiplier > 1) this._floatText(bx, by - 30, `COMBO x${this.combo}!`, '#ff00aa');

    this._explodeAt(bx, by, enemy.type === 'boss' ? 60 : 20, enemy.type === 'boss');
    enemy.kill();

    // Power-up drop
    if (Math.random() < 0.2) this._dropPowerup(bx, by);
  }

  _floatText(x, y, msg, color) {
    const txt = this.add.text(x, y, msg, {
      fontSize: '18px', fontFamily: 'Courier New', fontStyle: 'bold', color
    }).setOrigin(0.5).setDepth(8);
    this.tweens.add({
      targets: txt, y: y - 70, alpha: 0, duration: 900,
      onComplete: () => txt.destroy()
    });
  }

  _explodeAt(x, y, count, big = false) {
    const colors = [0xff2200, 0xff6600, 0xffcc00, 0xffffff];
    for (let i = 0; i < count; i++) {
      const g = this.add.graphics().setDepth(7);
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      const angle = Math.random() * Math.PI * 2;
      const speed = (big ? 5 : 2.5) + Math.random() * (big ? 6 : 3);
      const size  = (big ? 4 : 2) + Math.random() * (big ? 5 : 3);
      let cx = x, cy = y, life = big ? 0.9 : 0.6;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      g.fillStyle(color, 1);
      g.fillCircle(0, 0, size);
      g.setPosition(cx, cy);

      this.tweens.add({
        targets: g, alpha: 0, duration: life * 1000,
        onUpdate: () => { g.x += vx; g.y += vy; },
        onComplete: () => g.destroy()
      });
    }

    // Flash at impact
    const flash = this.add.graphics().setDepth(7);
    flash.fillStyle(0xffffff, 0.9);
    flash.fillCircle(0, 0, big ? 60 : 30);
    flash.setPosition(x, y);
    this.tweens.add({
      targets: flash, alpha: 0, scaleX: big ? 3 : 2, scaleY: big ? 3 : 2,
      duration: 180, onComplete: () => flash.destroy()
    });
  }

  _dropPowerup(x, y) {
    const p = this._powerupPool.find(pw => !pw.active);
    if (!p) return;
    p.spawn(x, y);
  }

  // ─── COLLISIONS (manual) ───────────────────────────────────────────────────

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

    // Player bullets vs enemies
    for (const bullet of activeBullets) {
      for (const enemy of activeEnemies) {
        if (!enemy.active) continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(bullet.getBounds(), this._bodyRect(enemy))) {
          bullet._kill();
          const killed = enemy.hit();
          if (killed) {
            this._onEnemyKilled(enemy, enemy.x, enemy.y);
          }
        }
      }
    }

    // Enemy bullets vs player
    if (!player.invincible) {
      for (const eb of activeEBullets) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(eb.getBounds(), playerRect)) {
          eb._kill();
          player.takeDamage();
          this.cameras.main.shake(180, 0.016);
          this._updateLivesUI();
          if (player.lives <= 0) {
            this._gameOver();
            return;
          }
          break;
        }
      }
    }

    // Enemies reaching player (ram)
    for (const enemy of activeEnemies) {
      if (!player.invincible &&
          Phaser.Geom.Intersects.RectangleToRectangle(this._bodyRect(enemy), playerRect)) {
        enemy.kill();
        player.takeDamage();
        this.cameras.main.shake(240, 0.022);
        this._updateLivesUI();
        if (player.lives <= 0) { this._gameOver(); return; }
      }
    }

    // Powerups vs player
    for (const pw of activePowerups) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(this._bodyRect(pw), playerRect)) {
        pw.apply(player);
      }
    }
  }

  // ─── POWER-UP BAR ──────────────────────────────────────────────────────────

  _updatePowerBar() {
    this._powerBar.clear();
    this._powerLabel.setText('');
    const { W, H } = window.VOIDSTRIKE;

    const statuses = [];
    if (this.player.tripleShot)        statuses.push({ label: 'TRIPLE', color: 0x00f5ff });
    if (this.player.shield)            statuses.push({ label: 'SHIELD', color: 0x00ff88 });
    if (this.player.scoreMultiplier>1) statuses.push({ label: 'x2 PTS', color: 0xffdd00 });

    statuses.forEach((s, i) => {
      const bx = W / 2 + (i - statuses.length / 2 + 0.5) * 110;
      const by = H - 16;
      this._powerBar.lineStyle(2, s.color, 1);
      this._powerBar.strokeRect(bx - 44, by - 14, 88, 20);
      this._powerBar.fillStyle(s.color, 0.2);
      this._powerBar.fillRect(bx - 44, by - 14, 88, 20);
    });

    if (statuses.length > 0) {
      this._powerLabel.setText(statuses.map(s => s.label).join('  '));
    }
  }

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

    // Move player toward target
    const dx = this._targetX - this.player.x;
    if (Math.abs(dx) > 2) this.player.x += dx * 0.18;

    this.player.update(time, delta);

    // Auto-shoot
    this._shootTimer -= delta;
    if (this._shootTimer <= 0) {
      this._shootTimer = 350;
      this._playerShoot();
    }

    // Update active enemies
    for (const e of this._enemyPool) {
      if (e.active) e.update(time, delta);
    }

    // Update active powerups
    for (const p of this._powerupPool) {
      if (p.active) p.update(time, delta);
    }

    // Bullet out of bounds
    for (const b of this._bulletPool) {
      if (b.active && (b.y < -20 || b.y > this.H + 20)) b._kill();
    }
    for (const b of this._ebulletPool) {
      if (b.active && (b.y < -20 || b.y > this.H + 20 || b.x < -20 || b.x > this.W + 20)) b._kill();
    }

    this._checkCollisions();
    this._updatePowerBar();

    // Combo decay
    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    if (this._waveActive) this._checkWaveEnd();
  }
}
