export interface KnowledgeCitationModel {
  chapterNumber: number;
  chapterTitle: string;
  bookPage: number;
  pdfPage: number;
  quote: string;
  verified: boolean;
  sourceFile: string;
}

export interface KnowledgeAnswerModel {
  answer: string;
  citations: KnowledgeCitationModel[];
  abstained: boolean;
  abstainReason: string;
  disclaimer: string;
}

export interface KnowledgeSnippetModel {
  chapterNumber: number;
  chapterTitle: string;
  bookPage: number;
  pdfPage: number;
  text: string;
  score: number;
  verified: boolean;
}

export interface KnowledgeSearchModel {
  snippets: KnowledgeSnippetModel[];
}
