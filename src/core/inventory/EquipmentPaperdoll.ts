import { ItemData, EquipmentSlot } from '../items/ItemTypes';
import { CharacterStats, AttributeBonus } from '../entities/CharacterStats';

export class EquipmentPaperdoll {
  public head: ItemData | null = null;
  public torso: ItemData | null = null;
  public mainHand: ItemData | null = null;
  public offHand: ItemData | null = null;
  public amulet: ItemData | null = null;
  public ringLeft: ItemData | null = null;
  public ringRight: ItemData | null = null;

  // 8-slot belt for quick potions (hotkeys 1-8)
  public belt: (ItemData | null)[] = [null, null, null, null, null, null, null, null];

  private stats: CharacterStats;

  constructor(stats: CharacterStats) {
    this.stats = stats;
  }

  public getSlotItem(slot: EquipmentSlot): ItemData | null {
    switch (slot) {
      case 'HEAD': return this.head;
      case 'TORSO': return this.torso;
      case 'MAIN_HAND': return this.mainHand;
      case 'OFF_HAND': return this.offHand;
      case 'AMULET': return this.amulet;
      case 'RING_LEFT': return this.ringLeft;
      case 'RING_RIGHT': return this.ringRight;
    }
  }

  public canEquip(item: ItemData, slot: EquipmentSlot): { success: boolean; reason?: string } {
    // Check if slot type matches
    if (slot === 'RING_LEFT' || slot === 'RING_RIGHT') {
      if (item.type !== 'RING') return { success: false, reason: 'Must be a ring' };
    } else if (item.equipSlot !== slot) {
      return { success: false, reason: 'Invalid slot for item type' };
    }

    // Check attribute requirements
    if (item.reqStrength && this.stats.strength < item.reqStrength) {
      return { success: false, reason: `Requires ${item.reqStrength} Strength` };
    }
    if (item.reqDexterity && this.stats.dexterity < item.reqDexterity) {
      return { success: false, reason: `Requires ${item.reqDexterity} Dexterity` };
    }
    if (item.reqMagic && this.stats.magic < item.reqMagic) {
      return { success: false, reason: `Requires ${item.reqMagic} Magic` };
    }

    return { success: true };
  }

  public equip(item: ItemData, slot: EquipmentSlot): ItemData | null {
    const check = this.canEquip(item, slot);
    if (!check.success) return null;

    const previousItem = this.getSlotItem(slot);

    switch (slot) {
      case 'HEAD': this.head = item; break;
      case 'TORSO': this.torso = item; break;
      case 'MAIN_HAND': this.mainHand = item; break;
      case 'OFF_HAND': this.offHand = item; break;
      case 'AMULET': this.amulet = item; break;
      case 'RING_LEFT': this.ringLeft = item; break;
      case 'RING_RIGHT': this.ringRight = item; break;
    }

    this.recalculateStats();
    return previousItem;
  }

  public unequip(slot: EquipmentSlot): ItemData | null {
    const item = this.getSlotItem(slot);
    if (!item) return null;

    switch (slot) {
      case 'HEAD': this.head = null; break;
      case 'TORSO': this.torso = null; break;
      case 'MAIN_HAND': this.mainHand = null; break;
      case 'OFF_HAND': this.offHand = null; break;
      case 'AMULET': this.amulet = null; break;
      case 'RING_LEFT': this.ringLeft = null; break;
      case 'RING_RIGHT': this.ringRight = null; break;
    }

    this.recalculateStats();
    return item;
  }

  // Belt operations
  public setBeltSlot(slotIndex: number, item: ItemData | null): ItemData | null {
    if (slotIndex < 0 || slotIndex >= 8) return null;
    const old = this.belt[slotIndex];
    this.belt[slotIndex] = item;
    return old;
  }

  public useBeltSlot(slotIndex: number): ItemData | null {
    if (slotIndex < 0 || slotIndex >= 8) return null;
    const item = this.belt[slotIndex];
    if (!item) return null;

    // Apply consumable effect
    if (item.healHp) this.stats.heal(item.healHp);
    if (item.restoreMp) this.stats.restoreMana(item.restoreMp);

    this.belt[slotIndex] = null;
    return item;
  }

  public recalculateStats(): void {
    this.stats.resetBonus();

    const equipped: (ItemData | null)[] = [
      this.head,
      this.torso,
      this.mainHand,
      this.offHand,
      this.amulet,
      this.ringLeft,
      this.ringRight
    ];

    for (const item of equipped) {
      if (!item) continue;

      const bonus: AttributeBonus = { ...item.totalBonus };

      // Add base item properties
      if (item.armorClass) {
        bonus.armorClass = (bonus.armorClass || 0) + item.armorClass;
      }
      if (item.minDamage) {
        bonus.minDamage = (bonus.minDamage || 0) + item.minDamage;
      }
      if (item.maxDamage) {
        bonus.maxDamage = (bonus.maxDamage || 0) + item.maxDamage;
      }

      this.stats.applyBonus(bonus);
    }
  }
}
