import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function SignOutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    void signOut({ redirectTo: "/login" });
  }, [signOut]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Signing out...</p>
      </div>
    </div>
  );
}
