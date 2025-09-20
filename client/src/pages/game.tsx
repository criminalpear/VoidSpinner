import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { GameState, Fragment } from "@shared/schema";
import VoidspinnerDevice from "@/components/VoidspinnerDevice";
import FragmentInventory from "@/components/FragmentInventory";
import Marketplace from "@/components/Marketplace";
import DeviceUpgrades from "@/components/DeviceUpgrades";
import CraftingSystem from "@/components/CraftingSystem";
import SpinResultModal from "@/components/SpinResultModal";
import { motion } from "framer-motion";

export default function Game() {
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [spinResult, setSpinResult] = useState<Fragment | null>(null);
  const queryClient = useQueryClient();

  // Fetch game state
  const { data: gameState, isLoading: isLoadingGameState } = useQuery<GameState>({
    queryKey: ['/api/gamestate'],
  });

  // Fetch fragments
  const { data: fragments = [], isLoading: isLoadingFragments } = useQuery<Fragment[]>({
    queryKey: ['/api/fragments'],
  });

  // Spin mutation
  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/spin');
      return response.json();
    },
    onSuccess: (data) => {
      setSpinResult(data.fragment);
      queryClient.invalidateQueries({ queryKey: ['/api/gamestate'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fragments'] });
    },
  });

  // Shatter mutation
  const shatterMutation = useMutation({
    mutationFn: async (fragmentId: string) => {
      const response = await apiRequest('POST', `/api/fragments/${fragmentId}/shatter`);
      return response.json();
    },
    onSuccess: () => {
      setSelectedFragment(null);
      queryClient.invalidateQueries({ queryKey: ['/api/gamestate'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fragments'] });
    },
  });

  // Floating particles for background effect
  const particlePositions = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 6,
  }));

  if (isLoadingGameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Voidspinner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative" data-testid="game-page">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-30">
          {particlePositions.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-0.5 h-0.5 bg-primary rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Application Layout */}
      <div className="relative z-10 h-screen grid grid-cols-12 grid-rows-12 gap-4 p-4">
        
        {/* Header */}
        <header className="col-span-12 row-span-1 bg-card/80 backdrop-blur-sm border border-border rounded-lg flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Voidspinner
            </h1>
            <div className="text-sm text-muted-foreground">
              v1.0.0 - Economic Simulator
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Flux Counter */}
            <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
              <i className="fas fa-bolt text-primary"></i>
              <span className="font-mono text-lg font-semibold" data-testid="flux-counter">
                {gameState?.flux?.toLocaleString() || 0}
              </span>
              <span className="text-sm text-muted-foreground">Flux</span>
            </div>
            
            {/* Device Status */}
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Device Online</span>
            </div>
          </div>
        </header>

        {/* Left Panel - Device & Controls */}
        <div className="col-span-4 row-span-11">
          <VoidspinnerDevice
            gameState={gameState}
            onSpin={() => spinMutation.mutate()}
            isSpinning={spinMutation.isPending}
          />
        </div>

        {/* Center Panel - Inventory & Fragment Details */}
        <div className="col-span-5 row-span-11">
          <FragmentInventory
            fragments={fragments}
            selectedFragment={selectedFragment}
            onSelectFragment={setSelectedFragment}
            onShatterFragment={(fragmentId) => shatterMutation.mutate(fragmentId)}
            isShatteringFragment={shatterMutation.isPending}
            isLoading={isLoadingFragments}
          />
        </div>

        {/* Right Panel - Marketplace & Upgrades */}
        <div className="col-span-3 row-span-11 space-y-4">
          <div className="h-64">
            <Marketplace />
          </div>
          <div className="flex-1">
            <DeviceUpgrades gameState={gameState} />
          </div>
        </div>
        
        {/* Bottom Panel - Crafting/Mutation System */}
        <div className="col-span-12 row-span-2">
          <CraftingSystem gameState={gameState} />
        </div>
      </div>

      {/* Spin Result Modal */}
      {spinResult && (
        <SpinResultModal
          fragment={spinResult}
          onClose={() => setSpinResult(null)}
        />
      )}
    </div>
  );
}
