import { describe, expect, it } from 'vitest';
import { describeAiFallback } from './ai-fallback';

describe('describeAiFallback', () => {
  it('trả thông báo cụ thể cho từng lý do đã biết', () => {
    expect(describeAiFallback('provider_timeout').message).toContain('quá lâu');
    expect(describeAiFallback('provider_unavailable').message).toContain('không sẵn sàng');
    expect(describeAiFallback('invalid_model_output').message).toContain('không hợp lệ');
    expect(describeAiFallback('corpus_missing').message).toContain('chưa được nạp');
    expect(describeAiFallback('no_safe_activity').message).toContain('giới hạn sức khỏe');
  });

  it('đánh dấu lý do có thể thử lại', () => {
    expect(describeAiFallback('provider_timeout').retryable).toBe(true);
    expect(describeAiFallback('corpus_missing').retryable).toBe(false);
    expect(describeAiFallback('no_safe_activity').retryable).toBe(false);
  });

  it('fallback chung cho lý do rỗng hoặc lạ', () => {
    expect(describeAiFallback(null).retryable).toBe(true);
    expect(describeAiFallback('something_new').message).toContain('phương án dự phòng');
  });
});
