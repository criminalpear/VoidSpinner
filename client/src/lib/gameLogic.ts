import { Fragment, GameState, FragmentType, Rarity } from "@shared/schema";
import { VoidRNG } from "./rng";

const rng = new VoidRNG();

// Fragment name generators
const baseItemNames = [
  'Gauntlets', 'Helmet', 'Chestplate', 'Boots', 'Sword', 'Shield', 'Staff', 'Bow', 'Ring', 'Amulet'
];

const componentNames = [
  'Void Iron', 'Crystal Shard', 'Essence Core', 'Flux Coil', 'Astral Fragment', 'Quantum Dust'
];

const modifierNames = [
  'Essence of Haste', 'Soul of Power', 'Spirit of Defense', 'Echo of Speed', 'Whisper of Void'
];

const rarityPrefixes = {
  'common': '',
  'uncommon': 'Enhanced',
  'rare': 'Superior',
  'epic': 'Masterwork',
  'legendary': 'Ancient',
  'mythic': 'Primordial',
  'void_touched': 'Void-Touched'
};

export function generateFragment(gameState: GameState): Omit<Fragment, 'id' | 'gameStateId' | 'createdAt'> {
  // Roll 1: Fragment Type
  const typeWeights = [
    { item: FragmentType.BASE_ITEM, weight: 30 },
    { item: FragmentType.COMPONENT, weight: 40 },
    { item: FragmentType.MODIFIER, weight: 25 },
    { item: FragmentType.BLUEPRINT, weight: 5 },
  ];
  
  const fragmentType = rng.weightedChoice(typeWeights);
  
  // Roll 2: Rarity (with device bonus)
  const rarityBonus = (gameState.rarityOddsLevel - 1) * 0.0005;
  const rarity = rng.rollRarity(rarityBonus);
  
  // Roll 3: Base Stats
  const baseStats = rng.generateBaseStats(rarity, fragmentType);
  
  // Roll 4: Implicit Modifiers
  const implicitMods = rng.generateImplicitMods(rarity);
  
  // Generate name
  let baseName: string;
  switch (fragmentType) {
    case FragmentType.BASE_ITEM:
      baseName = baseItemNames[rng.randomInt(0, baseItemNames.length - 1)];
      break;
    case FragmentType.COMPONENT:
      baseName = componentNames[rng.randomInt(0, componentNames.length - 1)];
      break;
    case FragmentType.MODIFIER:
      baseName = modifierNames[rng.randomInt(0, modifierNames.length - 1)];
      break;
    default:
      baseName = 'Mysterious Blueprint';
  }
  
  const prefix = rarityPrefixes[rarity as keyof typeof rarityPrefixes];
  const name = prefix ? `${prefix} ${baseName}` : baseName;
  
  return {
    name,
    type: fragmentType,
    rarity,
    baseStats,
    implicitMods,
    affixes: [],
    isCorrupted: false,
    quantity: 1,
  };
}

export function calculateShatterValue(fragment: Fragment): number {
  const rarityMultipliers = {
    'common': 1,
    'uncommon': 3,
    'rare': 8,
    'epic': 20,
    'legendary': 50,
    'mythic': 125,
    'void_touched': 300,
  };
  
  const baseValue = 5;
  const multiplier = rarityMultipliers[fragment.rarity as keyof typeof rarityMultipliers] || 1;
  
  return Math.floor(baseValue * multiplier * fragment.quantity);
}

export function calculateDeviceUpgradeCost(gameState: GameState, upgradeType: string): number {
  const baseCosts = {
    'spinSpeed': 500,
    'rarityOdds': 1200,
    'fluxCost': 800,
    'mutationSlots': 2500,
  };
  
  const currentLevel = (() => {
    switch (upgradeType) {
      case 'spinSpeed': return gameState.spinSpeedLevel;
      case 'rarityOdds': return gameState.rarityOddsLevel;
      case 'fluxCost': return gameState.fluxCostLevel;
      case 'mutationSlots': return gameState.mutationSlotsLevel;
      default: return 1;
    }
  })();
  
  const baseCost = baseCosts[upgradeType as keyof typeof baseCosts] || 500;
  return Math.floor(baseCost * Math.pow(1.5, currentLevel - 1));
}

export function getDeviceStats(gameState: GameState) {
  return {
    spinSpeed: 1 + (gameState.spinSpeedLevel - 1) * 0.2,
    rarityBonus: (gameState.rarityOddsLevel - 1) * 0.05,
    fluxCost: Math.max(25 - (gameState.fluxCostLevel - 1) * 5, 5),
    mutationSlots: 2 + gameState.mutationSlotsLevel,
  };
}

export function getRarityColor(rarity: string): string {
  const colors = {
    'common': 'text-gray-400 border-gray-500',
    'uncommon': 'text-green-400 border-green-500',
    'rare': 'text-blue-400 border-blue-500',
    'epic': 'text-purple-400 border-purple-500',
    'legendary': 'text-yellow-400 border-yellow-500',
    'mythic': 'text-red-400 border-red-500',
    'void_touched': 'text-purple-300 border-purple-300',
  };
  
  return colors[rarity as keyof typeof colors] || colors.common;
}

export function getFragmentIcon(type: string): string {
  const icons = {
    'base_item': 'fa-hand-rock',
    'component': 'fa-gem',
    'modifier': 'fa-bolt',
    'blueprint': 'fa-scroll',
  };
  
  return icons[type as keyof typeof icons] || 'fa-question';
}
