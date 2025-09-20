import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const gameStates = pgTable("game_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  flux: integer("flux").notNull().default(1000),
  totalSpins: integer("total_spins").notNull().default(0),
  deviceLevel: integer("device_level").notNull().default(1),
  spinSpeedLevel: integer("spin_speed_level").notNull().default(1),
  rarityOddsLevel: integer("rarity_odds_level").notNull().default(1),
  fluxCostLevel: integer("flux_cost_level").notNull().default(1),
  mutationSlotsLevel: integer("mutation_slots_level").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fragments = pgTable("fragments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameStateId: varchar("game_state_id").references(() => gameStates.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'base_item', 'component', 'modifier', 'blueprint'
  rarity: text("rarity").notNull(), // 'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'void_touched'
  baseStats: jsonb("base_stats").notNull(), // { power: number, defense: number, etc. }
  implicitMods: jsonb("implicit_mods").notNull(), // array of modifier objects
  affixes: jsonb("affixes").notNull().default([]), // crafted affixes
  isCorrupted: boolean("is_corrupted").notNull().default(false),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceListings = pgTable("marketplace_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fragmentType: text("fragment_type").notNull(),
  rarity: text("rarity").notNull(),
  basePrice: integer("base_price").notNull(),
  currentPrice: integer("current_price").notNull(),
  demand: real("demand").notNull().default(1.0), // demand multiplier
  supply: integer("supply").notNull().default(100),
  priceHistory: jsonb("price_history").notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameStateSchema = createInsertSchema(gameStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFragmentSchema = createInsertSchema(fragments).omit({
  id: true,
  createdAt: true,
});

export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type GameState = typeof gameStates.$inferSelect;
export type InsertGameState = z.infer<typeof insertGameStateSchema>;

export type Fragment = typeof fragments.$inferSelect;
export type InsertFragment = z.infer<typeof insertFragmentSchema>;

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;

// Enums for type safety
export const FragmentType = {
  BASE_ITEM: 'base_item',
  COMPONENT: 'component',
  MODIFIER: 'modifier',
  BLUEPRINT: 'blueprint',
} as const;

export const Rarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic',
  VOID_TOUCHED: 'void_touched',
} as const;

export type FragmentTypeValue = typeof FragmentType[keyof typeof FragmentType];
export type RarityValue = typeof Rarity[keyof typeof Rarity];

// Database relations
export const usersRelations = relations(users, ({ one }) => ({
  gameState: one(gameStates, {
    fields: [users.id],
    references: [gameStates.userId],
  }),
}));

export const gameStatesRelations = relations(gameStates, ({ one, many }) => ({
  user: one(users, {
    fields: [gameStates.userId],
    references: [users.id],
  }),
  fragments: many(fragments),
}));

export const fragmentsRelations = relations(fragments, ({ one }) => ({
  gameState: one(gameStates, {
    fields: [fragments.gameStateId],
    references: [gameStates.id],
  }),
}));
