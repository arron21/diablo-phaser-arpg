import { Combatant } from '../combat/DiabloCombat';

export type MonsterState =
  | 'IDLE'
  | 'PATROL'
  | 'CHASE'
  | 'ATTACK'
  | 'HIT_STUN'
  | 'FLEE'
  | 'DEAD';

export type MonsterType =
  | 'FALLEN_ONE'
  | 'SKELETON_WARRIOR'
  | 'SKELETON_ARCHER'
  | 'THE_BUTCHER';

export interface MonsterConfig {
  name: string;
  type: MonsterType;
  maxHp: number;
  armorClass: number;
  toHit: number;
  blockChance: number;
  damageRange: { min: number; max: number };
  level: number;
  expReward: number;
  walkSpeed: number; // tiles per second
  attackRange: number; // grid distance
  attackCooldown: number; // milliseconds
  isBoss?: boolean;
}

export const MONSTER_TEMPLATES: Record<MonsterType, MonsterConfig> = {
  FALLEN_ONE: {
    name: 'Fallen One',
    type: 'FALLEN_ONE',
    maxHp: 12,
    armorClass: 2,
    toHit: 35,
    blockChance: 0,
    damageRange: { min: 1, max: 4 },
    level: 1,
    expReward: 25,
    walkSpeed: 3.2,
    attackRange: 1.1,
    attackCooldown: 850
  },
  SKELETON_WARRIOR: {
    name: 'Skeleton Warrior',
    type: 'SKELETON_WARRIOR',
    maxHp: 22,
    armorClass: 6,
    toHit: 45,
    blockChance: 20,
    damageRange: { min: 2, max: 6 },
    level: 2,
    expReward: 40,
    walkSpeed: 2.2,
    attackRange: 1.1,
    attackCooldown: 1000
  },
  SKELETON_ARCHER: {
    name: 'Skeleton Archer',
    type: 'SKELETON_ARCHER',
    maxHp: 16,
    armorClass: 4,
    toHit: 50,
    blockChance: 0,
    damageRange: { min: 2, max: 5 },
    level: 2,
    expReward: 45,
    walkSpeed: 2.0,
    attackRange: 6.0,
    attackCooldown: 1400
  },
  THE_BUTCHER: {
    name: 'The Butcher',
    type: 'THE_BUTCHER',
    maxHp: 150,
    armorClass: 14,
    toHit: 65,
    blockChance: 10,
    damageRange: { min: 8, max: 18 },
    level: 4,
    expReward: 350,
    walkSpeed: 3.8,
    attackRange: 1.3,
    attackCooldown: 750,
    isBoss: true
  }
};

export class MonsterEntity implements Combatant {
  public id: string;
  public config: MonsterConfig;
  public state: MonsterState = 'IDLE';

  // Grid coordinates
  public x: number;
  public y: number;

  // Combatant interface
  public currentHp: number;
  public maxHp: number;
  public armorClass: number;
  public toHit: number;
  public blockChance: number;
  public damageRange: { min: number; max: number };
  public level: number;

  // Timers
  public lastAttackTime: number = 0;
  public hitStunTimer: number = 0;
  public fleeTimer: number = 0;
  public aggroRange: number = 8;
  public hasTriggeredBossCry: boolean = false;

  constructor(id: string, type: MonsterType, x: number, y: number) {
    this.id = id;
    this.config = { ...MONSTER_TEMPLATES[type] };
    this.x = x;
    this.y = y;

    this.maxHp = this.config.maxHp;
    this.currentHp = this.maxHp;
    this.armorClass = this.config.armorClass;
    this.toHit = this.config.toHit;
    this.blockChance = this.config.blockChance;
    this.damageRange = this.config.damageRange;
    this.level = this.config.level;

    if (this.config.isBoss) {
      this.aggroRange = 12;
    }
  }

  public takeDamage(amount: number, stunDuration: number = 300): boolean {
    this.currentHp = Math.max(0, this.currentHp - amount);
    if (this.currentHp <= 0) {
      this.state = 'DEAD';
      return true; // killed
    }

    if (stunDuration > 0) {
      this.state = 'HIT_STUN';
      this.hitStunTimer = stunDuration;
    }
    return false;
  }

  public triggerFlee(durationMs: number = 3000): void {
    if (this.config.type === 'FALLEN_ONE' && this.state !== 'DEAD') {
      this.state = 'FLEE';
      this.fleeTimer = durationMs;
    }
  }
}
