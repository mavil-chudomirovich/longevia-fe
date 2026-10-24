import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Sequence } from 'remotion';

// Cảnh 1: Kinetic Brand Intro (Frame 0 -> 100, tức 0 - 3.3s)
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Opacity & transform cho Badge thương hiệu
  const badgeOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const badgeY = interpolate(frame, [0, 20], [20, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateRight: 'clamp',
  });

  // Kinetic Typography: Xuất hiện từng từ
  const word1Opacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' });
  const word1Y = interpolate(frame, [15, 35], [30, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateRight: 'clamp',
  });

  const word2Opacity = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' });
  const word2Y = interpolate(frame, [30, 50], [30, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateRight: 'clamp',
  });

  const word3Opacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: 'clamp' });
  const word3Y = interpolate(frame, [45, 65], [30, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateRight: 'clamp',
  });

  const subtextOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  // Hiệu ứng fade out khi chuyển cảnh cuối sequence
  const sceneExit = interpolate(frame, [85, 100], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        opacity: sceneExit,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          opacity: badgeOpacity,
          transform: `translateY(${badgeY}px)`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 18px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          color: '#34d399',
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          marginBottom: '28px',
        }}
      >
        <span style={{ fontSize: '16px' }}>🌱</span>
        HỆ SINH THÁI ẨM THỰC THUẦN CHAY
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '52px',
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#ffffff',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              opacity: word1Opacity,
              transform: `translateY(${word1Y}px)`,
              marginRight: '12px',
            }}
          >
            Thanh nhẹ
          </span>
          <span
            style={{
              display: 'inline-block',
              opacity: word2Opacity,
              transform: `translateY(${word2Y}px)`,
              color: '#34d399',
              marginRight: '12px',
            }}
          >
            • Đủ chất
          </span>
          <span
            style={{
              display: 'inline-block',
              opacity: word3Opacity,
              transform: `translateY(${word3Y}px)`,
            }}
          >
            • An lành
          </span>
        </h1>
      </div>

      <p
        style={{
          opacity: subtextOpacity,
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '18px',
          lineHeight: 1.6,
          maxWidth: '480px',
          margin: 0,
        }}
      >
        Cá nhân hóa thực đơn dinh dưỡng theo thể trạng, truyền thống tôn giáo và khẩu vị thuần Việt.
      </p>
    </AbsoluteFill>
  );
};

// Cảnh 2: Món chay đặc sắc (Frame 100 -> 200, tức 3.3s - 6.6s)
const DishesScene: React.FC = () => {
  const frame = useCurrentFrame();

  const dishes = [
    {
      name: 'Phở Nấm Hương Thực Dưỡng',
      badge: 'Bổ khí huyết • Giàu kẽm',
      calories: '320 kcal',
      icon: '🍜',
      startFrame: 5,
    },
    {
      name: 'Gỏi Cuốn Ngũ Sắc Tươi Mát',
      badge: 'Chất xơ • Vitamin phong phú',
      calories: '240 kcal',
      icon: '🥗',
      startFrame: 30,
    },
    {
      name: 'Cơm Gạo Lứt Hạt Sen Cung Đình',
      badge: 'An thần • Protein phức hợp',
      calories: '380 kcal',
      icon: '🍚',
      startFrame: 55,
    },
  ];

  const sceneExit = interpolate(frame, [85, 100], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        opacity: sceneExit,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#34d399',
          }}
        >
          THỰC ĐƠN ĐƯỢC CHUYÊN GIA DUYỆT
        </span>
        <h2
          style={{
            margin: '6px 0 0',
            fontSize: '32px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          Hương vị tinh tế, vẹn toàn vi chất
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '520px',
        }}
      >
        {dishes.map((dish, i) => {
          const itemOpacity = interpolate(frame, [dish.startFrame, dish.startFrame + 15], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const itemX = interpolate(frame, [dish.startFrame, dish.startFrame + 20], [30, 0], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={i}
              style={{
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}
                >
                  {dish.icon}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
                    {dish.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a7f3d0', marginTop: '2px' }}>
                    {dish.badge}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                }}
              >
                {dish.calories}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Cảnh 3: Thẻ vi chất dinh dưỡng động (Frame 200 -> 300, tức 6.6s - 10s)
const NutritionScene: React.FC = () => {
  const frame = useCurrentFrame();

  const metrics = [
    { name: 'Vitamin B12 & Khoáng', target: '100%', progress: 100, icon: '⚡', color: '#34d399' },
    {
      name: 'Đạm thực vật cân đối',
      target: '65g/ngày',
      progress: 88,
      icon: '🌿',
      color: '#60a5fa',
    },
    {
      name: 'Omega-3 ALA (Hạt lanh/Óc chó)',
      target: '1.6g',
      progress: 95,
      icon: '💧',
      color: '#fbbf24',
    },
  ];

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const sceneExit = interpolate(frame, [85, 100], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        opacity: sceneExit,
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
      }}
    >
      <div style={{ opacity: headerOpacity, textAlign: 'center', marginBottom: '32px' }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#34d399',
          }}
        >
          KHOA HỌC DINH DƯỠNG
        </span>
        <h2
          style={{
            margin: '6px 0 0',
            fontSize: '32px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          Cân bằng vi chất tự nhiên
        </h2>
        <p style={{ margin: '8px 0 0', fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)' }}>
          Hệ thống theo dõi và cảnh báo thiếu hụt vi chất theo tiêu chuẩn chuyên gia
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          maxWidth: '500px',
        }}
      >
        {metrics.map((item, i) => {
          const itemDelay = i * 15;
          const cardOpacity = interpolate(frame, [itemDelay, itemDelay + 15], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const cardScale = interpolate(frame, [itemDelay, itemDelay + 20], [0.92, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateRight: 'clamp',
          });

          // Thanh tiến trình animated
          const barWidth = interpolate(
            frame,
            [itemDelay + 10, itemDelay + 35],
            [0, item.progress],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateRight: 'clamp',
            }
          );

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                transform: `scale(${cardScale})`,
                padding: '18px 20px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.icon}</span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                    {item.name}
                  </span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: item.color }}>
                  {item.target}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    backgroundColor: item.color,
                    borderRadius: '9999px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const AuthShowcaseComposition: React.FC = () => {
  const frame = useCurrentFrame();

  // Floating ambient particles/lights background
  const floatY1 = Math.sin((frame / 30) * Math.PI) * 15;
  const floatY2 = Math.cos((frame / 25) * Math.PI) * 20;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#064e3b',
        backgroundImage:
          'radial-gradient(at 10% 20%, #065f46 0px, transparent 50%), radial-gradient(at 90% 80%, #047857 0px, transparent 50%), radial-gradient(at 50% 50%, #022c22 0px, #064e3b 100%)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Dynamic ambient orb 1 */}
      <div
        style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          backgroundColor: 'rgba(52, 211, 153, 0.12)',
          filter: 'blur(70px)',
          top: '10%',
          left: '5%',
          transform: `translateY(${floatY1}px)`,
        }}
      />

      {/* Dynamic ambient orb 2 */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          filter: 'blur(90px)',
          bottom: '10%',
          right: '5%',
          transform: `translateY(${floatY2}px)`,
        }}
      />

      {/* Phân cảnh 1: Giới thiệu thương hiệu & Tinh thần ChayXanh */}
      <Sequence from={0} durationInFrames={100}>
        <IntroScene />
      </Sequence>

      {/* Phân cảnh 2: Thực đơn món chay đặc sắc */}
      <Sequence from={100} durationInFrames={100}>
        <DishesScene />
      </Sequence>

      {/* Phân cảnh 3: Khoa học dinh dưỡng & Cân bằng vi chất */}
      <Sequence from={200} durationInFrames={100}>
        <NutritionScene />
      </Sequence>

      {/* Footer indicator dots */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '4px',
            borderRadius: '9999px',
            backgroundColor: frame < 100 ? '#34d399' : 'rgba(255, 255, 255, 0.25)',
          }}
        />
        <div
          style={{
            width: '28px',
            height: '4px',
            borderRadius: '9999px',
            backgroundColor: frame >= 100 && frame < 200 ? '#34d399' : 'rgba(255, 255, 255, 0.25)',
          }}
        />
        <div
          style={{
            width: '28px',
            height: '4px',
            borderRadius: '9999px',
            backgroundColor: frame >= 200 ? '#34d399' : 'rgba(255, 255, 255, 0.25)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
