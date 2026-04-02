import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Package, AlertCircle } from "lucide-react";

export default function AdminPerformance() {
  const { user } = useAuth();

  const platformData = [
    { day: "Mon", orders: 142, delivered: 138, failed: 4, revenue: 28400 },
    { day: "Tue", orders: 156, delivered: 152, failed: 4, revenue: 31200 },
    { day: "Wed", orders: 148, delivered: 145, failed: 3, revenue: 29600 },
    { day: "Thu", orders: 165, delivered: 162, failed: 3, revenue: 33000 },
    { day: "Fri", orders: 178, delivered: 175, failed: 3, revenue: 35600 },
  ];

  const roleData = [
    { name: "Drivers", value: 12 },
    { name: "Staff", value: 8 },
    { name: "Pharmacists", value: 3 },
  ];

  const colors = ["#2196F3", "#10b981", "#f59e0b"];

  const stats = [
    { label: "Total Orders (This Week)", value: "789", icon: Package, color: "text-primary" },
    { label: "Delivery Success Rate", value: "97.8%", icon: TrendingUp, color: "text-chart-1" },
    { label: "Active Users", value: "523", icon: Users, color: "text-chart-2" },
    { label: "Revenue (This Week)", value: "MK 157.8K", icon: AlertCircle, color: "text-chart-3" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Platform Performance Dashboard</h1>
            <p className="text-muted-foreground mt-1">Full platform analytics and accountability overview</p>
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
        <Tabs defaultValue="platform" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="platform">Platform Metrics</TabsTrigger>
            <TabsTrigger value="roles">Role Analytics</TabsTrigger>
            <TabsTrigger value="accountability">Accountability</TabsTrigger>
          </TabsList>

          {/* Platform Metrics */}
          <TabsContent value="platform">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="#2196F3" strokeWidth={2} />
                    <Line type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Analytics */}
          <TabsContent value="roles">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Composition</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={roleData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {roleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Role Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { role: "Drivers", metric: "97.8% delivery success", status: "Excellent" },
                    { role: "Staff", metric: "96.5% approval rate", status: "Excellent" },
                    { role: "Pharmacists", metric: "99.2% accuracy", status: "Outstanding" },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{item.role}</p>
                          <p className="text-xs text-muted-foreground">{item.metric}</p>
                        </div>
                        <span className="text-xs font-bold text-chart-1">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accountability */}
          <TabsContent value="accountability">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Quality Scorecard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { metric: "Overall Customer Satisfaction", value: "4.8/5", target: "4.5/5", status: "✓ Above Target" },
                    { metric: "On-Time Delivery Rate", value: "97.8%", target: "95%", status: "✓ Above Target" },
                    { metric: "Order Processing Accuracy", value: "99.2%", target: "98%", status: "✓ Above Target" },
                    { metric: "Customer Support Resolution", value: "94.2%", target: "90%", status: "✓ Above Target" },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/30 dark:to-transparent">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{item.metric}</p>
                        <p className="text-sm text-chart-1">{item.status}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className="text-xs text-muted-foreground">Target: {item.target}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Benchmarks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { period: "This Week", orders: 789, revenue: "MK 157.8K", satisfaction: "4.8/5" },
                    { period: "Last Week", orders: 712, revenue: "MK 142.4K", satisfaction: "4.7/5" },
                    { period: "This Month", orders: 3156, revenue: "MK 631.2K", satisfaction: "4.8/5" },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <p className="font-semibold text-sm mb-2">{item.period}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Orders</p>
                          <p className="font-bold">{item.orders}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-bold">{item.revenue}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rating</p>
                          <p className="font-bold text-chart-2">★ {item.satisfaction}</p>
                        </div>
                      </div>
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
