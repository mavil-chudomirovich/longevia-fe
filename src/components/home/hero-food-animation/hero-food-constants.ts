/**
 * Hằng số thời lượng và thông số hoạt cảnh cho Hero Food Animation (Remotion).
 * Tổng thời lượng: 240 frames @ 30 FPS = 8.0 giây loop.
 */

export const HERO_ANIMATION_CONFIG = {
  FPS: 30,
  TOTAL_FRAMES: 240,
  COMPOSITION_WIDTH: 700,
  COMPOSITION_HEIGHT: 700,
  CENTER: { x: 350, y: 350 },
} as const;

export const PHASES = {
  // Phase 1: Chiếc tô ở giữa cùng các nguyên liệu bay lượn kết nối nhẹ nhàng xung quanh (Orbit Harmony)
  PHASE_1_ORBIT_HARMONY: { start: 0, end: 60 },
  // Phase 2: Tô xoay 360 độ tạo động lực, các nguyên liệu xoáy ốc hội tụ vào lòng tô (Vortex Convergence)
  PHASE_2_VORTEX_CONVERGENCE: { start: 60, end: 95 },
  // Phase 3: Món Rainbow Buddha Bowl hoàn chỉnh xuất hiện, tỏa sáng và khoe sắc (Dish Showcase)
  PHASE_3_COMPLETED_DISH_SHOWCASE: { start: 95, end: 145 },
  // Phase 4: Món ăn tiếp tục xoay 360 độ và biến đổi, tách thành chiếc tô ở giữa & 5 nguyên liệu bung tỏa ra xung quanh (Rotation & Transformation)
  PHASE_4_ROTATION_TRANSFORMATION: { start: 145, end: 205 },
  // Phase 5: Ổn định quỹ đạo, kết nối năng lượng mầm xanh, chuyển mượt mà về đầu chu trình (Seamless Loop Settle)
  PHASE_5_SEAMLESS_LOOP_SETTLE: { start: 205, end: 240 },
} as const;

export interface IngredientDef {
  id: string;
  name: string;
  file: string;
  size: number;
  angle: number; // góc bung ra (độ)
  distance: number; // khoảng cách từ tâm (px)
  delayFrames: number; // stagger delay
  scale: number;
  rotationOffset: number;
}

/**
 * 5 nguyên liệu thực tế tương ứng với hình ảnh trong public/hero/optimized/
 */
export const INGREDIENTS_CONFIG: IngredientDef[] = [
  {
    id: 'avocado',
    name: 'Bơ sáp tươi',
    file: 'hero/optimized/avocado.webp',
    size: 115,
    angle: -135, // Trên - Trái
    distance: 220,
    delayFrames: 0,
    scale: 1.0,
    rotationOffset: -15,
  },
  {
    id: 'chickpeas',
    name: 'Đậu hũ áp chảo',
    file: 'hero/optimized/chickpeas.webp',
    size: 110,
    angle: -45, // Trên - Phải
    distance: 215,
    delayFrames: 6,
    scale: 1.0,
    rotationOffset: 12,
  },
  {
    id: 'tomato',
    name: 'Cà chua bi mọng',
    file: 'hero/optimized/tomato.webp',
    size: 112,
    angle: 0, // Phải
    distance: 225,
    delayFrames: 12,
    scale: 1.0,
    rotationOffset: -10,
  },
  {
    id: 'carrot',
    name: 'Cà rốt tươi giòn',
    file: 'hero/optimized/carrot.webp',
    size: 120,
    angle: 80, // Dưới - Phải
    distance: 215,
    delayFrames: 18,
    scale: 1.0,
    rotationOffset: 25,
  },
  {
    id: 'greens',
    name: 'Xà lách tươi xanh',
    file: 'hero/optimized/greens.webp',
    size: 125,
    angle: 150, // Dưới - Trái
    distance: 220,
    delayFrames: 24,
    scale: 1.0,
    rotationOffset: -20,
  },
];
