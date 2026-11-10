'use client';

import * as React from 'react';
import { BookOpen, Loader2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoTooltip } from '@/components/shared/info-tooltip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { getApiErrorMessage } from '@/lib/api-error';
import { KnowledgeChat } from '@/features/knowledge/components/knowledge-chat';
import { useKnowledgeSearchQuery } from '@/features/knowledge/queries/knowledge.queries';
import { dedupeSnippets } from '@/features/knowledge/utils/knowledge-order';

export default function KnowledgePage() {
  const [search, setSearch] = React.useState('');
  const [submittedSearch, setSubmittedSearch] = React.useState('');
  const searchQuery = useKnowledgeSearchQuery(submittedSearch, null, 8, submittedSearch.length > 0);
  const snippets = React.useMemo(
    () => dedupeSnippets(searchQuery.data?.snippets ?? []),
    [searchQuery.data]
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Tabs defaultValue="ask">
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
          <KnowledgeChat />
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
