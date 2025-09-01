"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"

interface RewardItemProps {
  reward: {
    id: string
    name: string
    cost: number
    image: string
    description?: string
    available: boolean
  }
  userPoints: number
  onRedeem?: (rewardId: string) => void
  className?: string
}

export function RewardItem({ reward, userPoints, onRedeem, className }: RewardItemProps) {
  const canAfford = userPoints >= reward.cost
  const isAvailable = reward.available

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-300",
        canAfford && isAvailable
          ? "bg-gradient-to-br from-treasure/10 to-treasure/5 border-treasure/30 hover:shadow-lg hover:shadow-treasure/20"
          : "bg-card opacity-75",
        className,
      )}
    >
      <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <div className="text-4xl">{reward.image}</div>
      </div>

      <div className="space-y-2">
        <h3 className="font-heading font-semibold text-sm text-balance leading-tight">{reward.name}</h3>

        {reward.description && <p className="text-xs text-muted-foreground text-pretty">{reward.description}</p>}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-treasure fill-treasure" />
            <span className="text-xs font-medium text-treasure">{reward.cost}</span>
          </div>

          {!isAvailable ? (
            <Badge variant="secondary" className="text-xs">
              Unavailable
            </Badge>
          ) : canAfford ? (
            <Button
              size="sm"
              onClick={() => onRedeem?.(reward.id)}
              className="bg-treasure text-treasure-foreground hover:bg-treasure/90 text-xs font-heading font-semibold"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Redeem
            </Button>
          ) : (
            <Badge variant="outline" className="text-xs">
              Need {reward.cost - userPoints} more
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}
