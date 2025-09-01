"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Crown, Sword, Sparkles, Heart } from "lucide-react";
import { api } from "~/lib/trpc-provider";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Get user profile to check if they have a family
  const { data: userProfile, isLoading: profileLoading } = api.user.getProfile.useQuery(
    undefined,
    { enabled: !!session }
  );

  useEffect(() => {
    if (session && userProfile && !profileLoading) {
      if (userProfile.family) {
        // User has a family, redirect to appropriate dashboard
        if (userProfile.role === "PARENT") {
          router.push("/dashboard/parent");
        } else {
          router.push("/dashboard/child");
        }
      } else if (userProfile.role === "PARENT") {
        // Parent without family, redirect to onboarding
        router.push("/onboarding");
      }
    }
  }, [session, userProfile, profileLoading, router]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (status === "loading" || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading your adventure...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          {/* Logo/Icon */}
          <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg">
            <Crown className="w-12 h-12 text-white" />
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Family Quests
            </h1>
            <p className="text-lg text-muted-foreground">
              Transform chores into epic adventures!
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Sword className="w-4 h-4 text-primary" />
              <span>Epic quests for kids</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Magical rewards system</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Heart className="w-4 h-4 text-destructive" />
              <span>Family adventure awaits</span>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="p-8 border-2 border-primary/20 shadow-xl">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Begin Your Adventure</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with Google to create your family's quest board
              </p>
            </div>

            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Starting adventure...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>Sign in with Google</span>
                </div>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Free forever • Safe for kids • Adventure guaranteed
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}