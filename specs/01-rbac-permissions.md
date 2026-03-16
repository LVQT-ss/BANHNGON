# RBAC Permission Matrix — BANHNGON

## Ma trận quyền chi tiết

| Resource / Action | OWNER | FACTORY_STAFF | SHOP_OWNER | SHOP_STAFF |
|---|---|---|---|---|
| **Products** | | | | |
| Xem danh sách sản phẩm | ✅ | ✅ | ✅ (qua bảng giá) | ✅ (qua bảng giá) |
| Tạo / sửa / xóa sản phẩm | ✅ | ❌ | ❌ | ❌ |
| **Bảng giá** | | | | |
| Xem tất cả nhóm giá | ✅ | ✅ | ❌ | ❌ |
| Xem bảng giá của mình | — | — | ✅ | ✅ |
| Tạo / sửa nhóm giá | ✅ | ❌ | ❌ | ❌ |
| Sửa giá sản phẩm | ✅ | ❌ | ❌ | ❌ |
| **Cửa hàng** | | | | |
| Xem tất cả cửa hàng | ✅ | ✅ | ❌ | ❌ |
| Tạo / sửa cửa hàng | ✅ | ❌ | ❌ | ❌ |
| Xem hồ sơ cửa hàng mình | — | — | ✅ | ❌ |
| Sửa hồ sơ cửa hàng mình | — | — | ✅ | ❌ |
| **Đơn hàng** | | | | |
| Xem tất cả đơn | ✅ | ✅ | ❌ | ❌ |
| Xem đơn cửa hàng mình | — | — | ✅ | ✅ |
| Tạo đơn (đặt hàng) | ❌ | ❌ | ✅ | ✅ |
| Xác nhận / xử lý đơn | ✅ | ✅ | ❌ | ❌ |
| Hủy đơn (trước delivering) | ✅ | ✅ | ✅ (đơn của mình) | ❌ |
| In phiếu giao hàng | ✅ | ✅ | ❌ | ❌ |
| **Công nợ** | | | | |
| Xem công nợ tất cả shop | ✅ | ❌ | ❌ | ❌ |
| Xem công nợ cửa hàng mình | — | — | ✅ | ❌ |
| Ghi nhận thanh toán | ✅ | ✅ | ❌ | ❌ |
| **Thông báo** | | | | |
| Gửi broadcast | ✅ | ❌ | ❌ | ❌ |
| Nhận thông báo | ✅ | ✅ | ✅ | ✅ |
| **Báo cáo** | | | | |
| Xem báo cáo doanh thu | ✅ | ❌ | ❌ | ❌ |
| Xuất Excel | ✅ | ❌ | ❌ | ❌ |
| **Nhân viên** | | | | |
| Quản lý FACTORY_STAFF | ✅ | ❌ | ❌ | ❌ |
| Quản lý SHOP_STAFF | ❌ | ❌ | ✅ (của mình) | ❌ |
| **Cài đặt** | | | | |
| Sửa cài đặt hệ thống | ✅ | ❌ | ❌ | ❌ |
| **Đơn mẫu** | | | | |
| Tạo / sửa / xóa đơn mẫu | ❌ | ❌ | ✅ | ✅ |
| Đặt hàng từ đơn mẫu | ❌ | ❌ | ✅ | ✅ |

## Implement trong code

### Backend Guard
```typescript
// common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Sử dụng trong controller
@Roles(UserRole.OWNER)
@UseGuards(JwtAuthGuard, RolesGuard)
```

### Frontend Route Protection
```typescript
// middleware hoặc layout check
if (pathname.startsWith('/admin') && !['OWNER', 'FACTORY_STAFF'].includes(user.role)) {
  redirect('/shop');
}
if (pathname.startsWith('/shop') && !['SHOP_OWNER', 'SHOP_STAFF'].includes(user.role)) {
  redirect('/admin');
}
```

### Data Isolation (quan trọng)
```typescript
// Shop chỉ thấy data của mình
// Backend service:
async getOrders(user: User) {
  if (user.role === 'SHOP_OWNER' || user.role === 'SHOP_STAFF') {
    return this.prisma.order.findMany({ where: { shopId: user.shopId } });
  }
  return this.prisma.order.findMany(); // Admin thấy tất cả
}
```
