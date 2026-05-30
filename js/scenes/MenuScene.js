class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { W, H } = window.VOIDSTRIKE;
    this._gridTime = 0;
    this._gridHorizon = H * 0.62;

    this._buildBackground();
    this._buildRetroGrid();
    this._buildUI(W, H);
    this._startGlitch();
  }

  _buildBackground() {
    const { W, H } = window.VOIDSTRIKE;

    // Gradient background
    const bg = this.add.graphics().setDepth(-20);
    bg.fillGradientStyle(0x04040e, 0x04040e, 0x130722, 0x100620, 1);
    bg.fillRect(0, 0, W, H);

    // Nebula
    const neb = this.add.graphics().setDepth(-18);
    neb.fillStyle(0x1a0050, 0.5); neb.fillCircle(W * 0.2, H * 0.25, 120);
    neb.fillStyle(0x001040, 0.4); neb.fillCircle(W * 0.82, H * 0.35, 90);
    neb.fillStyle(0x0e0035, 0.3); neb.fillCircle(W * 0.5, H * 0.12, 150);

    // Starfield
    this._starGfx = this.add.graphics().setDepth(-16);
    this._stars = Array.from({ length: 90 }, () => ({
      x: Phaser.Math.Between(0, W),
      y: Phaser.Math.Between(0, H),
      s: Math.random() * 1.5 + 0.3,
      v: Math.random() * 0.4 + 0.1,
      bright: Math.random()
    }));

    this._gridGfx = this.add.graphics().setDepth(-14);
  }

  _buildRetroGrid() { /* called in create, drawn in update */ }

  _drawRetroGrid(delta) {
    const { W, H } = window.VOIDSTRIKE;
    const g = this._gridGfx;
    g.clear();
    this._gridTime = (this._gridTime + delta) % 99999;

    const scroll = (this._gridTime / 700) % 1;
    const hy = this._gridHorizon;
    const bot = H + 10;
    const span = bot - hy;
    const numH = 12;

    for (let i = 0; i < numH + 1; i++) {
      const t = ((i / numH) + scroll) % 1;
      const y = hy + span * Math.pow(t, 2.2);
      if (y < hy || y > bot) continue;
      const a = Math.pow(t, 0.6) * 0.45;
      g.lineStyle(1 + t * 0.7, 0xff00aa, a);
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath();
    }

    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const xBot = t * W;
      const edge = 1 - Math.abs(t - 0.5) * 0.55;
      g.lineStyle(1, 0xff00aa, 0.24 * edge);
      g.beginPath(); g.moveTo(W / 2, hy); g.lineTo(xBot, bot); g.strokePath();
    }

    // Horizon glow
    g.lineStyle(8, 0xff00aa, 0.09);
    g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.strokePath();
    g.lineStyle(2, 0xff00aa, 0.7);
    g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.strokePath();
    g.lineStyle(1, 0xffffff, 0.45);
    g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.strokePath();

    // Sun
    const sr = 20 + Math.sin(this._gridTime / 600) * 2;
    g.fillStyle(0xff00aa, 0.06); g.fillCircle(W / 2, hy, sr * 3.2);
    g.fillStyle(0xff00aa, 0.13); g.fillCircle(W / 2, hy, sr * 1.7);
    g.fillStyle(0xff66cc, 0.32); g.fillCircle(W / 2, hy, sr);
    g.fillStyle(0xffffff, 0.75); g.fillCircle(W / 2, hy, sr * 0.35);
  }

  _buildUI(W, H) {
    // Title
    this._titleText = this.add.text(W / 2, H * 0.22, 'VOIDSTRIKE', {
      fontSize: '60px', fontFamily: 'Courier New', fontStyle: 'bold',
      color: '#00f5ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f5ff', blur: 28, fill: true }
    }).setOrigin(0.5).setDepth(2);

    this._subtitle = this.add.text(W / 2, H * 0.22 + 70, 'DEFEND THE VOID', {
      fontSize: '15px', fontFamily: 'Courier New', color: '#ff00aa', letterSpacing: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff00aa', blur: 10, fill: true }
    }).setOrigin(0.5).setDepth(2);

    // High score
    const hs = localStorage.getItem('voidstrike_hs') || 0;
    this.add.text(W / 2, H * 0.44, `HIGH SCORE`, {
      fontSize: '13px', fontFamily: 'Courier New', color: '#445566', letterSpacing: 4
    }).setOrigin(0.5).setDepth(2);
    this.add.text(W / 2, H * 0.44 + 24, `${hs}`, {
      fontSize: '26px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#ffdd00',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffdd00', blur: 12, fill: true }
    }).setOrigin(0.5).setDepth(2);

    // Play button
    const btnBg = this.add.graphics().setDepth(2);
    this._drawBtn(btnBg, false);
    const btnText = this.add.text(W / 2, H * 0.57, 'PLAY', {
      fontSize: '30px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#0a0a0f'
    }).setOrigin(0.5).setDepth(3);

    const btnZone = this.add.zone(W / 2, H * 0.57, 210, 64).setInteractive({ useHandCursor: true }).setDepth(4);
    btnZone.on('pointerover', () => { this._drawBtn(btnBg, true); });
    btnZone.on('pointerout',  () => { this._drawBtn(btnBg, false); });
    btnZone.on('pointerdown', () => {
      window.audio.menuSelect();
      this.cameras.main.flash(220, 0, 245, 255);
      this.time.delayedCall(300, () => this.scene.start('GameScene'));
    });

    // Controls
    this.add.text(W / 2, H * 0.73, 'DRAG · TOUCH · MOUSE  —  AUTO FIRE', {
      fontSize: '12px', fontFamily: 'Courier New', color: '#334455', letterSpacing: 2
    }).setOrigin(0.5).setDepth(2);

    // Version / attribution
    this.add.text(W / 2, H - 20, 'VOIDSTRIKE v1.0', {
      fontSize: '11px', fontFamily: 'Courier New', color: '#1a2233'
    }).setOrigin(0.5).setDepth(2);
  }

  _drawBtn(g, hover) {
    const { W, H } = window.VOIDSTRIKE;
    g.clear();
    if (hover) {
      g.fillStyle(0x00f5ff, 1);
      g.fillRoundedRect(W / 2 - 105, H * 0.57 - 32, 210, 64, 6);
    } else {
      g.fillStyle(0xff00aa, 1);
      g.fillRoundedRect(W / 2 - 105, H * 0.57 - 32, 210, 64, 6);
      g.lineStyle(2, 0xff66cc, 0.5);
      g.strokeRoundedRect(W / 2 - 105, H * 0.57 - 32, 210, 64, 6);
    }
  }

  _startGlitch() {
    this.time.addEvent({
      delay: 2400,
      loop: true,
      callback: () => {
        if (!this._titleText) return;
        const ox = this._titleText.x;
        const seq = [5, -5, 2, -2, 0];
        let i = 0;
        const step = () => {
          if (i >= seq.length) { this._titleText.x = ox; this._titleText.setStyle({ color: '#00f5ff' }); return; }
          this._titleText.x = ox + seq[i];
          this._titleText.setStyle({ color: i % 2 === 0 ? '#ff00aa' : '#00f5ff' });
          i++;
          this.time.delayedCall(38, step);
        };
        step();
      }
    });
  }

  update(time, delta) {
    const { W, H } = window.VOIDSTRIKE;
    this._starGfx.clear();
    for (const s of this._stars) {
      s.y += s.v * (delta / 16);
      if (s.y > H) { s.y = 0; s.x = Phaser.Math.Between(0, W); }
      this._starGfx.fillStyle(0xffffff, 0.3 + s.bright * 0.4);
      this._starGfx.fillRect(s.x, s.y, s.s, s.s);
    }
    this._drawRetroGrid(delta);
  }
}
