import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ShoppingCart, 
  Truck, 
  Users, 
  Building2,
  Calendar,
  FileCheck,
  BarChart3,
  Settings,
  Pill,
  ClipboardList
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

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isAdmin, isPharmacist, isStaff, isDriver } = useAuth();

  const adminItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Branches", url: "/admin/branches", icon: Building2 },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "Products", url: "/admin/products", icon: Pill },
    { title: "Inventory", url: "/admin/inventory", icon: Package },
    { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Content", url: "/admin/content", icon: FileText },
    { title: "Performance", url: "/performance/admin", icon: BarChart3 },
    { title: "Settings", url: "/admin/settings", icon: Settings },
  ];

  const pharmacistItems = [
    { title: "Dashboard", url: "/pharmacist", icon: LayoutDashboard },
    { title: "Prescriptions", url: "/pharmacist/prescriptions", icon: FileCheck },
    { title: "Inventory", url: "/pharmacist/inventory", icon: Package },
    { title: "Performance", url: "/performance/pharmacist", icon: BarChart3 },
    { title: "Portfolio", url: "/portfolio/pharmacist", icon: Users },
  ];

  const staffItems = [
    { title: "Dashboard", url: "/staff", icon: LayoutDashboard },
    { title: "POS", url: "/pos", icon: ShoppingCart },
    { title: "Orders", url: "/staff/orders", icon: ClipboardList },
    { title: "Performance", url: "/performance/staff", icon: BarChart3 },
  ];

  const driverItems = [
    { title: "Active Deliveries", url: "/driver", icon: Truck },
    { title: "History", url: "/driver/history", icon: FileText },
    { title: "Performance", url: "/performance/driver", icon: BarChart3 },
    { title: "Portfolio", url: "/portfolio/driver", icon: Users },
  ];

  const menuItems: { title: string; url: string; icon: any }[] = 
    isAdmin ? adminItems :
    isPharmacist ? pharmacistItems :
    isStaff ? staffItems :
    isDriver ? driverItems :
    [];

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
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
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
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
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
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
