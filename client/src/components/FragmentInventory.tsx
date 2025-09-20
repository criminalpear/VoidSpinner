import { useState } from "react";
import { Fragment } from "@shared/schema";
import { getRarityColor, getFragmentIcon, calculateShatterValue } from "@/lib/gameLogic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FragmentInventoryProps {
  fragments: Fragment[];
  selectedFragment: Fragment | null;
  onSelectFragment: (fragment: Fragment | null) => void;
  onShatterFragment: (fragmentId: string) => void;
  isShatteringFragment: boolean;
  isLoading: boolean;
}

export default function FragmentInventory({ 
  fragments, 
  selectedFragment, 
  onSelectFragment, 
  onShatterFragment,
  isShatteringFragment,
  isLoading 
}: FragmentInventoryProps) {
  const filterButtons = [
    { label: 'All', filter: null },
    { label: 'Items', filter: 'base_item' },
    { label: 'Components', filter: 'component' },
    { label: 'Modifiers', filter: 'modifier' },
  ];

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredFragments = activeFilter 
    ? fragments.filter(f => f.type === activeFilter)
    : fragments;

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
        <CardHeader>
          <CardTitle className="text-xl font-serif">Fragment Inventory</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border h-full flex flex-col" data-testid="fragment-inventory">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-serif">Fragment Inventory</CardTitle>
          <div className="flex gap-2">
            {filterButtons.map((button) => (
              <Button
                key={button.label}
                variant={activeFilter === button.filter ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(button.filter)}
                data-testid={`filter-${button.label.toLowerCase()}`}
              >
                {button.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Inventory Grid */}
        <div className="flex-1 overflow-y-auto mb-6">
          {filteredFragments.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <i className="fas fa-box-open text-4xl mb-4 opacity-50"></i>
                <p>No fragments found</p>
                <p className="text-sm">Start spinning to collect fragments!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filteredFragments.map((fragment) => {
                const rarityColor = getRarityColor(fragment.rarity);
                const icon = getFragmentIcon(fragment.type);
                const isSelected = selectedFragment?.id === fragment.id;
                
                return (
                  <motion.div
                    key={fragment.id}
                    className={`aspect-square bg-secondary/50 border-2 rounded-lg p-2 hover:bg-secondary/70 cursor-pointer transition-all relative ${rarityColor} ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => onSelectFragment(fragment)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    data-testid={`fragment-${fragment.id}`}
                  >
                    <div className={`w-full h-full bg-gradient-to-br rounded-md flex items-center justify-center ${
                      fragment.rarity === 'legendary' ? 'from-yellow-600/20 to-orange-600/20' :
                      fragment.rarity === 'epic' ? 'from-purple-600/20 to-pink-600/20' :
                      fragment.rarity === 'rare' ? 'from-blue-600/20 to-cyan-600/20' :
                      fragment.rarity === 'uncommon' ? 'from-green-600/20 to-emerald-600/20' :
                      fragment.rarity === 'mythic' ? 'from-red-600/20 to-crimson-600/20' :
                      fragment.rarity === 'void_touched' ? 'from-purple-500/20 to-indigo-500/20' :
                      'from-gray-600/20 to-gray-700/20'
                    }`}>
                      <i className={`fas ${icon} text-2xl ${rarityColor.split(' ')[0]}`}></i>
                    </div>
                    
                    {/* Rarity indicator */}
                    <div className={`absolute bottom-1 right-1 text-xs px-1 rounded ${
                      fragment.rarity === 'void_touched' ? 'bg-purple-900/80 text-purple-300' :
                      fragment.rarity === 'mythic' ? 'bg-red-900/80 text-red-400' :
                      fragment.rarity === 'legendary' ? 'bg-yellow-900/80 text-yellow-400' :
                      fragment.rarity === 'epic' ? 'bg-purple-900/80 text-purple-400' :
                      fragment.rarity === 'rare' ? 'bg-blue-900/80 text-blue-400' :
                      fragment.rarity === 'uncommon' ? 'bg-green-900/80 text-green-400' :
                      'bg-gray-900/80 text-gray-400'
                    }`}>
                      {fragment.rarity.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Quantity */}
                    {fragment.quantity > 1 && (
                      <div className="absolute top-1 right-1 text-xs bg-black/80 text-white px-1 rounded">
                        {fragment.quantity}
                      </div>
                    )}
                  </motion.div>
                );
              })}
              
              {/* Empty slots for visual consistency */}
              {Array.from({ length: Math.max(0, 8 - filteredFragments.length) }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="aspect-square bg-secondary/20 border-2 border-dashed border-border rounded-lg opacity-50"
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Selected Item Details */}
        {selectedFragment && (
          <motion.div 
            className="bg-secondary/30 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            data-testid="fragment-details"
          >
            <h3 className={`font-semibold mb-2 ${getRarityColor(selectedFragment.rarity).split(' ')[0]}`}>
              {selectedFragment.name}
            </h3>
            <div className="text-sm text-muted-foreground mb-2 capitalize">
              {selectedFragment.type.replace('_', ' ')} - {selectedFragment.rarity}
            </div>
            
            {/* Base Stats */}
            <div className="space-y-1 text-sm mb-3">
              {Object.entries(selectedFragment.baseStats as Record<string, number>).map(([stat, value]) => (
                <div key={stat} className="flex justify-between">
                  <span className="capitalize">{stat}:</span>
                  <span className="font-mono text-primary">{value}</span>
                </div>
              ))}
            </div>
            
            {/* Implicit Modifiers */}
            {Array.isArray(selectedFragment.implicitMods) && selectedFragment.implicitMods.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">Implicit Modifiers:</div>
                {(selectedFragment.implicitMods as Array<{name: string, value: number}>).map((mod, index) => (
                  <div key={index} className="text-xs text-accent">
                    +{mod.value}% {mod.name}
                  </div>
                ))}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onShatterFragment(selectedFragment.id)}
                disabled={isShatteringFragment}
                data-testid="shatter-button"
              >
                <i className="fas fa-hammer mr-1"></i>
                {isShatteringFragment ? 'Shattering...' : `Shatter (+${calculateShatterValue(selectedFragment)} Flux)`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled
                data-testid="sell-button"
              >
                <i className="fas fa-coins mr-1"></i>
                Sell (Coming Soon)
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
