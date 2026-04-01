import { 
  Settings,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRoleDefinition } from "@shared/roleCapabilities";
import { getRoleWorkspaceRoutes, isWorkspaceRouteActive } from "@/lib/roleWorkspace";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAdmin, isPharmacist, isStaff, isDriver } = useAuth();
  const roleDefinition = user ? getRoleDefinition(user.role) : null;
  const menuItems =
    isAdmin || isPharmacist || isStaff || isDriver
      ? getRoleWorkspaceRoutes(user?.role)
      : [];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'pharmacist': return 'bg-chart-2 text-white';
      case 'staff': return 'bg-chart-3 text-white';
      case 'driver': return 'bg-chart-4 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Sidebar data-testid="sidebar-navigation">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            T
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">Thandizo Pharmacy</h2>
            {user && (
              <Badge className={`text-xs mt-1 ${getRoleBadgeColor(user.role)}`}>
                {roleDefinition?.label || (user.role.charAt(0).toUpperCase() + user.role.slice(1))}
              </Badge>
            )}
            {roleDefinition && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {roleDefinition.headline}
              </p>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isWorkspaceRouteActive(item, location)}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName || user?.email || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Link href="/settings/account">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
