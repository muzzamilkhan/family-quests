"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Plus,
  Settings,
  Users,
  Gift,
  CheckCircle,
  Clock,
  X,
  Star,
  Edit,
  Copy,
  Crown,
  Sparkles,
  Swords
} from "lucide-react";
import { api } from "~/lib/trpc-provider";
import { toast } from "sonner";
import { ProfileAvatar } from "~/components/profile-avatar";

export default function ParentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [isAddingReward, setIsAddingReward] = useState(false);

  // Quest form state
  const [questForm, setQuestForm] = useState({
    title: "",
    points: 1,
    icon: "⭐",
    frequency: "daily" as "daily" | "weekly" | "once",
    assignedUserIds: [] as string[],
  });

  // Child form state
  const [childForm, setChildForm] = useState({
    name: "",
    email: "",
  });

  // Reward form state
  const [rewardForm, setRewardForm] = useState({
    title: "",
    description: "",
    pointsCost: 10,
  });

  // Redirect if not authenticated
  if (!session) {
    router.push("/");
    return null;
  }

  // API queries
  const { data: family, refetch: refetchFamily } = api.family.getMyFamily.useQuery();
  const { data: children } = api.family.getChildren.useQuery();
  const { data: quests, refetch: refetchQuests } = api.quest.getAll.useQuery();
  const { data: rewards } = api.reward.getAll.useQuery();
  const { data: pendingCompletions } = api.quest.getPendingCompletions.useQuery();
  const { data: pendingRedemptions } = api.reward.getPendingRedemptions.useQuery();

  // Mutations
  const createQuestMutation = api.quest.create.useMutation({
    onSuccess: () => {
      toast.success("🎯 Quest created successfully!");
      setIsAddingQuest(false);
      setQuestForm({ title: "", points: 1, icon: "⭐", frequency: "daily", assignedUserIds: [] });
      refetchQuests();
    },
    onError: (error) => toast.error(error.message),
  });

  const addChildMutation = api.family.addChild.useMutation({
    onSuccess: (data) => {
      toast.success("👶 Child added successfully!");
      setIsAddingChild(false);
      setChildForm({ name: "", email: "" });
      refetchFamily();
      
      // Show permalink
      if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(`${window.location.origin}/child/${data.permalink}`);
        toast.success("🔗 Child's magic link copied to clipboard!");
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const createRewardMutation = api.reward.create.useMutation({
    onSuccess: () => {
      toast.success("🏆 Reward added to treasury!");
      setIsAddingReward(false);
      setRewardForm({ title: "", description: "", pointsCost: 10 });
    },
    onError: (error) => toast.error(error.message),
  });

  const approveQuestMutation = api.quest.approve.useMutation({
    onSuccess: () => {
      toast.success("✅ Quest approved! Points awarded!");
      refetchQuests();
    },
    onError: (error) => toast.error(error.message),
  });

  const rejectQuestMutation = api.quest.reject.useMutation({
    onSuccess: () => {
      toast.success("❌ Quest rejected.");
      refetchQuests();
    },
    onError: (error) => toast.error(error.message),
  });

  const fulfillRewardMutation = api.reward.fulfill.useMutation({
    onSuccess: () => {
      toast.success("🎁 Reward marked as fulfilled!");
    },
    onError: (error) => toast.error(error.message),
  });

  // Event handlers
  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    await createQuestMutation.mutateAsync(questForm);
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    await addChildMutation.mutateAsync(childForm);
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRewardMutation.mutateAsync(rewardForm);
  };

  const copyChildLink = (permalink: string) => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/child/${permalink}`;
      navigator.clipboard.writeText(link);
      toast.success("🔗 Magic link copied to clipboard!");
    }
  };

  if (!family) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading your kingdom...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{family.name}</h1>
              <p className="text-sm text-muted-foreground">Quest Master Dashboard</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push("/api/auth/signout")}
            className="text-sm"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center space-x-2">
              <Swords className="w-4 h-4" />
              <span>Quest Board</span>
            </TabsTrigger>
            <TabsTrigger value="treasury" className="flex items-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>Treasury</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Family</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Quests</CardTitle>
                  <Swords className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quests?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Adventurers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{children?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingCompletions?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Treasury Items</CardTitle>
                  <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{rewards?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Actions */}
            {(pendingCompletions && pendingCompletions.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-accent" />
                    <span>Quest Reviews Needed</span>
                    <Badge variant="secondary">{pendingCompletions.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingCompletions.map((completion) => (
                      <div key={completion.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <ProfileAvatar
                            src={completion.user.image}
                            name={completion.user.name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium">{completion.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Completed: {completion.quest.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(completion.completedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">+{completion.quest.points} points</Badge>
                          <Button
                            size="sm"
                            onClick={() => approveQuestMutation.mutate({ completionId: completion.id })}
                            disabled={approveQuestMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectQuestMutation.mutate({ completionId: completion.id })}
                            disabled={rejectQuestMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Redemptions */}
            {(pendingRedemptions && pendingRedemptions.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gift className="w-5 h-5 text-accent" />
                    <span>Reward Fulfillments Needed</span>
                    <Badge variant="secondary">{pendingRedemptions.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRedemptions.map((redemption) => (
                      <div key={redemption.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <ProfileAvatar
                            src={redemption.user.image}
                            name={redemption.user.name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium">{redemption.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Wants: {redemption.reward.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Cost: {redemption.reward.pointsCost} points
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => fulfillRewardMutation.mutate({ redemptionId: redemption.id })}
                          disabled={fulfillRewardMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Mark Fulfilled
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quest Board Tab */}
          <TabsContent value="quests" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quest Board</h2>
              <Dialog open={isAddingQuest} onOpenChange={setIsAddingQuest}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quest
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Quest</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateQuest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Quest Title</Label>
                      <Input
                        id="title"
                        placeholder="Clean the Dragon's Lair (bedroom)"
                        value={questForm.title}
                        onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="points">Reward Points</Label>
                        <Input
                          id="points"
                          type="number"
                          min="1"
                          value={questForm.points}
                          onChange={(e) => setQuestForm({ ...questForm, points: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select
                          value={questForm.frequency}
                          onValueChange={(value) => setQuestForm({ ...questForm, frequency: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="once">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="icon">Quest Icon</Label>
                      <Input
                        id="icon"
                        placeholder="⭐"
                        value={questForm.icon}
                        onChange={(e) => setQuestForm({ ...questForm, icon: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingQuest(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createQuestMutation.isPending}
                        className="bg-gradient-to-r from-primary to-accent text-white"
                      >
                        Create Quest
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Quests Grid */}
            <div className="grid gap-4">
              {quests?.map((quest) => (
                <Card key={quest.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{quest.icon || "⭐"}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{quest.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Star className="w-4 h-4" />
                              <span>{quest.points} points</span>
                            </span>
                            <Badge variant="outline">{quest.frequency}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {quest.assignments.map((assignment) => (
                          <ProfileAvatar
                            key={assignment.id}
                            src={assignment.user.image}
                            name={assignment.user.name}
                            size="sm"
                          />
                        ))}
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Treasury Tab */}
          <TabsContent value="treasury" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Treasury</h2>
              <Dialog open={isAddingReward} onOpenChange={setIsAddingReward}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Reward
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Reward</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateReward} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Reward Title</Label>
                      <Input
                        id="title"
                        placeholder="Extra Screen Time"
                        value={rewardForm.title}
                        onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="30 extra minutes of screen time"
                        value={rewardForm.description}
                        onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pointsCost">Point Cost</Label>
                      <Input
                        id="pointsCost"
                        type="number"
                        min="1"
                        value={rewardForm.pointsCost}
                        onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingReward(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createRewardMutation.isPending}
                        className="bg-gradient-to-r from-accent to-primary text-white"
                      >
                        Add Reward
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards?.map((reward) => (
                <Card key={reward.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{reward.title}</h3>
                        <Badge className="bg-gradient-to-r from-accent to-primary text-white">
                          {reward.pointsCost} pts
                        </Badge>
                      </div>
                      {reward.description && (
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Redeemed {reward.redemptions.length} times
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Family Adventurers</h2>
              <Dialog open={isAddingChild} onOpenChange={setIsAddingChild}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Child
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Adventurer</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddChild} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Child's Name</Label>
                      <Input
                        id="name"
                        placeholder="Alex"
                        value={childForm.name}
                        onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Optional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="alex@family.com"
                        value={childForm.email}
                        onChange={(e) => setChildForm({ ...childForm, email: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        If provided, they can also login with Google
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingChild(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={addChildMutation.isPending}
                        className="bg-gradient-to-r from-primary to-accent text-white"
                      >
                        Add Adventurer
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {children?.map((child) => (
                <Card key={child.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <ProfileAvatar
                          src={child.image}
                          name={child.name}
                          size="lg"
                        />
                        <div>
                          <h3 className="font-semibold text-lg">{child.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-accent" />
                              <span>{child.points} points</span>
                            </span>
                            {child.email && (
                              <Badge variant="outline">Has Email</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {child.permalink && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyChildLink(child.permalink!)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Magic Link
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}