"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Crown, Swords, Gift, FileText, Plus, Edit, Trash2, CheckCircle, X } from "lucide-react";
import { api } from "~/lib/trpc-provider";
import { toast } from "sonner";
import { ImageUpload } from "~/components/image-upload";

function AdminDashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("quests");
  const [isAddingQuestTemplate, setIsAddingQuestTemplate] = useState(false);
  const [isAddingRewardTemplate, setIsAddingRewardTemplate] = useState(false);
  const [isEditingQuestTemplate, setIsEditingQuestTemplate] = useState(false);
  const [editingQuestTemplate, setEditingQuestTemplate] = useState<any>(null);
  const [isEditingRewardTemplate, setIsEditingRewardTemplate] = useState(false);
  const [editingRewardTemplate, setEditingRewardTemplate] = useState<any>(null);
  const [questTemplateToDelete, setQuestTemplateToDelete] = useState<any>(null);
  const [rewardTemplateToDelete, setRewardTemplateToDelete] = useState<any>(null);
  const [requestFilter, setRequestFilter] = useState("PENDING");

  // Check if user is admin
  const { data: user } = api.user.getProfile.useQuery(undefined, {
    enabled: !!session,
  });

  // API queries
  const { data: questTemplates, refetch: refetchQuestTemplates } = api.questTemplate.getAll.useQuery(
    undefined,
    { enabled: !!user?.isAdmin }
  );
  const { data: rewardTemplates, refetch: refetchRewardTemplates } = api.rewardTemplate.getAll.useQuery(
    undefined,
    { enabled: !!user?.isAdmin }
  );
  const { data: templateRequests, refetch: refetchTemplateRequests } = api.templateRequest.getAll.useQuery(
    undefined,
    { enabled: !!user?.isAdmin }
  );

  const utils = api.useUtils();

  // Mutations
  const createQuestTemplateMutation = api.questTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("🎯 Quest template created successfully!");
      setIsAddingQuestTemplate(false);
      setQuestTemplateForm({ title: "", points: 1, image: undefined, frequency: "daily", live: false });
      void utils.questTemplate.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateQuestTemplateMutation = api.questTemplate.update.useMutation({
    onSuccess: () => {
      toast.success("✏️ Quest template updated successfully!");
      setIsEditingQuestTemplate(false);
      setEditingQuestTemplate(null);
      setEditQuestTemplateForm({ title: "", points: 1, image: undefined, frequency: "daily", live: false });
      void utils.questTemplate.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteQuestTemplateMutation = api.questTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success("🗑️ Quest template deleted successfully!");
      setQuestTemplateToDelete(null);
      void utils.questTemplate.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const createRewardTemplateMutation = api.rewardTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("🏆 Reward template created successfully!");
      setIsAddingRewardTemplate(false);
      setRewardTemplateForm({ title: "", description: "", image: undefined, pointsCost: 10, live: false });
      void utils.rewardTemplate.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateRewardTemplateMutation = api.rewardTemplate.update.useMutation({
    onSuccess: () => {
      toast.success("💰 Reward template updated successfully!");
      setIsEditingRewardTemplate(false);
      setEditingRewardTemplate(null);
      setEditRewardTemplateForm({ title: "", description: "", image: undefined, pointsCost: 10, live: false });
      void utils.rewardTemplate.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteRewardTemplateMutation = api.rewardTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success("🗑️ Reward template deleted successfully!");
      setRewardTemplateToDelete(null);
      void utils.rewardTemplate.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateTemplateRequestStatusMutation = api.templateRequest.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("📝 Request status updated!");
      void utils.templateRequest.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  // Event handlers
  const handleCreateQuestTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createQuestTemplateMutation.mutateAsync(questTemplateForm);
  };

  const handleCreateRewardTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRewardTemplateMutation.mutateAsync(rewardTemplateForm);
  };

  const handleEditQuestTemplate = (template: any) => {
    setEditingQuestTemplate(template);
    setEditQuestTemplateForm({
      title: template.title,
      points: template.points,
      image: undefined,
      frequency: template.frequency,
      live: template.live,
    });
    setIsEditingQuestTemplate(true);
  };

  const handleUpdateQuestTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestTemplate) return;
    await updateQuestTemplateMutation.mutateAsync({
      id: editingQuestTemplate.id,
      ...editQuestTemplateForm,
    });
  };

  const handleEditRewardTemplate = (template: any) => {
    setEditingRewardTemplate(template);
    setEditRewardTemplateForm({
      title: template.title,
      description: template.description || "",
      image: undefined,
      pointsCost: template.pointsCost,
      live: template.live,
    });
    setIsEditingRewardTemplate(true);
  };

  const handleUpdateRewardTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRewardTemplate) return;
    await updateRewardTemplateMutation.mutateAsync({
      id: editingRewardTemplate.id,
      ...editRewardTemplateForm,
    });
  };

  const handleDeleteQuestTemplate = async () => {
    if (!questTemplateToDelete) return;
    await deleteQuestTemplateMutation.mutateAsync({ id: questTemplateToDelete.id });
  };

  const handleDeleteRewardTemplate = async () => {
    if (!rewardTemplateToDelete) return;
    await deleteRewardTemplateMutation.mutateAsync({ id: rewardTemplateToDelete.id });
  };

  const handleUpdateRequestStatus = async (id: string, status: "PENDING" | "DONE" | "IGNORED") => {
    await updateTemplateRequestStatusMutation.mutateAsync({ id, status });
  };

  const handleToggleQuestTemplateLive = async (template: any) => {
    await updateQuestTemplateMutation.mutateAsync({
      id: template.id,
      live: !template.live,
    });
  };

  const handleToggleRewardTemplateLive = async (template: any) => {
    await updateRewardTemplateMutation.mutateAsync({
      id: template.id,
      live: !template.live,
    });
  };

  const filteredRequests = templateRequests?.filter(request =>
    requestFilter === "ALL" || request.status === requestFilter
  ) || [];

  // Quest template form state
  const [questTemplateForm, setQuestTemplateForm] = useState({
    title: "",
    points: 1,
    image: undefined as string | undefined,
    frequency: "daily" as "daily",
    live: false,
  });

  // Reward template form state
  const [rewardTemplateForm, setRewardTemplateForm] = useState({
    title: "",
    description: "",
    image: undefined as string | undefined,
    pointsCost: 10,
    live: false,
  });

  // Edit quest template form state
  const [editQuestTemplateForm, setEditQuestTemplateForm] = useState({
    title: "",
    points: 1,
    image: undefined as string | undefined,
    frequency: "daily" as "daily",
    live: false,
  });

  // Edit reward template form state
  const [editRewardTemplateForm, setEditRewardTemplateForm] = useState({
    title: "",
    description: "",
    image: undefined as string | undefined,
    pointsCost: 10,
    live: false,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      router.push("/parent");
    }
  }, [user, router]);

  // Always render the same structure to avoid hydration mismatch
  const isLoading = status === "loading" || !session || !user;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Crown className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading admin dashboard...</span>
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
              <h1 className="text-base font-bold text-foreground truncate">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground hidden sm:block leading-none">Manage Templates & Requests</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push("/parent")}
              className="text-xs px-2 h-7"
            >
              Parent
            </Button>
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
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-2 space-y-3">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-3">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="quests" className="flex items-center space-x-1 text-xs px-1">
              <Swords className="w-3 h-3" />
              <span>Quest Templates</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center space-x-1 text-xs px-1">
              <Gift className="w-3 h-3" />
              <span>Reward Templates</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center space-x-1 text-xs px-1">
              <FileText className="w-3 h-3" />
              <span>Requests</span>
            </TabsTrigger>
          </TabsList>

          {/* Quest Templates Tab */}
          <TabsContent value="quests" className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <h2 className="text-lg font-bold">Quest Templates</h2>
              <Dialog open={isAddingQuestTemplate} onOpenChange={setIsAddingQuestTemplate}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white text-xs h-8">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto w-[calc(100vw-1rem)] sm:w-full mx-auto">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-base">Create Quest Template</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateQuestTemplate} className="space-y-4 pb-6">
                    <div className="space-y-1">
                      <Label htmlFor="questTitle" className="text-xs font-medium">Quest Title</Label>
                      <Input
                        id="questTitle"
                        placeholder="Clean the Dragon's Lair (bedroom)"
                        value={questTemplateForm.title}
                        onChange={(e) => setQuestTemplateForm({ ...questTemplateForm, title: e.target.value })}
                        required
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="questPoints" className="text-xs font-medium">Point Cost</Label>
                      <Input
                        id="questPoints"
                        type="number"
                        min="1"
                        value={questTemplateForm.points}
                        onChange={(e) => setQuestTemplateForm({ ...questTemplateForm, points: parseInt(e.target.value) || 1 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Quest Image (Optional)</Label>
                      <ImageUpload
                        currentImage={undefined}
                        onImageChange={(imageData) => setQuestTemplateForm({ ...questTemplateForm, image: imageData })}
                        placeholder="Add image"
                        className="h-full"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingQuestTemplate(false)}
                        className="h-8 text-xs px-3 flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createQuestTemplateMutation.isPending}
                        className="bg-gradient-to-r from-primary to-accent text-white h-8 text-xs px-3 flex-1"
                      >
                        Create Template
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Quest Templates Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {questTemplates?.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <div className="flex justify-between items-start mb-1">
                      <Badge className="bg-gradient-to-r from-accent to-primary text-white text-xs px-1 py-0">
                        {template.points} pts
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditQuestTemplate(template)}
                          className="h-5 w-5 p-0"
                        >
                          <Edit className="w-2.5 h-2.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setQuestTemplateToDelete(template)}
                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {template.image && (
                        <div className="w-full aspect-square rounded-md overflow-hidden">
                          <img
                            src={template.image}
                            alt={template.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-h-[2.5rem] flex items-center">
                        <h3 className="font-medium text-xs leading-tight">{template.title}</h3>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge
                          variant="secondary"
                          className={`text-xs h-4 px-1 cursor-pointer hover:opacity-80 transition-opacity ${
                            template.live ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                          onClick={() => handleToggleQuestTemplateLive(template)}
                        >
                          {template.live ? "Live" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Delete Quest Template Confirmation Dialog */}
            <Dialog open={!!questTemplateToDelete} onOpenChange={(open) => !open && setQuestTemplateToDelete(null)}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">Delete Quest Template?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete "<strong>{questTemplateToDelete?.title}</strong>"?
                  </p>
                  <p className="text-sm text-destructive">
                    This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setQuestTemplateToDelete(null)}
                      className="flex-1 h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteQuestTemplate}
                      disabled={deleteQuestTemplateMutation.isPending}
                      className="flex-1 h-8 text-xs"
                    >
                      {deleteQuestTemplateMutation.isPending ? "Deleting..." : "Delete Template"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Quest Template Dialog */}
            <Dialog open={isEditingQuestTemplate} onOpenChange={setIsEditingQuestTemplate}>
              <DialogContent className="max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto pb-4 w-[calc(100vw-1rem)] sm:w-full mx-auto">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base">Edit Quest Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateQuestTemplate} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="editQuestTitle" className="text-xs font-medium">Quest Title</Label>
                    <Input
                      id="editQuestTitle"
                      placeholder="Clean the Dragon's Lair (bedroom)"
                      value={editQuestTemplateForm.title}
                      onChange={(e) => setEditQuestTemplateForm({ ...editQuestTemplateForm, title: e.target.value })}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="editQuestPoints" className="text-xs font-medium">Point Cost</Label>
                    <Input
                      id="editQuestPoints"
                      type="number"
                      min="1"
                      value={editQuestTemplateForm.points}
                      onChange={(e) => setEditQuestTemplateForm({ ...editQuestTemplateForm, points: parseInt(e.target.value) || 1 })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Quest Image (Optional)</Label>
                    <ImageUpload
                      currentImage={editingQuestTemplate?.image || undefined}
                      onImageChange={(imageData) => setEditQuestTemplateForm({ ...editQuestTemplateForm, image: imageData })}
                      placeholder="Update quest image"
                      className="h-full"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingQuestTemplate(false)}
                      className="h-8 text-xs px-3 flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateQuestTemplateMutation.isPending}
                      className="bg-gradient-to-r from-primary to-accent text-white h-8 text-xs px-3 flex-1"
                    >
                      {updateQuestTemplateMutation.isPending ? "Updating..." : "Update Template"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Reward Templates Tab */}
          <TabsContent value="rewards" className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <h2 className="text-lg font-bold">Reward Templates</h2>
              <Dialog open={isAddingRewardTemplate} onOpenChange={setIsAddingRewardTemplate}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white text-xs h-8">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto w-[calc(100vw-1rem)] sm:w-full mx-auto">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-base">Create Reward Template</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateRewardTemplate} className="space-y-4 pb-6">
                    <div className="space-y-1">
                      <Label htmlFor="rewardTitle" className="text-xs font-medium">Reward Title</Label>
                      <Input
                        id="rewardTitle"
                        placeholder="Extra Screen Time"
                        value={rewardTemplateForm.title}
                        onChange={(e) => setRewardTemplateForm({ ...rewardTemplateForm, title: e.target.value })}
                        required
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rewardDescription" className="text-xs font-medium">Description</Label>
                      <Input
                        id="rewardDescription"
                        placeholder="30 extra minutes of screen time"
                        value={rewardTemplateForm.description}
                        onChange={(e) => setRewardTemplateForm({ ...rewardTemplateForm, description: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rewardPointsCost" className="text-xs font-medium">Point Cost</Label>
                      <Input
                        id="rewardPointsCost"
                        type="number"
                        min="1"
                        value={rewardTemplateForm.pointsCost}
                        onChange={(e) => setRewardTemplateForm({ ...rewardTemplateForm, pointsCost: parseInt(e.target.value) || 1 })}
                        required
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Reward Image (Optional)</Label>
                      <ImageUpload
                        currentImage={undefined}
                        onImageChange={(imageData) => setRewardTemplateForm({ ...rewardTemplateForm, image: imageData })}
                        placeholder="Add reward image"
                        className="h-full"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingRewardTemplate(false)}
                        className="h-8 text-xs px-3 flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createRewardTemplateMutation.isPending}
                        className="bg-gradient-to-r from-accent to-primary text-white h-8 text-xs px-3 flex-1"
                      >
                        Create Template
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {rewardTemplates?.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <div className="flex justify-between items-start mb-1">
                      <Badge className="bg-gradient-to-r from-accent to-primary text-white text-xs px-1 py-0">
                        {template.pointsCost} pts
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditRewardTemplate(template)}
                          className="h-5 w-5 p-0"
                        >
                          <Edit className="w-2.5 h-2.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRewardTemplateToDelete(template)}
                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {template.image && (
                        <div className="w-full aspect-square rounded-md overflow-hidden">
                          <img
                            src={template.image}
                            alt={template.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-h-[2.5rem] flex items-center">
                        <h3 className="font-medium text-xs mb-1 leading-tight">{template.title}</h3>
                      </div>
                      {template.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={`text-xs h-4 px-1 cursor-pointer hover:opacity-80 transition-opacity ${
                            template.live ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                          onClick={() => handleToggleRewardTemplateLive(template)}
                        >
                          {template.live ? "Live" : "Draft"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Delete Reward Template Confirmation Dialog */}
            <Dialog open={!!rewardTemplateToDelete} onOpenChange={(open) => !open && setRewardTemplateToDelete(null)}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">Delete Reward Template?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete "<strong>{rewardTemplateToDelete?.title}</strong>"?
                  </p>
                  <p className="text-sm text-destructive">
                    This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRewardTemplateToDelete(null)}
                      className="flex-1 h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteRewardTemplate}
                      disabled={deleteRewardTemplateMutation.isPending}
                      className="flex-1 h-8 text-xs"
                    >
                      {deleteRewardTemplateMutation.isPending ? "Deleting..." : "Delete Template"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Reward Template Dialog */}
            <Dialog open={isEditingRewardTemplate} onOpenChange={setIsEditingRewardTemplate}>
              <DialogContent className="max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto pb-4 w-[calc(100vw-1rem)] sm:w-full mx-auto">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base">Edit Reward Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateRewardTemplate} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="editRewardTitle" className="text-xs font-medium">Reward Title</Label>
                    <Input
                      id="editRewardTitle"
                      placeholder="Extra Screen Time"
                      value={editRewardTemplateForm.title}
                      onChange={(e) => setEditRewardTemplateForm({ ...editRewardTemplateForm, title: e.target.value })}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="editRewardDescription" className="text-xs font-medium">Description</Label>
                    <Input
                      id="editRewardDescription"
                      placeholder="30 extra minutes of screen time"
                      value={editRewardTemplateForm.description}
                      onChange={(e) => setEditRewardTemplateForm({ ...editRewardTemplateForm, description: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="editRewardPointsCost" className="text-xs font-medium">Point Cost</Label>
                    <Input
                      id="editRewardPointsCost"
                      type="number"
                      min="1"
                      value={editRewardTemplateForm.pointsCost}
                      onChange={(e) => setEditRewardTemplateForm({ ...editRewardTemplateForm, pointsCost: parseInt(e.target.value) || 1 })}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Reward Image (Optional)</Label>
                    <ImageUpload
                      currentImage={editingRewardTemplate?.image || undefined}
                      onImageChange={(imageData) => setEditRewardTemplateForm({ ...editRewardTemplateForm, image: imageData })}
                      placeholder="Update reward image"
                      className="h-full"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingRewardTemplate(false)}
                      className="h-8 text-xs px-3 flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateRewardTemplateMutation.isPending}
                      className="bg-gradient-to-r from-accent to-primary text-white h-8 text-xs px-3 flex-1"
                    >
                      {updateRewardTemplateMutation.isPending ? "Updating..." : "Update Template"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <h2 className="text-lg font-bold">Template Requests</h2>
              <Select value={requestFilter} onValueChange={setRequestFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="IGNORED">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Request</TableHead>
                      <TableHead className="text-xs">Family</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="text-xs font-medium">
                          <Badge variant={request.type === "QUEST" ? "default" : "secondary"} className="text-xs">
                            {request.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate">
                          {request.request}
                        </TableCell>
                        <TableCell className="text-xs">
                          {request.family.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              request.status === "DONE" ? "default" :
                              request.status === "IGNORED" ? "destructive" :
                              "secondary"
                            }
                            className="text-xs"
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateRequestStatus(request.id, "DONE")}
                              disabled={updateTemplateRequestStatusMutation.isPending}
                              className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Done
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateRequestStatus(request.id, "IGNORED")}
                              disabled={updateTemplateRequestStatusMutation.isPending}
                              className="h-6 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Ignore
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredRequests.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No requests found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}