import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Star, Truck, Clock, TrendingUp, MapPin, Users } from "lucide-react";

export default function DriverPerformance() {
  const { user } = useAuth();

  const performanceData = [
    { week: "Week 1", deliveries: 12, onTime: 11, rating: 4.8 },
    { week: "Week 2", deliveries: 15, onTime: 14, rating: 4.9 },
    { week: "Week 3", deliveries: 18, onTime: 17, rating: 4.7 },
    { week: "Week 4", deliveries: 16, onTime: 15, rating: 4.8 },
  ];

  const ratingDistribution = [
    { name: "5 Star", value: 145 },
    { name: "4 Star", value: 32 },
    { name: "3 Star", value: 8 },
    { name: "2 Star", value: 2 },
  ];

  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  const stats = [
    { label: "Total Deliveries", value: "61", icon: Truck, color: "text-primary" },
    { label: "On-Time Rate", value: "97%", icon: Clock, color: "text-chart-1" },
    { label: "Avg Rating", value: "4.8", icon: Star, color: "text-chart-2" },
    { label: "Total Distance", value: "487 km", icon: MapPin, color: "text-chart-3" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Driver Performance Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track your delivery metrics and ratings</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
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
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <Tabs defaultValue="delivery-trend" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="delivery-trend">Delivery Trends</TabsTrigger>
            <TabsTrigger value="rating-dist">Rating Distribution</TabsTrigger>
            <TabsTrigger value="accountability">Accountability</TabsTrigger>
          </TabsList>

          {/* Delivery Trends */}
          <TabsContent value="delivery-trend">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="deliveries" stroke="#2196F3" strokeWidth={2} />
                    <Line type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rating Distribution */}
          <TabsContent value="rating-dist">
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution (Last 30 Days)</CardTitle>
                <CardDescription>187 total ratings from customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={ratingDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {ratingDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {ratingDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[idx] }} />
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm font-bold ml-auto">{item.value} reviews</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accountability */}
          <TabsContent value="accountability">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { metric: "On-Time Delivery Rate", value: "97%", status: "Excellent", color: "text-chart-1" },
                      { metric: "Customer Satisfaction", value: "4.8/5", status: "Outstanding", color: "text-chart-2" },
                      { metric: "Delivery Success Rate", value: "100%", status: "Perfect", color: "text-chart-1" },
                      { metric: "Average Delivery Time", value: "18 mins", status: "Fast", color: "text-chart-4" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-semibold">{item.metric}</p>
                          <p className="text-xs text-muted-foreground">{item.status}</p>
                        </div>
                        <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Customer Reviews</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { rating: 5, comment: "Excellent service! Very prompt delivery.", customer: "John D.", date: "Today" },
                    { rating: 5, comment: "Driver was courteous and professional.", customer: "Jane S.", date: "Yesterday" },
                    { rating: 4, comment: "Good delivery, minor delay.", customer: "Mike P.", date: "2 days ago" },
                  ].map((review, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{review.customer}</p>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? "fill-chart-2 text-chart-2" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
