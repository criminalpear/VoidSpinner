import { GameState, Fragment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CraftingSystemProps {
  gameState?: GameState;
}

interface MutationSlot {
  type: 'base' | 'component';
  fragment?: Fragment;
}

interface MutationRequest {
  baseFragmentId: string;
  componentFragmentIds: string[];
}

interface MutationResponse {
  success: boolean;
  resultFragment?: Fragment;
  consumedFragments: string[];
  fluxCost: number;
  successRate: number;
}

export default function CraftingSystem({ gameState }: CraftingSystemProps) {
  const { toast } = useToast();
  const [mutationSlots, setMutationSlots] = useState<MutationSlot[]>([
    { type: 'base' },
    { type: 'component' },
    { type: 'component' },
    { type: 'component' },
    { type: 'component' }
  ]);
  const [isSelecting, setIsSelecting] = useState<{ slotIndex: number; type: 'base' | 'component' } | null>(null);

  if (!gameState) return null;

  const maxSlots = 2 + gameState.mutationSlotsLevel;
  
  // Get fragments for selection
  const { data: fragments = [], isLoading: isLoadingFragments } = useQuery<Fragment[]>({
    queryKey: ['/api/fragments'],
  });

  // Calculate mutation stats
  const baseFragment = mutationSlots[0].fragment;
  const componentFragments = mutationSlots.slice(1, maxSlots + 1)
    .map(slot => slot.fragment)
    .filter(Boolean) as Fragment[];

  const canMutate = baseFragment && baseFragment.type === 'base_item' && componentFragments.length > 0;
  
  // Mock calculation for display (would use actual API call for precision)
  const estimatedCost = canMutate ? 
    100 + (baseFragment.rarity === 'rare' ? 400 : baseFragment.rarity === 'uncommon' ? 200 : 100) +
    componentFragments.length * 50 : 0;
  
  const estimatedSuccessRate = canMutate ?
    Math.max(85 - (baseFragment.rarity === 'rare' ? 20 : baseFragment.rarity === 'uncommon' ? 10 : 0) -
    (componentFragments.length - 1) * 10, 5) : 0;

  // Mutation mutation
  const mutateMutation = useMutation({
    mutationFn: async (request: MutationRequest) => {
      const response = await apiRequest('POST', '/api/mutate', request);
      const json = await response.json();
      return json as MutationResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Mutation Successful!",
          description: `Created ${data.resultFragment?.name}`,
        });
      } else {
        toast({
          title: "Mutation Failed",
          description: `Mutation attempt failed (${data.successRate}% success rate)`,
          variant: "destructive",
        });
      }
      // Clear slots and refresh data
      setMutationSlots([
        { type: 'base' },
        { type: 'component' },
        { type: 'component' },
        { type: 'component' },
        { type: 'component' }
      ]);
      queryClient.invalidateQueries({ queryKey: ['/api/fragments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gamestate'] });
    },
    onError: (error: any) => {
      toast({
        title: "Mutation Error",
        description: error.message || "Failed to perform mutation",
        variant: "destructive",
      });
    },
  });

  const handleSlotClick = (slotIndex: number, type: 'base' | 'component') => {
    setIsSelecting({ slotIndex, type });
  };

  const handleFragmentSelect = (fragment: Fragment) => {
    if (!isSelecting) return;
    
    const newSlots = [...mutationSlots];
    newSlots[isSelecting.slotIndex] = { ...newSlots[isSelecting.slotIndex], fragment };
    setMutationSlots(newSlots);
    setIsSelecting(null);
  };

  const handleClearSlot = (slotIndex: number) => {
    const newSlots = [...mutationSlots];
    newSlots[slotIndex] = { ...newSlots[slotIndex], fragment: undefined };
    setMutationSlots(newSlots);
  };

  const handleMutate = () => {
    if (!canMutate || !baseFragment) return;
    
    mutateMutation.mutate({
      baseFragmentId: baseFragment.id,
      componentFragmentIds: componentFragments.map(f => f.id),
    });
  };

  const getFragmentColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      case 'uncommon': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getAvailableFragments = (type: 'base' | 'component') => {
    if (type === 'base') {
      return fragments.filter(f => f.type === 'base_item' && !mutationSlots.some(slot => slot.fragment?.id === f.id));
    } else {
      return fragments.filter(f => 
        (f.type === 'component' || f.type === 'modifier') && 
        !mutationSlots.some(slot => slot.fragment?.id === f.id)
      );
    }
  };

  return (
  <Card className="bg-card/80 backdrop-blur-sm border-border min-h-[160px] overflow-auto" data-testid="crafting-system">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif">Mutation Chamber</CardTitle>
          <div className="text-sm text-muted-foreground">
            Combine items to create powerful mutations
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-12 gap-4 h-16">
          {/* Base Item Slot */}
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Base Item</div>
            <Dialog>
              <DialogTrigger asChild>
                <div 
                  className="w-full h-12 bg-secondary/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer relative"
                  data-testid="base-item-slot"
                  onClick={() => handleSlotClick(0, 'base')}
                >
                  {mutationSlots[0].fragment ? (
                    <>
                      <div className="text-center">
                        <div className={`text-xs font-medium ${getFragmentColor(mutationSlots[0].fragment.rarity)}`}>
                          {mutationSlots[0].fragment.name.slice(0, 8)}...
                        </div>
                      </div>
                      <button
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs"
                        onClick={(e) => { e.stopPropagation(); handleClearSlot(0); }}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <i className="fas fa-plus text-muted-foreground"></i>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Select Base Item</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                  {getAvailableFragments('base').map((fragment) => (
                    <div
                      key={fragment.id}
                      className="p-2 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => handleFragmentSelect(fragment)}
                      data-testid={`fragment-select-${fragment.id}`}
                    >
                      <div className={`text-sm font-medium ${getFragmentColor(fragment.rarity)}`}>
                        {fragment.name}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {fragment.rarity} {fragment.type.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Component Slots */}
          <div className="col-span-6">
            <div className="text-xs text-muted-foreground mb-1">Components & Modifiers</div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, index) => {
                const slotIndex = index + 1;
                const isUnlocked = index < maxSlots;
                const fragment = mutationSlots[slotIndex]?.fragment;
                
                return (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <div
                        className={`w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors cursor-pointer relative ${
                          isUnlocked 
                            ? 'bg-secondary/50 border-border hover:border-primary/50' 
                            : 'bg-secondary/30 border-muted opacity-50'
                        }`}
                        data-testid={`component-slot-${index + 1}`}
                        onClick={() => isUnlocked && handleSlotClick(slotIndex, 'component')}
                      >
                        {fragment && isUnlocked ? (
                          <>
                            <div className="text-center">
                              <div className={`text-xs font-medium ${getFragmentColor(fragment.rarity)}`}>
                                {fragment.name.slice(0, 6)}
                              </div>
                            </div>
                            <button
                              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-xs"
                              onClick={(e) => { e.stopPropagation(); handleClearSlot(slotIndex); }}
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <i className={`fas ${isUnlocked ? 'fa-plus' : 'fa-lock'} text-muted-foreground text-xs`}></i>
                        )}
                      </div>
                    </DialogTrigger>
                    {isUnlocked && (
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Select Component/Modifier</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                          {getAvailableFragments('component').map((fragment) => (
                            <div
                              key={fragment.id}
                              className="p-2 border rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                              onClick={() => handleFragmentSelect(fragment)}
                              data-testid={`fragment-select-${fragment.id}`}
                            >
                              <div className={`text-sm font-medium ${getFragmentColor(fragment.rarity)}`}>
                                {fragment.name}
                              </div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {fragment.rarity} {fragment.type.replace('_', ' ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                );
              })}
            </div>
          </div>
          
          {/* Mutation Button */}
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Action</div>
            <Button
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold"
              disabled={!canMutate || mutateMutation.isPending || gameState.flux < estimatedCost}
              onClick={handleMutate}
              data-testid="mutate-button"
            >
              <i className="fas fa-flask mr-1"></i>
              {mutateMutation.isPending ? 'Mutating...' : 'Mutate'}
            </Button>
          </div>
          
          {/* Success Rate Display */}
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
            <div className="h-12 bg-secondary/30 rounded-lg flex flex-col justify-center px-3">
              <div className="text-sm font-mono text-center">
                {canMutate ? `${estimatedSuccessRate}%` : '--'}
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Cost: {canMutate ? `${estimatedCost}` : '--'} Flux
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}