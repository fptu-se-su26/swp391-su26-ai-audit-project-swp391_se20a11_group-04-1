# SE AI Audit Project Template

## 1. Project Information

| Item | Description |
|---|---|
| Course | SWP391 |
| Class | SE20A11 |
| Semester | SU26 |
| Group | 4 |
| Topic | An AI-Integrated Project Workspace for IT Student Teams |
| Repository |  |

---

## 2. Team Members

| No | Student ID | Full Name | GitHub Username | Role | Main Responsibility |
|---:|---|---|---|---|---|
| 1 | DE190330 | Phạm Duy Hưng | hung2689 | Leader |  |
| 2 | DE190465 | Nguyễn Thành Đạt | NguyenThanhDat3004 | Member |  |
| 3 | DE190364 | Nguyễn Lê  Trung Tín |Tinnguyen13-7    | Member |  |
| 4 | DE190313 | Trần Công Tú | TuTran205 | Member |  |
| 5 | DE200322 | Nguyễn Minh Hiếu | hieu2816 | Member |  |

---

## 3. Project Structure

```text
src/
docs/
.github/
README.md
```

---

## 4. Required AI Audit Documents

Each group must maintain the following documents:

```text
docs/AI_AUDIT_LOG.md
docs/PROMPTS.md
docs/REFLECTION.md
docs/CHANGELOG.md
```

---

## 5. Workflow

Students must follow this workflow:

```text
Issue → Branch → Commit → Pull Request → Review → Merge
```

Direct push to the `main` branch should be avoided.

---

## 6. Branch Naming Convention

```text
feature/studentid-task-name
bugfix/studentid-error-name
docs/studentid-update-audit-log
test/studentid-test-case-name
```

Example:

```text
feature/se123456-login-page
bugfix/se123456-login-validation
docs/se123456-update-ai-audit-log
```

---

## 7. Commit Message Convention

```text
[StudentID] type: short description
```

Examples:

```text
[SE123456] feat: add login page
[SE123456] fix: fix login validation
[SE123456] docs: update AI audit log
[SE123456] test: add login test cases
```

Common types:

```text
feat, fix, docs, test, refactor, style, chore
```

---

## 8. How to Run

### 📋 Prerequisites

| Tool | Version | Download |
|---|---|---|
| Java JDK | 21+ | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org (hoặc dùng `./mvnw`) |
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 15+ | https://www.postgresql.org |
| Redis | 7+ | https://redis.io (Windows: https://github.com/tporadowski/redis/releases) |

---

### 1️⃣ Khởi động Redis

Redis được dùng để lưu **OTP**, **Session** và **Cache** cho hệ thống.

**Windows** (nếu cài Redis qua file .zip hoặc installer):
```bash
# Chạy Redis server (mặc định port 6379)
redis-server
```

**Kiểm tra Redis đang chạy:**
```bash
redis-cli ping
# Kết quả mong đợi: PONG
```

> ⚠️ Đảm bảo Redis đang chạy **trước** khi khởi động backend, nếu không backend sẽ báo lỗi kết nối.

---

### 2️⃣ Cấu hình Database (PostgreSQL)

1. Tạo database trong PostgreSQL:
```sql
CREATE DATABASE dev_track_ai;
```

2. Sao chép file cấu hình mẫu:
```bash
# Từ thư mục code/backend/src/main/resources/
copy application.yaml.example application.yaml
```

3. Mở `application.yaml` và điền thông tin của bạn:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/dev_track_ai
    username: postgres
    password: YOUR_PASSWORD   # 👈 Đổi thành mật khẩu PostgreSQL của bạn

  data:
    redis:
      host: localhost
      port: 6379              # Port mặc định của Redis

  mail:
    username: your@gmail.com  # 👈 Gmail để gửi OTP
    password: xxxx xxxx xxxx xxxx  # 👈 App Password 16 ký tự
```

> 💡 **Flyway** sẽ tự động tạo bảng khi backend khởi động lần đầu.

---

### 3️⃣ Chạy Backend (Spring Boot)

```bash
# Di chuyển vào thư mục backend
cd code/backend

# Chạy bằng Maven Wrapper (không cần cài Maven)
./mvnw spring-boot:run

# Hoặc trên Windows
mvnw.cmd spring-boot:run
```

Backend khởi động tại: **http://localhost:8080**

---

### 4️⃣ Cấu hình và chạy Frontend (React + Vite)

```bash
# Di chuyển vào thư mục frontend
cd code/frontend

# Cài dependencies
npm install

# Tạo file .env từ file mẫu
copy .env.example .env
```

Mở `.env` và điền thông tin:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id   # (nếu dùng Google Login)
```

Chạy frontend:
```bash
npm run dev
```

Frontend khởi động tại: **http://localhost:5173**

---

### ✅ Thứ tự khởi động đúng

```
1. Redis      → redis-server
2. PostgreSQL → (đảm bảo service đang chạy)
3. Backend    → ./mvnw spring-boot:run
4. Frontend   → npm run dev
```

---

## 9. AI Usage Rule

Students are allowed to use AI tools such as ChatGPT, Gemini, Claude, GitHub Copilot, Cursor, Antigravity, or similar tools.

However, all important AI usage must be recorded in:

```text
docs/AI_AUDIT_LOG.md
docs/PROMPTS.md
docs/CHANGELOG.md
docs/REFLECTION.md
```

Students must be able to explain, verify, and defend all submitted work.
