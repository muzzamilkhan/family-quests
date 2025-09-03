"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ProtectedRoute } from "~/components/protected-route";
import {
  ArrowLeft,
  Gift,
  Star,
  Clock,
  CheckCircle,
  Sparkles,
  Crown,
  Heart
} from "lucide-react";
import { api } from "~/lib/trpc-provider";
import { toast } from "sonner";
import { ProfileAvatar } from "~/components/profile-avatar";
import { PointsCounter } from "~/components/points-counter";

function TreasuryPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [redeeming, setRedeeming] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!session) {
    router.push("/");
    return null;
  }

  // API queries
  const { data: userProfile } = api.user.getProfile.useQuery();
  const { data: rewards } = api.reward.getAll.useQuery();
  const { data: myRedemptions } = api.reward.getMyRedemptions.useQuery();

  // Mutations
  const redeemRewardMutation = api.reward.redeem.useMutation({
    onSuccess: (data) => {
      toast.success(`🏆 ${data.reward.title} redeemed successfully!`);
      toast.info("Ask your Quest Master to fulfill your reward! 🎁");
      setRedeeming(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setRedeeming(null);
    },
  });

  const handleRedeemReward = async (rewardId: string) => {
    setRedeeming(rewardId);
    await redeemRewardMutation.mutateAsync({ rewardId });
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading treasury...</span>
        </div>
      </div>
    );
  }

  // Categorize rewards
  const availableRewards = rewards?.filter(reward => reward.pointsCost <= userProfile.points) || [];
  const expensiveRewards = rewards?.filter(reward => reward.pointsCost > userProfile.points) || [];
  
  // Categorize redemptions
  const pendingRedemptions = myRedemptions?.filter(redemption => !redemption.fulfilledAt) || [];
  const fulfilledRedemptions = myRedemptions?.filter(redemption => redemption.fulfilledAt) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-20 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center shadow-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  The Royal Treasury
                </h1>
                <p className="text-sm text-muted-foreground">
                  Spend your hard-earned points on magical rewards! ✨
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ProfileAvatar
              src={userProfile.image}
              name={userProfile.name || "Adventurer"}
              size="md"
            />
            <PointsCounter points={userProfile.points} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shop" className="flex items-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>Reward Shop</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Pending</span>
              {pendingRedemptions.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingRedemptions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* Reward Shop Tab */}
          <TabsContent value="shop" className="space-y-8">
            {/* Available Rewards */}
            {availableRewards.length > 0 && (
              <section>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-600">Available Now! 🎉</h2>
                    <p className="text-sm text-muted-foreground">
                      You have enough points for these rewards
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableRewards.map((reward) => (
                    <Card 
                      key={reward.id}
                      className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <CardHeader className="text-center pb-3">
                        <div className="text-4xl mb-2">🎁</div>
                        <h3 className="text-xl font-bold text-green-800">{reward.title}</h3>
                        {reward.description && (
                          <p className="text-sm text-green-600/80">{reward.description}</p>
                        )}
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-center">
                          <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                            <Star className="w-4 h-4 mr-1" />
                            {reward.pointsCost} Points
                          </Badge>
                        </div>
                        
                        <Button
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={redeeming === reward.id}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg py-6"
                          size="lg"
                        >
                          {redeeming === reward.id ? (
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-5 h-5 animate-spin" />
                              <span>Redeeming...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Gift className="w-5 h-5" />
                              <span>Redeem Now!</span>
                            </div>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Goal Rewards */}
            {expensiveRewards.length > 0 && (
              <section>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-amber-600">Save Up For These! 🎯</h2>
                    <p className="text-sm text-muted-foreground">
                      Keep completing quests to unlock these amazing rewards
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {expensiveRewards.map((reward) => {
                    const progress = (userProfile.points / reward.pointsCost) * 100;
                    const pointsNeeded = reward.pointsCost - userProfile.points;
                    
                    return (
                      <Card 
                        key={reward.id}
                        className="border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg transition-shadow"
                      >
                        <CardHeader className="text-center pb-3">
                          <div className="text-4xl mb-2 opacity-60">🏆</div>
                          <h3 className="text-xl font-bold text-amber-800">{reward.title}</h3>
                          {reward.description && (
                            <p className="text-sm text-amber-600/80">{reward.description}</p>
                          )}
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-center">
                            <Badge variant="outline" className="text-lg px-4 py-2 border-amber-300 text-amber-700">
                              <Star className="w-4 h-4 mr-1" />
                              {reward.pointsCost} Points
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium text-amber-700">
                                {userProfile.points}/{reward.pointsCost}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(progress, 100)} 
                              className="h-3 bg-amber-100"
                            />
                            <p className="text-center text-sm text-amber-600 font-medium">
                              {pointsNeeded} more points needed! 💪
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Empty State */}
            {(!availableRewards.length && !expensiveRewards.length) && (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className="text-2xl font-bold mb-2">Treasury is Empty</h3>
                  <p className="text-muted-foreground mb-6">
                    Ask your Quest Master to add some magical rewards! ✨
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/child")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Quests
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pending Redemptions Tab */}
          <TabsContent value="pending" className="space-y-6">
            {pendingRedemptions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-amber-600">Awaiting Fulfillment</h2>
                    <p className="text-sm text-muted-foreground">
                      Your Quest Master will fulfill these rewards soon!
                    </p>
                  </div>
                </div>

                {pendingRedemptions.map((redemption) => (
                  <Card key={redemption.id} className="border-2 border-amber-200 bg-amber-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">🎁</div>
                          <div>
                            <h3 className="text-lg font-semibold">{redemption.reward.title}</h3>
                            {redemption.reward.description && (
                              <p className="text-sm text-muted-foreground">{redemption.reward.description}</p>
                            )}
                            <div className="flex items-center space-x-3 mt-2">
                              <Badge className="bg-amber-600 text-white">
                                {redemption.reward.pointsCost} points spent
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Redeemed {new Date(redemption.redeemedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <p className="text-sm font-medium text-amber-600">Waiting...</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="text-6xl mb-4">⏳</div>
                  <h3 className="text-2xl font-bold mb-2">Nothing Pending</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't have any rewards waiting to be fulfilled.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/dashboard/treasury")}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Shop for Rewards
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            {fulfilledRedemptions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-600">Fulfilled Rewards</h2>
                    <p className="text-sm text-muted-foreground">
                      Look at all the amazing rewards you've earned! 🎉
                    </p>
                  </div>
                </div>

                {fulfilledRedemptions.map((redemption) => (
                  <Card key={redemption.id} className="border-2 border-green-200 bg-green-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl">✅</div>
                          <div>
                            <h3 className="text-lg font-semibold text-green-800">{redemption.reward.title}</h3>
                            {redemption.reward.description && (
                              <p className="text-sm text-green-600/80">{redemption.reward.description}</p>
                            )}
                            <div className="flex items-center space-x-3 mt-2">
                              <Badge className="bg-green-600 text-white">
                                {redemption.reward.pointsCost} points
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Fulfilled {redemption.fulfilledAt ? new Date(redemption.fulfilledAt).toLocaleDateString() : "Recently"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <Heart className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-green-600">Enjoyed!</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="text-6xl mb-4">📜</div>
                  <h3 className="text-2xl font-bold mb-2">No History Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Complete quests and redeem rewards to build your history! 🌟
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/child")}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Quests
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function TreasuryPage() {
  return (
    <ProtectedRoute requiredRole="CHILD">
      <TreasuryPageContent />
    </ProtectedRoute>
  );
}