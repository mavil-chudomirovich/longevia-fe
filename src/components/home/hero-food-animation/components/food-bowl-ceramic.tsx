import * as React from 'react';

interface FoodBowlCeramicProps {
  size?: number;
  className?: string;
}

/**
 * Tô sứ thủ công men mờ (Matte Ceramic Bowl) nhìn từ góc trên (Top-down view).
 * Phối màu gốm mộc tự nhiên với viền tráng men ngọc thanh lịch.
 */
export const FoodBowlCeramic: React.FC<FoodBowlCeramicProps> = ({ size = 320, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Đổ bóng ngoài của tô */}
        <radialGradient id="bowlOuterShadow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="70%" stopColor="#0F172A" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </radialGradient>

        {/* Thân tô sứ men gốm tự nhiên */}
        <linearGradient id="bowlBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="45%" stopColor="#EDEFEA" />
          <stop offset="100%" stopColor="#E2E6DF" />
        </linearGradient>

        {/* Lòng tô sâu với độ chuyển ánh sáng êm dịu */}
        <radialGradient id="bowlInnerDepth" cx="45%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#FAFBF9" />
          <stop offset="60%" stopColor="#E6EAE2" />
          <stop offset="90%" stopColor="#D8DED3" />
          <stop offset="100%" stopColor="#C8D0C2" />
        </radialGradient>

        {/* Viền men ngọc thanh thoát (Emerald rim accent) */}
        <linearGradient id="bowlRimAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#15803D" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#0D9488" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0.5" />
        </linearGradient>

        {/* Vệt bóng phản chiếu trên miệng bát (Specular Highlight) */}
        <linearGradient id="rimHighlight" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* 1. Bóng tiếp xúc sàn */}
      <circle cx="160" cy="164" r="150" fill="url(#bowlOuterShadow)" />

      {/* 2. Vành ngoài thân tô */}
      <circle cx="160" cy="160" r="140" fill="url(#bowlBodyGradient)" />

      {/* 3. Vòng viền sứ men ngọc thanh mảnh */}
      <circle
        cx="160"
        cy="160"
        r="138"
        stroke="url(#bowlRimAccent)"
        strokeWidth="2.5"
        fill="none"
      />

      {/* 4. Viền phản quang ánh sáng gốm */}
      <circle cx="160" cy="160" r="133" stroke="url(#rimHighlight)" strokeWidth="4" fill="none" />

      {/* 5. Lòng tô gốm mờ sâu */}
      <circle cx="160" cy="160" r="128" fill="url(#bowlInnerDepth)" />

      {/* 6. Vòng tròn điểm xuyết vân gốm mộc mạc bên trong */}
      <circle
        cx="160"
        cy="160"
        r="105"
        stroke="#FFFFFF"
        strokeOpacity="0.4"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        fill="none"
      />
      <circle
        cx="160"
        cy="160"
        r="75"
        stroke="#CBD5E1"
        strokeOpacity="0.35"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
};
