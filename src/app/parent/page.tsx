"use client"

import { useState } from "react"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { ProfileAvatar } from "~/components/profile-avatar"
import { Plus, Settings, Users, Aperture as Treasure, CheckCircle, Clock, X, Star, Edit } from "lucide-react"

// Mock data
const mockFamily = [
  {
    name: "Alex",
    image: "/non-photorealistic-child-avatar.png",
    role: "child" as const,
    points: 150,
  },
  {
    name: "Sam",
    image: "/child-avatar-2.png",
    role: "child" as const,
    points: 85,
  },
]

const mockQuests = [
  {
    id: "1",
    name: "Make Your Bed",
    assignedTo: "Alex",
    points: 10,
    status: "pending" as const,
    frequency: "Daily",
    icon: "🛏️",
  },
  {
    id: "2",
    name: "Feed the Cat",
    assignedTo: "Sam",
    points: 15,
    status: "completed" as const,
    frequency: "Daily",
    icon: "🐱",
  },
  {
    id: "3",
    name: "Clean Room",
    assignedTo: "Alex",
    points: 25,
    status: "active" as const,
    frequency: "Weekly",
    icon: "🧹",
  },
]

export default function ParentDashboard() {
  const [quests, setQuests] = useState(mockQuests)
  const [newQuestName, setNewQuestName] = useState("")
  const [editingQuest, setEditingQuest] = useState<string | null>(null)

  const handleApproveQuest = (questId: string) => {
    setQuests((prev) =>
      prev.map((quest) => (quest.id === questId ? { ...quest, status: "completed" as const } : quest)),
    )
  }

  const handleRejectQuest = (questId: string) => {
    setQuests((prev) => prev.map((quest) => (quest.id === questId ? { ...quest, status: "active" as const } : quest)))
  }

  const handleAddQuest = () => {
    if (newQuestName.trim()) {
      const newQuest = {
        id: Date.now().toString(),
        name: newQuestName,
        assignedTo: "Alex",
        points: 10,
        status: "active" as const,
        frequency: "Daily",
        icon: "⭐",
      }
      setQuests((prev) => [newQuest, ...prev])
      setNewQuestName("")
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
          icon: <Clock className="w-4 h-4" />,
        }
      case "completed":
        return {
          color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          icon: <CheckCircle className="w-4 h-4" />,
        }
      default:
        return {
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          icon: <Star className="w-4 h-4" />,
        }
    }
  }

  const pendingQuests = quests.filter((q) => q.status === "pending")
  const activeQuests = quests.filter((q) => q.status === "active")
  const completedQuests = quests.filter((q) => q.status === "completed")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Quest Board</h1>
            <p className="text-muted-foreground">Manage your family's adventures</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4 mr-2" />
              Family
            </Button>
            <Button variant="outline" size="sm">
              <Treasure className="w-4 h-4 mr-2" />
              Treasury
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Family Overview */}
        <Card className="p-4">
          <h2 className="font-heading font-semibold mb-3">Family Heroes</h2>
          <div className="flex gap-4">
            {mockFamily.map((member, index) => (
              <ProfileAvatar key={index} user={member} showPoints={true} size="md" />
            ))}
          </div>
        </Card>

        {/* Quick Add Quest */}
        <Card className="p-4">
          <h2 className="font-heading font-semibold mb-3">Add New Quest</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Enter quest name..."
              value={newQuestName}
              onChange={(e) => setNewQuestName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddQuest()}
              className="flex-1"
            />
            <Button onClick={handleAddQuest} className="bg-quest text-quest-foreground hover:bg-quest/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Quest
            </Button>
          </div>
        </Card>

        {/* Pending Review */}
        {pendingQuests.length > 0 && (
          <Card className="p-4">
            <h2 className="font-heading font-semibold mb-3 text-amber-700 dark:text-amber-400">
              Pending Review ({pendingQuests.length})
            </h2>
            <div className="space-y-2">
              {pendingQuests.map((quest) => {
                const config = getStatusConfig(quest.status)
                return (
                  <div
                    key={quest.id}
                    className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{quest.icon}</span>
                      <div>
                        <div className="font-medium">{quest.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {quest.assignedTo} • {quest.points} points • {quest.frequency}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveQuest(quest.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectQuest(quest.id)}>
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Active Quests */}
        <Card className="p-4">
          <h2 className="font-heading font-semibold mb-3">Active Quests</h2>
          <div className="space-y-2">
            {activeQuests.map((quest) => {
              const config = getStatusConfig(quest.status)
              return (
                <div
                  key={quest.id}
                  className="flex items-center justify-between p-3 bg-card hover:bg-secondary/50 rounded-lg border border-border transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{quest.icon}</span>
                    <div>
                      <div className="font-medium">{quest.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {quest.assignedTo} • {quest.points} points • {quest.frequency}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={config.color}>
                      {config.icon}
                      <span className="ml-1 capitalize">{quest.status}</span>
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recently Completed */}
        {completedQuests.length > 0 && (
          <Card className="p-4">
            <h2 className="font-heading font-semibold mb-3 text-green-700 dark:text-green-400">Recently Completed</h2>
            <div className="space-y-2">
              {completedQuests.map((quest) => {
                const config = getStatusConfig(quest.status)
                return (
                  <div
                    key={quest.id}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{quest.icon}</span>
                      <div>
                        <div className="font-medium">{quest.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {quest.assignedTo} • {quest.points} points • {quest.frequency}
                        </div>
                      </div>
                    </div>

                    <Badge className={config.color}>
                      {config.icon}
                      <span className="ml-1">Completed</span>
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
