import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { unwrapApiResponse } from "@/lib/queryClient";
import { clearAuthenticatedSession, getAuthToken, getAuthUserQueryKey } from "@/lib/authSession";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const token = getAuthToken();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: getAuthUserQueryKey(token),
    queryFn: async () => {
      const currentToken = getAuthToken();
      if (!currentToken) {
        return null;
      }

      const response = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch authenticated user: ${response.status}`);
      }

      return unwrapApiResponse<User>(await response.json());
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    staleTime: 30 * 60 * 1000,
    enabled: !!token,
  });

  const isAuthenticated = !!token && !!user;

  const signOut = useCallback(async (options?: unknown) => {
    const redirectTo =
      options && typeof options === "object" && "redirectTo" in options
        ? (options as { redirectTo?: string }).redirectTo
        : undefined;

    const currentToken = getAuthToken();
    try {
      if (currentToken) {
        await fetch("/api/auth/sign-out", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
      }
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    clearAuthenticatedSession();
    queryClient.removeQueries({ queryKey: ["auth", "user"] });
    window.location.href = redirectTo ?? "/";
  }, [queryClient]);

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated,
    isAdmin: user?.role === "admin",
    isPharmacist: user?.role === "pharmacist",
    isStaff: user?.role === "staff",
    isCustomer: user?.role === "customer",
    isDriver: user?.role === "driver",
    signOut,
  };
}
