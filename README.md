# Catacomb: Classic Diablo ARPG

A classic dark fantasy Action Role-Playing Game (ARPG) inspired by the original 1996 *Diablo*, engineered with **Phaser 3**, **TypeScript**, and **Vite**.

![Phaser 3](https://img.shields.io/badge/Phaser-3.88-red.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)
![Vitest](https://img.shields.io/badge/Vitest-5.0-green.svg)
[![Deploy to GitHub Pages](https://github.com/arron21/diablo-phaser-arpg/actions/workflows/deploy.yml/badge.svg)](https://github.com/arron21/diablo-phaser-arpg/actions/workflows/deploy.yml)

### 🎮 **[Play Live in Browser](https://arron21.github.io/diablo-phaser-arpg/)**

---

## Features

- **3 Classic Archetypes**:
  - **Warrior**: Master of sword and shield, high strength, rapid hit recovery, and +30% innate shield block chance.
  - **Rogue**: Ranged bow specialist, high dexterity, agile movement, and deadly critical strikes.
  - **Sorcerer**: Arcane caster wielding rune staves, massive mana pools, fast spellcasting, and starting firebolt magic.
- **Tristram Town Hub**:
  - Safe haven with interactive townspeople: **Griswold the Blacksmith**, **Pepin the Healer**, **Adria the Witch**, and **Deckard Cain the Elder**.
  - Stone fountain, ambient paths, and the Cathedral entrance.
- **Procedural Cathedral Labyrinth & The Butcher's Lair**:
  - Binary Space Partitioning (BSP) dungeon generator creating randomized rooms, corridors, stone walls, and arched doorways.
  - Floor 2 houses **The Butcher** in his blood-soaked chamber with his signature cry: *"Ah, fresh meat!"*. Defeating him yields **The Butcher's Cleaver** (Unique weapon).
- **Authentic Diablo Systems**:
  - **10x4 Spatial Inventory Tetris**: Multi-cell items (`1x1` potions/scrolls, `1x2` helmets/bucklers, `2x3` swords/armor) with drag-and-drop.
  - **Equipment Paperdoll**: 7 equipment slots with stat requirement checks (Strength, Dexterity, Magic).
  - **8-Slot Potion Belt**: Hotkeys `1-8` for instant drinking.
  - **Diablo 1 Combat Math**: To-hit vs Armor Class, shield blocking, damage rolls, and stun-lock hit recovery thresholds ($\text{Damage} \ge \text{MaxHP} / 8$).
  - **Fallen Ones Cowardice**: When a Fallen One dies, nearby allies flee in screaming panic for 3 seconds.
  - **Spells**: Firebolt, Charged Bolt, Holy Bolt, Healing, and Town Portal.
  - **Dungeon Interactables**: Shrines with random buffs, chests, breakable barrels, and loot drops.
- **Dynamic Field of View (FOV) & Torchlight**:
  - Recursive shadowcasting raycaster with torchlight falloff, amber tinting, and fog-of-war memory.
- **100% Self-Contained Audiovisuals**:
  - Procedural pixel-art generator for all tiles, characters, monsters, orbs, and icons.
  - Built-in Web Audio API synthesizer generating Matt Uelmen-inspired Tristram acoustic guitar arpeggios, subterranean ambient drones, and visceral retro sound effects.
  - Zero external image or audio file dependencies.

---

## Controls

| Action | Control |
|---|---|
| **Move / Walk** | Left-click on floor (or hold Left-click to walk) |
| **Direct Movement** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Attack Enemy** | Left-click on enemy |
| **Attack in Place** | `Shift` + Left-click |
| **Cast Active Spell** | Right-click |
| **Inventory Window** | `I` key |
| **Character Sheet** | `C` key |
| **Spellbook** | `S` key |
| **Quick Belt Potions** | Keys `1` through `8` |
| **Quick Equip / Consume** | Right-click item in inventory |
| **Mute / Unmute Audio** | Speaker button in top-right corner |

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/arron21/diablo-phaser-arpg.git
cd diablo-phaser-arpg

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

---

## License
MIT
