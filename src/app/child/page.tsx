"use client"

import { useState } from "react"
import { QuestCard } from "~/components/quest-card"
import { PointsCounter } from "~/components/points-counter"
import { ProfileAvatar } from "~/components/profile-avatar"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Aperture as Treasure, Sparkles } from "lucide-react"

// Mock data for demonstration
const mockChild = {
  name: "Alex",
  image: "/non-photorealistic-child-avatar.png",
  role: "child" as const,
  points: 150,
}

const mockQuests = [
  {
    id: "1",
    name: "Make Your Bed",
    points: 10,
    icon: "🛏️",
    status: "treasure" as const,
    description: "Tidy up your sleeping quarters like a true adventurer!",
  },
  {
    id: "2",
    name: "Feed the Dragon (Cat)",
    points: 15,
    icon: "🐱",
    status: "new" as const,
    description: "Our feline friend needs sustenance for the day ahead.",
  },
  {
    id: "3",
    name: "Organize Toy Kingdom",
    points: 20,
    icon: "🧸",
    status: "pending" as const,
    description: "Return all toys to their rightful places in the kingdom.",
  },
  {
    id: "4",
    name: "Brush Teeth",
    points: 5,
    icon: "🦷",
    status: "completed" as const,
    description: "Keep your pearly whites sparkling clean!",
  },
]

export default function ChildDashboard() {
  const [quests, setQuests] = useState(mockQuests)
  const [points, setPoints] = useState(mockChild.points)
  const [showPointsAnimation, setShowPointsAnimation] = useState(false)

  const handleCompleteQuest = (questId: string) => {
    setQuests((prev) => prev.map((quest) => (quest.id === questId ? { ...quest, status: "pending" as const } : quest)))
  }

  const handleCollectTreasure = (questId: string) => {
    const quest = quests.find((q) => q.id === questId)
    if (quest) {
      setPoints((prev) => prev + quest.points)
      setShowPointsAnimation(true)
      setTimeout(() => setShowPointsAnimation(false), 2000)

      setQuests((prev) => prev.map((q) => (q.id === questId ? { ...q, status: "completed" as const } : q)))
    }
  }

  const treasureQuests = quests.filter((q) => q.status === "treasure")
  const activeQuests = quests.filter((q) => q.status === "new" || q.status === "pending")
  const completedQuests = quests.filter((q) => q.status === "completed")

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <ProfileAvatar user={mockChild} size="lg" showRole={false} className="mx-auto" />
          <div>
            <h1 className="text-2xl font-heading font-bold text-balance">Welcome back, {mockChild.name}! ✨</h1>
            <p className="text-muted-foreground text-pretty">Ready for today's adventures?</p>
          </div>
        </div>

        {/* Points Counter */}
        <PointsCounter points={points} showAnimation={showPointsAnimation} />

        {/* Treasury Button */}
        <Button
          className="w-full bg-treasure text-treasure-foreground hover:bg-treasure/90 font-heading font-bold text-lg py-6"
          size="lg"
        >
          <Treasure className="w-6 h-6 mr-2" />
          Visit The Treasury
        </Button>

        {/* Treasure Chests (Completed Quests Ready to Collect) */}
        {treasureQuests.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-treasure" />
              <h2 className="text-lg font-heading font-bold text-treasure">Treasure Awaits! 🏆</h2>
            </div>
            {treasureQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onCollectTreasure={handleCollectTreasure} />
            ))}
          </div>
        )}

        {/* Today's Quests */}
        <div className="space-y-3">
          <h2 className="text-lg font-heading font-bold">Today's Quest Log 📜</h2>
          {activeQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} onComplete={handleCompleteQuest} />
          ))}
        </div>

        {/* Completed Quests */}
        {completedQuests.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-heading font-bold text-green-700 dark:text-green-400">
              Completed Adventures ✅
            </h2>
            {completedQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        )}

        {/* Motivational Footer */}
        <Card className="p-4 bg-gradient-to-r from-magic/10 to-quest/10 border-magic/30 text-center">
          <p className="text-sm font-heading font-medium text-pretty">
            🌟 Every quest completed makes you a stronger adventurer! 🌟
          </p>
        </Card>
      </div>
    </div>
  )
}
