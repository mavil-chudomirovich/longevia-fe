'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RegisterFormValues } from '../schemas/auth.schema';
import { Input } from '@/components/ui/input';
import { ContributorApprovalBasis } from '@/common/enums';

const APPROVAL_BASIS_OPTIONS: Array<{ value: ContributorApprovalBasis; label: string }> = [
  {
    value: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
    label: 'Liên kết với tổ chức',
  },
  {
    value: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
    label: 'Hoạt động trên nền tảng',
  },
];

/**
 * Khối nguyện vọng Contributor trong form đăng ký (tùy chọn).
 * Chỉ thu thập nguyện vọng — tài khoản vẫn là Member chờ duyệt, không cấp quyền.
 * Dùng trong `RegisterForm` qua `FormProvider` (không gọi API).
 */
export function ContributorRequestFields() {
  const form = useFormContext<RegisterFormValues>();
  const wantsContributor = form.watch('wantsContributor');
  const experience = form.watch('experience') ?? '';
  const errors = form.formState.errors;

  return (
    <div className="space-y-3 rounded-xl border border-dashed p-4">
      <label className="flex cursor-pointer items-start gap-2.5">
        <Checkbox
          checked={wantsContributor}
          onCheckedChange={(checked) => form.setValue('wantsContributor', checked === true)}
          className="mt-0.5"
        />
        <span>
          <span className="text-sm font-medium">Tôi muốn trở thành Contributor</span>
          <span className="block text-xs text-muted-foreground">
            Tài khoản của bạn vẫn là Member. Đơn sẽ được admin duyệt sau.
          </span>
        </span>
      </label>

      {wantsContributor && (
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label>Căn cứ đăng ký</Label>
            <Select
              value={form.watch('claimedApprovalBasis') ?? ''}
              onValueChange={(v) =>
                form.setValue(
                  'claimedApprovalBasis',
                  v as RegisterFormValues['claimedApprovalBasis'],
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn căn cứ đăng ký" />
              </SelectTrigger>
              <SelectContent>
                {APPROVAL_BASIS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.claimedApprovalBasis && (
              <p className="text-xs text-destructive">{errors.claimedApprovalBasis.message}</p>
            )}
          </div>

          {form.watch('claimedApprovalBasis') === 'ORGANIZATION_AFFILIATION' && (
            <div className="space-y-1.5">
              <Label htmlFor="register-organizationClaim">Tên hoặc mô tả tổ chức</Label>
              <Input
                id="register-organizationClaim"
                maxLength={500}
                {...form.register('organizationClaim')}
              />
              {errors.organizationClaim && (
                <p className="text-xs text-destructive">{errors.organizationClaim.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="register-experience">Kinh nghiệm của bạn</Label>
              <span className="text-xs text-muted-foreground">{experience.length}/2000</span>
            </div>
            <Textarea
              id="register-experience"
              placeholder="Ví dụ: 5 năm nấu món chay cho gia đình, từng mở lớp hướng dẫn..."
              rows={3}
              maxLength={2000}
              {...form.register('experience')}
            />
            {errors.experience && (
              <p className="text-xs text-destructive">{errors.experience.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-referenceLinks">Link tham khảo (mỗi dòng một link)</Label>
            <Textarea
              id="register-referenceLinks"
              placeholder={'https://blog-cua-ban.vn\nhttps://video-gioi-thieu...'}
              rows={2}
              {...form.register('referenceLinks')}
            />
            {errors.referenceLinks && (
              <p className="text-xs text-destructive">{errors.referenceLinks.message}</p>
            )}
            {errors.referenceLinks && (
              <p className="text-xs text-destructive">{errors.referenceLinks.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
