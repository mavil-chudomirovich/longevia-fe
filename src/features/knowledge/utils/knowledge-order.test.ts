import { describe, expect, it } from 'vitest';
import { dedupeSnippets, sortByBookOrder, sortCitations } from './knowledge-order';
import type { KnowledgeCitationModel, KnowledgeSnippetModel } from '../types/knowledge.model';

function snippet(chapterNumber: number, bookPage: number, text: string): KnowledgeSnippetModel {
  return {
    chapterNumber,
    chapterTitle: `Chương ${chapterNumber}`,
    bookPage,
    pdfPage: bookPage,
    text,
    score: 0.5,
    verified: true,
  };
}

function citation(chapterNumber: number, bookPage: number): KnowledgeCitationModel {
  return {
    chapterNumber,
    chapterTitle: `Chương ${chapterNumber}`,
    bookPage,
    pdfPage: bookPage,
    quote: 'trích đoạn',
    verified: true,
    sourceFile: 'sach.pdf',
  };
}

describe('knowledge-order', () => {
  it('sắp theo chương rồi trang tăng dần', () => {
    const sorted = sortByBookOrder([snippet(3, 20, 'c'), snippet(1, 90, 'b'), snippet(1, 12, 'a')]);
    expect(sorted.map((item) => `${item.chapterNumber}:${item.bookPage}`)).toEqual([
      '1:12',
      '1:90',
      '3:20',
    ]);
  });

  it('không sửa mảng gốc', () => {
    const original = [snippet(2, 5, 'x'), snippet(1, 5, 'y')];
    const copy = [...original];
    sortByBookOrder(original);
    expect(original).toEqual(copy);
  });

  it('loại snippet trùng nội dung sau khi sắp xếp', () => {
    const result = dedupeSnippets([
      snippet(2, 10, 'giống'),
      snippet(1, 5, 'giống'),
      snippet(1, 5, 'giống'),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ chapterNumber: 1, bookPage: 5 });
  });

  it('sắp citation theo trang sách', () => {
    expect(
      sortCitations([citation(4, 10), citation(2, 30)]).map((item) => item.chapterNumber)
    ).toEqual([2, 4]);
  });
});
