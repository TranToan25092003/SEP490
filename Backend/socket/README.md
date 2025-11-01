# Socket.IO Module

Thư mục này chứa tất cả các file liên quan đến Socket.IO được tổ chức một cách có hệ thống.

## Cấu trúc thư mục

```
Backend/socket/
├── index.js           # Export tất cả functions
├── socketHandler.js   # Khởi tạo Socket.IO server
├── eventHandlers.js   # Xử lý các events
├── socketUtils.js     # Utility functions
└── README.md         # Tài liệu này
```

## Các file chính

### 1. `socketHandler.js`

- Khởi tạo Socket.IO server
- Cấu hình CORS và các options
- Export `initializeSocket()` và `getSocketIO()`

### 2. `eventHandlers.js`

- Xử lý tất cả các Socket.IO events
- Bao gồm: `joinRoom`, `sendMessage`, `typing`, `markAsRead`, etc.
- Export `handleConnection()`

### 3. `socketUtils.js`

- Các utility functions để làm việc với Socket.IO
- Bao gồm: `emitToRoom()`, `emitToAll()`, `getClientsInRoom()`, etc.

### 4. `index.js`

- Export tất cả functions từ các file khác
- Điểm entry chính cho Socket.IO module

## Cách sử dụng

### Khởi tạo Socket.IO

```javascript
const { initializeSocket } = require("./socket");
initializeSocket(server);
```

### Sử dụng utility functions

```javascript
const { emitToRoom, getClientsInRoom } = require("./socket");

// Gửi message đến room cụ thể
emitToRoom("chat_123", "newMessage", { content: "Hello" });

// Lấy số lượng clients trong room
const clientCount = getClientsInRoom("chat_123");
```

## Events được hỗ trợ

### Client → Server

- `joinRoom`: Tham gia room
- `sendMessage`: Gửi tin nhắn
- `typing`: Báo hiệu đang gõ
- `markAsRead`: Đánh dấu đã đọc
- `customerOnline`: Khách hàng online
- `customerOffline`: Khách hàng offline

### Server → Client

- `newMessage`: Tin nhắn mới
- `userTyping`: User đang gõ
- `messageRead`: Tin nhắn đã được đọc
- `customerOnline`: Khách hàng online
- `customerOffline`: Khách hàng offline

## Lợi ích của cấu trúc này

1. **Tách biệt concerns**: Mỗi file có trách nhiệm riêng
2. **Dễ maintain**: Code được tổ chức rõ ràng
3. **Tái sử dụng**: Utility functions có thể dùng ở nhiều nơi
4. **Testable**: Dễ dàng test từng phần riêng biệt
5. **Scalable**: Dễ dàng thêm tính năng mới
