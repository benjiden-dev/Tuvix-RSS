import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ArticleItem } from "./article-item";
import type { RouterOutputs } from "@/lib/api/trpc";

type Article = RouterOutputs["articles"]["list"]["items"][number];

interface AnimatedArticleListProps {
  articles: Article[];
  newArticleIds?: Set<number>; // IDs of articles that should animate in as "new"
  children?: React.ReactNode; // For infinite scroll trigger
  className?: string;
}

export function AnimatedArticleList({
  articles,
  newArticleIds = new Set(),
  children,
  className,
}: AnimatedArticleListProps) {
  // Track if we've rendered articles before to detect initial load
  const hasRenderedRef = React.useRef(false);
  const isInitialLoad = !hasRenderedRef.current && articles.length > 0;

  React.useEffect(() => {
    if (articles.length > 0) {
      hasRenderedRef.current = true;
    }
  }, [articles.length]);

  return (
    <motion.div
      className={cn("flex flex-col gap-4", className)}
      initial={false}
      transition={
        isInitialLoad
          ? {
              staggerChildren: 0.05,
              delayChildren: 0,
            }
          : undefined
      }
    >
      <AnimatePresence mode="popLayout">
        {articles.map((article, index) => {
          const isNew = newArticleIds.has(article.id);
          // Only stagger first 20 articles on initial load
          const shouldStagger = isInitialLoad && index < 20;

          return (
            <motion.div
              key={article.id}
              initial={
                isNew
                  ? { scale: 0.8, opacity: 0, y: -20 }
                  : shouldStagger
                    ? { y: 20, opacity: 0 }
                    : false
              }
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={
                isNew
                  ? {
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }
                  : shouldStagger
                    ? {
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }
                    : {
                        duration: 0.2,
                      }
              }
              layout
            >
              <ArticleItem article={article} />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {children}
    </motion.div>
  );
}
