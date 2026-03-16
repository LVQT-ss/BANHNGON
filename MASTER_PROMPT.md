# BANHNGON — Master Vibecoding Prompt

> Copy toàn bộ prompt này vào AI agent (Cursor, Codex, Claude, Gemini) để bắt đầu build.
> Sau khi init xong, dùng các skill files trong `skills/` để tiếp tục phát triển.

---

## Prompt bắt đầu

Bạn là senior fullstack developer. Build cho tôi hệ thống **BANHNGON** — nền tảng quản lý đặt hàng B2B giữa xưởng bánh và các cửa hàng nhập bánh.

## Tổng quan sản phẩm

BANHNGON giúp chủ xưởng bánh:
- Quản lý danh mục bánh và bảng giá
- Broadcast giá mới cho tất cả cửa hàng
- Nhận đơn đặt hàng từ cửa hàng
- Quản lý công nợ từng cửa hàng
- Xuất phiếu giao hàng, báo cáo

Và giúp cửa hàng:
- Xem bảng giá mới nhất
- Đặt hàng nhanh (có đơn mẫu)
- Xem lịch sử đơn và công nợ
- Nhận thông báo từ xưởng

## Tech Stack — BẮT BUỘC dùng

```
Backend:  NestJS 10 + Prisma + PostgreSQL 16 + Redis 7
Frontend: Next.js (latest) + React + Tailwind 4 + shadcn/ui
Auth:     JWT httpOnly cookies + refresh token
Realtime: Socket.io (thông báo)
Payment:  MoMo API (ghi nhận thanh toán)
PDF:      @react-pdf/renderer (phiếu giao hàng)
Excel:    xlsx (xuất báo cáo)
i18n:     Vietnamese only (thêm EN sau)
Monorepo: KHÔNG. Tách Backend/ và Frontend/ riêng biệt (giống KeyHay)
```

## RBAC — 4 Roles

```
OWNER (Chủ xưởng) — 1 người duy nhất
  ✅ Toàn quyền: sản phẩm, giá, đơn, cửa hàng, nhân viên, báo cáo, cài đặt
  ✅ Quản lý tài khoản FACTORY_STAFF

FACTORY_STAFF (Nhân viên xưởng)
  ✅ Xem đơn hàng, cập nhật trạng thái đơn
  ✅ Xem sản phẩm, xem bảng giá
  ❌ KHÔNG sửa giá, KHÔNG quản lý cửa hàng, KHÔNG xem báo cáo tài chính

SHOP_OWNER (Chủ cửa hàng)
  ✅ Xem bảng giá (theo nhóm giá của mình)
  ✅ Đặt hàng, xem đơn, xem công nợ
  ✅ Quản lý SHOP_STAFF của cửa hàng mình
  ❌ KHÔNG xem đơn của cửa hàng khác

SHOP_STAFF (Nhân viên cửa hàng)
  ✅ Xem bảng giá, đặt hàng thay chủ
  ✅ Xem đơn của cửa hàng mình
  ❌ KHÔNG xem công nợ, KHÔNG quản lý nhân viên
```

## Database Schema — Prisma

```prisma
// === ENUMS ===

enum UserRole {
  OWNER
  FACTORY_STAFF
  SHOP_OWNER
  SHOP_STAFF
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}

enum OrderStatus {
  PENDING        // Cửa hàng vừa đặt
  CONFIRMED      // Xưởng xác nhận
  PREPARING      // Đang làm
  DELIVERING     // Đang giao
  COMPLETED      // Đã giao xong
  CANCELLED      // Đã hủy
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  MOMO
}

enum NotificationType {
  PRICE_CHANGE
  NEW_PRODUCT
  HOLIDAY
  ORDER_UPDATE
  GENERAL
}

enum NotificationTarget {
  ALL
  PRICE_GROUP
  SPECIFIC_SHOP
}

// === MODELS ===

model User {
  id           String     @id @default(cuid())
  email        String?    @unique
  phone        String     @unique
  passwordHash String     @map("password_hash")
  fullName     String     @map("full_name")
  avatar       String?
  role         UserRole   @default(SHOP_STAFF)
  status       UserStatus @default(ACTIVE)

  // Nếu là SHOP_OWNER hoặc SHOP_STAFF
  shopId String? @map("shop_id")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  shop              Shop?               @relation(fields: [shopId], references: [id])
  createdOrders     Order[]             @relation("OrderCreator")
  confirmedOrders   Order[]             @relation("OrderConfirmer")
  confirmedPayments Payment[]
  notifications     NotificationRead[]
  orderTemplates    OrderTemplate[]
  sentNotifications Notification[]

  @@index([shopId])
  @@index([role])
  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String   @unique @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("refresh_tokens")
}

model Shop {
  id          String @id @default(cuid())
  name        String
  address     String
  phone       String
  ownerName   String @map("owner_name")
  taxCode     String? @map("tax_code")

  // Giá & tín dụng
  priceGroupId String  @map("price_group_id")
  creditLimit  Decimal @default(0) @map("credit_limit") @db.Decimal(15, 2)
  currentDebt  Decimal @default(0) @map("current_debt") @db.Decimal(15, 2)

  status    String   @default("ACTIVE") // ACTIVE, INACTIVE
  note      String?

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  priceGroup     PriceGroup      @relation(fields: [priceGroupId], references: [id])
  users          User[]
  orders         Order[]
  payments       Payment[]
  orderTemplates OrderTemplate[]

  @@index([priceGroupId])
  @@map("shops")
}

model Product {
  id          String  @id @default(cuid())
  name        String
  description String?
  image       String?
  unit        String  @default("cái") // cái, hộp, kg, tá
  basePrice   Decimal @map("base_price") @db.Decimal(15, 2)
  minOrderQty Int     @default(1) @map("min_order_qty")
  category    String  @default("Khác")
  isActive    Boolean @default(true) @map("is_active")
  sortOrder   Int     @default(0) @map("sort_order")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  priceItems PriceGroupItem[]
  orderItems OrderItem[]

  @@index([category])
  @@index([isActive])
  @@map("products")
}

model PriceGroup {
  id          String  @id @default(cuid())
  name        String  @unique // "VIP", "Thường", "Mới"
  description String?
  isDefault   Boolean @default(false) @map("is_default")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  items PriceGroupItem[]
  shops Shop[]

  @@map("price_groups")
}

model PriceGroupItem {
  id           String  @id @default(cuid())
  priceGroupId String  @map("price_group_id")
  productId    String  @map("product_id")
  price        Decimal @db.Decimal(15, 2)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  priceGroup PriceGroup @relation(fields: [priceGroupId], references: [id], onDelete: Cascade)
  product    Product    @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([priceGroupId, productId])
  @@map("price_group_items")
}

model Order {
  id          String @id @default(cuid())
  orderNumber String @unique @map("order_number") // "DH-20260316-001"
  shopId      String @map("shop_id")
  createdById String @map("created_by_id")

  status      OrderStatus @default(PENDING)
  totalAmount Decimal     @map("total_amount") @db.Decimal(15, 2)

  // Giao hàng
  deliveryDate    DateTime? @map("delivery_date")
  deliveryAddress String?   @map("delivery_address")

  // Ghi chú
  note      String? // Ghi chú từ cửa hàng
  adminNote String? @map("admin_note") // Ghi chú từ xưởng

  // Xác nhận
  confirmedById String?   @map("confirmed_by_id")
  confirmedAt   DateTime? @map("confirmed_at")
  completedAt   DateTime? @map("completed_at")
  cancelledAt   DateTime? @map("cancelled_at")
  cancelReason  String?   @map("cancel_reason")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  shop        Shop        @relation(fields: [shopId], references: [id])
  createdBy   User        @relation("OrderCreator", fields: [createdById], references: [id])
  confirmedBy User?       @relation("OrderConfirmer", fields: [confirmedById], references: [id])
  items       OrderItem[]

  @@index([shopId])
  @@index([status])
  @@index([createdAt])
  @@index([orderNumber])
  @@map("orders")
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String @map("order_id")
  productId String @map("product_id")

  // Snapshot tại thời điểm đặt
  productName String  @map("product_name")
  unit        String
  quantity    Int
  unitPrice   Decimal @map("unit_price") @db.Decimal(15, 2)
  totalPrice  Decimal @map("total_price") @db.Decimal(15, 2)
  note        String? // "không mè", "ít đường"

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@map("order_items")
}

model Payment {
  id     String @id @default(cuid())
  shopId String @map("shop_id")

  amount       Decimal       @db.Decimal(15, 2)
  method       PaymentMethod
  note         String?
  receiptImage String?       @map("receipt_image")

  // Xác nhận
  confirmedById String?   @map("confirmed_by_id")
  confirmedAt   DateTime? @map("confirmed_at")

  // MoMo
  momoTransId String? @map("momo_trans_id")

  createdAt DateTime @default(now()) @map("created_at")

  shop        Shop  @relation(fields: [shopId], references: [id])
  confirmedBy User? @relation(fields: [confirmedById], references: [id])

  @@index([shopId])
  @@map("payments")
}

model Notification {
  id      String @id @default(cuid())
  title   String
  content String @db.Text

  type       NotificationType
  targetType NotificationTarget @map("target_type")
  targetId   String?            @map("target_id") // shopId hoặc priceGroupId

  createdById String @map("created_by_id")

  createdAt DateTime @default(now()) @map("created_at")

  createdBy User               @relation(fields: [createdById], references: [id])
  reads     NotificationRead[]

  @@index([targetType])
  @@index([createdAt])
  @@map("notifications")
}

model NotificationRead {
  id             String @id @default(cuid())
  notificationId String @map("notification_id")
  userId         String @map("user_id")

  readAt DateTime @default(now()) @map("read_at")

  notification Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([notificationId, userId])
  @@map("notification_reads")
}

model OrderTemplate {
  id     String @id @default(cuid())
  shopId String @map("shop_id")
  userId String @map("user_id")
  name   String // "Đơn thứ 2 hàng tuần"
  items  Json   // [{productId, quantity, note}]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  shop Shop @relation(fields: [shopId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([shopId])
  @@map("order_templates")
}

model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value Json

  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("settings")
}
```

## Tất cả trang cần build

### Factory Admin (Xưởng) — prefix `/admin`

```
/admin                        → Dashboard (tổng quan đơn hôm nay, doanh thu, top cửa hàng)
/admin/products               → Quản lý sản phẩm (CRUD bánh)
/admin/products/new           → Thêm sản phẩm mới
/admin/products/[id]/edit     → Sửa sản phẩm
/admin/price-groups           → Quản lý nhóm giá (VIP, Thường, Mới)
/admin/price-groups/[id]      → Chi tiết nhóm giá + bảng giá
/admin/shops                  → Quản lý cửa hàng
/admin/shops/new              → Thêm cửa hàng mới
/admin/shops/[id]             → Chi tiết cửa hàng (đơn hàng, công nợ, lịch sử)
/admin/orders                 → Tất cả đơn hàng (filter trạng thái, ngày, cửa hàng)
/admin/orders/[id]            → Chi tiết đơn + in phiếu giao
/admin/debts                  → Công nợ tổng hợp tất cả cửa hàng
/admin/debts/[shopId]         → Công nợ chi tiết 1 cửa hàng
/admin/payments               → Lịch sử thanh toán (xác nhận thanh toán)
/admin/notifications          → Gửi thông báo broadcast
/admin/reports                → Báo cáo doanh thu, sản phẩm, cửa hàng
/admin/staff                  → Quản lý nhân viên xưởng
/admin/settings               → Cài đặt (tên xưởng, giờ cut-off, MOQ)
```

### Shop Portal (Cửa hàng) — prefix `/shop`

```
/shop                         → Dashboard (đơn gần đây, nợ hiện tại, thông báo)
/shop/price-list              → Bảng giá (theo nhóm giá của cửa hàng)
/shop/order                   → Đặt hàng (chọn bánh + số lượng)
/shop/order/from-template/[id]→ Đặt từ đơn mẫu
/shop/orders                  → Lịch sử đơn hàng
/shop/orders/[id]             → Chi tiết đơn
/shop/debt                    → Công nợ cửa hàng + lịch sử thanh toán
/shop/notifications           → Thông báo từ xưởng
/shop/templates               → Quản lý đơn mẫu
/shop/staff                   → Quản lý nhân viên (SHOP_OWNER only)
/shop/profile                 → Hồ sơ cửa hàng
```

### Auth

```
/login                        → Đăng nhập (SĐT + password)
/forgot-password              → Quên mật khẩu
```

## Business Logic quan trọng

### 1. Đặt hàng
```
Cửa hàng chọn bánh → Kiểm tra MOQ → Tính giá theo nhóm giá → Kiểm tra hạn mức nợ
  → Nếu nợ + đơn mới > creditLimit → CHẶN, báo "Vượt hạn mức nợ"
  → Nếu OK → Tạo đơn PENDING → Thông báo realtime cho xưởng
```

### 2. Xử lý đơn
```
PENDING → Xưởng xác nhận → CONFIRMED → PREPARING → DELIVERING → COMPLETED
  → Khi COMPLETED: cộng vào currentDebt của cửa hàng
  → Bất kỳ lúc nào trước DELIVERING: có thể CANCEL
```

### 3. Thanh toán công nợ
```
Cửa hàng chuyển tiền (MoMo/bank/cash) → Staff xưởng xác nhận
  → Trừ currentDebt của cửa hàng
  → Ghi log payment
```

### 4. Đổi giá + broadcast
```
OWNER sửa giá trong PriceGroupItem → Hệ thống tạo Notification type=PRICE_CHANGE
  → Gửi realtime cho tất cả cửa hàng trong nhóm giá đó
  → Cửa hàng thấy badge "Giá mới" trên bảng giá
```

### 5. Giờ cut-off
```
Setting: cutoffTime = "20:00"
  → Đơn đặt trước 20:00 → deliveryDate = ngày mai
  → Đơn đặt sau 20:00 → deliveryDate = ngày kia
  → Hiển thị countdown trên trang đặt hàng
```

## API Endpoints cần tạo

### Auth
```
POST   /auth/login              (phone + password)
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
```

### Products (OWNER only)
```
GET    /products                 (tất cả, có filter category)
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

### Price Groups (OWNER only)
```
GET    /price-groups
POST   /price-groups
PATCH  /price-groups/:id
DELETE /price-groups/:id
GET    /price-groups/:id/prices  (bảng giá chi tiết)
PUT    /price-groups/:id/prices  (cập nhật giá hàng loạt → trigger notification)
```

### Shops (OWNER only)
```
GET    /shops
POST   /shops                   (tạo shop + tạo SHOP_OWNER account)
PATCH  /shops/:id
GET    /shops/:id/orders
GET    /shops/:id/debt
```

### Orders
```
POST   /orders                  (cửa hàng đặt)
GET    /orders                  (theo role: admin thấy tất cả, shop thấy của mình)
GET    /orders/:id
PATCH  /orders/:id/status       (OWNER/STAFF: confirm, prepare, deliver, complete, cancel)
GET    /orders/:id/print        (PDF phiếu giao)
```

### Payments (OWNER, FACTORY_STAFF)
```
GET    /payments                (lịch sử thanh toán)
POST   /payments                (ghi nhận thanh toán)
PATCH  /payments/:id/confirm    (xác nhận)
```

### Notifications
```
GET    /notifications           (theo user)
POST   /notifications           (OWNER: broadcast)
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
```

### Order Templates (Shop)
```
GET    /order-templates
POST   /order-templates
PATCH  /order-templates/:id
DELETE /order-templates/:id
POST   /order-templates/:id/use (tạo đơn từ template)
```

### Reports (OWNER only)
```
GET    /reports/revenue          (doanh thu theo khoảng thời gian)
GET    /reports/products         (top sản phẩm)
GET    /reports/shops            (top cửa hàng)
GET    /reports/export/orders    (xuất Excel)
GET    /reports/export/debts     (xuất Excel)
```

### Settings (OWNER only)
```
GET    /settings
PATCH  /settings
```

### Staff Management
```
GET    /staff                    (OWNER: xưởng staff, SHOP_OWNER: shop staff)
POST   /staff
PATCH  /staff/:id
DELETE /staff/:id
```

## Seed Data (5 cửa hàng)

```typescript
// OWNER account
{ phone: "0901000001", fullName: "Chủ Xưởng BANHNGON", role: "OWNER", password: "Admin@123" }

// FACTORY_STAFF
{ phone: "0901000002", fullName: "Nhân viên Xưởng 1", role: "FACTORY_STAFF", password: "Staff@123" }

// 3 Price Groups
{ name: "VIP", description: "Khách lâu năm, giá tốt nhất" }
{ name: "Thường", description: "Giá bán sỉ chuẩn", isDefault: true }
{ name: "Mới", description: "Cửa hàng mới, giá cao hơn" }

// 5 Shops
{ name: "Tiệm Bánh Ngon Quận 1", priceGroup: "VIP", creditLimit: 50000000 }
{ name: "Cửa Hàng Bánh Mì Quận 3", priceGroup: "VIP", creditLimit: 30000000 }
{ name: "Bánh Tươi Sáng Quận 7", priceGroup: "Thường", creditLimit: 20000000 }
{ name: "Tiệm Bánh Kem Thủ Đức", priceGroup: "Thường", creditLimit: 15000000 }
{ name: "Cửa Hàng Mới Bình Dương", priceGroup: "Mới", creditLimit: 5000000 }

// 10 Products
{ name: "Bánh mì thường", unit: "cái", basePrice: 5000, category: "Bánh mì" }
{ name: "Bánh mì bơ tỏi", unit: "cái", basePrice: 8000, category: "Bánh mì" }
{ name: "Bánh mì que", unit: "cái", basePrice: 3000, category: "Bánh mì" }
{ name: "Bánh bông lan", unit: "cái", basePrice: 15000, category: "Bánh ngọt" }
{ name: "Bánh su kem", unit: "hộp", basePrice: 45000, category: "Bánh ngọt" }
{ name: "Bánh croissant", unit: "cái", basePrice: 12000, category: "Bánh Âu" }
{ name: "Bánh flan", unit: "hộp", basePrice: 35000, category: "Bánh ngọt" }
{ name: "Bánh tart trứng", unit: "cái", basePrice: 10000, category: "Bánh Âu" }
{ name: "Bánh kem sinh nhật 20cm", unit: "cái", basePrice: 200000, category: "Bánh kem" }
{ name: "Bánh kem sinh nhật 25cm", unit: "cái", basePrice: 350000, category: "Bánh kem" }
```

## Thứ tự build

```
Phase 1: Foundation
  1. Init Backend (NestJS + Prisma + PostgreSQL)
  2. Init Frontend (Next.js + Tailwind + shadcn)
  3. Database schema + migrations + seed
  4. Auth module (login, JWT, refresh, guards, RBAC)
  5. Layout: Factory Admin + Shop Portal + responsive

Phase 2: Core Features
  6. Products CRUD
  7. Price Groups + Price List
  8. Shops CRUD
  9. Order system (đặt hàng + xử lý)
  10. Đơn mẫu (Order Templates)

Phase 3: Money
  11. Công nợ (Debt tracking)
  12. Payments (ghi nhận + xác nhận)
  13. Credit limit check

Phase 4: Communication
  14. Notifications (broadcast + realtime Socket.io)
  15. Price change notification auto-trigger

Phase 5: Operations
  16. In phiếu giao hàng (PDF)
  17. Báo cáo + xuất Excel
  18. Settings (cut-off time, factory info)

Phase 6: Polish
  19. Dashboard Factory (charts, stats)
  20. Dashboard Shop
  21. Mobile responsive tuning
  22. MoMo payment integration
```

## UI Style Guide

```
Brand color: Warm orange (#F97316) — gợi hình ảnh bánh nướng
Secondary: Cream (#FFF7ED)
Font: Inter (clean, professional, giống Shopee vibes)
Card style: White cards, subtle shadow, rounded-xl
Table style: Clean, striped rows, sticky header
Mobile: Bottom nav cho Shop Portal (Trang chủ, Đặt hàng, Đơn hàng, Tài khoản)
Icons: lucide-react
Toast: sonner
```

## Quy tắc code

```
Backend:
  - Mỗi module: module.ts + controller.ts + service.ts + dto/
  - Dùng class-validator cho DTO
  - Dùng Prisma transactions cho đơn hàng + thanh toán
  - Guard RBAC: @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  - Mọi response: { success: boolean, data: T, message: string }

Frontend:
  - App Router, KHÔNG dùng Pages Router
  - API client: axios instance ở lib/api/client.ts
  - State: Zustand cho auth, React Query cho server state
  - Components: shadcn/ui + custom trong components/
  - Không dùng any — define types cho mọi thứ
```
