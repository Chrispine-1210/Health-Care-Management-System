import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { useCallback } from "react";

export function useAuth() {
  const token = localStorage.getItem("auth_token");

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 30 * 60 * 1000,
    enabled: !!token,
  });

  const isAuthenticated = !!token && !!user;

  const signOut = useCallback(async () => {
    localStorage.removeItem("auth_token");
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    window.location.href = "/";
  }, []);

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
