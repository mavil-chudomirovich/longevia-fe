export interface KnowledgeChatCitation {
  chapterNumber: number;
  chapterTitle: string;
  bookPage: number;
  quote: string;
  sourceFile: string;
  verified: boolean;
}

export type KnowledgeChatRole = 'user' | 'assistant';

export interface KnowledgeChatMessage {
  id: string;
  role: KnowledgeChatRole;
  content: string;
  citations: KnowledgeChatCitation[];
  abstainReason: string;
  createdAt: Date | null;
}

export interface KnowledgeConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: Date | null;
}

export interface KnowledgeConversationDetail {
  id: string;
  title: string;
  messages: KnowledgeChatMessage[];
}
