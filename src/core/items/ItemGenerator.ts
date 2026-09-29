import { ItemData, ItemRarity, ItemType, EquipmentSlot } from './ItemTypes';
import { PREFIXES, SUFFIXES } from './Affixes';
import { AttributeBonus } from '../entities/CharacterStats';

interface BaseItemTemplate {
  baseName: string;
  type: ItemType;
  width: number;
  height: number;
  equipSlot?: EquipmentSlot | 'RING';
  minDamage?: number;
  maxDamage?: number;
  armorClass?: number;
  reqStrength?: number;
  reqDexterity?: number;
  reqMagic?: number;
  value: number;
  icon: string;
  healHp?: number;
  restoreMp?: number;
  spellId?: string;
  description?: string;
}

export const BASE_ITEMS: BaseItemTemplate[] = [
  // Melee Weapons
  { baseName: 'Club', type: 'WEAPON_MELEE', width: 1, height: 3, equipSlot: 'MAIN_HAND', minDamage: 1, maxDamage: 4, value: 20, icon: 'icon_club' },
  { baseName: 'Short Sword', type: 'WEAPON_MELEE', width: 1, height: 3, equipSlot: 'MAIN_HAND', minDamage: 2, maxDamage: 6, reqStrength: 15, value: 50, icon: 'icon_short_sword' },
  { baseName: 'Broadsword', type: 'WEAPON_MELEE', width: 2, height: 3, equipSlot: 'MAIN_HAND', minDamage: 4, maxDamage: 10, reqStrength: 25, value: 120, icon: 'icon_broadsword' },
  { baseName: 'Battle Axe', type: 'WEAPON_MELEE', width: 2, height: 3, equipSlot: 'MAIN_HAND', minDamage: 5, maxDamage: 14, reqStrength: 30, value: 180, icon: 'icon_axe' },

  // Ranged Weapons
  { baseName: 'Short Bow', type: 'WEAPON_RANGED', width: 1, height: 3, equipSlot: 'MAIN_HAND', minDamage: 2, maxDamage: 5, reqDexterity: 15, value: 60, icon: 'icon_short_bow' },
  { baseName: 'Composite Bow', type: 'WEAPON_RANGED', width: 2, height: 3, equipSlot: 'MAIN_HAND', minDamage: 4, maxDamage: 9, reqDexterity: 25, value: 150, icon: 'icon_bow' },

  // Staves
  { baseName: 'Short Staff', type: 'WEAPON_STAFF', width: 1, height: 3, equipSlot: 'MAIN_HAND', minDamage: 2, maxDamage: 4, reqMagic: 15, value: 70, icon: 'icon_staff' },

  // Shields
  { baseName: 'Buckler', type: 'SHIELD', width: 2, height: 2, equipSlot: 'OFF_HAND', armorClass: 4, value: 40, icon: 'icon_buckler' },
  { baseName: 'Kite Shield', type: 'SHIELD', width: 2, height: 3, equipSlot: 'OFF_HAND', armorClass: 8, reqStrength: 25, value: 110, icon: 'icon_kite_shield' },

  // Helmets
  { baseName: 'Cap', type: 'HELMET', width: 2, height: 2, equipSlot: 'HEAD', armorClass: 2, value: 30, icon: 'icon_cap' },
  { baseName: 'Iron Helm', type: 'HELMET', width: 2, height: 2, equipSlot: 'HEAD', armorClass: 5, reqStrength: 20, value: 90, icon: 'icon_helm' },

  // Body Armor
  { baseName: 'Rags', type: 'BODY_ARMOR', width: 2, height: 3, equipSlot: 'TORSO', armorClass: 2, value: 10, icon: 'icon_rags' },
  { baseName: 'Leather Armor', type: 'BODY_ARMOR', width: 2, height: 3, equipSlot: 'TORSO', armorClass: 6, reqStrength: 15, value: 80, icon: 'icon_leather_armor' },
  { baseName: 'Chain Mail', type: 'BODY_ARMOR', width: 2, height: 3, equipSlot: 'TORSO', armorClass: 14, reqStrength: 25, value: 200, icon: 'icon_chain_mail' },
  { baseName: 'Plate Mail', type: 'BODY_ARMOR', width: 2, height: 3, equipSlot: 'TORSO', armorClass: 24, reqStrength: 40, value: 450, icon: 'icon_plate_mail' },

  // Jewelry
  { baseName: 'Ring', type: 'RING', width: 1, height: 1, equipSlot: 'RING', value: 100, icon: 'icon_ring' },
  { baseName: 'Amulet', type: 'AMULET', width: 1, height: 1, equipSlot: 'AMULET', value: 150, icon: 'icon_amulet' },

  // Consumables
  { baseName: 'Potion of Healing', type: 'POTION_HEALTH', width: 1, height: 1, healHp: 50, value: 35, icon: 'icon_potion_red', description: 'Restores 50 Life.' },
  { baseName: 'Potion of Mana', type: 'POTION_MANA', width: 1, height: 1, restoreMp: 40, value: 35, icon: 'icon_potion_blue', description: 'Restores 40 Mana.' },
  { baseName: 'Potion of Rejuvenation', type: 'POTION_REJUV', width: 1, height: 1, healHp: 100, restoreMp: 100, value: 100, icon: 'icon_potion_purple', description: 'Fully restores Life & Mana.' },
  { baseName: 'Scroll of Town Portal', type: 'SCROLL', width: 1, height: 1, spellId: 'town_portal', value: 50, icon: 'icon_scroll', description: 'Opens a portal back to Tristram.' },
  { baseName: 'Scroll of Firebolt', type: 'SCROLL', width: 1, height: 1, spellId: 'firebolt', value: 40, icon: 'icon_scroll', description: 'Hurls a searing fiery bolt.' },

  // Spellbooks
  { baseName: 'Book of Firebolt', type: 'BOOK', width: 2, height: 2, spellId: 'firebolt', reqMagic: 15, value: 200, icon: 'icon_book', description: 'Teaches the Firebolt spell.' },
  { baseName: 'Book of Holy Bolt', type: 'BOOK', width: 2, height: 2, spellId: 'holy_bolt', reqMagic: 20, value: 250, icon: 'icon_book', description: 'Teaches Holy Bolt (damages undead).' },
  { baseName: 'Book of Healing', type: 'BOOK', width: 2, height: 2, spellId: 'heal', reqMagic: 18, value: 300, icon: 'icon_book', description: 'Teaches the Healing spell.' }
];

export class ItemGenerator {
  private static idCounter: number = 1;

  public static nextId(): string {
    return `item_${Date.now()}_${this.idCounter++}`;
  }

  /**
   * Create Butcher's Cleaver unique item
   */
  public static createButchersCleaver(): ItemData {
    return {
      id: this.nextId(),
      name: "The Butcher's Cleaver",
      baseName: "The Butcher's Cleaver",
      type: 'WEAPON_MELEE',
      rarity: 'UNIQUE',
      width: 2,
      height: 3,
      equipSlot: 'MAIN_HAND',
      minDamage: 6,
      maxDamage: 16,
      reqStrength: 30,
      value: 800,
      icon: 'icon_cleaver',
      description: 'Forged in blood. Smells of fresh meat.',
      affixes: [],
      totalBonus: {
        strength: 10,
        vitality: 5,
        maxHp: 25,
        minDamage: 2,
        maxDamage: 4
      }
    };
  }

  /**
   * Create Gold item
   */
  public static createGold(amount: number): ItemData {
    return {
      id: this.nextId(),
      name: `${amount} Gold`,
      baseName: 'Gold',
      type: 'GOLD',
      rarity: 'NORMAL',
      width: 1,
      height: 1,
      goldAmount: amount,
      value: amount,
      icon: amount > 50 ? 'icon_gold_large' : 'icon_gold_small',
      affixes: [],
      totalBonus: {}
    };
  }

  /**
   * Create starting equipment for classes
   */
  public static getStarterItems(classType: 'WARRIOR' | 'ROGUE' | 'SORCERER'): ItemData[] {
    const items: ItemData[] = [];

    if (classType === 'WARRIOR') {
      items.push(this.createItemFromTemplate('Short Sword', 'NORMAL'));
      items.push(this.createItemFromTemplate('Buckler', 'NORMAL'));
      items.push(this.createItemFromTemplate('Leather Armor', 'NORMAL'));
      items.push(this.createItemFromTemplate('Potion of Healing', 'NORMAL'));
      items.push(this.createItemFromTemplate('Potion of Healing', 'NORMAL'));
      items.push(this.createItemFromTemplate('Scroll of Town Portal', 'NORMAL'));
    } else if (classType === 'ROGUE') {
      items.push(this.createItemFromTemplate('Short Bow', 'NORMAL'));
      items.push(this.createItemFromTemplate('Cap', 'NORMAL'));
      items.push(this.createItemFromTemplate('Leather Armor', 'NORMAL'));
      items.push(this.createItemFromTemplate('Potion of Healing', 'NORMAL'));
      items.push(this.createItemFromTemplate('Potion of Mana', 'NORMAL'));
      items.push(this.createItemFromTemplate('Scroll of Town Portal', 'NORMAL'));
    } else if (classType === 'SORCERER') {
      items.push(this.createItemFromTemplate('Short Staff', 'NORMAL'));
      items.push(this.createItemFromTemplate('Rags', 'NORMAL'));
      items.push(this.createItemFromTemplate('Potion of Mana', 'NORMAL'));
      items.push(this.createItemFromTemplate('Potion of Mana', 'NORMAL'));
      items.push(this.createItemFromTemplate('Potion of Healing', 'NORMAL'));
      items.push(this.createItemFromTemplate('Scroll of Town Portal', 'NORMAL'));
    }

    return items;
  }

  public static createItemFromTemplate(baseName: string, rarity: ItemRarity = 'NORMAL'): ItemData {
    const template = BASE_ITEMS.find(i => i.baseName === baseName) || BASE_ITEMS[0];
    const item: ItemData = {
      id: this.nextId(),
      name: template.baseName,
      baseName: template.baseName,
      type: template.type,
      rarity: rarity,
      width: template.width,
      height: template.height,
      equipSlot: template.equipSlot,
      minDamage: template.minDamage,
      maxDamage: template.maxDamage,
      armorClass: template.armorClass,
      reqStrength: template.reqStrength,
      reqDexterity: template.reqDexterity,
      reqMagic: template.reqMagic,
      value: template.value,
      icon: template.icon,
      healHp: template.healHp,
      restoreMp: template.restoreMp,
      spellId: template.spellId,
      description: template.description,
      affixes: [],
      totalBonus: {}
    };

    if (rarity === 'MAGIC' || rarity === 'RARE') {
      this.rollAffixes(item, rarity);
    }

    return item;
  }

  public static generateRandomDrop(floorLevel: number): ItemData {
    // 30% chance for Gold drop
    if (Math.random() < 0.35) {
      const amount = Math.floor(10 + Math.random() * (floorLevel * 40));
      return this.createGold(amount);
    }

    // Roll rarity
    let rarity: ItemRarity = 'NORMAL';
    const roll = Math.random();
    if (roll < 0.03) {
      rarity = 'RARE';
    } else if (roll < 0.30) {
      rarity = 'MAGIC';
    }

    // Select candidate base items
    const candidates = BASE_ITEMS.filter(item => {
      if (floorLevel === 1) {
        return (item.value <= 150) || item.type.startsWith('POTION') || item.type === 'SCROLL';
      }
      return true;
    });

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    return this.createItemFromTemplate(chosen.baseName, rarity);
  }

  private static rollAffixes(item: ItemData, rarity: ItemRarity): void {
    const affixes: typeof item.affixes = [];
    const isEquipable = item.equipSlot !== undefined || item.type === 'RING' || item.type === 'AMULET';
    if (!isEquipable) return;

    // Pick prefix
    const hasPrefix = Math.random() < (rarity === 'RARE' ? 0.9 : 0.6);
    if (hasPrefix) {
      const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
      affixes.push(prefix);
    }

    // Pick suffix
    const hasSuffix = Math.random() < (rarity === 'RARE' ? 0.9 : 0.6) || affixes.length === 0;
    if (hasSuffix) {
      const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
      affixes.push(suffix);
    }

    item.affixes = affixes;

    // Assemble name
    const prefixName = affixes.find(a => a.type === 'PREFIX')?.name;
    const suffixName = affixes.find(a => a.type === 'SUFFIX')?.name;
    let fullName = item.baseName;
    if (prefixName) fullName = `${prefixName} ${fullName}`;
    if (suffixName) fullName = `${fullName} ${suffixName}`;
    item.name = fullName;

    // Aggregate bonus
    const totalBonus: AttributeBonus = {};
    for (const affix of affixes) {
      for (const [key, val] of Object.entries(affix.bonus)) {
        const k = key as keyof AttributeBonus;
        totalBonus[k] = (totalBonus[k] || 0) + (val || 0);
      }
    }
    item.totalBonus = totalBonus;
    item.value = Math.floor(item.value * (1 + affixes.length * 1.5));
  }
}
