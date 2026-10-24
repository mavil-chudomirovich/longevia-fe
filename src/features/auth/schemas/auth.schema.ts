import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu cần ít nhất 1 chữ hoa')
  .regex(/[0-9]/, 'Mật khẩu cần ít nhất 1 chữ số');

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Tên hiển thị ít nhất 2 ký tự')
      .max(100, 'Tên hiển thị tối đa 100 ký tự'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    // Nguyện vọng Contributor không cấp quyền trước khi Admin duyệt.
    wantsContributor: z.boolean(),
    claimedApprovalBasis: z
      .enum(['ORGANIZATION_AFFILIATION', 'PLATFORM_TRACK_RECORD'], {
        message: 'Vui lòng chọn căn cứ đăng ký',
      })
      .optional(),
    organizationClaim: z.string().max(500, 'Tên tổ chức tối đa 500 ký tự').optional(),
    experience: z.string().max(2000, 'Kinh nghiệm tối đa 2000 ký tự').optional(),
    referenceLinks: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu nhập lại không khớp',
        path: ['confirmPassword'],
      });
    }
    if (d.wantsContributor) {
      if (!d.claimedApprovalBasis) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vui lòng chọn căn cứ đăng ký',
          path: ['claimedApprovalBasis'],
        });
      }
      if (
        d.claimedApprovalBasis === 'ORGANIZATION_AFFILIATION' &&
        (!d.organizationClaim || d.organizationClaim.trim().length < 2)
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vui lòng ghi tên hoặc mô tả tổ chức (ít nhất 2 ký tự)',
          path: ['organizationClaim'],
        });
      }
      if (!d.experience || d.experience.trim().length < 20) {
        ctx.addIssue({
          code: 'custom',
          message: 'Vui lòng mô tả kinh nghiệm (ít nhất 20 ký tự)',
          path: ['experience'],
        });
      }
      const links =
        d.referenceLinks
          ?.split('\n')
          .map((link) => link.trim())
          .filter(Boolean) ?? [];
      if (links.length > 5 || links.some((link) => !z.url().safeParse(link).success)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Nhập tối đa 5 liên kết URL hợp lệ, mỗi dòng một liên kết',
          path: ['referenceLinks'],
        });
      }
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
