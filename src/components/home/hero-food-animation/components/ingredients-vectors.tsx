import * as React from 'react';

interface IngredientVectorProps {
  size?: number;
  className?: string;
}

/**
 * 🥑 1. Quả bơ tươi cắt nửa (Avocado)
 */
export const AvocadoVector: React.FC<IngredientVectorProps> = ({ size = 96, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Bơ sáp tươi"
    >
      <defs>
        {/* Bóng mờ */}
        <ellipse cx="50" cy="85" rx="35" ry="10" fill="#0F172A" fillOpacity="0.15" />
        {/* Vỏ bơ xanh thẫm */}
        <linearGradient id="avocadoSkin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E392A" />
          <stop offset="100%" stopColor="#0B1A12" />
        </linearGradient>
        {/* Thịt bơ xanh ngọc chuyển vàng bơ béo ngậy */}
        <radialGradient id="avocadoFlesh" cx="50%" cy="58%" r="48%">
          <stop offset="0%" stopColor="#F9F6C8" />
          <stop offset="55%" stopColor="#D4E791" />
          <stop offset="85%" stopColor="#87B447" />
          <stop offset="100%" stopColor="#4A752C" />
        </radialGradient>
        {/* Hạt bơ tròn nâu ấm */}
        <radialGradient id="avocadoPit" cx="42%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#A86B42" />
          <stop offset="60%" stopColor="#784421" />
          <stop offset="100%" stopColor="#48220A" />
        </radialGradient>
      </defs>

      {/* Bóng */}
      <ellipse cx="50" cy="86" rx="32" ry="8" fill="#0F172A" fillOpacity="0.14" />

      {/* Hình dáng nửa quả bơ hình trái lê */}
      <path
        d="M50 12C36 12 30 28 26 46C22 64 24 82 50 82C76 82 78 64 74 46C70 28 64 12 50 12Z"
        fill="url(#avocadoSkin)"
      />
      {/* Lớp thịt bơ mịn */}
      <path
        d="M50 16C38 16 33 30 30 46C27 62 28 78 50 78C72 78 73 62 70 46C67 30 62 16 50 16Z"
        fill="url(#avocadoFlesh)"
      />

      {/* Hạt bơ tròn trĩnh */}
      <circle cx="50" cy="58" r="16" fill="url(#avocadoPit)" />
      {/* Vệt sáng trên hạt bơ */}
      <ellipse
        cx="46"
        cy="53"
        rx="4"
        ry="2.5"
        fill="#FFFFFF"
        fillOpacity="0.4"
        transform="rotate(-25 46 53)"
      />

      {/* 2 lát bơ cắt xếp cạnh */}
      <path
        d="M74 30C78 38 78 50 72 58C69 62 65 64 64 62C63 60 65 56 67 52C71 44 69 36 67 32C66 30 71 25 74 30Z"
        fill="#A6D354"
        stroke="#4A752C"
        strokeWidth="0.8"
      />
    </svg>
  );
};

/**
 * 🧆 2. Cụm đậu gà nướng vàng & đậu hũ áp chảo (Chickpeas & Tofu)
 */
export const ChickpeasVector: React.FC<IngredientVectorProps> = ({ size = 92, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Đậu gà nướng giòn"
    >
      <defs>
        <radialGradient id="chickpeaGold" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
        <linearGradient id="tofuCube" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="60%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Bóng */}
      <ellipse cx="50" cy="80" rx="34" ry="8" fill="#0F172A" fillOpacity="0.14" />

      {/* Khối đậu hũ vàng giòn cắt khối */}
      <g transform="translate(18, 30)">
        <polygon points="12,0 34,4 40,24 18,22" fill="#FDE68A" />
        <polygon points="18,22 40,24 32,40 10,38" fill="url(#tofuCube)" />
        <polygon points="10,38 18,22 12,0 4,16" fill="#D97706" />
        {/* Vết nướng giòn */}
        <circle cx="22" cy="18" r="1.5" fill="#78350F" />
        <circle cx="28" cy="28" r="1.2" fill="#78350F" />
      </g>

      {/* Hạt đậu gà 1 */}
      <g transform="translate(48, 22)">
        <path
          d="M18 6C26 6 32 13 30 22C28 30 21 34 14 32C7 30 4 23 6 15C8 8 12 6 18 6Z"
          fill="url(#chickpeaGold)"
        />
        <path
          d="M14 8C16 11 16 14 13 16"
          stroke="#B45309"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="11" r="1.5" fill="#FFF" fillOpacity="0.6" />
      </g>

      {/* Hạt đậu gà 2 */}
      <g transform="translate(54, 46)">
        <path
          d="M14 4C21 4 26 10 24 17C22 24 16 27 10 25C4 23 2 17 4 11C6 5 9 4 14 4Z"
          fill="url(#chickpeaGold)"
        />
        <circle cx="10" cy="8" r="1.2" fill="#FFF" fillOpacity="0.5" />
      </g>

      {/* Hạt đậu gà 3 */}
      <g transform="translate(24, 52)">
        <path
          d="M12 4C18 4 22 9 20 15C18 21 13 24 8 22C3 20 2 15 3 10C5 5 8 4 12 4Z"
          fill="url(#chickpeaGold)"
        />
      </g>
    </svg>
  );
};

/**
 * 🍅 3. Cà chua bi mọng đỏ (Cherry Tomato)
 */
export const TomatoVector: React.FC<IngredientVectorProps> = ({ size = 94, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cà chua bi mọng đỏ"
    >
      <defs>
        {/* Màu đỏ căng mọng */}
        <radialGradient id="tomatoRed" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FF7A66" />
          <stop offset="45%" stopColor="#EF4444" />
          <stop offset="85%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </radialGradient>
        {/* Cà chua nhỏ phía sau */}
        <radialGradient id="smallTomatoRed" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="70%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </radialGradient>
      </defs>

      {/* Bóng */}
      <ellipse cx="50" cy="82" rx="34" ry="8" fill="#0F172A" fillOpacity="0.15" />

      {/* Cà chua nhỏ phía sau */}
      <g transform="translate(16, 26)">
        <circle cx="20" cy="20" r="18" fill="url(#smallTomatoRed)" />
        <ellipse
          cx="14"
          cy="14"
          rx="4"
          ry="2"
          fill="#FFFFFF"
          fillOpacity="0.5"
          transform="rotate(-30 14 14)"
        />
      </g>

      {/* Quả cà chua chính căng tròn */}
      <g transform="translate(32, 28)">
        <circle cx="26" cy="28" r="26" fill="url(#tomatoRed)" />

        {/* Ánh bóng Specular căng bóng mọng nước */}
        <ellipse
          cx="17"
          cy="18"
          rx="7"
          ry="3.5"
          fill="#FFFFFF"
          fillOpacity="0.75"
          transform="rotate(-35 17 18)"
        />
        <circle cx="12" cy="23" r="1.5" fill="#FFFFFF" fillOpacity="0.6" />

        {/* Cuống hoa xanh tươi 5 cánh (Calyx) */}
        <g transform="translate(26, 4)">
          <path d="M0 0C-4 -6 -10 -4 -12 -2C-8 1 -4 2 0 0Z" fill="#15803D" />
          <path d="M0 0C-2 -8 3 -10 6 -9C4 -5 3 -2 0 0Z" fill="#16A34A" />
          <path d="M0 0C6 -8 12 -6 14 -3C10 0 5 1 0 0Z" fill="#15803D" />
          <path d="M0 0C4 2 10 4 12 7C8 7 4 4 0 0Z" fill="#16A34A" />
          <path d="M0 0C-4 2 -8 5 -10 8C-7 6 -3 3 0 0Z" fill="#15803D" />
          {/* Nhánh cuống cong nhỏ */}
          <path d="M0 0C1 -5 3 -10 8 -12" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

/**
 * 🥕 4. Cà rốt giòn ngọt bào sợi & khoanh tròn (Carrot)
 */
export const CarrotVector: React.FC<IngredientVectorProps> = ({ size = 96, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cà rốt giòn ngọt"
    >
      <defs>
        <linearGradient id="carrotOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="35%" stopColor="#FB923C" />
          <stop offset="75%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <radialGradient id="carrotRound" cx="40%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="45%" stopColor="#FB923C" />
          <stop offset="85%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#9A3412" />
        </radialGradient>
      </defs>

      {/* Bóng */}
      <ellipse cx="50" cy="82" rx="34" ry="7" fill="#0F172A" fillOpacity="0.14" />

      {/* Khoanh tròn cà rốt cắt chéo */}
      <g transform="translate(16, 42) rotate(-15)">
        <ellipse cx="20" cy="20" rx="18" ry="14" fill="url(#carrotRound)" />
        <ellipse
          cx="20"
          cy="20"
          rx="10"
          ry="7"
          stroke="#FDBA74"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          fill="none"
        />
        <circle cx="20" cy="20" r="3" fill="#FED7AA" />
      </g>

      {/* Củ cà rốt mini tươi ngon */}
      <g transform="translate(36, 16) rotate(24)">
        {/* Thân củ */}
        <path
          d="M16 22C24 22 28 26 26 34C24 46 16 68 12 76C10 76 8 68 8 52C8 36 10 22 16 22Z"
          fill="url(#carrotOrange)"
        />
        {/* Vệt gân ngang đặc trưng cà rốt */}
        <path d="M11 34C15 34 19 35 22 36" stroke="#9A3412" strokeWidth="1" strokeLinecap="round" />
        <path d="M10 46C14 47 17 47 20 48" stroke="#9A3412" strokeWidth="1" strokeLinecap="round" />
        <path d="M9 58C12 59 15 59 17 60" stroke="#9A3412" strokeWidth="1" strokeLinecap="round" />

        {/* Cuống lá xanh ngát */}
        <path d="M16 22C16 12 10 6 6 2" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 22C18 10 24 4 28 0" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M16 22C20 14 26 12 30 10"
          stroke="#22C55E"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

/**
 * 🥬 5. Rau mầm tươi xanh & Xà lách xoăn (Fresh Greens & Microgreens)
 */
export const GreensVector: React.FC<IngredientVectorProps> = ({ size = 96, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Rau mầm & xà lách tươi"
    >
      <defs>
        <linearGradient id="leafGreenGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="60%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#14532D" />
        </linearGradient>
        <linearGradient id="leafGreenGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>

      {/* Bóng */}
      <ellipse cx="50" cy="84" rx="34" ry="7" fill="#0F172A" fillOpacity="0.14" />

      {/* Nhánh mầm 1 - Cong mềm */}
      <g transform="translate(18, 20)">
        {/* Thân cọng mầm mơn mởn */}
        <path d="M32 60C30 46 22 32 14 20" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />
        {/* Lá mầm 1 */}
        <path d="M14 20C8 16 0 18 2 26C4 32 12 30 14 20Z" fill="url(#leafGreenGrad1)" />
        {/* Lá mầm 2 đối xứng */}
        <path d="M14 20C18 12 28 12 28 20C28 28 20 28 14 20Z" fill="url(#leafGreenGrad2)" />
      </g>

      {/* Lá xà lách xoăn lớn xòe rộng */}
      <g transform="translate(32, 28) rotate(15)">
        <path
          d="M18 52C8 40 4 24 16 12C26 2 44 4 48 18C52 30 42 46 26 54C22 56 18 54 18 52Z"
          fill="url(#leafGreenGrad2)"
        />
        {/* Gân lá nổi bật */}
        <path
          d="M22 52C26 38 32 24 36 12"
          stroke="#DCFCE7"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M28 36C34 34 40 34 44 36"
          stroke="#DCFCE7"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M25 24C30 20 36 18 40 18"
          stroke="#DCFCE7"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
