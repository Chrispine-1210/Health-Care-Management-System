import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { ContentItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Edit, FileText, Plus, Trash2 } from "lucide-react";

type ContentFormState = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string;
  status: "draft" | "published" | "archived";
};

const emptyForm: ContentFormState = {
  title: "",
  slug: "",
  category: "",
  excerpt: "",
  content: "",
  featuredImageUrl: "",
  status: "draft",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ContentFormState>(emptyForm);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  const { data: content = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const activeCount = useMemo(
    () => content.filter((item) => item.status !== "archived").length,
    [content],
  );

  const publishedCount = useMemo(
    () => content.filter((item) => item.status === "published").length,
    [content],
  );

  const saveMutation = useMutation({
    mutationFn: async (payload: ContentFormState) => {
      const body = {
        ...payload,
        category: payload.category || null,
        excerpt: payload.excerpt || null,
        featuredImageUrl: payload.featuredImageUrl || null,
        publishedAt: payload.status === "published" ? new Date().toISOString() : null,
      };

      if (editingItem) {
        return apiRequest("PATCH", `/api/admin/content/${editingItem.id}`, body);
      }

      return apiRequest("POST", "/api/admin/content", body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      setOpen(false);
      setEditingItem(null);
      setForm(emptyForm);
      toast({
        title: editingItem ? "Article updated" : "Article created",
        description: "The content item is now available in the management queue.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Content save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (item: ContentItem) =>
      apiRequest("PATCH", `/api/admin/content/${item.id}`, {
        title: item.title,
        slug: item.slug,
        content: item.content,
        excerpt: item.excerpt,
        featuredImageUrl: item.featuredImageUrl,
        category: item.category,
        tags: item.tags,
        status: "archived",
        publishedAt: item.publishedAt,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      toast({
        title: "Article archived",
        description: "The item was moved out of the active publishing queue.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Archive failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      slug: item.slug,
      category: item.category ?? "",
      excerpt: item.excerpt ?? "",
      content: item.content,
      featuredImageUrl: item.featuredImageUrl ?? "",
      status: item.status,
    });
    setOpen(true);
  };

  if (isLoading) {
    return <div>Loading content...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">
            Publish educational articles, marketing updates, and branch communications.
          </p>
        </div>
        <Button className="hover-elevate active-elevate-2" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Article
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{content.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles & Pages</CardTitle>
          <CardDescription>
            Create and maintain public-facing content across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">/{item.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.category || "General"}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "published" ? "default" : "secondary"}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.publishedAt ? format(new Date(item.publishedAt), "MMM d, yyyy") : "Draft"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        disabled={archiveMutation.isPending}
                        onClick={() => archiveMutation.mutate(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {content.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No content items found. Start by creating a new article.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Article" : "Create New Article"}</DialogTitle>
            <DialogDescription>
              Draft, publish, or archive customer-facing content and marketing updates.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                    slug:
                      current.slug === "" || current.slug === slugify(current.title)
                        ? slugify(event.target.value)
                        : current.slug,
                  }))
                }
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="article-slug">Slug</Label>
                <Input
                  id="article-slug"
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: slugify(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-category">Category</Label>
                <Input
                  id="article-category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="article-excerpt">Excerpt</Label>
              <Textarea
                id="article-excerpt"
                rows={3}
                value={form.excerpt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, excerpt: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="article-content">Content</Label>
              <Textarea
                id="article-content"
                rows={8}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({ ...current, content: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="article-image">Featured Image URL</Label>
                <Input
                  id="article-image"
                  value={form.featuredImageUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      featuredImageUrl: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="article-status">Status</Label>
                <select
                  id="article-status"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as ContentFormState["status"],
                    }))
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending || !form.title || !form.slug || !form.content}
            >
              <FileText className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : editingItem ? "Save Changes" : "Create Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
