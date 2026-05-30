class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { W, H } = window.VOIDSTRIKE;
    this._buildStars();

    // Title
    this._titleText = this.add.text(W / 2, H * 0.28, 'VOIDSTRIKE', {
      fontSize: '58px', fontFamily: 'Courier New', fontStyle: 'bold',
      color: '#00f5ff',
      stroke: '#0a0a0f', strokeThickness: 6
    }).setOrigin(0.5);
    this._addGlow(this._titleText, 0x00f5ff);

    this._subtitle = this.add.text(W / 2, H * 0.28 + 66, 'DEFEND THE VOID', {
      fontSize: '16px', fontFamily: 'Courier New',
      color: '#ff00aa', letterSpacing: 6
    }).setOrigin(0.5);

    // High score
    const hs = localStorage.getItem('voidstrike_hs') || 0;
    this.add.text(W / 2, H * 0.46, `HIGH SCORE: ${hs}`, {
      fontSize: '20px', fontFamily: 'Courier New', color: '#ffdd00'
    }).setOrigin(0.5);

    // Play button
    const btnBg = this.add.graphics();
    this._drawBtn(btnBg, false);
    const btnText = this.add.text(W / 2, H * 0.56, 'PLAY', {
      fontSize: '28px', fontFamily: 'Courier New', fontStyle: 'bold', color: '#0a0a0f'
    }).setOrigin(0.5);

    const btnZone = this.add.zone(W / 2, H * 0.56, 200, 60).setInteractive();
    btnZone.on('pointerover', () => { this._drawBtn(btnBg, true); });
    btnZone.on('pointerout',  () => { this._drawBtn(btnBg, false); });
    btnZone.on('pointerdown', () => {
      window.audio.menuSelect();
      this.cameras.main.flash(200, 0, 245, 255);
      this.time.delayedCall(300, () => this.scene.start('GameScene'));
    });

    // Controls hint
    this.add.text(W / 2, H * 0.72, 'DRAG or MOUSE to move  •  AUTO FIRE', {
      fontSize: '13px', fontFamily: 'Courier New', color: '#555577'
    }).setOrigin(0.5);

    this._startGlitch();
    this._startStarAnim();
  }

  _buildStars() {
    const { W, H } = window.VOIDSTRIKE;
    this._starGfx = this.add.graphics();
    this._stars = Array.from({ length: 80 }, () => ({
      x: Phaser.Math.Between(0, W),
      y: Phaser.Math.Between(0, H),
      s: Math.random() * 2 + 0.5,
      v: Math.random() * 0.4 + 0.1
    }));
  }

  _startStarAnim() {
    const { W, H } = window.VOIDSTRIKE;
    this.events.on('update', () => {
      this._starGfx.clear();
      for (const st of this._stars) {
        st.y += st.v;
        if (st.y > H) { st.y = 0; st.x = Phaser.Math.Between(0, W); }
        this._starGfx.fillStyle(0xffffff, 0.4 + st.s * 0.2);
        this._starGfx.fillCircle(st.x, st.y, st.s * 0.7);
      }
    });
  }

  _drawBtn(g, hover) {
    const { W, H } = window.VOIDSTRIKE;
    g.clear();
    g.fillStyle(hover ? 0x00f5ff : 0xff00aa, 1);
    g.fillRoundedRect(W / 2 - 100, H * 0.56 - 30, 200, 60, 8);
  }

  _addGlow(obj, color) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    obj.setStyle({ shadow: { offsetX: 0, offsetY: 0, color: hex, blur: 24, fill: true } });
  }

  _startGlitch() {
    // Random offset glitch on title
    this.time.addEvent({
      delay: 2200,
      loop: true,
      callback: () => {
        const orig = this._titleText.x;
        const glitchSeq = [4, -4, 2, 0];
        let i = 0;
        const step = () => {
          if (i >= glitchSeq.length) { this._titleText.x = orig; return; }
          this._titleText.x = orig + glitchSeq[i++];
          this._titleText.setStyle({ color: i % 2 === 0 ? '#00f5ff' : '#ff00aa' });
          this.time.delayedCall(40, step);
        };
        step();
      }
    });
  }
}
