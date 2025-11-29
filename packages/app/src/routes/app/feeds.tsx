import { createFileRoute } from "@tanstack/react-router";
import {
  useFeeds,
  useCreateFeed,
  useDeleteFeed,
  useCategories,
} from "@/lib/hooks/useData";
import type { RouterOutputs } from "@/lib/api/trpc";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy, ExternalLink, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { getPublicBaseUrl } from "@/lib/utils";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/components/ui/responsive-alert-dialog";
import { CategoryMultiSelect } from "@/components/app/category-multi-select";

type Feed = RouterOutputs["feeds"]["list"]["items"][number];

export const Route = createFileRoute("/app/feeds")({
  component: FeedsPage,
});

function FeedsPage() {
  const { data: feedsData, isLoading, isError } = useFeeds();
  const { data: categoriesData } = useCategories();
  const feeds = feedsData?.items || [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const createFeed = useCreateFeed();
  const deleteFeed = useDeleteFeed();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    public: true,
    categoryIds: [] as number[],
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const handleAdd = () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error("Title and slug are required");
      return;
    }

    createFeed.mutate(formData, {
      onSuccess: () => {
        setFormData({
          title: "",
          slug: "",
          description: "",
          public: true,
          categoryIds: [],
        });
        setShowAddForm(false);
      },
    });
  };

  const handleDelete = (id: number, title: string) => {
    setFeedToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (feedToDelete) {
      deleteFeed.mutate({ id: feedToDelete.id });
      setDeleteDialogOpen(false);
      setFeedToDelete(null);
    }
  };

  const handleCopyUrl = (username: string, slug: string) => {
    const url = `${getPublicBaseUrl()}/public/${username}/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Feed URL copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Public Feeds</h1>
          <p className="text-muted-foreground text-sm">
            Create custom RSS feeds to share with others
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 size-4" />
          Create Feed
        </Button>
      </div>

      {/* Info Callout */}
      <Alert>
        <Info className="size-4" />
        <AlertTitle>Looking for something simpler?</AlertTitle>
        <AlertDescription>
          If you want to share all articles from a single category, you can{" "}
          <Link
            to="/app/categories"
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            make a category public
          </Link>{" "}
          instead. Custom feeds are best for combining multiple categories or
          creating advanced filtered feeds.
        </AlertDescription>
      </Alert>

      {/* Add Form */}
      {showAddForm && (
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">Create Public Feed</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="My Custom Feed"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-"),
                  })
                }
                placeholder="my-custom-feed"
                className="w-full p-2 border rounded-md font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL-friendly identifier (lowercase, hyphens only)
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="A curated feed of my favorite articles"
                className="w-full p-2 border rounded-md min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Categories (Optional)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Select which categories to include in this feed
              </p>
              <CategoryMultiSelect
                categories={categories}
                selectedIds={formData.categoryIds}
                onChange={(categoryIds) =>
                  setFormData({ ...formData, categoryIds })
                }
                disabled={createFeed.isPending}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={createFeed.isPending}>
              {createFeed.isPending ? "Creating..." : "Create"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setFormData({
                  title: "",
                  slug: "",
                  description: "",
                  public: true,
                  categoryIds: [],
                });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading feeds, please wait</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Alert role="alert" className="text-center py-12">
          <AlertTitle>Error loading feeds</AlertTitle>
          <AlertDescription>
            Failed to load feeds. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !isError && feeds?.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No public feeds yet</p>
          <p className="text-muted-foreground text-sm mt-2">
            Create a custom feed to share your curated content
          </p>
        </div>
      )}

      {/* Feeds List */}
      {!isLoading && feeds && feeds.length > 0 && (
        <div className="space-y-4">
          {feeds.map((feed: Feed) => (
            <div
              key={feed.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{feed.title}</h3>
                    {feed.categoryIds && feed.categoryIds.length === 1 && (
                      <Badge variant="outline">Single Category</Badge>
                    )}
                    {feed.categoryIds && feed.categoryIds.length > 1 && (
                      <Badge variant="outline">
                        {feed.categoryIds.length} Categories
                      </Badge>
                    )}
                  </div>
                  {feed.description && (
                    <p className="text-sm text-muted-foreground">
                      {feed.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                      /public/{feed.username}/{feed.slug}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyUrl(feed.username, feed.slug)}
                    >
                      <Copy className="size-3 mr-1" />
                      Copy URL
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`/public/${feed.username}/${feed.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3 mr-1" />
                        Open
                      </a>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(feed.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(feed.id, feed.title)}
                    disabled={deleteFeed.isPending}
                    aria-label={`Delete feed ${feed.title}`}
                  >
                    <Trash2
                      className="size-4 text-destructive"
                      aria-hidden="true"
                    />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ResponsiveAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Delete feed</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Are you sure you want to delete "{feedToDelete?.title}"? This
              action cannot be undone.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Cancel</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction onClick={confirmDelete}>
              Delete
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </div>
  );
}
