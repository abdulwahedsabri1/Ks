import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes fresh cache
        gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
        refetchOnWindowFocus: false, // Prevents unnecessary refetches on tab switch
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 5 * 60 * 1000,
    defaultPreloadDelay: 50,
  });

  return router;
};

