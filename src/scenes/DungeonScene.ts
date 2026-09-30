import * as Phaser from 'phaser';
import { CharacterClass, CharacterStats } from '../core/entities/CharacterStats';
import { InventoryMatrix } from '../core/inventory/InventoryMatrix';
import { EquipmentPaperdoll } from '../core/inventory/EquipmentPaperdoll';
import { BSPGenerator, DungeonLevel, TileType } from '../core/map/BSPGenerator';
import { FOVSystem } from '../core/map/FOVSystem';
import { Pathfinding } from '../core/map/Pathfinding';
import { Isometric } from '../core/math/Isometric';
import { DiabloCombat } from '../core/combat/DiabloCombat';
import { MonsterEntity, MonsterType } from '../core/ai/MonsterFSM';
import { ItemData } from '../core/items/ItemTypes';
import { ItemGenerator } from '../core/items/ItemGenerator';
import { SPELLS, SpellDefinition } from '../core/spells/SpellSystem';
import { soundManager } from '../assets/ProceduralAudio';
import { UIScene } from './UIScene';

interface DroppedLoot {
  item: ItemData;
  gx: number;
  gy: number;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
}

interface Projectile {
  sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Arc;
  gx: number;
  gy: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayerSpell: boolean;
  spellId?: string;
  lifetime: number;
}

export class DungeonScene extends Phaser.Scene {
  public floorLevel: number = 1;
  public classType: CharacterClass = 'WARRIOR';
  public stats!: CharacterStats;
  public inventory!: InventoryMatrix;
  public paperdoll!: EquipmentPaperdoll;

  // Dungeon Data & FOV
  private dungeon!: DungeonLevel;
  private fov!: FOVSystem;

  // Tile Visuals
  private tileImages: Map<string, Phaser.GameObjects.Image> = new Map();
  private wallImages: Map<string, Phaser.GameObjects.Image> = new Map();

  // Player
  private playerGx: number = 0;
  private playerGy: number = 0;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private currentPath: { x: number; y: number }[] = [];
  private isMoving: boolean = false;
  private isAttacking: boolean = false;
  private attackCooldown: number = 0;
  private isHitStunned: boolean = false;
  private hitStunTimer: number = 0;

  // Monsters
  private monsters: MonsterEntity[] = [];
  private monsterSprites: Map<string, { sprite: Phaser.GameObjects.Sprite; hpBar: Phaser.GameObjects.Rectangle }> = new Map();

  // Projectiles
  private projectiles: Projectile[] = [];

  // Ground Loot
  private droppedLoot: DroppedLoot[] = [];

  // Active Town Portal
  private townPortal?: { gx: number; gy: number; sprite: Phaser.GameObjects.Sprite };

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; SHIFT: Phaser.Input.Keyboard.Key };

  constructor() {
    super('DungeonScene');
  }

  public init(data: {
    floorLevel: number;
    classType: CharacterClass;
    stats: CharacterStats;
    inventory: InventoryMatrix;
    paperdoll: EquipmentPaperdoll;
  }): void {
    this.floorLevel = data.floorLevel || 1;
    this.classType = data.classType || 'WARRIOR';
    this.stats = data.stats;
    this.inventory = data.inventory;
    this.paperdoll = data.paperdoll;
  }

  public create(): void {
    soundManager.playMusic('DUNGEON');

    // 1. Generate Procedural BSP Dungeon
    this.dungeon = BSPGenerator.generate(this.floorLevel, 48, 48);

    // 2. Initialize FOV
    this.fov = new FOVSystem(this.dungeon.width, this.dungeon.height, 9);

    // 3. Render Isometric World
    this.renderDungeonTiles();

    // 4. Spawn Player at Entrance Stairs
    this.playerGx = this.dungeon.stairsUp.x;
    this.playerGy = this.dungeon.stairsUp.y;
    this.createPlayer();

    // 5. Spawn Monsters & Boss
    this.spawnMonsters();

    // 6. Setup Camera
    this.cameras.main.setZoom(1.0);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);

    // 7. Initial FOV calculation
    this.updateFOV();

    // 8. Setup Controls
    this.setupInput();

    // 9. Sync UI Scene
    const ui = this.scene.get('UIScene') as UIScene;
    if (ui) {
      ui.stats = this.stats;
      ui.inventory = this.inventory;
      ui.paperdoll = this.paperdoll;
      if (ui.isReady()) {
        ui.updateHUDValues();
        ui.refreshInventoryUI();
      }

      // Listen for Town Portal spell
      ui.events.off('open_town_portal');
      ui.events.on('open_town_portal', () => {
        this.spawnTownPortal();
      });
    }

    // Floor transition announcement
    const announce = this.add.text(
      this.cameras.main.width / 2,
      120,
      `CATHEDRAL — LEVEL ${this.floorLevel}`,
      {
        fontSize: '22px',
        color: '#ff4422',
        fontFamily: 'serif',
        fontStyle: 'bold',
        shadow: { color: '#000000', blur: 6, fill: true }
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(2500);

    this.tweens.add({
      targets: announce,
      alpha: 0,
      y: 90,
      delay: 2000,
      duration: 1500,
      onComplete: () => announce.destroy()
    });
  }

  // ==========================================
  // Tile Rendering & Depth Sorting
  // ==========================================

  private renderDungeonTiles(): void {
    for (let y = 0; y < this.dungeon.height; y++) {
      for (let x = 0; x < this.dungeon.width; x++) {
        const type = this.dungeon.tiles[y][x];
        if (type === 'EMPTY') continue;

        const screenPos = Isometric.gridToScreen(x, y);
        const tileKey = `${x},${y}`;

        // Floor / Stairs / Doors
        let textureKey = 'tile_floor';
        if (type === 'FLOOR_BLOOD') textureKey = 'tile_floor_blood';
        else if (type === 'STAIRS_UP') textureKey = 'tile_stairs_up';
        else if (type === 'STAIRS_DOWN') textureKey = 'tile_stairs_down';
        else if (type === 'DOOR_CLOSED') textureKey = 'tile_door_closed';
        else if (type === 'DOOR_OPEN') textureKey = 'tile_door_open';
        else if (type === 'WALL') textureKey = 'tile_wall';

        if (type === 'WALL') {
          // Walls render at depth +40 to sort in front of adjacent upper floors
          const wall = this.add.image(screenPos.x, screenPos.y - 16, textureKey)
            .setDepth(Isometric.calculateDepth(x, y, 40))
            .setAlpha(0);
          this.wallImages.set(tileKey, wall);
        } else {
          const floor = this.add.image(screenPos.x, screenPos.y, textureKey)
            .setDepth(Isometric.calculateDepth(x, y, -50))
            .setAlpha(0);
          this.tileImages.set(tileKey, floor);
        }

        // Additional objects: Chests, Barrels, Shrines
        if (type === 'CHEST') {
          const chest = this.add.image(screenPos.x, screenPos.y - 6, 'chest_closed')
            .setDepth(Isometric.calculateDepth(x, y, 5))
            .setInteractive({ useHandCursor: true })
            .setAlpha(0);

          chest.on('pointerdown', () => this.interactChest(x, y, chest));
          this.tileImages.set(`obj_${tileKey}`, chest);
        } else if (type === 'BARREL') {
          const barrel = this.add.image(screenPos.x, screenPos.y - 6, 'barrel')
            .setDepth(Isometric.calculateDepth(x, y, 5))
            .setInteractive({ useHandCursor: true })
            .setAlpha(0);

          barrel.on('pointerdown', () => this.interactBarrel(x, y, barrel));
          this.tileImages.set(`obj_${tileKey}`, barrel);
        } else if (type === 'SHRINE') {
          const shrine = this.add.image(screenPos.x, screenPos.y - 12, 'shrine')
            .setDepth(Isometric.calculateDepth(x, y, 5))
            .setInteractive({ useHandCursor: true })
            .setAlpha(0);

          shrine.on('pointerdown', () => this.interactShrine(x, y));
          this.tileImages.set(`obj_${tileKey}`, shrine);
        }
      }
    }
  }

  // ==========================================
  // FOV & Dynamic Torchlight
  // ==========================================

  private updateFOV(): void {
    const isOpaque = (x: number, y: number) => {
      if (x < 0 || x >= this.dungeon.width || y < 0 || y >= this.dungeon.height) return true;
      const t = this.dungeon.tiles[y][x];
      return t === 'WALL' || t === 'DOOR_CLOSED';
    };

    this.fov.compute(Math.round(this.playerGx), Math.round(this.playerGy), isOpaque);

    // Update tile visual alphas and tints based on light intensity
    for (let y = 0; y < this.dungeon.height; y++) {
      for (let x = 0; x < this.dungeon.width; x++) {
        const key = `${x},${y}`;
        const floorImg = this.tileImages.get(key);
        const wallImg = this.wallImages.get(key);
        const objImg = this.tileImages.get(`obj_${key}`);

        const isVis = this.fov.isVisible(x, y);
        const isExp = this.fov.isExplored(x, y);
        const intensity = this.fov.getIntensity(x, y);

        if (floorImg) {
          if (isVis) {
            floorImg.setAlpha(intensity);
            floorImg.setTint(this.getTorchTint(intensity));
          } else if (isExp) {
            floorImg.setAlpha(0.28);
            floorImg.setTint(0x444455);
          } else {
            floorImg.setAlpha(0);
          }
        }

        if (wallImg) {
          if (isVis) {
            wallImg.setAlpha(intensity);
            wallImg.setTint(this.getTorchTint(intensity));
          } else if (isExp) {
            wallImg.setAlpha(0.3);
            wallImg.setTint(0x444455);
          } else {
            wallImg.setAlpha(0);
          }
        }

        if (objImg) {
          if (isVis) {
            objImg.setAlpha(intensity);
          } else if (isExp) {
            objImg.setAlpha(0.25);
          } else {
            objImg.setAlpha(0);
          }
        }
      }
    }

    // Hide/Show monsters outside of active line of sight
    for (const m of this.monsters) {
      const vis = this.fov.isVisible(Math.round(m.x), Math.round(m.y));
      const sprData = this.monsterSprites.get(m.id);
      if (sprData) {
        sprData.sprite.setVisible(vis && m.state !== 'DEAD');
        sprData.hpBar.setVisible(vis && m.state !== 'DEAD' && m.currentHp < m.maxHp);
      }
    }

    // Hide/Show ground loot outside of active vision
    for (const loot of this.droppedLoot) {
      const vis = this.fov.isVisible(loot.gx, loot.gy);
      loot.sprite.setVisible(vis);
      loot.label.setVisible(vis);
    }
  }

  private getTorchTint(intensity: number): number {
    // Amber fire gradient: higher intensity is warm yellowish white, edge is orange-red
    if (intensity > 0.8) return 0xffeedd;
    if (intensity > 0.5) return 0xffccaa;
    return 0xdd8855;
  }

  // ==========================================
  // Player Entity & Input
  // ==========================================

  private createPlayer(): void {
    let spriteKey = 'hero_warrior';
    if (this.classType === 'ROGUE') spriteKey = 'hero_rogue';
    else if (this.classType === 'SORCERER') spriteKey = 'hero_sorcerer';

    const pos = Isometric.gridToScreen(this.playerGx, this.playerGy);
    this.playerSprite = this.add.sprite(pos.x, pos.y - 12, spriteKey)
      .setDepth(Isometric.calculateDepth(this.playerGx, this.playerGy, 20));

    this.playerSprite.play(`${spriteKey}_idle`);
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D,SHIFT') as unknown as typeof this.wasdKeys;
    }

    // Pointer down: Left click move/attack, Right click cast spell
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > this.cameras.main.height - 50) return; // HUD area

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const targetTile = Isometric.screenToTile(worldPoint.x, worldPoint.y);

      if (pointer.rightButtonDown()) {
        // Right-Click: Cast Active Spell
        this.castActiveSpell(targetTile.x, targetTile.y);
      } else {
        // Left-Click: Move or Attack
        if (this.wasdKeys?.SHIFT.isDown) {
          // Shift + Click: Stand ground and attack
          this.performPlayerAttack(targetTile.x, targetTile.y);
        } else {
          // Check if clicked monster
          const clickedMonster = this.findMonsterAt(targetTile.x, targetTile.y);
          if (clickedMonster) {
            const dist = Isometric.distance(this.playerGx, this.playerGy, clickedMonster.x, clickedMonster.y);
            const isRanged = this.classType === 'ROGUE';
            if (dist <= (isRanged ? 6 : 1.4)) {
              this.performPlayerAttack(clickedMonster.x, clickedMonster.y, clickedMonster);
            } else {
              this.navigateToTile(targetTile.x, targetTile.y);
            }
          } else {
            // Check if clicked closed door
            if (this.dungeon.tiles[targetTile.y]?.[targetTile.x] === 'DOOR_CLOSED') {
              this.openDoor(targetTile.x, targetTile.y);
            } else {
              this.navigateToTile(targetTile.x, targetTile.y);
            }
          }
        }
      }
    });
  }

  private navigateToTile(tx: number, ty: number): void {
    if (this.isHitStunned) return;

    const path = Pathfinding.findPath(
      Math.round(this.playerGx),
      Math.round(this.playerGy),
      tx,
      ty,
      (x, y) => this.isTileWalkable(x, y)
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

  private isTileWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.dungeon.width || y < 0 || y >= this.dungeon.height) return false;
    const tile = this.dungeon.tiles[y][x];
    if (tile === 'EMPTY' || tile === 'WALL' || tile === 'DOOR_CLOSED') return false;
    return true;
  }

  private openDoor(x: number, y: number): void {
    this.dungeon.tiles[y][x] = 'DOOR_OPEN';
    const key = `${x},${y}`;
    const img = this.tileImages.get(key);
    if (img) {
      img.setTexture('tile_door_open');
    }
    soundManager.playSwordSwing();
    this.updateFOV();
  }

  // ==========================================
  // Combat & Spells
  // ==========================================

  private performPlayerAttack(targetX: number, targetY: number, targetMonster?: MonsterEntity): void {
    if (this.isAttacking || this.attackCooldown > 0 || this.isHitStunned) return;

    this.isAttacking = true;
    this.attackCooldown = this.classType === 'WARRIOR' ? 350 : 450;
    this.isMoving = false;
    this.currentPath = [];

    let spriteKey = 'hero_warrior';
    if (this.classType === 'ROGUE') spriteKey = 'hero_rogue';
    else if (this.classType === 'SORCERER') spriteKey = 'hero_sorcerer';

    this.playerSprite.play(`${spriteKey}_attack`, true);
    this.playerSprite.once('animationcomplete', () => {
      this.playerSprite.play(`${spriteKey}_idle`, true);
      this.isAttacking = false;
    });

    if (this.classType === 'ROGUE') {
      // Fire Arrow Projectile
      soundManager.playBowShoot();
      this.spawnProjectile(this.playerGx, this.playerGy, targetX, targetY, 'ARROW', this.stats.damageRange.max, true);
    } else {
      // Melee Swing
      soundManager.playSwordSwing();

      // Find monster in adjacent tile
      const target = targetMonster || this.findMonsterAt(targetX, targetY) || this.findClosestMonster(1.5);
      if (target) {
        this.resolveMeleeHit(target);
      }
    }
  }

  private resolveMeleeHit(target: MonsterEntity): void {
    const result = DiabloCombat.resolveAttack(this.stats, target, this.classType === 'ROGUE');

    const screenPos = Isometric.gridToScreen(target.x, target.y);

    if (!result.hit) {
      this.showDamageText('MISS', screenPos.x, screenPos.y - 20, '#888888');
      return;
    }

    if (result.blocked) {
      soundManager.playShieldBlock();
      this.showDamageText('BLOCK', screenPos.x, screenPos.y - 20, '#4488ff');
      return;
    }

    // Hit connected
    soundManager.playFleshHit();
    const killed = target.takeDamage(result.damage, result.hitRecovery ? 350 : 0);
    this.showDamageText(
      result.critical ? `${result.damage}!` : `${result.damage}`,
      screenPos.x,
      screenPos.y - 20,
      result.critical ? '#ffea00' : '#ff4422'
    );

    // Update HP bar
    this.updateMonsterHpBar(target);

    // Hit recovery animation
    const sprData = this.monsterSprites.get(target.id);
    if (sprData) {
      let sprKey = 'monster_skeleton';
      if (target.config.type === 'FALLEN_ONE') sprKey = 'monster_fallen';
      else if (target.config.type === 'SKELETON_ARCHER') sprKey = 'monster_archer';
      else if (target.config.type === 'THE_BUTCHER') sprKey = 'monster_butcher';
      sprData.sprite.play(`${sprKey}_hit`, true);
    }

    if (killed) {
      this.handleMonsterDeath(target);
    }
  }

  private castActiveSpell(targetX: number, targetY: number): void {
    const ui = this.scene.get('UIScene') as UIScene;
    const spell = ui?.activeSpell || SPELLS.firebolt;

    if (!this.stats.consumeMana(spell.manaCost)) {
      this.showDamageText('Out of Mana!', this.playerSprite.x, this.playerSprite.y - 30, '#44aaff');
      return;
    }

    ui.updateHUDValues();

    if (spell.id === 'heal') {
      soundManager.playPotionGulp();
      const healAmount = Math.floor(spell.healMin! + Math.random() * (spell.healMax! - spell.healMin! + 1) + this.stats.magic * 0.5);
      this.stats.heal(healAmount);
      ui.updateHUDValues();
      this.showDamageText(`+${healAmount}`, this.playerSprite.x, this.playerSprite.y - 30, '#33ff55');
      return;
    }

    if (spell.id === 'town_portal') {
      this.spawnTownPortal();
      return;
    }

    // Offensive Spells: Firebolt, Charged Bolt, Holy Bolt
    soundManager.playSpellCast(spell.id === 'firebolt' ? 'FIRE' : 'LIGHTNING');

    let dmg = Math.floor(spell.minDamage! + Math.random() * (spell.maxDamage! - spell.minDamage! + 1) + this.stats.magic * 0.3);

    if (spell.id === 'charged_bolt') {
      // 3 Erratic sparks
      for (let i = -1; i <= 1; i++) {
        this.spawnProjectile(
          this.playerGx,
          this.playerGy,
          targetX + i * 0.5,
          targetY + i * 0.5,
          'CHARGED_BOLT',
          dmg,
          true
        );
      }
    } else {
      this.spawnProjectile(
        this.playerGx,
        this.playerGy,
        targetX,
        targetY,
        spell.id === 'holy_bolt' ? 'HOLY_BOLT' : 'FIREBOLT',
        dmg,
        true,
        spell.id
      );
    }
  }

  private spawnProjectile(
    fromGx: number,
    fromGy: number,
    toGx: number,
    toGy: number,
    type: 'ARROW' | 'FIREBOLT' | 'CHARGED_BOLT' | 'HOLY_BOLT',
    damage: number,
    isPlayerSpell: boolean,
    spellId?: string
  ): void {
    const fromPos = Isometric.gridToScreen(fromGx, fromGy);
    const toPos = Isometric.gridToScreen(toGx, toGy);

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const angle = Math.atan2(dy, dx);

    let tex = 'spell_firebolt';
    let speed = 300;

    if (type === 'ARROW') {
      tex = 'proj_arrow';
      speed = 360;
    } else if (type === 'CHARGED_BOLT') {
      tex = 'spell_charged_bolt';
      speed = 220;
    } else if (type === 'HOLY_BOLT') {
      tex = 'spell_holy_bolt';
      speed = 280;
    }

    const spr = this.add.sprite(fromPos.x, fromPos.y - 10, tex)
      .setRotation(angle)
      .setDepth(Isometric.calculateDepth(fromGx, fromGy, 60));

    this.projectiles.push({
      sprite: spr,
      gx: fromGx,
      gy: fromGy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      isPlayerSpell,
      spellId,
      lifetime: 2000
    });
  }

  private spawnTownPortal(): void {
    soundManager.playSpellCast('PORTAL');
    const pos = Isometric.gridToScreen(this.playerGx, this.playerGy);

    if (this.townPortal) {
      this.townPortal.sprite.destroy();
    }

    const spr = this.add.sprite(pos.x, pos.y - 12, 'town_portal')
      .setDepth(Isometric.calculateDepth(this.playerGx, this.playerGy, 15))
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: spr,
      scaleX: 1.15,
      scaleY: 1.15,
      yoyo: true,
      repeat: -1,
      duration: 800
    });

    this.townPortal = {
      gx: Math.round(this.playerGx),
      gy: Math.round(this.playerGy),
      sprite: spr
    };

    spr.on('pointerdown', () => {
      this.teleportToTown();
    });

    this.showDamageText('Portal Opened!', pos.x, pos.y - 30, '#44aaff');
  }

  private teleportToTown(): void {
    soundManager.playSpellCast('PORTAL');
    this.cameras.main.fade(500, 0, 0, 0, false, (_cam: unknown, progress: number) => {
      if (progress === 1) {
        this.scene.start('TownScene', {
          classType: this.classType,
          stats: this.stats,
          inventory: this.inventory,
          paperdoll: this.paperdoll,
          fromPortal: true
        });
      }
    });
  }

  // ==========================================
  // Monster Management & AI
  // ==========================================

  private spawnMonsters(): void {
    // 1. Normal Monsters
    this.dungeon.monsterSpawns.forEach((spawn, idx) => {
      const id = `mon_${idx}_${spawn.type}`;
      const monster = new MonsterEntity(id, spawn.type, spawn.x, spawn.y);
      this.monsters.push(monster);
      this.createMonsterSprite(monster);
    });

    // 2. Boss (The Butcher on Floor 2)
    if (this.dungeon.butcherSpawn) {
      const butcher = new MonsterEntity(
        'boss_the_butcher',
        'THE_BUTCHER',
        this.dungeon.butcherSpawn.x,
        this.dungeon.butcherSpawn.y
      );
      this.monsters.push(butcher);
      this.createMonsterSprite(butcher);
    }
  }

  private createMonsterSprite(monster: MonsterEntity): void {
    let spriteKey = 'monster_skeleton';
    if (monster.config.type === 'FALLEN_ONE') spriteKey = 'monster_fallen';
    else if (monster.config.type === 'SKELETON_ARCHER') spriteKey = 'monster_archer';
    else if (monster.config.type === 'THE_BUTCHER') spriteKey = 'monster_butcher';

    const pos = Isometric.gridToScreen(monster.x, monster.y);
    const sprite = this.add.sprite(pos.x, pos.y - 12, spriteKey)
      .setDepth(Isometric.calculateDepth(monster.x, monster.y, 20))
      .setInteractive({ useHandCursor: true });

    // Health bar above monster
    const hpBar = this.add.rectangle(pos.x, pos.y - 28, 26, 3, 0xff2222)
      .setDepth(Isometric.calculateDepth(monster.x, monster.y, 25))
      .setVisible(false);

    sprite.play(`${spriteKey}_idle`);

    sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) return;
      this.performPlayerAttack(monster.x, monster.y, monster);
    });

    this.monsterSprites.set(monster.id, { sprite, hpBar });
  }

  private updateMonsterHpBar(monster: MonsterEntity): void {
    const sprData = this.monsterSprites.get(monster.id);
    if (!sprData) return;

    const hpPercent = Math.max(0, monster.currentHp / monster.maxHp);
    sprData.hpBar.setSize(Math.max(1, 26 * hpPercent), 3);
    sprData.hpBar.setVisible(hpPercent < 1.0 && monster.state !== 'DEAD');
  }

  private updateMonsters(time: number, delta: number): void {
    const pGx = this.playerGx;
    const pGy = this.playerGy;

    for (const m of this.monsters) {
      if (m.state === 'DEAD') continue;

      // Hit stun countdown
      if (m.hitStunTimer > 0) {
        m.hitStunTimer -= delta;
        if (m.hitStunTimer <= 0) {
          m.state = 'CHASE';
        }
        continue;
      }

      // Flee countdown (Fallen Ones)
      if (m.state === 'FLEE') {
        m.fleeTimer -= delta;
        if (m.fleeTimer <= 0) {
          m.state = 'CHASE';
        } else {
          // Flee away from player
          const dirX = m.x - pGx;
          const dirY = m.y - pGy;
          const normX = dirX > 0 ? 1 : (dirX < 0 ? -1 : 0);
          const normY = dirY > 0 ? 1 : (dirY < 0 ? -1 : 0);
          const targetX = Math.round(m.x + normX);
          const targetY = Math.round(m.y + normY);
          if (this.isTileWalkable(targetX, targetY)) {
            m.x = targetX;
            m.y = targetY;
          }
          this.syncMonsterPosition(m);
          continue;
        }
      }

      const dist = Isometric.distance(m.x, m.y, pGx, pGy);

      // Check Butcher Boss Cry
      if (m.config.isBoss && !m.hasTriggeredBossCry && dist <= m.aggroRange) {
        m.hasTriggeredBossCry = true;
        soundManager.playButcherCry();
        this.showDamageText('"Ah, fresh meat!"', this.playerSprite.x, this.playerSprite.y - 50, '#ff1111');
      }

      // Aggro check
      if (dist <= m.aggroRange) {
        if (dist <= m.config.attackRange) {
          // Attack Player
          if (time - m.lastAttackTime >= m.config.attackCooldown) {
            m.lastAttackTime = time;
            this.monsterAttackPlayer(m);
          }
        } else {
          // Chase player using A* or direct step
          const moveSpeed = m.config.walkSpeed * (delta / 1000);
          const path = Pathfinding.findPath(
            Math.round(m.x),
            Math.round(m.y),
            Math.round(pGx),
            Math.round(pGy),
            (x, y) => this.isTileWalkable(x, y),
            12
          );

          if (path.length > 0) {
            const next = path[0];
            const dx = next.x - m.x;
            const dy = next.y - m.y;
            const step = Math.min(moveSpeed, Math.sqrt(dx * dx + dy * dy));
            const angle = Math.atan2(dy, dx);
            m.x += Math.cos(angle) * step;
            m.y += Math.sin(angle) * step;
          }
        }
      }

      this.syncMonsterPosition(m);
    }
  }

  private syncMonsterPosition(m: MonsterEntity): void {
    const sprData = this.monsterSprites.get(m.id);
    if (!sprData) return;

    const pos = Isometric.gridToScreen(m.x, m.y);
    sprData.sprite.setPosition(pos.x, pos.y - 12);
    sprData.sprite.setDepth(Isometric.calculateDepth(m.x, m.y, 20));

    sprData.hpBar.setPosition(pos.x, pos.y - 28);
    sprData.hpBar.setDepth(Isometric.calculateDepth(m.x, m.y, 25));
  }

  private monsterAttackPlayer(m: MonsterEntity): void {
    let sprKey = 'monster_skeleton';
    if (m.config.type === 'FALLEN_ONE') sprKey = 'monster_fallen';
    else if (m.config.type === 'SKELETON_ARCHER') sprKey = 'monster_archer';
    else if (m.config.type === 'THE_BUTCHER') sprKey = 'monster_butcher';

    const sprData = this.monsterSprites.get(m.id);
    if (sprData) {
      sprData.sprite.play(`${sprKey}_attack`, true);
    }

    if (m.config.type === 'SKELETON_ARCHER') {
      soundManager.playBowShoot();
      this.spawnProjectile(m.x, m.y, this.playerGx, this.playerGy, 'ARROW', m.damageRange.max, false);
      return;
    }

    // Melee attack on player
    const result = DiabloCombat.resolveAttack(m, this.stats);

    if (!result.hit) {
      this.showDamageText('MISS', this.playerSprite.x, this.playerSprite.y - 20, '#888888');
      return;
    }

    if (result.blocked) {
      soundManager.playShieldBlock();
      this.showDamageText('BLOCKED', this.playerSprite.x, this.playerSprite.y - 20, '#4488ff');
      return;
    }

    // Player takes damage
    soundManager.playFleshHit();
    this.stats.takeDamage(result.damage);

    const ui = this.scene.get('UIScene') as UIScene;
    if (ui) ui.updateHUDValues();

    this.showDamageText(`-${result.damage}`, this.playerSprite.x, this.playerSprite.y - 20, '#ff2222');

    // Player hit stun
    if (result.hitRecovery) {
      this.isHitStunned = true;
      this.hitStunTimer = 300;
      let pKey = 'hero_warrior';
      if (this.classType === 'ROGUE') pKey = 'hero_rogue';
      else if (this.classType === 'SORCERER') pKey = 'hero_sorcerer';
      this.playerSprite.play(`${pKey}_hit`, true);
    }

    // Check Player Death
    if (this.stats.currentHp <= 0) {
      this.handlePlayerDeath();
    }
  }

  private handleMonsterDeath(monster: MonsterEntity): void {
    soundManager.playBoneCrack();

    // Exp Reward
    const leveledUp = this.stats.addExperience(monster.config.expReward);
    this.showDamageText(`+${monster.config.expReward} XP`, this.playerSprite.x, this.playerSprite.y - 35, '#ffd700');

    if (leveledUp) {
      soundManager.playLevelUp();
      this.showDamageText('LEVEL UP! (+5 Points)', this.playerSprite.x, this.playerSprite.y - 50, '#ffea00');
    }

    const ui = this.scene.get('UIScene') as UIScene;
    if (ui) {
      ui.updateHUDValues();
      ui.refreshCharSheet();
    }

    // Fallen Ones panic mechanic: if nearby Fallen Ones see an ally die, they flee!
    if (monster.config.type === 'FALLEN_ONE') {
      for (const other of this.monsters) {
        if (other.id !== monster.id && other.config.type === 'FALLEN_ONE') {
          const d = Isometric.distance(monster.x, monster.y, other.x, other.y);
          if (d <= 5) {
            other.triggerFlee(3000);
          }
        }
      }
    }

    // Remove sprite
    const sprData = this.monsterSprites.get(monster.id);
    if (sprData) {
      sprData.sprite.destroy();
      sprData.hpBar.destroy();
      this.monsterSprites.delete(monster.id);
    }

    // Loot Drop
    if (monster.config.isBoss) {
      // Guaranteed Butcher's Cleaver Unique
      const cleaver = ItemGenerator.createButchersCleaver();
      this.spawnDroppedLoot(monster.x, monster.y, cleaver);
      // Extra gold
      this.spawnDroppedLoot(monster.x + 0.5, monster.y, ItemGenerator.createGold(250));
    } else {
      // Normal loot roll
      const drop = ItemGenerator.generateRandomDrop(this.floorLevel);
      this.spawnDroppedLoot(monster.x, monster.y, drop);
    }
  }

  private handlePlayerDeath(): void {
    soundManager.playFleshHit();
    this.cameras.main.fade(1000, 100, 0, 0, false, (_cam: unknown, progress: number) => {
      if (progress === 1) {
        // Respawn in Town
        this.stats.currentHp = this.stats.totalMaxHp;
        this.stats.currentMp = this.stats.totalMaxMp;
        this.scene.start('TownScene', {
          classType: this.classType,
          stats: this.stats,
          inventory: this.inventory,
          paperdoll: this.paperdoll
        });
      }
    });
  }

  // ==========================================
  // Ground Loot & Interactables
  // ==========================================

  private spawnDroppedLoot(gx: number, gy: number, item: ItemData): void {
    const pos = Isometric.gridToScreen(gx, gy);

    let textColor = '#ffffff';
    if (item.rarity === 'MAGIC') textColor = '#4488ff';
    else if (item.rarity === 'RARE') textColor = '#ffff55';
    else if (item.rarity === 'UNIQUE') textColor = '#cc8822';
    else if (item.type === 'GOLD') textColor = '#ffd700';

    const spr = this.add.sprite(pos.x, pos.y - 4, item.icon)
      .setDisplaySize(20, 20)
      .setDepth(Isometric.calculateDepth(gx, gy, 10))
      .setInteractive({ useHandCursor: true });

    const lbl = this.add.text(pos.x, pos.y - 18, item.name, {
      fontSize: '10px',
      color: textColor,
      fontStyle: 'bold',
      fontFamily: 'serif',
      shadow: { color: '#000000', blur: 3, fill: true }
    }).setOrigin(0.5).setDepth(Isometric.calculateDepth(gx, gy, 12));

    const lootObj: DroppedLoot = { item, gx, gy, sprite: spr, label: lbl };
    this.droppedLoot.push(lootObj);

    spr.on('pointerdown', () => {
      this.pickupLoot(lootObj);
    });
  }

  private pickupLoot(loot: DroppedLoot): void {
    const dist = Isometric.distance(this.playerGx, this.playerGy, loot.gx, loot.gy);
    if (dist > 1.8) {
      this.navigateToTile(loot.gx, loot.gy);
      return;
    }

    if (loot.item.type === 'GOLD') {
      soundManager.playGoldPickup();
      this.stats.gold += loot.item.goldAmount || 10;
      this.showDamageText(`+${loot.item.goldAmount} Gold`, this.playerSprite.x, this.playerSprite.y - 25, '#ffd700');
    } else {
      const placed = this.inventory.autoPlaceItem(loot.item);
      if (!placed) {
        this.showDamageText('Inventory Full!', this.playerSprite.x, this.playerSprite.y - 25, '#ff3333');
        return;
      }
      soundManager.playSwordSwing();
      this.showDamageText(`Picked up ${loot.item.name}`, this.playerSprite.x, this.playerSprite.y - 25, '#ffffff');
    }

    loot.sprite.destroy();
    loot.label.destroy();
    const idx = this.droppedLoot.indexOf(loot);
    if (idx !== -1) this.droppedLoot.splice(idx, 1);

    const ui = this.scene.get('UIScene') as UIScene;
    if (ui) {
      ui.updateHUDValues();
      ui.refreshInventoryUI();
    }
  }

  private interactChest(x: number, y: number, chestSpr: Phaser.GameObjects.Image): void {
    const dist = Isometric.distance(this.playerGx, this.playerGy, x, y);
    if (dist > 1.8) {
      this.navigateToTile(x, y);
      return;
    }

    const chestData = this.dungeon.chests.find(c => c.x === x && c.y === y);
    if (chestData && !chestData.opened) {
      chestData.opened = true;
      chestSpr.setTexture('chest_open');
      soundManager.playSwordSwing();

      // Drop 2 random items or gold
      this.spawnDroppedLoot(x, y, ItemGenerator.generateRandomDrop(this.floorLevel));
      this.spawnDroppedLoot(x + 0.4, y, ItemGenerator.createGold(35));
    }
  }

  private interactBarrel(x: number, y: number, barrelSpr: Phaser.GameObjects.Image): void {
    const dist = Isometric.distance(this.playerGx, this.playerGy, x, y);
    if (dist > 1.8) {
      this.navigateToTile(x, y);
      return;
    }

    const barrelData = this.dungeon.barrels.find(b => b.x === x && b.y === y);
    if (barrelData && !barrelData.broken) {
      barrelData.broken = true;
      barrelSpr.setTexture('barrel_broken');
      soundManager.playBoneCrack();

      // 50% chance of loot
      if (Math.random() < 0.5) {
        this.spawnDroppedLoot(x, y, ItemGenerator.generateRandomDrop(this.floorLevel));
      }
    }
  }

  private interactShrine(x: number, y: number): void {
    const dist = Isometric.distance(this.playerGx, this.playerGy, x, y);
    if (dist > 1.8) {
      this.navigateToTile(x, y);
      return;
    }

    const shrineData = this.dungeon.shrines.find(s => s.x === x && s.y === y);
    if (shrineData && !shrineData.used) {
      shrineData.used = true;
      soundManager.playLevelUp();
      this.stats.heal(50);
      this.stats.restoreMana(50);
      this.showDamageText(`${shrineData.shrineType}: Life & Mana Restored!`, this.playerSprite.x, this.playerSprite.y - 35, '#44ffaa');

      const ui = this.scene.get('UIScene') as UIScene;
      if (ui) ui.updateHUDValues();
    }
  }

  private checkStairs(): void {
    const distDown = Isometric.distance(this.playerGx, this.playerGy, this.dungeon.stairsDown.x, this.dungeon.stairsDown.y);
    if (distDown < 1.0) {
      // Descend to next floor
      soundManager.playSwordSwing();
      this.cameras.main.fade(600, 0, 0, 0, false, (_cam: unknown, progress: number) => {
        if (progress === 1) {
          this.scene.restart({
            floorLevel: this.floorLevel + 1,
            classType: this.classType,
            stats: this.stats,
            inventory: this.inventory,
            paperdoll: this.paperdoll
          });
        }
      });
      return;
    }

    const distUp = Isometric.distance(this.playerGx, this.playerGy, this.dungeon.stairsUp.x, this.dungeon.stairsUp.y);
    if (distUp < 1.0) {
      // Ascend to Town
      soundManager.playSwordSwing();
      this.cameras.main.fade(600, 0, 0, 0, false, (_cam: unknown, progress: number) => {
        if (progress === 1) {
          this.scene.start('TownScene', {
            classType: this.classType,
            stats: this.stats,
            inventory: this.inventory,
            paperdoll: this.paperdoll
          });
        }
      });
    }
  }

  // ==========================================
  // Game Loop Update
  // ==========================================

  public update(time: number, delta: number): void {
    // Attack cooldown & stun counters
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= delta;
      if (this.hitStunTimer <= 0) {
        this.isHitStunned = false;
        let pKey = 'hero_warrior';
        if (this.classType === 'ROGUE') pKey = 'hero_rogue';
        else if (this.classType === 'SORCERER') pKey = 'hero_sorcerer';
        this.playerSprite.play(`${pKey}_idle`, true);
      }
    }

    // Keyboard Movement
    this.handleKeyboardMovement(delta);

    // Path Movement
    if (this.isMoving && this.currentPath.length > 0 && !this.isHitStunned) {
      const next = this.currentPath[0];
      const targetScreen = Isometric.gridToScreen(next.x, next.y);
      const currentScreen = Isometric.gridToScreen(this.playerGx, this.playerGy);

      const dx = targetScreen.x - currentScreen.x;
      const dy = targetScreen.y - currentScreen.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const speed = 145 * (delta / 1000);

      if (dist <= speed) {
        this.playerGx = next.x;
        this.playerGy = next.y;
        this.currentPath.shift();

        // Recalculate FOV as player steps
        this.updateFOV();

        // Auto-pickup gold under feet
        this.checkGoldUnderfoot();

        if (this.currentPath.length === 0) {
          this.isMoving = false;
          let spriteKey = 'hero_warrior';
          if (this.classType === 'ROGUE') spriteKey = 'hero_rogue';
          else if (this.classType === 'SORCERER') spriteKey = 'hero_sorcerer';
          this.playerSprite.play(`${spriteKey}_idle`, true);

          this.checkStairs();
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
      this.playerSprite.setPosition(pPos.x, pPos.y - 12);
      this.playerSprite.setDepth(Isometric.calculateDepth(this.playerGx, this.playerGy, 20));
    }

    // Update Monsters & AI
    this.updateMonsters(time, delta);

    // Update Projectiles
    this.updateProjectiles(delta);
  }

  private handleKeyboardMovement(delta: number): void {
    if (!this.wasdKeys || this.isHitStunned || this.isAttacking) return;

    let dirX = 0;
    let dirY = 0;

    if (this.wasdKeys.W.isDown || this.cursors?.up.isDown) { dirX -= 1; dirY -= 1; }
    if (this.wasdKeys.S.isDown || this.cursors?.down.isDown) { dirX += 1; dirY += 1; }
    if (this.wasdKeys.A.isDown || this.cursors?.left.isDown) { dirX -= 1; dirY += 1; }
    if (this.wasdKeys.D.isDown || this.cursors?.right.isDown) { dirX += 1; dirY -= 1; }

    if (dirX !== 0 || dirY !== 0) {
      this.currentPath = [];
      const speed = 3.6 * (delta / 1000);
      const newGx = this.playerGx + dirX * speed;
      const newGy = this.playerGy + dirY * speed;

      if (this.isTileWalkable(Math.round(newGx), Math.round(newGy))) {
        this.playerGx = newGx;
        this.playerGy = newGy;
        const pPos = Isometric.gridToScreen(this.playerGx, this.playerGy);
        this.playerSprite.setPosition(pPos.x, pPos.y - 12);
        this.playerSprite.setDepth(Isometric.calculateDepth(this.playerGx, this.playerGy, 20));

        let spriteKey = 'hero_warrior';
        if (this.classType === 'ROGUE') spriteKey = 'hero_rogue';
        else if (this.classType === 'SORCERER') spriteKey = 'hero_sorcerer';
        this.playerSprite.play(`${spriteKey}_walk`, true);

        this.updateFOV();
        this.checkGoldUnderfoot();
        this.checkStairs();
      }
    }
  }

  private checkGoldUnderfoot(): void {
    const goldLoot = this.droppedLoot.filter(l =>
      l.item.type === 'GOLD' &&
      Math.abs(l.gx - this.playerGx) < 0.8 &&
      Math.abs(l.gy - this.playerGy) < 0.8
    );

    for (const g of goldLoot) {
      this.pickupLoot(g);
    }
  }

  private updateProjectiles(delta: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= delta;

      const dt = delta / 1000;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;

      const gridPos = Isometric.screenToGrid(p.sprite.x, p.sprite.y);
      p.gx = gridPos.x;
      p.gy = gridPos.y;

      // Check wall collision
      const tx = Math.round(p.gx);
      const ty = Math.round(p.gy);
      if (!this.isTileWalkable(tx, ty)) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check combatant collisions
      if (p.isPlayerSpell) {
        // Hits Monster
        const hitMonster = this.findMonsterAt(p.gx, p.gy, 0.9);
        if (hitMonster) {
          p.sprite.destroy();
          this.projectiles.splice(i, 1);

          soundManager.playFleshHit();
          const killed = hitMonster.takeDamage(p.damage, 300);
          this.showDamageText(`${p.damage}`, hitMonster.x, hitMonster.y, '#ffea00');
          this.updateMonsterHpBar(hitMonster);

          if (killed) {
            this.handleMonsterDeath(hitMonster);
          }
          continue;
        }
      } else {
        // Monster projectile hits Player
        const dist = Isometric.distance(p.gx, p.gy, this.playerGx, this.playerGy);
        if (dist <= 0.8) {
          p.sprite.destroy();
          this.projectiles.splice(i, 1);

          soundManager.playFleshHit();
          this.stats.takeDamage(p.damage);
          const ui = this.scene.get('UIScene') as UIScene;
          if (ui) ui.updateHUDValues();
          this.showDamageText(`-${p.damage}`, this.playerSprite.x, this.playerSprite.y - 20, '#ff2222');

          if (this.stats.currentHp <= 0) {
            this.handlePlayerDeath();
          }
          continue;
        }
      }

      if (p.lifetime <= 0) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private findMonsterAt(gx: number, gy: number, radius: number = 0.8): MonsterEntity | null {
    for (const m of this.monsters) {
      if (m.state === 'DEAD') continue;
      const d = Isometric.distance(m.x, m.y, gx, gy);
      if (d <= radius) return m;
    }
    return null;
  }

  private findClosestMonster(maxRange: number = 1.5): MonsterEntity | null {
    let closest: MonsterEntity | null = null;
    let minDist = maxRange;
    for (const m of this.monsters) {
      if (m.state === 'DEAD') continue;
      const d = Isometric.distance(m.x, m.y, this.playerGx, this.playerGy);
      if (d < minDist) {
        minDist = d;
        closest = m;
      }
    }
    return closest;
  }

  private showDamageText(text: string, x: number, y: number, color: string = '#ffffff'): void {
    const fText = this.add.text(x, y, text, {
      fontSize: '13px',
      color: color,
      fontStyle: 'bold',
      fontFamily: 'serif',
      shadow: { color: '#000000', blur: 3, fill: true }
    }).setOrigin(0.5).setDepth(2500);

    this.tweens.add({
      targets: fText,
      y: y - 25,
      alpha: 0,
      duration: 900,
      onComplete: () => fText.destroy()
    });
  }

  public createItemTemplate(name: string): ItemData {
    return ItemGenerator.createItemFromTemplate(name);
  }
}
