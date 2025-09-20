import { Fragment } from "@shared/schema";
import { getRarityColor, getFragmentIcon } from "@/lib/gameLogic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SpinResultModalProps {
  fragment: Fragment;
  onClose: () => void;
}

export default function SpinResultModal({ fragment, onClose }: SpinResultModalProps) {
  const rarityColor = getRarityColor(fragment.rarity);
  const icon = getFragmentIcon(fragment.type);

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        data-testid="spin-result-modal"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Card className="w-full max-w-md mx-4 border-border">
            <CardContent className="pt-6 text-center">
              <div className="mb-6">
                <motion.div 
                  className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    boxShadow: [
                      "0 0 20px hsl(258 90% 66% / 0.4)",
                      "0 0 40px hsl(258 90% 66% / 0.8)",
                      "0 0 20px hsl(258 90% 66% / 0.4)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <i className={`fas ${icon} text-3xl text-white`}></i>
                </motion.div>
                
                <h3 className="text-2xl font-serif font-bold text-primary mb-2">
                  Fragment Discovered!
                </h3>
                <div className={`text-lg font-semibold mb-1 ${rarityColor.split(' ')[0]}`}>
                  {fragment.name}
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {fragment.type.replace('_', ' ')} • {fragment.rarity}
                </div>
              </div>
              
              {/* Fragment Stats */}
              <div className="space-y-2 text-sm mb-6 text-left">
                <div className="flex justify-between">
                  <span>Rarity:</span>
                  <span className={`capitalize ${rarityColor.split(' ')[0]}`}>
                    {fragment.rarity.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Base Stats */}
                {Object.entries(fragment.baseStats as Record<string, number>).map(([stat, value]) => (
                  <div key={stat} className="flex justify-between">
                    <span className="capitalize">{stat}:</span>
                    <span className="font-mono text-primary">{value}</span>
                  </div>
                ))}
                
                {/* Implicit Mods */}
                {Array.isArray(fragment.implicitMods) && fragment.implicitMods.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Properties:</div>
                    {(fragment.implicitMods as Array<{name: string, value: number}>).map((mod, index) => (
                      <div key={index} className="text-xs text-accent">
                        +{mod.value}% {mod.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button 
                onClick={onClose}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                data-testid="continue-button"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
