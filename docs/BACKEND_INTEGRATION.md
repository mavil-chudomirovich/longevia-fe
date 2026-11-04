# BACKEND INTEGRATION — Longevia Microservices

> Bản đồ tích hợp giữa `longevia-fe` và hệ thống backend microservices ASP.NET Core (.NET 10).

---

## 1. Kiến trúc Cổng kết nối (API Gateway)

Frontend giao tiếp với toàn bộ backend qua **Nginx API Gateway** tại cổng `8080` (hoặc cấu hình trong `.env.local` qua `NEXT_PUBLIC_API_URL`):

```
Client (longevia-fe:3000)
       │ HTTP / HTTPS
       ▼
Nginx Gateway (:8080)
       ├── /api/identity/**  ──> Identity Service (:8080)
       ├── /api/diet/**      ──> Diet Service (:8080)
       ├── /api/progress/**  ──> Progress Service (:8080)
       └── /swagger/         ──> Swagger UI (tổng hợp 3 service)
```

> **Lưu ý đặc biệt về Recommendation Service**:
> Recommendation Service là dịch vụ **nội bộ hoàn toàn (gRPC-only)**, sở hữu cơ sở dữ liệu `recommendation_db` (RAG Knowledge Base trích xuất từ sách "Chế độ ăn trường thọ"). Nginx **không** mở route ra ngoài cho service này. Frontend nhận gợi ý AI thông qua `Diet Service` hoặc `Progress Service`.

---

## 2. Danh sách dịch vụ và trạng thái Endpoint

### 2.1. Identity Service (`/api/identity/*`)

| Endpoint                | Method | Trạng thái    | Mô tả                                                   |
| ----------------------- | ------ | ------------- | ------------------------------------------------------- |
| `/auth/register`        | `POST` | `READY`       | Đăng ký tài khoản người dùng mới                        |
| `/auth/login`           | `POST` | `READY`       | Đăng nhập, trả về Access Token + HttpOnly Refresh Token |
| `/auth/refresh`         | `POST` | `READY`       | Silent refresh token theo cơ chế rotation               |
| `/auth/logout`          | `POST` | `READY`       | Thu hồi refresh token và xóa cookie phiên               |
| `/users/me`             | `GET`  | `READY`       | Thông tin người dùng hiện tại và vai trò                |
| `/users/me/preferences` | `PUT`  | `IN_PROGRESS` | Cập nhật mục tiêu và sở thích ăn uống cá nhân           |

### 2.2. Diet Service (`/api/diet/*`)

| Endpoint               | Method | Trạng thái    | Mô tả                                                   |
| ---------------------- | ------ | ------------- | ------------------------------------------------------- |
| `/diet-rules`          | `GET`  | `IN_PROGRESS` | Nguyên tắc dinh dưỡng và danh mục thực phẩm khuyến nghị |
| `/meal-plans`          | `GET`  | `IN_PROGRESS` | Danh sách kế hoạch bữa ăn đã lưu                        |
| `/meal-plans/generate` | `POST` | `PLANNED`     | Tạo kế hoạch ăn uống tự động dựa trên RAG AI            |
| `/recipes`             | `GET`  | `PLANNED`     | Danh mục công thức món ăn trường thọ                    |

### 2.3. Progress Service (`/api/progress/*`) — Sở hữu: Bảo (Dev 3)

Tất cả business endpoints đều yêu cầu JWT Bearer Token thuật toán ES256 được cấp bởi Identity Service. Gateway Nginx tự động strip tiền tố `/api/progress/` trước khi forward tới Progress Service root.

| Endpoint Gateway                  | Method | Trạng thái | Mô tả                                             | Chi tiết tích hợp & Lưu ý                                                                                                                                                                                                                                |
| --------------------------------- | ------ | ---------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/progress/dashboard/summary` | `GET`  | `READY`    | Tổng hợp chỉ số dashboard, streak, delta cân nặng | Trả về cân nặng hiện tại, cân nặng ban đầu, delta so với tuần trước, BMI, streak hiện tại/kỷ lục, số phiên fasting hoàn thành trong tuần, giờ ngủ TB 7 ngày.                                                                                             |
| `/api/progress/fasting/current`   | `GET`  | `READY`    | Lấy phiên nhịn ăn đang hoạt động                  | Trả về `CurrentFastingResponse` nếu có phiên đang diễn ra hoặc `null` nếu không có phiên hoạt động.                                                                                                                                                      |
| `/api/progress/fasting/start`     | `POST` | `READY`    | Bắt đầu một phiên nhịn ăn mới                     | Body: `protocol` (16:8, 18:6, 20:4, Custom), `startedAt` (ISO UTC instant), `targetHours` (1..24). Báo 409 nếu đã có phiên active.                                                                                                                       |
| `/api/progress/fasting/end`       | `POST` | `READY`    | Kết thúc phiên nhịn ăn hiện tại                   | Body: `sessionId` (UUID), `endedAt` (ISO UTC instant). Tính toán `actualHours` và cờ `isGoalReached`.                                                                                                                                                    |
| `/api/progress/water/today`       | `GET`  | `READY`    | Tổng lượng nước uống trong ngày                   | Tính theo chu kỳ UTC (chuyển ngày lúc 00:00 UTC). Mục tiêu MVP cố định: 2500 ml.                                                                                                                                                                         |
| `/api/progress/water/log`         | `POST` | `READY`    | Ghi nhận lượng nước uống                          | Body: `amountMl` (1..5000 ml). Tự động cộng dồn vào tổng lượng nước hôm nay.                                                                                                                                                                             |
| `/api/progress/sleep/log`         | `POST` | `READY`    | Ghi nhận thông tin giấc ngủ                       | Body: `sleptAt`, `wokeAt` (ISO UTC instant, <=24h), `sleepQuality` (Poor, Fair, Good, Excellent). Báo 409 nếu trùng lặp khoảng thời gian.                                                                                                                |
| `/api/progress/metrics`           | `POST` | `READY`    | Ghi nhận chỉ số cơ thể & snapshot BMI             | Body: `loggedAt`, `weightKg` (25..300), optional: `bodyFatPercent`, `waistCircumferenceCm`, cặp huyết áp (`systolicBloodPressure`, `diastolicBloodPressure`), `restingHeartRate`. Yêu cầu chiều cao từ Identity; trả về 422 nếu hồ sơ chưa có chiều cao. |
| `/api/progress/metrics/history`   | `GET`  | `READY`    | Tra cứu lịch sử chỉ số phân trang                 | Query params: `fromDate?`, `toDate?` (YYYY-MM-DD), `pageNumber?`, `pageSize?`. Trả về `items`, `pageNumber`, `pageSize`, `totalCount`, `totalPages`.                                                                                                     |

> **Chính sách lịch kinh doanh UTC (Q01 / ADR005)**:
>
> - Các giá trị ngày do hệ thống tự sinh (`water/today`, ngày kết thúc giấc ngủ, ngày ghi nhận chỉ số, streak, tuần bắt đầu Thứ Hai 00:00 UTC) tuân thủ hoàn toàn theo lịch UTC.
> - Tại Việt Nam (UTC+7), thời điểm 00:30 ngày 05/11 vẫn thuộc ngày 04/11 UTC; mốc 07:00 ngày 05/11 mới bước sang ngày 05/11 UTC.
> - Ngày lịch sử (`fromDate`, `toDate`, DateOnly) do người dùng chọn chủ động được bảo lưu nguyên vẹn, không bị lệch múi giờ.

---

## 3. Quy trình đồng bộ OpenAPI / Swagger

Khi backend cập nhật endpoint mới, chạy lệnh:

```powershell
# Chạy đồng bộ từ file swagger hoặc URL Gateway
npm run sync:swagger
```

Script sẽ cập nhật catalog tại `docs/API-CATALOG.md` và `docs/api/<service>.md` giúp các AI Agent tra cứu nhanh mà không cần đọc trực tiếp toàn bộ spec lớn.
