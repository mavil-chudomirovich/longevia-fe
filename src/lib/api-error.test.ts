import { describe, expect, it } from 'vitest';
import {
  formatApiErrorFields,
  getApiErrorCode,
  getApiErrorAction,
  getApiErrorMessage,
  isApiErrorCode,
} from './api-error';
import { FRIENDLY_ERRORS } from './error-messages';

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

  it('lists field messages without technical field names', () => {
    expect(
      formatApiErrorFields(
        problemDetails([
          { field: 'email', message: 'Email không hợp lệ' },
          { field: 'password', message: 'Mật khẩu quá yếu' },
        ])
      )
    ).toBe('• Email không hợp lệ\n• Mật khẩu quá yếu');
  });

  it('limits displayed fields and maps known codes to friendly messages', () => {
    const payload = problemDetails([
      { field: 'a', message: '1' },
      { field: 'b', message: '2' },
      { field: 'c', message: '3' },
      { field: 'd', message: '4' },
    ]);
    expect(formatApiErrorFields(payload, 2)).toContain('… và 2 lỗi khác');
    expect(getApiErrorMessage(payload)).toBe(FRIENDLY_ERRORS['identity.validation_failed'].message);
    expect(getApiErrorMessage(new Error('fallback'), 'fallback')).toBe('fallback');
  });

  it('gives a friendly message and next-step action for diet.target_not_found', () => {
    const error = {
      isAxiosError: true,
      response: { status: 404, data: { status: 404, code: 'diet.target_not_found', detail: 'x' } },
    };
    expect(getApiErrorMessage(error)).toContain('chưa có mục tiêu dinh dưỡng');
    expect(getApiErrorAction(error)).toEqual({
      label: 'Thiết lập mục tiêu',
      href: '/diet/targets',
    });
  });

  it('never leaks HTTP status or service names for unknown server errors', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 503,
        data: { status: 503, title: 'Service Unavailable', detail: 'Identity down' },
      },
    };
    const message = getApiErrorMessage(error);
    expect(message).not.toMatch(/503|Identity|Service/);
  });

  it('uses the backend Vietnamese detail for unknown input errors', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { status: 400, code: 'diet.something_new', detail: 'Tên món quá dài.' },
      },
    };
    expect(getApiErrorMessage(error)).toBe('Tên món quá dài.');
  });
});
