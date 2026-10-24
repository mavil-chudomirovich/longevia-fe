'use client';

import * as React from 'react';
import Image from 'next/image';
import { Player, type PlayerRef } from '@remotion/player';
import { HeroFoodComposition } from './hero-food-composition';
import { HERO_ANIMATION_CONFIG } from './hero-food-constants';

export interface HeroFoodPlayerProps {
  className?: string;
}

export const HeroFoodPlayer = React.memo(function HeroFoodPlayer({
  className = '',
}: HeroFoodPlayerProps) {
  const playerRef = React.useRef<PlayerRef>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Tự động kiểm tra và kích hoạt play mượt mà không bị trình duyệt chặn autoplay
  React.useEffect(() => {
    const ensurePlaying = () => {
      const player = playerRef.current;
      if (player && !player.isPlaying()) {
        player.play();
      }
    };

    // Gọi play ngay sau khi mount
    const timeout = setTimeout(ensurePlaying, 50);

    // Kích hoạt ngay khi người dùng có bất kỳ tương tác nào với trang
    const handleInteraction = () => {
      ensurePlaying();
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('pointerdown', handleInteraction, { passive: true, once: true });
    window.addEventListener('scroll', handleInteraction, { passive: true, once: true });
    window.addEventListener('keydown', handleInteraction, { passive: true, once: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Nếu người dùng bật giảm chuyển động, hiển thị món ăn hoàn chỉnh tĩnh
  if (prefersReducedMotion) {
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center p-6 ${className}`}
        aria-label="Minh họa món ăn chay Rainbow Buddha Bowl"
      >
        <Image
          src="/hero/optimized/completed-dish.webp"
          alt="Tô Rainbow Buddha Bowl hoàn chỉnh"
          width={340}
          height={340}
          className="object-contain drop-shadow-xl"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <Player
        ref={playerRef}
        component={HeroFoodComposition}
        durationInFrames={HERO_ANIMATION_CONFIG.TOTAL_FRAMES}
        compositionWidth={HERO_ANIMATION_CONFIG.COMPOSITION_WIDTH}
        compositionHeight={HERO_ANIMATION_CONFIG.COMPOSITION_HEIGHT}
        fps={HERO_ANIMATION_CONFIG.FPS}
        autoPlay
        loop
        initiallyMuted
        numberOfSharedAudioTags={0}
        moveToBeginningWhenEnded
        controls={false}
        clickToPlay={false}
        acknowledgeRemotionLicense
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
});
