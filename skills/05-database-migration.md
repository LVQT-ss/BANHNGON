# Skill: Database Migration

## Khi nào dùng
Khi cần thay đổi database schema (thêm/sửa/xóa model hoặc field).

## Steps

### 1. Sửa schema
Mở `Backend/prisma/schema.prisma`
Thêm/sửa model hoặc field.

### 2. Tạo migration
```
cd Backend
npx prisma migrate dev --name {ten-migration}
```
Tên migration dùng kebab-case: `add-reviews`, `add-delivery-date-to-orders`

### 3. Generate client
```
npx prisma generate
```

### 4. Update seed nếu cần
Mở `Backend/prisma/seed.ts`
Thêm seed data cho model mới.

### 5. Verify
```
npx prisma studio
```
Mở browser → kiểm tra table mới/field mới tồn tại.

### 6. Test
```
npm run build
```
Expected: 0 errors (service/controller dùng model mới compile OK)

## KHÔNG ĐƯỢC
- Sửa file migration đã tạo (chỉ tạo migration mới)
- Xóa migration files
- Dùng `npx prisma db push` trên production (chỉ dùng migrate)
- Quên chạy `prisma generate` sau migrate
