class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalWave  = data.wave  || 1;
  }

  create() {
    const { W, H } = window.VOIDSTRIKE;
    const hs = parseInt(localStorage.getItem('voidstrike_hs') || '0');
    const isNew = this.finalScore >= hs;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0f, 1);
    bg.fillRect(0, 0, W, H);

    // Stars
    this._stars = Array.from({ length: 60 }, () => ({
      x: Phaser.Math.Between(0, W), y: Phaser.Math.Between(0, H),
      s: Math.random() + 0.3, v: Math.random() * 0.5 + 0.1
    }));
    this._starGfx = this.add.graphics();

    // GAME OVER text with glitch anim
    this._goTxt = this.add.text(W / 2, H * 0.22, 'GAME OVER', {
      fontSize: '52px', fontFamily: 'Courier New', fontStyle: 'bold',
      color: '#ff00aa',
      shadow: { offsetX: 0, offsetY: 0, color: '#ff00aa', blur: 30, fill: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: this._goTxt, alpha: 1, duration: 500 });

    // Score
    this.time.delayedCall(300, () => {
      this.add.text(W / 2, H * 0.38, `SCORE: ${this.finalScore}`, {
        fontSize: '28px', fontFamily: 'Courier New', color: '#00f5ff'
      }).setOrigin(0.5).setAlpha(0);
    });

    this.time.delayedCall(500, () => {
      const scoreObj = this.children.list.find(c => c.text && c.text.startsWith('SCORE'));
      if (scoreObj) this.tweens.add({ targets: scoreObj, alpha: 1, duration: 400 });
    });

    this.time.delayedCall(600, () => {
      this.add.text(W / 2, H * 0.46, `WAVE REACHED: ${this.finalWave}`, {
        fontSize: '18px', fontFamily: 'Courier New', color: '#888888'
      }).setOrigin(0.5);

      const hsTxt = this.add.text(W / 2, H * 0.53, `HIGH SCORE: ${Math.max(hs, this.finalScore)}`, {
        fontSize: '20px', fontFamily: 'Courier New',
        color: isNew ? '#ffdd00' : '#666666'
      }).setOrigin(0.5);

      if (isNew) {
        this.add.text(W / 2, H * 0.59, '★ NEW RECORD ★', {
          fontSize: '16px', fontFamily: 'Courier New', color: '#ffdd00',
          shadow: { offsetX: 0, offsetY: 0, color: '#ffdd00', blur: 16, fill: true }
        }).setOrigin(0.5);
      }
    });

    // Restart button
    this.time.delayedCall(900, () => {
      const btnBg = this.add.graphics();
      const drawBtn = (hover) => {
        btnBg.clear();
        btnBg.fillStyle(hover ? 0xff00aa : 0x00f5ff, 1);
        btnBg.fillRoundedRect(W / 2 - 110, H * 0.72 - 28, 220, 56, 8);
      };
      drawBtn(false);

      this.add.text(W / 2, H * 0.72, 'PLAY AGAIN', {
        fontSize: '26px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#0a0a0f'
      }).setOrigin(0.5).setDepth(2);

      const zone = this.add.zone(W / 2, H * 0.72, 220, 56).setInteractive().setDepth(3);
      zone.on('pointerover', () => drawBtn(true));
      zone.on('pointerout',  () => drawBtn(false));
      zone.on('pointerdown', () => {
        window.audio.menuSelect();
        this.cameras.main.flash(200, 0, 245, 255);
        this.time.delayedCall(250, () => this.scene.start('GameScene'));
      });

      // Menu button
      const menuBg = this.add.graphics();
      const drawMenu = (hover) => {
        menuBg.clear();
        menuBg.lineStyle(2, hover ? 0xffffff : 0x444466, 1);
        menuBg.strokeRoundedRect(W / 2 - 80, H * 0.82 - 20, 160, 40, 6);
      };
      drawMenu(false);
      this.add.text(W / 2, H * 0.82, 'MAIN MENU', {
        fontSize: '18px', fontFamily: 'Courier New', color: '#666688'
      }).setOrigin(0.5).setDepth(2);

      const menuZone = this.add.zone(W / 2, H * 0.82, 160, 40).setInteractive().setDepth(3);
      menuZone.on('pointerover', () => drawMenu(true));
      menuZone.on('pointerout',  () => drawMenu(false));
      menuZone.on('pointerdown', () => {
        window.audio.menuSelect();
        this.scene.start('MenuScene');
      });
    });

    this._startGlitch();
  }

  _startGlitch() {
    this.time.addEvent({
      delay: 1800,
      loop: true,
      callback: () => {
        if (!this._goTxt) return;
        const orig = this._goTxt.x;
        const seq = [6, -6, 3, 0];
        let i = 0;
        const step = () => {
          if (i >= seq.length) { this._goTxt.x = orig; return; }
          this._goTxt.x = orig + seq[i++];
          this._goTxt.setStyle({ color: i % 2 === 0 ? '#ff00aa' : '#00f5ff' });
          this.time.delayedCall(35, step);
        };
        step();
      }
    });
  }

  update() {
    const { W, H } = window.VOIDSTRIKE;
    this._starGfx.clear();
    for (const s of this._stars) {
      s.y += s.v;
      if (s.y > H) { s.y = 0; s.x = Phaser.Math.Between(0, W); }
      this._starGfx.fillStyle(0xffffff, 0.35);
      this._starGfx.fillRect(s.x, s.y, s.s, s.s);
    }
  }
}
