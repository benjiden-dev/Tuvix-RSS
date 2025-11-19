import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeedAvatarProps {
  feedName: string;
  iconUrl?: string | null;
  iconPath?: string | null;
  feedUrl?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function FeedAvatar({
  feedName,
  iconUrl,
  iconPath,
  feedUrl,
  size = "md",
  className = "",
}: FeedAvatarProps) {
  // Get the first letter of the feed name for fallback
  const fallbackLetter = feedName ? feedName.charAt(0).toUpperCase() : "?";

  // Generate a consistent color based on feed name
  const getColorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 50%)`;
  };

  // Determine the icon URL to use
  const getIconUrl = (): string | undefined => {
    // Priority 1: Explicit iconUrl
    if (iconUrl) {
      return iconUrl;
    }

    // Priority 2: iconPath (construct full URL)
    if (iconPath) {
      const baseUrl =
        import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
      return `${baseUrl}/icons/icons/${iconPath}`;
    }

    // Priority 3: DuckDuckGo favicon API from feed URL
    if (feedUrl) {
      try {
        const url = new URL(feedUrl);
        return `https://icons.duckduckgo.com/ip3/${url.hostname}.ico`;
      } catch {
        // Invalid URL, will use fallback
      }
    }

    return undefined;
  };

  const finalIconUrl = getIconUrl();

  const sizeClasses = {
    xs: "h-5 w-5 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {finalIconUrl && (
        <AvatarImage
          src={finalIconUrl}
          alt={`${feedName} icon`}
          className="object-cover"
        />
      )}
      <AvatarFallback
        style={{ backgroundColor: getColorFromName(feedName) }}
        className="text-white font-semibold"
      >
        {fallbackLetter}
      </AvatarFallback>
    </Avatar>
  );
}
