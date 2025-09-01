"use client"

import { useState } from "react"
import { RewardItem } from "~/components/reward-item"
import { PointsCounter } from "~/components/points-counter"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { ArrowLeft, Plus, Sparkles } from "lucide-react"

// Mock data
const mockRewards = [
  {
    id: "1",
    name: "Extra Screen Time",
    cost: 50,
    image: "📱",
    description: "30 minutes of bonus screen time",
    available: true,
  },
  {
    id: "2",
    name: "Choose Dinner",
    cost: 75,
    image: "🍕",
    description: "Pick what the family eats for dinner",
    available: true,
  },
  {
    id: "3",
    name: "Stay Up Late",
    cost: 100,
    image: "🌙",
    description: "Stay up 1 hour past bedtime on weekend",
    available: true,
  },
  {
    id: "4",
    name: "Movie Night Pick",
    cost: 60,
    image: "🎬",
    description: "Choose the movie for family movie night",
    available: true,
  },
  {
    id: "5",
    name: "Ice Cream Trip",
    cost: 120,
    image: "🍦",
    description: "Special trip to the ice cream shop",
    available: true,
  },
  {
    id: "6",
    name: "New Toy",
    cost: 200,
    image: "🧸",
    description: "Pick a new toy under $20",
    available: false,
  },
]

export default function Treasury() {
  const [userPoints] = useState(150)
  const [rewards, setRewards] = useState(mockRewards)

  const handleRedeem = (rewardId: string) => {
    const reward = rewards.find((r) => r.id === rewardId)
    if (reward && userPoints >= reward.cost) {
      // In a real app, this would update the user's points and create a redemption record
      console.log(`Redeemed: ${reward.name} for ${reward.cost} points`)
    }
  }

  const affordableRewards = rewards.filter((r) => r.available && userPoints >= r.cost)
  const expensiveRewards = rewards.filter((r) => r.available && userPoints < r.cost)
  const unavailableRewards = rewards.filter((r) => !r.available)

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quests
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-heading font-bold text-balance">The Treasury 🏛️</h1>
            <p className="text-muted-foreground text-pretty">
              Spend your hard-earned adventure points on amazing rewards!
            </p>
          </div>
        </div>

        {/* Points Display */}
        <PointsCounter points={userPoints} />

        {/* Add Reward Button (Parent View) */}
        <Card className="p-4 border-dashed border-2 border-muted-foreground/30">
          <div className="text-center">
            <Button variant="outline" className="font-heading bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Add New Reward
            </Button>
            <p className="text-sm text-muted-foreground mt-2">Parents can add custom rewards here</p>
          </div>
        </Card>

        {/* Available Rewards */}
        {affordableRewards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-treasure" />
              <h2 className="text-xl font-heading font-bold text-treasure">Ready to Claim! ✨</h2>
              <Badge className="bg-treasure text-treasure-foreground">{affordableRewards.length} available</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {affordableRewards.map((reward) => (
                <RewardItem key={reward.id} reward={reward} userPoints={userPoints} onRedeem={handleRedeem} />
              ))}
            </div>
          </div>
        )}

        {/* Expensive Rewards */}
        {expensiveRewards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading font-bold">Save Up For These! 💪</h2>
              <Badge variant="outline">{expensiveRewards.length} rewards</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {expensiveRewards.map((reward) => (
                <RewardItem key={reward.id} reward={reward} userPoints={userPoints} onRedeem={handleRedeem} />
              ))}
            </div>
          </div>
        )}

        {/* Unavailable Rewards */}
        {unavailableRewards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading font-bold text-muted-foreground">Coming Soon 🔒</h2>
              <Badge variant="secondary">{unavailableRewards.length} rewards</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unavailableRewards.map((reward) => (
                <RewardItem key={reward.id} reward={reward} userPoints={userPoints} onRedeem={handleRedeem} />
              ))}
            </div>
          </div>
        )}

        {/* Motivational Footer */}
        <Card className="p-6 bg-gradient-to-r from-magic/10 to-quest/10 border-magic/30 text-center">
          <h3 className="font-heading font-bold text-lg mb-2">🌟 Keep Adventuring! 🌟</h3>
          <p className="text-muted-foreground text-pretty">
            Complete more quests to unlock amazing treasures and rewards!
          </p>
        </Card>
      </div>
    </div>
  )
}
