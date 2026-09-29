import * as Phaser from 'phaser';
import { ProceduralTextures } from '../assets/ProceduralTextures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // Show loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const text = this.add.text(width / 2, height / 2, 'Forging the Catacombs...', {
      fontSize: '20px',
      color: '#e6dac3',
      fontFamily: 'serif'
    }).setOrigin(0.5);

    // Generate all procedural pixel art textures onto Phaser canvas
    ProceduralTextures.generateAll(this);

    // Register character and monster animations
    this.createAnimations();

    // Fade out HTML loading overlay
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }
  }

  public create(): void {
    this.scene.start('TitleScene');
  }

  private createAnimations(): void {
    const sheets = [
      'hero_warrior',
      'hero_rogue',
      'hero_sorcerer',
      'monster_fallen',
      'monster_skeleton',
      'monster_archer',
      'monster_butcher'
    ];

    for (const key of sheets) {
      // Idle animation (frame 0)
      this.anims.create({
        key: `${key}_idle`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: 0 }),
        frameRate: 1,
        repeat: -1
      });

      // Walk animation (frames 0, 1)
      this.anims.create({
        key: `${key}_walk`,
        frames: this.anims.generateFrameNumbers(key, { frames: [0, 1, 0] }),
        frameRate: 6,
        repeat: -1
      });

      // Attack animation (frame 2)
      this.anims.create({
        key: `${key}_attack`,
        frames: this.anims.generateFrameNumbers(key, { frames: [0, 2, 0] }),
        frameRate: 8,
        repeat: 0
      });

      // Hit animation (frame 3)
      this.anims.create({
        key: `${key}_hit`,
        frames: this.anims.generateFrameNumbers(key, { frames: [3, 0] }),
        frameRate: 6,
        repeat: 0
      });
    }
  }
}
