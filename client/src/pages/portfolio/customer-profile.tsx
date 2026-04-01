import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Heart, Package, Star, Phone, Mail } from "lucide-react";

export default function CustomerProfile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary text-white text-3xl">
              {user?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold">{user?.firstName} {user?.lastName}</h1>
            <p className="text-muted-foreground">Valued Customer</p>
            <Badge className="mt-2 bg-chart-1">Active Member</Badge>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{user?.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                Phone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{user?.phone}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Orders", value: "24", icon: Package, color: "text-primary" },
            { label: "Favorite Items", value: "12", icon: Heart, color: "text-chart-1" },
            { label: "Avg Rating", value: "4.8", icon: Star, color: "text-chart-2" },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Medical Info */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Allergies</p>
              <div className="flex flex-wrap gap-2">
                {(user?.allergies || []).length > 0 ? (
                  (user?.allergies || []).map((allergy: string, idx: number) => (
                    <Badge key={idx} variant="outline">{allergy}</Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No allergies recorded</p>
                )}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-2">Chronic Conditions</p>
              <div className="flex flex-wrap gap-2">
                {(user?.chronicConditions || []).length > 0 ? (
                  (user?.chronicConditions || []).map((condition: string, idx: number) => (
                    <Badge key={idx} className="bg-yellow-100 text-yellow-800">{condition}</Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No chronic conditions recorded</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Preferred Delivery Time", value: "Morning (8am-12pm)" },
              { label: "Default Address", value: "City Center, Lilongwe" },
              { label: "Special Instructions", value: "Leave at door with caution" },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
