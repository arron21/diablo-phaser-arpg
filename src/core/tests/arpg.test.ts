import { describe, it, expect } from 'vitest';
import { Isometric } from '../math/Isometric';
import { CharacterStats } from '../entities/CharacterStats';
import { InventoryMatrix } from '../inventory/InventoryMatrix';
import { EquipmentPaperdoll } from '../inventory/EquipmentPaperdoll';
import { ItemGenerator } from '../items/ItemGenerator';
import { BSPGenerator } from '../map/BSPGenerator';
import { Pathfinding } from '../map/Pathfinding';
import { DiabloCombat } from '../combat/DiabloCombat';
import { ItemData } from '../items/ItemTypes';

describe('Isometric Math', () => {
  it('should accurately roundtrip between grid and screen coordinates', () => {
    const testPoints = [
      { gx: 0, gy: 0 },
      { gx: 10, gy: 10 },
      { gx: 5, gy: 15 },
      { gx: 24, gy: 7 }
    ];

    for (const pt of testPoints) {
      const screen = Isometric.gridToScreen(pt.gx, pt.gy);
      const grid = Isometric.screenToGrid(screen.x, screen.y);
      expect(grid.x).toBeCloseTo(pt.gx, 5);
      expect(grid.y).toBeCloseTo(pt.gy, 5);
    }
  });

  it('should correctly calculate depth ordering', () => {
    const depth1 = Isometric.calculateDepth(5, 5);
    const depth2 = Isometric.calculateDepth(6, 5);
    const depth3 = Isometric.calculateDepth(5, 6);
    expect(depth2).toBeGreaterThan(depth1);
    expect(depth3).toBeGreaterThan(depth1);
    expect(depth2).toBe(depth3);
  });
});

describe('CharacterStats & Progression', () => {
  it('should initialize warrior with proper base stats', () => {
    const warrior = new CharacterStats('WARRIOR');
    expect(warrior.strength).toBe(30);
    expect(warrior.dexterity).toBe(20);
    expect(warrior.vitality).toBe(25);
    expect(warrior.currentHp).toBeGreaterThan(80);
    expect(warrior.currentMp).toBeGreaterThanOrEqual(20);
    expect(warrior.blockChance).toBeGreaterThanOrEqual(30);
  });

  it('should level up and award 5 unallocated stat points', () => {
    const rogue = new CharacterStats('ROGUE');
    expect(rogue.level).toBe(1);
    expect(rogue.unallocatedPoints).toBe(0);

    const leveled = rogue.addExperience(150);
    expect(leveled).toBe(true);
    expect(rogue.level).toBe(2);
    expect(rogue.unallocatedPoints).toBe(5);

    const allocated = rogue.allocatePoint('dexterity');
    expect(allocated).toBe(true);
    expect(rogue.dexterity).toBe(31);
    expect(rogue.unallocatedPoints).toBe(4);
  });
});

describe('Inventory Matrix (Tetris Grid)', () => {
  it('should allow placing 1x1, 1x2, and 2x3 items within bounds', () => {
    const inv = new InventoryMatrix(10, 4);

    const sword: ItemData = {
      id: 'sword_1',
      name: 'Broadsword',
      baseName: 'Broadsword',
      type: 'WEAPON_MELEE',
      rarity: 'NORMAL',
      width: 2,
      height: 3,
      value: 100,
      icon: 'icon_broadsword',
      affixes: [],
      totalBonus: {}
    };

    // Place at 0, 0
    expect(inv.canPlaceItem(sword, 0, 0)).toBe(true);
    expect(inv.placeItem(sword, 0, 0)).toBe(true);

    // Colliding placement at 1, 1 should fail
    const ring: ItemData = {
      id: 'ring_1',
      name: 'Ring',
      baseName: 'Ring',
      type: 'RING',
      rarity: 'NORMAL',
      width: 1,
      height: 1,
      value: 50,
      icon: 'icon_ring',
      affixes: [],
      totalBonus: {}
    };
    expect(inv.canPlaceItem(ring, 1, 1)).toBe(false);

    // Free cell at 2, 0 should succeed
    expect(inv.canPlaceItem(ring, 2, 0)).toBe(true);
    expect(inv.placeItem(ring, 2, 0)).toBe(true);

    // Out-of-bounds placement should fail
    expect(inv.canPlaceItem(sword, 9, 2)).toBe(false);
  });

  it('should support autoPlaceItem and removeItem', () => {
    const inv = new InventoryMatrix(10, 4);

    const item: ItemData = {
      id: 'potion_1',
      name: 'Healing Potion',
      baseName: 'Healing Potion',
      type: 'POTION_HEALTH',
      rarity: 'NORMAL',
      width: 1,
      height: 1,
      value: 30,
      icon: 'icon_potion_red',
      affixes: [],
      totalBonus: {}
    };

    const pos = inv.autoPlaceItem(item);
    expect(pos).not.toBeNull();
    expect(pos?.col).toBe(0);
    expect(pos?.row).toBe(0);

    const removed = inv.removeItem(item);
    expect(removed).not.toBeNull();
    expect(inv.getItemAt(0, 0)).toBeNull();
  });
});

describe('Equipment Paperdoll', () => {
  it('should enforce attribute requirements and sync bonuses', () => {
    const stats = new CharacterStats('SORCERER'); // Low strength (15)
    const paperdoll = new EquipmentPaperdoll(stats);

    const heavyArmor: ItemData = {
      id: 'plate_1',
      name: 'Plate Mail',
      baseName: 'Plate Mail',
      type: 'BODY_ARMOR',
      rarity: 'NORMAL',
      width: 2,
      height: 3,
      equipSlot: 'TORSO',
      armorClass: 24,
      reqStrength: 40,
      value: 400,
      icon: 'icon_plate_mail',
      affixes: [],
      totalBonus: {}
    };

    // Sorcerer has 15 Strength, requires 40
    const check = paperdoll.canEquip(heavyArmor, 'TORSO');
    expect(check.success).toBe(false);

    // Light rags require no strength
    const rags: ItemData = {
      id: 'rags_1',
      name: 'Rags',
      baseName: 'Rags',
      type: 'BODY_ARMOR',
      rarity: 'NORMAL',
      width: 2,
      height: 3,
      equipSlot: 'TORSO',
      armorClass: 4,
      value: 20,
      icon: 'icon_rags',
      affixes: [],
      totalBonus: {}
    };

    expect(paperdoll.canEquip(rags, 'TORSO').success).toBe(true);
    paperdoll.equip(rags, 'TORSO');
    expect(stats.totalArmorClass).toBeGreaterThanOrEqual(4);
  });
});

describe('BSP Dungeon Generation & Pathfinding', () => {
  it('should generate traversable dungeon levels with valid entrance and exit', () => {
    for (let floor = 1; floor <= 2; floor++) {
      const dungeon = BSPGenerator.generate(floor, 36, 36);

      expect(dungeon.stairsUp).toBeDefined();
      expect(dungeon.stairsDown).toBeDefined();
      expect(dungeon.rooms.length).toBeGreaterThanOrEqual(2);

      // Verify A* path exists between entrance and exit
      const path = Pathfinding.findPath(
        dungeon.stairsUp.x,
        dungeon.stairsUp.y,
        dungeon.stairsDown.x,
        dungeon.stairsDown.y,
        (x, y) => {
          if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) return false;
          const t = dungeon.tiles[y][x];
          return t !== 'EMPTY' && t !== 'WALL';
        },
        100
      );

      expect(path.length).toBeGreaterThan(0);

      if (floor === 2) {
        // Floor 2 has The Butcher's chamber and spawn
        expect(dungeon.butcherSpawn).toBeDefined();
      }
    }
  });
});

describe('Diablo Combat Math', () => {
  it('should clamp hit chance between 5% and 95%', () => {
    const weakAttacker = {
      level: 1,
      armorClass: 0,
      toHit: 0,
      blockChance: 0,
      damageRange: { min: 1, max: 2 },
      maxHp: 10,
      currentHp: 10
    };

    const invincibleDefender = {
      level: 50,
      armorClass: 200,
      toHit: 100,
      blockChance: 0,
      damageRange: { min: 10, max: 20 },
      maxHp: 500,
      currentHp: 500
    };

    // Even against impossible AC, minimum hit chance is 5%
    let hits = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      const res = DiabloCombat.resolveAttack(weakAttacker, invincibleDefender);
      if (res.hit) hits++;
    }

    const hitRate = hits / trials;
    expect(hitRate).toBeGreaterThan(0.01);
    expect(hitRate).toBeLessThan(0.12);
  });

  it('should trigger hit recovery when damage >= maxHp / 8', () => {
    const attacker = {
      level: 10,
      armorClass: 10,
      toHit: 200,
      blockChance: 0,
      damageRange: { min: 20, max: 20 },
      maxHp: 100,
      currentHp: 100
    };

    const defender = {
      level: 1,
      armorClass: 0,
      toHit: 0,
      blockChance: 0,
      damageRange: { min: 1, max: 2 },
      maxHp: 40, // 40 / 8 = 5 threshold. Damage 20 > 5 => hit recovery!
      currentHp: 40
    };

    const res = DiabloCombat.resolveAttack(attacker, defender);
    expect(res.hit).toBe(true);
    expect(res.damage).toBe(20);
    expect(res.hitRecovery).toBe(true);
  });
});

describe('Item Generator & The Butcher', () => {
  it('should generate unique Butcher\'s Cleaver with high stats', () => {
    const cleaver = ItemGenerator.createButchersCleaver();
    expect(cleaver.rarity).toBe('UNIQUE');
    expect(cleaver.name).toBe("The Butcher's Cleaver");
    expect(cleaver.totalBonus.strength).toBe(10);
    expect(cleaver.minDamage).toBeGreaterThanOrEqual(6);
  });

  it('should generate starting kits for all 3 classes', () => {
    const warriorItems = ItemGenerator.getStarterItems('WARRIOR');
    const rogueItems = ItemGenerator.getStarterItems('ROGUE');
    const sorcItems = ItemGenerator.getStarterItems('SORCERER');

    expect(warriorItems.some(i => i.baseName === 'Short Sword')).toBe(true);
    expect(rogueItems.some(i => i.baseName === 'Short Bow')).toBe(true);
    expect(sorcItems.some(i => i.baseName === 'Short Staff')).toBe(true);
  });
});
