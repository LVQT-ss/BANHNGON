# Skill: Thêm trang Shop Portal

## Khi nào dùng
Khi cần tạo trang mới trong Shop Portal (prefix /shop).

## Steps

### 1. Tạo route
Tạo folder `Frontend/src/app/shop/{page-name}/page.tsx`

### 2. Tạo page component
```typescript
export default function {PageName}Page() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold">Tiêu đề</h1>
      {/* Content — mobile-first design */}
    </div>
  );
}
```

### 3. Mobile-first design
- Card-based layout cho mobile
- Nút lớn, dễ bấm (min 44x44px touch target)
- Bottom sheet cho actions thay vì dropdown
- Pull-to-refresh nếu là list data

### 4. Kết nối API
API calls phải filter theo shopId của user hiện tại.
Backend tự filter — frontend KHÔNG gửi shopId (lấy từ JWT).

### 5. Thêm vào bottom navigation
Mở `Frontend/src/components/shop/ShopBottomNav.tsx`
Thêm tab nếu là trang chính.

### 6. Verify
- Mở browser ở viewport mobile (375px)
- Kiểm tra responsive
- Login bằng SHOP_OWNER → thấy trang
- Login bằng SHOP_STAFF → kiểm tra quyền phù hợp

## KHÔNG ĐƯỢC
- Tạo trang shop ngoài `app/shop/`
- Thiết kế desktop-first (phải mobile-first)
- Gửi shopId từ frontend (backend lấy từ JWT)
