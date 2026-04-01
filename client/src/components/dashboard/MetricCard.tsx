import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MetricTone = "default" | "success" | "warning" | "info" | "danger";

type MetricCardProps = {
  title: string;
  value: ReactNode;
  description: string;
  tone?: MetricTone;
  testId?: string;
};

const toneClasses: Record<MetricTone, string> = {
  default: "text-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  info: "text-sky-600",
  danger: "text-destructive",
};

export function MetricCard({
  title,
  value,
  description,
  tone = "default",
  testId,
}: MetricCardProps) {
  return (
    <Card data-testid={testId} className="border-muted/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${toneClasses[tone]}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
