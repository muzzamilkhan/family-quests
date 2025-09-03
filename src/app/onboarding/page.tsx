"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Crown, Users, ArrowRight, Sparkles } from "lucide-react";
import { api } from "~/lib/trpc-provider";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  if (!session) {
    router.push("/");
    return null;
  }

  const createFamilyMutation = api.family.create.useMutation({
    onSuccess: () => {
      toast.success("🎉 Your family adventure has begun!");
      router.push("/parent");
    },
    onError: (error) => {
      toast.error(`Failed to create family: ${error.message}`);
    },
  });

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      toast.error("Please enter a family name");
      return;
    }

    setIsLoading(true);
    try {
      await createFamilyMutation.mutateAsync({ name: familyName.trim() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg">
            <Users className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <Crown className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, Quest Master!
            </h1>
            <p className="text-muted-foreground">
              Let's create your family's adventure kingdom
            </p>
          </div>
        </div>

        {/* Onboarding Form */}
        <Card className="p-8 border-2 border-primary/20 shadow-xl">
          <form onSubmit={handleCreateFamily} className="space-y-6">
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Create Your Family</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a name for your family's quest adventures
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="familyName" className="text-sm font-medium">
                  Family Name
                </Label>
                <Input
                  id="familyName"
                  type="text"
                  placeholder="The Smith Family"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="text-base"
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will appear on your family's quest board
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !familyName.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Creating your kingdom...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Create Family Adventure</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>
        </Card>

        {/* What's Next */}
        <Card className="p-6 bg-secondary/50 border-dashed border-2 border-primary/30">
          <div className="space-y-4">
            <h3 className="font-medium text-center">What's Next?</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <span>Add your children as adventurers</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <span>Create epic quests for them to complete</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <span>Set up magical rewards in the treasury</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}