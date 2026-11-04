# WORK-LOG — Nhật ký công việc Longevia Frontend

> Ghi nhận chi tiết các thay đổi, quyết định kỹ thuật và kết quả xác minh sau mỗi task.

---

## [2026-11-04] Hoàn tất PR #1 Corrective — Phân lập Cache theo User, Lập lịch UTC Midnight & Trạng thái UI (Bảo — Dev 3)

- **Người thực hiện**: Bảo — Progress Service Owner (Dev 3).
- **Phạm vi sở hữu**: Progress & Biomarkers frontend (`src/features/progress/`, `src/app/progress/`).
- **Mục tiêu**:
  - Khắc phục triệt để các vấn đề được phát hiện trong đợt review độc lập PR #1:
    - **Corrective A**: Phân lập bộ nhớ cache (User-isolated Progress Cache) theo `userId`, ngăn chặn tuyệt đối rò rỉ dữ liệu sức khỏe giữa các tài khoản khi đăng xuất hoặc đổi tài khoản trong cùng tab trình duyệt.
    - **Corrective B**: Bổ sung tường minh 4 trạng thái UI (Loading, Error, Empty, Success), xử lý triệt để tình trạng hiển thị sai lệch khi query thất bại (không fake streak = 0, không hiển thị form nhịn ăn mới khi lỗi gây lỗi 409, bổ sung nút Thử lại bằng tiếng Việt).
    - **Corrective C**: Lập lịch tự động chuyển ngày theo lịch UTC (00:00 UTC Midnight Rollover), đồng bộ khi tab hiển thị trở lại qua `visibilitychange`, giải phóng timer khi unmount.
    - **Corrective D**: Chuẩn hóa Mapper bảo toàn null an toàn hợp đồng (Contract-Safe Mapping), ưu tiên phân loại BMI từ backend, bảo vệ chống crash khi nhận chuỗi ngày/số dị thường.
    - **Corrective E**: Lập tài liệu báo cáo rào cản bất đồng bộ hợp đồng Auth BE/FE và bàn giao liên module cho Nguyên (Dev 1).

- **Đã thực hiện**:
  1. **User-Isolated Cache (`src/features/progress/queries/progress.queries.ts`)**:
     - Cập nhật toàn bộ Query Key Factory gắn `userId`: `progressKeys.dashboard(userId)`, `progressKeys.fastingCurrent(userId)`, `progressKeys.waterToday(userId, utcDate)`, `progressKeys.metricsHistory(userId, filters)`.
     - Vô hiệu hóa truy vấn (`enabled: false`) khi phiên chưa xác thực hoặc `userId` rỗng.
     - Triển khai `clearProgressCache(queryClient, userId?)` hủy các query đang pending trước khi remove khỏi cache.
     - Mutations tự động invalidate chính xác các key thuộc về `currentUserId`.
  2. **Vòng đời Cache & UTC Rollover (`src/features/progress/hooks/useUtcDayRollover.ts` & `src/features/progress/components/progress-cache-sync.tsx`)**:
     - `getMsUntilNextUtcMidnight()`: Tính chính xác số mili-giây đến 00:00:00 UTC tiếp theo.
     - `setupUtcDayRollover()`: Tự động kích hoạt invalidate water và dashboard tại mốc 00:00 UTC + 500ms; lắng nghe `visibilitychange` khi người dùng mở lại tab sau khi ngủ máy/ẩn tab.
     - `ProgressCacheSync`: Gắn tại `src/app/progress/layout.tsx`, lắng nghe `useAuthStore.subscribe()`, dọn dẹp các query của user khác ngay khi mount và xóa cache khi logout / đổi user.
  3. **Trạng thái UI minh bạch (Corrective B)**:
     - `fasting-panel.tsx`: Khi `isErrorCurrent`, hiển thị Card báo lỗi với nút "Thử lại", tuyệt đối không render form bắt đầu nhịn ăn khi đang lỗi mạng.
     - `progress-summary-cards.tsx`: Nhận props `isError` và `onRetry`. Khi lỗi, hiển thị Error Card với nút "Thử lại", không hiển thị fake streak = 0 hay "Chưa ghi nhận số đo".
     - `water-tracker.tsx`: Khi `isError`, hiển thị thông báo lỗi và nút "Thử lại", không hiển thị form hay số liệu 0 ml sai lệch.
     - `weight-trend-chart.tsx`: Nhận `isError` và `onRetry`, phân biệt rạch ròi giữa trạng thái lỗi mạng và trạng thái rỗng chưa đủ mốc đo.
     - `src/app/progress/page.tsx`: Kết nối toàn bộ cờ `isError` và hàm `refetch` vào các component con và snapshot giấc ngủ.
  4. **Contract-Safe Mapping (Corrective D)**:
     - `src/features/progress/mappers/progress.mapper.ts`: Thêm `safeDate` và `safeNullableNumber`. Ưu tiên `bmiCategory` từ backend, bảo toàn giá trị null cho cân nặng/BMI/giấc ngủ.
  5. **Unit & Integration Tests**:
     - `src/features/progress/queries/progress.queries.test.ts`: 7 tests kiểm chứng phân lập khóa theo user, dọn dẹp cache khi logout, hủy pending requests (7 tests).
     - `src/features/progress/hooks/useUtcDayRollover.test.ts`: 4 tests kiểm chứng lập lịch 00:00 UTC, xử lý visibilitychange và dọn dẹp timer (4 tests).
     - `src/features/progress/mappers/progress.mapper.test.ts`: Bổ sung 3 tests kiểm tra bảo toàn null, fallback date, và ưu tiên backend BMI category (tổng 20 tests).
     - `src/features/progress/utils/progress-date.test.ts`: Bổ sung 3 tests cho `getMsUntilNextUtcMidnight` (tổng 26 tests).
  6. **Bàn giao rào cản Auth (Corrective E)**:
     - Tạo `docs/handoffs/progress-to-identity-auth-blocker.md`: Báo cáo chi tiết flat JSON `{ accessToken, refreshToken, tokenType, expiresIn }` từ Identity BE và hướng giải quyết trích xuất User claims từ JWT cho Nguyên (Dev 1).

- **Kết quả kiểm chứng (Verification Gates)**:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 10 test suites, 111 tests pass 100% (trong đó có 85 tests cho Progress module).
  - `npm run build`: Next.js 16 build thành công toàn bộ 15 static/dynamic routes.

---

## [2026-11-04] Triển khai hoàn chỉnh module Progress & Biomarkers (Bảo — Dev 3)

- **Người thực hiện**: Bảo — Progress Service Owner (Dev 3).
- **Phạm vi sở hữu**: Progress & Biomarkers frontend (`src/features/progress/`, `src/app/progress/`).
- **Mục tiêu**:
  - Triển khai end-to-end toàn bộ module Tiến trình & Chỉ số sinh học trường thọ (Dashboard, Fasting, Water, Sleep, Metrics, BMI snapshot, History chart).
  - Tích hợp 9 API endpoints chuẩn xác từ Backend Progress Service (.NET 10) qua Nginx API Gateway.
  - Áp dụng triệt để chính sách lịch kinh doanh UTC (Q01 / ADR005 do Bảo quyết định theo ủy quyền từ Huy).
  - Khắc phục xung đột tiền tố Gateway (`/api`, `/api/v1`) chống lỗi double `/api/api` và bảo vệ phiên xác thực.
  - Tuân thủ nghiêm ngặt 7 bước scaffold, cấm hoàn toàn `any`/`as any`/`@ts-ignore`, 100% tiếng Việt cho giao diện.

- **Đã thực hiện**:
  1. **Hạ tầng Routing & Cổng Gateway**:
     - `src/common/constants/api-endpoints.ts`: Khai báo tập trung `API_ENDPOINTS.PROGRESS` cho 9 endpoints nghiệp vụ.
     - `src/lib/env.ts` & `next.config.ts`: Chuẩn hóa base origin và rewrites tránh lỗi nhân đôi `/api/api` khi gọi qua Gateway.
     - `src/lib/axios.ts`: Bổ sung interceptor chuẩn hóa URL, đưa `/progress` vào danh sách `PROTECTED_PREFIXES` để chuyển hướng `/login?from=/progress` khi mất phiên.
     - `src/middleware.ts`: Bổ sung `/progress` vào danh sách route bảo vệ Edge Middleware.
     - `src/lib/axios.test.ts`: Thêm test kiểm chứng chuẩn hóa đường dẫn và tự động đính kèm JWT Bearer token (3 tests).
  2. **Tiện ích Xử lý Thời gian chuẩn UTC (Q01 / ADR005)**:
     - `src/features/progress/utils/progress-date.ts`:
       - `getUtcTodayDateString()`: Tự động xác định ngày hôm nay theo lịch UTC (00:30 VN ngày 05/11 vẫn là ngày 04/11 UTC; 07:00 VN mới sang 05/11).
       - `toUtcInstantIsoString()`: Chuẩn hóa mọi thời điểm gửi lên backend thành ISO 8601 instant với explicit `Z`.
       - `parseUtcDateOnly()` & `formatDateOnlyDisplay()`: Xử lý chuỗi `YYYY-MM-DD` bảo lưu ngày người dùng chọn, không lệch múi giờ.
       - `calculateInstantDifferenceHours()`: Tính số giờ chính xác dựa trên instant mili-giây.
       - `formatDurationHours()`: Định dạng tiếng Việt thân thiện (`X giờ Y phút`).
     - `src/features/progress/utils/progress-date.test.ts`: Bộ 21 tests kiểm chứng ranh giới nửa đêm Việt Nam, nửa đêm UTC, thời lượng và định dạng ngày.
  3. **Tầng DTO & Domain Model**:
     - `src/features/progress/types/progress.dto.ts`: Khớp 100% các C# sealed records của backend (`DashboardSummaryResponse`, `StartFastingRequest`, `EndFastingResponse`, `WaterSummaryResponse`, `SleepResponse`, `BodyMetricResponse`, `MetricsHistoryResponse`).
     - `src/features/progress/types/progress.model.ts`: Định nghĩa UI Models sạch, phân biệt rõ ràng giá trị `null` và số `0`, hỗ trợ nhãn tiếng Việt và trạng thái tiến trình.
  4. **Tầng Mapper & Zod Schemas**:
     - `src/features/progress/mappers/progress.mapper.ts`: Kế thừa `BaseMapper`, dùng `pickField` và `safe*` helpers, phân loại thể trạng BMI (Thiếu cân, Bình thường, Thừa cân, Béo phì), chất lượng giấc ngủ, và phân trang an toàn (17 tests).
     - `src/features/progress/schemas/progress.schema.ts`: Zod schema xác thực chặt chẽ cho 5 form:
       - `startFastingSchema`: Protocol `16:8`, `18:6`, `20:4`, `Custom` (1..24h), `startedAt` không ở tương lai.
       - `endFastingSchema`: UUID session, `endedAt` không ở tương lai.
       - `logWaterSchema`: Lượng nước nguyên từ 1 đến 5000 ml.
       - `logSleepSchema`: `wokeAt > sleptAt`, thời lượng <= 24h, chất lượng hợp lệ.
       - `logBodyMetricSchema`: Cân nặng 25.0..300.0 kg; cặp huyết áp tâm thu (50..250) và tâm trương (30..150) phải nhập cùng lúc và tâm thu > tâm trương.
     - `src/features/progress/schemas/progress.schema.test.ts`: Bộ 20 tests kiểm chứng form validations.
  5. **Tầng API & TanStack Query**:
     - `src/features/progress/api/progress.api.ts`: 9 phương thức gọi API bọc trong `progressApi`, chuyển đổi tự động DTO -> Model (7 tests).
     - `src/features/progress/queries/progress.queries.ts`:
       - `progressKeys` Query Key Factory.
       - `useDashboardSummaryQuery`, `useCurrentFastingQuery`, `useWaterTodayQuery`, `useMetricsHistoryQuery`.
       - Mutations tự động invalidate cache liên quan và toast thông báo tiếng Việt: `useStartFastingMutation`, `useEndFastingMutation`, `useLogWaterMutation`, `useLogSleepMutation`, `useLogBodyMetricMutation`.
       - Xử lý lỗi đặc thù: 409 conflict, 422 thiếu chiều cao hồ sơ (`progress.height_unavailable`), 503/502 sự cố dịch vụ phụ thuộc Identity.
  6. **Giao diện & Linh kiện UI (`src/features/progress/components/`)**:
     - `progress-subnav.tsx`: Thanh điều hướng mượt mà giữa các mục con.
     - `progress-summary-cards.tsx`: 4 thẻ tổng quan (Cân nặng, BMI, Streak, Fasting & Giấc ngủ) kèm ghi chú minh bạch chuỗi ngày.
     - `progress-quick-actions.tsx`: Lối tắt thao tác nhanh trong ngày.
     - `fasting-panel.tsx`: Bộ điều khiển nhịn ăn với live timer phía client, thanh tiến trình, dialog xác nhận kết thúc an toàn.
     - `water-tracker.tsx`: Theo dõi nước uống mục tiêu 2500 ml, 4 nút thêm nhanh (+150, +250, +350, +500 ml) và nhập tùy chỉnh.
     - `sleep-log-form.tsx`: Ghi nhận giấc ngủ với thời lượng tính toán theo thời gian thực và xác nhận lưu trữ.
     - `body-metric-form.tsx`: Form nhập chỉ số cơ thể, tự động nhận diện snapshot BMI từ backend, hướng dẫn cập nhật chiều cao khi gặp 422.
     - `weight-trend-chart.tsx`: Biểu đồ SVG xu hướng cân nặng & BMI mượt mà từ dữ liệu lịch sử thực tế.
     - `metrics-history.tsx`: Bảng lịch sử phân trang chuẩn contract, lọc theo khoảng ngày, responsive trên cả desktop và mobile.
  7. **Hệ thống Routes App Router (`src/app/progress/`)**:
     - `src/app/progress/layout.tsx`: Bọc `AuthGuard` bảo vệ phiên và gắn subnav.
     - `src/app/progress/page.tsx`: Dashboard tổng quan (`/progress`).
     - `src/app/progress/fasting/page.tsx`: Trang nhịn ăn gián đoạn (`/progress/fasting`).
     - `src/app/progress/water/page.tsx`: Trang nước uống (`/progress/water`).
     - `src/app/progress/sleep/page.tsx`: Trang giấc ngủ (`/progress/sleep`).
     - `src/app/progress/metrics/page.tsx`: Trang chỉ số cơ thể & lịch sử (`/progress/metrics`).
  8. **Cập nhật tài liệu**:
     - `docs/BACKEND_INTEGRATION.md`: Cập nhật bảng 9 endpoints của Progress Service ở trạng thái `READY`.
     - `docs/PROGRESS.md`: Cập nhật tiến độ Module 07 (Progress & Biomarkers) đạt 100%.

- **Kết quả kiểm chứng (Verification Gates)**:
  - `npx tsc --noEmit`: 0 lỗi type.
  - `npm test`: 8 test suites, 92 tests pass 100% (trong đó có 68 tests cho Progress module).
  - `npm run build`: Build Next.js 16 thành công toàn bộ 15 static/dynamic routes.

---

## [2026-10-25] Khởi tạo nền tảng Longevia Frontend theo kiến trúc tham khảo chuẩn

- **Mục tiêu**:
  - Thiết lập dự án frontend `longevia-fe` dựa trên kiến trúc chuẩn từ repository tham khảo...
