import * as Phaser from 'phaser';
import { CharacterClass, CharacterStats } from '../core/entities/CharacterStats';
import { soundManager } from '../assets/ProceduralAudio';

export class TitleScene extends Phaser.Scene {
  private selectedClass: CharacterClass = 'WARRIOR';
  private classCards: { classType: CharacterClass; container: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Rectangle }[] = [];
  private statSummaryText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;

  constructor() {
    super('TitleScene');
  }

  public create(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Dark gothic background
    this.add.rectangle(w / 2, h / 2, w, h, 0x070609);

    // Title & Subtitle
    this.add.text(w / 2, 60, 'C A T A C O M B', {
      fontSize: '44px',
      color: '#c22d1b',
      fontFamily: 'serif',
      fontStyle: 'bold',
      shadow: { color: '#ff2200', blur: 18, fill: true }
    }).setOrigin(0.5);

    this.add.text(w / 2, 105, '— A TRIBUTE TO THE ORIGINAL DIABLO —', {
      fontSize: '14px',
      color: '#8b7a66',
      fontFamily: 'serif',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(w / 2, 145, 'CHOOSE THY CLASS', {
      fontSize: '18px',
      color: '#d4af37',
      fontFamily: 'serif',
      fontStyle: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Class selection cards
    const classes: { type: CharacterClass; title: string; spriteKey: string }[] = [
      { type: 'WARRIOR', title: 'WARRIOR', spriteKey: 'hero_warrior' },
      { type: 'ROGUE', title: 'ROGUE', spriteKey: 'hero_rogue' },
      { type: 'SORCERER', title: 'SORCERER', spriteKey: 'hero_sorcerer' }
    ];

    const cardWidth = 180;
    const spacing = 220;
    const startX = w / 2 - spacing;

    classes.forEach((cls, idx) => {
      const cx = startX + idx * spacing;
      const cy = 250;

      const container = this.add.container(cx, cy);

      const bg = this.add.rectangle(0, 0, cardWidth, 160, 0x141018, 0.9)
        .setStrokeStyle(2, cls.type === this.selectedClass ? 0xd4af37 : 0x3d3024)
        .setInteractive({ useHandCursor: true });

      const title = this.add.text(0, -55, cls.title, {
        fontSize: '18px',
        color: cls.type === this.selectedClass ? '#ffdd66' : '#998877',
        fontFamily: 'serif',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const sprite = this.add.sprite(0, 0, cls.spriteKey, 0).setScale(1.6);

      container.add([bg, title, sprite]);

      bg.on('pointerdown', () => {
        soundManager.resumeContext();
        soundManager.playSwordSwing();
        this.selectClass(cls.type);
      });

      bg.on('pointerover', () => {
        if (this.selectedClass !== cls.type) {
          bg.setStrokeStyle(2, 0x8a7050);
        }
      });

      bg.on('pointerout', () => {
        if (this.selectedClass !== cls.type) {
          bg.setStrokeStyle(2, 0x3d3024);
        }
      });

      this.classCards.push({ classType: cls.type, container, bg });
    });

    // Stat & Description Box
    const boxBg = this.add.rectangle(w / 2, 410, 680, 110, 0x100d14, 0.9)
      .setStrokeStyle(1, 0x4a3a2a);

    this.statSummaryText = this.add.text(w / 2 - 320, 370, '', {
      fontSize: '15px',
      color: '#e6dac3',
      fontFamily: 'monospace',
      lineSpacing: 4
    });

    this.descText = this.add.text(w / 2 - 320, 430, '', {
      fontSize: '13px',
      color: '#9e9282',
      fontFamily: 'serif',
      wordWrap: { width: 640 }
    });

    // Enter Town Button
    const btnBg = this.add.rectangle(w / 2, 530, 260, 46, 0x221312)
      .setStrokeStyle(2, 0xb82b18)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(w / 2, 530, 'ENTER TRISTRAM', {
      fontSize: '18px',
      color: '#ffd288',
      fontFamily: 'serif',
      fontStyle: 'bold',
      letterSpacing: 2
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x3a1917);
      btnBg.setStrokeStyle(2, 0xff4422);
    });

    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x221312);
      btnBg.setStrokeStyle(2, 0xb82b18);
    });

    btnBg.on('pointerdown', () => {
      soundManager.resumeContext();
      soundManager.playLevelUp();
      this.startGame();
    });

    this.updateClassDetails();
  }

  private selectClass(cls: CharacterClass): void {
    this.selectedClass = cls;
    this.classCards.forEach(c => {
      if (c.classType === cls) {
        c.bg.setStrokeStyle(2, 0xd4af37);
      } else {
        c.bg.setStrokeStyle(2, 0x3d3024);
      }
    });
    this.updateClassDetails();
  }

  private updateClassDetails(): void {
    const stats = new CharacterStats(this.selectedClass);

    this.statSummaryText.setText(
      `STRENGTH: ${stats.strength.toString().padEnd(4)}  ` +
      `DEXTERITY: ${stats.dexterity.toString().padEnd(4)}  ` +
      `MAGIC: ${stats.magic.toString().padEnd(4)}  ` +
      `VITALITY: ${stats.vitality.toString().padEnd(4)}\n` +
      `LIFE: ${stats.totalMaxHp.toString().padEnd(8)}  ` +
      `MANA: ${stats.totalMaxMp.toString().padEnd(8)}  ` +
      `BLOCK: ${stats.blockChance}%`
    );

    if (this.selectedClass === 'WARRIOR') {
      this.descText.setText('The Warrior is a master of martial combat. Clad in heavy armor and wielding sword and shield, he has the fastest melee attack and highest block chance.');
    } else if (this.selectedClass === 'ROGUE') {
      this.descText.setText('The Rogue excels in long-range marksmanship. With high dexterity, she fires swift salvos from her bow, detects hidden traps, and lands deadly critical strikes.');
    } else {
      this.descText.setText('The Sorcerer commands the esoteric arts. While physically fragile, his vast reservoir of mana allows him to cast devastating fire and lightning spells without pause.');
    }
  }

  private startGame(): void {
    this.scene.start('TownScene', { classType: this.selectedClass });
    this.scene.launch('UIScene', { classType: this.selectedClass });
  }
}
