import type {
  KnowledgeCitationModel,
  KnowledgeSnippetModel,
} from '@/features/knowledge/types/knowledge.model';

/**
 * Sách được đọc theo thứ tự chương rồi trang. Backend trả snippet theo điểm
 * tương đồng (retrieval) nên UI phải sắp lại, nếu không người đọc thấy trang
 * nhảy lung tung.
 */
export function sortByBookOrder<T extends { chapterNumber: number; bookPage: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => a.chapterNumber - b.chapterNumber || a.bookPage - b.bookPage);
}

export function sortCitations(citations: KnowledgeCitationModel[]): KnowledgeCitationModel[] {
  return sortByBookOrder(citations);
}

export function dedupeSnippets(snippets: KnowledgeSnippetModel[]): KnowledgeSnippetModel[] {
  const seen = new Set<string>();
  const result: KnowledgeSnippetModel[] = [];
  for (const snippet of sortByBookOrder(snippets)) {
    const key = `${snippet.chapterNumber}:${snippet.bookPage}:${snippet.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(snippet);
  }
  return result;
}
