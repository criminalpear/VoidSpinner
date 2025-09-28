import { GameState } from "@shared/schema";
import { calculateDeviceUpgradeCost, getDeviceStats } from "@/lib/gameLogic";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DeviceUpgradesProps {
  gameState?: GameState;
}

export default function DeviceUpgrades({ gameState }: DeviceUpgradesProps) {
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: async (upgradeType: string) => {
      const response = await apiRequest('POST', `/api/upgrade/${upgradeType}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gamestate'] });
    },
  });

  if (!gameState) return null;

  const deviceStats = getDeviceStats(gameState);

  const upgrades = [
    {
      type: 'spinSpeed',
      name: 'Spin Speed',
      level: gameState.spinSpeedLevel,
      current: `${deviceStats.spinSpeed.toFixed(1)}x speed`,
      next: `${(deviceStats.spinSpeed + 0.2).toFixed(1)}x speed`,
      cost: calculateDeviceUpgradeCost(gameState, 'spinSpeed'),
      costText: `${calculateDeviceUpgradeCost(gameState, 'spinSpeed')} Flux`,
      color: 'bg-primary/20 text-primary',
    },
    {
      type: 'rarityOdds',
      name: 'Rarity Odds',
      level: gameState.rarityOddsLevel,
      current: `+${(deviceStats.rarityBonus * 100).toFixed(2)}% rare chance`,
      next: `+${((deviceStats.rarityBonus + 0.05) * 100).toFixed(2)}% rare chance`,
      cost: calculateDeviceUpgradeCost(gameState, 'rarityOdds'),
      costText: `${calculateDeviceUpgradeCost(gameState, 'rarityOdds')} Flux + Materials`,
      color: 'bg-accent/20 text-accent',
    },
    {
      type: 'fluxCost',
      name: 'Flux Efficiency',
      level: gameState.fluxCostLevel,
      current: `${deviceStats.fluxCost} Flux per spin`,
      next: `${Math.max(deviceStats.fluxCost - 5, 5)} Flux per spin`,
      cost: calculateDeviceUpgradeCost(gameState, 'fluxCost'),
      costText: `${calculateDeviceUpgradeCost(gameState, 'fluxCost')} Flux`,
      color: 'bg-green-500/20 text-green-400',
    },
    {
      type: 'mutationSlots',
      name: 'Mutation Slots',
      level: gameState.mutationSlotsLevel,
      current: `${deviceStats.mutationSlots} slots`,
      next: `${deviceStats.mutationSlots + 1} slots`,
      cost: calculateDeviceUpgradeCost(gameState, 'mutationSlots'),
      costText: `${calculateDeviceUpgradeCost(gameState, 'mutationSlots')} Flux + Rare Materials`,
      color: 'bg-destructive/20 text-destructive',
    },
  ];

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border" data-testid="device-upgrades">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Device Upgrades</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {upgrades.map((upgrade) => {
            const canAfford = gameState.flux >= upgrade.cost;
            const isUpgrading = upgradeMutation.isPending;
            
            return (
              <div key={upgrade.type} className="bg-secondary/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{upgrade.name}</span>
                  <Badge className={upgrade.color} data-testid={`${upgrade.type}-level`}>
                    Lvl {upgrade.level}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  Current: {upgrade.current}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Next: {upgrade.next}
                </div>
                <Button
                  size="sm"
                  className={`w-full text-xs ${upgrade.color} hover:opacity-80`}
                  onClick={() => upgradeMutation.mutate(upgrade.type)}
                  disabled={!canAfford || isUpgrading}
                  data-testid={`upgrade-${upgrade.type}`}
                >
                  {isUpgrading ? 'Upgrading...' : `Upgrade (${upgrade.costText})`}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
