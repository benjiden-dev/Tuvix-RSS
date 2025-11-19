// tRPC Hooks for Categories, Subscriptions, Feeds
import { toast } from "sonner";
import { trpc } from "../api/trpc";

// Categories
export const useCategories = () => {
  return trpc.categories.list.useQuery();
};

export const useCategory = (id: number) => {
  return trpc.categories.getById.useQuery({ id });
};

export const useCreateCategory = () => {
  const utils = trpc.useUtils();

  return trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("Category created");
    },
    onError: () => {
      toast.error("Failed to create category");
    },
  });
};

export const useUpdateCategory = () => {
  const utils = trpc.useUtils();

  return trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.invalidate();
      toast.success("Category updated");
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });
};

export const useDeleteCategory = () => {
  const utils = trpc.useUtils();

  return trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.invalidate();
      toast.success("Category deleted");
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });
};

// Subscriptions
export const useSubscriptions = () => {
  return trpc.subscriptions.list.useQuery({ limit: 100, offset: 0 });
};

export const useSubscription = (id: number) => {
  return trpc.subscriptions.getById.useQuery({ id });
};

export const useCreateSubscription = () => {
  const utils = trpc.useUtils();

  return trpc.subscriptions.create.useMutation({
    onSuccess: () => {
      utils.subscriptions.list.invalidate();
      utils.categories.list.invalidate();
      toast.success("Subscription added");
    },
    onError: () => {
      toast.error("Failed to add subscription");
    },
  });
};

export const useUpdateSubscription = () => {
  const utils = trpc.useUtils();

  return trpc.subscriptions.update.useMutation({
    onSuccess: () => {
      utils.subscriptions.invalidate();
      utils.categories.list.invalidate();
      toast.success("Subscription updated");
    },
    onError: () => {
      toast.error("Failed to update subscription");
    },
  });
};

export const useDeleteSubscription = () => {
  const utils = trpc.useUtils();

  return trpc.subscriptions.delete.useMutation({
    onSuccess: () => {
      utils.subscriptions.invalidate();
      toast.success("Unsubscribed");
    },
    onError: () => {
      toast.error("Failed to unsubscribe");
    },
  });
};

// Feeds
export const useFeeds = () => {
  return trpc.feeds.list.useQuery({ limit: 100, offset: 0 });
};

export const useFeed = (id: number) => {
  return trpc.feeds.getById.useQuery({ id });
};

export const useFeedByCategoryId = (categoryId: number) => {
  return trpc.feeds.getByCategoryId.useQuery({ categoryId });
};

export const useCreateFeed = () => {
  const utils = trpc.useUtils();

  return trpc.feeds.create.useMutation({
    onSuccess: () => {
      utils.feeds.list.invalidate();
      toast.success("Feed created");
    },
    onError: () => {
      toast.error("Failed to create feed");
    },
  });
};

export const useUpdateFeed = () => {
  const utils = trpc.useUtils();

  return trpc.feeds.update.useMutation({
    onSuccess: () => {
      utils.feeds.invalidate();
      toast.success("Feed updated");
    },
    onError: () => {
      toast.error("Failed to update feed");
    },
  });
};

export const useDeleteFeed = () => {
  const utils = trpc.useUtils();

  return trpc.feeds.delete.useMutation({
    onSuccess: () => {
      utils.feeds.invalidate();
      toast.success("Feed deleted");
    },
    onError: () => {
      toast.error("Failed to delete feed");
    },
  });
};

// Subscription Filters
export const useSubscriptionFilters = (subscriptionId: number) => {
  return trpc.subscriptions.listFilters.useQuery({ subscriptionId });
};

export const useCreateSubscriptionFilter = (subscriptionId: number) => {
  const utils = trpc.useUtils();

  return trpc.subscriptions.createFilter.useMutation({
    onSuccess: () => {
      utils.subscriptions.listFilters.invalidate({ subscriptionId });
      utils.subscriptions.getById.invalidate({ id: subscriptionId });
      toast.success("Filter created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create filter");
    },
  });
};

export const useUpdateSubscriptionFilter = (subscriptionId: number) => {
  const utils = trpc.useUtils();

  return trpc.subscriptions.updateFilter.useMutation({
    onSuccess: () => {
      utils.subscriptions.listFilters.invalidate({ subscriptionId });
      utils.subscriptions.getById.invalidate({ id: subscriptionId });
      toast.success("Filter updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update filter");
    },
  });
};

export const useDeleteSubscriptionFilter = (subscriptionId: number) => {
  const utils = trpc.useUtils();

  return trpc.subscriptions.deleteFilter.useMutation({
    onSuccess: () => {
      utils.subscriptions.listFilters.invalidate({ subscriptionId });
      utils.subscriptions.getById.invalidate({ id: subscriptionId });
      toast.success("Filter deleted");
    },
    onError: () => {
      toast.error("Failed to delete filter");
    },
  });
};
