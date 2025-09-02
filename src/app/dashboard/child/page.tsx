"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import {
  Sparkles,
  Star,
  Trophy,
  Gift,
  CheckCircle,
  Clock,
  Heart,
  Crown,
  Sword
} from "lucide-react";
import { api } from "~/lib/trpc-provider";
import { toast } from "sonner";
import { ProfileAvatar } from "~/components/profile-avatar";
import { EditableProfile } from "~/components/editable-profile";
import { PointsCounter } from "~/components/points-counter";
import { useRealtimeUpdates, useRealtimeMyQuests, useRealtimeProfile, useRealtimeLeaderboard } from "~/hooks/use-realtime-updates";

// Quest completion status types
type QuestStatus = "available" | "completed" | "approved" | "treasure" | "rejected";

interface QuestWithStatus {
  id: string;
  title: string;
  points: number;
  icon?: string | null;
  image?: string | null;
  frequency: string;
  status: QuestStatus;
  completionId?: string;
}

export default function ChildDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [completingQuest, setCompletingQuest] = useState<string | null>(null);
  const [collectingTreasure, setCollectingTreasure] = useState<string | null>(null);

  // Set up real-time updates
  useRealtimeUpdates();

  // Auto-scroll when new treasures appear
  const [previousTreasureCount, setPreviousTreasureCount] = useState(0);

  // API queries with real-time hooks
  const { data: userProfile } = useRealtimeProfile();
  const { data: myQuests } = useRealtimeMyQuests();
  const { data: rewards } = api.reward.getAll.useQuery(
    undefined,
    { 
      enabled: !!session,
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
    }
  );
  const { data: leaderboard } = useRealtimeLeaderboard();

  const utils = api.useUtils();

  // Mutations
  const completeQuestMutation = api.quest.complete.useMutation({
    onSuccess: () => {
      toast.success("🎯 Quest completed! Waiting for approval...");
      setCompletingQuest(null);
      // Immediate cache invalidation for instant UI update
      void utils.quest.getMyQuests.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
      setCompletingQuest(null);
    },
  });

  const collectTreasureMutation = api.quest.collectTreasure.useMutation({
    onSuccess: (data) => {
      toast.success(`🎉 +${data.quest.points} points collected! Well done, adventurer!`);
      setCollectingTreasure(null);
      // Immediate cache invalidation for instant UI update
      void utils.quest.getMyQuests.invalidate();
      void utils.user.getProfile.invalidate();
      void utils.user.getPointsLeaderboard.invalidate();
      
      // Auto-scroll to top to show updated points and treasury button
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    },
    onError: (error) => {
      toast.error(error.message);
      setCollectingTreasure(null);
    },
  });

  const redeemRewardMutation = api.reward.redeem.useMutation({
    onSuccess: (data) => {
      toast.success(`🏆 ${data.reward.title} redeemed! Ask your Quest Master to fulfill it.`);
      // Immediate cache invalidation
      void utils.user.getProfile.invalidate();
      
      // Auto-scroll to top to show updated points
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    },
    onError: (error) => toast.error(error.message),
  });

  // Redirect effect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Auto-scroll effect when new treasures appear - must be called unconditionally
  useEffect(() => {
    if (myQuests && myQuests.length > 0) {
      const currentTreasureCount = myQuests.filter(quest => {
        const latestCompletion = quest.completions[0];
        return latestCompletion && latestCompletion.status === "approved";
      }).length;
      
      // If we got new treasures, scroll to top to show them
      if (currentTreasureCount > previousTreasureCount && previousTreasureCount >= 0) {
        window.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        });
        // Show toast for new treasures
        if (currentTreasureCount - previousTreasureCount === 1) {
          toast.success("🎉 New treasure ready to collect! Scroll up if needed!", {
            duration: 5000,
          });
        } else if (currentTreasureCount - previousTreasureCount > 1) {
          toast.success(`🎉 ${currentTreasureCount - previousTreasureCount} new treasures ready to collect!`, {
            duration: 5000,
          });
        }
      }
      
      setPreviousTreasureCount(currentTreasureCount);
    } else {
      // Reset count when no quests
      setPreviousTreasureCount(0);
    }
  }, [myQuests]);

  // Process quests with status
  const questsWithStatus: QuestWithStatus[] = myQuests?.map((quest) => {
    const latestCompletion = quest.completions[0];
    
    if (!latestCompletion) {
      return {
        id: quest.id,
        title: quest.title,
        points: quest.points,
        icon: quest.icon,
        image: quest.image,
        frequency: quest.frequency,
        status: "available" as const,
      };
    }

    if (latestCompletion.status === "approved") {
      return {
        id: quest.id,
        title: quest.title,
        points: quest.points,
        icon: quest.icon,
        image: quest.image,
        frequency: quest.frequency,
        status: "treasure" as const,
        completionId: latestCompletion.id,
      };
    }

    if (latestCompletion.status === "pending") {
      return {
        id: quest.id,
        title: quest.title,
        points: quest.points,
        icon: quest.icon,
        image: quest.image,
        frequency: quest.frequency,
        status: "completed" as const,
        completionId: latestCompletion.id,
      };
    }

    if (latestCompletion.status === "collected") {
      // Already collected - quest is done for today
      return {
        id: quest.id,
        title: quest.title,
        points: quest.points,
        icon: quest.icon,
        image: quest.image,
        frequency: quest.frequency,
        status: "approved" as const, // Use "approved" to indicate it's done
        completionId: latestCompletion.id,
      };
    }

    if (latestCompletion.status === "rejected") {
      // Rejected - show as rejected with retry option
      return {
        id: quest.id,
        title: quest.title,
        points: quest.points,
        icon: quest.icon,
        image: quest.image,
        frequency: quest.frequency,
        status: "rejected" as const,
        completionId: latestCompletion.id,
      };
    }

    return {
      id: quest.id,
      title: quest.title,
      points: quest.points,
      icon: quest.icon,
      frequency: quest.frequency,
      status: "available" as const,
    };
  }) || [];

  const handleCompleteQuest = async (questId: string) => {
    setCompletingQuest(questId);
    await completeQuestMutation.mutateAsync({ questId });
  };

  const handleCollectTreasure = async (completionId: string) => {
    setCollectingTreasure(completionId);
    await collectTreasureMutation.mutateAsync({ completionId });
  };

  const handleRedeemReward = async (rewardId: string) => {
    await redeemRewardMutation.mutateAsync({ rewardId });
  };

  const availableRewards = rewards?.filter(reward => 
    userProfile && reward.pointsCost <= userProfile.points
  ) || [];

  const expensiveRewards = rewards?.filter(reward => 
    userProfile && reward.pointsCost > userProfile.points
  ) || [];

  // Always render the same structure to avoid hydration mismatch
  const isLoading = status === "loading" || !session || !userProfile;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading your adventure...</span>
        </div>
      </div>
    );
  }

  const treasureQuests = questsWithStatus.filter(q => q.status === "treasure");
  const completedQuests = questsWithStatus.filter(q => q.status === "completed");
  const collectedQuests = questsWithStatus.filter(q => q.status === "approved"); // These are collected/done
  const availableQuests = questsWithStatus.filter(q => q.status === "available");
  const rejectedQuests = questsWithStatus.filter(q => q.status === "rejected");

  // Progress calculation: only count approved and collected quests (not pending approval)
  // - "treasure" = approved by parent, ready to collect 
  // - "approved" = collected/fully done
  const approvedQuests = treasureQuests.length + collectedQuests.length;
  const totalQuests = questsWithStatus.length;
  const progressPercentage = totalQuests > 0 ? (approvedQuests / totalQuests) * 100 : 0;


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-20 items-center justify-between px-6">
          <div className="flex items-center space-x-10">
            <EditableProfile
              user={{
                id: userProfile.id,
                name: userProfile.name,
                image: userProfile.image,
                role: "CHILD",
                points: userProfile.points,
              }}
              canEdit={true} // Children can edit their own profiles
              onUpdate={() => {
                void utils.user.getProfile.invalidate();
              }}
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {userProfile.name}!
              </h1>
              <p className="text-sm text-muted-foreground flex items-center space-x-2">
                <Sword className="w-4 h-4" />
                <span>Brave Adventurer • {userProfile.family?.name}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 justify-between align-items-stretch h-20">
            <PointsCounter points={userProfile.points} className="h-full"/>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/dashboard/treasury")}
              className="h-full border-accent text-accent hover:bg-accent hover:text-white"
            >
              <Gift className="w-4 h-4 mr-2" />
              Treasury
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-8">
        {/* Treasure Chest Section */}
        {treasureQuests.length > 0 && (
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Treasure Awaits! 🎉
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treasureQuests.map((quest) => (
                <Card 
                  key={quest.id}
                  className="border-2 border-accent/50 bg-gradient-to-br from-accent/10 to-primary/10 hover:shadow-xl transition-all duration-300 animate-pulse cursor-pointer hover:scale-105"
                  onClick={() => {
                    if (quest.completionId) {
                      handleCollectTreasure(quest.completionId);
                    }
                  }}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    {/* Quest Image */}
                    {quest.image ? (
                      <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-accent/50">
                        <img
                          src={quest.image}
                          alt={quest.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      quest.completionId && collectingTreasure === quest.completionId ? (
                        <div className="text-6xl animate-spin">
                          ✨
                        </div>
                      ) : (
                        <div className="text-6xl animate-bounce">
                          🏆
                        </div>
                      )
                    )}
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">{quest.title}</h3>
                      <Badge className="bg-gradient-to-r from-accent to-primary text-white text-lg px-4 py-2">
                        +{quest.points} Points Available!
                      </Badge>
                    </div>
                    {quest.completionId && collectingTreasure === quest.completionId ? (
                      <p className="text-sm text-muted-foreground">
                        Collecting treasure... ✨
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Tap the treasure to collect your points! ✨
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Today's Quests */}
        <section>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Sword className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Today's Epic Quests</h2>
          </div>

          {/* Quest Progress */}
          {questsWithStatus.length > 0 && (
            <Card className="mb-6 border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Quest Progress</h3>
                  <Badge variant="outline">
                    {approvedQuests}/{totalQuests} Complete
                  </Badge>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-3"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Keep going! You're doing amazing! 🌟
                </p>
              </CardContent>
            </Card>
          )}

          {/* Available Quests */}
          {availableQuests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-muted-foreground">Ready for Adventure</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableQuests.map((quest) => (
                  <Card 
                    key={quest.id}
                    className="hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 border-primary/20 hover:border-primary/40"
                  >
                    <CardHeader className="pb-3">
                      {/* Quest Image */}
                      {quest.image ? (
                        <div className="w-full h-auto rounded-md overflow-hidden mb-3">
                          <img
                            src={quest.image}
                            alt={quest.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <div className="text-3xl">{quest.icon || "⭐"}</div>
                        <Badge variant="outline">+{quest.points} pts</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{quest.title}</h3>
                        <Badge variant="secondary">{quest.frequency}</Badge>
                      </div>
                      
                      <Button
                        onClick={() => handleCompleteQuest(quest.id)}
                        disabled={completingQuest === quest.id}
                        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold"
                        size="lg"
                      >
                        {completingQuest === quest.id ? (
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 animate-spin" />
                            <span>Completing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Complete Quest</span>
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold text-muted-foreground">Waiting for Review</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {completedQuests.map((quest) => (
                  <Card 
                    key={quest.id}
                    className="border-2 border-amber-200 bg-amber-50/50"
                  >
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="text-3xl opacity-75">{quest.icon || "⭐"}</div>
                      <div>
                        <h3 className="font-semibold">{quest.title}</h3>
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-amber-700">Awaiting approval</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Quests */}
          {rejectedQuests.length > 0 && (
            <div className="space-y-4 mt-8">
              <h3 className="text-lg font-semibold text-red-600">Needs Another Try 🔄</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {rejectedQuests.map((quest) => (
                  <Card 
                    key={quest.id}
                    className="border-2 border-red-200 bg-red-50/50"
                  >
                    <CardHeader className="pb-3">
                      {/* Quest Image */}
                      {quest.image ? (
                        <div className="w-full h-auto rounded-md overflow-hidden mb-3 opacity-75">
                          <img
                            src={quest.image}
                            alt={quest.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <div className="text-3xl opacity-75">{quest.icon || "⭐"}</div>
                        <Badge variant="outline" className="border-red-300 text-red-700">+{quest.points} pts</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{quest.title}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="secondary">{quest.frequency}</Badge>
                          <Badge className="bg-red-100 text-red-800 border border-red-300">
                            Needs Retry
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleCompleteQuest(quest.id)}
                        disabled={completingQuest === quest.id}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                        size="lg"
                      >
                        {completingQuest === quest.id ? (
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 animate-spin" />
                            <span>Trying Again...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Try Again</span>
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Quests State */}
          {questsWithStatus.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Quests Today</h3>
                <p className="text-muted-foreground">
                  Check back later for new adventures! 🌟
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Quick Treasury Preview */}
        {(availableRewards.length > 0 || expensiveRewards.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Treasury Preview</h2>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push("/dashboard/treasury")}
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                View All Rewards
              </Button>
            </div>

            {/* Available Rewards */}
            {availableRewards.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-600">Available Now! 🎁</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableRewards.slice(0, 3).map((reward) => (
                    <Card 
                      key={reward.id}
                      className="border-2 border-green-200 bg-green-50/50 hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-4">
                        {/* Reward Image */}
                        {reward.image && (
                          <div className="w-full h-24 rounded-md overflow-hidden mb-3">
                            <img
                              src={reward.image}
                              alt={reward.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{reward.title}</h3>
                          <Badge className="bg-green-600 text-white">
                            {reward.pointsCost} pts
                          </Badge>
                        </div>
                        {reward.description && (
                          <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={redeemRewardMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          Redeem Now
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Goal Rewards */}
            {expensiveRewards.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="text-lg font-semibold text-muted-foreground">Coming Soon... 🎯</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {expensiveRewards.slice(0, 3).map((reward) => {
                    const progress = userProfile ? (userProfile.points / reward.pointsCost) * 100 : 0;
                    const pointsNeeded = reward.pointsCost - (userProfile?.points || 0);
                    
                    return (
                      <Card 
                        key={reward.id}
                        className="border-2 border-dashed border-muted-foreground/30"
                      >
                        <CardContent className="p-4">
                          {/* Reward Image */}
                          {reward.image && (
                            <div className="w-full h-auto rounded-md overflow-hidden mb-3 opacity-50">
                              <img
                                src={reward.image}
                                alt={reward.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-muted-foreground">{reward.title}</h3>
                            <Badge variant="outline">
                              {reward.pointsCost} pts
                            </Badge>
                          </div>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                          )}
                          <div className="space-y-2">
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {pointsNeeded} more points needed
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Family Leaderboard */}
        {leaderboard && leaderboard.length > 1 && (
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Family Champions</h2>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {leaderboard.map((member, index) => (
                    <div 
                      key={member.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        member.id === userProfile.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <ProfileAvatar
                          src={member.image ?? undefined}
                          name={member.name || "Adventurer"}
                          size="sm"
                          className="gap-0"
                        />
                        <span className={`font-semibold ${member.id === userProfile.id ? 'text-primary' : ''}`}>
                          {member.name}
                          {member.id === userProfile.id && (
                            <span className="text-xs text-primary ml-1">(You!)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-accent" />
                        <span className="font-bold">{member.totalPoints}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}