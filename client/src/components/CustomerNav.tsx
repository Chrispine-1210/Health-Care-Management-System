import { ShoppingCart, Search, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { getRoleWorkspaceRoutes, isWorkspaceRouteActive } from "@/lib/roleWorkspace";

export function CustomerNav() {
  const [location] = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();
  const customerRoutes = getRoleWorkspaceRoutes("customer");
  const primaryLinks = customerRoutes.filter((route) =>
    ["dashboard", "shop", "orders", "prescriptions", "consultations"].includes(route.key),
  );
  const profileLinks = customerRoutes.filter((route) =>
    ["profile", "notifications"].includes(route.key),
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/customer">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                T
              </div>
              <span className="font-semibold text-lg hidden sm:inline">Thandizo Pharmacy</span>
            </div>
          </Link>

          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medications..."
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover-elevate active-elevate-2 md:hidden"
              data-testid="button-mobile-search"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Link href="/customer/cart">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover-elevate active-elevate-2"
                data-testid="button-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link href="/customer/notifications">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover-elevate active-elevate-2"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </Link>

            <ThemeToggle />

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover-elevate active-elevate-2"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.firstName?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{user.firstName || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profileLinks.map((route) => (
                    <DropdownMenuItem key={route.key} asChild>
                      <Link href={route.href}>{route.title}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem asChild>
                    <Link href="/customer/profile/view">View Portfolio</Link>
                  </DropdownMenuItem>
                  {primaryLinks
                    .filter((route) => route.key !== "dashboard")
                    .map((route) => (
                      <DropdownMenuItem key={route.key} asChild>
                        <Link href={route.href}>{route.title}</Link>
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void signOut();
                    }}
                    data-testid="menu-logout"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild data-testid="button-login">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="hidden gap-2 border-t border-border py-3 lg:flex lg:flex-wrap">
          {primaryLinks.map((route) => (
            <Button
              key={route.key}
              variant={isWorkspaceRouteActive(route, location) ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={route.href}>{route.title}</Link>
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
}
