import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu ít nhất 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu cần ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu cần ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu cần ít nhất 1 chữ số')
  .regex(/[^A-Za-z0-9]/, 'Mật khẩu cần ít nhất 1 ký tự đặc biệt');

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(100, 'Họ tên tối đa 100 ký tự'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .superRefine((d, ctx) => {
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Mật khẩu nhập lại không khớp',
        path: ['confirmPassword'],
      });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
