import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import type { ImporterImportJob } from "@/lib/api/generated/types.gen";

export function ImportProgressCard({ job }: { job: ImporterImportJob }) {
  return (
    <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Importing Feeds</h3>
        <Badge
          variant={
            job.status === "processing"
              ? "default"
              : job.status === "completed"
                ? "secondary"
                : "secondary"
          }
        >
          {job.status === "processing" && (
            <Loader2 className="size-3 mr-1 animate-spin" />
          )}
          {job.status}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {job.imported_count + job.skipped_count} / {job.total_feeds}{" "}
            processed
          </span>
          <span className="font-medium">{job.progress}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${job.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-green-500" />
          <span>
            <strong>{job.imported_count}</strong> imported
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-yellow-500" />
          <span>
            <strong>{job.skipped_count}</strong> skipped
          </span>
        </div>
        {job.error_count > 0 && (
          <div className="flex items-center gap-2">
            <XCircle className="size-4 text-red-500" />
            <span>
              <strong>{job.error_count}</strong> errors
            </span>
          </div>
        )}
        {job.categories_discovered > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {job.categories_discovered} categories discovered
            </Badge>
          </div>
        )}
      </div>

      {/* Recently Imported Feeds */}
      {job.imported_feeds.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Recently Imported:
          </p>
          <div className="space-y-2">
            {job.imported_feeds
              .slice(-5)
              .reverse()
              .map((feed, i) => (
                <motion.div
                  key={feed.url}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 text-sm p-2 rounded-md bg-card"
                >
                  {feed.status === "imported" && (
                    <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  )}
                  {feed.status === "skipped" && (
                    <AlertCircle className="size-4 text-yellow-500 shrink-0" />
                  )}
                  {feed.status === "error" && (
                    <XCircle className="size-4 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{feed.title}</p>
                    {feed.categories && feed.categories.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {feed.categories.slice(0, 3).map((category) => (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="text-xs"
                          >
                            {category}
                          </Badge>
                        ))}
                        {feed.categories.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{feed.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
