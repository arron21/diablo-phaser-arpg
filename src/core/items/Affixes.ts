import { ItemAffix } from './ItemTypes';

export const PREFIXES: ItemAffix[] = [
  // To-Hit prefixes (Weapons)
  { name: 'Bronze', type: 'PREFIX', bonus: { toHit: 5 } },
  { name: 'Iron', type: 'PREFIX', bonus: { toHit: 10 } },
  { name: 'Steel', type: 'PREFIX', bonus: { toHit: 18 } },
  { name: 'Silver', type: 'PREFIX', bonus: { toHit: 25 } },
  { name: 'Gold', type: 'PREFIX', bonus: { toHit: 35 } },

  // Damage prefixes (Weapons)
  { name: 'Jagged', type: 'PREFIX', bonus: { minDamage: 1, maxDamage: 3 } },
  { name: 'Deadly', type: 'PREFIX', bonus: { minDamage: 3, maxDamage: 6 } },
  { name: 'Heavy', type: 'PREFIX', bonus: { minDamage: 2, maxDamage: 4 } },
  { name: 'Brutal', type: 'PREFIX', bonus: { minDamage: 4, maxDamage: 8 } },

  // Armor prefixes (Armor & Shields)
  { name: 'Fine', type: 'PREFIX', bonus: { armorClass: 3 } },
  { name: 'Strong', type: 'PREFIX', bonus: { armorClass: 6 } },
  { name: 'Grand', type: 'PREFIX', bonus: { armorClass: 10 } },
  { name: 'Saintly', type: 'PREFIX', bonus: { armorClass: 16 } },
  { name: 'Godly', type: 'PREFIX', bonus: { armorClass: 25 } },

  // Resistance prefixes
  { name: 'Ruby', type: 'PREFIX', bonus: { fireResist: 20 } },
  { name: 'Cobalt', type: 'PREFIX', bonus: { lightningResist: 20 } }
];

export const SUFFIXES: ItemAffix[] = [
  // Attribute suffixes
  { name: 'of Strength', type: 'SUFFIX', bonus: { strength: 4 } },
  { name: 'of Might', type: 'SUFFIX', bonus: { strength: 8 } },
  { name: 'of Dexterity', type: 'SUFFIX', bonus: { dexterity: 4 } },
  { name: 'of Skill', type: 'SUFFIX', bonus: { dexterity: 8 } },
  { name: 'of Magic', type: 'SUFFIX', bonus: { magic: 5 } },
  { name: 'of the Mind', type: 'SUFFIX', bonus: { magic: 10 } },
  { name: 'of Vitality', type: 'SUFFIX', bonus: { vitality: 5 } },

  // Health & Mana suffixes
  { name: 'of the Wolf', type: 'SUFFIX', bonus: { maxHp: 15 } },
  { name: 'of the Tiger', type: 'SUFFIX', bonus: { maxHp: 30 } },
  { name: 'of the Whale', type: 'SUFFIX', bonus: { maxHp: 60 } },
  { name: 'of the Bat', type: 'SUFFIX', bonus: { maxMp: 20 } },

  // All attributes
  { name: 'of the Stars', type: 'SUFFIX', bonus: { strength: 5, dexterity: 5, magic: 5, vitality: 5 } },
  { name: 'of the Zodiac', type: 'SUFFIX', bonus: { strength: 10, dexterity: 10, magic: 10, vitality: 10 } }
];
