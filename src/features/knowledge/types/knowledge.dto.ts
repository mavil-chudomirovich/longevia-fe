export interface KnowledgeCitationDto {
  chapterNumber?: number;
  chapterTitle?: string;
  bookPage?: number;
  pdfPage?: number;
  quote?: string;
  verified?: boolean;
  sourceFile?: string;
}

export interface KnowledgeAnswerDto {
  answer?: string;
  citations?: KnowledgeCitationDto[] | null;
  abstained?: boolean;
  abstainReason?: string;
  disclaimer?: string;
}

export interface KnowledgeSnippetDto {
  chapterNumber?: number;
  chapterTitle?: string;
  bookPage?: number;
  pdfPage?: number;
  text?: string;
  score?: number;
  verified?: boolean;
}

export interface KnowledgeSearchDto {
  snippets?: KnowledgeSnippetDto[] | null;
}
