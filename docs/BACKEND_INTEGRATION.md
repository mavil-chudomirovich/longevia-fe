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

| Endpoint | Method | Trạng thái | Mô tả |
|---|---|---|---|
| `/auth/register` | `POST` | `READY` | Đăng ký tài khoản người dùng mới |
| `/auth/login` | `POST` | `READY` | Đăng nhập, trả về Access Token + HttpOnly Refresh Token |
| `/auth/refresh` | `POST` | `READY` | Silent refresh token theo cơ chế rotation |
| `/auth/logout` | `POST` | `READY` | Thu hồi refresh token và xóa cookie phiên |
| `/users/me` | `GET` | `READY` | Thông tin người dùng hiện tại và vai trò |
| `/users/me/preferences` | `PUT` | `IN_PROGRESS` | Cập nhật mục tiêu và sở thích ăn uống cá nhân |

### 2.2. Diet Service (`/api/diet/*`)

| Endpoint | Method | Trạng thái | Mô tả |
|---|---|---|---|
| `/diet-rules` | `GET` | `IN_PROGRESS` | Nguyên tắc dinh dưỡng và danh mục thực phẩm khuyến nghị |
| `/meal-plans` | `GET` | `IN_PROGRESS` | Danh sách kế hoạch bữa ăn đã lưu |
| `/meal-plans/generate` | `POST` | `PLANNED` | Tạo kế hoạch ăn uống tự động dựa trên RAG AI |
| `/recipes` | `GET` | `PLANNED` | Danh mục công thức món ăn trường thọ |

### 2.3. Progress Service (`/api/progress/*`)

| Endpoint | Method | Trạng thái | Mô tả |
|---|---|---|---|
| `/progress/logs` | `GET` | `IN_PROGRESS` | Lịch sử ghi nhận bữa ăn và năng lượng |
| `/progress/logs` | `POST` | `IN_PROGRESS` | Ghi nhận tuân thủ bữa ăn và nhịn ăn gián đoạn |
| `/progress/biomarkers` | `GET` | `PLANNED` | Chỉ số sinh học (huyết áp, cân nặng, BMI, giấc ngủ) |

---

## 3. Quy trình đồng bộ OpenAPI / Swagger

Khi backend cập nhật endpoint mới, chạy lệnh:

```powershell
# Chạy đồng bộ từ file swagger hoặc URL Gateway
npm run sync:swagger
```

Script sẽ cập nhật catalog tại `docs/API-CATALOG.md` và `docs/api/<service>.md` giúp các AI Agent tra cứu nhanh mà không cần đọc trực tiếp toàn bộ spec lớn.
