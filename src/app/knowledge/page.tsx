'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  useAskKnowledgeMutation,
  useKnowledgeSearchQuery,
} from '@/features/knowledge/queries/knowledge.queries';

export default function KnowledgePage() {
  const [tab, setTab] = React.useState<'ask' | 'search'>('ask');
  const [question, setQuestion] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [submittedSearch, setSubmittedSearch] = React.useState('');
  const ask = useAskKnowledgeMutation();
  const searchQuery = useKnowledgeSearchQuery(submittedSearch, null, 8, tab === 'search');

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Tri thức sách “Chế độ ăn trường thọ”</h1>
          <p className="mt-1 text-muted-foreground">
            Hỏi hoặc tra cứu; câu trả lời chỉ dựa trên nội dung sách và có trích dẫn.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/diet">Về dinh dưỡng</Link>
        </Button>
      </div>

      <div className="mt-6 flex gap-2">
        <Button variant={tab === 'ask' ? 'default' : 'outline'} onClick={() => setTab('ask')}>
          Hỏi sách
        </Button>
        <Button variant={tab === 'search' ? 'default' : 'outline'} onClick={() => setTab('search')}>
          Tra cứu
        </Button>
      </div>

      {tab === 'ask' ? (
        <Card className="mt-4">
          <CardContent className="space-y-4 pt-6">
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm"
              placeholder="Ví dụ: Nhịn ăn gián đoạn 16:8 có lợi ích gì?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <Button
              onClick={() => ask.mutate({ question, chapterFilter: null })}
              disabled={ask.isPending || question.trim().length < 1}
            >
              {ask.isPending ? 'Đang tìm câu trả lời…' : 'Hỏi'}
            </Button>
            {ask.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getApiErrorMessage(ask.error, 'Chưa trả lời được lúc này.')}
              </p>
            )}
            {ask.data && (
              <div className="space-y-3">
                {ask.data.abstained ? (
                  <p className="rounded bg-amber-500/10 p-3 text-sm">
                    Sách chưa đủ căn cứ để trả lời. {ask.data.abstainReason}
                  </p>
                ) : (
                  <p className="whitespace-pre-line text-sm">{ask.data.answer}</p>
                )}
                {ask.data.citations.map((citation, index) => (
                  <p
                    key={`${citation.sourceFile}-${index}`}
                    className="rounded bg-muted p-3 text-sm"
                  >
                    “{citation.quote}” — {citation.chapterTitle}, tr. {citation.bookPage};{' '}
                    {citation.verified ? 'đã xác minh' : 'chưa kiểm chứng'}
                  </p>
                ))}
                <p className="text-sm text-muted-foreground">{ask.data.disclaimer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4">
          <CardContent className="space-y-4 pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Nhập chủ đề, ví dụ: omega-3"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setSubmittedSearch(search);
                }}
              />
              <Button onClick={() => setSubmittedSearch(search)}>Tìm</Button>
            </div>
            {searchQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tra cứu…</p>
            ) : searchQuery.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {getApiErrorMessage(searchQuery.error, 'Chưa tra cứu được lúc này.')}
              </p>
            ) : searchQuery.data?.snippets.length ? (
              searchQuery.data.snippets.map((snippet, index) => (
                <div
                  key={`${snippet.chapterNumber}-${snippet.bookPage}-${index}`}
                  className="rounded border p-3 text-sm"
                >
                  <p className="font-medium">
                    Chương {snippet.chapterNumber}: {snippet.chapterTitle} · tr. {snippet.bookPage}
                  </p>
                  <p className="mt-1 text-muted-foreground">{snippet.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {snippet.verified ? 'Đã xác minh' : 'Chưa kiểm chứng'} · điểm{' '}
                    {snippet.score.toFixed(2)}
                  </p>
                </div>
              ))
            ) : submittedSearch ? (
              <p className="text-sm text-muted-foreground">Không tìm thấy đoạn phù hợp.</p>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
