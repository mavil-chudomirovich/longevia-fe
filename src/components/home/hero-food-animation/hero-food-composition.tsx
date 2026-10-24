import * as React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing, staticFile } from 'remotion';
import { EnergyConnections } from './components/energy-connections';
import { HERO_ANIMATION_CONFIG, INGREDIENTS_CONFIG, PHASES } from './hero-food-constants';

const BOWL_SRC = 'hero/optimized/bowl.webp';
const DISH_SRC = 'hero/optimized/completed-dish.webp';

/**
 * Preload ảnh ở chế độ nền để tối ưu cache trình duyệt mà không làm treo timeline của Remotion Player.
 */
function usePreloadHeroImages(): boolean {
  const [loaded, setLoaded] = React.useState(true);

  React.useEffect(() => {
    const srcs = [BOWL_SRC, DISH_SRC, ...INGREDIENTS_CONFIG.map((ing) => ing.file)].map((f) =>
      staticFile(f)
    );
    srcs.forEach((src) => {
      const im = new window.Image();
      im.src = src;
    });
  }, []);

  return loaded;
}

export const HeroFoodComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const imagesLoaded = usePreloadHeroImages();

  // ---------------------------------------------------------------------------
  // 1. CHUYỂN ĐỘNG NHẤP NHÔ HỮU CƠ (Float Y)
  // Chu kỳ chuẩn xác 4.0s (120 frames) để 240 frames chứa đúng 2 chu kỳ hoàn hảo:
  // Tại frame 0: sin(0) = 0 | Tại frame 240: sin(4*PI) = 0 (Seamless 100%)
  // ---------------------------------------------------------------------------
  const idleFloatY = Math.sin((frame / HERO_ANIMATION_CONFIG.FPS) * Math.PI * 0.5) * 4;

  // ---------------------------------------------------------------------------
  // 2. XOAY LIỀN MẠCH 2 GIAI ĐOẠN (Tổng 720 độ = 2 vòng 360 độ hoàn chỉnh)
  // - Vòng xoay 1 (Phase 2: frame 60 -> 95): Hội tụ nguyên liệu vào lòng tô
  // - Vòng xoay 2 (Phase 4: frame 145 -> 210): Món ăn tiếp tục xoay và biến đổi,
  //   tách trở lại thành chiếc tô ở giữa và các nguyên liệu bung tỏa xung quanh
  // ---------------------------------------------------------------------------
  const firstRotation = interpolate(
    frame,
    [PHASES.PHASE_2_VORTEX_CONVERGENCE.start, PHASES.PHASE_2_VORTEX_CONVERGENCE.end],
    [0, 360],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const secondRotation = interpolate(
    frame,
    [PHASES.PHASE_4_ROTATION_TRANSFORMATION.start, 210],
    [0, 360],
    {
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const totalRotation = firstRotation + secondRotation;

  // ---------------------------------------------------------------------------
  // 3. ĐỘ MỜ CHUYỂN GIAO GIỮA TÔ VÀ MÓN ĂN HOÀN CHỈNH
  // Cả tô và món ăn cùng chia sẻ totalRotation để khi crossfade không bị giật góc
  // ---------------------------------------------------------------------------
  let emptyBowlOpacity = 1;
  if (frame >= 88 && frame < 96) {
    emptyBowlOpacity = interpolate(frame, [88, 96], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame >= 96 && frame < 165) {
    emptyBowlOpacity = 0;
  } else if (frame >= 165 && frame <= 178) {
    emptyBowlOpacity = interpolate(frame, [165, 178], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else {
    emptyBowlOpacity = 1;
  }

  let dishOpacity = 0;
  if (frame >= 88 && frame < 96) {
    dishOpacity = interpolate(frame, [88, 96], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame >= 96 && frame < 165) {
    dishOpacity = 1;
  } else if (frame >= 165 && frame <= 178) {
    dishOpacity = interpolate(frame, [165, 178], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else {
    dishOpacity = 0;
  }

  // Độ nảy & scale của món ăn khi hoàn thành và khi bắt đầu xoay chuyển
  let dishScale = 1;
  if (frame >= 90 && frame <= 112) {
    dishScale = interpolate(frame, [90, 102, 112], [0.85, 1.06, 1.0], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame > 112 && frame < 145) {
    dishScale = 1.0 + Math.sin((frame - 112) * 0.08) * 0.015;
  } else if (frame >= 145 && frame <= 178) {
    // Nhẹ nhàng bung nở động lực li tâm trước khi tan thành các nguyên liệu
    dishScale = interpolate(frame, [145, 162, 178], [1.0, 1.04, 0.96], {
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // ---------------------------------------------------------------------------
  // 4. KẾT NỐI NĂNG LƯỢNG THỰC VẬT (Giai đoạn quỹ đạo nguyên liệu quanh tô)
  // ---------------------------------------------------------------------------
  let connectionOpacity = 0.85;
  if (frame >= 58 && frame <= 72) {
    connectionOpacity = interpolate(frame, [58, 72], [0.85, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame > 72 && frame < 195) {
    connectionOpacity = 0;
  } else if (frame >= 195 && frame <= 225) {
    connectionOpacity = interpolate(frame, [195, 225], [0, 0.85], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else {
    connectionOpacity = 0.85;
  }

  if (!imagesLoaded) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
      }}
    >
      {/* Vầng hào quang mầm xanh thanh nhẹ phía sau (chu kỳ tuần hoàn hoàn hảo) */}
      <div
        style={{
          position: 'absolute',
          width: 490,
          height: 490,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(21,128,61,0.16) 0%, rgba(13,148,136,0.08) 50%, transparent 75%)',
          transform: `scale(${1 + Math.sin((frame / HERO_ANIMATION_CONFIG.FPS) * Math.PI * 0.5) * 0.04})`,
        }}
      />

      {/* Đường nối năng lượng thực vật kết nối giữa các nguyên liệu */}
      <EnergyConnections progress={frame / 240} opacity={connectionOpacity} />

      {/* =========================================================
          TÔ GỖ TỰ NHIÊN Ở TRUNG TÂM (FOOD PHOTOGRAPHY BOWL)
          ========================================================= */}
      <div
        style={{
          position: 'absolute',
          width: 340,
          height: 340,
          transform: `translate3d(0, ${idleFloatY}px, 0) rotate(${totalRotation}deg)`,
          opacity: emptyBowlOpacity,
          display: emptyBowlOpacity > 0.005 ? 'block' : 'none',
          willChange: 'transform, opacity',
        }}
      >
        <img
          src={staticFile(BOWL_SRC)}
          alt="Tô gỗ tự nhiên"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 14px 24px rgba(15, 23, 42, 0.22))',
          }}
        />
      </div>

      {/* =========================================================
          5 NGUYÊN LIỆU THỰC TẾ (BƠ, ĐẬU HŨ, CÀ CHUA, CÀ RỐT, XÀ LÁCH)
          Toàn bộ chuyển động sử dụng translate3d (Compositor-only)
          Chu kỳ quỹ đạo khép kín: frame 240 == frame 0 (Seamless loop)
          ========================================================= */}
      {INGREDIENTS_CONFIG.map((ing, idx) => {
        const baseAngle = (ing.angle * Math.PI) / 180;
        let currentDistance = ing.distance;
        let ingOpacity = 1;
        let ingScale = ing.scale;
        let floatAngle = baseAngle;

        if (frame <= PHASES.PHASE_1_ORBIT_HARMONY.end) {
          // Giai đoạn 1: Bay lượn điều hòa nhịp nhàng quanh tô
          const t = (frame / HERO_ANIMATION_CONFIG.FPS) * Math.PI * 0.5;
          const harmonicDist = Math.sin(t + idx * 1.3) * 6;
          const harmonicAngle = Math.cos(t + idx * 0.9) * 0.04;

          currentDistance = ing.distance + harmonicDist;
          floatAngle = baseAngle + harmonicAngle;
          ingScale = ing.scale + Math.sin(t + idx) * 0.025;
          ingOpacity = 1;
        } else if (frame <= PHASES.PHASE_2_VORTEX_CONVERGENCE.end) {
          // Giai đoạn 2: Xoáy ốc hội tụ về lòng tô
          const convStart = PHASES.PHASE_2_VORTEX_CONVERGENCE.start;
          const convEnd = PHASES.PHASE_2_VORTEX_CONVERGENCE.end;

          const vortexOffset = interpolate(frame, [convStart, convEnd - 3], [0, 1.35], {
            easing: Easing.in(Easing.quad),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          floatAngle = baseAngle + vortexOffset;

          currentDistance = interpolate(frame, [convStart, convEnd - 3], [ing.distance, 15], {
            easing: Easing.bezier(0.7, 0, 0.84, 0),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          ingScale = interpolate(frame, [convStart, convEnd - 3], [ing.scale, 0.15], {
            easing: Easing.bezier(0.7, 0, 0.84, 0),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          ingOpacity = interpolate(frame, [convEnd - 13, convEnd - 5], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        } else if (frame < 165) {
          // Giai đoạn 3: Món hoàn chỉnh xuất hiện, nguyên liệu ẩn trong món ăn
          currentDistance = 0;
          ingOpacity = 0;
          ingScale = 0;
        } else if (frame <= PHASES.PHASE_4_ROTATION_TRANSFORMATION.end) {
          // Giai đoạn 4: Món ăn tiếp tục xoay, nguyên liệu bung nở trở lại ra xung quanh
          const burstDelay = idx * 2;
          const burstStart = 165 + burstDelay;
          const burstEnd = burstStart + 24;

          if (frame < burstStart) {
            currentDistance = 15;
            ingOpacity = 0;
            ingScale = 0.15;
            floatAngle = baseAngle;
          } else if (frame <= burstEnd) {
            // Bung tỏa từ tâm tô với hiệu ứng lò xo mượt mà (Spring overshoot)
            currentDistance = interpolate(
              frame,
              [burstStart, burstEnd - 7, burstEnd],
              [15, ing.distance * 1.07, ing.distance],
              {
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }
            );

            ingOpacity = interpolate(frame, [burstStart, burstStart + 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            ingScale = interpolate(
              frame,
              [burstStart, burstEnd - 7, burstEnd],
              [0.2, ing.scale * 1.14, ing.scale],
              {
                easing: Easing.bezier(0.34, 1.56, 0.64, 1),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }
            );

            // Xoay nhẹ theo lực li tâm của chiếc tô
            const spinForce = interpolate(frame, [burstStart, burstEnd], [0.45, 0], {
              easing: Easing.out(Easing.quad),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            floatAngle = baseAngle + spinForce;
          } else {
            currentDistance = ing.distance;
            ingOpacity = 1;
            ingScale = ing.scale;
            floatAngle = baseAngle;
          }
        } else {
          // Giai đoạn 5: Ổn định và khớp chính xác tuyệt đối với frame 0 (Seamless loop)
          const t = (frame / HERO_ANIMATION_CONFIG.FPS) * Math.PI * 0.5;
          const settleFactor = interpolate(
            frame,
            [PHASES.PHASE_5_SEAMLESS_LOOP_SETTLE.start, 220],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          const harmonicDist = Math.sin(t + idx * 1.3) * 6 * settleFactor;
          const harmonicAngle = Math.cos(t + idx * 0.9) * 0.04 * settleFactor;

          currentDistance = ing.distance + harmonicDist;
          floatAngle = baseAngle + harmonicAngle;
          ingScale = ing.scale + Math.sin(t + idx) * 0.025 * settleFactor;
          ingOpacity = 1;
        }

        if (ingOpacity <= 0.005) return null;

        const offsetX = Math.cos(floatAngle) * currentDistance;
        const offsetY = Math.sin(floatAngle) * currentDistance;

        return (
          <div
            key={ing.id}
            style={{
              position: 'absolute',
              width: ing.size,
              height: ing.size,
              opacity: ingOpacity,
              transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${ingScale}) rotate(${ing.rotationOffset}deg)`,
              willChange: 'transform, opacity',
            }}
          >
            <img
              src={staticFile(ing.file)}
              alt={ing.name}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 16px rgba(15, 23, 42, 0.18))',
              }}
            />
          </div>
        );
      })}

      {/* =========================================================
          MÓN ĂN HOÀN CHỈNH: RAINBOW BUDDHA BOWL (FOOD PHOTOGRAPHY)
          Cùng xoay totalRotation với chiếc tô để chuyển mượt không góc lệch
          ========================================================= */}
      {dishOpacity > 0.005 && (
        <div
          style={{
            position: 'absolute',
            width: 340,
            height: 340,
            transform: `translate3d(0, ${idleFloatY}px, 0) scale(${dishScale}) rotate(${totalRotation}deg)`,
            opacity: dishOpacity,
            willChange: 'transform, opacity',
          }}
        >
          <img
            src={staticFile(DISH_SRC)}
            alt="Tô Rainbow Buddha Bowl hoàn chỉnh"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 16px 28px rgba(15, 23, 42, 0.25))',
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
