import { motion } from "framer-motion";
import { GameState } from "@shared/schema";
import { getDeviceStats } from "@/lib/gameLogic";

interface VoidspinnerDeviceProps {
  gameState?: GameState;
  onSpin: () => void;
  isSpinning: boolean;
}

export default function VoidspinnerDevice({ gameState, onSpin, isSpinning }: VoidspinnerDeviceProps) {
  if (!gameState) return null;

  const deviceStats = getDeviceStats(gameState);
  const canSpin = gameState.flux >= deviceStats.fluxCost && !isSpinning;

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6 flex flex-col h-full" data-testid="voidspinner-device">
      <h2 className="text-xl font-serif font-semibold mb-6 text-center">Voidspinner Device</h2>
      
      {/* Central Spinning Device */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Void Energy Field */}
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-primary/20 to-transparent opacity-50"></div>
        
        {/* Main Device */}
        <div className="relative">
          <motion.div 
            className="w-32 h-32 bg-gradient-to-br from-purple-900 to-blue-900 rounded-full border-4 border-primary/50 flex items-center justify-center relative overflow-hidden"
            animate={{ 
              rotate: isSpinning ? 360 : 0,
              scale: isSpinning ? 1.1 : 1,
            }}
            transition={{ 
              rotate: { duration: 1, ease: "easeInOut" },
              scale: { duration: 0.2 }
            }}
            data-testid="spin-device"
          >
            {/* Inner spinning mechanism */}
            <motion.div 
              className="absolute inset-2 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-4 bg-gradient-to-br from-primary/50 to-accent/50 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            {/* Core */}
            <motion.div 
              className="w-8 h-8 bg-primary rounded-full relative z-10"
              animate={{ 
                boxShadow: isSpinning 
                  ? "0 0 30px hsl(258 90% 66% / 0.8)" 
                  : "0 0 20px hsl(258 90% 66% / 0.4)"
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          
          {/* Energy Rings */}
          <motion.div 
            className="absolute inset-0 border-2 border-primary/30 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="absolute inset-0 border border-accent/20 rounded-full"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
        
        {/* Spin Button */}
        <motion.button 
          onClick={onSpin}
          disabled={!canSpin}
          className={`mt-8 font-semibold py-4 px-8 rounded-lg transform transition-all duration-200 ${
            canSpin 
              ? "bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-primary-foreground hover:scale-105 active:scale-95" 
              : "bg-secondary text-secondary-foreground cursor-not-allowed opacity-50"
          }`}
          whileHover={canSpin ? { scale: 1.05 } : {}}
          whileTap={canSpin ? { scale: 0.95 } : {}}
          data-testid="spin-button"
        >
          <i className={`fas ${isSpinning ? 'fa-spinner animate-spin' : 'fa-magic'} mr-2`}></i>
          {isSpinning ? 'SPINNING...' : `SPIN (${deviceStats.fluxCost} Flux)`}
        </motion.button>
        
        {/* Device Stats */}
        <div className="mt-6 w-full space-y-3">
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Spin Speed</span>
            <span className="font-mono text-sm" data-testid="spin-speed">
              {deviceStats.spinSpeed.toFixed(1)}x
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Rarity Bonus</span>
            <span className="font-mono text-sm" data-testid="rarity-bonus">
              +{(deviceStats.rarityBonus * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Mutation Slots</span>
            <span className="font-mono text-sm" data-testid="mutation-slots">
              {deviceStats.mutationSlots}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
