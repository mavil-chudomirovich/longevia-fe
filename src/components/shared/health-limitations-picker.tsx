'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface HealthLimitationOption {
  value: string;
  label: string;
}

export const HEALTH_LIMITATION_OPTIONS: HealthLimitationOption[] = [
  { value: 'joint_pain', label: 'Đau/tổn thương khớp' },
  { value: 'back_pain', label: 'Đau lưng' },
  { value: 'shoulder_injury', label: 'Đau vai' },
  { value: 'knee_pain', label: 'Đau đầu gối' },
  { value: 'ankle_injury', label: 'Đau cổ chân' },
  { value: 'pregnancy', label: 'Mang thai' },
  { value: 'asthma', label: 'Hen suyễn' },
  { value: 'heart_condition', label: 'Bệnh tim mạch' },
];

const MAX_ITEMS = 8;
const MAX_LENGTH = 50;

export function healthLimitationLabel(value: string): string {
  return HEALTH_LIMITATION_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

/**
 * Chọn nhanh giới hạn sức khỏe hoặc nhập tự do. Giá trị được lưu nguyên văn để
 * đưa vào prompt cho LLM tự cân nhắc; không ràng buộc allowlist.
 */
export function HealthLimitationsPicker({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [text, setText] = React.useState('');
  const normalized = value.map((item) => item.trim().toLowerCase());

  const add = (raw: string) => {
    const item = raw.trim();
    if (
      !item ||
      item.length > MAX_LENGTH ||
      value.length >= MAX_ITEMS ||
      normalized.includes(item.toLowerCase())
    ) {
      setText('');
      return;
    }

    onChange([...value, item]);
    setText('');
  };

  const toggle = (option: HealthLimitationOption) => {
    if (disabled) return;
    if (value.includes(option.value)) {
      onChange(value.filter((item) => item !== option.value));
      return;
    }

    add(option.value);
  };

  return (
    <div className="space-y-2" id={id}>
      <div className="flex flex-wrap gap-1.5">
        {HEALTH_LIMITATION_OPTIONS.map((option) => {
          const active = value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option)}
              disabled={disabled || (!active && value.length >= MAX_ITEMS)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          value={text}
          maxLength={MAX_LENGTH}
          disabled={disabled || value.length >= MAX_ITEMS}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add(text);
            }
          }}
          placeholder="Nhập giới hạn khác rồi nhấn Enter"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => add(text)}
          disabled={disabled || value.length >= MAX_ITEMS || text.trim().length === 0}
        >
          Thêm
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {healthLimitationLabel(item)}
              <button
                type="button"
                aria-label={`Xoá ${healthLimitationLabel(item)}`}
                disabled={disabled}
                onClick={() => onChange(value.filter((current) => current !== item))}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Tối đa {MAX_ITEMS} mục, mỗi mục {MAX_LENGTH} ký tự. Thông tin này chỉ dùng để gợi ý bài tập
        phù hợp.
      </p>
    </div>
  );
}
