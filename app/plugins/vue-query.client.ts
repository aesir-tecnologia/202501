import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - unused data kept in cache (formerly cacheTime)
        retry: 1, // Retry failed requests once
        refetchOnWindowFocus: true, // Refetch when window regains focus
      },
      mutations: {
        onError: (error) => {
          console.error('Mutation error:', error);
          // Component-level error handling is preferred for custom messages
        },
      },
    },
  });

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient });

  // Install devtools in development mode
  if (import.meta.dev) {
    import('@tanstack/vue-query-devtools').then(({ VueQueryDevtools }) => {
      nuxtApp.vueApp.component('VueQueryDevtools', VueQueryDevtools);
    });
  }
});
