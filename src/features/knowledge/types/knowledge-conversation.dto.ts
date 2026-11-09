export interface KnowledgeCitationDto {
  chapterNumber?: number;
  chapterTitle?: string;
  bookPage?: number;
  pdfPage?: number;
  quote?: string;
  verified?: boolean;
  sourceFile?: string;
}

export interface KnowledgeMessageDto {
  id?: string;
  role?: string;
  content?: string;
  citations?: KnowledgeCitationDto[] | null;
  abstainReason?: string;
  createdAt?: string;
}

export interface KnowledgeConversationSummaryDto {
  id?: string;
  title?: string;
  messageCount?: number;
  updatedAt?: string;
}

export interface KnowledgeConversationDetailDto {
  id?: string;
  title?: string;
  messages?: KnowledgeMessageDto[] | null;
}

export interface SseDeltaPayload {
  text?: string;
}

export interface SseDonePayload {
  conversationId?: string;
  messageId?: string;
  abstained?: boolean;
  abstainReason?: string;
  disclaimer?: string;
}

export interface SseErrorPayload {
  code?: string;
  message?: string;
}
