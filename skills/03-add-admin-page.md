# Skill: Thêm trang Factory Admin

## Khi nào dùng
Khi cần tạo trang mới trong Factory Admin panel (prefix /admin).

## Steps

### 1. Tạo route
Tạo folder `Frontend/src/app/admin/{page-name}/page.tsx`

### 2. Tạo page component
```typescript
import { PageHeader } from '@/components/admin/PageHeader';

export default function {PageName}Page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tiêu đề"
        description="Mô tả trang"
      />
      {/* Content */}
    </div>
  );
}
```

### 3. Tạo data components
- Table: dùng shadcn DataTable
- Form: dùng react-hook-form + zod
- Dialog: dùng shadcn Dialog

### 4. Kết nối API
Tạo `Frontend/src/lib/api/{name}.api.ts` (xem skill 10-connect-api)

### 5. Thêm vào sidebar navigation
Mở `Frontend/src/components/admin/AdminSidebar.tsx`
Thêm menu item mới vào đúng section.

### 6. Thêm RBAC check
```typescript
// Nếu trang chỉ cho OWNER
if (user.role !== 'OWNER') redirect('/admin');
```

### 7. Verify
- Mở browser → navigate tới trang mới
- Kiểm tra data hiển thị đúng
- Kiểm tra RBAC (login FACTORY_STAFF → trang bị chặn nếu cần)

## KHÔNG ĐƯỢC
- Tạo trang admin ngoài `app/admin/`
- Quên thêm vào sidebar navigation
- Bỏ qua RBAC check
