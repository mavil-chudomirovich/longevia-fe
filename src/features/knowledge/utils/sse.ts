export interface SseEvent {
  event: string;
  data: string;
}

export interface ParsedSseChunk {
  events: SseEvent[];
  rest: string;
}

/**
 * Tách sự kiện SSE khỏi buffer. Mỗi sự kiện kết thúc bằng dòng trống; chấp nhận
 * cả `\n\n` và `\r\n\r\n`. Phần chưa đủ được trả lại để ghép với chunk kế tiếp —
 * quan trọng vì một JSON có thể bị cắt giữa hai lần đọc stream.
 */
export function parseSseChunk(buffer: string): ParsedSseChunk {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n\n');
  const rest = parts.pop() ?? '';
  const events: SseEvent[] = [];

  for (const block of parts) {
    let event = 'message';
    const dataLines: string[] = [];

    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length > 0) {
      events.push({ event, data: dataLines.join('\n') });
    }
  }

  return { events, rest };
}
