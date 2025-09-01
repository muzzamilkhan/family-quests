"use client"

import { Card } from "@/components/ui/card"
import { Coins, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface PointsCounterProps {
  points: number
  className?: string
  showAnimation?: boolean
}

export function PointsCounter({ points, className, showAnimation = false }: PointsCounterProps) {
  return (
    <Card
      className={cn(
        "p-4 bg-gradient-to-r from-treasure/20 to-treasure/10 border-treasure/30",
        showAnimation && "animate-pulse",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-3">
        <div className="relative">
          <Coins className="w-8 h-8 text-treasure" />
          {showAnimation && <Sparkles className="w-4 h-4 text-treasure absolute -top-1 -right-1 animate-spin" />}
        </div>

        <div className="text-center">
          <div className="text-2xl font-heading font-bold text-treasure">{points.toLocaleString()}</div>
          <div className="text-sm text-treasure/80 font-medium">Adventure Points</div>
        </div>
      </div>
    </Card>
  )
}
