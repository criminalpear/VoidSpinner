import { type User, type InsertUser, type GameState, type InsertGameState, type Fragment, type InsertFragment, type MarketplaceListing, type InsertMarketplaceListing, users, gameStates, fragments, marketplaceListings } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game state operations
  getGameState(userId: string): Promise<GameState | undefined>;
  createGameState(gameState: InsertGameState): Promise<GameState>;
  updateGameState(userId: string, updates: Partial<GameState>): Promise<GameState>;
  
  // Fragment operations
  getFragments(gameStateId: string): Promise<Fragment[]>;
  createFragment(fragment: InsertFragment): Promise<Fragment>;
  updateFragment(fragmentId: string, updates: Partial<Fragment>): Promise<Fragment>;
  deleteFragment(fragmentId: string): Promise<void>;
  
  // Marketplace operations
  getMarketplaceListings(): Promise<MarketplaceListing[]>;
  updateMarketplaceListing(fragmentType: string, rarity: string, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private gameStates: Map<string, GameState>;
  private fragments: Map<string, Fragment>;
  private marketplaceListings: Map<string, MarketplaceListing>;

  constructor() {
    this.users = new Map();
    this.gameStates = new Map();
    this.fragments = new Map();
    this.marketplaceListings = new Map();
    
    // Initialize marketplace with base listings
    this.initializeMarketplace();
  }

  private initializeMarketplace() {
    const baseListings = [
      { fragmentType: 'component', rarity: 'common', basePrice: 10, demand: 1.0 },
      { fragmentType: 'component', rarity: 'uncommon', basePrice: 50, demand: 1.1 },
      { fragmentType: 'component', rarity: 'rare', basePrice: 200, demand: 1.2 },
      { fragmentType: 'component', rarity: 'epic', basePrice: 800, demand: 1.5 },
      { fragmentType: 'component', rarity: 'legendary', basePrice: 3000, demand: 2.0 },
      { fragmentType: 'modifier', rarity: 'common', basePrice: 15, demand: 0.9 },
      { fragmentType: 'modifier', rarity: 'uncommon', basePrice: 75, demand: 1.0 },
      { fragmentType: 'modifier', rarity: 'rare', basePrice: 300, demand: 1.3 },
      { fragmentType: 'modifier', rarity: 'epic', basePrice: 1200, demand: 1.8 },
      { fragmentType: 'base_item', rarity: 'rare', basePrice: 500, demand: 1.1 },
      { fragmentType: 'base_item', rarity: 'epic', basePrice: 2000, demand: 1.4 },
    ];

    baseListings.forEach(listing => {
      const id = `${listing.fragmentType}-${listing.rarity}`;
      this.marketplaceListings.set(id, {
        id,
        fragmentType: listing.fragmentType,
        rarity: listing.rarity,
        basePrice: listing.basePrice,
        currentPrice: listing.basePrice,
        demand: listing.demand,
        supply: 100,
        priceHistory: [],
        updatedAt: new Date(),
      });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGameState(userId: string): Promise<GameState | undefined> {
    return Array.from(this.gameStates.values()).find(
      (gameState) => gameState.userId === userId
    );
  }

  async createGameState(insertGameState: InsertGameState): Promise<GameState> {
    const id = randomUUID();
    const now = new Date();
    const gameState: GameState = { 
      id,
      userId: insertGameState.userId,
      flux: insertGameState.flux ?? 1000,
      totalSpins: insertGameState.totalSpins ?? 0,
      deviceLevel: insertGameState.deviceLevel ?? 1,
      spinSpeedLevel: insertGameState.spinSpeedLevel ?? 1,
      rarityOddsLevel: insertGameState.rarityOddsLevel ?? 1,
      fluxCostLevel: insertGameState.fluxCostLevel ?? 1,
      mutationSlotsLevel: insertGameState.mutationSlotsLevel ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    this.gameStates.set(id, gameState);
    return gameState;
  }

  async updateGameState(userId: string, updates: Partial<GameState>): Promise<GameState> {
    const gameState = await this.getGameState(userId);
    if (!gameState) {
      throw new Error('Game state not found');
    }
    
    const updatedGameState: GameState = {
      ...gameState,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.gameStates.set(gameState.id, updatedGameState);
    return updatedGameState;
  }

  async getFragments(gameStateId: string): Promise<Fragment[]> {
    return Array.from(this.fragments.values()).filter(
      (fragment) => fragment.gameStateId === gameStateId
    );
  }

  async createFragment(insertFragment: InsertFragment): Promise<Fragment> {
    const id = randomUUID();
    const fragment: Fragment = { 
      id,
      gameStateId: insertFragment.gameStateId,
      name: insertFragment.name,
      type: insertFragment.type,
      rarity: insertFragment.rarity,
      baseStats: insertFragment.baseStats,
      implicitMods: insertFragment.implicitMods,
      affixes: insertFragment.affixes ?? [],
      isCorrupted: insertFragment.isCorrupted ?? false,
      quantity: insertFragment.quantity ?? 1,
      createdAt: new Date(),
    };
    this.fragments.set(id, fragment);
    return fragment;
  }

  async updateFragment(fragmentId: string, updates: Partial<Fragment>): Promise<Fragment> {
    const fragment = this.fragments.get(fragmentId);
    if (!fragment) {
      throw new Error('Fragment not found');
    }
    
    const updatedFragment: Fragment = {
      ...fragment,
      ...updates,
    };
    
    this.fragments.set(fragmentId, updatedFragment);
    return updatedFragment;
  }

  async deleteFragment(fragmentId: string): Promise<void> {
    this.fragments.delete(fragmentId);
  }

  async getMarketplaceListings(): Promise<MarketplaceListing[]> {
    return Array.from(this.marketplaceListings.values());
  }

  async updateMarketplaceListing(fragmentType: string, rarity: string, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
    const id = `${fragmentType}-${rarity}`;
    const listing = this.marketplaceListings.get(id);
    if (!listing) {
      throw new Error('Marketplace listing not found');
    }
    
    const updatedListing: MarketplaceListing = {
      ...listing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.marketplaceListings.set(id, updatedListing);
    return updatedListing;
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize marketplace listings if they don't exist
    this.initializeMarketplace();
  }

  private async initializeMarketplace() {
    try {
      const existingListings = await db.select().from(marketplaceListings);
      if (existingListings.length === 0) {
        const baseListings = [
          { fragmentType: 'component', rarity: 'common', basePrice: 10, demand: 1.0 },
          { fragmentType: 'component', rarity: 'uncommon', basePrice: 50, demand: 1.1 },
          { fragmentType: 'component', rarity: 'rare', basePrice: 200, demand: 1.2 },
          { fragmentType: 'component', rarity: 'epic', basePrice: 800, demand: 1.5 },
          { fragmentType: 'component', rarity: 'legendary', basePrice: 3000, demand: 2.0 },
          { fragmentType: 'modifier', rarity: 'common', basePrice: 15, demand: 0.9 },
          { fragmentType: 'modifier', rarity: 'uncommon', basePrice: 75, demand: 1.0 },
          { fragmentType: 'modifier', rarity: 'rare', basePrice: 300, demand: 1.3 },
          { fragmentType: 'modifier', rarity: 'epic', basePrice: 1200, demand: 1.8 },
          { fragmentType: 'base_item', rarity: 'rare', basePrice: 500, demand: 1.1 },
          { fragmentType: 'base_item', rarity: 'epic', basePrice: 2000, demand: 1.4 },
        ];

        for (const listing of baseListings) {
          const id = `${listing.fragmentType}-${listing.rarity}`;
          await db.insert(marketplaceListings).values({
            id,
            fragmentType: listing.fragmentType,
            rarity: listing.rarity,
            basePrice: listing.basePrice,
            currentPrice: listing.basePrice,
            demand: listing.demand,
            supply: 100,
            priceHistory: [],
          });
        }
      }
    } catch (error) {
      console.warn('Failed to initialize marketplace listings:', error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getGameState(userId: string): Promise<GameState | undefined> {
    const [gameState] = await db.select().from(gameStates).where(eq(gameStates.userId, userId));
    return gameState || undefined;
  }

  async createGameState(insertGameState: InsertGameState): Promise<GameState> {
    const [gameState] = await db.insert(gameStates).values(insertGameState).returning();
    return gameState;
  }

  async updateGameState(userId: string, updates: Partial<GameState>): Promise<GameState> {
    const [gameState] = await db
      .update(gameStates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gameStates.userId, userId))
      .returning();
    
    if (!gameState) {
      throw new Error('Game state not found');
    }
    
    return gameState;
  }

  async getFragments(gameStateId: string): Promise<Fragment[]> {
    return await db.select().from(fragments).where(eq(fragments.gameStateId, gameStateId));
  }

  async createFragment(insertFragment: InsertFragment): Promise<Fragment> {
    const [fragment] = await db.insert(fragments).values(insertFragment).returning();
    return fragment;
  }

  async updateFragment(fragmentId: string, updates: Partial<Fragment>): Promise<Fragment> {
    const [fragment] = await db
      .update(fragments)
      .set(updates)
      .where(eq(fragments.id, fragmentId))
      .returning();
    
    if (!fragment) {
      throw new Error('Fragment not found');
    }
    
    return fragment;
  }

  async deleteFragment(fragmentId: string): Promise<void> {
    await db.delete(fragments).where(eq(fragments.id, fragmentId));
  }

  async getMarketplaceListings(): Promise<MarketplaceListing[]> {
    return await db.select().from(marketplaceListings);
  }

  async updateMarketplaceListing(fragmentType: string, rarity: string, updates: Partial<MarketplaceListing>): Promise<MarketplaceListing> {
    const id = `${fragmentType}-${rarity}`;
    const [listing] = await db
      .update(marketplaceListings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceListings.id, id))
      .returning();
    
    if (!listing) {
      throw new Error('Marketplace listing not found');
    }
    
    return listing;
  }
}

export const storage = new DatabaseStorage();
