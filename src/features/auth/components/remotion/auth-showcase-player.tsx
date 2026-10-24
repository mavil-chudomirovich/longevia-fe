'use client';

import * as React from 'react';
import { Player } from '@remotion/player';
import { AuthShowcaseComposition } from './auth-showcase-composition';

export interface AuthShowcasePlayerProps {
  className?: string;
}

export function AuthShowcasePlayer({ className = '' }: AuthShowcasePlayerProps) {
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-emerald-950/80 shadow-2xl backdrop-blur-xl ${className}`}
    >
      <Player
        component={AuthShowcaseComposition}
        durationInFrames={300}
        compositionWidth={720}
        compositionHeight={900}
        fps={30}
        autoPlay
        loop
        controls={false}
        clickToPlay={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
}
