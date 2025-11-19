import { createFileRoute, redirect } from "@tanstack/react-router";

// @ts-expect-error - Route type generation issue
export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    throw redirect({
      to: "/app/articles",
      search: {
        category_id: undefined,
      } satisfies { category_id?: number },
    });
  },
});
