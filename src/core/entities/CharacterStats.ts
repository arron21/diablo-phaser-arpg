export type CharacterClass = 'WARRIOR' | 'ROGUE' | 'SORCERER';

export interface AttributeBonus {
  strength?: number;
  dexterity?: number;
  magic?: number;
  vitality?: number;
  maxHp?: number;
  maxMp?: number;
  armorClass?: number;
  toHit?: number;
  minDamage?: number;
  maxDamage?: number;
  fireResist?: number;
  lightningResist?: number;
}

export class CharacterStats {
  public name: string;
  public classType: CharacterClass;

  // Level & Progression
  public level: number = 1;
  public experience: number = 0;
  public nextLevelExp: number = 100;
  public unallocatedPoints: number = 0;

  // Base Attributes
  public baseStrength: number;
  public baseDexterity: number;
  public baseMagic: number;
  public baseVitality: number;

  // Current Health & Mana
  public currentHp: number = 0;
  public currentMp: number = 0;

  // Gold
  public gold: number = 100;

  // Temporary / Equipment bonuses
  public bonus: Required<AttributeBonus> = {
    strength: 0,
    dexterity: 0,
    magic: 0,
    vitality: 0,
    maxHp: 0,
    maxMp: 0,
    armorClass: 0,
    toHit: 0,
    minDamage: 0,
    maxDamage: 0,
    fireResist: 0,
    lightningResist: 0
  };

  constructor(classType: CharacterClass, name?: string) {
    this.classType = classType;
    this.name = name || this.getDefaultName(classType);

    switch (classType) {
      case 'WARRIOR':
        this.baseStrength = 30;
        this.baseDexterity = 20;
        this.baseMagic = 10;
        this.baseVitality = 25;
        this.gold = 150;
        break;
      case 'ROGUE':
        this.baseStrength = 20;
        this.baseDexterity = 30;
        this.baseMagic = 15;
        this.baseVitality = 20;
        this.gold = 120;
        break;
      case 'SORCERER':
        this.baseStrength = 15;
        this.baseDexterity = 15;
        this.baseMagic = 35;
        this.baseVitality = 15;
        this.gold = 100;
        break;
    }

    this.currentHp = this.totalMaxHp;
    this.currentMp = this.totalMaxMp;
  }

  private getDefaultName(classType: CharacterClass): string {
    switch (classType) {
      case 'WARRIOR': return 'Aidan the Warrior';
      case 'ROGUE': return 'Moreina the Rogue';
      case 'SORCERER': return 'Jazreth the Sorcerer';
    }
  }

  // Effective Total Attributes
  public get strength(): number {
    return Math.max(1, this.baseStrength + this.bonus.strength);
  }

  public get dexterity(): number {
    return Math.max(1, this.baseDexterity + this.bonus.dexterity);
  }

  public get magic(): number {
    return Math.max(1, this.baseMagic + this.bonus.magic);
  }

  public get vitality(): number {
    return Math.max(1, this.baseVitality + this.bonus.vitality);
  }

  // Derived Health & Mana
  public get totalMaxHp(): number {
    let hpPerVit = 2;
    if (this.classType === 'WARRIOR') hpPerVit = 2.5;
    else if (this.classType === 'SORCERER') hpPerVit = 1.5;

    const baseHp = 30 + Math.floor(this.vitality * hpPerVit) + (this.level - 1) * 4;
    return Math.max(1, baseHp + this.bonus.maxHp);
  }

  public get maxHp(): number {
    return this.totalMaxHp;
  }

  public get totalMaxMp(): number {
    let mpPerMag = 1.5;
    if (this.classType === 'SORCERER') mpPerMag = 2.5;
    else if (this.classType === 'WARRIOR') mpPerMag = 1.0;

    const baseMp = 10 + Math.floor(this.magic * mpPerMag) + (this.level - 1) * 3;
    return Math.max(1, baseMp + this.bonus.maxMp);
  }

  // Combat Stats
  public get totalArmorClass(): number {
    const dexBonus = Math.floor(this.dexterity / 5);
    return Math.max(0, dexBonus + this.bonus.armorClass);
  }

  public get armorClass(): number {
    return this.totalArmorClass;
  }

  public get totalToHit(): number {
    const dexBonus = Math.floor(this.dexterity / 2);
    return 50 + dexBonus + this.level * 2 + this.bonus.toHit;
  }

  public get toHit(): number {
    return this.totalToHit;
  }

  public get damageRange(): { min: number; max: number } {
    let statMod = this.strength;
    if (this.classType === 'ROGUE') {
      statMod = Math.floor((this.strength + this.dexterity) / 2);
    }
    const damageBonus = Math.floor(statMod / 10);
    const min = Math.max(1, 1 + damageBonus + this.bonus.minDamage);
    const max = Math.max(min, 3 + damageBonus + this.bonus.maxDamage);
    return { min, max };
  }

  public get blockChance(): number {
    if (this.classType === 'WARRIOR') {
      return Math.min(75, Math.floor(this.dexterity * 0.5) + 30);
    }
    return Math.min(50, Math.floor(this.dexterity * 0.3) + 15);
  }

  // Experience and Level Up
  public addExperience(amount: number): boolean {
    this.experience += amount;
    let leveledUp = false;

    while (this.experience >= this.nextLevelExp) {
      this.level++;
      this.unallocatedPoints += 5;
      this.nextLevelExp = Math.floor(this.nextLevelExp * 2.2);
      this.currentHp = this.totalMaxHp;
      this.currentMp = this.totalMaxMp;
      leveledUp = true;
    }

    return leveledUp;
  }

  public allocatePoint(attribute: 'strength' | 'dexterity' | 'magic' | 'vitality'): boolean {
    if (this.unallocatedPoints <= 0) return false;
    this.unallocatedPoints--;

    switch (attribute) {
      case 'strength': this.baseStrength++; break;
      case 'dexterity': this.baseDexterity++; break;
      case 'magic': this.baseMagic++; break;
      case 'vitality': this.baseVitality++; break;
    }

    // Refresh clamp
    this.currentHp = Math.min(this.currentHp, this.totalMaxHp);
    this.currentMp = Math.min(this.currentMp, this.totalMaxMp);
    return true;
  }

  public heal(amount: number): number {
    const prev = this.currentHp;
    this.currentHp = Math.min(this.totalMaxHp, this.currentHp + amount);
    return this.currentHp - prev;
  }

  public restoreMana(amount: number): number {
    const prev = this.currentMp;
    this.currentMp = Math.min(this.totalMaxMp, this.currentMp + amount);
    return this.currentMp - prev;
  }

  public takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount);
    this.currentHp = Math.max(0, this.currentHp - actualDamage);
    return actualDamage;
  }

  public consumeMana(amount: number): boolean {
    if (this.currentMp < amount) return false;
    this.currentMp -= amount;
    return true;
  }

  public resetBonus(): void {
    this.bonus = {
      strength: 0,
      dexterity: 0,
      magic: 0,
      vitality: 0,
      maxHp: 0,
      maxMp: 0,
      armorClass: 0,
      toHit: 0,
      minDamage: 0,
      maxDamage: 0,
      fireResist: 0,
      lightningResist: 0
    };
  }

  public applyBonus(b: AttributeBonus): void {
    if (b.strength) this.bonus.strength += b.strength;
    if (b.dexterity) this.bonus.dexterity += b.dexterity;
    if (b.magic) this.bonus.magic += b.magic;
    if (b.vitality) this.bonus.vitality += b.vitality;
    if (b.maxHp) this.bonus.maxHp += b.maxHp;
    if (b.maxMp) this.bonus.maxMp += b.maxMp;
    if (b.armorClass) this.bonus.armorClass += b.armorClass;
    if (b.toHit) this.bonus.toHit += b.toHit;
    if (b.minDamage) this.bonus.minDamage += b.minDamage;
    if (b.maxDamage) this.bonus.maxDamage += b.maxDamage;
    if (b.fireResist) this.bonus.fireResist += b.fireResist;
    if (b.lightningResist) this.bonus.lightningResist += b.lightningResist;

    this.currentHp = Math.min(this.currentHp, this.totalMaxHp);
    this.currentMp = Math.min(this.currentMp, this.totalMaxMp);
  }
}
