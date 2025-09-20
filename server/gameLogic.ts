import { Fragment, GameState, FragmentType, Rarity } from "@shared/schema";

// Simple seeded random number generator
class VoidRNG {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
  }

  private next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  public random(min: number = 0, max: number = 1): number {
    return min + this.next() * (max - min);
  }

  public randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1));
  }

  public weightedChoice<T>(items: Array<{item: T, weight: number}>): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const randomValue = this.random(0, totalWeight);
    
    let currentWeight = 0;
    for (const item of items) {
      currentWeight += item.weight;
      if (randomValue <= currentWeight) {
        return item.item;
      }
    }
    
    return items[items.length - 1].item;
  }

  public rollRarity(bonusChance: number = 0): string {
    const roll = this.next();
    const adjustedRoll = Math.min(roll + bonusChance, 0.999999);

    if (adjustedRoll > 0.999995) return 'void_touched';
    if (adjustedRoll > 0.9999) return 'mythic';
    if (adjustedRoll > 0.999) return 'legendary';
    if (adjustedRoll > 0.99) return 'epic';
    if (adjustedRoll > 0.95) return 'rare';
    if (adjustedRoll > 0.8) return 'uncommon';
    return 'common';
  }

  public generateBaseStats(rarity: string, type: string): Record<string, number> {
    const multipliers = {
      'common': 1,
      'uncommon': 1.5,
      'rare': 2.5,
      'epic': 4,
      'legendary': 7,
      'mythic': 12,
      'void_touched': 20,
    };

    const baseMultiplier = multipliers[rarity as keyof typeof multipliers] || 1;
    
    if (type === 'base_item') {
      return {
        power: this.randomInt(10, 50) * baseMultiplier,
        defense: this.randomInt(5, 25) * baseMultiplier,
        speed: this.randomInt(1, 10) * baseMultiplier,
      };
    } else if (type === 'component') {
      return {
        enhancement: this.randomInt(5, 20) * baseMultiplier,
      };
    } else if (type === 'modifier') {
      return {
        modifier: this.randomInt(1, 15) * baseMultiplier,
      };
    }

    return {};
  }

  public generateImplicitMods(rarity: string): Array<{name: string, value: number}> {
    const rarityModCounts = {
      'common': { min: 1, max: 1 },
      'uncommon': { min: 1, max: 2 },
      'rare': { min: 2, max: 2 },
      'epic': { min: 2, max: 3 },
      'legendary': { min: 3, max: 3 },
      'mythic': { min: 3, max: 4 },
      'void_touched': { min: 4, max: 4 },
    };

    const modCount = this.randomInt(
      rarityModCounts[rarity as keyof typeof rarityModCounts]?.min || 1,
      rarityModCounts[rarity as keyof typeof rarityModCounts]?.max || 1
    );

    const possibleMods = [
      'Increased Damage',
      'Increased Defense',
      'Increased Speed',
      'Flux Regeneration',
      'Spin Speed Bonus',
      'Critical Strike Chance',
      'Elemental Resistance',
      'Void Affinity',
      'Mutation Catalyst',
      'Shattering Efficiency',
    ];

    const mods: Array<{name: string, value: number}> = [];
    const selectedMods = new Set<string>();

    for (let i = 0; i < modCount; i++) {
      let modName: string;
      do {
        modName = possibleMods[this.randomInt(0, possibleMods.length - 1)];
      } while (selectedMods.has(modName));
      
      selectedMods.add(modName);
      
      const value = this.randomInt(5, 25) * (rarity === 'void_touched' ? 3 : rarity === 'mythic' ? 2 : 1);
      mods.push({ name: modName, value });
    }

    return mods;
  }
}

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
    rarityBonus: (gameState.rarityOddsLevel - 1) * 0.0005,
    fluxCostReduction: (gameState.fluxCostLevel - 1) * 5,
    mutationSlots: 2 + gameState.mutationSlotsLevel,
  };
}

// Mutation/Crafting Logic
export interface MutationRequest {
  baseFragmentId: string;
  componentFragmentIds: string[];
}

export interface MutationResult {
  success: boolean;
  resultFragment?: Fragment;
  consumedFragments: string[];
  fluxCost: number;
}

export function calculateMutationSuccessRate(baseFragment: Fragment, components: Fragment[], gameState: GameState): number {
  // Base success rate depends on base item rarity
  const raritySuccessRates = {
    'common': 0.85,
    'uncommon': 0.75,
    'rare': 0.65,
    'epic': 0.50,
    'legendary': 0.35,
    'mythic': 0.20,
    'void_touched': 0.10,
  };

  let baseRate = raritySuccessRates[baseFragment.rarity as keyof typeof raritySuccessRates] || 0.5;
  
  // Reduce success rate based on number of components (complexity penalty)
  const complexityPenalty = (components.length - 1) * 0.1;
  baseRate = Math.max(baseRate - complexityPenalty, 0.05); // Minimum 5% success
  
  // Device level bonus
  const deviceBonus = (gameState.mutationSlotsLevel - 1) * 0.05;
  
  return Math.min(baseRate + deviceBonus, 0.95); // Maximum 95% success
}

export function calculateMutationCost(baseFragment: Fragment, components: Fragment[]): number {
  const baseCost = 100;
  const rarityMultipliers = {
    'common': 1,
    'uncommon': 2,
    'rare': 4,
    'epic': 8,
    'legendary': 16,
    'mythic': 32,
    'void_touched': 64,
  };
  
  let totalCost = baseCost;
  
  // Add cost based on base fragment rarity
  totalCost += baseCost * (rarityMultipliers[baseFragment.rarity as keyof typeof rarityMultipliers] || 1);
  
  // Add cost for each component
  components.forEach(component => {
    totalCost += baseCost * 0.5 * (rarityMultipliers[component.rarity as keyof typeof rarityMultipliers] || 1);
  });
  
  return Math.floor(totalCost);
}

export function performMutation(baseFragment: Fragment, components: Fragment[], gameState: GameState): Fragment {
  const mutationRng = new VoidRNG();
  
  // Start with base fragment as template
  const mutatedFragment: Fragment = {
    ...baseFragment,
    id: '', // Will be set by storage
    name: `Mutated ${baseFragment.name}`,
    affixes: [...baseFragment.affixes] as any,
    baseStats: { ...baseFragment.baseStats as any },
    implicitMods: [...baseFragment.implicitMods] as any,
  };
  
  // Apply component effects
  components.forEach(component => {
    if (component.type === 'component') {
      // Components enhance base stats
      Object.keys(component.baseStats as any).forEach(stat => {
        if (stat in mutatedFragment.baseStats) {
          (mutatedFragment.baseStats as any)[stat] += Math.floor((component.baseStats as any)[stat] * 0.5);
        }
      });
      
      // Add component implicit mods as affixes
      (component.implicitMods as any).forEach((mod: any) => {
        (mutatedFragment.affixes as any).push({
          name: `${component.name} - ${mod.name}`,
          value: Math.floor(mod.value * 0.7),
          source: 'mutation'
        });
      });
    } else if (component.type === 'modifier') {
      // Modifiers add new affixes
      (component.implicitMods as any).forEach((mod: any) => {
        (mutatedFragment.affixes as any).push({
          name: `${component.name} - ${mod.name}`,
          value: mod.value,
          source: 'mutation'
        });
      });
    }
  });
  
  // Chance for rarity upgrade (small chance)
  if (mutationRng.random() < 0.1) {
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'void_touched'];
    const currentIndex = rarityOrder.indexOf(mutatedFragment.rarity);
    if (currentIndex >= 0 && currentIndex < rarityOrder.length - 1) {
      mutatedFragment.rarity = rarityOrder[currentIndex + 1];
      mutatedFragment.name = `Evolved ${mutatedFragment.name}`;
    }
  }
  
  return mutatedFragment;
}