import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { knowledgeApi } from '../api/knowledge.api';

export const knowledgeKeys = {
  all: ['knowledge'] as const,
  search: (query: string, chapterFilter: number | null, topK: number) =>
    [...knowledgeKeys.all, 'search', query, chapterFilter, topK] as const,
};

export function useAskKnowledgeMutation() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return useMutation({
    mutationFn: async (input: { question: string; chapterFilter: number | null }) => {
      if (!authenticated) throw new Error('Bạn cần đăng nhập để hỏi sách.');
      const controller = new AbortController();
      return knowledgeApi.ask(input.question, input.chapterFilter, controller.signal);
    },
    retry: false,
  });
}

export function useKnowledgeSearchQuery(
  query: string,
  chapterFilter: number | null,
  topK: number,
  enabled: boolean
) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: knowledgeKeys.search(query, chapterFilter, topK),
    queryFn: ({ signal }) => knowledgeApi.search(query, chapterFilter, topK, signal),
    enabled: enabled && authenticated && query.trim().length > 0,
    retry: false,
  });
}
