import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeritBadges, badgeDefinitions } from "@/components/MeritBadges";
import { CheckCircle2, Users, Award, TrendingUp } from "lucide-react";

export default function PharmacistPortfolio() {
  const { user } = useAuth();

  const badges = [
    badgeDefinitions.accuracy_badge,
    badgeDefinitions.efficiency_master,
    badgeDefinitions.top_performer,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary text-white text-3xl">
              {user?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold">{user?.firstName} {user?.lastName}</h1>
            <p className="text-muted-foreground">Senior Pharmacist</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-chart-1">Verified</Badge>
              <Badge variant="outline">Active</Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Prescriptions Processed", value: "2,847", icon: CheckCircle2 },
            { label: "Approval Rate", value: "99.2%", icon: TrendingUp },
            { label: "Fleet Members", value: "12", icon: Users },
            { label: "Accuracy Score", value: "99.1%", icon: Award },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4" />
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

        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="badges">Merit Badges</TabsTrigger>
            <TabsTrigger value="expertise">Expertise</TabsTrigger>
          </TabsList>

          <TabsContent value="badges">
            <Card>
              <CardContent className="pt-6">
                <MeritBadges badges={badges} role="pharmacist" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expertise">
            <Card>
              <CardHeader>
                <CardTitle>Professional Expertise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { area: "Prescription Verification", level: "Expert", rating: "99.2%" },
                  { area: "Drug Interactions", level: "Expert", rating: "98.8%" },
                  { area: "Patient Counseling", level: "Advanced", rating: "97.5%" },
                  { area: "Fleet Management", level: "Expert", rating: "98.1%" },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{item.area}</p>
                      <Badge>{item.level}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Proficiency: {item.rating}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
