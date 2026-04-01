import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ContentItem } from "@shared/schema";
import { MarketingLayout } from "@/components/MarketingLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BLOG_ARTICLES, MARKETING_IMAGES } from "@/lib/marketingContent";

const WORDS_PER_MINUTE = 200;
const FALLBACK_IMAGES = [
  MARKETING_IMAGES.brandWave,
  MARKETING_IMAGES.brandGrid,
  MARKETING_IMAGES.brandRibbon,
  MARKETING_IMAGES.brandPulse,
  MARKETING_IMAGES.consultationScene,
];

function estimateReadTime(content?: string | null) {
  if (!content) {
    return "4 min read";
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.ceil(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

export default function BlogPage() {
  const { data: apiArticles = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/public"],
    staleTime: 5 * 60 * 1000,
  });

  const articleCards = useMemo(() => {
    if (apiArticles.length > 0) {
      return apiArticles.map((article, index) => ({
        id: article.id,
        title: article.title,
        category: article.category || "Insights",
        readTime: estimateReadTime(article.content),
        excerpt:
          article.excerpt ||
          `${article.content.replace(/\s+/g, " ").slice(0, 140).trim()}...`,
        image: article.featuredImageUrl || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
      }));
    }

    return BLOG_ARTICLES;
  }, [apiArticles]);

  const isFallback = !isLoading && apiArticles.length === 0;

  return (
    <MarketingLayout>
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Blog and Articles</Badge>
        <h1 className="mt-6 text-4xl font-bold md:text-5xl">Insights from modern pharmacy operations</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Practical playbooks, delivery updates, and clinical workflow guidance from the Thandizo team.
        </p>
        {isFallback && (
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Showing sample articles. Publish real content from the admin content studio to update this feed.
          </p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articleCards.map((article) => (
            <Card key={article.id} className="overflow-hidden border-border/70 shadow-sm">
              <img
                src={article.image}
                alt={article.title}
                className="h-44 w-full object-cover"
                loading="lazy"
              />
              <CardContent className="p-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium uppercase tracking-[0.2em] text-primary">
                    {article.category}
                  </span>
                  <span>{article.readTime}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{article.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{article.excerpt}</p>
                <Button variant="outline" className="mt-6" size="sm">
                  Read Article
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button asChild size="lg">
            <a href="/sign-up">Start with your role</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
