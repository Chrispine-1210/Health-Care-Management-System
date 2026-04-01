import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginRoute } from '@/lib/authSession';
import type { PlatformRole } from '@shared/roleCapabilities';

export function NavBar() {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role as PlatformRole | undefined;
  const notificationTargets: Partial<Record<PlatformRole, string>> = {
    admin: "/admin/inbox",
    pharmacist: "/pharmacist/inbox",
    staff: "/staff/inbox",
    driver: "/driver/inbox",
    customer: "/customer/notifications",
  };
  const notificationLink = (role && notificationTargets[role]) || (isAuthenticated ? "/notifications" : "/login");
  const homeLink = isAuthenticated ? getPostLoginRoute(role) : "/";

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        <Link href={homeLink} className="font-bold text-lg text-primary">
          Thandizo Pharmacy
        </Link>
        <div className="flex items-center gap-4">
          <Link href={notificationLink}>
            <Button size="icon" variant="ghost">
              <Bell className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
