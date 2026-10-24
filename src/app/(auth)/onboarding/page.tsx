'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Heart,
  ShieldAlert,
  Apple,
  Dumbbell,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type DietSchool = 'PHAT_GIAO' | 'DAO_GIAO' | 'VEGAN' | 'CHAY_KY' | 'FLEXITARIAN';

interface DietOption {
  id: DietSchool;
  title: string;
  badge: string;
  desc: string;
  icon: string;
}

const DIET_SCHOOLS: DietOption[] = [
  {
    id: 'PHAT_GIAO',
    title: 'Chay Phật giáo',
    badge: 'Phổ biến',
    desc: 'Nuôi dưỡng tâm từ bi, kiêng thịt cá, có tuỳ chọn kiêng nhóm Ngũ vị tân theo giới luật.',
    icon: '🪷',
  },
  {
    id: 'DAO_GIAO',
    title: 'Chay Đạo giáo / Cao Đài',
    badge: 'Chay tịnh',
    desc: 'Ăn chay theo lịch kỳ (mùng 1, rằm, thập trai), kiêng các chất cay nồng và kích thích.',
    icon: '☯️',
  },
  {
    id: 'VEGAN',
    title: 'Thuần chay (Vegan)',
    badge: 'Lối sống',
    desc: '100% nguồn gốc thực vật, kiêng toàn bộ thịt, hải sản, trứng, sữa và mật ong.',
    icon: '🌱',
  },
  {
    id: 'CHAY_KY',
    title: 'Ăn chay kỳ',
    badge: 'Linh hoạt',
    desc: 'Ăn chay định kỳ vào ngày rằm, mùng 1 hoặc 4-10 ngày trong tháng để thanh lọc cơ thể.',
    icon: '📅',
  },
  {
    id: 'FLEXITARIAN',
    title: 'Bán chay (Flexitarian)',
    badge: 'Khởi đầu',
    desc: 'Ưu tiên tối đa rau củ hạt quả trong tuần, giảm dần lượng thịt cá theo lộ trình.',
    icon: '🥗',
  },
];

const ALLERGIES = [
  {
    id: 'ngu_vi_tan',
    label: 'Ngũ vị tân (Hành, hẹ, tỏi, kiệu, hưng cừ)',
    badge: 'Phật giáo khuyên kiêng',
  },
  { id: 'trung', label: 'Trứng gia cầm', badge: 'Thuần chay' },
  { id: 'sua', label: 'Sữa & Bơ động vật', badge: 'Lactose free' },
  { id: 'dau_nanh', label: 'Đậu nành & Tàu hũ', badge: 'Dị ứng phổ biến' },
  { id: 'gluten', label: 'Gluten (Mì căn, lúa mì)', badge: 'Gluten-free' },
  { id: 'cay_nong', label: 'Đồ cay nồng, ớt hiểm', badge: 'Dạ dày' },
];

const HEALTH_GOALS = [
  {
    id: 'healthy',
    title: 'Duy trì sức khỏe & Thanh lọc',
    desc: 'Ăn chay khoa học, đầy đủ vi chất, da dẻ hồng hào và tinh thần an vui.',
    icon: Heart,
  },
  {
    id: 'weight_loss',
    title: 'Giảm cân & Đốt mỡ lành mạnh',
    desc: 'Kiểm soát calo, giàu chất xơ, giữ cảm giác no lâu mà không mất cơ.',
    icon: Target,
  },
  {
    id: 'muscle_gain',
    title: 'Tăng cơ thuần chay (High Protein)',
    desc: 'Tối ưu lượng protein thực vật từ các loại đậu, hạt sen, nấm và ngũ cốc nguyên cám.',
    icon: Dumbbell,
  },
  {
    id: 'medical_care',
    title: 'Ổn định huyết áp & Đường huyết',
    desc: 'Thực đơn thanh nhạt, ít muối đường, giàu kali và chất chống oxy hóa tự nhiên.',
    icon: Apple,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [step, setStep] = React.useState<number>(1);
  const [direction, setDirection] = React.useState<number>(1);
  const [selectedDiet, setSelectedDiet] = React.useState<DietSchool>('PHAT_GIAO');
  const [selectedAllergies, setSelectedAllergies] = React.useState<string[]>(['ngu_vi_tan']);
  const [selectedGoals, setSelectedGoals] = React.useState<string[]>(['healthy']);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const toggleAllergy = (id: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setDirection(1);
      setStep((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        toast.success('Hồ sơ dinh dưỡng ChayXanh đã được lưu!');
        router.push('/');
      }, 1000);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    toast.info('Bạn có thể cập nhật lại hồ sơ bất kỳ lúc nào tại trang Hồ sơ.');
    router.push('/');
  };

  const stepVariants = {
    enter: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? 36 : -36,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? -36 : 36,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full max-w-2xl">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="overflow-hidden rounded-3xl border-border/70 bg-card/95 shadow-xl backdrop-blur-md">
          {/* Step progress bar */}
          <div className="border-b bg-muted/40 px-6 pb-3 pt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>BƯỚC {step} / 3</span>
              <span className="text-primary font-medium">
                {step === 1 && 'Trường phái ăn chay'}
                {step === 2 && 'Kiêng kỵ & Dị ứng thực phẩm'}
                {step === 3 && 'Mục tiêu dinh dưỡng'}
              </span>
            </div>
            <Progress value={(step / 3) * 100} className="h-1.5 transition-all duration-300" />
          </div>

          <CardHeader className="pb-3 pt-6 text-center">
            <motion.div
              key={step}
              initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              {step === 1 && <span className="text-2xl">🪷</span>}
              {step === 2 && <ShieldAlert className="h-6 w-6" />}
              {step === 3 && <Target className="h-6 w-6" />}
            </motion.div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {step === 1 && 'Bạn đang thực hành trường phái ăn chay nào?'}
              {step === 2 && 'Bạn cần kiêng hoặc tránh thực phẩm nào?'}
              {step === 3 && 'Mục tiêu sức khỏe chính của bạn là gì?'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {step === 1 &&
                'ChayXanh sẽ tự động lọc công thức và gợi ý thực đơn chuẩn xác theo trường phái của bạn.'}
              {step === 2 &&
                'Các công thức và gợi ý AI sẽ tự động loại trừ các thành phần bạn đã chọn bên dưới.'}
              {step === 3 &&
                'Thuật toán dinh dưỡng sẽ cân bằng lượng Calories và đạm thực vật phù hợp với bạn.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            <AnimatePresence mode="wait" custom={direction}>
              {/* STEP 1: Trường phái chay */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="grid gap-3"
                >
                  {DIET_SCHOOLS.map((item) => {
                    const isSelected = selectedDiet === item.id;
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                        onClick={() => setSelectedDiet(item.id)}
                        className={cn(
                          'relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                            : 'border-border/70 hover:border-primary/40 hover:bg-muted/30'
                        )}
                      >
                        <span className="mt-0.5 shrink-0 text-3xl">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-base font-semibold text-foreground">
                              {item.title}
                            </span>
                            <Badge variant="secondary" className="text-[11px] font-normal">
                              {item.badge}
                            </Badge>
                          </div>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                        <div
                          className={cn(
                            'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/30'
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* STEP 2: Kiêng kỵ & Dị ứng */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-3"
                >
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {ALLERGIES.map((item) => {
                      const isChecked = selectedAllergies.includes(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                          onClick={() => toggleAllergy(item.id)}
                          className={cn(
                            'flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-colors',
                            isChecked
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border/70 hover:border-primary/40 hover:bg-muted/30'
                          )}
                        >
                          <div className="space-y-0.5 pr-2">
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <span className="text-[11px] text-muted-foreground">{item.badge}</span>
                          </div>
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                              isChecked
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {isChecked && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <p className="pt-2 text-center text-xs italic text-muted-foreground">
                    💡 Lưu ý: Đối với người ăn chay theo Phật giáo tu tập, việc kiêng Ngũ vị tân
                    (hành, hẹ, tỏi, kiệu, hưng cừ) giúp thân tâm thanh tịnh.
                  </p>
                </motion.div>
              )}

              {/* STEP 3: Mục tiêu dinh dưỡng */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {HEALTH_GOALS.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = selectedGoals.includes(goal.id);
                    return (
                      <motion.div
                        key={goal.id}
                        whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
                        onClick={() => toggleGoal(goal.id)}
                        className={cn(
                          'flex cursor-pointer flex-col rounded-2xl border p-4 transition-colors',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm'
                            : 'border-border/70 hover:border-primary/40 hover:bg-muted/30'
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/40'
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                        <h4 className="mb-1 text-sm font-semibold text-foreground">{goal.title}</h4>
                        <p className="text-xs leading-relaxed text-muted-foreground">{goal.desc}</p>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex items-center justify-between border-t border-border/40 pt-4">
              {step > 1 ? (
                <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}>
                  <Button variant="outline" onClick={handleBack} className="gap-1.5 rounded-xl">
                    <ArrowLeft className="h-4 w-4" /> Quay lại
                  </Button>
                </motion.div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                >
                  Bỏ qua
                </Button>
              )}

              <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}>
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="gap-1.5 rounded-xl px-6 font-semibold shadow-md"
                >
                  {isSubmitting ? (
                    'Đang lưu...'
                  ) : step === 3 ? (
                    <>
                      Hoàn tất & Bắt đầu <CheckCircle2 className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Tiếp theo <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
