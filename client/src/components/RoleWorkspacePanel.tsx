import { Link } from "wouter";
import type { PlatformRole } from "@shared/roleCapabilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleWorkspaceRoutes } from "@/lib/roleWorkspace";

type RoleWorkspacePanelProps = {
  role: PlatformRole;
  title?: string;
  description?: string;
  limit?: number;
  excludeKeys?: string[];
};

export function RoleWorkspacePanel({
  role,
  title = "Workspace Routes",
  description = "Open the main tools and workflows assigned to this role.",
  limit,
  excludeKeys = [],
}: RoleWorkspacePanelProps) {
  const routes = getRoleWorkspaceRoutes(role)
    .filter((route) => !excludeKeys.includes(route.key))
    .slice(0, limit);

  if (routes.length === 0) {
    return null;
  }

  return (
    <Card className="border-muted/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {routes.map((route) => (
          <div
            key={route.key}
            className="rounded-xl border border-muted/60 bg-muted/20 p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{route.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{route.description}</p>
              </div>
              <route.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Badge variant="outline">{route.badge ?? role}</Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href={route.href}>Open</Link>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
