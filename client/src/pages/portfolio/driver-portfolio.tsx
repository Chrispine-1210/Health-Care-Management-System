import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeritBadges, badgeDefinitions } from "@/components/MeritBadges";
import { Star, Truck, Map, Users, Award } from "lucide-react";

export default function DriverPortfolio() {
  const { user } = useAuth();

  const portfolioData = {
    stats: {
      totalDeliveries: 487,
      successRate: 99.2,
      avgRating: 4.8,
      totalCustomers: 342,
    },
    badges: [
      badgeDefinitions.top_performer,
      badgeDefinitions.five_star_champion,
      badgeDefinitions.speed_demon,
      badgeDefinitions.customer_favorite,
    ],
    reviews: [
      { rating: 5, text: "Excellent service! Very professional.", customer: "Alice M.", date: "2 days ago" },
      { rating: 5, text: "Quick delivery, friendly driver.", customer: "Bob K.", date: "1 week ago" },
      { rating: 4, text: "Good service, minor delay.", customer: "Carol S.", date: "2 weeks ago" },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header with Avatar */}
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary text-white text-3xl">
              {user?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold">{user?.firstName} {user?.lastName}</h1>
            <p className="text-muted-foreground">Professional Delivery Driver</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-chart-1">Verified Driver</Badge>
              <Badge variant="outline">Active</Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Deliveries", value: portfolioData.stats.totalDeliveries, icon: Truck },
            { label: "Success Rate", value: `${portfolioData.stats.successRate}%`, icon: Map },
            { label: "Avg Rating", value: portfolioData.stats.avgRating, icon: Star },
            { label: "Customers Served", value: portfolioData.stats.totalCustomers, icon: Users },
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="badges">Merit Badges</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <Card>
              <CardContent className="pt-6">
                <MeritBadges badges={portfolioData.badges} role="driver" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Milestones & Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { milestone: "100 Deliveries", date: "3 months ago", status: "achieved" },
                  { milestone: "200 Deliveries", date: "2 months ago", status: "achieved" },
                  { milestone: "300 Deliveries", date: "1 month ago", status: "achieved" },
                  { milestone: "500 Deliveries", date: "In progress (487/500)", status: "in-progress" },
                  { milestone: "1000 Deliveries", date: "Next goal", status: "pending" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">{item.milestone}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <Badge variant={item.status === "achieved" ? "default" : "outline"}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Recent Customer Reviews</CardTitle>
                <CardDescription>487 total reviews | 4.8/5 average rating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {portfolioData.reviews.map((review, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{review.customer}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "fill-chart-2 text-chart-2" : "text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
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
