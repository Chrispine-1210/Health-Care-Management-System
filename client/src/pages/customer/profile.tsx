import { useAuth } from "@/hooks/useAuth";
import { CustomerNav } from "@/components/CustomerNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        <Card data-testid="card-profile">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-semibold text-lg">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{user?.email}</p>
              </div>

              {user?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}

              {user?.allergies && user.allergies.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Allergies</p>
                  <p className="font-medium">{user.allergies.join(', ')}</p>
                </div>
              )}

              {user?.chronicConditions && user.chronicConditions.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Chronic Conditions</p>
                  <p className="font-medium">{user.chronicConditions.join(', ')}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-2">
              <a href="/profile/edit" className="block">
                <Button className="w-full" data-testid="button-edit-profile">
                  Edit Profile
                </Button>
              </a>
              <Button asChild variant="destructive" className="w-full" data-testid="button-logout">
                <a href="/api/logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
