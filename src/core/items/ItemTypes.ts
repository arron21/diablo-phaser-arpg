import { AttributeBonus } from '../entities/CharacterStats';

export type ItemRarity = 'NORMAL' | 'MAGIC' | 'RARE' | 'UNIQUE';

export type ItemType =
  | 'WEAPON_MELEE'
  | 'WEAPON_RANGED'
  | 'WEAPON_STAFF'
  | 'SHIELD'
  | 'HELMET'
  | 'BODY_ARMOR'
  | 'RING'
  | 'AMULET'
  | 'POTION_HEALTH'
  | 'POTION_MANA'
  | 'POTION_REJUV'
  | 'SCROLL'
  | 'BOOK'
  | 'GOLD';

export type EquipmentSlot =
  | 'HEAD'
  | 'TORSO'
  | 'MAIN_HAND'
  | 'OFF_HAND'
  | 'AMULET'
  | 'RING_LEFT'
  | 'RING_RIGHT';

export interface ItemAffix {
  name: string;
  type: 'PREFIX' | 'SUFFIX';
  bonus: AttributeBonus;
}

export interface ItemData {
  id: string;
  name: string;
  baseName: string;
  type: ItemType;
  rarity: ItemRarity;
  // Inventory dimensions (cols x rows)
  width: number;
  height: number;
  // Equipment slot suitability
  equipSlot?: EquipmentSlot | 'RING'; // RING can go to RING_LEFT or RING_RIGHT
  // Combat stats
  minDamage?: number;
  maxDamage?: number;
  armorClass?: number;
  durability?: number;
  maxDurability?: number;
  // Stat requirements
  reqStrength?: number;
  reqDexterity?: number;
  reqMagic?: number;
  // Value
  value: number;
  // Affixes & Modifiers
  affixes: ItemAffix[];
  totalBonus: AttributeBonus;
  // Consumable/Spell effect
  spellId?: string;
  healHp?: number;
  restoreMp?: number;
  goldAmount?: number;
  // Texture key / Icon name
  icon: string;
  description?: string;
}
