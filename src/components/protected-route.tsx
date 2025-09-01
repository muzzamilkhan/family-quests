"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "PARENT" | "CHILD";
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = "/" 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      const defaultRedirect = session.user.role === "PARENT" 
        ? "/dashboard/parent" 
        : "/dashboard/child";
      router.push(defaultRedirect);
      return;
    }
  }, [session, status, requiredRole, redirectTo, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading your kingdom...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}