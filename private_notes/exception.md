````md
# Spring Boot Exception Handling Prompt

## Yêu cầu

Hãy refactor và xử lý exception cho toàn bộ project Spring Boot theo chuẩn production với các yêu cầu sau:

---

# 1. Global Exception Handling

Tạo hệ thống Global Exception Handling sử dụng:

- `@RestControllerAdvice`
- `@ExceptionHandler`

---

# 2. Tạo Custom Exception

Tạo đầy đủ các custom exception:

- `ResourceNotFoundException`
- `DuplicateResourceException`
- `BadRequestException`
- `UnauthorizedException`
- `ForbiddenException`
- `BusinessException`

Yêu cầu:

- kế thừa `RuntimeException`
- có constructor nhận `message`
- có thể mở rộng thêm `errorCode` nếu cần

---

# 3. API Response Chuẩn

Tạo response chuẩn cho API lỗi:

```json
{
  "success": false,
  "message": "Use case code already exists",
  "data": null,
  "errors": null,
  "timestamp": "2026-05-20T14:00:00"
}
```

---

# 4. Tạo ApiResponse Generic

Tạo class dùng chung:

```java
ApiResponse<T>
```

Bao gồm:

- success
- message
- data
- errors
- timestamp

---

# 5. Xử lý Exception Đầy Đủ

Trong `GlobalExceptionHandler` xử lý:

- Custom exceptions
- `MethodArgumentNotValidException`
- `ConstraintViolationException`
- `DataIntegrityViolationException`
- `HttpMessageNotReadableException`
- `AccessDeniedException`
- `AuthenticationException`
- `Exception.class`

---

# 6. Duplicate Database Error

Khi gặp lỗi:

```text
duplicate key value violates unique constraint
```

=> trả về:

- HTTP `409 CONFLICT`
- message rõ ràng
- không trả raw SQL

Ví dụ:

```json
{
  "success": false,
  "message": "Use case code already exists"
}
```

---

# 7. Validation Error Format

Validation errors phải trả về:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": "Name is required",
    "code": "Code already exists"
  }
}
```

---

# 8. Refactor Service Layer

Không dùng:

```java
throw new RuntimeException(...)
```

Phải dùng custom exception tương ứng.

Ví dụ:

```java
if (useCaseRepository.existsByCode(request.getCode())) {
    throw new DuplicateResourceException(
        "Use case code '" + request.getCode() + "' already exists"
    );
}
```

---

# 9. Code Structure

Code phải:

- clean architecture
- production-ready
- dễ maintain
- theo best practice Spring Boot

Package structure:

```text
exception/
handler/
payload/
response/
```

---

# 10. Yêu cầu Output

Sinh đầy đủ:

- các class exception
- `GlobalExceptionHandler`
- `ApiResponse`
- ví dụ áp dụng trong Service
- ví dụ response JSON thực tế

---

# 11. Spring Security

Nếu project đang dùng Spring Security:

xử lý luôn:

- `AuthenticationException`
- `AccessDeniedException`

---

# 12. Code Quality

Không dùng cách xử lý lỗi sơ sài.

Hãy viết code:

- hoàn chỉnh
- chuyên nghiệp
- có comment giải thích ngắn gọn
- theo chuẩn enterprise
- dễ mở rộng về sau
````
