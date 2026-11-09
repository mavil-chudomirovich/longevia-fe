'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { knowledgeKeys } from '../queries/knowledge.queries';
import { toKnowledgeCitation } from '../mappers/knowledge-conversation.mapper';
import { parseSseChunk } from '../utils/sse';
import type { KnowledgeChatMessage } from '../types/knowledge-conversation.model';
import type { KnowledgeCitationDto } from '../types/knowledge-conversation.dto';

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseJson(data: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(data);
    return parsed !== null && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function readString(source: Record<string, unknown> | null, key: string): string {
  const value = source?.[key];
  return typeof value === 'string' ? value : '';
}

function emptyAssistant(id: string): KnowledgeChatMessage {
  return {
    id,
    role: 'assistant',
    content: '',
    citations: [],
    abstainReason: '',
    createdAt: null,
  };
}

export interface UseKnowledgeChatResult {
  messages: KnowledgeChatMessage[];
  isStreaming: boolean;
  error: string;
  conversationId: string | null;
  send: (question: string) => Promise<void>;
  reset: () => void;
  setConversationId: (id: string | null) => void;
}

/**
 * Quản lý một phiên chat hỏi sách: gửi câu hỏi tới BFF SSE, ghép `delta` vào câu
 * trả lời đang stream, gắn `citation` khi nhận, và đồng bộ id hội thoại ở `done`.
 */
export function useKnowledgeChat(): UseKnowledgeChatResult {
  const queryClient = useQueryClient();
  const [messages, setMessages] = React.useState<KnowledgeChatMessage[]>([]);
  const [isStreaming, setStreaming] = React.useState(false);
  const [error, setError] = React.useState('');
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  const reset = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setError('');
    setConversationId(null);
    setStreaming(false);
  }, []);

  const send = React.useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (trimmed.length === 0) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const assistantId = newId();
      const userMessage: KnowledgeChatMessage = {
        id: newId(),
        role: 'user',
        content: trimmed,
        citations: [],
        abstainReason: '',
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, emptyAssistant(assistantId)]);
      setStreaming(true);
      setError('');

      const appendDelta = (text: string) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, content: message.content + text } : message
          )
        );
      };

      try {
        const response = await fetch('/api/knowledge/ask/stream', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
          body: JSON.stringify({ conversationId, question: trimmed, chapterFilter: null }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = parseJson(await response.text());
          setError(
            readString(payload, 'detail') || 'Chưa gửi được câu hỏi. Bạn thử lại sau giây lát.'
          );
          return;
        }

        if (!response.body) {
          setError('Trình duyệt không hỗ trợ đọc phản hồi stream.');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parsed = parseSseChunk(buffer);
          buffer = parsed.rest;

          for (const event of parsed.events) {
            if (event.event === 'delta') {
              appendDelta(readString(parseJson(event.data), 'text'));
              continue;
            }

            if (event.event === 'citation') {
              const payload = parseJson(event.data);
              if (payload) {
                const citation = toKnowledgeCitation(payload as KnowledgeCitationDto);
                setMessages((prev) =>
                  prev.map((message) =>
                    message.id === assistantId
                      ? { ...message, citations: [...message.citations, citation] }
                      : message
                  )
                );
              }
              continue;
            }

            if (event.event === 'done') {
              const payload = parseJson(event.data);
              const nextConversationId = readString(payload, 'conversationId');
              const messageId = readString(payload, 'messageId');
              const abstainReason = readString(payload, 'abstainReason');
              if (nextConversationId) setConversationId(nextConversationId);
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId
                    ? {
                        ...message,
                        id: messageId || message.id,
                        abstainReason,
                        createdAt: new Date(),
                      }
                    : message
                )
              );
              void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
              continue;
            }

            if (event.event === 'error') {
              const payload = parseJson(event.data);
              setError(
                readString(payload, 'message') || 'Không thể hoàn tất câu trả lời. Bạn thử lại nhé.'
              );
            }
          }
        }
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError('Mất kết nối khi đang trả lời. Bạn thử lại nhé.');
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setStreaming(false);
        }
      }
    },
    [conversationId, queryClient]
  );

  return { messages, isStreaming, error, conversationId, send, reset, setConversationId };
}
