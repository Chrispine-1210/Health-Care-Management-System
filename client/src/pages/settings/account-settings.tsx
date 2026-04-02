import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Lock, Bell, Shield, LogOut, Camera } from "lucide-react";

export default function AccountSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    deliveryUpdates: true,
    orderConfirmations: true,
    promotions: false,
    systemAlerts: true,
  });

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Max 2MB profile pictures",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        toast({ title: "Profile picture updated" });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImage || undefined} />
                    <AvatarFallback className="bg-primary text-white text-2xl">
                      {user?.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                      id="profile-upload"
                      data-testid="input-upload-profile-picture"
                    />
                    <label htmlFor="profile-upload">
                      <Button asChild variant="outline">
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          Change Picture
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">Max 2MB. JPG, PNG</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input value={user?.firstName || ""} readOnly className="mt-2" data-testid="input-first-name" />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input value={user?.lastName || ""} readOnly className="mt-2" data-testid="input-last-name" />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} readOnly className="mt-2" data-testid="input-email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={user?.phone || ""} readOnly className="mt-2" data-testid="input-phone" />
                </div>
                <Button className="w-full" data-testid="button-edit-profile">
                  Edit Profile Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="Enter current password" className="mt-2" data-testid="input-current-password" />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input type="password" placeholder="Enter new password" className="mt-2" data-testid="input-new-password" />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="Confirm new password" className="mt-2" data-testid="input-confirm-password" />
                </div>
                <Button
                  onClick={() => {
                    setIsChangingPassword(true);
                    setTimeout(() => {
                      setIsChangingPassword(false);
                      toast({ title: "Password changed successfully" });
                    }, 1000);
                  }}
                  disabled={isChangingPassword}
                  className="w-full"
                  data-testid="button-change-password"
                >
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account.
                </p>
                <Button variant="outline" className="w-full" data-testid="button-enable-2fa">
                  Enable 2FA
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <label className="capitalize text-sm font-medium cursor-pointer">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          [key]: e.target.checked,
                        })
                      }
                      data-testid={`toggle-${key}`}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </div>
                ))}
                <Button
                  className="w-full"
                  onClick={() => toast({ title: "Notification preferences saved" })}
                  data-testid="button-save-notifications"
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { label: "Show profile to other users", checked: true },
                    { label: "Allow ratings and reviews", checked: true },
                    { label: "Show activity status", checked: false },
                    { label: "Share usage data for improvements", checked: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <label className="text-sm font-medium cursor-pointer">{item.label}</label>
                      <input
                        type="checkbox"
                        defaultChecked={item.checked}
                        className="h-4 w-4 cursor-pointer"
                        data-testid={`toggle-privacy-${idx}`}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full"
                  onClick={() => toast({ title: "Privacy settings saved" })}
                  data-testid="button-save-privacy"
                >
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="destructive" className="w-full" data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
                <Button variant="outline" className="w-full border-red-300" data-testid="button-delete-account">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
