export interface SpellDefinition {
  id: string;
  name: string;
  manaCost: number;
  minDamage?: number;
  maxDamage?: number;
  healMin?: number;
  healMax?: number;
  projectileSpeed?: number;
  projectileTexture?: string;
  description: string;
  icon: string;
}

export const SPELLS: Record<string, SpellDefinition> = {
  firebolt: {
    id: 'firebolt',
    name: 'Firebolt',
    manaCost: 6,
    minDamage: 6,
    maxDamage: 12,
    projectileSpeed: 320,
    projectileTexture: 'spell_firebolt',
    description: 'Hurls a bolt of fiery death at your enemies.',
    icon: 'icon_spell_firebolt'
  },
  charged_bolt: {
    id: 'charged_bolt',
    name: 'Charged Bolt',
    manaCost: 10,
    minDamage: 4,
    maxDamage: 8,
    projectileSpeed: 240,
    projectileTexture: 'spell_charged_bolt',
    description: 'Releases erratic sparks of charged electricity.',
    icon: 'icon_spell_charged'
  },
  holy_bolt: {
    id: 'holy_bolt',
    name: 'Holy Bolt',
    manaCost: 8,
    minDamage: 12,
    maxDamage: 22,
    projectileSpeed: 300,
    projectileTexture: 'spell_holy_bolt',
    description: 'A conduit of divine radiant light that purges the undead.',
    icon: 'icon_spell_holy'
  },
  heal: {
    id: 'heal',
    name: 'Healing',
    manaCost: 12,
    healMin: 35,
    healMax: 65,
    description: 'Restores vitality through restorative magical power.',
    icon: 'icon_spell_heal'
  },
  town_portal: {
    id: 'town_portal',
    name: 'Town Portal',
    manaCost: 15,
    description: 'Opens a mystic gateway between the labyrinth and Tristram.',
    icon: 'icon_spell_portal'
  }
};
