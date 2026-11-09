import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { knowledgeMapper } from '../mappers/knowledge.mapper';
import type { KnowledgeAnswerDto, KnowledgeSearchDto } from '../types/knowledge.dto';
import type { KnowledgeAnswerModel, KnowledgeSearchModel } from '../types/knowledge.model';

export const knowledgeApi = {
  ask: async (
    question: string,
    chapterFilter: number | null | undefined,
    signal: AbortSignal
  ): Promise<KnowledgeAnswerModel> => {
    const response = await api.post<KnowledgeAnswerDto>(
      API_ENDPOINTS.DIET.KNOWLEDGE_ASK,
      { question, chapterFilter: chapterFilter ?? null },
      { signal, silent: true }
    );
    return knowledgeMapper.toAnswer(response.data);
  },
  search: async (
    query: string,
    chapterFilter: number | null | undefined,
    topK: number,
    signal: AbortSignal
  ): Promise<KnowledgeSearchModel> => {
    const response = await api.get<KnowledgeSearchDto>(API_ENDPOINTS.DIET.KNOWLEDGE_SEARCH, {
      params: { query, chapterFilter: chapterFilter ?? undefined, topK },
      signal,
      silent: true,
    });
    return knowledgeMapper.toSearch(response.data);
  },
};
