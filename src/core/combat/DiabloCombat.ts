export interface Combatant {
  level: number;
  armorClass: number;
  toHit: number;
  blockChance: number;
  damageRange: { min: number; max: number };
  maxHp: number;
  currentHp: number;
}

export interface AttackResult {
  hit: boolean;
  blocked: boolean;
  critical: boolean;
  damage: number;
  hitRecovery: boolean; // Triggers stun-lock if true
}

export class DiabloCombat {
  /**
   * Resolve an attack from attacker to defender according to Diablo 1 rules
   */
  public static resolveAttack(
    attacker: Combatant,
    defender: Combatant,
    isCritEligible: boolean = false
  ): AttackResult {
    // 1. Calculate Chance to Hit (clamped 5% to 95%)
    let toHitChance = 50 + attacker.toHit - defender.armorClass + (attacker.level - defender.level) * 2;
    toHitChance = Math.max(5, Math.min(95, toHitChance));

    const hitRoll = Math.random() * 100;
    if (hitRoll > toHitChance) {
      return { hit: false, blocked: false, critical: false, damage: 0, hitRecovery: false };
    }

    // 2. Shield Block Check
    if (defender.blockChance > 0) {
      const blockRoll = Math.random() * 100;
      if (blockRoll < defender.blockChance) {
        return { hit: true, blocked: true, critical: false, damage: 0, hitRecovery: false };
      }
    }

    // 3. Roll Damage
    const minDmg = attacker.damageRange.min;
    const maxDmg = attacker.damageRange.max;
    let baseDmg = Math.floor(minDmg + Math.random() * (maxDmg - minDmg + 1));

    // 4. Critical Hit Check
    let isCritical = false;
    if (isCritEligible && Math.random() < 0.20) {
      isCritical = true;
      baseDmg = Math.floor(baseDmg * 1.75);
    }

    // Ensure at least 1 damage on hit
    const damage = Math.max(1, baseDmg);

    // 5. Hit Recovery Check (damage >= MaxHP / 8)
    const hitRecoveryThreshold = Math.max(1, Math.floor(defender.maxHp / 8));
    const hitRecovery = damage >= hitRecoveryThreshold;

    return {
      hit: true,
      blocked: false,
      critical: isCritical,
      damage,
      hitRecovery
    };
  }
}
