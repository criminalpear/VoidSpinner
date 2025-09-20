// Advanced RNG system for Voidspinner

export class VoidRNG {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
  }

  // Seeded random number generator
  private next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Generate random number between min and max (inclusive)
  public random(min: number = 0, max: number = 1): number {
    return min + this.next() * (max - min);
  }

  // Generate random integer between min and max (inclusive)
  public randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1));
  }

  // Weighted random selection
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

  // Roll for rarity with exponential distribution
  public rollRarity(bonusChance: number = 0): string {
    const roll = this.next();
    const adjustedRoll = Math.min(roll + bonusChance, 0.999999);

    if (adjustedRoll > 0.999995) return 'void_touched';  // 0.0005%
    if (adjustedRoll > 0.9999) return 'mythic';          // 0.005%
    if (adjustedRoll > 0.999) return 'legendary';        // 0.1%
    if (adjustedRoll > 0.99) return 'epic';              // 1%
    if (adjustedRoll > 0.95) return 'rare';              // 5%
    if (adjustedRoll > 0.8) return 'uncommon';           // 15%
    return 'common';                                     // 80%
  }

  // Generate base stats based on rarity
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

  // Generate implicit modifiers
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

export const rng = new VoidRNG();
