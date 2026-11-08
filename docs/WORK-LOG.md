# WORK-LOG — Nhật ký công việc Longevia Frontend

> Ghi nhận chi tiết các thay đổi, quyết định kỹ thuật và kết quả xác minh sau mỗi task.

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

## [2026-10-25] Khởi tạo nền tảng Longevia Frontend theo kiến trúc tham khảo chuẩn

- **Mục tiêu**:
  - Thiết lập dự án frontend `longevia-fe` dựa trên kiến trúc chuẩn từ repository tham khảo...
