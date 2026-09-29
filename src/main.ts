import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { TownScene } from './scenes/TownScene';
import { DungeonScene } from './scenes/DungeonScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 600,
  parent: 'game-container',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  backgroundColor: '#070609',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TitleScene, TownScene, DungeonScene, UIScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
