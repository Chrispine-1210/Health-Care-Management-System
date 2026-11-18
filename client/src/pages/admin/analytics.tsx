import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminAnalytics() {
  const query = useQuery<Record<string, number | string | null>>({ queryKey: ["/api/admin/stats"], staleTime: 30_000 });
  const metrics = [
    ["All recorded orders", "totalOrders"],
    ["Recorded customers", "totalCustomers"],
    ["Active catalogue products", "totalProducts"],
    ["Low-stock batches", "lowStockItems"],
    ["Batches expiring within 30 days", "expiringItems"],
    ["Pending prescriptions", "pendingPrescriptions"],
    ["Active deliveries", "activeDeliveries"],
  ];
  return <div className="space-y-6"><div><h1 className="text-3xl font-semibold">Operational analytics</h1><p className="mt-2 text-muted-foreground">Recorded system totals. These figures do not establish business outcomes or payment reconciliation.</p></div>{query.isLoading ? <p role="status">Loading recorded metrics…</p> : query.isError ? <div role="alert"><p>Metrics are unavailable. No estimates are substituted.</p><Button variant="outline" onClick={() => void query.refetch()}>Try again</Button></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label, key]) => <Card key={key}><CardHeader><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{query.data?.[key] !== undefined && query.data?.[key] !== null ? Number(query.data[key]).toLocaleString() : 'Unknown'}</p></CardContent></Card>)}</div>}<Card><CardHeader><CardTitle className="text-base">Evidence still needed</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>Monthly revenue, independently reconciled collections, growth percentages, satisfaction scores and conversion rates have no verified reporting source here. No fabricated trend charts are displayed.</p><p>Inventory forecasts include explicit uncertainty and do not authorize automatic purchasing or clinical decisions.</p><Link href="/intelligence" className="inline-block text-primary underline underline-offset-4">Open inventory intelligence</Link></CardContent></Card></div>;
}
