import { pickField, safeArray, safeBoolean, safeNumber, safeString } from '@/lib/mapper';
import type {
  KnowledgeAnswerDto,
  KnowledgeCitationDto,
  KnowledgeSearchDto,
  KnowledgeSnippetDto,
} from '../types/knowledge.dto';
import type {
  KnowledgeAnswerModel,
  KnowledgeCitationModel,
  KnowledgeSearchModel,
  KnowledgeSnippetModel,
} from '../types/knowledge.model';

const citation = (dto: KnowledgeCitationDto): KnowledgeCitationModel => ({
  chapterNumber: safeNumber(pickField(dto, ['chapterNumber'], 0)),
  chapterTitle: safeString(pickField(dto, ['chapterTitle'], '')),
  bookPage: safeNumber(pickField(dto, ['bookPage'], 0)),
  pdfPage: safeNumber(pickField(dto, ['pdfPage'], 0)),
  quote: safeString(pickField(dto, ['quote'], '')),
  verified: safeBoolean(pickField(dto, ['verified'], false)),
  sourceFile: safeString(pickField(dto, ['sourceFile'], '')),
});

const snippet = (dto: KnowledgeSnippetDto): KnowledgeSnippetModel => ({
  chapterNumber: safeNumber(pickField(dto, ['chapterNumber'], 0)),
  chapterTitle: safeString(pickField(dto, ['chapterTitle'], '')),
  bookPage: safeNumber(pickField(dto, ['bookPage'], 0)),
  pdfPage: safeNumber(pickField(dto, ['pdfPage'], 0)),
  text: safeString(pickField(dto, ['text'], '')),
  score: safeNumber(pickField(dto, ['score'], 0)),
  verified: safeBoolean(pickField(dto, ['verified'], false)),
});

export const knowledgeMapper = {
  toAnswer(dto: KnowledgeAnswerDto | null | undefined): KnowledgeAnswerModel {
    return {
      answer: safeString(pickField(dto, ['answer'], '')),
      citations: safeArray<KnowledgeCitationDto>(dto?.citations ?? []).map(citation),
      abstained: safeBoolean(pickField(dto, ['abstained'], false)),
      abstainReason: safeString(pickField(dto, ['abstainReason'], '')),
      disclaimer: safeString(pickField(dto, ['disclaimer'], '')),
    };
  },
  toSearch(dto: KnowledgeSearchDto | null | undefined): KnowledgeSearchModel {
    return { snippets: safeArray<KnowledgeSnippetDto>(dto?.snippets ?? []).map(snippet) };
  },
};
