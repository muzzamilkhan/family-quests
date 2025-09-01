"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Crown, Sparkles, Heart, AlertCircle } from "lucide-react";
import { api } from "~/lib/trpc-provider";

export default function ChildLoginPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const permalink = params.permalink as string;

  // Query to validate permalink and get child info
  const { data: child, error, isLoading } = api.user.loginWithPermalink.useQuery(
    { permalink },
    { 
      enabled: !!permalink,
      retry: false
    }
  );

  useEffect(() => {
    // Auto login if child exists and has no email (uses permalink login)
    if (child && !child.email) {
      handleAutoLogin();
    }
  }, [child]);

  const handleAutoLogin = async () => {
    setIsLoggingIn(true);
    try {
      // For children without email, we need a custom auth flow
      // This would need to be implemented in the auth configuration
      router.push("/dashboard/child");
    } catch (error) {
      console.error("Auto login failed:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signIn("google", { 
        callbackUrl: "/dashboard/child",
        // Pass child email to pre-fill or hint
        ...(child?.email && { login_hint: child.email })
      });
    } catch (error) {
      console.error("Google login failed:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Checking your magic link...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !child) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <Card className="p-8 border-2 border-destructive/20 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-destructive">Magic Link Not Found</h1>
                <p className="text-muted-foreground">
                  This adventure link seems to be broken or expired. Ask your Quest Master for a new one!
                </p>
              </div>

              <Button 
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Success state - show child info and login options
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg">
            <Crown className="w-12 h-12 text-white" />
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Welcome, {child.name}! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              Ready for your next adventure?
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Heart className="w-4 h-4 text-red-400" />
            <span>From {child.family?.name}</span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="p-8 border-2 border-primary/20 shadow-xl">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Enter Your Kingdom</h2>
              <p className="text-sm text-muted-foreground">
                Click below to start your quest adventure!
              </p>
            </div>

            <div className="space-y-4">
              {/* Email login option if available */}
              {child.email && (
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Entering kingdom...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4" />
                      <span>Sign in with Google</span>
                    </div>
                  )}
                </Button>
              )}

              {/* Permalink login (for children without email) */}
              {!child.email && (
                <Button
                  onClick={handleAutoLogin}
                  disabled={isLoggingIn}
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Starting adventure...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Start Adventure!</span>
                    </div>
                  )}
                </Button>
              )}
            </div>

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Your points: <span className="font-semibold text-primary">{child.points} ⭐</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Safe & secure • Parent approved
              </p>
            </div>
          </div>
        </Card>

        {/* Family Info */}
        <Card className="p-6 bg-secondary/50 border-dashed border-2 border-primary/30">
          <div className="text-center space-y-3">
            <h3 className="font-medium">Your Family Kingdom</h3>
            <p className="text-sm text-muted-foreground">
              {child.family?.name}
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Crown className="w-3 h-3 text-primary" />
                <span>Quest Master Protected</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-accent" />
                <span>Adventure Awaits</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}