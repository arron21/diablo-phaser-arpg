import * as Phaser from 'phaser';
import { CharacterStats, CharacterClass } from '../core/entities/CharacterStats';
import { InventoryMatrix, PlacedItem } from '../core/inventory/InventoryMatrix';
import { EquipmentPaperdoll } from '../core/inventory/EquipmentPaperdoll';
import { ItemData, EquipmentSlot } from '../core/items/ItemTypes';
import { SPELLS, SpellDefinition } from '../core/spells/SpellSystem';
import { soundManager } from '../assets/ProceduralAudio';

export class UIScene extends Phaser.Scene {
  public stats!: CharacterStats;
  public inventory!: InventoryMatrix;
  public paperdoll!: EquipmentPaperdoll;

  // Active spell for Right-Click
  public activeSpell: SpellDefinition = SPELLS.firebolt;
  public knownSpells: SpellDefinition[] = [SPELLS.firebolt, SPELLS.heal];

  // Windows
  private inventoryWindow!: Phaser.GameObjects.Container;
  private charSheetWindow!: Phaser.GameObjects.Container;
  private spellbookWindow!: Phaser.GameObjects.Container;
  private shopWindow!: Phaser.GameObjects.Container;

  private isInventoryOpen: boolean = false;
  private isCharSheetOpen: boolean = false;
  private isSpellbookOpen: boolean = false;

  // Bottom HUD
  private lifeText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private beltSlotSprites: { bg: Phaser.GameObjects.Rectangle; icon?: Phaser.GameObjects.Sprite }[] = [];

  // Drag and Drop State
  private draggedItem: ItemData | null = null;
  private dragGhost?: Phaser.GameObjects.Sprite;

  // Tooltip
  private tooltipContainer!: Phaser.GameObjects.Container;
  private tooltipText!: Phaser.GameObjects.Text;
  private tooltipBg!: Phaser.GameObjects.Rectangle;

  // Text references in Char Sheet
  private charTexts: Record<string, Phaser.GameObjects.Text> = {};
  private charPlusButtons: Phaser.GameObjects.Text[] = [];

  // Active scene reference (TownScene or DungeonScene)
  private currentActiveSceneKey: string = 'TownScene';

  constructor() {
    super('UIScene');
  }

  public init(data: { classType?: CharacterClass; stats?: CharacterStats; inventory?: InventoryMatrix; paperdoll?: EquipmentPaperdoll }): void {
    if (data.stats) {
      this.stats = data.stats;
      this.inventory = data.inventory!;
      this.paperdoll = data.paperdoll!;
    } else {
      const cls = data.classType || 'WARRIOR';
      this.stats = new CharacterStats(cls);
      this.inventory = new InventoryMatrix(10, 4);
      this.paperdoll = new EquipmentPaperdoll(this.stats);
    }
  }

  public create(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // 1. Create Bottom HUD
    this.createBottomHUD(w, h);

    // 2. Create Windows
    this.createInventoryWindow(w, h);
    this.createCharSheetWindow(w, h);
    this.createSpellbookWindow(w, h);
    this.createShopWindow(w, h);

    // 3. Create Tooltip
    this.createTooltip();

    // 4. Keyboard Shortcuts: I = Inventory, C = Character, S = Spellbook, 1-8 = Belt, M = Mute
    this.setupKeyboard();

    // 5. Global Event Listeners from Game Scenes
    this.setupEvents();

    // Listen for pointer move to update drag ghost and tooltips
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragGhost && this.draggedItem) {
        this.dragGhost.setPosition(pointer.x, pointer.y);
      }
    });

    // Right-click cancel drag or cast spell
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() && this.draggedItem) {
        // Return dragged item to inventory
        this.inventory.autoPlaceItem(this.draggedItem);
        this.clearDragGhost();
        this.refreshInventoryUI();
      }
    });
  }

  // ==========================================
  // Bottom HUD
  // ==========================================

  private createBottomHUD(w: number, h: number): void {
    const hudY = h - 45;

    // Bottom dark stone panel
    this.add.rectangle(w / 2, h - 25, w, 50, 0x0c0a10, 0.95)
      .setStrokeStyle(1, 0x3d3024);

    // Red Life Globe (Left)
    this.add.image(55, hudY - 10, 'globe_life').setScale(0.9);
    this.lifeText = this.add.text(55, hudY - 5, '', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // Blue Mana Globe (Right)
    this.add.image(w - 55, hudY - 10, 'globe_mana').setScale(0.9);
    this.manaText = this.add.text(w - 55, hudY - 5, '', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // Center Belt: 8 slots
    const beltStartX = w / 2 - (4 * 34) + 17;
    for (let i = 0; i < 8; i++) {
      const slotX = beltStartX + i * 34;
      const slotY = hudY;

      const bg = this.add.rectangle(slotX, slotY, 30, 30, 0x141018)
        .setStrokeStyle(1, 0x4a3a2a)
        .setInteractive({ useHandCursor: true });

      // Number badge
      this.add.text(slotX - 10, slotY - 10, `${i + 1}`, {
        fontSize: '10px',
        color: '#8a7a66'
      });

      const slotIdx = i;
      bg.on('pointerdown', () => {
        this.useBeltItem(slotIdx);
      });

      this.beltSlotSprites.push({ bg });
    }

    // Buttons for Windows: Character (C), Inventory (I), Spells (S)
    this.createHUDButton(w / 2 - 180, hudY, 'CHAR [C]', () => this.toggleCharSheet());
    this.createHUDButton(w / 2 + 180, hudY, 'INV [I]', () => this.toggleInventory());
    this.createHUDButton(w / 2 + 250, hudY, 'SPELL [S]', () => this.toggleSpellbook());

    // Audio Mute Button (Top Right)
    const muteBtn = this.add.text(w - 20, 15, '🔊', {
      fontSize: '20px'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerdown', () => {
      const isMuted = soundManager.toggleMute();
      muteBtn.setText(isMuted ? '🔇' : '🔊');
    });

    // Level & Gold indicators
    this.levelText = this.add.text(120, hudY - 10, '', {
      fontSize: '12px',
      color: '#e6dac3',
      fontFamily: 'serif'
    });

    this.goldText = this.add.text(120, hudY + 6, '', {
      fontSize: '12px',
      color: '#ffd700',
      fontFamily: 'serif'
    });

    this.updateHUDValues();
  }

  private createHUDButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 62, 26, 0x1d161e)
      .setStrokeStyle(1, 0x5a4632)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontSize: '11px',
      color: '#e0d2bd',
      fontFamily: 'serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x352838));
    bg.on('pointerout', () => bg.setFillStyle(0x1d161e));
    bg.on('pointerdown', () => {
      soundManager.playSwordSwing();
      onClick();
    });
  }

  public updateHUDValues(): void {
    if (!this.stats) return;

    this.lifeText.setText(`${this.stats.currentHp}/${this.stats.totalMaxHp}`);
    this.manaText.setText(`${this.stats.currentMp}/${this.stats.totalMaxMp}`);
    this.levelText.setText(`Level: ${this.stats.level}`);
    this.goldText.setText(`Gold: ${this.stats.gold}`);

    // Update Belt icons
    for (let i = 0; i < 8; i++) {
      const item = this.paperdoll.belt[i];
      const slot = this.beltSlotSprites[i];
      if (slot.icon) {
        slot.icon.destroy();
        slot.icon = undefined;
      }
      if (item) {
        slot.icon = this.add.sprite(slot.bg.x, slot.bg.y, item.icon).setDisplaySize(24, 24);
      }
    }
  }

  // ==========================================
  // Inventory Tetris Window (10x4 Grid + Paperdoll)
  // ==========================================

  private createInventoryWindow(w: number, h: number): void {
    this.inventoryWindow = this.add.container(w - 330, 40).setVisible(false);

    // Window Background
    const bg = this.add.rectangle(155, 230, 310, 460, 0x0f0c13, 0.96)
      .setStrokeStyle(2, 0x4a3a28);

    const title = this.add.text(155, 18, 'INVENTORY', {
      fontSize: '16px',
      color: '#ffcc55',
      fontFamily: 'serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.inventoryWindow.add([bg, title]);

    // Paperdoll Slots
    this.createPaperdollSlot(155, 60, 'HEAD', 'icon_cap', 36, 36);
    this.createPaperdollSlot(155, 115, 'TORSO', 'icon_leather_armor', 42, 60);
    this.createPaperdollSlot(75, 115, 'MAIN_HAND', 'icon_broadsword', 36, 60);
    this.createPaperdollSlot(235, 115, 'OFF_HAND', 'icon_buckler', 36, 60);
    this.createPaperdollSlot(215, 60, 'AMULET', 'icon_amulet', 28, 28);
    this.createPaperdollSlot(75, 165, 'RING_LEFT', 'icon_ring', 28, 28);
    this.createPaperdollSlot(235, 165, 'RING_RIGHT', 'icon_ring', 28, 28);

    // 10x4 Grid (each cell 28x28)
    const gridStartX = 15;
    const gridStartY = 205;
    const cellSize = 28;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 10; c++) {
        const cx = gridStartX + c * cellSize + cellSize / 2;
        const cy = gridStartY + r * cellSize + cellSize / 2;

        const cell = this.add.rectangle(cx, cy, cellSize - 2, cellSize - 2, 0x18141d)
          .setStrokeStyle(1, 0x2b221a)
          .setInteractive({ useHandCursor: true });

        const col = c;
        const row = r;

        cell.on('pointerover', () => cell.setStrokeStyle(1, 0x6e5238));
        cell.on('pointerout', () => cell.setStrokeStyle(1, 0x2b221a));

        cell.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          this.handleInventoryCellClick(col, row, pointer);
        });

        this.inventoryWindow.add(cell);
      }
    }
  }

  private createPaperdollSlot(
    x: number,
    y: number,
    slot: EquipmentSlot,
    _placeholderIcon: string,
    w: number,
    h: number
  ): void {
    const bg = this.add.rectangle(x, y, w, h, 0x141018)
      .setStrokeStyle(2, 0x5a4530)
      .setInteractive({ useHandCursor: true });

    bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePaperdollClick(slot, pointer);
    });

    this.inventoryWindow.add(bg);
  }

  private handleInventoryCellClick(col: number, row: number, pointer: Phaser.Input.Pointer): void {
    const placed = this.inventory.getItemAt(col, row);

    // 1. Right Click: Auto-equip or use
    if (pointer.rightButtonDown()) {
      if (placed) {
        this.useOrEquipItem(placed.item);
      }
      return;
    }

    // 2. Left Click: Drag & Drop
    if (this.draggedItem) {
      // Attempt to place
      if (this.inventory.canPlaceItem(this.draggedItem, col, row)) {
        this.inventory.placeItem(this.draggedItem, col, row);
        this.clearDragGhost();
        soundManager.playSwordSwing();
      } else {
        // Swap if cell contains an item
        if (placed) {
          this.inventory.removeItem(placed.item);
          if (this.inventory.canPlaceItem(this.draggedItem, col, row)) {
            this.inventory.placeItem(this.draggedItem, col, row);
            this.setDragGhost(placed.item);
            soundManager.playSwordSwing();
          } else {
            // Cannot swap, place back
            this.inventory.placeItem(placed.item, placed.col, placed.row);
          }
        }
      }
    } else {
      // Pick up item
      if (placed) {
        this.inventory.removeItem(placed.item);
        this.setDragGhost(placed.item);
        soundManager.playSwordSwing();
      }
    }

    this.refreshInventoryUI();
    this.updateHUDValues();
  }

  private handlePaperdollClick(slot: EquipmentSlot, pointer: Phaser.Input.Pointer): void {
    const currentEquipped = this.paperdoll.getSlotItem(slot);

    if (pointer.rightButtonDown()) {
      // Unequip to inventory
      if (currentEquipped) {
        const unequipped = this.paperdoll.unequip(slot);
        if (unequipped) {
          const placed = this.inventory.autoPlaceItem(unequipped);
          if (!placed) {
            // No room, re-equip
            this.paperdoll.equip(unequipped, slot);
            this.showFloatingText('Inventory Full!', this.cameras.main.width / 2, 200, '#ff3333');
          }
        }
      }
      this.refreshInventoryUI();
      this.updateHUDValues();
      return;
    }

    // Left Click: Equip or Unequip
    if (this.draggedItem) {
      const check = this.paperdoll.canEquip(this.draggedItem, slot);
      if (check.success) {
        const prev = this.paperdoll.equip(this.draggedItem, slot);
        this.clearDragGhost();
        if (prev) {
          this.setDragGhost(prev);
        }
        soundManager.playShieldBlock();
      } else {
        this.showFloatingText(check.reason || 'Cannot equip', this.cameras.main.width / 2, 200, '#ff3333');
      }
    } else {
      // Pick up from paperdoll
      if (currentEquipped) {
        const item = this.paperdoll.unequip(slot);
        if (item) {
          this.setDragGhost(item);
          soundManager.playSwordSwing();
        }
      }
    }

    this.refreshInventoryUI();
    this.updateHUDValues();
  }

  private useOrEquipItem(item: ItemData): void {
    // Check if consumable / potion / scroll / book
    if (item.type.startsWith('POTION_')) {
      if (item.healHp) this.stats.heal(item.healHp);
      if (item.restoreMp) this.stats.restoreMana(item.restoreMp);
      this.inventory.removeItem(item);
      soundManager.playPotionGulp();
      this.showFloatingText(`+${item.healHp || item.restoreMp}`, this.cameras.main.width / 2, 250, '#33ff55');
    } else if (item.type === 'SCROLL') {
      if (item.spellId) this.castScrollSpell(item.spellId);
      this.inventory.removeItem(item);
      soundManager.playSpellCast('FIRE');
    } else if (item.type === 'BOOK') {
      if (item.spellId && SPELLS[item.spellId]) {
        const spell = SPELLS[item.spellId];
        if (!this.knownSpells.find(s => s.id === spell.id)) {
          this.knownSpells.push(spell);
          this.inventory.removeItem(item);
          soundManager.playLevelUp();
          this.showFloatingText(`Learned ${spell.name}!`, this.cameras.main.width / 2, 200, '#ffea00');
        } else {
          this.showFloatingText('Already memorized!', this.cameras.main.width / 2, 200, '#aaaaaa');
        }
      }
    } else if (item.equipSlot) {
      // Attempt auto-equip
      const targetSlot = item.type === 'RING'
        ? (!this.paperdoll.ringLeft ? 'RING_LEFT' : 'RING_RIGHT')
        : (item.equipSlot as EquipmentSlot);

      const check = this.paperdoll.canEquip(item, targetSlot);
      if (check.success) {
        this.inventory.removeItem(item);
        const prev = this.paperdoll.equip(item, targetSlot);
        if (prev) {
          this.inventory.autoPlaceItem(prev);
        }
        soundManager.playShieldBlock();
      } else {
        this.showFloatingText(check.reason || 'Cannot equip', this.cameras.main.width / 2, 200, '#ff3333');
      }
    }

    this.refreshInventoryUI();
    this.updateHUDValues();
  }

  private castScrollSpell(spellId: string): void {
    if (spellId === 'town_portal') {
      soundManager.playSpellCast('PORTAL');
      this.events.emit('open_town_portal');
      this.showFloatingText('Town Portal Opened!', this.cameras.main.width / 2, 200, '#44aaff');
    } else {
      this.showFloatingText(`Cast ${spellId}!`, this.cameras.main.width / 2, 200, '#ffaa33');
    }
  }

  private inventoryVisualItems: Phaser.GameObjects.GameObject[] = [];

  public refreshInventoryUI(): void {
    // Remove previous item visuals
    this.inventoryVisualItems.forEach(i => i.destroy());
    this.inventoryVisualItems = [];

    const gridStartX = 15;
    const gridStartY = 205;
    const cellSize = 28;

    // 1. Draw Grid Items
    const items = this.inventory.getAllItems();
    for (const placed of items) {
      const px = gridStartX + placed.col * cellSize + (placed.item.width * cellSize) / 2;
      const py = gridStartY + placed.row * cellSize + (placed.item.height * cellSize) / 2;

      const spr = this.add.sprite(px, py, placed.item.icon)
        .setDisplaySize(placed.item.width * cellSize - 4, placed.item.height * cellSize - 4)
        .setInteractive({ useHandCursor: true });

      spr.on('pointerover', () => this.showItemTooltip(placed.item, px + this.inventoryWindow.x, py + this.inventoryWindow.y));
      spr.on('pointerout', () => this.hideTooltip());
      spr.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.handleInventoryCellClick(placed.col, placed.row, pointer);
      });

      this.inventoryWindow.add(spr);
      this.inventoryVisualItems.push(spr);
    }

    // 2. Draw Paperdoll Items
    const slots: { slot: EquipmentSlot; x: number; y: number; w: number; h: number }[] = [
      { slot: 'HEAD', x: 155, y: 60, w: 34, h: 34 },
      { slot: 'TORSO', x: 155, y: 115, w: 40, h: 58 },
      { slot: 'MAIN_HAND', x: 75, y: 115, w: 34, h: 58 },
      { slot: 'OFF_HAND', x: 235, y: 115, w: 34, h: 58 },
      { slot: 'AMULET', x: 215, y: 60, w: 26, h: 26 },
      { slot: 'RING_LEFT', x: 75, y: 165, w: 26, h: 26 },
      { slot: 'RING_RIGHT', x: 235, y: 165, w: 26, h: 26 }
    ];

    for (const s of slots) {
      const item = this.paperdoll.getSlotItem(s.slot);
      if (item) {
        const spr = this.add.sprite(s.x, s.y, item.icon)
          .setDisplaySize(s.w - 4, s.h - 4)
          .setInteractive({ useHandCursor: true });

        spr.on('pointerover', () => this.showItemTooltip(item, s.x + this.inventoryWindow.x, s.y + this.inventoryWindow.y));
        spr.on('pointerout', () => this.hideTooltip());
        spr.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          this.handlePaperdollClick(s.slot, pointer);
        });

        this.inventoryWindow.add(spr);
        this.inventoryVisualItems.push(spr);
      }
    }
  }

  private setDragGhost(item: ItemData): void {
    this.draggedItem = item;
    if (this.dragGhost) this.dragGhost.destroy();
    this.dragGhost = this.add.sprite(this.input.x, this.input.y, item.icon)
      .setDisplaySize(item.width * 28, item.height * 28)
      .setAlpha(0.75)
      .setDepth(2000);
  }

  private clearDragGhost(): void {
    this.draggedItem = null;
    if (this.dragGhost) {
      this.dragGhost.destroy();
      this.dragGhost = undefined;
    }
  }

  // ==========================================
  // Character Sheet Window
  // ==========================================

  private createCharSheetWindow(w: number, _h: number): void {
    this.charSheetWindow = this.add.container(20, 40).setVisible(false);

    const bg = this.add.rectangle(155, 230, 310, 460, 0x0f0c13, 0.96)
      .setStrokeStyle(2, 0x4a3a28);

    const title = this.add.text(155, 18, 'CHARACTER SHEET', {
      fontSize: '16px',
      color: '#ffcc55',
      fontFamily: 'serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.charSheetWindow.add([bg, title]);

    // Name & Class
    this.charTexts.nameClass = this.add.text(25, 45, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'serif'
    });
    this.charSheetWindow.add(this.charTexts.nameClass);

    // Attributes with '+' buttons
    const attrs: { key: 'strength' | 'dexterity' | 'magic' | 'vitality'; label: string; y: number }[] = [
      { key: 'strength', label: 'Strength', y: 80 },
      { key: 'dexterity', label: 'Dexterity', y: 110 },
      { key: 'magic', label: 'Magic', y: 140 },
      { key: 'vitality', label: 'Vitality', y: 170 }
    ];

    attrs.forEach(a => {
      const lbl = this.add.text(25, a.y, a.label, { fontSize: '13px', color: '#c9b8a3' });
      const val = this.add.text(130, a.y, '0', { fontSize: '13px', color: '#ffea88' });
      this.charTexts[a.key] = val;

      const plusBtn = this.add.text(175, a.y - 2, '[+]', {
        fontSize: '13px',
        color: '#ff3311',
        fontStyle: 'bold'
      }).setInteractive({ useHandCursor: true });

      plusBtn.on('pointerdown', () => {
        if (this.stats.allocatePoint(a.key)) {
          soundManager.playLevelUp();
          this.refreshCharSheet();
          this.updateHUDValues();
        }
      });

      this.charPlusButtons.push(plusBtn);
      this.charSheetWindow.add([lbl, val, plusBtn]);
    });

    // Unallocated points text
    this.charTexts.unallocated = this.add.text(25, 205, '', {
      fontSize: '13px',
      color: '#ff5533',
      fontStyle: 'bold'
    });
    this.charSheetWindow.add(this.charTexts.unallocated);

    // Derived Combat Stats
    const derivedY = 240;
    this.charTexts.life = this.add.text(25, derivedY, '', { fontSize: '12px', color: '#e6dac3' });
    this.charTexts.mana = this.add.text(25, derivedY + 22, '', { fontSize: '12px', color: '#e6dac3' });
    this.charTexts.ac = this.add.text(25, derivedY + 44, '', { fontSize: '12px', color: '#e6dac3' });
    this.charTexts.toHit = this.add.text(25, derivedY + 66, '', { fontSize: '12px', color: '#e6dac3' });
    this.charTexts.damage = this.add.text(25, derivedY + 88, '', { fontSize: '12px', color: '#e6dac3' });
    this.charTexts.block = this.add.text(25, derivedY + 110, '', { fontSize: '12px', color: '#e6dac3' });
    this.charTexts.resists = this.add.text(25, derivedY + 132, '', { fontSize: '12px', color: '#e6dac3' });

    this.charSheetWindow.add([
      this.charTexts.life,
      this.charTexts.mana,
      this.charTexts.ac,
      this.charTexts.toHit,
      this.charTexts.damage,
      this.charTexts.block,
      this.charTexts.resists
    ]);
  }

  public refreshCharSheet(): void {
    if (!this.stats) return;

    this.charTexts.nameClass.setText(`${this.stats.name} (Lvl ${this.stats.level} ${this.stats.classType})`);

    this.charTexts.strength.setText(`${this.stats.strength}`);
    this.charTexts.dexterity.setText(`${this.stats.dexterity}`);
    this.charTexts.magic.setText(`${this.stats.magic}`);
    this.charTexts.vitality.setText(`${this.stats.vitality}`);

    this.charTexts.unallocated.setText(
      this.stats.unallocatedPoints > 0 ? `Unspent Points: ${this.stats.unallocatedPoints}` : ''
    );
    this.charPlusButtons.forEach(btn => btn.setVisible(this.stats.unallocatedPoints > 0));

    this.charTexts.life.setText(`Life: ${this.stats.currentHp} / ${this.stats.totalMaxHp}`);
    this.charTexts.mana.setText(`Mana: ${this.stats.currentMp} / ${this.stats.totalMaxMp}`);
    this.charTexts.ac.setText(`Armor Class: ${this.stats.totalArmorClass}`);
    this.charTexts.toHit.setText(`To-Hit Chance: ${this.stats.totalToHit}%`);
    this.charTexts.damage.setText(`Damage: ${this.stats.damageRange.min} - ${this.stats.damageRange.max}`);
    this.charTexts.block.setText(`Shield Block: ${this.stats.blockChance}%`);
    this.charTexts.resists.setText(`Fire Res: ${this.stats.bonus.fireResist}% | Lgt Res: ${this.stats.bonus.lightningResist}%`);
  }

  // ==========================================
  // Spellbook Window
  // ==========================================

  private createSpellbookWindow(w: number, _h: number): void {
    this.spellbookWindow = this.add.container(w / 2 - 155, 60).setVisible(false);

    const bg = this.add.rectangle(155, 180, 310, 360, 0x0f0c13, 0.96)
      .setStrokeStyle(2, 0x4a3a28);

    const title = this.add.text(155, 20, 'SPELLBOOK', {
      fontSize: '16px',
      color: '#ffcc55',
      fontFamily: 'serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.spellbookWindow.add([bg, title]);
  }

  public refreshSpellbook(): void {
    // Clear dynamic spell buttons
    while (this.spellbookWindow.length > 2) {
      this.spellbookWindow.removeAt(2, true);
    }

    this.knownSpells.forEach((spell, idx) => {
      const sy = 60 + idx * 46;

      const isCurrent = this.activeSpell.id === spell.id;
      const sBg = this.add.rectangle(155, sy, 280, 38, isCurrent ? 0x2d1f14 : 0x18141d)
        .setStrokeStyle(1, isCurrent ? 0xffcc55 : 0x3d3024)
        .setInteractive({ useHandCursor: true });

      const name = this.add.text(30, sy - 8, spell.name, {
        fontSize: '13px',
        color: isCurrent ? '#ffd288' : '#e6dac3',
        fontStyle: 'bold'
      });

      const cost = this.add.text(240, sy - 8, `${spell.manaCost} MP`, {
        fontSize: '12px',
        color: '#44aaff'
      });

      sBg.on('pointerdown', () => {
        this.activeSpell = spell;
        soundManager.playSpellCast('FIRE');
        this.refreshSpellbook();
        this.showFloatingText(`Equipped ${spell.name}!`, this.cameras.main.width / 2, 200, '#ffd700');
      });

      this.spellbookWindow.add([sBg, name, cost]);
    });
  }

  // ==========================================
  // Shop Window (Griswold, Pepin, Adria, Cain)
  // ==========================================

  private createShopWindow(w: number, _h: number): void {
    this.shopWindow = this.add.container(w / 2 - 160, 50).setVisible(false);

    const bg = this.add.rectangle(160, 200, 320, 400, 0x0f0c13, 0.96)
      .setStrokeStyle(2, 0x4a3a28);

    this.shopWindow.add(bg);
  }

  public openNPCShop(npcKey: string): void {
    this.shopWindow.setVisible(true);
    // Clear old elements
    while (this.shopWindow.length > 1) {
      this.shopWindow.removeAt(1, true);
    }

    let titleText = 'Merchant';
    let wares: { name: string; price: number; action: () => void }[] = [];

    if (npcKey === 'Griswold') {
      titleText = 'Griswold the Blacksmith';
      wares = [
        {
          name: 'Broadsword (120 Gold)',
          price: 120,
          action: () => this.buyItem('Broadsword', 120)
        },
        {
          name: 'Kite Shield (110 Gold)',
          price: 110,
          action: () => this.buyItem('Kite Shield', 110)
        },
        {
          name: 'Chain Mail (200 Gold)',
          price: 200,
          action: () => this.buyItem('Chain Mail', 200)
        }
      ];
    } else if (npcKey === 'Pepin') {
      titleText = 'Pepin the Healer';
      wares = [
        {
          name: 'Full Health Heal (FREE)',
          price: 0,
          action: () => {
            this.stats.currentHp = this.stats.totalMaxHp;
            soundManager.playPotionGulp();
            this.updateHUDValues();
            this.showFloatingText('Fully Healed!', this.cameras.main.width / 2, 200, '#33ff55');
          }
        },
        {
          name: 'Healing Potion (35 Gold)',
          price: 35,
          action: () => this.buyItem('Potion of Healing', 35)
        }
      ];
    } else if (npcKey === 'Adria') {
      titleText = 'Adria the Witch';
      wares = [
        {
          name: 'Mana Potion (35 Gold)',
          price: 35,
          action: () => this.buyItem('Potion of Mana', 35)
        },
        {
          name: 'Scroll of Town Portal (50 Gold)',
          price: 50,
          action: () => this.buyItem('Scroll of Town Portal', 50)
        },
        {
          name: 'Book of Holy Bolt (250 Gold)',
          price: 250,
          action: () => this.buyItem('Book of Holy Bolt', 250)
        }
      ];
    } else if (npcKey === 'Cain') {
      titleText = 'Deckard Cain the Elder';
      wares = [
        {
          name: 'Identify All Items (100 Gold)',
          price: 100,
          action: () => {
            if (this.stats.gold >= 100) {
              this.stats.gold -= 100;
              soundManager.playGoldPickup();
              this.showFloatingText('"Stay awhile and listen!"', this.cameras.main.width / 2, 200, '#ffd700');
              this.updateHUDValues();
            } else {
              this.showFloatingText('Not enough gold!', this.cameras.main.width / 2, 200, '#ff3333');
            }
          }
        }
      ];
    }

    const t = this.add.text(160, 20, titleText, {
      fontSize: '15px',
      color: '#ffd288',
      fontFamily: 'serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const closeBtn = this.add.text(290, 15, '✕', {
      fontSize: '16px',
      color: '#ff4422'
    }).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.shopWindow.setVisible(false));

    this.shopWindow.add([t, closeBtn]);

    // Render wares
    wares.forEach((w, idx) => {
      const wy = 70 + idx * 48;
      const btn = this.add.rectangle(160, wy, 280, 36, 0x1e1824)
        .setStrokeStyle(1, 0x5a4632)
        .setInteractive({ useHandCursor: true });

      const lbl = this.add.text(35, wy - 8, w.name, {
        fontSize: '12px',
        color: '#e6dac3'
      });

      btn.on('pointerdown', () => {
        w.action();
      });

      this.shopWindow.add([btn, lbl]);
    });
  }

  private buyItem(templateName: string, price: number): void {
    if (this.stats.gold < price) {
      this.showFloatingText('Not enough gold!', this.cameras.main.width / 2, 200, '#ff3333');
      return;
    }

    const item = (this.scene.get('DungeonScene') as unknown as { createItemTemplate: (name: string) => ItemData })
      ?.createItemTemplate?.(templateName) || {
        id: `shop_${Date.now()}`,
        name: templateName,
        baseName: templateName,
        type: 'WEAPON_MELEE',
        rarity: 'NORMAL',
        width: 1,
        height: 1,
        value: price,
        icon: 'icon_short_sword',
        affixes: [],
        totalBonus: {}
      } as ItemData;

    const placed = this.inventory.autoPlaceItem(item);
    if (placed) {
      this.stats.gold -= price;
      soundManager.playGoldPickup();
      this.refreshInventoryUI();
      this.updateHUDValues();
      this.showFloatingText(`Bought ${templateName}!`, this.cameras.main.width / 2, 200, '#33ff55');
    } else {
      this.showFloatingText('Inventory Full!', this.cameras.main.width / 2, 200, '#ff3333');
    }
  }

  // ==========================================
  // Tooltip
  // ==========================================

  private createTooltip(): void {
    this.tooltipContainer = this.add.container(0, 0).setDepth(3000).setVisible(false);

    this.tooltipBg = this.add.rectangle(0, 0, 180, 80, 0x070609, 0.95)
      .setStrokeStyle(1, 0x5a4836);

    this.tooltipText = this.add.text(0, 0, '', {
      fontSize: '11px',
      color: '#e6dac3',
      fontFamily: 'serif',
      lineSpacing: 3
    }).setOrigin(0.5);

    this.tooltipContainer.add([this.tooltipBg, this.tooltipText]);
  }

  public showItemTooltip(item: ItemData, x: number, y: number): void {
    let color = '#ffffff';
    if (item.rarity === 'MAGIC') color = '#4488ff';
    else if (item.rarity === 'RARE') color = '#ffff55';
    else if (item.rarity === 'UNIQUE') color = '#cc8822';

    let content = `${item.name}\n`;
    if (item.minDamage) content += `Damage: ${item.minDamage} - ${item.maxDamage}\n`;
    if (item.armorClass) content += `Armor: ${item.armorClass}\n`;
    if (item.reqStrength) content += `Req Str: ${item.reqStrength}  `;
    if (item.reqDexterity) content += `Req Dex: ${item.reqDexterity}\n`;
    if (item.description) content += `${item.description}\n`;

    for (const affix of item.affixes) {
      content += `+ ${affix.name}\n`;
    }

    this.tooltipText.setColor(color);
    this.tooltipText.setText(content);

    const bounds = this.tooltipText.getBounds();
    this.tooltipBg.setSize(bounds.width + 16, bounds.height + 14);

    this.tooltipContainer.setPosition(Math.min(x, 750), Math.max(y - 50, 40));
    this.tooltipContainer.setVisible(true);
  }

  public hideTooltip(): void {
    this.tooltipContainer.setVisible(false);
  }

  // ==========================================
  // Floating Combat & Notification Text
  // ==========================================

  public showFloatingText(text: string, x: number, y: number, color: string = '#ffffff'): void {
    const fText = this.add.text(x, y, text, {
      fontSize: '15px',
      color: color,
      fontStyle: 'bold',
      fontFamily: 'serif',
      shadow: { color: '#000000', blur: 3, fill: true }
    }).setOrigin(0.5).setDepth(2500);

    this.tweens.add({
      targets: fText,
      y: y - 35,
      alpha: 0,
      duration: 1100,
      ease: 'Power1',
      onComplete: () => fText.destroy()
    });
  }

  // ==========================================
  // Shortcuts & Events
  // ==========================================

  public toggleInventory(): void {
    this.isInventoryOpen = !this.isInventoryOpen;
    this.inventoryWindow.setVisible(this.isInventoryOpen);
    if (this.isInventoryOpen) this.refreshInventoryUI();
  }

  public toggleCharSheet(): void {
    this.isCharSheetOpen = !this.isCharSheetOpen;
    this.charSheetWindow.setVisible(this.isCharSheetOpen);
    if (this.isCharSheetOpen) this.refreshCharSheet();
  }

  public toggleSpellbook(): void {
    this.isSpellbookOpen = !this.isSpellbookOpen;
    this.spellbookWindow.setVisible(this.isSpellbookOpen);
    if (this.isSpellbookOpen) this.refreshSpellbook();
  }

  public useBeltItem(index: number): void {
    const item = this.paperdoll.useBeltSlot(index);
    if (item) {
      soundManager.playPotionGulp();
      this.showFloatingText(`+${item.healHp || item.restoreMp}`, this.cameras.main.width / 2, 250, '#33ff55');
      this.updateHUDValues();
    }
  }

  private setupKeyboard(): void {
    this.input.keyboard?.on('keydown-I', () => this.toggleInventory());
    this.input.keyboard?.on('keydown-C', () => this.toggleCharSheet());
    this.input.keyboard?.on('keydown-S', () => this.toggleSpellbook());

    for (let i = 1; i <= 8; i++) {
      this.input.keyboard?.on(`keydown-${i}`, () => this.useBeltItem(i - 1));
    }
  }

  private setupEvents(): void {
    // Sync stats from game scenes
    this.events.on('refresh_ui', () => {
      this.updateHUDValues();
      if (this.isCharSheetOpen) this.refreshCharSheet();
      if (this.isInventoryOpen) this.refreshInventoryUI();
    });

    this.events.on('show_damage', (data: { x: number; y: number; text: string; color: string }) => {
      this.showFloatingText(data.text, data.x, data.y, data.color);
    });

    this.events.on('open_npc_dialog', (npcKey: string) => {
      this.openNPCShop(npcKey);
    });
  }
}
