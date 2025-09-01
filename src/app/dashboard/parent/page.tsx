"use client";

import { useState, useEffect } from "react";
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
import { EditableProfile } from "~/components/editable-profile";
import { ImageUpload } from "~/components/image-upload";
import { useRealtimeUpdates, useRealtimePendingCompletions } from "~/hooks/use-realtime-updates";

export default function ParentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [isAddingParent, setIsAddingParent] = useState(false);
  const [isEditingQuest, setIsEditingQuest] = useState(false);
  const [editingQuest, setEditingQuest] = useState<any>(null);
  const [isEditingReward, setIsEditingReward] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);

  // Quest form state
  const [questForm, setQuestForm] = useState({
    title: "",
    points: 1,
    icon: "⭐",
    image: undefined as string | undefined,
    frequency: "daily" as "daily" | "weekly" | "monthly" | "once",
    weeklyDays: [] as number[],
    monthlyDate: 1,
    assignedUserIds: [] as string[],
  });

  // Child form state
  const [childForm, setChildForm] = useState({
    name: "",
    email: "",
  });

  // Parent form state
  const [parentForm, setParentForm] = useState({
    email: "",
  });

  // Reward form state
  const [rewardForm, setRewardForm] = useState({
    title: "",
    description: "",
    image: undefined as string | undefined,
    pointsCost: 10,
    assignedUserIds: [] as string[],
  });

  // Edit quest form state
  const [editQuestForm, setEditQuestForm] = useState({
    title: "",
    points: 1,
    icon: "⭐",
    image: undefined as string | undefined,
    frequency: "daily" as "daily" | "weekly" | "monthly" | "once",
    weeklyDays: [] as number[],
    monthlyDate: 1,
    assignedUserIds: [] as string[],
  });

  // Edit reward form state
  const [editRewardForm, setEditRewardForm] = useState({
    title: "",
    description: "",
    image: undefined as string | undefined,
    pointsCost: 10,
    assignedUserIds: [] as string[],
  });

  // Set up real-time updates
  useRealtimeUpdates();

  // API queries - must be called unconditionally
  const { data: family, refetch: refetchFamily, error: familyError } = api.family.getMyFamily.useQuery(
    undefined,
    { 
      retry: false, 
      enabled: !!session,
      refetchInterval: 10000, // Refetch family data every 10 seconds
      refetchOnWindowFocus: true,
    }
  );
  const { data: children, refetch: refetchChildren } = api.family.getChildren.useQuery(
    undefined,
    { 
      enabled: !!family, 
      retry: false,
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
    }
  );
  const { data: quests, refetch: refetchQuests } = api.quest.getAll.useQuery(
    undefined,
    { 
      enabled: !!family, 
      retry: false,
      refetchInterval: 3000, // More frequent for quest updates
      refetchOnWindowFocus: true,
    }
  );
  const { data: rewards } = api.reward.getAll.useQuery(
    undefined,
    { 
      enabled: !!family, 
      retry: false,
      refetchInterval: 10000,
      refetchOnWindowFocus: true,
    }
  );
  // Use the real-time pending completions hook
  const { data: pendingCompletions } = useRealtimePendingCompletions();
  const { data: pendingRedemptions } = api.reward.getPendingRedemptions.useQuery(
    undefined,
    { 
      enabled: !!family, 
      retry: false,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    }
  );

  // Redirect if no family
  useEffect(() => {
    if (familyError?.data?.code === "NOT_FOUND") {
      router.push("/onboarding");
    }
  }, [router, familyError?.data?.code]);

  const utils = api.useUtils();

  // Mutations
  const createQuestMutation = api.quest.create.useMutation({
    onSuccess: async (quest) => {
      // If there's an image to upload, upload it
      if (questForm.image) {
        try {
          await questImageUploadMutation.mutateAsync({
            questId: quest.id,
            filename: `quest-${quest.id}-${Date.now()}.jpg`,
            contentType: 'image/jpeg',
            file: questForm.image,
          });
        } catch (error) {
          console.error('Failed to upload quest image:', error);
        }
      }
      
      toast.success("🎯 Quest created successfully!");
      setIsAddingQuest(false);
      setQuestForm({ title: "", points: 1, icon: "⭐", image: undefined, frequency: "daily", weeklyDays: [], monthlyDate: 1, assignedUserIds: [] });
      // Immediate cache invalidation
      void utils.quest.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const questImageUploadMutation = api.quest.uploadImage.useMutation({
    onSuccess: () => {
      void utils.quest.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateQuestMutation = api.quest.update.useMutation({
    onSuccess: async () => {
      // If there's an image to upload for edit, upload it
      if (editQuestForm.image && editingQuest) {
        try {
          await questImageUploadMutation.mutateAsync({
            questId: editingQuest.id,
            filename: `quest-${editingQuest.id}-${Date.now()}.jpg`,
            contentType: 'image/jpeg',
            file: editQuestForm.image,
          });
        } catch (error) {
          console.error('Failed to upload quest image:', error);
        }
      }

      toast.success("✏️ Quest updated successfully!");
      setIsEditingQuest(false);
      setEditingQuest(null);
      setEditQuestForm({ title: "", points: 1, icon: "⭐", image: undefined, frequency: "daily", weeklyDays: [], monthlyDate: 1, assignedUserIds: [] });
      // Immediate cache invalidation
      void utils.quest.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const addChildMutation = api.family.addChild.useMutation({
    onSuccess: (data) => {
      toast.success("👶 Child added successfully!");
      setIsAddingChild(false);
      setChildForm({ name: "", email: "" });
      // Immediate cache invalidation
      void utils.family.getMyFamily.invalidate();
      void utils.family.getChildren.invalidate();
      
      // Show permalink
      if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(`${window.location.origin}/child/${data.permalink}`);
        toast.success("🔗 Child's magic link copied to clipboard!");
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const addParentMutation = api.family.addParent.useMutation({
    onSuccess: (data) => {
      toast.success("👨‍👩‍👧‍👦 Parent added successfully!");
      setIsAddingParent(false);
      setParentForm({ email: "" });
      // Immediate cache invalidation
      void utils.family.getMyFamily.invalidate();
      
      // Copy login URL to clipboard
      if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(data.loginUrl);
        if (data.isExistingUser) {
          toast.success("🔗 App link copied to clipboard! Send it to the parent so they can login.", {
            duration: 8000,
          });
        } else {
          toast.success("🔗 App link copied to clipboard! Send it to the new parent so they can sign up and login with their Gmail.", {
            duration: 8000,
          });
        }
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const createRewardMutation = api.reward.create.useMutation({
    onSuccess: async (reward) => {
      // If there's an image to upload, upload it
      if (rewardForm.image) {
        try {
          await rewardImageUploadMutation.mutateAsync({
            rewardId: reward.id,
            filename: `reward-${reward.id}-${Date.now()}.jpg`,
            contentType: 'image/jpeg',
            file: rewardForm.image,
          });
        } catch (error) {
          console.error('Failed to upload reward image:', error);
        }
      }

      toast.success("🏆 Reward added to treasury!");
      setIsAddingReward(false);
      setRewardForm({ title: "", description: "", image: undefined, pointsCost: 10, assignedUserIds: [] });
      // Immediate cache invalidation
      void utils.reward.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const rewardImageUploadMutation = api.reward.uploadImage.useMutation({
    onSuccess: () => {
      void utils.reward.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateRewardMutation = api.reward.update.useMutation({
    onSuccess: async () => {
      // If there's an image to upload for edit, upload it
      if (editRewardForm.image && editingReward) {
        try {
          await rewardImageUploadMutation.mutateAsync({
            rewardId: editingReward.id,
            filename: `reward-${editingReward.id}-${Date.now()}.jpg`,
            contentType: 'image/jpeg',
            file: editRewardForm.image,
          });
        } catch (error) {
          console.error('Failed to upload reward image:', error);
        }
      }

      toast.success("💰 Reward updated successfully!");
      setIsEditingReward(false);
      setEditingReward(null);
      setEditRewardForm({ title: "", description: "", image: undefined, pointsCost: 10, assignedUserIds: [] });
      // Immediate cache invalidation
      void utils.reward.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const approveQuestMutation = api.quest.approve.useMutation({
    onSuccess: () => {
      toast.success("✅ Quest approved! Child can now collect treasure!");
      // Immediate cache invalidation
      void utils.quest.getAll.invalidate();
      void utils.quest.getPendingCompletions.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const rejectQuestMutation = api.quest.reject.useMutation({
    onSuccess: () => {
      toast.success("❌ Quest rejected.");
      // Immediate cache invalidation
      void utils.quest.getAll.invalidate();
      void utils.quest.getPendingCompletions.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const fulfillRewardMutation = api.reward.fulfill.useMutation({
    onSuccess: () => {
      toast.success("🎁 Reward marked as fulfilled!");
      // Immediate cache invalidation
      void utils.reward.getPendingRedemptions.invalidate();
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

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    await addParentMutation.mutateAsync({ email: parentForm.email });
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRewardMutation.mutateAsync(rewardForm);
  };

  const handleEditQuest = (quest: any) => {
    setEditingQuest(quest);
    setEditQuestForm({
      title: quest.title,
      points: quest.points,
      icon: quest.icon || "⭐",
      image: undefined, // Reset image, will show current image in form
      frequency: quest.frequency,
      weeklyDays: quest.weeklyDays ? JSON.parse(quest.weeklyDays) : [],
      monthlyDate: quest.monthlyDate || 1,
      assignedUserIds: quest.assignments.map((a: any) => a.user.id),
    });
    setIsEditingQuest(true);
  };

  const handleUpdateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuest) return;
    await updateQuestMutation.mutateAsync({
      id: editingQuest.id,
      ...editQuestForm,
    });
  };

  const handleEditReward = (reward: any) => {
    setEditingReward(reward);
    setEditRewardForm({
      title: reward.title,
      description: reward.description || "",
      image: undefined, // Reset image, will show current image in form
      pointsCost: reward.pointsCost,
      assignedUserIds: reward.assignments.map((a: any) => a.user.id),
    });
    setIsEditingReward(true);
  };

  const handleUpdateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;
    await updateRewardMutation.mutateAsync({
      id: editingReward.id,
      ...editRewardForm,
    });
  };

  const copyChildLink = (permalink: string) => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/child/${permalink}`;
      navigator.clipboard.writeText(link);
      toast.success("🔗 Magic link copied to clipboard!");
    }
  };

  // Helper function to format frequency details
  const getFrequencyDetails = (quest: any) => {
    switch (quest.frequency) {
      case 'weekly':
        if (quest.weeklyDays) {
          const days = JSON.parse(quest.weeklyDays) as number[];
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const selectedDays = days.map(day => dayNames[day]);
          return selectedDays.join(", ");
        }
        return "Weekly";
      case 'monthly':
        if (quest.monthlyDate) {
          const day = quest.monthlyDate;
          const suffix = day === 1 || day === 21 || day === 31 ? "st" : 
                        day === 2 || day === 22 ? "nd" : 
                        day === 3 || day === 23 ? "rd" : "th";
          return `Every ${day}${suffix}`;
        }
        return "Monthly";
      case 'daily':
        return "Daily";
      case 'once':
        return "One-time";
      default:
        return quest.frequency;
    }
  };

  // Always render the same structure to avoid hydration mismatch
  const isLoading = status === "loading" || !session || !family;
  
  if (isLoading) {
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
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="once">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Weekly Days Selection */}
                    {questForm.frequency === "weekly" && (
                      <div className="space-y-2">
                        <Label>Days of Week</Label>
                        <div className="grid grid-cols-7 gap-2">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                            <Button
                              key={day}
                              type="button"
                              size="sm"
                              variant={questForm.weeklyDays.includes(index) ? "default" : "outline"}
                              onClick={() => {
                                const newDays = questForm.weeklyDays.includes(index)
                                  ? questForm.weeklyDays.filter(d => d !== index)
                                  : [...questForm.weeklyDays, index];
                                setQuestForm({ ...questForm, weeklyDays: newDays });
                              }}
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Monthly Date Selection */}
                    {questForm.frequency === "monthly" && (
                      <div className="space-y-2">
                        <Label htmlFor="monthlyDate">Day of Month</Label>
                        <Input
                          id="monthlyDate"
                          type="number"
                          min="1"
                          max="31"
                          value={questForm.monthlyDate}
                          onChange={(e) => setQuestForm({ ...questForm, monthlyDate: parseInt(e.target.value) })}
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="icon">Quest Icon</Label>
                        <Input
                          id="icon"
                          placeholder="⭐"
                          value={questForm.icon}
                          onChange={(e) => setQuestForm({ ...questForm, icon: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quest Image</Label>
                        <ImageUpload
                          currentImage={undefined}
                          onImageChange={(imageData) => setQuestForm({ ...questForm, image: imageData })}
                          placeholder="Add quest image"
                          className="h-20"
                        />
                      </div>
                    </div>
                    
                    {/* Child Assignment */}
                    <div className="space-y-2">
                      <Label>Assign to Children</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={questForm.assignedUserIds.length === 0 ? "default" : "outline"}
                            onClick={() => setQuestForm({ ...questForm, assignedUserIds: [] })}
                          >
                            All Children
                          </Button>
                          {children && children.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant={questForm.assignedUserIds.length === children.length && children.length > 0 ? "default" : "outline"}
                              onClick={() => setQuestForm({ ...questForm, assignedUserIds: children.map(child => child.id) })}
                            >
                              Select All
                            </Button>
                          )}
                        </div>
                        {children && children.length > 0 && (
                          <div className="grid grid-cols-1 gap-2">
                            {children.map((child) => (
                              <div key={child.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`assign-${child.id}`}
                                  checked={questForm.assignedUserIds.includes(child.id)}
                                  onChange={(e) => {
                                    const newAssignments = e.target.checked
                                      ? [...questForm.assignedUserIds, child.id]
                                      : questForm.assignedUserIds.filter(id => id !== child.id);
                                    setQuestForm({ ...questForm, assignedUserIds: newAssignments });
                                  }}
                                  className="rounded"
                                />
                                <label htmlFor={`assign-${child.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                                  <ProfileAvatar
                                    src={child.image}
                                    name={child.name}
                                    size="sm"
                                  />
                                  <span className="text-sm font-medium">{child.name}</span>
                                  <span className="text-xs text-muted-foreground">({child.points} pts)</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {questForm.assignedUserIds.length === 0 
                            ? "Available to all children in the family" 
                            : `Assigned to ${questForm.assignedUserIds.length} child${questForm.assignedUserIds.length > 1 ? 'ren' : ''}`}
                        </p>
                      </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {quests?.map((quest) => (
                <Card key={quest.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Quest Image */}
                      {quest.image && (
                        <div className="w-full h-24 rounded-md overflow-hidden">
                          <img
                            src={quest.image}
                            alt={quest.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="text-lg">{quest.icon || "⭐"}</div>
                          <h3 className="font-medium text-sm truncate flex-1">{quest.title}</h3>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditQuest(quest)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center space-x-1 text-muted-foreground">
                            <Star className="w-3 h-3" />
                            <span>{quest.points}pts</span>
                          </span>
                          <Badge variant="secondary" className="text-xs h-5">
                            {getFrequencyDetails(quest)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          {quest.assignments.map((assignment) => (
                            <ProfileAvatar
                              key={assignment.id}
                              src={assignment.user.image}
                              name={assignment.user.name}
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Edit Quest Dialog */}
            <Dialog open={isEditingQuest} onOpenChange={setIsEditingQuest}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Quest</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateQuest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editTitle">Quest Title</Label>
                    <Input
                      id="editTitle"
                      placeholder="Clean the Dragon's Lair (bedroom)"
                      value={editQuestForm.title}
                      onChange={(e) => setEditQuestForm({ ...editQuestForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editPoints">Reward Points</Label>
                      <Input
                        id="editPoints"
                        type="number"
                        min="1"
                        value={editQuestForm.points}
                        onChange={(e) => setEditQuestForm({ ...editQuestForm, points: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editFrequency">Frequency</Label>
                      <Select
                        value={editQuestForm.frequency}
                        onValueChange={(value) => setEditQuestForm({ ...editQuestForm, frequency: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="once">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Weekly Days Selection for Edit */}
                  {editQuestForm.frequency === "weekly" && (
                    <div className="space-y-2">
                      <Label>Days of Week</Label>
                      <div className="grid grid-cols-7 gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                          <Button
                            key={day}
                            type="button"
                            size="sm"
                            variant={editQuestForm.weeklyDays.includes(index) ? "default" : "outline"}
                            onClick={() => {
                              const newDays = editQuestForm.weeklyDays.includes(index)
                                ? editQuestForm.weeklyDays.filter(d => d !== index)
                                : [...editQuestForm.weeklyDays, index];
                              setEditQuestForm({ ...editQuestForm, weeklyDays: newDays });
                            }}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Monthly Date Selection for Edit */}
                  {editQuestForm.frequency === "monthly" && (
                    <div className="space-y-2">
                      <Label htmlFor="editMonthlyDate">Day of Month</Label>
                      <Input
                        id="editMonthlyDate"
                        type="number"
                        min="1"
                        max="31"
                        value={editQuestForm.monthlyDate}
                        onChange={(e) => setEditQuestForm({ ...editQuestForm, monthlyDate: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editIcon">Quest Icon</Label>
                      <Input
                        id="editIcon"
                        placeholder="⭐"
                        value={editQuestForm.icon}
                        onChange={(e) => setEditQuestForm({ ...editQuestForm, icon: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quest Image</Label>
                      <ImageUpload
                        currentImage={editingQuest?.image || null}
                        onImageChange={(imageData) => setEditQuestForm({ ...editQuestForm, image: imageData })}
                        placeholder="Update quest image"
                        className="h-20"
                      />
                    </div>
                  </div>
                  
                  {/* Child Assignment for Edit */}
                  <div className="space-y-2">
                    <Label>Assign to Children</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={editQuestForm.assignedUserIds.length === 0 ? "default" : "outline"}
                          onClick={() => setEditQuestForm({ ...editQuestForm, assignedUserIds: [] })}
                        >
                          All Children
                        </Button>
                        {children && children.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant={editQuestForm.assignedUserIds.length === children.length && children.length > 0 ? "default" : "outline"}
                            onClick={() => setEditQuestForm({ ...editQuestForm, assignedUserIds: children.map(child => child.id) })}
                          >
                            Select All
                          </Button>
                        )}
                      </div>
                      {children && children.length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          {children.map((child) => (
                            <div key={child.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`edit-assign-${child.id}`}
                                checked={editQuestForm.assignedUserIds.includes(child.id)}
                                onChange={(e) => {
                                  const newAssignments = e.target.checked
                                    ? [...editQuestForm.assignedUserIds, child.id]
                                    : editQuestForm.assignedUserIds.filter(id => id !== child.id);
                                  setEditQuestForm({ ...editQuestForm, assignedUserIds: newAssignments });
                                }}
                                className="rounded"
                              />
                              <label htmlFor={`edit-assign-${child.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                                <ProfileAvatar
                                  src={child.image}
                                  name={child.name}
                                  size="sm"
                                />
                                <span className="text-sm font-medium">{child.name}</span>
                                <span className="text-xs text-muted-foreground">({child.points} pts)</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {editQuestForm.assignedUserIds.length === 0 
                          ? "Available to all children in the family" 
                          : `Assigned to ${editQuestForm.assignedUserIds.length} child${editQuestForm.assignedUserIds.length > 1 ? 'ren' : ''}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingQuest(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateQuestMutation.isPending}
                      className="bg-gradient-to-r from-primary to-accent text-white"
                    >
                      {updateQuestMutation.isPending ? "Updating..." : "Update Quest"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
                      <Label>Reward Image</Label>
                      <ImageUpload
                        currentImage={undefined}
                        onImageChange={(imageData) => setRewardForm({ ...rewardForm, image: imageData })}
                        placeholder="Add reward image"
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
                    
                    {/* Reward Assignment */}
                    <div className="space-y-2">
                      <Label>Available to Children</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={rewardForm.assignedUserIds.length === 0 ? "default" : "outline"}
                            onClick={() => setRewardForm({ ...rewardForm, assignedUserIds: [] })}
                          >
                            All Children
                          </Button>
                          {children && children.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant={rewardForm.assignedUserIds.length === children.length && children.length > 0 ? "default" : "outline"}
                              onClick={() => setRewardForm({ ...rewardForm, assignedUserIds: children.map(child => child.id) })}
                            >
                              Select All
                            </Button>
                          )}
                        </div>
                        {children && children.length > 0 && (
                          <div className="grid grid-cols-1 gap-2">
                            {children.map((child) => (
                              <div key={child.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`reward-assign-${child.id}`}
                                  checked={rewardForm.assignedUserIds.includes(child.id)}
                                  onChange={(e) => {
                                    const newAssignments = e.target.checked
                                      ? [...rewardForm.assignedUserIds, child.id]
                                      : rewardForm.assignedUserIds.filter(id => id !== child.id);
                                    setRewardForm({ ...rewardForm, assignedUserIds: newAssignments });
                                  }}
                                  className="rounded"
                                />
                                <label htmlFor={`reward-assign-${child.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                                  <ProfileAvatar
                                    src={child.image}
                                    name={child.name}
                                    size="sm"
                                  />
                                  <span className="text-sm font-medium">{child.name}</span>
                                  <span className="text-xs text-muted-foreground">({child.points} pts)</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {rewardForm.assignedUserIds.length === 0 
                            ? "Available to all children in the family" 
                            : `Available to ${rewardForm.assignedUserIds.length} child${rewardForm.assignedUserIds.length > 1 ? 'ren' : ''}`}
                        </p>
                      </div>
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
                      {/* Reward Image */}
                      {reward.image && (
                        <div className="w-full h-32 rounded-md overflow-hidden">
                          <img
                            src={reward.image}
                            alt={reward.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{reward.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-gradient-to-r from-accent to-primary text-white">
                            {reward.pointsCost} pts
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditReward(reward)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {reward.description && (
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Redeemed {reward.redemptions.length} times
                        </span>
                        <div className="flex items-center space-x-1">
                          {reward.assignments.map((assignment: any) => (
                            <ProfileAvatar
                              key={assignment.id}
                              src={assignment.user.image}
                              name={assignment.user.name}
                              size="sm"
                            />
                          ))}
                          {reward.assignments.length === 0 && (
                            <span className="text-xs text-muted-foreground">All children</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Edit Reward Dialog */}
            <Dialog open={isEditingReward} onOpenChange={setIsEditingReward}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Reward</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateReward} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editRewardTitle">Reward Title</Label>
                    <Input
                      id="editRewardTitle"
                      placeholder="Extra Screen Time"
                      value={editRewardForm.title}
                      onChange={(e) => setEditRewardForm({ ...editRewardForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRewardDescription">Description</Label>
                    <Input
                      id="editRewardDescription"
                      placeholder="30 extra minutes of screen time"
                      value={editRewardForm.description}
                      onChange={(e) => setEditRewardForm({ ...editRewardForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reward Image</Label>
                    <ImageUpload
                      currentImage={editingReward?.image || undefined}
                      onImageChange={(imageData) => setEditRewardForm({ ...editRewardForm, image: imageData })}
                      placeholder="Update reward image"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRewardPointsCost">Point Cost</Label>
                    <Input
                      id="editRewardPointsCost"
                      type="number"
                      min="1"
                      value={editRewardForm.pointsCost}
                      onChange={(e) => setEditRewardForm({ ...editRewardForm, pointsCost: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  
                  {/* Reward Assignment for Edit */}
                  <div className="space-y-2">
                    <Label>Available to Children</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={editRewardForm.assignedUserIds.length === 0 ? "default" : "outline"}
                          onClick={() => setEditRewardForm({ ...editRewardForm, assignedUserIds: [] })}
                        >
                          All Children
                        </Button>
                        {children && children.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant={editRewardForm.assignedUserIds.length === children.length && children.length > 0 ? "default" : "outline"}
                            onClick={() => setEditRewardForm({ ...editRewardForm, assignedUserIds: children.map(child => child.id) })}
                          >
                            Select All
                          </Button>
                        )}
                      </div>
                      {children && children.length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          {children.map((child) => (
                            <div key={child.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`edit-reward-assign-${child.id}`}
                                checked={editRewardForm.assignedUserIds.includes(child.id)}
                                onChange={(e) => {
                                  const newAssignments = e.target.checked
                                    ? [...editRewardForm.assignedUserIds, child.id]
                                    : editRewardForm.assignedUserIds.filter(id => id !== child.id);
                                  setEditRewardForm({ ...editRewardForm, assignedUserIds: newAssignments });
                                }}
                                className="rounded"
                              />
                              <label htmlFor={`edit-reward-assign-${child.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                                <ProfileAvatar
                                  src={child.image}
                                  name={child.name}
                                  size="sm"
                                />
                                <span className="text-sm font-medium">{child.name}</span>
                                <span className="text-xs text-muted-foreground">({child.points} pts)</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {editRewardForm.assignedUserIds.length === 0 
                          ? "Available to all children in the family" 
                          : `Available to ${editRewardForm.assignedUserIds.length} child${editRewardForm.assignedUserIds.length > 1 ? 'ren' : ''}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingReward(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateRewardMutation.isPending}
                      className="bg-gradient-to-r from-accent to-primary text-white"
                    >
                      {updateRewardMutation.isPending ? "Updating..." : "Update Reward"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-6">
            {/* Header Section - Full Width */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Family Members</h2>
              <div className="flex space-x-2">
                <Dialog open={isAddingParent} onOpenChange={setIsAddingParent}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Parent
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Another Parent</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddParent} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="parentEmail">Parent's Gmail Address</Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          placeholder="parent@gmail.com"
                          value={parentForm.email}
                          onChange={(e) => setParentForm({ email: e.target.value })}
                          required
                        />
                        <p className="text-sm text-muted-foreground">
                          They'll be able to login with this Gmail account and manage quests together.
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          disabled={addParentMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                        >
                          {addParentMutation.isPending ? "Adding..." : "Add Parent"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsAddingParent(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                
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
            
            {/* Two Column Layout for Family Members */}
            <div className="grid grid-cols-2 gap-8">
              {/* Quest Masters Column */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">Quest Masters</h3>
                {family?.members && family.members.filter(member => member.role === "PARENT").length > 0 ? (
                  <div className="space-y-4">
                    {family.members
                      .filter(member => member.role === "PARENT")
                      .map((parent) => (
                      <Card key={parent.id} className="hover:shadow-lg transition-shadow border-primary/20">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <EditableProfile
                              user={{
                                id: parent.id,
                                name: parent.name,
                                image: parent.image,
                                role: parent.role as "PARENT" | "CHILD",
                              }}
                              canEdit={true} // Parents can always edit profiles
                              onUpdate={() => {
                                void utils.family.getMyFamily.invalidate();
                              }}
                            />
                            <div className="flex items-center space-x-2">
                              {parent.id === session?.user?.id && (
                                <Badge className="bg-primary text-white">You</Badge>
                              )}
                              {parent.email && (
                                <span className="text-xs text-muted-foreground">{parent.email}</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No additional Quest Masters yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Adventurers Column */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground">Adventurers</h3>
                {children && children.length > 0 ? (
                  <div className="space-y-4">
                    {children.map((child) => (
                    <Card key={child.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <EditableProfile
                            user={{
                              id: child.id,
                              name: child.name || "Unnamed Child",
                              image: child.image,
                              role: "CHILD",
                              points: child.points,
                            }}
                            canEdit={true} // Parents can edit children's profiles
                            onUpdate={() => {
                              void utils.family.getChildren.invalidate();
                              void utils.family.getMyFamily.invalidate();
                            }}
                          />
                          <div className="flex items-center space-x-2">
                            {child.email && (
                              <Badge variant="outline">Has Email</Badge>
                            )}
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
                ) : (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Swords className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No Adventurers yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Empty state */}
            {(!children || children.length === 0) && (!family?.members || family.members.filter(m => m.role === "PARENT").length <= 1) && (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Build Your Quest Team</h3>
                  <p className="text-muted-foreground mb-4">
                    Add parents to help manage quests and children for epic adventures!
                  </p>
                </CardContent>
              </Card>
            )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}