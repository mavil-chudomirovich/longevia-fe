// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownText } from './markdown-text';

describe('MarkdownText', () => {
  it('render bold và tiêu đề markdown', () => {
    render(<MarkdownText content={'## Ăn chậm\n\nNhai kỹ **rất quan trọng**.'} />);
    expect(screen.getByText('Ăn chậm')).toBeInTheDocument();
    expect(screen.getByText('rất quan trọng').tagName).toBe('STRONG');
  });

  it('render danh sách có thứ tự và không thứ tự', () => {
    const { container } = render(<MarkdownText content={'1. Một\n2. Hai\n\n- Ba\n- Bốn'} />);
    expect(container.querySelectorAll('ol > li')).toHaveLength(2);
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
  });

  it('link ngoài mở tab mới và có rel an toàn', () => {
    render(<MarkdownText content={'Xem [nguồn](https://example.com)'} />);
    const link = screen.getByRole('link', { name: 'nguồn' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('chặn HTML thô trong nội dung sách/AI', () => {
    const { container } = render(<MarkdownText content={'Trước <script>alert(1)</script> sau'} />);
    expect(container.querySelector('script')).toBeNull();
  });

  it('trả về null khi nội dung rỗng', () => {
    const { container } = render(<MarkdownText content={'   '} />);
    expect(container).toBeEmptyDOMElement();
  });
});
