class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalWave  = data.wave  || 1;
  }

  create() {
    const { W, H } = window.VOIDSTRIKE;
    this._gridTime = 0;
    this._gridHorizon = H * 0.72;

    const hs = parseInt(localStorage.getItem('voidstrike_hs') || '0');
    const isNew = this.finalScore >= hs && this.finalScore > 0;

    // Gradient background
    const bg = this.add.graphics().setDepth(-20);
    bg.fillGradientStyle(0x04040e, 0x04040e, 0x130722, 0x100620, 1);
    bg.fillRect(0, 0, W, H);

    // Nebula
    const neb = this.add.graphics().setDepth(-18);
    neb.fillStyle(0x2a0030, 0.45); neb.fillCircle(W * 0.3, H * 0.2, 110);
    neb.fillStyle(0x001035, 0.35); neb.fillCircle(W * 0.75, H * 0.4, 80);

    this._starGfx = this.add.graphics().setDepth(-16);
    this._stars = Array.from({ length: 80 }, () => ({
      x: Phaser.Math.Between(0, W), y: Phaser.Math.Between(0, H),
      s: Math.random() * 1.5 + 0.3, v: Math.random() * 0.4 + 0.1,
      bright: Math.random()
    }));

    this._gridGfx = this.add.graphics().setDepth(-14);

    // GAME OVER
    this._goTxt = this.add.text(W / 2, H * 0.20, 'GAME OVER', {
      fontSize: '50px', fontFamily: 'Courier New', fontStyle: 'bold',
      color: '#ff00aa',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff00aa', blur: 32, fill: true }
    }).setOrigin(0.5).setAlpha(0).setDepth(2);
    this.tweens.add({ targets: this._goTxt, alpha: 1, duration: 500 });

    // Score block
    this.time.delayedCall(280, () => {
      this.add.text(W / 2, H * 0.34, 'SCORE', {
        fontSize: '13px', fontFamily: 'Courier New', color: '#445566', letterSpacing: 6
      }).setOrigin(0.5).setDepth(2);

      const scoreTxt = this.add.text(W / 2, H * 0.34 + 28, `${this.finalScore}`, {
        fontSize: '36px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#00f5ff',
        shadow: { offsetX: 0, offsetY: 0, color: '#00f5ff', blur: 18, fill: true }
      }).setOrigin(0.5).setAlpha(0).setDepth(2);
      this.tweens.add({ targets: scoreTxt, alpha: 1, duration: 400 });
    });

    this.time.delayedCall(500, () => {
      this.add.text(W / 2, H * 0.49, `WAVES SURVIVED: ${this.finalWave}`, {
        fontSize: '16px', fontFamily: 'Courier New', color: '#556677'
      }).setOrigin(0.5).setDepth(2);

      this.add.text(W / 2, H * 0.55, `BEST: ${Math.max(hs, this.finalScore)}`, {
        fontSize: '19px', fontFamily: 'Courier New',
        color: isNew ? '#ffdd00' : '#445566',
        shadow: isNew ? { offsetX: 0, offsetY: 0, color: '#ffdd00', blur: 12, fill: true } : {}
      }).setOrigin(0.5).setDepth(2);

      if (isNew) {
        this.add.text(W / 2, H * 0.61, '★  NEW RECORD  ★', {
          fontSize: '15px', fontFamily: 'Courier New', color: '#ffdd00', letterSpacing: 4,
          shadow: { offsetX: 0, offsetY: 0, color: '#ffdd00', blur: 16, fill: true }
        }).setOrigin(0.5).setDepth(2);
      }
    });

    // Buttons
    this.time.delayedCall(850, () => {
      // Play Again
      const btn1 = this.add.graphics().setDepth(2);
      const draw1 = (h) => {
        btn1.clear();
        btn1.fillStyle(h ? 0x00f5ff : 0xff00aa, 1);
        btn1.fillRoundedRect(W / 2 - 112, H * 0.72 - 28, 224, 56, 6);
        if (!h) { btn1.lineStyle(2, 0xff66cc, 0.5); btn1.strokeRoundedRect(W / 2 - 112, H * 0.72 - 28, 224, 56, 6); }
      };
      draw1(false);
      this.add.text(W / 2, H * 0.72, 'PLAY AGAIN', {
        fontSize: '26px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#0a0a0f'
      }).setOrigin(0.5).setDepth(3);
      const z1 = this.add.zone(W / 2, H * 0.72, 224, 56).setInteractive({ useHandCursor: true }).setDepth(4);
      z1.on('pointerover', () => draw1(true));
      z1.on('pointerout',  () => draw1(false));
      z1.on('pointerdown', () => {
        window.audio.menuSelect();
        this.cameras.main.flash(220, 0, 245, 255);
        this.time.delayedCall(260, () => this.scene.start('GameScene'));
      });

      // Main Menu
      const btn2 = this.add.graphics().setDepth(2);
      const draw2 = (h) => {
        btn2.clear();
        btn2.lineStyle(1.5, h ? 0x00f5ff : 0x334455, 1);
        btn2.strokeRoundedRect(W / 2 - 90, H * 0.83 - 20, 180, 40, 5);
      };
      draw2(false);
      this.add.text(W / 2, H * 0.83, 'MAIN MENU', {
        fontSize: '17px', fontFamily: 'Courier New', color: '#445566'
      }).setOrigin(0.5).setDepth(3);
      const z2 = this.add.zone(W / 2, H * 0.83, 180, 40).setInteractive({ useHandCursor: true }).setDepth(4);
      z2.on('pointerover', () => draw2(true));
      z2.on('pointerout',  () => draw2(false));
      z2.on('pointerdown', () => { window.audio.menuSelect(); this.scene.start('MenuScene'); });
    });

    this._startGlitch();
  }

  _startGlitch() {
    this.time.addEvent({
      delay: 1900, loop: true,
      callback: () => {
        if (!this._goTxt) return;
        const ox = this._goTxt.x;
        const seq = [6, -6, 3, 0];
        let i = 0;
        const step = () => {
          if (i >= seq.length) { this._goTxt.x = ox; this._goTxt.setStyle({ color: '#ff00aa' }); return; }
          this._goTxt.x = ox + seq[i];
          this._goTxt.setStyle({ color: i % 2 === 0 ? '#ff00aa' : '#00f5ff' });
          i++;
          this.time.delayedCall(36, step);
        };
        step();
      }
    });
  }

  _drawRetroGrid(delta) {
    const { W, H } = window.VOIDSTRIKE;
    const g = this._gridGfx;
    g.clear();
    this._gridTime = (this._gridTime + delta) % 99999;

    const scroll = (this._gridTime / 700) % 1;
    const hy = this._gridHorizon;
    const bot = H + 10;
    const span = bot - hy;

    for (let i = 0; i < 13; i++) {
      const t = ((i / 12) + scroll) % 1;
      const y = hy + span * Math.pow(t, 2.2);
      if (y < hy || y > bot) continue;
      g.lineStyle(1 + t * 0.7, 0xff00aa, Math.pow(t, 0.6) * 0.4);
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath();
    }
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const edge = 1 - Math.abs(t - 0.5) * 0.55;
      g.lineStyle(1, 0xff00aa, 0.22 * edge);
      g.beginPath(); g.moveTo(W / 2, hy); g.lineTo(t * W, bot); g.strokePath();
    }
    g.lineStyle(8, 0xff00aa, 0.08);
    g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.strokePath();
    g.lineStyle(2, 0xff00aa, 0.65);
    g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.strokePath();

    const sr = 18 + Math.sin(this._gridTime / 600) * 2;
    g.fillStyle(0xff00aa, 0.06); g.fillCircle(W / 2, hy, sr * 3);
    g.fillStyle(0xff66cc, 0.28); g.fillCircle(W / 2, hy, sr);
    g.fillStyle(0xffffff, 0.70); g.fillCircle(W / 2, hy, sr * 0.3);
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
