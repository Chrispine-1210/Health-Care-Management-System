import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/authSession";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Lock, Bell, Shield, LogOut, Camera } from "lucide-react";

export default function AccountSettings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    });
  }, [user?.firstName, user?.lastName, user?.phone]);
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

        {user?.mustResetPassword && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="text-amber-900 dark:text-amber-100">
                Password reset required
              </CardTitle>
              <CardDescription>
                This account was created by an administrator. Update your password to continue using the platform.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

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
                    <Input
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="mt-2"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="mt-2"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} readOnly className="mt-2" data-testid="input-email" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="mt-2"
                    data-testid="input-phone"
                  />
                </div>
                <Button
                  className="w-full"
                  data-testid="button-edit-profile"
                  disabled={isSavingProfile}
                  onClick={async () => {
                    if (!user?.id) return;
                    try {
                      setIsSavingProfile(true);
                      const token = getAuthToken();
                      const res = await fetch(`/api/users/${user.id}`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({
                          firstName: profileForm.firstName.trim(),
                          lastName: profileForm.lastName.trim(),
                          phone: profileForm.phone.trim(),
                        }),
                      });
                      if (!res.ok) {
                        const error = await res.json();
                        throw new Error(error.message || "Failed to update profile");
                      }
                      await queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
                      toast({ title: "Profile updated successfully" });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to update profile",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSavingProfile(false);
                    }
                  }}
                >
                  {isSavingProfile ? "Saving..." : "Save Profile Changes"}
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
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    className="mt-2"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    data-testid="input-current-password"
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    className="mt-2"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    data-testid="input-new-password"
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    className="mt-2"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button
                  onClick={async () => {
                    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
                      toast({ title: "All fields are required", variant: "destructive" });
                      return;
                    }
                    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                      toast({ title: "Passwords do not match", variant: "destructive" });
                      return;
                    }
                    try {
                      setIsChangingPassword(true);
                      const token = getAuthToken();
                      const res = await fetch("/api/auth/change-password", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({
                          currentPassword: passwordForm.currentPassword,
                          newPassword: passwordForm.newPassword,
                        }),
                      });
                      const result = await res.json();
                      if (!res.ok) {
                        throw new Error(result.message || "Failed to change password");
                      }
                      await queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
                      toast({ title: "Password changed successfully" });
                      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to change password",
                        variant: "destructive",
                      });
                    } finally {
                      setIsChangingPassword(false);
                    }
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
                <Button
                  variant="destructive"
                  className="w-full"
                  data-testid="button-logout"
                  onClick={() => signOut({ redirectTo: "/login" })}
                >
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
