import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginRoute } from "@/lib/authSession";
import type { PlatformRole } from "@shared/roleCapabilities";

type RoleRedirectProps = {
  targets: Partial<Record<PlatformRole, string>>;
  fallback?: string;
};

export function RoleRedirect({ targets, fallback }: RoleRedirectProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    const role = user?.role as PlatformRole | undefined;
    const target = (role && targets[role]) || fallback || getPostLoginRoute(role);
    setLocation(target);
  }, [fallback, isAuthenticated, isLoading, setLocation, targets, user?.role]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
