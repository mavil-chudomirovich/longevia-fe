# WORK-LOG — Nhật ký công việc Longevia Frontend

> Ghi nhận chi tiết các thay đổi, quyết định kỹ thuật và kết quả xác minh sau mỗi task.

---

## [2026-11-10] Targets BMR/TDEE, WeekPicker, lịch sử nước/ngủ, AI-only meal-plan

- **Navbar**: đổi thứ tự Trang chủ → Dinh dưỡng → Tiến trình → Hỏi sách.
- **Targets**: bỏ nút "Tính tự động", chỉ còn "Lưu mục tiêu"; BMR/TDEE do PUT tự đính kèm,
  có chú thích nguồn; bỏ câu mô tả đã yêu cầu.
- **WeekPicker**: component dùng chung (lùi/tới tuần + lịch tháng + "Tuần này") cho
  `/diet/meal-plan` và `/progress/workout`; helper trong `src/lib/business-date.ts`.
- **Progress**: card lịch sử uống nước (7/30/90 ngày) và lịch sử giấc ngủ (phân trang, xoá);
  sửa ghi chú UTC cũ.
- **Workout**: tự tải plan đã lưu, 404 là trạng thái rỗng; nhập/lưu giới hạn sức khỏe +
  dụng cụ, prefill từ hồ sơ; hiển thị input của plan đã lưu.
- **Hồ sơ**: thêm checkbox "Đau hoặc tổn thương khớp".
- **Meal-plan**: bỏ UI fallback; request generate timeout 150 giây; đổi sang WeekPicker.
- **Xác minh**: `tsc` 0 lỗi; 221 test pass; lint 0 error; build thành công.

---

## [2026-11-09] Đợt UI fixes + giờ Việt Nam + lịch sử nhịn ăn

- **Điều hướng**: bỏ "Hỏi sách" khỏi sub-nav Dinh dưỡng; bỏ "Gợi ý AI" khỏi navbar chính; đổi tên "Gợi ý bữa ăn".
- **Targets**: desktop 30% gợi ý AI / 70% form; mobile form trước AI.
- **Hỏi sách**: bỏ tiêu đề/mô tả; khung chat cao cố định + scroll riêng + auto-scroll; mở hội thoại cũ và gửi tiếp đúng hội thoại.
- **Meal plan**: 2 tab Đã lưu / Tạo mới; chọn ngày tự chuẩn hoá thứ Hai; hiện lý do fallback theo ngày.
- **Fasting**: thêm card lịch sử phân trang (`GET /progress/fasting/history`).
- **Giờ Việt Nam (ADR006)**: helper `src/lib/business-date.ts`; các trang dùng ngày local thay UTC; `progress-date` đổi sang ngày nghiệp vụ; test cập nhật theo +7.
- **Favicon**: `app/icon.svg` + `apple-icon.png` + `favicon.ico` mô phỏng heart-pulse xanh của header, bỏ `logo-mark.png` veggie.
- **Kiểm chứng**: `tsc` 0 lỗi; 216 test pass; lint 0 error; build thành công.

---

## [2026-11-09] Phase 4 — AI diễn giải mẹo trường thọ & gợi ý mục tiêu dinh dưỡng

- **BE**:
  - Prompt `LongevityTip`: `MealSelector` diễn giải đoạn sách thành 1–2 câu tiếng Việt thay vì trả raw chunk; fallback câu curate sẵn, citation vẫn giữ đoạn gốc.
  - gRPC `SuggestNutritionTargets` + `StructuredResponseKind.NutritionTargetSuggestion`: calo tính bằng Mifflin-St Jeor/TDEE, AI chỉ tinh chỉnh protein/fat trong khoảng an toàn; ngoài khoảng → công thức (`source=formula`).
  - Diet `POST /targets/me/suggest` (không ghi DB) dùng hồ sơ + cân nặng mới nhất.
  - Test: Recommendation unit 387, Recommendation integration 66, Diet integration 47.
- **FE**:
  - `/diet/targets`: khối "Gợi ý bằng AI" (mô tả + mục tiêu), hiển thị rationale markdown, nhãn nguồn (AI/công thức), cảnh báo chưa lưu; điền form, người dùng bấm "Lưu thủ công" mới ghi DB.
  - DTO/model/mapper/API/query cho suggest targets; test mapper source fallback.
- **Kiểm chứng**: `make lint` PASS; `npx tsc --noEmit` 0 lỗi; 24 file / 217 test; `npm run build` thành công.

---

## [2026-11-09] Phase 3 — Hỏi sách dạng chat: SSE + lịch sử hội thoại

- **BE**:
  - gRPC mới `AskLongevityQuestionStream` (server streaming) + `ConversationTurn history`; Gemini stream token qua `IChatStreamModel`.
  - Use case chat: chào hỏi/cảm ơn trả lời cố định không gọi AI; truy xuất + stream câu trả lời grounded; gắn 3 citation từ đoạn sách; câu follow-up ngắn dùng ngữ cảnh lượt trước.
  - Diet: `POST /knowledge/ask/stream` (SSE: delta/citation/done/error), GET/DELETE `/knowledge/conversations`; lưu hội thoại ở `diet_db` (migration `AddKnowledgeConversations`).
  - Nginx: location riêng cho SSE, tắt `proxy_buffering`.
  - Test: Recommendation unit 383 (thêm 5 test stream), Diet unit 19, Diet integration 47, Recommendation integration 66.
- **FE**:
  - BFF route `/api/knowledge/ask/stream` đọc cookie `lv_at` và proxy `ReadableStream` (không buffer).
  - Hook `useKnowledgeChat`: parse SSE theo buffer, ghép delta, gắn citation, đồng bộ id hội thoại; huỷ khi đổi phiên.
  - UI chat: sidebar hội thoại (mới/xoá/chọn), bong bóng tin nhắn, markdown, citation chip, caret streaming, Enter gửi/Shift+Enter xuống dòng.
  - Test: 24 file, 216 test pass.
- **Kiểm chứng thật**: gọi SSE qua nginx với JWT thật → nhận chuỗi `delta` từ Gemini, `citation`, `done`; `GET /conversations` trả `messageCount=2`.
- **Sửa lỗi phát hiện khi verify**: EF đánh dấu message mới là `Modified` khi thêm qua navigation (concurrency 0 rows) → thêm `AddMessage` tường minh vào repository + test hồi quy hai lần SaveChanges.

---

## [2026-11-09] Phase 2 — lý do fallback AI, nhãn tập luyện tiếng Việt, fasting 204

- **BE**:
  - `fasting/current` trả **204** khi chưa có phiên (trước đây 200 body rỗng).
  - Thêm `usedFallbackReason` cho meal plan & workout plan (proto additive + DTO Diet/Progress).
  - Thêm `activityLabel` (tiếng Việt) cho từng ngày tập.
  - Viết lại `rationale`: bỏ từ "caller", dùng nhãn hoạt động tiếng Việt; meal rationale gọn hơn.
  - Test: Recommendation unit 378, Recommendation integration 66, Progress integration 152, Diet integration 46.
- **FE**:
  - DTO/model/mapper nhận `usedFallbackReason` + `activityLabel`; tương thích response cũ (null).
  - Banner fallback hiển thị đúng nguyên nhân, chỉ hiện nút "Thử tạo lại" khi có thể thử lại.
  - Tiêu đề ngày tập ưu tiên `activityLabel` từ BE.
  - Test: 23 file, 212 test pass.
- **Kiểm chứng**: `make lint` PASS (0 warning); `npx tsc --noEmit` 0 lỗi; `npm run build` thành công.

---

## [2026-11-09] Phase 1 UI/UX: markdown, citation chip, sub-nav Dinh dưỡng, sửa lỗi trạng thái

- **Vấn đề**:
  - `/knowledge` là trang mồ côi (không header/footer), tiêu đề "Tri thức" khó hiểu.
  - Trích dẫn hiện inline dài dòng kèm "đã xác minh / chưa kiểm chứng" ở 5 màn hình; nội dung sách/AI không render markdown.
  - `/diet` tự render cụm nút điều hướng, các trang con chỉ có "Về nhật ký" nên phải quay lại `/diet` mới đổi trang.
  - `/progress/fasting` báo "sự cố kết nối" khi chưa có phiên nhịn ăn: API trả 204/body rỗng, mapper coi là dữ liệu sai.
  - `/progress/longevity` và `/progress/workout` lộ key tiếng Anh (`fasting`, `walking`…).
  - Cảnh báo thiếu chất xơ của meal plan bị dồn lên đầu trang thay vì nằm trong ngày tương ứng.
- **Đã thực hiện**:
  - Component dùng chung: `MarkdownText` (react-markdown + remark-gfm + remark-breaks, chặn HTML thô), `CitationChip`/`CitationChipList` (icon + popover hover, bấm mở được), `InfoTooltip`.
  - `diet-subnav.tsx` + gắn vào `diet/layout.tsx`; bỏ cụm nút ở `/diet` và nút "Về nhật ký" ở 5 trang con.
  - `knowledge/layout.tsx` (header/footer), đổi tiêu đề/nhãn menu thành "Hỏi sách"; trả lời + tra cứu render markdown; tra cứu sort theo chương/trang và dedupe.
  - `/diet/targets`: thêm tooltip giải thích BMR, TDEE, calo, P/C/F.
  - `/diet/suggestions`: tooltip P/C/F, citation chip; `/diet/meal-plan`: cảnh báo gắn theo ngày (`partitionWarnings`), markdown rationale/suggestion.
  - `/progress/workout`, `/progress/longevity`: nhãn tiếng Việt qua `progress-labels.ts`, citation chip.
  - Fasting: mapper coi `''`/204 là "không có phiên".
  - Sửa lỗi lint có sẵn: đổi `session()` → `useProgressAiSession()` trong `progress-ai.queries.ts`.
- **Kiểm chứng**:
  - `npx tsc --noEmit`: 0 lỗi.
  - `npm test`: 20 file, **205/205** test pass (thêm test markdown, citation order, partitionWarnings, nhãn tiếng Việt, fasting rỗng).
  - `npm run lint`: 0 error.
  - `npm run build`: 22 route thành công.
- **Chưa làm (phase sau)**: chat + SSE, AI diễn giải mẹo trường thọ, AI gợi ý mục tiêu, viết lại rationale workout phía BE, lý do fallback meal plan.

---

## [2026-11-09] Hoàn thiện các màn AI: meal plan, vi chất, tri thức, workout, longevity, digest

- **Đã thêm**:
  - `/diet/meal-plan`, `/diet/nutrients`, `/knowledge`.
  - `/progress/workout`, `/progress/longevity`.
  - `/profile` toggle nhận báo cáo tuần.
  - API/query/mapper cho meal plan, nutrient gaps, knowledge, workout, longevity.
  - Nút xoá custom food trong `/diet/foods`.
  - Navbar thêm mục “Tri thức”; giữ logic active path dài nhất.
- **Kiểm chứng**:
  - `npx tsc --noEmit`: 0 lỗi.
  - `npm test`: 16 file, 188 test pass.
  - `npm run build`: 27 route thành công.
- **Chưa làm**: FE sửa custom food, Playwright E2E.

---


- **Vấn đề**: `SiteHeader` dùng `pathname.startsWith(item.href)`, nên `/diet/suggestions` khớp cả `/diet` và `/diet/suggestions`; bấm “Gợi ý AI” thì “Dinh dưỡng” cũng sáng.
- **Đã thực hiện**:
  - Thêm `src/components/layout/nav-active.ts` với `getActiveNavHref(pathname, hrefs)`: khớp exact hoặc `href + '/'`, chọn href dài nhất; bỏ query/hash và trailing slash.
  - `site-header.tsx`: tính một `activeHref` và dùng cho cả desktop nav lẫn mobile drawer.
  - Thêm `nav-active.test.ts` với 7 case: `/`, `/diet`, `/diet/`, `/diet/foods`, `/diet/suggestions`, `/progress/metrics`, `/dietary`, `/login`, query/hash.
- **Kiểm chứng**:
  - `npx vitest run src/components/layout/nav-active.test.ts`: 7/7 pass.
  - `npx tsc --noEmit`: 0 lỗi.
  - `npm test`: 16 file, **188/188** test pass.
  - `npm run lint`: 0 error (119 warning có sẵn).
  - `npm run build`: 22 route thành công.

---

## [2026-11-08] Thông báo lỗi thân thiện với người dùng

- **Bảng thông báo dùng chung** `src/lib/error-messages.ts`: mỗi mã lỗi BE (identity/diet/progress/validation/system) có câu tiếng Việt dễ hiểu và, khi có cách khắc phục, nút dẫn tới trang phù hợp (Cập nhật hồ sơ, Ghi cân nặng, Thiết lập mục tiêu, Thêm món ăn, Đăng nhập…).
- **`getApiErrorMessage`** ưu tiên bảng theo `code`, rồi lỗi mạng, rồi `detail` tiếng Việt của BE cho lỗi nhập liệu 400/422, cuối cùng là câu theo HTTP status. Không còn hiển thị mã HTTP, tên dịch vụ hay message kỹ thuật (vd. "502 Gateway", "503 Service Unavailable", "liên hệ quản trị viên"). Thêm `getApiErrorAction`, `toastFriendlyError` (toast kèm nút khắc phục); lỗi theo trường không còn kèm tên trường kỹ thuật.
- **Áp dụng**: interceptor axios, toàn bộ mutation Progress/Diet, trang Gợi ý AI (xử lý thêm `diet.target_not_found` → nút "Thiết lập mục tiêu"), trang Mục tiêu (empty state khi chưa có mục tiêu, giải thích BMR/TDEE, thông báo lệch macro dễ hiểu), đăng nhập/đăng ký/quên/đặt lại/đổi mật khẩu, form hồ sơ (trước đây lỗi lưu hồ sơ không được báo), form thêm món và ghi bữa (không còn unhandled rejection). Request có trang tự hiển thị lỗi được đặt `silent` để không báo hai lần.
- **Bỏ thuật ngữ kỹ thuật trên UI**: "UTC", "snapshot", "64 ký tự hex".
- **Kiểm chứng**: tsc, lint, build pass; Vitest 180/180 (thêm test cho bảng thông báo). Browser: tài khoản chưa có mục tiêu/hồ sơ thấy đúng thông báo và nút dẫn tới trang khắc phục.

## [2026-11-08] Sửa lỗi sau review tích hợp FE–BE

- **Ghi bữa ăn**: `quantity` gửi BE tính theo `servingUnit` của món (vd. gam), không phải số khẩu phần. Dialog hiển thị đơn vị, mặc định điền 1 khẩu phần (= `servingSize`, kể cả khi điền sẵn từ gợi ý AI) và ước tính kcal. Trước đó ghi "1" cho món 100 g/380 kcal chỉ lưu 3,8 kcal.
- **Kẹt redirect đăng nhập**: khi còn cookie phiên nhưng mất `auth-storage`, AuthGuard đẩy về `/login` còn middleware đẩy ngược về `/progress`. Sửa: cookie `lv_session_hint` đọc được từ JS; AuthProvider/AuthGuard silent refresh khi có hint, refresh lỗi thì logout BFF trước khi chuyển trang; middleware chỉ chuyển hướng trang auth khi `lv_at` còn hạn.
- **BFF logout**: dùng Bearer từ header hoặc cookie `lv_at`; nếu thiếu/hết hạn (401) thì xoay refresh token rồi logout bằng cặp mới để refresh token luôn bị thu hồi phía server.
- **Progress**: map thêm `progress.profile_not_found` (banner + CTA `/profile`), `progress.fasting_end_conflict`, `progress.fasting_invalid_time`; banner hồ sơ ở form chỉ số rẽ nhánh theo `code` thay vì status 422.
- **Đổi mật khẩu**: BE thu hồi mọi refresh token kể cả thiết bị hiện tại, nên FE đăng xuất ngay và yêu cầu đăng nhập lại.
- **Khác**: tên cookie tập trung ở `routes.ts`; trang verify-email không còn gợi ý "đăng ký lại" (sẽ bị `email_taken`) và luôn có nút Đăng nhập; khôi phục 3 entry WORK-LOG ngày 2026-11-04 của Bảo đã bị xoá nhầm (bỏ 1 entry trùng).

---

## [2026-11-08] Đồng bộ FE–BE theo kế hoạch tích hợp

- **Phạm vi**: Auth qua Next BFF, hồ sơ sức khỏe, Progress, Diet, đồng bộ OpenAPI và email xác minh.
- **Đã thực hiện**:
  - Căn chỉnh DTO/endpoint/error handling theo Identity, Diet và Progress; thêm BFF giữ refresh token trong HttpOnly cookie, cookie phiên hint chỉ dùng cho middleware, các trang verify/reset email và profile.
  - Bổ sung UI/API cho Diet (foods, targets, meal log, daily summary, recommendations), đồng thời thay các trang/auth giả và link tới route không tồn tại.
  - Worker gửi link xác minh tới FE qua Frontend__BaseUrl; cập nhật compose, .env.example, test Worker và frontend guide.
  - Rebuild các service local cần đồng bộ, lấy lại Swagger từ ba service và sinh catalog mới: 32 operations, 13 nhóm, 41 schemas.
- **Kiểm chứng**:
  - FE: npx tsc --noEmit, npm run lint -- --quiet, npm run build đều thành công; Vitest 15 file, 175 test pass.
  - BE: Worker Unit Tests 16/16 pass; Worker-scope dotnet format verify với --include src/Services/Worker pass; Docker Release publish Identity, Diet, Progress và Worker thành công. Lệnh format toàn project bị dừng sau khi chạy quá lâu.
  - HTTP E2E local: register 201, verify 204, BFF login/refresh/logout 200; BFF không trả refresh token và cookie lv_rt giữ path /api/auth; profile GET/PUT 200; đủ 9 Progress endpoints trả 2xx; Diet food/target calculate+GET+PUT/meal/daily summary trả 2xx; forgot/reset/change password lần lượt 202/204/204. Route /progress cho qua với session hint, rồi redirect 307 sau logout.
  - AI recommendations trả 504 diet.ai_timeout; FE hiển thị lỗi theo mã để người dùng thử lại. Smoke test giao diện xác nhận trang login và redirect guest.
- **Giới hạn**: Không chờ access token hết 15 phút và không mở hai tab để kiểm tra lock refresh; luồng auth được kiểm tra qua HTTP local thay vì nhập credentials trong browser. Tài khoản và dữ liệu synthetic của E2E còn trong DB/Mailpit local.
- **Ghi chú môi trường**: Compose ban đầu chạy image Diet cũ nên calculate/recommendations trả 404; sau khi build image hiện tại, calculate hoạt động và recommendations trả mã timeout dự kiến. Next.js 16 hiện cảnh báo middleware convention sẽ chuyển sang proxy.

---
## [2026-11-05] Hoàn tất PR #1 Final Two-Finding Corrective — Reject Obsolete mutateAsync() Results & Deterministic Dispatch-Time Race Seams (Bảo — Dev 3)

- **Người thực hiện**: Bảo — Progress Service Owner (Dev 3).
- **Phạm vi sở hữu**: Progress & Biomarkers frontend (`src/features/progress/`, `src/app/progress/`).
- **Mục tiêu**:
  - Khắc phục triệt để 2 phát hiện cuối cùng trong đợt rà soát độc lập của PR #1:
    - **Finding A (P2 — Obsolete `mutateAsync()` Results Must Reject Instead of Resolving)**:
      - Trong `useSessionBoundMutation`, sau khi underlying Promise giải quyết thành công, tái kiểm tra phiên thông qua `isProgressSessionActive(initiatingUserId, initiatingSessionId)`.
      - Nếu phiên đã trở nên obsolete (User A đăng xuất, chuyển sang User B, hoặc User A đăng nhập lại với sessionId mới), `mutateAsync` ném lỗi có kiểu rõ ràng `ProgressSessionObsoleteError` (`code = 'PROGRESS_SESSION_OBSOLETE'`), ngăn chặn tuyệt đối việc trả về kết quả riêng tư của User A cho người gọi đang hoạt động dưới User B.
      - Triệt tiêu hoàn toàn toast thành công, toast lỗi ngầm, và vô hiệu hóa triệt để việc cập nhật / làm mới cache chéo tài khoản.
      - Đảm bảo giải phóng tài nguyên `AbortController` vô điều kiện trong khối `finally`.
    - **Finding B (P2 — Deterministic Dispatch-Time Race Reproduction via Two-Signal Protocol)**:
      - Thay thế việc dispatch không có điểm neo đồng bộ bằng giao thức 2 tín hiệu rõ ràng qua `__setProgressMutationTestSeams`:
        - `enteredBeforeDispatch.resolve()`: Bằng chứng toán học khẳng định luồng thực thi đã tạm dừng bên trong điểm nối vòng đời trước khi bất kỳ thay đổi xác thực nào xảy ra.
        - `resumeBeforeDispatch.promise`: Khóa luồng thực thi cho tới khi trạng thái xác thực đã chuyển đổi xong xuôi trong test.
      - Kiểm chứng toán học tuyệt đối:
        - Trường hợp 1 (User A -> Đăng xuất -> User B): 0 HTTP requests được gửi ra mạng, 0 toast cho User B, cache User B nguyên vẹn, controller count = 0, ném `ProgressSessionObsoleteError`.
        - Trường hợp 2 (User A -> Đăng xuất -> User A đăng nhập lại với sessionId mới): 0 HTTP requests được gửi ra mạng, 0 toast, controller count = 0, ném `ProgressSessionObsoleteError`.
        - Trường hợp 3 (User A -> Silent token refresh trong cùng active session): Yêu cầu HTTP được dispatch bình thường, toast thành công hiển thị, kết quả hoàn tất chuẩn xác, controller count = 0.

- **Đã thực hiện**:
  1. `src/features/progress/errors/progress-data-integrity.error.ts`:
     - Thêm lớp lỗi `ProgressSessionObsoleteError extends ProgressAuthError` với `code: 'PROGRESS_SESSION_OBSOLETE'`, bảo toàn tính tương thích ngược `instanceof ProgressAuthError === true`.
  2. `src/features/progress/queries/progress.queries.ts`:
     - Cập nhật `handleProgressMutationError` triệt tiêu toast lỗi khi `error.code === 'PROGRESS_SESSION_OBSOLETE'`.
     - Trong `mutationFn` và `onMutate`, ném `ProgressSessionObsoleteError` khi phát hiện phiên obsolete trước dispatch.
     - Trong `mutateAsync`:
       - Thêm kiểm tra xác thực sau khi hoàn tất: `if (!isProgressSessionActive(initiatingUserId, initiatingSessionId)) throw new ProgressSessionObsoleteError();`.
       - Bọc consumer callbacks trong `try ... catch` để ngăn ngừa lỗi người gọi làm gián đoạn dọn dẹp.
       - Luôn thu hồi controller trong khối `finally { unregister(); }`.
  3. `src/features/progress/tests/progress.behavior.test.tsx`:
     - Mở rộng suite Finding A bao phủ trọn vẹn 12 kịch bản: `mutateAsync` thành công trong phiên active, `mutateAsync` reject khi logout/switch account/same-user relogin, bảo toàn kết quả khi token refresh, giữ nguyên lỗi backend không bao bọc sai, giải phóng controller khi callback throw và phân lập đa mutation đồng thời.
     - Nâng cấp suite Finding B1 (Scenario Q) với giao thức 2 tín hiệu deferred (`enteredBeforeDispatch` & `resumeBeforeDispatch`) cho 3 ca kiểm thử race condition: Account Switch, Session ID Renewal, và Token Refresh.

- **Kết quả kiểm chứng (Verification Gates)**:
  - `npx tsc --noEmit`: 0 lỗi type (0 errors).
  - `npm test`: 11 test files, 179 tests PASS 100% (48 behavioral tests, 8 API tests, 33 mapper tests, 26 date tests, 20 schema tests, 13 query tests, 4 rollover tests, 27 common/auth tests).
  - `npx eslint src/features/progress`: 0 lỗi lint (0 errors, 0 warnings trên behavior test).
  - `npm run build`: Next.js 16 production build thành công toàn bộ 15 routes tĩnh/động.

---

## [2026-11-05] Hoàn tất PR #1 Final Corrective & Verification — Guard Mutation Callbacks, Async Race Seams, Axios Transport Adapter & Session-Keyed Forms (Bảo — Dev 3)

- **Người thực hiện**: Bảo — Progress Service Owner (Dev 3).
- **Phạm vi sở hữu**: Progress & Biomarkers frontend (`src/features/progress/`, `src/app/progress/`).
- **Mục tiêu**:
  - Khắc phục triệt để 4 mục trong đợt đánh giá độc lập cuối cùng của PR #1:
    - **Finding A (P2 — Guard Optional Mutation Callbacks)**: Bảo vệ toàn bộ callback người gọi (`onSuccess`, `onError`, `onSettled`) trong cả `mutate()` và `mutateAsync()` bằng `isProgressSessionActive(initiatingUserId, initiatingSessionId)`. Đảm bảo giải phóng tài nguyên AbortController vô điều kiện trong `onSettled` nội bộ và khối `finally`, không bao giờ phụ thuộc vào consumer callbacks. Bảo toàn cơ chế reject Promise của `mutateAsync` khi phiên bị hủy.
    - **Finding B1 (P2 — Scenario Q Replacement: Real Asynchronous Race Reproduction)**: Thay thế test unauthenticated nông cạn bằng kịch bản race condition không đồng bộ thực tế qua điểm dừng vòng đời (lifecycle seam: `__setProgressMutationTestSeams`). Kiểm chứng triệt để: User A bắt đầu mutation -> tạm dừng trước dispatch -> chuyển sang User B / cùng User đăng nhập lại (session renewal) -> tiếp tục: xác minh 0 HTTP request được gửi ra backend, 0 toast cho User B, cache User B nguyên vẹn. Ngược lại, token refresh trong cùng phiên vẫn cho phép mutation tiếp diễn bình thường.
    - **Finding B2 (P2 — Scenario P Replacement: Real Axios Interceptor Testing)**: Chấm dứt việc mock trực tiếp các phương thức của `progressApi`. Kiểm thử xuyên suốt qua `progressApi` và đối tượng Axios dùng chung (`api`) bằng transport adapter mạng giả lập (`api.defaults.adapter`), giữ nguyên 100% request và response interceptors của `src/lib/axios.ts`. Xác thực các mã lỗi (409, 422, 502, 503, 500, 403, 429, mất kết nối mạng) trong phiên active chỉ hiển thị duy nhất 1 toast từ Progress (0 duplicate toast từ Axios nhờ `silent: true`); và triệt tiêu 100% toast khi phiên đã chuyển sang User B.
    - **Finding B3 (Preserve Mapper End-to-End Test)**: Bảo toàn kịch bản Scenario J qua Axios boundary với payload ngày không hợp lệ 30/02 ném `ProgressDataIntegrityError` hiển thị error card rõ ràng kèm nút thử lại, tuyệt đối không tạo ngày giả mạo.
    - **Finding C (P2 — Remove React Render-Phase Form Resets)**: Loại bỏ hoàn toàn `form.reset()` trong render phase (`formSessionRef.current !== sessionId`) tại `body-metric-form.tsx`, `sleep-log-form.tsx`, và `water-tracker.tsx`. Tách thành các session-keyed inner form components (`key={sessionId || 'unauthenticated'}`), cho phép React remount form một cách tự nhiên với giá trị mặc định sạch khi phiên thay đổi, bảo toàn bản nháp của người dùng khi token refresh âm thầm, và tương thích hoàn toàn với React StrictMode.

- **Đã thực hiện**:
  1. `src/features/progress/utils/progress-session.ts`: Thêm `unregisterSessionAbortController` và `getActiveSessionAbortControllerCount` phục vụ kiểm tra dọn dẹp tài nguyên. Hàm hủy đăng ký được bảo đảm tính idempotent.
  2. `src/features/progress/queries/progress.queries.ts`:
     - Thiết lập test seam `__setProgressMutationTestSeams` cho phép can thiệp dừng trước khi dispatch HTTP.
     - Trong `useSessionBoundMutation`: Cấu hình `onSettled` nội bộ trên `useMutation` để luôn luôn thu hồi AbortController.
     - Bọc per-call caller callbacks (`options?.onSuccess`, `options?.onError`, `options?.onSettled`) qua điều kiện `isProgressSessionActive`. Bọc `try ... catch ... finally { unregister(); }` ngăn lỗi từ consumer làm hỏng vòng đời dọn dẹp.
  3. UI Components (`body-metric-form.tsx`, `sleep-log-form.tsx`, `water-tracker.tsx`):
     - Xóa bỏ `formSessionRef` và lệnh gọi `form.reset()` trong render phase.
     - Cấu trúc lại theo pattern Component/ComponentInner với `key={sessionId || 'unauthenticated'}`.
     - Bảo toàn việc dẫn xuất đồng bộ dữ liệu riêng tư (`visibleRecord`, `visibleSleepRecord`) tại render commit.
  4. `src/features/progress/tests/progress.behavior.test.tsx`:
     - Bổ sung bộ test Finding A (7 tests) kiểm tra callbacks và dọn dẹp controller.
     - Bổ sung bộ test Finding B1 (3 tests) kiểm tra race condition dispatch qua test seams.
     - Bổ sung bộ test Finding B2 (9 tests) kiểm tra lỗi qua `api.defaults.adapter` thực tế với đầy đủ các mã lỗi.
     - Bổ sung bộ test Finding C (6 tests) kiểm tra phân lập form draft qua tài khoản, giữ nháp qua token refresh, an toàn khi mutation hoàn tất muộn và chạy mượt mà trong React.StrictMode.
  5. `docs/handoffs/progress-to-identity-auth-blocker.md`, `docs/PROGRESS.md`, `docs/WORK-LOG.md`: Cập nhật chi tiết tiến độ, quyết định thiết kế và bằng chứng kiểm thử.

- **Kết quả kiểm chứng (Verification Gates)**:
  - `npx tsc --noEmit`: 0 lỗi type (0 errors).
  - `npm test`: 11 test files, 174 tests PASS 100% (43 behavioral regression tests, 8 API tests, 33 mapper tests, 26 date tests, 20 schema tests, 13 query tests, 4 rollover tests, 27 common/auth tests).
  - `npx eslint src/features/progress`: 0 lỗi lint (0 errors).
  - `npm run build`: Next.js 16 production build thành công toàn bộ 15 routes tĩnh/động.

- **Người thực hiện**: Bảo — Progress Service Owner (Dev 3).
- **Phạm vi sở hữu**: Progress & Biomarkers frontend (`src/features/progress/`, `src/app/progress/`).
- **Mục tiêu**:
  - Khắc phục triệt để 4 phát hiện P1 & P2 về an toàn phiên trong đợt đánh giá độc lập PR #1:
    - **Finding 1 (P1 — Mutation Context & HTTP Dispatch Session Mismatch)**: Loại bỏ race condition khi tài khoản thay đổi trước khi `mutationFn` thực thi. Đăng ký và quản lý `AbortController` cho từng phiên (`progress-session.ts`). Tái kiểm tra phiên ngay trước khi gửi request ra mạng trong `mutationFn`; hủy controller và chặn dispatch (0 network calls) nếu phiên không còn active.
    - **Finding 2 (P2 — Stale Toasts from Shared Axios Interceptor)**: Cấu hình `silent: true`, `showErrorToast: false` và `signal` cho toàn bộ 5 mutation endpoints trong `progress.api.ts`. Chuyển toàn bộ việc xử lý lỗi (409, 422, 502, 503, 500+, network failure) về mutation hooks, chỉ hiển thị toast khi phiên khởi tạo vẫn active; triệt tiêu 100% stale toast khi người dùng logout / chuyển tài khoản.
    - **Finding 3 (P2 — Previously Displayed Private Results Leaking during Session Transition)**: Thay thế việc xóa trễ qua `useEffect` bằng cơ chế kiểm tra quyền sở hữu phiên đồng bộ ngay tại thời điểm render (synchronous render-time derivation) trong `BodyMetricForm`, `SleepLogForm`, `FastingPanel`, và `WaterTracker`. Loại bỏ hoàn toàn flash commit dữ liệu riêng tư của User A cho User B.
    - **Finding 4 (P2 — Behavioral Coverage & False Confidence Gaps)**: Mở rộng bộ kiểm thử hành vi thực tế (tổng 24 test cases A-R) bao phủ:
      - Pipeline thực tế Axios `api.get` boundary -> `progressMapper` ném `ProgressDataIntegrityError` -> UI render error card.
      - Vòng đời cache khi `ProgressCacheSync` đã mount sẵn và dọn dẹp không đồng bộ User A bảo toàn 100% cache User B.
      - Xử lý lỗi máy chủ & gateway (502, 503, 500, network error) trong phiên active và triệt tiêu khi phiên đã chuyển.
      - Ngăn chặn dispatch HTTP call tại thời điểm dispatch khi phiên mất hiệu lực.
      - Bảo vệ dữ liệu riêng tư đồng bộ ngay tại render commit đầu tiên khi đổi tài khoản.

- **Đã thực hiện**:
  1. `src/features/progress/utils/progress-session.ts`: Thêm `registerSessionAbortController`, `abortSessionControllers`, `abortAllSessionControllers`. Tự động hủy toàn bộ active controllers khi logout hoặc chuyển session.
  2. `src/features/progress/api/progress.api.ts`: Cập nhật `startFasting`, `endFasting`, `logWater`, `logSleep`, `logBodyMetric` nhận `signal?: AbortSignal` và gửi `{ silent: true, showErrorToast: false, signal }`.
  3. `src/features/progress/queries/progress.queries.ts`: Triển khai `useSessionBoundMutation` kiểm tra phiên tức thì khi `mutate`/`mutateAsync`, revalidate trước khi dispatch trong `mutationFn`, xử lý toàn diện lỗi 502/503/500/network trong `handleProgressMutationError` và chỉ toast khi phiên active.
  4. UI Components (`body-metric-form.tsx`, `sleep-log-form.tsx`, `fasting-panel.tsx`, `water-tracker.tsx`): Ràng buộc `{ record, ownerUserId, ownerSessionId }` và tính toán `visibleRecord` đồng bộ trong render trước JSX.
  5. `docs/handoffs/progress-to-identity-auth-blocker.md`: Phân tích và ghi nhận giới hạn toast 401 refresh failure của Axios interceptor thuộc phạm vi Auth/Identity.
  6. `src/features/progress/tests/progress.behavior.test.tsx`: Mở rộng lên 24 kịch bản kiểm thử hành vi thực tế (Scenarios A-R).

- **Kết quả kiểm chứng (Verification Gates)**:
  - `npx tsc --noEmit`: 0 lỗi type (0 errors).
  - `npm test`: 11 test files, 155 tests PASS 100% (24 behavioral tests, 8 API tests, 33 mapper tests, 26 date tests, 20 schema tests, 13 query tests, 4 rollover tests, 27 common/auth tests).
  - `npm run build`: Next.js 16 build thành công toàn bộ 15 static/dynamic routes.

---

## [2026-11-04] Hoàn tất PR #1 Final Progress Corrective — Bảo toàn toàn vẹn dữ liệu thời gian & Phân lập phiên an toàn (Bảo — Dev 3)

- **Người thực hiện**: Bảo — Progress Service Owner (Dev 3).
- **Phạm vi sở hữu**: Progress & Biomarkers frontend (`src/features/progress/`, `src/app/progress/`).
- **Mục tiêu**:
  - Khắc phục triệt để 3 phát hiện P1 & P2 trong đợt đánh giá độc lập lần 2 của PR #1:
    - **P1 — Data Integrity (Corrective A)**: Tuyệt đối không thay thế timestamp backend bị lỗi/thiếu bằng thời gian hiện tại (`new Date()`). Tạo `parseRequiredInstant` tuân thủ ISO 8601 strict có explicit timezone, từ chối ngày bất khả thi (VD: 30/02) và offset vượt ngưỡng (+25:00), ném `ProgressDataIntegrityError`.
    - **P2 — Session Isolation (Corrective B)**: Ngăn chặn triệt để cross-account side-effects khi người dùng logout hoặc chuyển đổi tài khoản (User A -> User B). Quản lý phiên độc lập (`progress-session.ts`), ràng buộc mutation context theo `{ initiatingUserId, initiatingSessionId }`, chặn ngay mutation chưa xác thực trước khi gửi network, triệt tiêu toasts và cache invalidation của session cũ khi API phản hồi muộn.
    - **P2 — Testing (Corrective C)**: Xây dựng bộ kiểm thử hành vi thực tế (Real React Behavioral Regression Tests) trong môi trường JSDOM bao phủ toàn bộ 16 kịch bản A qua O.
    - **Audit useProgressAuth**: Loại bỏ hoàn toàn lỗ hổng xác thực khi truyền `customUserId`, chỉ kích hoạt truy vấn khi có session hợp lệ và `authUserId` khớp `customUserId`.

- **Đã thực hiện**:
  1. **Định dạng & Toàn vẹn Dữ liệu Thời gian (P1 — Corrective A)**:
     - Tạo `src/features/progress/errors/progress-data-integrity.error.ts`: Định nghĩa `ProgressDataIntegrityError` và `ProgressAuthError`.
     - `src/features/progress/utils/progress-date.ts`: Triển khai `parseRequiredInstant(value, fieldName, resourceName)`. Kiểm tra lịch nhuận, số ngày tối đa trong tháng, offset (-14:00 đến +14:00), yêu cầu timezone chỉ định (Z hoặc offset).
     - `src/features/progress/mappers/progress.mapper.ts`: Loại bỏ hoàn toàn fallback `new Date()`. `toCurrentFastingSession`, `toFastingSessionResult`, `toEndFastingResult`, `toSleepRecord`, `toBodyMetricRecord`, `toMetricsHistory` đều bắt buộc timestamp hợp lệ.
     - `src/features/progress/mappers/progress.mapper.test.ts`: Bổ sung 13 tests toàn diện cho Corrective A (tổng 33 unit tests pass 100%).
  2. **Quản lý Phiên & Độc lập Mutation (P2 — Corrective B)**:
     - Tạo `src/features/progress/utils/progress-session.ts`: Quản lý `activeSessionId`, `activeUserId`, `sessionEpoch`. Phân biệt đăng nhập lại cùng tài khoản (Session 1 vs Session 2), bảo toàn session ID khi token refresh âm thầm.
     - `src/features/progress/queries/progress.queries.ts`:
       - `useProgressAuth(customUserId)`: Khắc phục triệt để bypass, chỉ `isEnabled = Boolean(isAuthenticated && authUserId && isMatch)`.
       - Toàn bộ 5 mutation hooks (`useStartFastingMutation`, `useEndFastingMutation`, `useLogWaterMutation`, `useLogSleepMutation`, `useLogBodyMetricMutation`): Bắt buộc kiểm tra phiên trong `mutationFn` và `onMutate`. Bỏ qua toast & invalidate queries nếu `isProgressSessionActive` trả về `false`.
     - Cập nhật an toàn UI tiếp nối (`fasting-panel.tsx`, `sleep-log-form.tsx`, `body-metric-form.tsx`, `water-tracker.tsx`): Kiểm tra `isProgressSessionActive` trước khi hiển thị modal hoặc cập nhật state private; xóa sạch state riêng tư khi phiên thay đổi.
  3. **Bộ Kiểm thử Hành vi React (P2 — Corrective C)**:
     - Cài đặt `@testing-library/react@^16.2.0`, `@testing-library/dom`, `@testing-library/jest-dom@^6.6.3`, `jsdom@^26.0.0`.
     - Tạo `src/features/progress/tests/progress.behavior.test.tsx` gồm 16 test cases bao phủ toàn bộ Scenarios A -> O:
       - Scenario A: Mutation bình thường kích hoạt toast và invalidate đúng user queries.
       - Scenario B: User logout khi mutation đang pending -> triệt tiêu toast và không invalidate cache.
       - Scenario C: Chuyển tài khoản A -> B khi pending -> triệt tiêu toast A, không chạm cache B.
       - Scenario D: Lỗi muộn khi chuyển tài khoản -> không hiển thị toast lỗi của A cho B.
       - Scenario E: Đăng nhập lại cùng user (Session 1 vs 2) -> triệt tiêu side-effects của Session 1.
       - Scenario F: Cách ly chỉ số cơ thể & BMI riêng tư -> không lộ cho user B và xóa state private khi chuyển user.
       - Scenario G: Cách ly kết quả giấc ngủ riêng tư -> B không thấy kết quả vừa lưu của A.
       - Scenario H: Cách ly modal hoàn thành nhịn ăn -> không mở dialog chúc mừng của A cho B.
       - Scenario I: Giữ nguyên business error toasts (409 conflict, 422 height unavailable) trong active session.
       - Scenario J: Mapper error hiển thị explicit error state card kèm nút Thử lại.
       - Scenario K: `ProgressCacheSync` dọn dẹp cache User A khi User B vào layout.
       - Scenario L: Chặn mutation unauthenticated trước khi dispatch network và ném `ProgressAuthError`.
       - Scenario M: Concurrent mutations qua tài khoản chuyển đổi đều bị triệt tiêu an toàn.
       - Scenario N: Token refresh bảo toàn quyền sở hữu mutation và hoàn tất thành công.
       - Scenario O: Dọn dẹp triệt để cache của user cũ khỏi `queryClient` khi phiên kết thúc.

- **Kết quả kiểm chứng (Verification Gates)**:
  - `npx tsc --noEmit`: 0 lỗi type (0 errors).
  - `npm test`: 11 test files, 146 tests PASS 100% (trong đó có 16 behavioral tests và 103 Progress unit tests).
  - `npm run build`: Next.js 16 build thành công toàn bộ 15 static/dynamic routes.

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
