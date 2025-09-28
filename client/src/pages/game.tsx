import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";

export default function Game() {
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [spinResult, setSpinResult] = useState<Fragment | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [displayedFlux, setDisplayedFlux] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const shootConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight * 0.6);
    const particles: any[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H - H,
        r: Math.random() * 6 + 4,
        dx: (Math.random() - 0.5) * 6,
        dy: Math.random() * 6 + 2,
        color: `hsl(${Math.random() * 360} 90% 60%)`,
      });
    }

    let running = true;
    const run = () => {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.3;
      }
      requestAnimationFrame(run);
    };

    run();
    setTimeout(() => { running = false; ctx.clearRect(0,0,W,H); }, 2200);
  };

  // Fetch game state
  const { data: gameState, isLoading: isLoadingGameState, isError: isErrorGameState, error: gameStateError } = useQuery<GameState>({
    queryKey: ['/api/gamestate'],
  });

  // Fetch fragments
  const { data: fragments = [], isLoading: isLoadingFragments, isError: isErrorFragments, error: fragmentsError } = useQuery<Fragment[]>({
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
      const rarity = data.fragment?.rarity;
      if (rarity === 'legendary' || rarity === 'mythic' || rarity === 'void_touched') {
        toast({ title: `Amazing! You rolled a ${rarity.toUpperCase()} fragment!`, description: data.fragment.name });
        shootConfetti();
      } else if (rarity === 'epic' || rarity === 'rare') {
        toast({ title: `Nice drop: ${data.fragment.name}`, description: `${rarity} fragment` });
      }
    },
    onError: (err: any) => {
      console.error('Spin mutation failed', err);
      toast({ title: 'Spin failed', description: err.message || 'Try again', variant: 'destructive' });
    },
  });

  // Shatter mutation
  const shatterMutation = useMutation({
    mutationFn: async (fragmentId: string) => {
      const response = await apiRequest('POST', `/api/fragments/${fragmentId}/shatter`);
      return response.json();
    },
    onSuccess: (data: any) => {
      setSelectedFragment(null);
      queryClient.invalidateQueries({ queryKey: ['/api/gamestate'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fragments'] });
      toast({ title: 'Shattered', description: `Gained ${data.fluxGained} Flux` });
    },
    onError: (err: any) => {
      console.error('Shatter mutation failed', err);
      toast({ title: 'Shatter failed', description: err.message || 'Try again', variant: 'destructive' });
    },
  });

  // Floating particles for background effect
  const particlePositions = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 6,
  }));

  // Log fetched data for debugging
  useEffect(() => {
    console.groupCollapsed('Game page data');
    console.log('gameState', gameState);
    console.log('fragments', fragments);
    if (isErrorGameState) console.error('gameStateError', gameStateError);
    if (isErrorFragments) console.error('fragmentsError', fragmentsError);
    console.groupEnd();
  }, [gameState, fragments, isErrorGameState, isErrorFragments, gameStateError, fragmentsError]);

  // Animate displayedFlux when gameState.flux changes
  useEffect(() => {
    const target = gameState?.flux ?? 0;
    const duration = 500; // ms
    const start = displayedFlux ?? target;
    const diff = target - start;
    const startTime = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut-ish
      const value = Math.round(start + diff * eased);
      setDisplayedFlux(value);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [gameState?.flux]);

  // If either query errored, show a visible error banner so the user knows
  const hasDataError = isErrorGameState || isErrorFragments;

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
      {hasDataError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-600 text-white px-4 py-2 rounded shadow">Error loading game data — check console or network tab</div>
        </div>
      )}
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
        {/* Confetti canvas (for big drops) */}
        <canvas ref={confettiCanvasRef} className="pointer-events-none fixed inset-x-0 top-16 h-1/2" />
      </div>

      {/* Main Application Layout */}
  <div className="relative z-10 h-screen grid grid-cols-12 grid-rows-[auto_1fr_auto] gap-4 p-4">
        
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
                {displayedFlux?.toLocaleString() ?? (gameState?.flux?.toLocaleString() ?? '—')}
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
  <div className="col-span-4 row-span-1">
          <VoidspinnerDevice
            gameState={gameState}
            onSpin={() => spinMutation.mutate()}
            isSpinning={spinMutation.isPending}
          />
        </div>

  {/* Center Panel - Inventory & Fragment Details */}
  <div className="col-span-5 row-span-1 overflow-auto">
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
  <div className="col-span-3 row-span-1 space-y-4">
          <div className="h-64">
            <Marketplace />
          </div>
          <div className="flex-1">
            <DeviceUpgrades gameState={gameState} />
          </div>
        </div>
        
  {/* Bottom Panel - Crafting/Mutation System */}
  <div className="col-span-12 row-span-1">
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
