import { describe, expect, it } from 'vitest';
import { parseSseChunk } from './sse';

describe('parseSseChunk', () => {
  it('tách nhiều sự kiện trong cùng một chunk', () => {
    const { events, rest } = parseSseChunk(
      'event: delta\ndata: {"text":"Xin "}\n\nevent: delta\ndata: {"text":"chào"}\n\n'
    );

    expect(rest).toBe('');
    expect(events).toEqual([
      { event: 'delta', data: '{"text":"Xin "}' },
      { event: 'delta', data: '{"text":"chào"}' },
    ]);
  });

  it('giữ lại phần chưa hoàn chỉnh cho lần đọc sau', () => {
    const first = parseSseChunk('event: delta\ndata: {"te');
    expect(first.events).toEqual([]);
    expect(first.rest).toBe('event: delta\ndata: {"te');

    const merged = parseSseChunk(`${first.rest}xt":"ok"}\n\n`);
    expect(merged.events).toEqual([{ event: 'delta', data: '{"text":"ok"}' }]);
  });

  it('hỗ trợ CRLF và nhiều dòng data', () => {
    const { events } = parseSseChunk('event: done\r\ndata: {"a":1}\r\ndata: {"b":2}\r\n\r\n');
    expect(events).toEqual([{ event: 'done', data: '{"a":1}\n{"b":2}' }]);
  });

  it('bỏ qua block không có data', () => {
    const { events } = parseSseChunk('event: ping\n\n');
    expect(events).toEqual([]);
  });
});
