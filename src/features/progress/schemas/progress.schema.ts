import { z } from 'zod';
import { isFutureInstant } from '../utils/progress-date';

export const startFastingSchema = z
  .object({
    protocol: z.enum(['16:8', '18:6', '20:4', 'Custom'] as const, {
      message: 'Vui lòng chọn giao thức nhịn ăn.',
    }),
    startedAt: z
      .string()
      .min(1, 'Thời điểm bắt đầu không được để trống.')
      .refine((val) => !isFutureInstant(val, 1), 'Thời điểm bắt đầu không được ở tương lai.'),
    targetHours: z
      .number({ message: 'Số giờ mục tiêu phải là số.' })
      .min(1, 'Mục tiêu phải từ 1 giờ trở lên.')
      .max(24, 'Mục tiêu không được vượt quá 24 giờ.'),
  })
  .superRefine((data, ctx) => {
    if (data.protocol === '16:8' && data.targetHours !== 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetHours'],
        message: 'Giao thức 16:8 yêu cầu mục tiêu 16 giờ.',
      });
    } else if (data.protocol === '18:6' && data.targetHours !== 18) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetHours'],
        message: 'Giao thức 18:6 yêu cầu mục tiêu 18 giờ.',
      });
    } else if (data.protocol === '20:4' && data.targetHours !== 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetHours'],
        message: 'Giao thức 20:4 yêu cầu mục tiêu 20 giờ.',
      });
    } else if (data.protocol === 'Custom') {
      if (data.targetHours < 1 || data.targetHours > 24) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['targetHours'],
          message: 'Giao thức Custom yêu cầu mục tiêu từ 1 đến 24 giờ.',
        });
      }
    }
  });

export type StartFastingFormValues = z.infer<typeof startFastingSchema>;

export const endFastingSchema = z.object({
  sessionId: z.string().uuid('Session ID không hợp lệ.'),
  endedAt: z
    .string()
    .min(1, 'Thời điểm kết thúc không được để trống.')
    .refine((val) => !isFutureInstant(val, 1), 'Thời điểm kết thúc không được ở tương lai.'),
});

export type EndFastingFormValues = z.infer<typeof endFastingSchema>;

export const logWaterSchema = z.object({
  amountMl: z
    .number({ message: 'Lượng nước phải là số.' })
    .int('Lượng nước phải là số nguyên.')
    .min(1, 'Lượng nước tối thiểu là 1 ml.')
    .max(5000, 'Lượng nước tối đa một lần ghi là 5000 ml.'),
});

export type LogWaterFormValues = z.infer<typeof logWaterSchema>;

export const logSleepSchema = z
  .object({
    sleptAt: z
      .string()
      .min(1, 'Thời điểm đi ngủ không được để trống.')
      .refine((val) => !isFutureInstant(val, 1), 'Thời điểm đi ngủ không được ở tương lai.'),
    wokeAt: z
      .string()
      .min(1, 'Thời điểm thức dậy không được để trống.')
      .refine((val) => !isFutureInstant(val, 1), 'Thời điểm thức dậy không được ở tương lai.'),
    sleepQuality: z.enum(['Poor', 'Fair', 'Good', 'Excellent'] as const, {
      message: 'Vui lòng chọn chất lượng giấc ngủ.',
    }),
  })
  .superRefine((data, ctx) => {
    const slept = new Date(data.sleptAt);
    const woke = new Date(data.wokeAt);

    if (isNaN(slept.getTime()) || isNaN(woke.getTime())) {
      return;
    }

    if (woke.getTime() <= slept.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wokeAt'],
        message: 'Thời điểm thức dậy phải sau thời điểm đi ngủ.',
      });
      return;
    }

    const durationHours = (woke.getTime() - slept.getTime()) / (1000 * 60 * 60);
    if (durationHours > 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wokeAt'],
        message: 'Thời gian ngủ không được vượt quá 24 giờ.',
      });
    }
  });

export type LogSleepFormValues = z.infer<typeof logSleepSchema>;

export const logBodyMetricSchema = z
  .object({
    loggedAt: z
      .string()
      .min(1, 'Thời điểm ghi nhận không được để trống.')
      .refine((val) => !isFutureInstant(val, 1), 'Thời điểm ghi nhận không được ở tương lai.'),
    weightKg: z
      .number({ message: 'Cân nặng phải là số.' })
      .min(25.0, 'Cân nặng tối thiểu là 25.0 kg.')
      .max(300.0, 'Cân nặng tối đa là 300.0 kg.'),
    bodyFatPercent: z
      .number({ message: 'Tỷ lệ mỡ phải là số.' })
      .min(0.1, 'Tỷ lệ mỡ phải lớn hơn 0.')
      .max(100.0, 'Tỷ lệ mỡ không được vượt quá 100%.')
      .nullable()
      .optional(),
    waistCircumferenceCm: z
      .number({ message: 'Vòng eo phải là số.' })
      .min(0.1, 'Vòng eo phải lớn hơn 0.')
      .max(300.0, 'Vòng eo không được vượt quá 300 cm.')
      .nullable()
      .optional(),
    systolicBloodPressure: z
      .number({ message: 'Huyết áp tâm thu phải là số.' })
      .int('Huyết áp tâm thu phải là số nguyên.')
      .min(50, 'Huyết áp tâm thu phải từ 50 mmHg trở lên.')
      .max(250, 'Huyết áp tâm thu tối đa là 250 mmHg.')
      .nullable()
      .optional(),
    diastolicBloodPressure: z
      .number({ message: 'Huyết áp tâm trương phải là số.' })
      .int('Huyết áp tâm trương phải là số nguyên.')
      .min(30, 'Huyết áp tâm trương phải từ 30 mmHg trở lên.')
      .max(150, 'Huyết áp tâm trương tối đa là 150 mmHg.')
      .nullable()
      .optional(),
    restingHeartRate: z
      .number({ message: 'Nhịp tim phải là số.' })
      .int('Nhịp tim phải là số nguyên.')
      .min(25, 'Nhịp tim lúc nghỉ phải từ 25 bpm trở lên.')
      .max(250, 'Nhịp tim lúc nghỉ tối đa là 250 bpm.')
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasSys = data.systolicBloodPressure !== null && data.systolicBloodPressure !== undefined;
    const hasDia =
      data.diastolicBloodPressure !== null && data.diastolicBloodPressure !== undefined;

    // Ràng buộc cặp huyết áp: Nếu nhập 1 trường thì bắt buộc nhập cả 2
    if (hasSys && !hasDia) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['diastolicBloodPressure'],
        message: 'Huyết áp tâm thu và tâm trương phải được ghi nhận cùng lúc.',
      });
    } else if (!hasSys && hasDia) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['systolicBloodPressure'],
        message: 'Huyết áp tâm thu và tâm trương phải được ghi nhận cùng lúc.',
      });
    } else if (hasSys && hasDia) {
      if (data.systolicBloodPressure! <= data.diastolicBloodPressure!) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['systolicBloodPressure'],
          message: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương.',
        });
      }
    }
  });

export type LogBodyMetricFormValues = z.infer<typeof logBodyMetricSchema>;
