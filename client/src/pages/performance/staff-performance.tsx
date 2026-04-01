import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CheckCircle2, AlertCircle, Clock, TrendingUp } from "lucide-react";

export default function StaffPerformance() {
  const { user } = useAuth();

  const approvalData = [
    { week: "Week 1", approved: 142, rejected: 8, pending: 2, avgTime: 4.2 },
    { week: "Week 2", approved: 156, rejected: 6, pending: 1, avgTime: 3.8 },
    { week: "Week 3", approved: 148, rejected: 7, pending: 0, avgTime: 4.1 },
    { week: "Week 4", approved: 165, rejected: 5, pending: 1, avgTime: 3.5 },
  ];

  const stats = [
    { label: "Orders Approved", value: "611", icon: CheckCircle2, color: "text-chart-1" },
    { label: "Approval Rate", value: "96.5%", icon: TrendingUp, color: "text-primary" },
    { label: "Avg Review Time", value: "4 mins", icon: Clock, color: "text-chart-2" },
    { label: "Support Tickets Resolved", value: "87", icon: CheckCircle2, color: "text-chart-3" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Staff Performance Dashboard</h1>
            <p className="text-muted-foreground mt-1">Order approvals and support ticket management metrics</p>
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
        <Tabs defaultValue="approvals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="approvals">Approval Analytics</TabsTrigger>
            <TabsTrigger value="quality">Quality & Accountability</TabsTrigger>
          </TabsList>

          {/* Approval Analytics */}
          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Approval Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={approvalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approved" fill="#10b981" />
                    <Bar dataKey="rejected" fill="#ef4444" />
                    <Bar dataKey="pending" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality & Accountability */}
          <TabsContent value="quality">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Approval Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { metric: "Approval Accuracy", value: "99.1%", detail: "611 orders reviewed" },
                      { metric: "Avg Review Time", value: "4 mins", detail: "Under 5 min target" },
                      { metric: "Customer Satisfaction", value: "4.7/5", detail: "Based on feedback" },
                      { metric: "Error Rate", value: "0.9%", detail: "6 rejections out of 611" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{item.metric}</p>
                          <p className="text-lg font-bold text-primary">{item.value}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support Ticket Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: "Technical Issues", tickets: 34, resolved: 34, satisfaction: "4.9/5" },
                      { category: "Payment Issues", tickets: 28, resolved: 27, satisfaction: "4.6/5" },
                      { category: "Delivery Issues", tickets: 19, resolved: 19, satisfaction: "4.8/5" },
                      { category: "General Inquiries", tickets: 18, resolved: 16, satisfaction: "4.7/5" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">{item.category}</p>
                          <span className="text-xs font-bold text-chart-1">{item.resolved}/{item.tickets} resolved</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div className="bg-chart-1 h-2 rounded-full" style={{ width: `${(item.resolved / item.tickets) * 100}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">Customer satisfaction: ★ {item.satisfaction}</p>
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
