import { describe, it, expect } from 'vitest';
import { formatApiErrorFields, getApiErrorMessage } from './api-error';

function backendError(fields?: Record<string, string[]>): unknown {
  return {
    isAxiosError: true,
    response: {
      status: 400,
      data: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu không hợp lệ',
          ...(fields ? { fields } : {}),
        },
      },
    },
  };
}

describe('formatApiErrorFields', () => {
  it('formats backend field errors as readable lines', () => {
    const text = formatApiErrorFields(
      backendError({
        'recipe.ingredients.0.ingredientId': ['Invalid input: expected string, received null'],
      })
    );
    expect(text).toContain('recipe.ingredients.0.ingredientId');
    expect(text).toContain('expected string, received null');
  });

  it('returns undefined when no fields present', () => {
    expect(formatApiErrorFields(backendError())).toBeUndefined();
    expect(formatApiErrorFields(new Error('boom'))).toBeUndefined();
  });

  it('limits lines and notes remaining errors', () => {
    const text = formatApiErrorFields(
      backendError({ a: ['1'], b: ['2'], c: ['3'], d: ['4'], e: ['5'] }),
      3
    );
    expect(text).toContain('... và 2 lỗi khác');
  });
});

describe('getApiErrorMessage', () => {
  it('prefers backend message over axios generic message', () => {
    expect(getApiErrorMessage(backendError(), 'fallback')).toBe('Dữ liệu không hợp lệ');
  });
});
