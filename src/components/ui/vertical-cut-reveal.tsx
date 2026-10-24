'use client';

import * as React from 'react';
import { type AnimationOptions, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface VerticalCutRevealProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  reverse?: boolean;
  transition?: AnimationOptions;
  splitBy?: 'words' | 'characters' | 'lines' | string;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
  containerClassName?: string;
  wordLevelClassName?: string;
  elementLevelClassName?: string;
  onClick?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

export interface VerticalCutRevealRef {
  startAnimation: () => void;
  reset: () => void;
}

interface WordObject {
  characters: string[];
  needsSpace: boolean;
}

export const VerticalCutReveal = React.forwardRef<VerticalCutRevealRef, VerticalCutRevealProps>(
  (
    {
      children,
      reverse = false,
      transition = {
        type: 'spring',
        stiffness: 190,
        damping: 22,
      },
      splitBy = 'words',
      staggerDuration = 0.1,
      staggerFrom = 'first',
      containerClassName,
      wordLevelClassName,
      elementLevelClassName,
      onClick,
      onStart,
      onComplete,
      autoStart = true,
      className,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLSpanElement>(null);
    const shouldReduceMotion = useReducedMotion();
    const text = typeof children === 'string' ? children : children?.toString() || '';
    const [isAnimating, setIsAnimating] = React.useState(false);

    // Hỗ trợ tách ký tự tiếng Việt có dấu và emoji chuẩn xác
    const splitIntoCharacters = (input: string): string[] => {
      if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(input), ({ segment }) => segment);
      }
      return Array.from(input);
    };

    const elements = React.useMemo(() => {
      const words = text.split(' ');
      if (splitBy === 'characters') {
        return words.map((word, i) => ({
          characters: splitIntoCharacters(word),
          needsSpace: i !== words.length - 1,
        }));
      }
      return splitBy === 'words'
        ? text.split(' ')
        : splitBy === 'lines'
          ? text.split('\n')
          : text.split(splitBy);
    }, [text, splitBy]);

    const getStaggerDelay = React.useCallback(
      (index: number) => {
        const total =
          splitBy === 'characters'
            ? (elements as WordObject[]).reduce(
                (acc, word) => acc + word.characters.length + (word.needsSpace ? 1 : 0),
                0
              )
            : elements.length;

        if (staggerFrom === 'first') return index * staggerDuration;
        if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
        if (staggerFrom === 'center') {
          const center = Math.floor(total / 2);
          return Math.abs(center - index) * staggerDuration;
        }
        if (staggerFrom === 'random') {
          const randomIndex = Math.floor(Math.random() * total);
          return Math.abs(randomIndex - index) * staggerDuration;
        }
        return Math.abs(Number(staggerFrom) - index) * staggerDuration;
      },
      [elements, staggerFrom, staggerDuration, splitBy]
    );

    const startAnimation = React.useCallback(() => {
      setIsAnimating(true);
      onStart?.();
    }, [onStart]);

    React.useImperativeHandle(ref, () => ({
      startAnimation,
      reset: () => setIsAnimating(false),
    }));

    React.useEffect(() => {
      if (autoStart) {
        startAnimation();
      }
    }, [autoStart, startAnimation]);

    const variants = {
      hidden: { y: shouldReduceMotion ? '0%' : reverse ? '-100%' : '100%' },
      visible: (i: number) => ({
        y: '0%',
        transition: shouldReduceMotion
          ? { duration: 0 }
          : {
              ...transition,
              delay: ((transition?.delay as number) || 0) + getStaggerDelay(i),
            },
      }),
    };

    const wordsList =
      splitBy === 'characters'
        ? (elements as WordObject[])
        : (elements as string[]).map((el, i) => ({
            characters: [el],
            needsSpace: i !== elements.length - 1,
          }));

    return (
      <span
        className={cn(
          'inline-flex flex-wrap whitespace-pre-wrap',
          splitBy === 'lines' && 'flex-col',
          containerClassName,
          className
        )}
        onClick={onClick}
        ref={containerRef}
        {...props}
      >
        <span className="sr-only">{text}</span>

        {wordsList.map((wordObj, wordIndex, array) => {
          const previousCharsCount = array
            .slice(0, wordIndex)
            .reduce((sum, word) => sum + word.characters.length, 0);

          return (
            <span
              key={wordIndex}
              aria-hidden="true"
              className={cn('inline-flex overflow-hidden py-0.5', wordLevelClassName)}
            >
              {wordObj.characters.map((char, charIndex) => (
                <span
                  className={cn('relative whitespace-pre-wrap', elementLevelClassName)}
                  key={charIndex}
                >
                  <motion.span
                    custom={previousCharsCount + charIndex}
                    initial="hidden"
                    animate={isAnimating ? 'visible' : 'hidden'}
                    variants={variants}
                    onAnimationComplete={
                      wordIndex === array.length - 1 && charIndex === wordObj.characters.length - 1
                        ? onComplete
                        : undefined
                    }
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                </span>
              ))}
              {wordObj.needsSpace && <span>&nbsp;</span>}
            </span>
          );
        })}
      </span>
    );
  }
);

VerticalCutReveal.displayName = 'VerticalCutReveal';
