import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameStateSchema, insertFragmentSchema, FragmentType, Rarity, GameState, Fragment } from "@shared/schema";
import { generateFragment, calculateShatterValue, calculateDeviceUpgradeCost, calculateMutationSuccessRate, calculateMutationCost, performMutation, type MutationRequest } from "./gameLogic";
import "./types"; // Import session types

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get or create game state for anonymous user
  app.get("/api/gamestate", async (req, res) => {
    try {
      // For simplicity, using session-based anonymous user
      let userId = req.session?.userId;
      
      if (!userId) {
        // Create anonymous user
        const user = await storage.createUser({
          username: `anon_${Date.now()}`,
          password: 'anonymous'
        });
        userId = user.id;
        req.session!.userId = userId;
      }

      let gameState = await storage.getGameState(userId);
      
      if (!gameState) {
        gameState = await storage.createGameState({
          userId,
          flux: 1000,
          totalSpins: 0,
          deviceLevel: 1,
          spinSpeedLevel: 1,
          rarityOddsLevel: 1,
          fluxCostLevel: 1,
          mutationSlotsLevel: 1,
        });
      }

      res.json(gameState);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game state" });
    }
  });

  // Perform a spin
  app.post("/api/spin", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const gameState = await storage.getGameState(userId);
      if (!gameState) {
        return res.status(404).json({ message: "Game state not found" });
      }

      const spinCost = Math.max(25 - (gameState.fluxCostLevel - 1) * 5, 5);
      
      if (gameState.flux < spinCost) {
        return res.status(400).json({ message: "Insufficient flux" });
      }

      // Generate fragment using RNG
      const fragment = generateFragment(gameState);
      
      // Create fragment in storage
      const createdFragment = await storage.createFragment({
        gameStateId: gameState.id,
        name: fragment.name,
        type: fragment.type,
        rarity: fragment.rarity,
        baseStats: fragment.baseStats as any,
        implicitMods: fragment.implicitMods as any,
        affixes: [],
        isCorrupted: false,
        quantity: 1,
      });

      // Update game state
      await storage.updateGameState(userId, {
        flux: gameState.flux - spinCost,
        totalSpins: gameState.totalSpins + 1,
      });

      res.json({ fragment: createdFragment, fluxSpent: spinCost });
    } catch (error) {
      res.status(500).json({ message: "Failed to perform spin" });
    }
  });

  // Get fragments
  app.get("/api/fragments", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const gameState = await storage.getGameState(userId);
      if (!gameState) {
        return res.status(404).json({ message: "Game state not found" });
      }

      const fragments = await storage.getFragments(gameState.id);
      res.json(fragments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get fragments" });
    }
  });

  // Shatter fragment
  app.post("/api/fragments/:id/shatter", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const gameState = await storage.getGameState(userId);
      if (!gameState) {
        return res.status(404).json({ message: "Game state not found" });
      }

      const fragments = await storage.getFragments(gameState.id);
      const fragment = fragments.find(f => f.id === req.params.id);
      
      if (!fragment) {
        return res.status(404).json({ message: "Fragment not found" });
      }

      const fluxGained = calculateShatterValue(fragment);
      
      // Update flux and remove fragment
      await storage.updateGameState(userId, {
        flux: gameState.flux + fluxGained,
      });
      
      await storage.deleteFragment(fragment.id);

      res.json({ fluxGained });
    } catch (error) {
      res.status(500).json({ message: "Failed to shatter fragment" });
    }
  });

  // Sell fragment
  app.post("/api/sell", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { fragmentId } = req.body as { fragmentId?: string };
      if (!fragmentId) return res.status(400).json({ message: "Missing fragmentId" });

      const gameState = await storage.getGameState(userId);
      if (!gameState) return res.status(404).json({ message: "Game state not found" });

      const fragments = await storage.getFragments(gameState.id);
      const fragment = fragments.find(f => f.id === fragmentId);
      if (!fragment) return res.status(404).json({ message: "Fragment not found" });

      // Determine price from marketplace listing
      const listings = await storage.getMarketplaceListings();
      const listingId = `${fragment.type}-${fragment.rarity}`;
      const listing = listings.find(l => l.id === listingId);

      // Fallback price if listing missing
      const basePrice = listing ? listing.currentPrice : 10;
      const quantity = fragment.quantity ?? 1;
      const price = Math.max(1, Math.round(basePrice * quantity));

      // Update flux and remove fragment
      await storage.updateGameState(userId, { flux: gameState.flux + price });
      await storage.deleteFragment(fragment.id);

      // Adjust marketplace supply and price slightly
      try {
        if (listing) {
          const newSupply = Math.max(0, listing.supply - 1);
          const newDemand = Math.min(3, listing.demand + 0.01);
          const newPrice = Math.max(1, Math.round(listing.currentPrice * (1 + (0.01 * (1 - newDemand)))));
          await storage.updateMarketplaceListing(listing.fragmentType, listing.rarity, {
            supply: newSupply,
            demand: newDemand,
            currentPrice: newPrice,
          });
        }
      } catch (e) {
        // Non-fatal
        console.warn('Failed to update marketplace listing after sell', e);
      }

      res.json({ fluxGained: price });
    } catch (error) {
      console.error('Sell error:', error);
      res.status(500).json({ message: 'Failed to sell fragment' });
    }
  });

  // Get marketplace listings
  app.get("/api/marketplace", async (req, res) => {
    try {
      const listings = await storage.getMarketplaceListings();
      res.json(listings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get marketplace listings" });
    }
  });

  // Upgrade device
  app.post("/api/upgrade/:type", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const upgradeType = req.params.type;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const gameState = await storage.getGameState(userId);
      if (!gameState) {
        return res.status(404).json({ message: "Game state not found" });
      }

      const cost = calculateDeviceUpgradeCost(gameState, upgradeType);
      
      if (gameState.flux < cost) {
        return res.status(400).json({ message: "Insufficient flux" });
      }

      const updates: Partial<GameState> = { flux: gameState.flux - cost };
      
      switch (upgradeType) {
        case 'spinSpeed':
          updates.spinSpeedLevel = gameState.spinSpeedLevel + 1;
          break;
        case 'rarityOdds':
          updates.rarityOddsLevel = gameState.rarityOddsLevel + 1;
          break;
        case 'fluxCost':
          updates.fluxCostLevel = gameState.fluxCostLevel + 1;
          break;
        case 'mutationSlots':
          updates.mutationSlotsLevel = gameState.mutationSlotsLevel + 1;
          break;
        default:
          return res.status(400).json({ message: "Invalid upgrade type" });
      }

      const updatedGameState = await storage.updateGameState(userId, updates);
      res.json(updatedGameState);
    } catch (error) {
      res.status(500).json({ message: "Failed to upgrade device" });
    }
  });

  // Mutation/Crafting endpoint
  app.post("/api/mutate", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const gameState = await storage.getGameState(userId);
      if (!gameState) {
        return res.status(404).json({ message: "Game state not found" });
      }

      const { baseFragmentId, componentFragmentIds }: MutationRequest = req.body;
      
      if (!baseFragmentId || !componentFragmentIds || componentFragmentIds.length === 0) {
        return res.status(400).json({ message: "Invalid mutation request" });
      }

      // Get all fragments
      const fragments = await storage.getFragments(gameState.id);
      const baseFragment = fragments.find(f => f.id === baseFragmentId);
      
      if (!baseFragment) {
        return res.status(404).json({ message: "Base fragment not found" });
      }

      if (baseFragment.type !== 'base_item') {
        return res.status(400).json({ message: "Base fragment must be a base item" });
      }

      const componentFragments = componentFragmentIds.map(id => 
        fragments.find(f => f.id === id)
      ).filter(Boolean) as Fragment[];

      if (componentFragments.length !== componentFragmentIds.length) {
        return res.status(404).json({ message: "One or more component fragments not found" });
      }

      // Validate component types
      const invalidComponents = componentFragments.filter(f => 
        f.type !== 'component' && f.type !== 'modifier'
      );
      if (invalidComponents.length > 0) {
        return res.status(400).json({ message: "Components must be of type 'component' or 'modifier'" });
      }

      // Check mutation slots limit
      const maxSlots = 2 + gameState.mutationSlotsLevel;
      if (componentFragments.length > maxSlots) {
        return res.status(400).json({ message: `Too many components. Maximum is ${maxSlots}` });
      }

      // Calculate costs and success rate
      const fluxCost = calculateMutationCost(baseFragment, componentFragments);
      const successRate = calculateMutationSuccessRate(baseFragment, componentFragments, gameState);

      if (gameState.flux < fluxCost) {
        return res.status(400).json({ message: "Insufficient flux" });
      }

      // Perform mutation attempt
      const mutationRng = Math.random();
      const success = mutationRng < successRate;

      // Deduct flux cost regardless of success
      await storage.updateGameState(userId, {
        flux: gameState.flux - fluxCost,
      });

      // Remove consumed fragments regardless of success
      const consumedFragmentIds = [baseFragmentId, ...componentFragmentIds];
      for (const fragmentId of consumedFragmentIds) {
        await storage.deleteFragment(fragmentId);
      }

      if (success) {
        // Create mutated fragment
        const mutatedFragment = performMutation(baseFragment, componentFragments, gameState);
        const createdFragment = await storage.createFragment({
          gameStateId: gameState.id,
          name: mutatedFragment.name,
          type: mutatedFragment.type,
          rarity: mutatedFragment.rarity,
          baseStats: mutatedFragment.baseStats as any,
          implicitMods: mutatedFragment.implicitMods as any,
          affixes: mutatedFragment.affixes as any,
          isCorrupted: mutatedFragment.isCorrupted,
          quantity: mutatedFragment.quantity,
        });

        res.json({
          success: true,
          resultFragment: createdFragment,
          consumedFragments: consumedFragmentIds,
          fluxCost,
          successRate: Math.round(successRate * 100),
        });
      } else {
        res.json({
          success: false,
          consumedFragments: consumedFragmentIds,
          fluxCost,
          successRate: Math.round(successRate * 100),
        });
      }
    } catch (error) {
      console.error('Mutation error:', error);
      res.status(500).json({ message: "Failed to perform mutation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
