import { useQuery } from "@tanstack/react-query";
import { MarketplaceListing } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Marketplace() {
  const { data: listings = [], isLoading } = useQuery<MarketplaceListing[]>({
    queryKey: ['/api/marketplace'],
  });

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Void Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  const topListings = listings.slice(0, 3);

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border h-full" data-testid="marketplace">
      <CardHeader>
        <CardTitle className="text-lg font-serif">Void Marketplace</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 text-sm mb-4">
          {topListings.map((listing) => {
            const priceChange = Math.random() * 20 - 10; // Simulate price changes
            const isPositive = priceChange > 0;
            const demandText = listing.demand > 1.2 ? 'High Demand ↑' : 
                              listing.demand < 0.9 ? 'Low Demand ↓' : 'Stable';
            
            return (
              <div 
                key={listing.id} 
                className="flex justify-between items-center p-2 bg-secondary/30 rounded"
                data-testid={`listing-${listing.id}`}
              >
                <div>
                  <div className={`font-medium capitalize ${
                    listing.rarity === 'rare' ? 'text-blue-400' :
                    listing.rarity === 'epic' ? 'text-purple-400' :
                    listing.rarity === 'uncommon' ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    {listing.rarity} {listing.fragmentType.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground">{demandText}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono">{listing.currentPrice} Gold</div>
                  <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{priceChange.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full" 
          disabled
          data-testid="open-marketplace-button"
        >
          <i className="fas fa-store mr-1"></i>
          Open Full Marketplace (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}
