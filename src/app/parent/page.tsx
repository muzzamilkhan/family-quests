"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Checkbox } from "~/components/ui/checkbox";
import { ProtectedRoute } from "~/components/protected-route";
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
  Swords,
  Trophy,
  Download,
  FileText,
  Trash2
} from "lucide-react";
import { api } from "~/lib/trpc-provider";
import { toast } from "sonner";
import { ProfileAvatar } from "~/components/profile-avatar";
import { EditableProfile } from "~/components/editable-profile";
import { ImageUpload } from "~/components/image-upload";
import { useRealtimeUpdates, useRealtimePendingCompletions, useRealtimeLeaderboard } from "~/hooks/use-realtime-updates";

function ParentDashboardContent() {
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
  const [isQuestTemplateOpen, setIsQuestTemplateOpen] = useState(false);
  const [isRewardTemplateOpen, setIsRewardTemplateOpen] = useState(false);
  const [selectedQuestTemplates, setSelectedQuestTemplates] = useState<any[]>([]);
  const [selectedRewardTemplates, setSelectedRewardTemplates] = useState<any[]>([]);
  const [questToDelete, setQuestToDelete] = useState<any>(null);
  const [rewardToDelete, setRewardToDelete] = useState<any>(null);

  // Quest form state
  const [questForm, setQuestForm] = useState({
    title: "",
    points: 1,
    image: undefined as string | undefined,
    frequency: "daily" as "daily",
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
    image: undefined as string | undefined,
    frequency: "daily" as "daily",
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

  // Multi-select state for quest completions
  const [selectedCompletions, setSelectedCompletions] = useState<string[]>([]);

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
  const { data: questTemplates } = api.quest.getTemplates.useQuery(
    undefined,
    { retry: false }
  );
  const { data: rewardTemplates } = api.reward.getTemplates.useQuery(
    undefined,
    { retry: false }
  );
  // Use the real-time pending completions hook
  const { data: pendingCompletions } = useRealtimePendingCompletions();
  const { data: leaderboard } = useRealtimeLeaderboard();
  const { data: pendingRedemptions, refetch: refetchPendingRedemptions } = api.reward.getPendingRedemptions.useQuery(
    undefined,
    { 
      enabled: !!family, 
      retry: false,
      refetchInterval: 5000,
      refetchOnWindowFocus: true,
    }
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

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
      setQuestForm({ title: "", points: 1, image: undefined, frequency: "daily", assignedUserIds: [] });
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
      setEditQuestForm({ title: "", points: 1, image: undefined, frequency: "daily", assignedUserIds: [] });
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

  // Batch approval/rejection functions
  const batchApproveCompletions = async (completionIds: string[]) => {
    try {
      await Promise.all(
        completionIds.map(id => approveQuestMutation.mutateAsync({ completionId: id }))
      );
      toast.success(`✅ ${completionIds.length} quests approved!`);
      setSelectedCompletions([]);
    } catch (error) {
      toast.error("Some approvals failed. Please try again.");
    }
  };

  const batchRejectCompletions = async (completionIds: string[]) => {
    try {
      await Promise.all(
        completionIds.map(id => rejectQuestMutation.mutateAsync({ completionId: id }))
      );
      toast.success(`❌ ${completionIds.length} quests rejected.`);
      setSelectedCompletions([]);
    } catch (error) {
      toast.error("Some rejections failed. Please try again.");
    }
  };

  const fulfillRewardMutation = api.reward.fulfill.useMutation({
    onSuccess: () => {
      toast.success("🎁 Reward marked as fulfilled!");
      // Immediate cache invalidation and refetch for both parent and child views
      void utils.reward.getPendingRedemptions.invalidate();
      void utils.reward.getMyRedemptions.invalidate(); // This will update child's treasury
      void refetchPendingRedemptions(); // Immediate refetch for parent view
    },
    onError: (error) => toast.error(error.message),
  });

  const createBatchQuestsMutation = api.quest.createBatch.useMutation({
    onSuccess: (quests) => {
      toast.success(`🎯 ${quests.length} quests created from templates!`);
      setIsQuestTemplateOpen(false);
      setSelectedQuestTemplates([]);
      void utils.quest.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const createBatchRewardsMutation = api.reward.createBatch.useMutation({
    onSuccess: (rewards) => {
      toast.success(`🏆 ${rewards.length} rewards added from templates!`);
      setIsRewardTemplateOpen(false);
      setSelectedRewardTemplates([]);
      void utils.reward.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteQuestMutation = api.quest.delete.useMutation({
    onSuccess: () => {
      toast.success("🗑️ Quest deleted successfully!");
      setQuestToDelete(null);
      void utils.quest.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteRewardMutation = api.reward.delete.useMutation({
    onSuccess: () => {
      toast.success("🗑️ Reward deleted successfully!");
      setRewardToDelete(null);
      void utils.reward.getAll.invalidate();
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
      image: undefined, // Reset image, will show current image in form
      frequency: quest.frequency,
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

  const handleBatchCreateQuests = async () => {
    if (selectedQuestTemplates.length === 0) {
      toast.error("Please select at least one quest template");
      return;
    }
    
    await createBatchQuestsMutation.mutateAsync({
      templates: selectedQuestTemplates,
      assignedUserIds: [],
    });
  };

  const handleBatchCreateRewards = async () => {
    if (selectedRewardTemplates.length === 0) {
      toast.error("Please select at least one reward template");
      return;
    }
    
    await createBatchRewardsMutation.mutateAsync({
      templates: selectedRewardTemplates,
      assignedUserIds: [],
    });
  };

  const handleDeleteQuest = async () => {
    if (!questToDelete) return;
    await deleteQuestMutation.mutateAsync({ id: questToDelete.id });
  };

  const handleDeleteReward = async () => {
    if (!rewardToDelete) return;
    await deleteRewardMutation.mutateAsync({ id: rewardToDelete.id });
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
        <div className="flex h-12 items-center justify-between px-3">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Crown className="w-3 h-3 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">{family.name}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block leading-none">Quest Master Dashboard</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs px-2 h-7"
          >
            <span className="hidden sm:inline">Sign Out</span>
            <span className="sm:hidden">Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-2 space-y-3">
        <Tabs defaultValue="overview" className="space-y-3">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="overview" className="flex items-center space-x-1 text-xs px-1">
              <Sparkles className="w-3 h-3" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center space-x-1 text-xs px-1">
              <Swords className="w-3 h-3" />
              <span>Quests</span>
            </TabsTrigger>
            <TabsTrigger value="treasury" className="flex items-center space-x-1 text-xs px-1">
              <Gift className="w-3 h-3" />
              <span>Treasury</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center space-x-1 text-xs px-1">
              <Users className="w-3 h-3" />
              <span>Family</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3">
            {/* Family Champions */}
            {leaderboard && leaderboard.length > 1 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <Trophy className="w-3 h-3 text-white" />
                  </div>
                  <h2 className="text-lg font-bold">Family Champions</h2>
                </div>
                
                <Card>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {leaderboard.map((member, index) => (
                        <div 
                          key={member.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            member.id === session?.user?.id ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/30'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-xs">
                              {index + 1}
                            </div>
                            <ProfileAvatar
                              src={member.image || undefined}
                              name={member.name || "Adventurer"}
                              size="sm"
                            />
                            <span className={`font-medium text-sm ${
                              member.id === session?.user?.id ? 'text-primary' : ''
                            }`}>
                              {member.name}
                              {member.id === session?.user?.id && (
                                <span className="text-xs text-primary ml-1">(You!)</span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-accent" />
                            <span className="font-bold text-sm">{member.totalPoints}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pending Actions */}
            {(pendingCompletions && pendingCompletions.length > 0) && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-accent" />
                      <span>Quest Reviews Needed</span>
                      <Badge variant="secondary">{pendingCompletions.length}</Badge>
                    </CardTitle>
                    
                    {/* Batch Action Buttons - On new line for mobile */}
                    {selectedCompletions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {selectedCompletions.length} selected
                        </span>
                        <Button
                          size="sm"
                          onClick={() => batchApproveCompletions(selectedCompletions)}
                          disabled={approveQuestMutation.isPending || rejectQuestMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve All
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => batchRejectCompletions(selectedCompletions)}
                          disabled={approveQuestMutation.isPending || rejectQuestMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCompletions([])}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Select All Checkbox */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedCompletions.length === pendingCompletions.length && pendingCompletions.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCompletions(pendingCompletions.map(c => c.id));
                        } else {
                          setSelectedCompletions([]);
                        }
                      }}
                      className="border-2 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="select-all" className="text-sm text-muted-foreground">
                      Select all ({pendingCompletions.length})
                    </Label>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingCompletions.map((completion) => (
                      <div key={completion.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg space-y-2 sm:space-y-0 transition-colors ${
                        selectedCompletions.includes(completion.id) ? 'border-primary bg-primary/5' : 'border-border'
                      }`}>
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          {/* Selection Checkbox */}
                          <Checkbox
                            checked={selectedCompletions.includes(completion.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCompletions(prev => [...prev, completion.id]);
                              } else {
                                setSelectedCompletions(prev => prev.filter(id => id !== completion.id));
                              }
                            }}
                            className="border-2 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          
                          <ProfileAvatar
                            src={completion.user.image || undefined}
                            name={completion.user.name || undefined}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{completion.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              Completed: {completion.quest.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(completion.completedAt).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs px-2">
                            +{completion.quest.points} pts
                          </Badge>
                        </div>
                        
                        {/* Individual Action Buttons */}
                        <div className="flex items-center space-x-3 sm:flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => approveQuestMutation.mutate({ completionId: completion.id })}
                            disabled={approveQuestMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white px-3"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectQuestMutation.mutate({ completionId: completion.id })}
                            disabled={rejectQuestMutation.isPending}
                            className="border-red-200 text-red-600 hover:bg-red-50 px-3"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
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
                            src={redemption.user.image || undefined}
                            name={redemption.user.name || undefined}
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
          <TabsContent value="quests" className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <h2 className="text-lg font-bold">Quest Board</h2>
              <div className="flex space-x-2">
                <Dialog open={isQuestTemplateOpen} onOpenChange={setIsQuestTemplateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white text-xs h-8">
                      <FileText className="w-3 h-3 mr-1" />
                      Templates
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Quest Templates</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {questTemplates && questTemplates.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                            {questTemplates.map((template: any, index: number) => (
                              <div
                                key={index}
                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                  selectedQuestTemplates.includes(template)
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => {
                                  const isSelected = selectedQuestTemplates.includes(template);
                                  if (isSelected) {
                                    setSelectedQuestTemplates(prev => 
                                      prev.filter(t => t !== template)
                                    );
                                  } else {
                                    setSelectedQuestTemplates(prev => [...prev, template]);
                                  }
                                }}
                              >
                                {template.image && (
                                  <div className="w-full h-20 mb-2 rounded overflow-hidden">
                                    <img
                                      src={template.image}
                                      alt={template.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <h4 className="font-medium text-sm">{template.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {template.points} points • {template.frequency}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              {selectedQuestTemplates.length} selected
                            </p>
                            <div className="space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsQuestTemplateOpen(false)}
                                className="text-xs h-8"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleBatchCreateQuests}
                                disabled={createBatchQuestsMutation.isPending}
                                className="bg-gradient-to-r from-primary to-accent text-white text-xs h-8"
                              >
                                {createBatchQuestsMutation.isPending ? "Creating..." : "Create Selected"}
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-muted-foreground">No quest templates available</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddingQuest} onOpenChange={setIsAddingQuest}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-xs h-8">
                      <Plus className="w-3 h-3 mr-1" />
                      Create Quest
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto w-[calc(100vw-1rem)] sm:w-full mx-auto">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-base">Create New Quest</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateQuest} className="space-y-4 pb-6">
                    <div className="space-y-1">
                      <Label htmlFor="title" className="text-xs font-medium">Quest Title</Label>
                      <Input
                        id="title"
                        placeholder="Clean the Dragon's Lair (bedroom)"
                        value={questForm.title}
                        onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })}
                        required
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">Frequency</Label>
                      <p className="text-xs text-muted-foreground">Daily (all quests are daily)</p>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="pointsCost" className="text-xs font-medium">Point Cost</Label>
                      <Input
                        id="pointsCost"
                        type="number"
                        min="1"
                        value={questForm.points}
                        onChange={(e) => setQuestForm({ ...questForm, points: parseInt(e.target.value) || 1 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    
                    <div className="h-auto space-y-1">
                      <Label className="text-xs font-medium">Quest Image (Optional)</Label>
                      <ImageUpload
                        currentImage={undefined}
                        onImageChange={(imageData) => setQuestForm({ ...questForm, image: imageData })}
                        placeholder="Add image"
                        className="h-full"
                      />
                    </div>
                    
                    {/* Child Assignment */}
                    <div className="space-y-2 bg-secondary/20 border border-border rounded-md p-3">
                      <Label className="text-sm font-medium">Assign to Children</Label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={questForm.assignedUserIds.length === 0 ? "default" : "outline"}
                            onClick={() => setQuestForm({ ...questForm, assignedUserIds: [] })}
                            className="h-8 text-xs px-3"
                          >
                            All Children
                          </Button>
                          {children && children.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant={questForm.assignedUserIds.length === children.length && children.length > 0 ? "default" : "outline"}
                              onClick={() => setQuestForm({ ...questForm, assignedUserIds: children.map(child => child.id) })}
                              className="h-8 text-xs px-3"
                            >
                              Select All
                            </Button>
                          )}
                        </div>
                        {children && children.length > 0 && (
                          <div className="space-y-2 max-h-28 overflow-y-auto">
                            {children.map((child) => (
                              <div key={child.id} className="flex items-center space-x-3 py-2 bg-background rounded border px-3">
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
                                  className="rounded h-4 w-4"
                                />
                                <label htmlFor={`assign-${child.id}`} className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0">
                                  <ProfileAvatar
                                    src={child.image || undefined}
                                    name={child.name || undefined}
                                    size="sm"
                                  />
                                  <span className="text-sm font-medium truncate">{child.name}</span>
                                  <span className="text-xs text-muted-foreground flex-shrink-0">({child.points} pts)</span>
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
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingQuest(false)}
                        className="h-8 text-xs px-3 flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createQuestMutation.isPending}
                        className="bg-gradient-to-r from-primary to-accent text-white h-8 text-xs px-3 flex-1"
                      >
                        Create Quest
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {/* Quests Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {quests?.map((quest) => (
                <Card key={quest.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <div className="flex justify-between items-start mb-1">
                      <Badge className="bg-gradient-to-r from-accent to-primary text-white text-xs px-1 py-0">
                        {quest.points} pts
                      </Badge>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditQuest(quest)}
                          className="h-5 w-5 p-0"
                        >
                          <Edit className="w-2.5 h-2.5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setQuestToDelete(quest)}
                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {/* Quest Image */}
                      {quest.image && (
                        <div className="w-full aspect-square rounded-md overflow-hidden">
                          <img
                            src={quest.image}
                            alt={quest.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="min-h-[2.5rem] flex items-center">
                        <h3 className="font-medium text-xs leading-tight">{quest.title}</h3>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="secondary" className="text-xs h-4 px-1">
                          Daily
                        </Badge>
                        <div className="flex items-center space-x-0.5">
                          {quest.assignments.slice(0, 2).map((assignment) => (
                            <ProfileAvatar
                              key={assignment.id}
                              src={assignment.user.image}
                              name={assignment.user.name}
                              size="sm"
                            />
                          ))}
                          {quest.assignments.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{quest.assignments.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Delete Quest Confirmation Dialog */}
            <Dialog open={!!questToDelete} onOpenChange={(open) => !open && setQuestToDelete(null)}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">Delete Quest?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete "<strong>{questToDelete?.title}</strong>"? 
                  </p>
                  <p className="text-sm text-destructive">
                    This action cannot be undone. All quest completions and assignments will be permanently deleted.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setQuestToDelete(null)}
                      className="flex-1 h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteQuest}
                      disabled={deleteQuestMutation.isPending}
                      className="flex-1 h-8 text-xs"
                    >
                      {deleteQuestMutation.isPending ? "Deleting..." : "Delete Quest"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Quest Dialog */}
            <Dialog open={isEditingQuest} onOpenChange={setIsEditingQuest}>
              <DialogContent className="max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto pb-4 w-[calc(100vw-1rem)] sm:w-full mx-auto">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base">Edit Quest</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateQuest} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="editTitle" className="text-xs font-medium">Quest Title</Label>
                    <Input
                      id="editTitle"
                      placeholder="Clean the Dragon's Lair (bedroom)"
                      value={editQuestForm.title}
                      onChange={(e) => setEditQuestForm({ ...editQuestForm, title: e.target.value })}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">Frequency</Label>
                    <p className="text-xs text-muted-foreground">Daily (all quests are daily)</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Point Cost</Label>
                      <Input
                        type="number"
                        min="1"
                        value={editQuestForm.points}
                        onChange={(e) => setEditQuestForm({ ...editQuestForm, points: parseInt(e.target.value) || 1 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Quest Image (Optional)</Label>
                      <ImageUpload
                        currentImage={editingQuest?.image || undefined}
                        onImageChange={(imageData) => setEditQuestForm({ ...editQuestForm, image: imageData })}
                        placeholder="Update quest image"
                        className="h-full"
                      />
                    </div>
                  </div>
                  
                  {/* Child Assignment for Edit */}
                  <div className="space-y-2 border border-border rounded-md p-2">
                    <Label className="text-xs font-medium">Assign to Children</Label>
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
                        <div className="space-y-2 max-h-32 sm:max-h-24 overflow-y-auto">
                          {children.map((child) => (
                            <div key={child.id} className="flex items-center space-x-2 py-1">
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
                                className="rounded h-4 w-4 sm:h-3 sm:w-3"
                              />
                              <label htmlFor={`edit-assign-${child.id}`} className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0">
                                <ProfileAvatar
                                  src={child.image || undefined}
                                  name={child.name || undefined}
                                  size="sm"
                                />
                                <span className="text-sm sm:text-xs font-medium truncate">{child.name}</span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">({child.points} pts)</span>
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
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingQuest(false)}
                      className="h-8 text-xs px-3 flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateQuestMutation.isPending}
                      className="bg-gradient-to-r from-primary to-accent text-white h-8 text-xs px-3 flex-1"
                    >
                      {updateQuestMutation.isPending ? "Updating..." : "Update Quest"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Treasury Tab */}
          <TabsContent value="treasury" className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <h2 className="text-lg font-bold">Treasury</h2>
              <div className="flex space-x-2">
                <Dialog open={isRewardTemplateOpen} onOpenChange={setIsRewardTemplateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white text-xs h-8">
                      <FileText className="w-3 h-3 mr-1" />
                      Templates
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Reward Templates</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {rewardTemplates && rewardTemplates.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                            {rewardTemplates.map((template: any, index: number) => (
                              <div
                                key={index}
                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                  selectedRewardTemplates.includes(template)
                                    ? "border-accent bg-accent/10"
                                    : "border-border hover:border-accent/50"
                                }`}
                                onClick={() => {
                                  const isSelected = selectedRewardTemplates.includes(template);
                                  if (isSelected) {
                                    setSelectedRewardTemplates(prev => 
                                      prev.filter(t => t !== template)
                                    );
                                  } else {
                                    setSelectedRewardTemplates(prev => [...prev, template]);
                                  }
                                }}
                              >
                                {template.image && (
                                  <div className="w-full h-20 mb-2 rounded overflow-hidden">
                                    <img
                                      src={template.image}
                                      alt={template.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <h4 className="font-medium text-sm">{template.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {template.pointsCost} points
                                </p>
                                {template.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <p className="text-sm text-muted-foreground">
                              {selectedRewardTemplates.length} selected
                            </p>
                            <div className="space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsRewardTemplateOpen(false)}
                                className="text-xs h-8"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleBatchCreateRewards}
                                disabled={createBatchRewardsMutation.isPending}
                                className="bg-gradient-to-r from-accent to-primary text-white text-xs h-8"
                              >
                                {createBatchRewardsMutation.isPending ? "Creating..." : "Create Selected"}
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-muted-foreground">No reward templates available</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddingReward} onOpenChange={setIsAddingReward}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white text-xs h-8">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Reward
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto w-[calc(100vw-1rem)] sm:w-full mx-auto">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-base">Add New Reward</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateReward} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="title" className="text-xs font-medium">Reward Title</Label>
                      <Input
                        id="title"
                        placeholder="Extra Screen Time"
                        value={rewardForm.title}
                        onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
                        required
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="description" className="text-xs font-medium">Description</Label>
                      <Input
                        id="description"
                        placeholder="30 extra minutes of screen time"
                        value={rewardForm.description}
                        onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="pointsCost" className="text-xs font-medium">Point Cost</Label>
                        <Input
                          id="pointsCost"
                          type="number"
                          min="1"
                          value={rewardForm.pointsCost}
                          onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: parseInt(e.target.value) || 1 })}
                          required
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Reward Image (Optional)</Label>
                        <ImageUpload
                          currentImage={undefined}
                          onImageChange={(imageData) => setRewardForm({ ...rewardForm, image: imageData })}
                          placeholder="Add reward image"
                          className="h-full"
                        />
                      </div>
                    </div>
                    
                    {/* Reward Assignment */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Available to Children</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={rewardForm.assignedUserIds.length === 0 ? "default" : "outline"}
                            onClick={() => setRewardForm({ ...rewardForm, assignedUserIds: [] })}
                            className="h-7 text-xs px-2"
                          >
                            All Children
                          </Button>
                          {children && children.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant={rewardForm.assignedUserIds.length === children.length && children.length > 0 ? "default" : "outline"}
                              onClick={() => setRewardForm({ ...rewardForm, assignedUserIds: children.map(child => child.id) })}
                              className="h-7 text-xs px-2"
                            >
                              Select All
                            </Button>
                          )}
                        </div>
                        {children && children.length > 0 && (
                          <div className="space-y-2 max-h-32 sm:max-h-24 overflow-y-auto border rounded-md p-2">
                            {children.map((child) => (
                              <div key={child.id} className="flex items-center space-x-2 py-1">
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
                                  className="rounded h-4 w-4 sm:h-3 sm:w-3"
                                />
                                <label htmlFor={`reward-assign-${child.id}`} className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0">
                                  <ProfileAvatar
                                    src={child.image || undefined}
                                    name={child.name || undefined}
                                    size="sm"
                                  />
                                  <span className="text-sm sm:text-xs font-medium truncate">{child.name}</span>
                                  <span className="text-xs text-muted-foreground flex-shrink-0">({child.points} pts)</span>
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
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingReward(false)}
                        className="h-8 text-xs px-3 flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createRewardMutation.isPending}
                        className="bg-gradient-to-r from-accent to-primary text-white h-8 text-xs px-3 flex-1"
                      >
                        Add Reward
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {rewards?.map((reward) => (
                <Card key={reward.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <div className="flex justify-between items-start mb-1">
                      <Badge className="bg-gradient-to-r from-accent to-primary text-white text-xs px-1 py-0">
                        {reward.pointsCost} pts
                      </Badge>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditReward(reward)}
                          className="h-5 w-5 p-0"
                        >
                          <Edit className="w-2.5 h-2.5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setRewardToDelete(reward)}
                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {reward.title && (
                      <h3 className="font-medium text-xs mb-1 leading-tight">{reward.title}</h3>
                    )}
                    
                    <div className="space-y-1">
                      {/* Reward Image */}
                      {reward.image && (
                        <div className="w-full aspect-square rounded-md overflow-hidden">
                          <img
                            src={reward.image}
                            alt={reward.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {reward.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{reward.description}</p>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Redeemed {reward.redemptions.length} times
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-0.5">
                          {reward.assignments.slice(0, 2).map((assignment: any) => (
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
                          {reward.assignments.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{reward.assignments.length - 2}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Delete Reward Confirmation Dialog */}
            <Dialog open={!!rewardToDelete} onOpenChange={(open) => !open && setRewardToDelete(null)}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">Delete Reward?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete "<strong>{rewardToDelete?.title}</strong>"?
                  </p>
                  <p className="text-sm text-destructive">
                    This action cannot be undone. All reward redemptions and assignments will be permanently deleted.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRewardToDelete(null)}
                      className="flex-1 h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteReward}
                      disabled={deleteRewardMutation.isPending}
                      className="flex-1 h-8 text-xs"
                    >
                      {deleteRewardMutation.isPending ? "Deleting..." : "Delete Reward"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Reward Dialog */}
            <Dialog open={isEditingReward} onOpenChange={setIsEditingReward}>
              <DialogContent className="max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto pb-4 w-[calc(100vw-1rem)] sm:w-full mx-auto">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base">Edit Reward</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateReward} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="editRewardTitle" className="text-xs font-medium">Reward Title</Label>
                    <Input
                      id="editRewardTitle"
                      placeholder="Extra Screen Time"
                      value={editRewardForm.title}
                      onChange={(e) => setEditRewardForm({ ...editRewardForm, title: e.target.value })}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="editRewardDescription" className="text-xs font-medium">Description</Label>
                    <Input
                      id="editRewardDescription"
                      placeholder="30 extra minutes of screen time"
                      value={editRewardForm.description}
                      onChange={(e) => setEditRewardForm({ ...editRewardForm, description: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="editRewardPointsCost" className="text-xs font-medium">Point Cost</Label>
                      <Input
                        id="editRewardPointsCost"
                        type="number"
                        min="1"
                        value={editRewardForm.pointsCost}
                        onChange={(e) => setEditRewardForm({ ...editRewardForm, pointsCost: parseInt(e.target.value) || 1 })}
                        required
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Reward Image (Optional)</Label>
                      <ImageUpload
                        currentImage={editingReward?.image || undefined}
                        onImageChange={(imageData) => setEditRewardForm({ ...editRewardForm, image: imageData })}
                        placeholder="Update reward image"
                        className="h-full"
                      />
                    </div>
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
                        <div className="space-y-2 max-h-32 sm:max-h-24 overflow-y-auto border rounded-md p-2">
                          {children.map((child) => (
                            <div key={child.id} className="flex items-center space-x-2 py-1">
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
                                className="rounded h-4 w-4 sm:h-3 sm:w-3"
                              />
                              <label htmlFor={`edit-reward-assign-${child.id}`} className="flex items-center space-x-2 cursor-pointer flex-1 min-w-0">
                                <ProfileAvatar
                                  src={child.image || undefined}
                                  name={child.name || undefined}
                                  size="sm"
                                />
                                <span className="text-sm sm:text-xs font-medium truncate">{child.name}</span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">({child.points} pts)</span>
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
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingReward(false)}
                      className="h-8 text-xs px-3 flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateRewardMutation.isPending}
                      className="bg-gradient-to-r from-accent to-primary text-white h-8 text-xs px-3 flex-1"
                    >
                      {updateRewardMutation.isPending ? "Updating..." : "Update Reward"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-3">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <h2 className="text-lg font-bold">Family Members</h2>
              <div className="flex flex-col xs:flex-row space-y-1 xs:space-y-0 xs:space-x-2 w-full sm:w-auto">
                <Dialog open={isAddingParent} onOpenChange={setIsAddingParent}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white text-xs h-8 w-full xs:w-auto">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Parent
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader className="pb-2">
                      <DialogTitle className="text-base">Add Another Parent</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddParent} className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="parentEmail" className="text-xs font-medium">Parent's Gmail Address</Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          placeholder="parent@gmail.com"
                          value={parentForm.email}
                          onChange={(e) => setParentForm({ email: e.target.value })}
                          required
                          className="h-8 text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          They'll be able to login with this Gmail account and manage quests together.
                        </p>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          type="submit" 
                          disabled={addParentMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white h-8 text-xs"
                        >
                          {addParentMutation.isPending ? "Adding..." : "Add Parent"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsAddingParent(false)} className="h-8 text-xs px-3">
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isAddingChild} onOpenChange={setIsAddingChild}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-xs h-8 w-full xs:w-auto">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Child
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader className="pb-2">
                      <DialogTitle className="text-base">Add New Adventurer</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddChild} className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="name" className="text-xs font-medium">Child's Name</Label>
                        <Input
                          id="name"
                          placeholder="Alex"
                          value={childForm.name}
                          onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                          required
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-xs font-medium">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="alex@family.com"
                          value={childForm.email}
                          onChange={(e) => setChildForm({ ...childForm, email: e.target.value })}
                          className="h-8 text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          If provided, they can also login with Google
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddingChild(false)}
                          className="flex-1 h-8 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={addChildMutation.isPending}
                          className="bg-gradient-to-r from-primary to-accent text-white flex-1 h-8 text-xs"
                        >
                          Add Adventurer
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Quest Masters Column */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Quest Masters</h3>
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
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Adventurers</h3>
                {children && children.length > 0 ? (
                  <div className="space-y-4">
                    {children.map((child) => (
                    <Card key={child.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                          <div className="flex-1 min-w-0">
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
                          </div>
                          <div className="flex flex-col xs:flex-row items-start xs:items-center space-y-1 xs:space-y-0 xs:space-x-2 sm:flex-shrink-0">
                            {child.email && (
                              <Badge variant="outline" className="text-xs px-1">Has Email</Badge>
                            )}
                            {child.permalink && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyChildLink(child.permalink!)}
                                className="text-xs h-7 w-full xs:w-auto px-2"
                              >
                                <Copy className="w-3 h-3 mr-1" />
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

export default function ParentDashboard() {
  return (
    <ProtectedRoute requiredRole="PARENT">
      <ParentDashboardContent />
    </ProtectedRoute>
  );
}