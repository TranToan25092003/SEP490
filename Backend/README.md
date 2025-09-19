# Middleware Authentication System

## Middleware Overview

### 1. `authenticate`

- **Chức năng**: Kiểm tra headers request có chứa token hợp lệ
- **Xử lý**:
  - Kiểm tra sự tồn tại của token trong headers
  - Xác minh định dạng cơ bản của token
  - Check valid token

### 2. `roleProtected`

- **Chức năng**: Kiểm tra quyền truy cập
- **Xử lý**:
  - Xác minh vai trò (role) của người dùng
  - Trả về lỗi 403 nếu không đủ quyền
  - Chỉ sử dụng sau middleware xác thực

## Cách Sử Dụng Middleware

### 1. Flow đầy đủ (Xác thực + Kiểm tra quyền)

```javascript
app.use(
  "/admin",
  authenticate, // B1: Kiểm tra token
  roleProtected, // B2: Kiểm tra quyền
  adminRouter // Xử lý route
);
```

### 2. Flow (xác thực đăng nhập, Không kiểm tra quyền)

```javascript
app.use(
  "/user",
  authenticate, // 1. Kiểm tra token
  userController // 2. Xử lý nghiệp vụ
);
```

### 3:Lấy userId and user cơ bản

// Dùng sau middleware authenticate()
const userId = req.user.id // get id of user
const user = req.user // get all information of user

### 4. Lấy toàn bộ thông tin user (dùng Clerk)

```javascript
const { clerkClient } = require("@clerk/clerk-sdk-node");

const user = await clerkClient.users.getUser(req.userId);
```

### ⚠️ Lưu Ý Quan Trọng

- ## **Thứ tự middleware: Luôn theo đúng thứ tự:**
  -authenticate → roleProtected

### 5. thêm data cho user trong clerk public data

```javascript
const { clerkClient } = require("../../config/clerk");

await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    data: data,
  },
});
```

### 6: Swagger

```
API: http://localhost:3000/api

/**
 * @swagger
 * /test:
 *   get:
 *     summary: API test trực tiếp từ app
 *     tags:
 *        - Test
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
 router.get("/", controller.checkHealth);

```
