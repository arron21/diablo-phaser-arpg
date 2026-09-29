import * as Phaser from 'phaser';
import { CharacterClass, CharacterStats } from '../core/entities/CharacterStats';
import { InventoryMatrix } from '../core/inventory/InventoryMatrix';
import { EquipmentPaperdoll } from '../core/inventory/EquipmentPaperdoll';
import { ItemGenerator } from '../core/items/ItemGenerator';
import { Isometric } from '../core/math/Isometric';
import { Pathfinding } from '../core/map/Pathfinding';
import { soundManager } from '../assets/ProceduralAudio';
import { UIScene } from './UIScene';

interface TownNPC {
  key: string;
  name: string;
  title: string;
  gx: number;
  gy: number;
  sprite: Phaser.GameObjects.Sprite;
}

export class TownScene extends Phaser.Scene {
  public classType: CharacterClass = 'WARRIOR';
  public stats!: CharacterStats;
  public inventory!: InventoryMatrix;
  public paperdoll!: EquipmentPaperdoll;

  // Grid dimensions for town
  private readonly mapWidth: number = 24;
  private readonly mapHeight: number = 24;
  private mapTiles: string[][] = [];

  // Player
  private playerGx: number = 12;
  private playerGy: number = 12;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private currentPath: { x: number; y: number }[] = [];
  private isMoving: boolean = false;

  // Town NPCs
  private npcs: TownNPC[] = [];

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  // Cathedral Entrance coordinates
  private readonly cathedralEntrance = { gx: 4, gy: 4 };

  constructor() {
    super('TownScene');
  }

  public init(data: {
    classType?: CharacterClass;
    stats?: CharacterStats;
    inventory?: InventoryMatrix;
    paperdoll?: EquipmentPaperdoll;
    fromPortal?: boolean;
  }): void {
    if (data.classType) this.classType = data.classType;

    if (data.stats) {
      this.stats = data.stats;
      this.inventory = data.inventory!;
      this.paperdoll = data.paperdoll!;
    } else {
      this.stats = new CharacterStats(this.classType);
      this.inventory = new InventoryMatrix(10, 4);
      this.paperdoll = new EquipmentPaperdoll(this.stats);

      // Give starter equipment
      const starterItems = ItemGenerator.getStarterItems(this.classType);
      for (const item of starterItems) {
        if (item.equipSlot && !this.paperdoll.getSlotItem(item.equipSlot === 'RING' ? 'RING_LEFT' : item.equipSlot)) {
          this.paperdoll.equip(item, item.equipSlot === 'RING' ? 'RING_LEFT' : item.equipSlot);
        } else {
          this.inventory.autoPlaceItem(item);
        }
      }
    }

    if (data.fromPortal) {
      this.playerGx = 12;
      this.playerGy = 12;
    } else {
      this.playerGx = 14;
      this.playerGy = 14;
    }
  }

  public create(): void {
    soundManager.playMusic('TOWN');

    // Build Town Map
    this.buildTownMap();

    // Spawn Cathedral Entrance
    this.createCathedralEntrance();

    // Spawn Townspeople
    this.spawnTownspeople();

    // Spawn Player
    this.createPlayer();

    // Setup Camera
    this.cameras.main.setZoom(1.0);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);

    // Setup Controls
    this.setupInput();

    // Sync UI Scene
    const ui = this.scene.get('UIScene') as UIScene;
    if (ui) {
      ui.stats = this.stats;
      ui.inventory = this.inventory;
      ui.paperdoll = this.paperdoll;
      ui.updateHUDValues();
      ui.refreshInventoryUI();
    }
  }

  private buildTownMap(): void {
    this.mapTiles = Array.from({ length: this.mapHeight }, () =>
      Array.from({ length: this.mapWidth }, () => 'tile_town_grass')
    );

    // Stone town square in center
    for (let y = 10; y <= 16; y++) {
      for (let x = 10; x <= 16; x++) {
        this.mapTiles[y][x] = 'tile_floor';
      }
    }

    // Dirt path from square to cathedral
    for (let i = 4; i <= 10; i++) {
      this.mapTiles[i][i] = 'tile_town_dirt';
      this.mapTiles[i][i + 1] = 'tile_town_dirt';
    }

    // Render isometric floor tiles
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const screenPos = Isometric.gridToScreen(x, y);
        const tileKey = this.mapTiles[y][x];
        const tile = this.add.image(screenPos.x, screenPos.y, tileKey);
        tile.setDepth(Isometric.calculateDepth(x, y, -50));
      }
    }

    // Town fountain in center
    const fPos = Isometric.gridToScreen(13, 13);
    const fountain = this.add.circle(fPos.x, fPos.y, 18, 0x336699)
      .setStrokeStyle(3, 0x8899aa)
      .setDepth(Isometric.calculateDepth(13, 13, 5));
  }

  private createCathedralEntrance(): void {
    const pos = Isometric.gridToScreen(this.cathedralEntrance.gx, this.cathedralEntrance.gy);

    // Archway & Stairs
    const stairs = this.add.image(pos.x, pos.y, 'tile_stairs_down')
      .setDepth(Isometric.calculateDepth(this.cathedralEntrance.gx, this.cathedralEntrance.gy, 0));

    const sign = this.add.text(pos.x, pos.y - 35, 'CATHEDRAL\n[Descent]', {
      fontSize: '11px',
      color: '#ff4422',
      fontStyle: 'bold',
      align: 'center',
      fontFamily: 'serif'
    }).setOrigin(0.5).setDepth(Isometric.calculateDepth(this.cathedralEntrance.gx, this.cathedralEntrance.gy, 10));

    this.tweens.add({
      targets: sign,
      y: pos.y - 40,
      yoyo: true,
      repeat: -1,
      duration: 1400
    });
  }

  private spawnTownspeople(): void {
    const npcList = [
      { key: 'Griswold', name: 'Griswold', title: 'The Blacksmith', gx: 10, gy: 11, texture: 'npc_griswold' },
      { key: 'Pepin', name: 'Pepin', title: 'The Healer', gx: 15, gy: 11, texture: 'npc_pepin' },
      { key: 'Adria', name: 'Adria', title: 'The Witch', gx: 10, gy: 15, texture: 'npc_adria' },
      { key: 'Cain', name: 'Cain', title: 'The Elder', gx: 15, gy: 15, texture: 'npc_cain' }
    ];

    npcList.forEach(n => {
      const pos = Isometric.gridToScreen(n.gx, n.gy);
      const sprite = this.add.sprite(pos.x, pos.y - 8, n.texture)
        .setInteractive({ useHandCursor: true })
        .setDepth(Isometric.calculateDepth(n.gx, n.gy, 10));

      const label = this.add.text(pos.x, pos.y - 32, `${n.name}\n${n.title}`, {
        fontSize: '9px',
        color: '#ffea88',
        align: 'center',
        fontFamily: 'serif'
      }).setOrigin(0.5).setDepth(Isometric.calculateDepth(n.gx, n.gy, 12));

      sprite.on('pointerdown', () => {
        soundManager.playSwordSwing();
        const ui = this.scene.get('UIScene') as UIScene;
        if (ui) {
          ui.openNPCShop(n.name);
        }
      });

      this.npcs.push({
        key: n.key,
        name: n.name,
        title: n.title,
        gx: n.gx,
        gy: n.gy,
        sprite
      });
    });
  }

  private createPlayer(): void {
    let spriteKey = 'hero_warrior';
    if (this.classType === 'ROGUE') spriteKey = 'hero_rogue';
    else if (this.classType === 'SORCERER') spriteKey = 'hero_sorcerer';

    const pos = Isometric.gridToScreen(this.playerGx, this.playerGy);
    this.playerSprite = this.add.sprite(pos.x, pos.y - 10, spriteKey)
      .setDepth(Isometric.calculateDepth(this.playerGx, this.playerGy, 20));

    this.playerSprite.play(`${spriteKey}_idle`);
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as unknown as typeof this.wasdKeys;
    }

    // Left-click movement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) return; // Handled by right click
      if (pointer.y > this.cameras.main.height - 50) return; // HUD area

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const targetTile = Isometric.screenToTile(worldPoint.x, worldPoint.y);

      this.navigateToTile(targetTile.x, targetTile.y);
    });
  }

  private navigateToTile(tx: number, ty: number): void {
    if (tx < 1 || tx >= this.mapWidth - 1 || ty < 1 || ty >= this.mapHeight - 1) return;

    const path = Pathfinding.findPath(
      Math.round(this.playerGx),
      Math.round(this.playerGy),
      tx,
      ty,
      (x, y) => x >= 1 && x < this.mapWidth - 1 && y >= 1 && y < this.mapHeight - 1
    );

    if (path.length > 0) {
      this.currentPath = path;
      this.isMoving = true;
      let spriteKey = 'hero_warrior';
      if (this.classType === 'ROGUE') spriteKey = 'hero_rogue';
      else if (this.classType === 'SORCERER') spriteKey = 'hero_sorcerer';
      this.playerSprite.play(`${spriteKey}_walk`, true);
    }
  }

  public update(time: number, delta: number): void {
    // 1. WASD movement check
    this.handleKeyboardMovement(delta);

    // 2. Path-following movement
    if (this.isMoving && this.currentPath.length > 0) {
      const next = this.currentPath[0];
      const targetScreen = Isometric.gridToScreen(next.x, next.y);
      const currentScreen = Isometric.gridToScreen(this.playerGx, this.playerGy);

      const dx = targetScreen.x - currentScreen.x;
      const dy = targetScreen.y - currentScreen.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const speed = 140 * (delta / 1000);

      if (dist <= speed) {
        this.playerGx = next.x;
        this.playerGy = next.y;
        this.currentPath.shift();

        if (this.currentPath.length === 0) {
          this.isMoving = false;
          let spriteKey = 'hero_warrior';
          if (this.classType === 'ROGUE') spriteKey = 'hero_rogue';
          else if (this.classType === 'SORCERER') spriteKey = 'hero_sorcerer';
          this.playerSprite.play(`${spriteKey}_idle`, true);

          // Check if stepped onto Cathedral entrance
          this.checkCathedralEntrance();
        }
      } else {
        const moveX = (dx / dist) * speed;
        const moveY = (dy / dist) * speed;
        const newScreenX = currentScreen.x + moveX;
        const newScreenY = currentScreen.y + moveY;
        const newGrid = Isometric.screenToGrid(newScreenX, newScreenY);
        this.playerGx = newGrid.x;
        this.playerGy = newGrid.y;
      }

      const pPos = Isometric.gridToScreen(this.playerGx, this.playerGy);
      this.playerSprite.setPosition(pPos.x, pPos.y - 10);
      this.playerSprite.setDepth(Isometric.calculateDepth(this.playerGx, this.playerGy, 20));
    }
  }

  private handleKeyboardMovement(delta: number): void {
    if (!this.wasdKeys) return;

    let dirX = 0;
    let dirY = 0;

    if (this.wasdKeys.W.isDown || this.cursors?.up.isDown) { dirX -= 1; dirY -= 1; }
    if (this.wasdKeys.S.isDown || this.cursors?.down.isDown) { dirX += 1; dirY += 1; }
    if (this.wasdKeys.A.isDown || this.cursors?.left.isDown) { dirX -= 1; dirY += 1; }
    if (this.wasdKeys.D.isDown || this.cursors?.right.isDown) { dirX += 1; dirY -= 1; }

    if (dirX !== 0 || dirY !== 0) {
      this.currentPath = [];
      const speed = 3.5 * (delta / 1000);
      const newGx = this.playerGx + dirX * speed;
      const newGy = this.playerGy + dirY * speed;

      if (newGx >= 1 && newGx < this.mapWidth - 1 && newGy >= 1 && newGy < this.mapHeight - 1) {
        this.playerGx = newGx;
        this.playerGy = newGy;
        const pPos = Isometric.gridToScreen(this.playerGx, this.playerGy);
        this.playerSprite.setPosition(pPos.x, pPos.y - 10);
        this.playerSprite.setDepth(Isometric.calculateDepth(this.playerGx, this.playerGy, 20));

        let spriteKey = 'hero_warrior';
        if (this.classType === 'ROGUE') spriteKey = 'hero_rogue';
        else if (this.classType === 'SORCERER') spriteKey = 'hero_sorcerer';
        this.playerSprite.play(`${spriteKey}_walk`, true);

        this.checkCathedralEntrance();
      }
    }
  }

  private checkCathedralEntrance(): void {
    const dist = Math.sqrt(
      (this.playerGx - this.cathedralEntrance.gx) ** 2 +
      (this.playerGy - this.cathedralEntrance.gy) ** 2
    );

    if (dist < 1.2) {
      soundManager.playSwordSwing();
      this.cameras.main.fade(600, 0, 0, 0, false, (_cam: unknown, progress: number) => {
        if (progress === 1) {
          this.scene.start('DungeonScene', {
            floorLevel: 1,
            classType: this.classType,
            stats: this.stats,
            inventory: this.inventory,
            paperdoll: this.paperdoll
          });
        }
      });
    }
  }
}
