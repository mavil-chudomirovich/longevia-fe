import { describe, expect, it } from 'vitest';
import {
  formatApiErrorFields,
  getApiErrorCode,
  getApiErrorMessage,
  isApiErrorCode,
} from './api-error';

function problemDetails(errors?: { field: string; message: string }[]): unknown {
  return {
    isAxiosError: true,
    response: {
      status: 422,
      data: {
        type: 'about:blank',
        title: 'Invalid request',
        status: 422,
        detail: 'Dữ liệu không hợp lệ',
        code: 'identity.validation_failed',
        ...(errors ? { errors } : {}),
      },
    },
  };
}

describe('ProblemDetails errors', () => {
  it('reads the root code and matches exact backend codes', () => {
    expect(getApiErrorCode(problemDetails())).toBe('identity.validation_failed');
    expect(isApiErrorCode(problemDetails(), 'identity.validation_failed')).toBe(true);
    expect(isApiErrorCode(problemDetails(), 'identity.email_taken')).toBe(false);
  });

  it('formats the backend errors array by field', () => {
    expect(
      formatApiErrorFields(
        problemDetails([
          { field: 'email', message: 'Email không hợp lệ' },
          { field: 'password', message: 'Mật khẩu quá yếu' },
        ])
      )
    ).toBe('email: Email không hợp lệ\npassword: Mật khẩu quá yếu');
  });

  it('limits displayed fields and prefers detail then title', () => {
    const payload = problemDetails([
      { field: 'a', message: '1' },
      { field: 'b', message: '2' },
      { field: 'c', message: '3' },
      { field: 'd', message: '4' },
    ]);
    expect(formatApiErrorFields(payload, 2)).toContain('... và 2 lỗi khác');
    expect(getApiErrorMessage(payload)).toBe('Dữ liệu không hợp lệ');
    expect(getApiErrorMessage(new Error('fallback'), 'fallback')).toBe('fallback');
  });
});
