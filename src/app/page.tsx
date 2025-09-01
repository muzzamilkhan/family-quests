"use client"

import { Card } from "~/components/ui/card"
import { Crown, Sword, Sparkles } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Title */}
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🏰</div>
          <h1 className="text-4xl font-heading font-bold text-balance">Family Quests</h1>
          <p className="text-lg text-muted-foreground text-pretty">Transform chores into epic family adventures!</p>
        </div>

        {/* Role Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-heading font-semibold text-center">Choose Your Role</h2>

          <div className="grid gap-4">
            <Link href="/parent">
              <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer border-2 hover:border-primary/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-treasure/20 rounded-full">
                    <Crown className="w-8 h-8 text-treasure" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg">Quest Master</h3>
                    <p className="text-sm text-muted-foreground text-pretty">
                      Manage quests, approve adventures, and oversee the treasury
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/child">
              <Card className="p-6 hover:bg-secondary/50 transition-colors cursor-pointer border-2 hover:border-quest/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-quest/20 rounded-full">
                    <Sword className="w-8 h-8 text-quest" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-lg">Adventurer</h3>
                    <p className="text-sm text-muted-foreground text-pretty">
                      Complete quests, earn points, and claim amazing rewards
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Treasury Preview */}
        <Link href="/treasury">
          <Card className="p-4 bg-gradient-to-r from-treasure/10 to-treasure/5 border-treasure/30 hover:shadow-lg hover:shadow-treasure/20 transition-all cursor-pointer">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-treasure" />
              <span className="font-heading font-semibold text-treasure">Visit The Treasury</span>
              <Sparkles className="w-5 h-5 text-treasure" />
            </div>
          </Card>
        </Link>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p className="text-pretty">
            🌟 Adventure awaits! Complete quests, earn treasures, and become the ultimate family hero! 🌟
          </p>
        </div>
      </div>
    </div>
  )
}
