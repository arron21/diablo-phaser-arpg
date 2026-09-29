import * as Phaser from 'phaser';

/**
 * Procedural pixel-art texture generator for Diablo ARPG
 * Synthesizes retro gothic sprites, isometric tiles, monsters, and UI orbs directly onto HTML5 canvases
 */
export class ProceduralTextures {
  public static generateAll(scene: Phaser.Scene): void {
    const tm = scene.textures;

    // 1. Isometric Environment Tiles
    this.createFloorTile(tm, 'tile_floor', false);
    this.createFloorTile(tm, 'tile_floor_blood', true);
    this.createTownGrassTile(tm, 'tile_town_grass');
    this.createTownDirtTile(tm, 'tile_town_dirt');
    this.createWallTile(tm, 'tile_wall');
    this.createDoorTile(tm, 'tile_door_closed', false);
    this.createDoorTile(tm, 'tile_door_open', true);
    this.createStairsTile(tm, 'tile_stairs_down', false);
    this.createStairsTile(tm, 'tile_stairs_up', true);

    // 2. Interactables & Objects
    this.createShrineTexture(tm, 'shrine');
    this.createChestTexture(tm, 'chest_closed', false);
    this.createChestTexture(tm, 'chest_open', true);
    this.createBarrelTexture(tm, 'barrel', false);
    this.createBarrelTexture(tm, 'barrel_broken', true);
    this.createPortalTexture(tm, 'town_portal');

    // 3. Characters & Monsters
    this.createHeroWarriorSpritesheet(tm);
    this.createHeroRogueSpritesheet(tm);
    this.createHeroSorcererSpritesheet(tm);
    this.createMonsterFallenSpritesheet(tm);
    this.createMonsterSkeletonSpritesheet(tm);
    this.createMonsterArcherSpritesheet(tm);
    this.createMonsterButcherSpritesheet(tm);

    // 4. NPCs
    this.createNPCTexture(tm, 'npc_griswold', '#8c3d1d', '#555555', 'Griswold');
    this.createNPCTexture(tm, 'npc_pepin', '#4466aa', '#eeddbb', 'Pepin');
    this.createNPCTexture(tm, 'npc_adria', '#552277', '#aa55ee', 'Adria');
    this.createNPCTexture(tm, 'npc_cain', '#776655', '#ffffff', 'Cain');

    // 5. Projectiles & Decals
    this.createProjectileTextures(tm);

    // 6. UI & HUD Elements
    this.createUIElements(tm);
    this.createItemIcons(tm);
  }

  // ==========================================
  // Isometric Environment
  // ==========================================

  private static createFloorTile(tm: Phaser.Textures.TextureManager, key: string, blood: boolean): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // 2:1 Isometric Diamond (Top: 32,0; Right: 64,16; Bottom: 32,32; Left: 0,16)
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();

    ctx.fillStyle = blood ? '#2b1212' : '#222026';
    ctx.fill();

    // Stone texture / cracks
    ctx.strokeStyle = blood ? '#5a1515' : '#35323a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Slabs & cracks
    ctx.strokeStyle = blood ? '#401010' : '#18161c';
    ctx.beginPath();
    ctx.moveTo(20, 10);
    ctx.lineTo(35, 18);
    ctx.lineTo(44, 14);
    ctx.stroke();

    if (blood) {
      ctx.fillStyle = '#800a0a';
      ctx.beginPath();
      ctx.arc(32, 16, 8, 0, Math.PI * 2);
      ctx.arc(24, 20, 4, 0, Math.PI * 2);
      ctx.arc(42, 14, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    tm.addCanvas(key, canvas);
  }

  private static createTownGrassTile(tm: Phaser.Textures.TextureManager, key: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();

    ctx.fillStyle = '#1e2617';
    ctx.fill();
    ctx.strokeStyle = '#2d3822';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Grass blades
    ctx.fillStyle = '#3f4f30';
    for (let i = 0; i < 6; i++) {
      const rx = 16 + (i * 7);
      const ry = 10 + (i % 3) * 4;
      ctx.fillRect(rx, ry, 2, 3);
    }

    tm.addCanvas(key, canvas);
  }

  private static createTownDirtTile(tm: Phaser.Textures.TextureManager, key: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();

    ctx.fillStyle = '#3a2e22';
    ctx.fill();
    ctx.strokeStyle = '#4e3e2e';
    ctx.lineWidth = 1;
    ctx.stroke();

    tm.addCanvas(key, canvas);
  }

  private static createWallTile(tm: Phaser.Textures.TextureManager, key: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Isometric Wall block:
    // Top Diamond: (32, 0), (64, 16), (32, 32), (0, 16)
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fillStyle = '#3c3a44';
    ctx.fill();
    ctx.strokeStyle = '#555260';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left Facade: (0, 16) to (32, 32) down to (32, 64) and (0, 48)
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(32, 64);
    ctx.lineTo(0, 48);
    ctx.closePath();
    ctx.fillStyle = '#26242c';
    ctx.fill();
    ctx.strokeStyle = '#1a1820';
    ctx.stroke();

    // Right Facade: (32, 32) to (64, 16) down to (64, 48) and (32, 64)
    ctx.beginPath();
    ctx.moveTo(32, 32);
    ctx.lineTo(64, 16);
    ctx.lineTo(64, 48);
    ctx.lineTo(32, 64);
    ctx.closePath();
    ctx.fillStyle = '#1c1a22';
    ctx.fill();
    ctx.strokeStyle = '#121116';
    ctx.stroke();

    // Brick mortar lines
    ctx.strokeStyle = '#121016';
    ctx.lineWidth = 1;
    // Left bricks
    ctx.beginPath();
    ctx.moveTo(0, 26); ctx.lineTo(32, 42);
    ctx.moveTo(0, 37); ctx.lineTo(32, 53);
    // Right bricks
    ctx.moveTo(32, 42); ctx.lineTo(64, 26);
    ctx.moveTo(32, 53); ctx.lineTo(64, 37);
    ctx.stroke();

    tm.addCanvas(key, canvas);
  }

  private static createDoorTile(tm: Phaser.Textures.TextureManager, key: string, open: boolean): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Draw archway
    ctx.fillStyle = '#3a2414';
    if (!open) {
      // Closed gothic heavy wooden door
      ctx.beginPath();
      ctx.moveTo(16, 24);
      ctx.lineTo(48, 40);
      ctx.lineTo(48, 64);
      ctx.lineTo(16, 48);
      ctx.closePath();
      ctx.fill();

      // Iron studs and hinges
      ctx.fillStyle = '#888899';
      ctx.fillRect(20, 32, 3, 3);
      ctx.fillRect(44, 44, 3, 3);
      ctx.fillRect(20, 44, 3, 3);
      ctx.fillRect(44, 56, 3, 3);
    } else {
      // Open door passage
      ctx.fillStyle = '#110c08';
      ctx.beginPath();
      ctx.moveTo(16, 24);
      ctx.lineTo(48, 40);
      ctx.lineTo(48, 64);
      ctx.lineTo(16, 48);
      ctx.closePath();
      ctx.fill();

      // Open wooden swing panel
      ctx.fillStyle = '#4a301a';
      ctx.fillRect(10, 32, 6, 28);
    }

    tm.addCanvas(key, canvas);
  }

  private static createStairsTile(tm: Phaser.Textures.TextureManager, key: string, up: boolean): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // Isometric Diamond outline
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(64, 16);
    ctx.lineTo(32, 32);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fillStyle = up ? '#323640' : '#14141a';
    ctx.fill();

    // Steps
    ctx.strokeStyle = up ? '#556688' : '#222233';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      const offset = i * 4;
      ctx.beginPath();
      ctx.moveTo(32 - offset, 16 - offset / 2);
      ctx.lineTo(32 + offset, 16 + offset / 2);
      ctx.stroke();
    }

    tm.addCanvas(key, canvas);
  }

  private static createShrineTexture(tm: Phaser.Textures.TextureManager, key: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 54;
    const ctx = canvas.getContext('2d')!;

    // Marble Altar Base
    ctx.fillStyle = '#444455';
    ctx.fillRect(12, 36, 24, 16);

    // Glowing Obelisk
    ctx.fillStyle = '#667799';
    ctx.beginPath();
    ctx.moveTo(24, 4);
    ctx.lineTo(32, 36);
    ctx.lineTo(16, 36);
    ctx.closePath();
    ctx.fill();

    // Glowing mystic rune
    ctx.strokeStyle = '#44eeff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(24, 22, 5, 0, Math.PI * 2);
    ctx.moveTo(24, 14);
    ctx.lineTo(24, 30);
    ctx.stroke();

    tm.addCanvas(key, canvas);
  }

  private static createChestTexture(tm: Phaser.Textures.TextureManager, key: string, open: boolean): void {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#5a3d24'; // Wood
    ctx.fillRect(4, 12, 24, 16);

    ctx.strokeStyle = '#c29a4a'; // Gold/Iron trim
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 12, 24, 16);

    if (open) {
      // Open lid
      ctx.fillStyle = '#3a2412';
      ctx.fillRect(4, 4, 24, 8);
      // Gold gleaming inside
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(16, 15, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Closed latch
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(14, 18, 4, 5);
    }

    tm.addCanvas(key, canvas);
  }

  private static createBarrelTexture(tm: Phaser.Textures.TextureManager, key: string, broken: boolean): void {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    if (!broken) {
      ctx.fillStyle = '#6b4724';
      ctx.beginPath();
      ctx.ellipse(16, 16, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Iron hoops
      ctx.strokeStyle = '#444450';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, 10); ctx.lineTo(26, 10);
      ctx.moveTo(6, 22); ctx.lineTo(26, 22);
      ctx.stroke();
    } else {
      // Broken staves
      ctx.fillStyle = '#4a2f15';
      ctx.fillRect(6, 20, 6, 10);
      ctx.fillRect(14, 22, 12, 6);
      ctx.fillRect(10, 24, 8, 4);
    }

    tm.addCanvas(key, canvas);
  }

  private static createPortalTexture(tm: Phaser.Textures.TextureManager, key: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Mystic swirling blue portal oval
    const grad = ctx.createRadialGradient(24, 32, 2, 24, 32, 22);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#33aaff');
    grad.addColorStop(0.7, '#1144bb');
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(24, 32, 18, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    tm.addCanvas(key, canvas);
  }

  // ==========================================
  // Spritesheets: Characters & Monsters
  // ==========================================

  private static createHeroWarriorSpritesheet(tm: Phaser.Textures.TextureManager): void {
    const frameW = 48;
    const frameH = 48;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * 4; // 4 frames: Idle, Walk, Attack, Hit
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    // Frame 0: Idle
    this.drawWarriorFrame(ctx, 0 * frameW, 0, 0, false, false);
    // Frame 1: Walk
    this.drawWarriorFrame(ctx, 1 * frameW, 0, 2, false, false);
    // Frame 2: Attack
    this.drawWarriorFrame(ctx, 2 * frameW, 0, 0, true, false);
    this.registerCanvasSpritesheet(tm, 'hero_warrior', canvas, frameW, frameH, 4);
  }

  private static registerCanvasSpritesheet(
    tm: Phaser.Textures.TextureManager,
    key: string,
    canvas: HTMLCanvasElement,
    frameW: number,
    frameH: number,
    frameCount: number = 4
  ): void {
    const tex = tm.addCanvas(key, canvas);
    if (tex) {
      for (let i = 0; i < frameCount; i++) {
        tex.add(i, 0, i * frameW, 0, frameW, frameH);
      }
    }
  }

  private static drawWarriorFrame(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    legOffset: number,
    isAttack: boolean,
    isHit: boolean
  ): void {
    const cx = ox + 24;
    const cy = oy + 28;

    // Body armor (Steel chest)
    ctx.fillStyle = isHit ? '#bb3333' : '#68707c';
    ctx.fillRect(cx - 7, cy - 10, 14, 16);

    // Horned Helm
    ctx.fillStyle = isHit ? '#cc4444' : '#8a94a2';
    ctx.beginPath();
    ctx.arc(cx, cy - 14, 7, 0, Math.PI * 2);
    ctx.fill();
    // Horns
    ctx.fillStyle = '#ddccaa';
    ctx.fillRect(cx - 9, cy - 18, 3, 5);
    ctx.fillRect(cx + 6, cy - 18, 3, 5);

    // Legs / Greaves
    ctx.fillStyle = '#4f555e';
    ctx.fillRect(cx - 6, cy + 6, 5, 10 + legOffset);
    ctx.fillRect(cx + 1, cy + 6, 5, 10 - legOffset);

    // Shield (Offhand left)
    ctx.fillStyle = '#8b6932'; // Gold rim
    ctx.beginPath();
    ctx.arc(cx - 10, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a4b60'; // Blue shield crest
    ctx.beginPath();
    ctx.arc(cx - 10, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Sword (Main hand right)
    ctx.strokeStyle = '#d6e0ea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (isAttack) {
      ctx.moveTo(cx + 6, cy - 4);
      ctx.lineTo(cx + 20, cy + 8); // Swing down
    } else {
      ctx.moveTo(cx + 8, cy);
      ctx.lineTo(cx + 16, cy - 14); // Ready up
    }
    ctx.stroke();

    // Gold crossguard
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(cx + 7, cy - 2, 4, 3);
  }

  private static createHeroRogueSpritesheet(tm: Phaser.Textures.TextureManager): void {
    const frameW = 48;
    const frameH = 48;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * 4;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    for (let f = 0; f < 4; f++) {
      const ox = f * frameW;
      const cx = ox + 24;
      const cy = 28;
      const isHit = f === 3;
      const isAttack = f === 2;

      // Leather Armor
      ctx.fillStyle = isHit ? '#aa3333' : '#6b4728';
      ctx.fillRect(cx - 5, cy - 8, 10, 14);

      // Red Hooded Cowl
      ctx.fillStyle = isHit ? '#cc4444' : '#8f2323';
      ctx.beginPath();
      ctx.arc(cx, cy - 13, 6, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.fillStyle = '#422e1b';
      ctx.fillRect(cx - 4, cy + 6, 3, 9 + (f === 1 ? 2 : 0));
      ctx.fillRect(cx + 1, cy + 6, 3, 9 - (f === 1 ? 2 : 0));

      // Bow
      ctx.strokeStyle = '#cda250';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (isAttack) {
        ctx.arc(cx + 12, cy, 10, -Math.PI / 2, Math.PI / 2);
        // Arrow
        ctx.strokeStyle = '#ffffff';
        ctx.moveTo(cx + 4, cy);
        ctx.lineTo(cx + 18, cy);
      } else {
        ctx.arc(cx + 8, cy - 2, 8, -Math.PI / 2, Math.PI / 2);
      }
      ctx.stroke();
    }

    this.registerCanvasSpritesheet(tm, 'hero_rogue', canvas, frameW, frameH, 4);
  }

  private static createHeroSorcererSpritesheet(tm: Phaser.Textures.TextureManager): void {
    const frameW = 48;
    const frameH = 48;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * 4;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    for (let f = 0; f < 4; f++) {
      const ox = f * frameW;
      const cx = ox + 24;
      const cy = 28;
      const isHit = f === 3;
      const isAttack = f === 2;

      // Blue Mystic Robes
      ctx.fillStyle = isHit ? '#aa2244' : '#1d3268';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 8);
      ctx.lineTo(cx + 5, cy - 8);
      ctx.lineTo(cx + 8, cy + 15);
      ctx.lineTo(cx - 8, cy + 15);
      ctx.closePath();
      ctx.fill();

      // Hood
      ctx.fillStyle = isHit ? '#cc3355' : '#27448c';
      ctx.beginPath();
      ctx.arc(cx, cy - 13, 6, 0, Math.PI * 2);
      ctx.fill();

      // Rune Staff
      ctx.strokeStyle = '#82542a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + 9, cy + 14);
      ctx.lineTo(cx + 9, cy - 18);
      ctx.stroke();

      // Glowing Orb on Staff Top
      ctx.fillStyle = isAttack ? '#ff8800' : '#44ddff';
      ctx.beginPath();
      ctx.arc(cx + 9, cy - 19, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    this.registerCanvasSpritesheet(tm, 'hero_sorcerer', canvas, frameW, frameH, 4);
  }

  private static createMonsterFallenSpritesheet(tm: Phaser.Textures.TextureManager): void {
    const frameW = 36;
    const frameH = 36;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * 4;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    for (let f = 0; f < 4; f++) {
      const ox = f * frameW;
      const cx = ox + 18;
      const cy = 20;

      // Red Imp Body
      ctx.fillStyle = f === 3 ? '#ffffff' : '#b22222';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.fillStyle = '#441111';
      ctx.fillRect(cx - 6, cy - 11, 2, 4);
      ctx.fillRect(cx + 4, cy - 11, 2, 4);

      // Yellow Eyes
      ctx.fillStyle = '#ffea00';
      ctx.fillRect(cx - 3, cy - 2, 2, 2);
      ctx.fillRect(cx + 2, cy - 2, 2, 2);

      // Crude dagger
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 6, cy + 2);
      ctx.lineTo(cx + 12, cy - 4);
      ctx.stroke();
    }

    this.registerCanvasSpritesheet(tm, 'monster_fallen', canvas, frameW, frameH, 4);
  }

  private static createMonsterSkeletonSpritesheet(tm: Phaser.Textures.TextureManager): void {
    const frameW = 48;
    const frameH = 48;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * 4;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    for (let f = 0; f < 4; f++) {
      const ox = f * frameW;
      const cx = ox + 24;
      const cy = 26;

      // Skull
      ctx.fillStyle = '#e8e4d8';
      ctx.beginPath();
      ctx.arc(cx, cy - 12, 6, 0, Math.PI * 2);
      ctx.fill();
      // Eye sockets
      ctx.fillStyle = '#111111';
      ctx.fillRect(cx - 3, cy - 13, 2, 2);
      ctx.fillRect(cx + 1, cy - 13, 2, 2);

      // Spine & Ribs
      ctx.strokeStyle = '#e8e4d8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx, cy + 6); // spine
      ctx.moveTo(cx - 5, cy - 2); ctx.lineTo(cx + 5, cy - 2); // rib 1
      ctx.moveTo(cx - 4, cy + 2); ctx.lineTo(cx + 4, cy + 2); // rib 2
      // Legs
      ctx.moveTo(cx - 3, cy + 6); ctx.lineTo(cx - 4, cy + 16);
      ctx.moveTo(cx + 3, cy + 6); ctx.lineTo(cx + 4, cy + 16);
      ctx.stroke();

      // Rusty Scimitar
      ctx.strokeStyle = '#9c6f50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (f === 2) {
        ctx.moveTo(cx + 5, cy);
        ctx.lineTo(cx + 18, cy + 8);
      } else {
        ctx.moveTo(cx + 6, cy);
        ctx.lineTo(cx + 14, cy - 10);
      }
      ctx.stroke();
    }

    this.registerCanvasSpritesheet(tm, 'monster_skeleton', canvas, frameW, frameH, 4);
  }

  private static createMonsterArcherSpritesheet(tm: Phaser.Textures.TextureManager): void {
    const frameW = 48;
    const frameH = 48;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * 4;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    for (let f = 0; f < 4; f++) {
      const ox = f * frameW;
      const cx = ox + 24;
      const cy = 26;

      // Skull
      ctx.fillStyle = '#dedad0';
      ctx.beginPath();
      ctx.arc(cx, cy - 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111111';
      ctx.fillRect(cx - 3, cy - 13, 2, 2);
      ctx.fillRect(cx + 1, cy - 13, 2, 2);

      // Ribs
      ctx.strokeStyle = '#dedad0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6);
      ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy);
      ctx.moveTo(cx - 3, cy + 6); ctx.lineTo(cx - 4, cy + 16);
      ctx.moveTo(cx + 3, cy + 6); ctx.lineTo(cx + 4, cy + 16);
      ctx.stroke();

      // Bone Bow
      ctx.strokeStyle = '#c2baa8';
      ctx.beginPath();
      ctx.arc(cx + 8, cy, 8, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    this.registerCanvasSpritesheet(tm, 'monster_archer', canvas, frameW, frameH, 4);
  }

  private static createMonsterButcherSpritesheet(tm: Phaser.Textures.TextureManager): void {
    const frameW = 64;
    const frameH = 64;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * 4;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;

    for (let f = 0; f < 4; f++) {
      const ox = f * frameW;
      const cx = ox + 32;
      const cy = 34;
      const isAttack = f === 2;
      const isHit = f === 3;

      // Hulking Red Demonic Body
      ctx.fillStyle = isHit ? '#ffffff' : '#881b1b';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bloodstained Butcher Apron
      ctx.fillStyle = '#b8aa90';
      ctx.fillRect(cx - 10, cy - 10, 20, 26);
      // Blood splatters on apron
      ctx.fillStyle = '#800000';
      ctx.fillRect(cx - 6, cy - 4, 8, 12);
      ctx.fillRect(cx + 2, cy + 8, 6, 6);

      // Ugly horned head
      ctx.fillStyle = '#a62424';
      ctx.beginPath();
      ctx.arc(cx, cy - 18, 10, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.fillStyle = '#220808';
      ctx.fillRect(cx - 12, cy - 26, 4, 8);
      ctx.fillRect(cx + 8, cy - 26, 4, 8);

      // Glowing evil red eyes
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(cx - 5, cy - 19, 3, 2);
      ctx.fillRect(cx + 2, cy - 19, 3, 2);

      // Gigantic Meat Cleaver
      ctx.fillStyle = '#a8b0b8'; // Steel blade
      if (isAttack) {
        ctx.fillRect(cx + 12, cy, 14, 22);
        ctx.fillStyle = '#8b0000'; // Bloody blade edge
        ctx.fillRect(cx + 24, cy, 4, 22);
      } else {
        ctx.fillRect(cx + 14, cy - 22, 14, 22);
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(cx + 26, cy - 22, 4, 22);
      }
    }

    this.registerCanvasSpritesheet(tm, 'monster_butcher', canvas, frameW, frameH, 4);
  }

  private static createNPCTexture(
    tm: Phaser.Textures.TextureManager,
    key: string,
    robeColor: string,
    headColor: string,
    _name: string
  ): void {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;

    // Robe
    ctx.fillStyle = robeColor;
    ctx.beginPath();
    ctx.moveTo(18, 18);
    ctx.lineTo(30, 18);
    ctx.lineTo(34, 44);
    ctx.lineTo(14, 44);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(24, 12, 7, 0, Math.PI * 2);
    ctx.fill();

    tm.addCanvas(key, canvas);
  }

  // ==========================================
  // Projectiles & VFX
  // ==========================================

  private static createProjectileTextures(tm: Phaser.Textures.TextureManager): void {
    // Firebolt
    const cFire = document.createElement('canvas');
    cFire.width = 16; cFire.height = 16;
    const ctxF = cFire.getContext('2d')!;
    const fGrad = ctxF.createRadialGradient(8, 8, 1, 8, 8, 8);
    fGrad.addColorStop(0, '#ffffff');
    fGrad.addColorStop(0.3, '#ffaa00');
    fGrad.addColorStop(0.8, '#ff2200');
    fGrad.addColorStop(1, 'transparent');
    ctxF.fillStyle = fGrad;
    ctxF.fillRect(0, 0, 16, 16);
    tm.addCanvas('spell_firebolt', cFire);

    // Charged Bolt
    const cSpark = document.createElement('canvas');
    cSpark.width = 14; cSpark.height = 14;
    const ctxS = cSpark.getContext('2d')!;
    ctxS.strokeStyle = '#44ffff';
    ctxS.lineWidth = 2;
    ctxS.beginPath();
    ctxS.moveTo(2, 2); ctxS.lineTo(8, 6); ctxS.lineTo(4, 8); ctxS.lineTo(12, 12);
    ctxS.stroke();
    tm.addCanvas('spell_charged_bolt', cSpark);

    // Holy Bolt
    const cHoly = document.createElement('canvas');
    cHoly.width = 20; cHoly.height = 20;
    const ctxH = cHoly.getContext('2d')!;
    const hGrad = ctxH.createRadialGradient(10, 10, 2, 10, 10, 10);
    hGrad.addColorStop(0, '#ffffff');
    hGrad.addColorStop(0.5, '#ffee66');
    hGrad.addColorStop(1, 'transparent');
    ctxH.fillStyle = hGrad;
    ctxH.fillRect(0, 0, 20, 20);
    tm.addCanvas('spell_holy_bolt', cHoly);

    // Arrow
    const cArr = document.createElement('canvas');
    cArr.width = 16; cArr.height = 16;
    const ctxA = cArr.getContext('2d')!;
    ctxA.strokeStyle = '#c8b282';
    ctxA.lineWidth = 2;
    ctxA.beginPath();
    ctxA.moveTo(2, 8); ctxA.lineTo(14, 8);
    ctxA.stroke();
    ctxA.fillStyle = '#666666';
    ctxA.fillRect(12, 6, 4, 4);
    tm.addCanvas('proj_arrow', cArr);
  }

  // ==========================================
  // UI & Orbs
  // ==========================================

  private static createUIElements(tm: Phaser.Textures.TextureManager): void {
    // Red Life Globe
    const cLife = document.createElement('canvas');
    cLife.width = 80; cLife.height = 80;
    const ctxL = cLife.getContext('2d')!;
    // Blood fluid
    const gradL = ctxL.createRadialGradient(35, 35, 5, 40, 40, 36);
    gradL.addColorStop(0, '#ff4444');
    gradL.addColorStop(0.6, '#b30d0d');
    gradL.addColorStop(1, '#4a0404');
    ctxL.fillStyle = gradL;
    ctxL.beginPath();
    ctxL.arc(40, 40, 36, 0, Math.PI * 2);
    ctxL.fill();
    // Glass highlight shine
    ctxL.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctxL.beginPath();
    ctxL.ellipse(28, 24, 14, 8, -Math.PI / 4, 0, Math.PI * 2);
    ctxL.fill();
    // Dark stone ring
    ctxL.strokeStyle = '#2b231c';
    ctxL.lineWidth = 4;
    ctxL.stroke();
    tm.addCanvas('globe_life', cLife);

    // Blue Mana Globe
    const cMana = document.createElement('canvas');
    cMana.width = 80; cMana.height = 80;
    const ctxM = cMana.getContext('2d')!;
    const gradM = ctxM.createRadialGradient(35, 35, 5, 40, 40, 36);
    gradM.addColorStop(0, '#55aaff');
    gradM.addColorStop(0.6, '#0f4ab8');
    gradM.addColorStop(1, '#05184a');
    ctxM.fillStyle = gradM;
    ctxM.beginPath();
    ctxM.arc(40, 40, 36, 0, Math.PI * 2);
    ctxM.fill();
    // Glass shine
    ctxM.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctxM.beginPath();
    ctxM.ellipse(28, 24, 14, 8, -Math.PI / 4, 0, Math.PI * 2);
    ctxM.fill();
    ctxM.strokeStyle = '#2b231c';
    ctxM.lineWidth = 4;
    ctxM.stroke();
    tm.addCanvas('globe_mana', cMana);

    // Belt slot (30x30)
    const cSlot = document.createElement('canvas');
    cSlot.width = 30; cSlot.height = 30;
    const ctxS = cSlot.getContext('2d')!;
    ctxS.fillStyle = '#141118';
    ctxS.fillRect(0, 0, 30, 30);
    ctxS.strokeStyle = '#44382c';
    ctxS.lineWidth = 2;
    ctxS.strokeRect(1, 1, 28, 28);
    tm.addCanvas('belt_slot', cSlot);

    // Inventory Grid Cell (28x28)
    const cGrid = document.createElement('canvas');
    cGrid.width = 28; cGrid.height = 28;
    const ctxG = cGrid.getContext('2d')!;
    ctxG.fillStyle = '#120f14';
    ctxG.fillRect(0, 0, 28, 28);
    ctxG.strokeStyle = '#2d241d';
    ctxG.lineWidth = 1;
    ctxG.strokeRect(0, 0, 28, 28);
    tm.addCanvas('inv_slot', cGrid);
  }

  private static createItemIcons(tm: Phaser.Textures.TextureManager): void {
    const icons: { key: string; color: string; draw: (ctx: CanvasRenderingContext2D) => void }[] = [
      {
        key: 'icon_club',
        color: '#8b5a2b',
        draw: (ctx) => {
          ctx.fillRect(8, 4, 10, 20);
          ctx.fillRect(11, 22, 4, 8);
        }
      },
      {
        key: 'icon_short_sword',
        color: '#c2cad4',
        draw: (ctx) => {
          ctx.lineWidth = 3; ctx.strokeStyle = '#c2cad4';
          ctx.beginPath(); ctx.moveTo(8, 24); ctx.lineTo(20, 6); ctx.stroke();
          ctx.fillStyle = '#d4af37'; ctx.fillRect(6, 20, 6, 3);
        }
      },
      {
        key: 'icon_broadsword',
        color: '#e0e6ed',
        draw: (ctx) => {
          ctx.lineWidth = 5; ctx.strokeStyle = '#e0e6ed';
          ctx.beginPath(); ctx.moveTo(6, 26); ctx.lineTo(24, 4); ctx.stroke();
          ctx.fillStyle = '#d4af37'; ctx.fillRect(4, 22, 9, 4);
        }
      },
      {
        key: 'icon_axe',
        color: '#888899',
        draw: (ctx) => {
          ctx.strokeStyle = '#6e451b'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(6, 26); ctx.lineTo(22, 6); ctx.stroke();
          ctx.fillStyle = '#a8b0ba'; ctx.beginPath();
          ctx.arc(20, 8, 8, -Math.PI / 2, Math.PI / 2); ctx.fill();
        }
      },
      {
        key: 'icon_cleaver',
        color: '#b01010',
        draw: (ctx) => {
          ctx.fillStyle = '#442812'; ctx.fillRect(6, 20, 5, 8); // handle
          ctx.fillStyle = '#9aa2aa'; ctx.fillRect(10, 6, 16, 18); // blade
          ctx.fillStyle = '#8b0000'; ctx.fillRect(22, 6, 4, 18); // blood edge
        }
      },
      {
        key: 'icon_short_bow',
        color: '#b08848',
        draw: (ctx) => {
          ctx.strokeStyle = '#b08848'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(14, 16, 12, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        }
      },
      {
        key: 'icon_bow',
        color: '#c49a56',
        draw: (ctx) => {
          ctx.strokeStyle = '#c49a56'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(12, 16, 13, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        }
      },
      {
        key: 'icon_staff',
        color: '#654321',
        draw: (ctx) => {
          ctx.strokeStyle = '#7c532b'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(6, 26); ctx.lineTo(22, 6); ctx.stroke();
          ctx.fillStyle = '#22ccff'; ctx.beginPath(); ctx.arc(22, 6, 4, 0, Math.PI * 2); ctx.fill();
        }
      },
      {
        key: 'icon_buckler',
        color: '#8b6932',
        draw: (ctx) => {
          ctx.fillStyle = '#8b6932'; ctx.beginPath(); ctx.arc(16, 16, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#445566'; ctx.beginPath(); ctx.arc(16, 16, 7, 0, Math.PI * 2); ctx.fill();
        }
      },
      {
        key: 'icon_kite_shield',
        color: '#9ba4b0',
        draw: (ctx) => {
          ctx.fillStyle = '#4f6078';
          ctx.beginPath(); ctx.moveTo(8, 6); ctx.lineTo(24, 6); ctx.lineTo(16, 26); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.stroke();
        }
      },
      {
        key: 'icon_cap',
        color: '#705030',
        draw: (ctx) => {
          ctx.fillStyle = '#705030'; ctx.beginPath(); ctx.arc(16, 16, 9, Math.PI, 0); ctx.fill();
        }
      },
      {
        key: 'icon_helm',
        color: '#8892a0',
        draw: (ctx) => {
          ctx.fillStyle = '#8892a0'; ctx.fillRect(8, 8, 16, 16);
          ctx.fillStyle = '#111111'; ctx.fillRect(10, 14, 12, 3);
        }
      },
      {
        key: 'icon_rags',
        color: '#554433',
        draw: (ctx) => {
          ctx.fillStyle = '#554433'; ctx.fillRect(8, 8, 16, 18);
        }
      },
      {
        key: 'icon_leather_armor',
        color: '#7d532a',
        draw: (ctx) => {
          ctx.fillStyle = '#7d532a'; ctx.fillRect(8, 6, 16, 20);
          ctx.strokeStyle = '#4a2f14'; ctx.strokeRect(8, 6, 16, 20);
        }
      },
      {
        key: 'icon_chain_mail',
        color: '#7c8694',
        draw: (ctx) => {
          ctx.fillStyle = '#7c8694'; ctx.fillRect(8, 6, 16, 20);
          ctx.fillStyle = '#4e5662';
          for (let r = 8; r < 24; r += 4) ctx.fillRect(10, r, 12, 2);
        }
      },
      {
        key: 'icon_plate_mail',
        color: '#a8b4c4',
        draw: (ctx) => {
          ctx.fillStyle = '#a8b4c4'; ctx.fillRect(6, 6, 20, 22);
          ctx.strokeStyle = '#e0e6ed'; ctx.lineWidth = 2; ctx.strokeRect(6, 6, 20, 22);
        }
      },
      {
        key: 'icon_ring',
        color: '#ffd700',
        draw: (ctx) => {
          ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(16, 16, 7, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#ff2222'; ctx.beginPath(); ctx.arc(16, 9, 3, 0, Math.PI * 2); ctx.fill();
        }
      },
      {
        key: 'icon_amulet',
        color: '#44aaff',
        draw: (ctx) => {
          ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(16, 12, 8, 0, Math.PI); ctx.stroke();
          ctx.fillStyle = '#33aaff'; ctx.beginPath(); ctx.arc(16, 20, 4, 0, Math.PI * 2); ctx.fill();
        }
      },
      {
        key: 'icon_potion_red',
        color: '#ff2222',
        draw: (ctx) => {
          ctx.fillStyle = '#ff2222';
          ctx.beginPath(); ctx.arc(16, 18, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.fillRect(14, 6, 4, 5);
        }
      },
      {
        key: 'icon_potion_blue',
        color: '#2266ff',
        draw: (ctx) => {
          ctx.fillStyle = '#2266ff';
          ctx.beginPath(); ctx.arc(16, 18, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.fillRect(14, 6, 4, 5);
        }
      },
      {
        key: 'icon_potion_purple',
        color: '#aa22ee',
        draw: (ctx) => {
          ctx.fillStyle = '#aa22ee';
          ctx.beginPath(); ctx.arc(16, 18, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.fillRect(14, 6, 4, 5);
        }
      },
      {
        key: 'icon_scroll',
        color: '#e8dcbe',
        draw: (ctx) => {
          ctx.fillStyle = '#e8dcbe'; ctx.fillRect(10, 6, 12, 20);
          ctx.fillStyle = '#8b0000'; ctx.fillRect(14, 14, 4, 4); // ribbon seal
        }
      },
      {
        key: 'icon_book',
        color: '#2f4470',
        draw: (ctx) => {
          ctx.fillStyle = '#2f4470'; ctx.fillRect(6, 6, 20, 22);
          ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; ctx.strokeRect(6, 6, 20, 22);
          ctx.fillStyle = '#d4af37'; ctx.fillRect(14, 14, 4, 6);
        }
      },
      {
        key: 'icon_gold_small',
        color: '#ffd700',
        draw: (ctx) => {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath(); ctx.arc(14, 18, 4, 0, Math.PI * 2); ctx.arc(18, 17, 3, 0, Math.PI * 2); ctx.fill();
        }
      },
      {
        key: 'icon_gold_large',
        color: '#ffd700',
        draw: (ctx) => {
          ctx.fillStyle = '#ffd700';
          for (let i = 0; i < 5; i++) {
            ctx.beginPath(); ctx.arc(12 + (i % 3) * 5, 14 + Math.floor(i / 3) * 6, 4, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    ];

    for (const icon of icons) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      icon.draw(ctx);
      tm.addCanvas(icon.key, canvas);
    }
  }
}
