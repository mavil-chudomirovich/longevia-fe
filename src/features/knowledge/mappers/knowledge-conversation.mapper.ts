import { pickField, safeArray, safeBoolean, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type {
  KnowledgeCitationDto,
  KnowledgeConversationDetailDto,
  KnowledgeConversationSummaryDto,
  KnowledgeMessageDto,
} from '../types/knowledge-conversation.dto';
import type {
  KnowledgeChatCitation,
  KnowledgeChatMessage,
  KnowledgeChatRole,
  KnowledgeConversationDetail,
  KnowledgeConversationSummary,
} from '../types/knowledge-conversation.model';

export function toKnowledgeCitation(dto: KnowledgeCitationDto): KnowledgeChatCitation {
  return {
    chapterNumber: safeNumber(pickField(dto, ['chapterNumber'], 0)),
    chapterTitle: safeString(pickField(dto, ['chapterTitle'], '')),
    bookPage: safeNumber(pickField(dto, ['bookPage'], 0)),
    quote: safeString(pickField(dto, ['quote'], '')),
    sourceFile: safeString(pickField(dto, ['sourceFile'], '')),
    verified: safeBoolean(pickField(dto, ['verified'], false)),
  };
}

function role(value: string): KnowledgeChatRole {
  return value === 'assistant' ? 'assistant' : 'user';
}

export const knowledgeConversationMapper = {
  toSummary(dto: KnowledgeConversationSummaryDto | null | undefined): KnowledgeConversationSummary {
    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(pickField(dto, ['title'], 'Hội thoại')),
      messageCount: safeNumber(pickField(dto, ['messageCount'], 0)),
      updatedAt: safeDate(pickField(dto, ['updatedAt'], null)),
    };
  },

  toSummaryList(
    list: KnowledgeConversationSummaryDto[] | null | undefined
  ): KnowledgeConversationSummary[] {
    return safeArray<KnowledgeConversationSummaryDto>(list ?? []).map((item) =>
      this.toSummary(item)
    );
  },

  toMessage(dto: KnowledgeMessageDto): KnowledgeChatMessage {
    return {
      id: safeString(pickField(dto, ['id'], '')),
      role: role(safeString(pickField(dto, ['role'], 'user'))),
      content: safeString(pickField(dto, ['content'], '')),
      citations: safeArray<KnowledgeCitationDto>(dto.citations ?? []).map(toKnowledgeCitation),
      abstainReason: safeString(pickField(dto, ['abstainReason'], '')),
      createdAt: safeDate(pickField(dto, ['createdAt'], null)),
    };
  },

  toDetail(dto: KnowledgeConversationDetailDto | null | undefined): KnowledgeConversationDetail {
    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(pickField(dto, ['title'], 'Hội thoại')),
      messages: safeArray<KnowledgeMessageDto>(dto?.messages ?? []).map((item) =>
        this.toMessage(item)
      ),
    };
  },
};
