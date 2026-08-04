import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { resolveApiUrl } from "@/lib/queryClient";
import { useCallback } from "react";
import { clearAuthenticatedSession, getAuthToken, getAuthUserQueryKey } from "@/lib/authSession";

export function useAuth() {
  const token = getAuthToken();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: getAuthUserQueryKey(token),
    queryFn: async () => {
      const response = await fetch(resolveApiUrl("/api/auth/me"), { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) return null;
      if (!response.ok) throw new Error(`Authentication check failed: ${response.status}`);
      return ((await response.json()) as { data: User }).data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 30 * 60 * 1000,
    enabled: !!token,
  });

  const isAuthenticated = !!token && !!user;

  const signOut = useCallback(async () => {
    const currentToken = localStorage.getItem("auth_token");
    try {
      if (currentToken) {
        await fetch("/api/logout", { method: "POST", headers: { Authorization: `Bearer ${currentToken}` } });
      }
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      clearAuthenticatedSession();
    }
    window.location.href = "/";
  }, []);

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated,
    isAdmin: user?.role === "system_administrator" || user?.role === "super_administrator" || user?.role === "branch_administrator",
    isPharmacist: user?.role === "pharmacist",
    isStaff: user?.role === "receptionist",
    isCustomer: user?.role === "patient",
    isDriver: user?.role === "delivery_driver",
    signOut,
  };
}
