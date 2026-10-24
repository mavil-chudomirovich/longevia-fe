import * as React from 'react';

interface CompletedBuddhaBowlProps {
  size?: number;
  className?: string;
}

/**
 * 🥗 Món ăn hoàn chỉnh: Tô Rainbow Buddha Bowl dinh dưỡng thuần thực vật.
 * Thể hiện đầy đủ 5 nhóm nguyên liệu được xếp đĩa nghệ thuật:
 * - Bơ tươi xắt lát quạt nan
 * - Đậu gà rang giòn & đậu hũ áp chảo
 * - Cà chua bi đỏ mọng
 * - Cà rốt sợi cam tươi
 * - Xà lách xoăn & mầm cải
 * - Rưới xốt mè rang óng ánh và rắc hạt mè thơm lừng
 */
export const CompletedBuddhaBowl: React.FC<CompletedBuddhaBowlProps> = ({
  size = 320,
  className,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 320 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Tô Rainbow Buddha Bowl hoàn chỉnh"
    >
      <defs>
        {/* Bóng mờ quanh tô */}
        <radialGradient id="completedBowlShadow" cx="50%" cy="52%" r="50%">
          <stop offset="70%" stopColor="#0F172A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </radialGradient>

        {/* Thân tô sứ men ngọc */}
        <linearGradient id="cBowlBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#F1F5F0" />
          <stop offset="100%" stopColor="#E2E8DE" />
        </linearGradient>

        <linearGradient id="cBowlRim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#15803D" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#0D9488" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#16A34A" stopOpacity="0.7" />
        </linearGradient>

        {/* Nền gạo lứt / quinoa ở trung tâm */}
        <radialGradient id="quinoaBase" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4A373" />
          <stop offset="60%" stopColor="#BC6C25" />
          <stop offset="100%" stopColor="#9B581C" />
        </radialGradient>

        {/* Xốt mè rang béo ngậy (Tahini drizzle) */}
        <linearGradient id="tahiniDrizzle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* 1. Bóng đổ sàn */}
      <circle cx="160" cy="166" r="150" fill="url(#completedBowlShadow)" />

      {/* 2. Vỏ tô sứ */}
      <circle cx="160" cy="160" r="140" fill="url(#cBowlBody)" />
      <circle cx="160" cy="160" r="138" stroke="url(#cBowlRim)" strokeWidth="3" fill="none" />
      <circle
        cx="160"
        cy="160"
        r="133"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeOpacity="0.9"
        fill="none"
      />

      {/* 3. Lòng tô & Lớp nền cơm gạo lứt / hạt quinoa */}
      <circle cx="160" cy="160" r="126" fill="#EDE9DF" />
      <circle cx="160" cy="160" r="105" fill="url(#quinoaBase)" fillOpacity="0.35" />

      {/* ========================================================
          CÁC KHỐI NGUYÊN LIỆU ĐƯỢC XẾP THEO MẶT TRÒN ĐỒNG HỒ
          ======================================================== */}

      {/* --- PHÂN VÙNG 1: RAU MẦM & XÀ LÁCH (Góc 7h - 10h) --- */}
      <g id="greens-section">
        {/* Nền lá xanh lớn */}
        <path
          d="M80 180 C60 140 85 95 125 85 C140 115 130 155 105 180 Z"
          fill="#16A34A"
          fillOpacity="0.95"
        />
        <path
          d="M68 150 C55 120 75 95 105 85 C115 110 100 140 78 155 Z"
          fill="#22C55E"
          fillOpacity="0.85"
        />
        {/* Lá xoăn mầm nhỏ */}
        <circle cx="100" cy="115" r="12" fill="#4ADE80" />
        <circle cx="118" cy="100" r="10" fill="#86EFAC" />
        <circle cx="85" cy="135" r="11" fill="#22C55E" />
        <circle cx="95" cy="155" r="13" fill="#15803D" />
        {/* Gân lá trắng mờ */}
        <path d="M75 140 Q100 120 125 100" stroke="#DCFCE7" strokeWidth="1.5" fill="none" />
      </g>

      {/* --- PHÂN VÙNG 2: BƠ TƯƠI CẮT LÁT QUẠT NAN (Góc 10h - 1h) --- */}
      <g id="avocado-fan" transform="translate(4, -4)">
        {/* Lát bơ 1 */}
        <path
          d="M120 75 C135 60 165 58 175 75 C165 95 145 95 120 75 Z"
          fill="#D4E791"
          stroke="#4A752C"
          strokeWidth="1.5"
        />
        {/* Lát bơ 2 */}
        <path
          d="M135 70 C150 55 180 55 190 72 C180 92 160 92 135 70 Z"
          fill="#E2F1A6"
          stroke="#4A752C"
          strokeWidth="1.5"
        />
        {/* Lát bơ 3 */}
        <path
          d="M150 68 C168 52 196 54 205 72 C192 92 172 90 150 68 Z"
          fill="#EBF7B8"
          stroke="#4A752C"
          strokeWidth="1.5"
        />
        {/* Lát bơ 4 */}
        <path
          d="M168 68 C186 54 212 58 220 76 C205 95 185 92 168 68 Z"
          fill="#F5FCCC"
          stroke="#4A752C"
          strokeWidth="1.5"
        />
        {/* Viền vỏ xanh đậm bọc ngoài các lát bơ */}
        <path
          d="M122 75 C145 52 205 52 220 76"
          stroke="#1E392A"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* --- PHÂN VÙNG 3: ĐẬU GÀ RANG GIÒN & ĐẬU HŨ VÀNG (Góc 1h - 3h) --- */}
      <g id="chickpeas-tofu">
        {/* Khối đậu hũ nướng vàng */}
        <polygon
          points="195,100 225,92 245,110 215,118"
          fill="#FDE68A"
          stroke="#B45309"
          strokeWidth="0.8"
        />
        <polygon
          points="215,118 245,110 238,132 208,138"
          fill="#F59E0B"
          stroke="#B45309"
          strokeWidth="0.8"
        />
        <polygon points="210,136 238,132 255,145 228,152" fill="#D97706" />

        {/* Cụm hạt đậu gà tròn vàng ươm */}
        <circle cx="210" cy="95" r="9" fill="#F59E0B" />
        <circle cx="207" cy="93" r="3" fill="#FEF3C7" />

        <circle cx="232" cy="115" r="9.5" fill="#FBBF24" />
        <circle cx="229" cy="113" r="3" fill="#FFFBEB" />

        <circle cx="248" cy="132" r="9" fill="#F59E0B" />
        <circle cx="245" cy="130" r="2.8" fill="#FEF3C7" />

        <circle cx="225" cy="142" r="8.5" fill="#D97706" />
        <circle cx="242" cy="154" r="8" fill="#FBBF24" />

        <circle cx="210" cy="120" r="8.5" fill="#F59E0B" />
      </g>

      {/* --- PHÂN VÙNG 4: CÀ CHUA BI ĐỎ MỌNG (Góc 3h - 5h) --- */}
      <g id="cherry-tomatoes">
        {/* Quả 1 */}
        <circle cx="235" cy="180" r="14" fill="#EF4444" />
        <ellipse
          cx="230"
          cy="174"
          rx="4"
          ry="2"
          fill="#FFFFFF"
          fillOpacity="0.75"
          transform="rotate(-30 230 174)"
        />
        {/* Quả 2 */}
        <circle cx="212" cy="198" r="13" fill="#DC2626" />
        <ellipse
          cx="207"
          cy="193"
          rx="3.5"
          ry="1.8"
          fill="#FFFFFF"
          fillOpacity="0.7"
          transform="rotate(-30 207 193)"
        />
        {/* Nửa quả cắt đôi thấy múi */}
        <g transform="translate(226, 196)">
          <circle cx="14" cy="14" r="13" fill="#B91C1C" />
          <circle cx="14" cy="14" r="11" fill="#EF4444" />
          {/* Tâm hạt cà chua */}
          <ellipse cx="11" cy="11" rx="2.5" ry="4" fill="#FDE047" fillOpacity="0.9" />
          <ellipse cx="17" cy="12" rx="2.5" ry="4" fill="#FDE047" fillOpacity="0.9" />
          <ellipse cx="14" cy="18" rx="4" ry="2.5" fill="#FDE047" fillOpacity="0.9" />
        </g>
      </g>

      {/* --- PHÂN VÙNG 5: CÀ RỐT SỢI BÀO GIÒN TƯƠI (Góc 5h - 7h) --- */}
      <g id="carrots-section">
        {/* Bó sợi cà rốt xếp tia */}
        <path
          d="M150 242 Q175 230 190 220"
          stroke="#FB923C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M142 235 Q170 225 195 212"
          stroke="#EA580C"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M158 248 Q182 238 202 225"
          stroke="#F97316"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M136 242 Q162 235 186 230"
          stroke="#EA580C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M165 252 Q188 245 208 235"
          stroke="#FB923C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M148 255 Q172 250 198 240"
          stroke="#C2410C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Vài lát cà rốt hoa tròn */}
        <circle cx="180" cy="225" r="7" fill="#F97316" />
        <circle cx="180" cy="225" r="2.5" fill="#FED7AA" />
        <circle cx="162" cy="238" r="6.5" fill="#FB923C" />
      </g>

      {/* --- TÂM BÁT: HẠT ĐẬU NÀNH NHẬT (EDAMAME) & LÁ BẠC HÀ TRANG TRÍ --- */}
      <g id="center-garnish">
        {/* 3 hạt Edamame xanh ngọc */}
        <ellipse
          cx="150"
          cy="155"
          rx="7"
          ry="5"
          fill="#84CC16"
          stroke="#4D7C0F"
          strokeWidth="0.8"
          transform="rotate(-20 150 155)"
        />
        <ellipse
          cx="162"
          cy="150"
          rx="7"
          ry="5"
          fill="#A3E635"
          stroke="#4D7C0F"
          strokeWidth="0.8"
          transform="rotate(30 162 150)"
        />
        <ellipse
          cx="164"
          cy="162"
          rx="6.5"
          ry="5"
          fill="#65A30D"
          stroke="#365314"
          strokeWidth="0.8"
          transform="rotate(-60 164 162)"
        />

        {/* Nhánh mầm việt mini trang trí trung tâm */}
        <path
          d="M156 156 Q158 140 162 134"
          stroke="#15803D"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M162 134 C166 130 172 132 170 137 C168 140 164 138 162 134 Z" fill="#22C55E" />
      </g>

      {/* --- DÒNG RƯỚI XỐT MÈ RANG NGHỆ THUẬT (Creamy Sesame Dressing Drizzle) --- */}
      <path
        d="M110 130 Q130 100 160 120 T210 140 T170 190 T130 170"
        stroke="url(#tahiniDrizzle)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeOpacity="0.9"
        fill="none"
      />
      <path
        d="M125 120 Q145 95 170 115 T215 135"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
        fill="none"
      />

      {/* --- RẮC HẠT MÈ ĐEN & TRẮNG THƠM LỪNG --- */}
      <g id="sesame-seeds">
        {/* Mè đen */}
        <ellipse
          cx="142"
          cy="115"
          rx="1.5"
          ry="2.5"
          fill="#1E293B"
          transform="rotate(25 142 115)"
        />
        <ellipse
          cx="178"
          cy="125"
          rx="1.5"
          ry="2.5"
          fill="#1E293B"
          transform="rotate(-40 178 125)"
        />
        <ellipse
          cx="155"
          cy="175"
          rx="1.5"
          ry="2.5"
          fill="#1E293B"
          transform="rotate(60 155 175)"
        />
        <ellipse
          cx="205"
          cy="165"
          rx="1.5"
          ry="2.5"
          fill="#1E293B"
          transform="rotate(10 205 165)"
        />
        <ellipse
          cx="120"
          cy="160"
          rx="1.5"
          ry="2.5"
          fill="#1E293B"
          transform="rotate(-15 120 160)"
        />

        {/* Mè trắng */}
        <ellipse
          cx="152"
          cy="110"
          rx="1.5"
          ry="2.5"
          fill="#FFFFFF"
          fillOpacity="0.95"
          transform="rotate(-30 152 110)"
        />
        <ellipse
          cx="168"
          cy="135"
          rx="1.5"
          ry="2.5"
          fill="#FFFFFF"
          fillOpacity="0.95"
          transform="rotate(45 168 135)"
        />
        <ellipse
          cx="188"
          cy="148"
          rx="1.5"
          ry="2.5"
          fill="#FFFFFF"
          fillOpacity="0.95"
          transform="rotate(-20 188 148)"
        />
        <ellipse
          cx="138"
          cy="182"
          rx="1.5"
          ry="2.5"
          fill="#FFFFFF"
          fillOpacity="0.95"
          transform="rotate(70 138 182)"
        />
        <ellipse
          cx="172"
          cy="180"
          rx="1.5"
          ry="2.5"
          fill="#FFFFFF"
          fillOpacity="0.95"
          transform="rotate(-10 172 180)"
        />
      </g>
    </svg>
  );
};
