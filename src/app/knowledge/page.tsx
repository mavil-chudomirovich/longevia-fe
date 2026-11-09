'use client';

import * as React from 'react';
import { BookOpen, Loader2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CitationChipList } from '@/components/shared/citation-chip';
import { InfoTooltip } from '@/components/shared/info-tooltip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  useAskKnowledgeMutation,
  useKnowledgeSearchQuery,
} from '@/features/knowledge/queries/knowledge.queries';
import { dedupeSnippets, sortCitations } from '@/features/knowledge/utils/knowledge-order';

const ABSTAIN_HINTS: Record<string, string> = {
  corpus_not_loaded:
    'Kho tri thức của sách chưa được nạp. Quản trị viên cần chạy bước nạp corpus trước khi hỏi.',
  no_matching_chunk:
    'Thử hỏi cụ thể hơn (ví dụ nêu tên thực phẩm, thói quen hoặc chương muốn tra) để tìm đúng đoạn sách.',
  citation_not_verified:
    'Câu trả lời do AI soạn không khớp nguyên văn với sách nên hệ thống không hiển thị để tránh sai lệch.',
  empty_answer: 'AI không trả về nội dung có thể kiểm chứng, bạn thử hỏi lại theo cách khác nhé.',
  provider_timeout: 'Trợ lý AI phản hồi chậm. Bạn thử lại sau giây lát.',
  provider_unavailable: 'Trợ lý AI tạm thời không sẵn sàng. Bạn thử lại sau giây lát.',
};

export default function KnowledgePage() {
  const [question, setQuestion] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [submittedSearch, setSubmittedSearch] = React.useState('');
  const ask = useAskKnowledgeMutation();
  const searchQuery = useKnowledgeSearchQuery(submittedSearch, null, 8, submittedSearch.length > 0);
  const snippets = React.useMemo(
    () => dedupeSnippets(searchQuery.data?.snippets ?? []),
    [searchQuery.data]
  );

  const submitQuestion = () => {
    const trimmed = question.trim();
    if (trimmed.length === 0) return;
    ask.mutate({ question: trimmed, chapterFilter: null });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Hỏi sách</h1>
        <p className="mt-1.5 text-muted-foreground text-pretty">
          Trợ lý chỉ trả lời từ cuốn “Chế độ ăn trường thọ” và luôn kèm trích dẫn để bạn kiểm chứng.
        </p>
      </div>

      <Tabs defaultValue="ask" className="mt-6">
        <TabsList>
          <TabsTrigger value="ask" className="gap-1.5">
            <Sparkles className="size-4" aria-hidden="true" />
            Hỏi sách
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-1.5">
            <Search className="size-4" aria-hidden="true" />
            Tra cứu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ask" className="mt-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label htmlFor="knowledge-question" className="text-sm font-medium">
                  Câu hỏi của bạn
                </label>
                <Textarea
                  id="knowledge-question"
                  className="min-h-28"
                  placeholder="Ví dụ: Nhịn ăn gián đoạn 16:8 có lợi ích gì?"
                  value={question}
                  maxLength={500}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                      submitQuestion();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Ctrl/⌘ + Enter để gửi. Câu trả lời chỉ dựa trên nội dung sách.
                </p>
              </div>
              <Button
                onClick={submitQuestion}
                disabled={ask.isPending || question.trim().length === 0}
                className="gap-1.5"
              >
                {ask.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Đang tìm trong sách…
                  </>
                ) : (
                  'Hỏi sách'
                )}
              </Button>
              {ask.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {getApiErrorMessage(ask.error, 'Chưa trả lời được lúc này.')}
                </p>
              )}
              {ask.data && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                  {ask.data.abstained ? (
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">Chưa trả lời được câu hỏi này</p>
                      <MarkdownText content={ask.data.answer} className="text-muted-foreground" />
                      {ABSTAIN_HINTS[ask.data.abstainReason] && (
                        <p className="text-xs text-muted-foreground">
                          {ABSTAIN_HINTS[ask.data.abstainReason]}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <MarkdownText content={ask.data.answer} />
                      <CitationChipList citations={sortCitations(ask.data.citations)} />
                    </>
                  )}
                  {ask.data.disclaimer && (
                    <p className="text-xs text-muted-foreground">{ask.data.disclaimer}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tra cứu đoạn sách</CardTitle>
              <CardDescription>
                Kết quả được sắp theo thứ tự chương và trang để bạn đọc liền mạch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Nhập chủ đề, ví dụ: omega-3"
                  value={search}
                  maxLength={300}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setSubmittedSearch(search.trim());
                  }}
                />
                <Button
                  onClick={() => setSubmittedSearch(search.trim())}
                  disabled={search.trim().length === 0 || searchQuery.isFetching}
                  className="gap-1.5"
                >
                  {searchQuery.isFetching ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="size-4" aria-hidden="true" />
                  )}
                  Tìm
                </Button>
              </div>

              {searchQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Đang tra cứu…</p>
              ) : searchQuery.isError ? (
                <p role="alert" className="text-sm text-destructive">
                  {getApiErrorMessage(searchQuery.error, 'Chưa tra cứu được lúc này.')}
                </p>
              ) : snippets.length > 0 ? (
                <ul className="space-y-3">
                  {snippets.map((snippet, index) => (
                    <li
                      key={`${snippet.chapterNumber}-${snippet.bookPage}-${index}`}
                      className="rounded-lg border border-border/60 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <BookOpen className="size-4 text-primary" aria-hidden="true" />
                        <p className="text-sm font-medium">
                          Chương {snippet.chapterNumber}
                          {snippet.chapterTitle ? `: ${snippet.chapterTitle}` : ''}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          tr. {snippet.bookPage}
                        </span>
                        <InfoTooltip
                          label="Điểm tương đồng với câu truy vấn"
                          content={`Điểm tương đồng: ${snippet.score.toFixed(2)} (chỉ dùng để xếp hạng, không phải đánh giá chất lượng nội dung).`}
                        />
                      </div>
                      <MarkdownText
                        content={snippet.text}
                        compact
                        className="mt-2 text-muted-foreground"
                      />
                    </li>
                  ))}
                </ul>
              ) : submittedSearch ? (
                <p className="text-sm text-muted-foreground">Không tìm thấy đoạn phù hợp.</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nhập chủ đề rồi bấm “Tìm” để xem các đoạn sách liên quan.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
