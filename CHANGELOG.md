# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] - 2026-09-30

### Fixed
- **HUD Initialization Lifecycle Bug**: Fixed `TypeError: Cannot read properties of undefined (reading 'setText')` at `UIScene.updateHUDValues`:
  - Added null-checks on `this.lifeText`, `this.manaText`, `this.levelText`, and `this.goldText` in `UIScene.updateHUDValues`.
  - Added initialization guards in `TownScene.create` and `DungeonScene.create` so `ui.updateHUDValues()` and `ui.refreshInventoryUI()` are only called if `UIScene` display elements have completed creation.
  - Added active gameplay scene stats synchronization in `UIScene.create()` so `UIScene` auto-binds to `TownScene` or `DungeonScene` upon mounting regardless of scene execution ordering.
  - Added `bringToTop('UIScene')` in `TitleScene` to ensure HUD overlay and modal windows always render above gameplay scenes.
  - Added defensive guards to `UIScene.refreshInventoryUI` and `UIScene.refreshCharSheet` to protect against partial scene tear-down or uninitialized UI states.

### Added
- **Automated Deployment**: GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs tests, builds the production bundle, and auto-deploys to GitHub Pages on every push to `main`.
- **Live Play URL**: Hosted live game at `https://arron21.github.io/diablo-phaser-arpg/` with build status badge in `README.md`.
- **Relative Asset Paths**: Configured `base: './'` in `vite.config.ts` to support subpath hosting on GitHub Pages and static CDNs.

## [1.0.0] - 2026-09-29

### Added
- **Core ARPG Engine**:
  - 2:1 dimetric isometric projection math with sub-tile grid navigation and dynamic Y-depth sorting.
  - Binary Space Partitioning (BSP) procedural cathedral dungeon generator.
  - Recursive shadowcasting Field of View (FOV) with circular torchlight gradient, amber tint falloff, and explored fog-of-war memory.
  - 8-directional A* pathfinding with diagonal corner-cutting prevention.
- **Classes**:
  - Class selection screen for Warrior, Rogue, and Sorcerer with class-specific base attributes and starter equipment.
- **Tristram Town Hub**:
  - Interactive NPCs: Griswold (Blacksmith/repairs), Pepin (Healer/potions), Adria (Witch/spells), Deckard Cain (Elder/identify).
  - Cathedral descent entrance.
- **Dungeon Levels & Boss**:
  - 2 procedural Cathedral floors.
  - Floor 2 Butcher's Chamber with blood decals, sound trigger (*"Ah, fresh meat!"*), aggressive chase AI, and unique Butcher's Cleaver drop.
- **Inventory & Items**:
  - Authentic 10x4 spatial "Inventory Tetris" supporting 1x1, 1x2, and 2x3 items.
  - 7-slot equipment paperdoll with stat requirements (Strength, Dexterity, Magic).
  - 8-slot potion belt with hotkeys 1-8.
  - Diablo 1 prefix/suffix affix generator with rarity tiers (Normal, Magic, Rare, Unique).
- **Diablo 1 Combat Math**:
  - To-hit vs Armor Class formula clamped between 5% and 95%.
  - Shield block rolls.
  - Stun-lock hit recovery triggered when damage $\ge \text{MaxHP} / 8$.
  - Fallen Ones cowardice mechanic (flee when nearby allies die).
- **Magic System**:
  - Firebolt, Charged Bolt, Holy Bolt, Healing, and Town Portal.
- **Self-Contained Audiovisuals**:
  - Procedural pixel art generation for tiles, characters, monsters, orbs, and icons.
  - Web Audio procedural synthesizer generating Tristram acoustic guitar arpeggios, dungeon ambient drone, and visceral retro SFX.
