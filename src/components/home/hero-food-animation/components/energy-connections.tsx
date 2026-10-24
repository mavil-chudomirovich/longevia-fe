import * as React from 'react';

interface EnergyConnectionsProps {
  progress: number; // 0 to 1
  opacity: number;
}

/**
 * Hiệu ứng đường kết nối hữu cơ (Organic Connection Lines) & các hạt năng lượng thực vật.
 * Thể hiện tinh thần "VeggieConnect" - kết nối nguồn sống tự nhiên giữa các nguyên liệu.
 */
export const EnergyConnections: React.FC<EnergyConnectionsProps> = ({ opacity }) => {
  if (opacity <= 0.01) return null;

  return (
    <svg
      width="700"
      height="700"
      viewBox="0 0 700 700"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute inset-0"
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#15803D" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#0D9488" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0.4" />
        </linearGradient>

        <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#22C55E" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#15803D" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Vòng hào quang mờ trung tâm */}
      <circle
        cx="350"
        cy="350"
        r="215"
        stroke="url(#energyGrad)"
        strokeWidth="1.5"
        strokeDasharray="6 8"
        fill="none"
      />

      {/* Vòng nhỏ phụ */}
      <circle
        cx="350"
        cy="350"
        r="170"
        stroke="#0D9488"
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeDasharray="4 6"
        fill="none"
      />

      {/* Các hạt đốm sáng mầm xanh lấp lánh (Sparkle Dots) */}
      <circle cx="210" cy="210" r="14" fill="url(#sparkGlow)" />
      <circle cx="490" cy="210" r="12" fill="url(#sparkGlow)" />
      <circle cx="560" cy="350" r="15" fill="url(#sparkGlow)" />
      <circle cx="470" cy="500" r="12" fill="url(#sparkGlow)" />
      <circle cx="180" cy="450" r="13" fill="url(#sparkGlow)" />
    </svg>
  );
};
