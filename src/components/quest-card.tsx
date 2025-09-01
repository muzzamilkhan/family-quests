"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestCardProps {
  quest: {
    id: string
    name: string
    points: number
    icon: string
    status: "new" | "pending" | "treasure" | "completed"
    description?: string
  }
  onComplete?: (questId: string) => void
  onCollectTreasure?: (questId: string) => void
  className?: string
}

export function QuestCard({ quest, onComplete, onCollectTreasure, className }: QuestCardProps) {
  const getStatusConfig = () => {
    switch (quest.status) {
      case "new":
        return {
          bgColor: "bg-card hover:bg-secondary/50",
          borderColor: "border-border",
          icon: <Clock className="w-6 h-6 text-muted-foreground" />,
          button: (
            <Button
              onClick={() => onComplete?.(quest.id)}
              className="bg-quest text-quest-foreground hover:bg-quest/90 font-heading font-semibold"
            >
              Complete Quest
            </Button>
          ),
        }
      case "pending":
        return {
          bgColor: "bg-amber-50 dark:bg-amber-950/20",
          borderColor: "border-amber-200 dark:border-amber-800",
          icon: <Clock className="w-6 h-6 text-amber-600" />,
          button: (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Awaiting Review
            </Badge>
          ),
        }
      case "treasure":
        return {
          bgColor: "bg-gradient-to-br from-treasure/20 to-treasure/10 hover:from-treasure/30 hover:to-treasure/20",
          borderColor: "border-treasure",
          icon: <Sparkles className="w-6 h-6 text-treasure animate-pulse" />,
          button: (
            <Button
              onClick={() => onCollectTreasure?.(quest.id)}
              className="bg-treasure text-treasure-foreground hover:bg-treasure/90 font-heading font-semibold animate-pulse"
            >
              🏆 Collect Treasure!
            </Button>
          ),
        }
      case "completed":
        return {
          bgColor: "bg-green-50 dark:bg-green-950/20",
          borderColor: "border-green-200 dark:border-green-800",
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          button: (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              ✨ Completed
            </Badge>
          ),
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Card
      className={cn(
        "p-6 transition-all duration-300 cursor-pointer",
        config.bgColor,
        config.borderColor,
        "border-2",
        quest.status === "treasure" && "shadow-lg shadow-treasure/20",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{quest.icon}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-heading font-bold text-lg text-balance leading-tight">{quest.name}</h3>
            {config.icon}
          </div>

          {quest.description && <p className="text-sm text-muted-foreground mb-3 text-pretty">{quest.description}</p>}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-treasure fill-treasure" />
              <span className="font-heading font-semibold text-treasure">{quest.points} points</span>
            </div>

            {config.button}
          </div>
        </div>
      </div>
    </Card>
  )
}
