'use client';

import * as React from 'react';
import { BookOpen, Loader2, MessageSquarePlus, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CitationChipList } from '@/components/shared/citation-chip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { cn } from '@/lib/utils';
import {
  useDeleteKnowledgeConversationMutation,
  useKnowledgeConversationQuery,
  useKnowledgeConversationsQuery,
} from '../queries/knowledge.queries';
import { useKnowledgeChat } from '../hooks/useKnowledgeChat';

function formatWhen(value: Date | null): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(value);
}

export function KnowledgeChat() {
  const conversations = useKnowledgeConversationsQuery();
  const remove = useDeleteKnowledgeConversationMutation();
  const chat = useKnowledgeChat();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [question, setQuestion] = React.useState('');
  const detail = useKnowledgeConversationQuery(activeId ?? chat.conversationId);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const stickToBottom = React.useRef(true);
  const activeConversationId = activeId ?? chat.conversationId;
  const messages = chat.messages.length > 0 ? chat.messages : (detail.data?.messages ?? []);

  React.useEffect(() => {
    if (stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages, chat.isStreaming]);

  const startNewConversation = () => {
    chat.reset();
    setActiveId(null);
    setQuestion('');
  };

  const selectConversation = (id: string) => {
    if (chat.isStreaming) return;
    chat.reset();
    chat.setConversationId(id);
    setActiveId(id);
  };

  const submit = () => {
    const trimmed = question.trim();
    if (trimmed.length === 0 || chat.isStreaming) return;
    setQuestion('');
    void chat.send(trimmed);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:items-start">
      <aside className="space-y-3 lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto lg:pr-1">
        <Button onClick={startNewConversation} className="w-full justify-start gap-2">
          <MessageSquarePlus className="size-4" aria-hidden="true" />
          Cuộc trò chuyện mới
        </Button>

        <div className="space-y-1">
          {conversations.isLoading ? (
            <p className="px-2 text-xs text-muted-foreground">Đang tải hội thoại…</p>
          ) : conversations.data?.length ? (
            conversations.data.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'group flex items-start gap-1 rounded-lg px-2 py-2 text-sm transition-colors',
                  activeConversationId === item.id ? 'bg-muted font-medium' : 'hover:bg-muted/60'
                )}
              >
                <button
                  type="button"
                  onClick={() => selectConversation(item.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="line-clamp-2 break-words">{item.title}</span>
                  <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                    {item.messageCount} tin · {formatWhen(item.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Xoá hội thoại ${item.title}`}
                  className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  onClick={() => {
                    if (item.id === activeId) startNewConversation();
                    remove.mutate(item.id);
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ))
          ) : (
            <p className="px-2 text-xs text-muted-foreground">
              Chưa có hội thoại. Hỏi một câu để bắt đầu.
            </p>
          )}
        </div>
      </aside>

      <Card className="flex h-[calc(100dvh-11rem)] min-h-[520px] flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-6">
          <div
            className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
            aria-live="polite"
            aria-busy={chat.isStreaming}
            onScroll={(event) => {
              const node = event.currentTarget;
              stickToBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 120;
            }}
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Sparkles className="size-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium">Hỏi bất cứ điều gì trong sách</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Ví dụ: “Nhịn ăn 16:8 có lợi ích gì?”, “Nên ăn gì để đủ chất xơ?”, “Ngủ bao nhiêu
                  là đủ?”. Câu trả lời luôn kèm trích dẫn để bạn kiểm chứng.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-1',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                      message.role === 'user'
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-muted/60'
                    )}
                  >
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-line text-pretty">{message.content}</p>
                    ) : message.content ? (
                      <MarkdownText content={message.content} className="text-foreground" />
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        Đang tìm trong sách…
                      </span>
                    )}
                    {message.role === 'assistant' && chat.isStreaming && message.content && (
                      <span className="ml-0.5 inline-block h-4 w-1 animate-pulse rounded-full bg-primary align-middle" />
                    )}
                  </div>
                  {message.role === 'assistant' && message.citations.length > 0 && (
                    <CitationChipList citations={message.citations} className="px-1" />
                  )}
                  {message.abstainReason &&
                    message.abstainReason !== 'meta_intent' &&
                    message.abstainReason !== 'medical_refusal' && (
                      <p className="px-1 text-[11px] text-muted-foreground">
                        Chưa đủ căn cứ trong sách · {message.abstainReason}
                      </p>
                    )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {chat.error && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">
              {chat.error}
            </p>
          )}

          <div className="space-y-2 border-t pt-3">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Hỏi về dinh dưỡng, nhịn ăn, vận động, giấc ngủ trong sách…"
              className="min-h-20 resize-none"
              maxLength={500}
              disabled={chat.isStreaming}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <BookOpen className="size-3" aria-hidden="true" />
                Chỉ trả lời từ sách · Enter để gửi, Shift+Enter xuống dòng
              </p>
              <Button
                onClick={submit}
                disabled={chat.isStreaming || question.trim().length === 0}
                className="gap-1.5"
              >
                {chat.isStreaming ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                Gửi
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
