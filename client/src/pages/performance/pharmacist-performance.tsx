import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CheckCircle2, Clock, Users, TrendingUp } from "lucide-react";

export default function PharmacistPerformance() {
  const { user } = useAuth();

  const prescriptionData = [
    { day: "Mon", processed: 45, approved: 42, rejected: 3, avgTime: 8 },
    { day: "Tue", processed: 52, approved: 49, rejected: 3, avgTime: 7 },
    { day: "Wed", processed: 48, approved: 46, rejected: 2, avgTime: 6 },
    { day: "Thu", processed: 58, approved: 55, rejected: 3, avgTime: 8 },
    { day: "Fri", processed: 62, approved: 60, rejected: 2, avgTime: 5 },
  ];

  const stats = [
    { label: "Prescriptions Processed", value: "265", icon: CheckCircle2, color: "text-primary" },
    { label: "Approval Rate", value: "98.5%", icon: TrendingUp, color: "text-chart-1" },
    { label: "Avg Review Time", value: "6.8 mins", icon: Clock, color: "text-chart-2" },
    { label: "Fleet Managed", value: "12", icon: Users, color: "text-chart-3" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Pharmacist Performance Dashboard</h1>
            <p className="text-muted-foreground mt-1">Prescription processing and fleet management metrics</p>
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
        <Tabs defaultValue="processing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processing">Processing Trends</TabsTrigger>
            <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          </TabsList>

          {/* Processing Trends */}
          <TabsContent value="processing">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Prescription Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prescriptionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="processed" fill="#2196F3" />
                    <Bar dataKey="approved" fill="#10b981" />
                    <Bar dataKey="rejected" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Metrics */}
          <TabsContent value="quality">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Prescription Accuracy & Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { metric: "Accuracy Rate", value: "99.2%", benchmark: "Target: 98%" },
                      { metric: "Processing Speed", value: "6.8 min avg", benchmark: "Target: 10 min" },
                      { metric: "Prescription Errors", value: "0.8%", benchmark: "Target: <1%" },
                      { metric: "Customer Satisfaction", value: "4.9/5", benchmark: "Based on 48 reviews" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{item.metric}</p>
                          <p className="text-lg font-bold text-primary">{item.value}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.benchmark}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fleet Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Driver A", deliveries: 47, avgRating: 4.9, status: "Top Performer" },
                      { name: "Driver B", deliveries: 43, avgRating: 4.7, status: "Excellent" },
                      { name: "Driver C", deliveries: 38, avgRating: 4.6, status: "Good" },
                    ].map((driver, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">{driver.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{driver.deliveries} deliveries</p>
                          <p className="text-xs text-chart-2">★ {driver.avgRating}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
