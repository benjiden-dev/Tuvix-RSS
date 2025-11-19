import { useCreateSubscription } from "@/lib/hooks/useData";
import { useRefreshFeeds } from "@/lib/hooks/useArticles";
import { FeedAvatar } from "@/components/app/feed-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface FeedSuggestion {
  url: string;
  title: string;
  description: string;
  iconUrl?: string;
}

const SUGGESTED_FEEDS: FeedSuggestion[] = [
  {
    url: "https://news.ycombinator.com/rss",
    title: "Hacker News",
    description: "Links for the intellectually curious, ranked by readers",
    iconUrl: "https://icons.duckduckgo.com/ip3/news.ycombinator.com.ico",
  },
  {
    url: "https://www.reddit.com/r/news/.rss",
    title: "Reddit News",
    description: "Breaking news and current events from Reddit",
    iconUrl: "https://icons.duckduckgo.com/ip3/reddit.com.ico",
  },
  {
    url: "https://news.yahoo.com/rss/finance",
    title: "Yahoo Finance",
    description: "Latest financial news and market updates",
    iconUrl: "https://icons.duckduckgo.com/ip3/yahoo.com.ico",
  },
  {
    url: "https://www.nasa.gov/news-release/feed/",
    title: "NASA News",
    description: "Latest news releases from NASA",
    iconUrl: "https://icons.duckduckgo.com/ip3/nasa.gov.ico",
  },
];

interface FeedSuggestionsProps {
  className?: string;
}

export function FeedSuggestions({ className }: FeedSuggestionsProps) {
  const createSubscription = useCreateSubscription();
  const refreshFeeds = useRefreshFeeds();
  const queryClient = useQueryClient();
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  const handleAddFeed = async (feed: FeedSuggestion) => {
    if (addingIds.has(feed.url)) return;

    setAddingIds((prev) => new Set(prev).add(feed.url));

    try {
      await createSubscription.mutateAsync({
        url: feed.url,
        customTitle: feed.title,
        iconUrl: feed.iconUrl,
        iconType: feed.iconUrl ? "auto" : "none",
      });

      refreshFeeds.mutate();

      // Clear any existing timeout
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }

      // Delayed refetch of articles to show new articles smoothly
      refetchTimeoutRef.current = setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: [["trpc"], ["articles", "list"]],
        });
        toast.info("Checking for new articles...");
        refetchTimeoutRef.current = null;
      }, 5000); // 5 second delay

      toast.success(`Added ${feed.title}`);
    } catch (error) {
      console.error("Failed to add feed:", error);
      toast.error(`Failed to add ${feed.title}`);
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(feed.url);
        return next;
      });
    }
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Get Started</h2>
        <p className="text-sm text-muted-foreground">
          Add some popular feeds to get started
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUGGESTED_FEEDS.map((feed) => {
          const isAdding = addingIds.has(feed.url);
          return (
            <Card key={feed.url} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FeedAvatar
                      feedName={feed.title}
                      iconUrl={feed.iconUrl}
                      feedUrl={feed.url}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{feed.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {feed.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleAddFeed(feed)}
                    disabled={isAdding || createSubscription.isPending}
                    aria-label={`Add ${feed.title}`}
                  >
                    {isAdding ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
