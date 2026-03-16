# Business Flows — BANHNGON

## Flow 1: Đặt hàng

```
Cửa hàng mở /shop/order
  → Xem bảng giá (theo priceGroup của shop)
  → Chọn bánh + số lượng
  → Hệ thống kiểm tra:
      1. Mỗi item quantity >= product.minOrderQty?
      2. Shop.currentDebt + totalAmount <= shop.creditLimit?
  → Nếu vượt creditLimit → CHẶN, hiển thị thông báo
  → Nếu OK → Tạo Order (status: PENDING)
  → Tự tính deliveryDate theo cutoffTime:
      - Trước cutoff → ngày mai
      - Sau cutoff → ngày kia
  → Gửi Socket.io notification cho xưởng
  → Hiển thị "Đặt hàng thành công"
```

## Flow 2: Xử lý đơn hàng

```
Xưởng nhận notification đơn mới
  → Mở /admin/orders → thấy đơn PENDING
  → Xem chi tiết → Xác nhận (CONFIRMED) hoặc Hủy (CANCELLED)
  → Nếu CONFIRMED:
      → Chuyển PREPARING (đang làm bánh)
      → Chuyển DELIVERING (tài xế đang giao)
      → Chuyển COMPLETED (đã giao xong)
          → Cộng order.totalAmount vào shop.currentDebt
          → Gửi notification cho cửa hàng
  → Nếu CANCELLED:
      → Ghi cancelReason
      → Gửi notification cho cửa hàng
      → KHÔNG cộng nợ
```

## Flow 3: Thanh toán công nợ

```
Cửa hàng chuyển tiền (MoMo / Bank / Cash)
  → Staff xưởng mở /admin/payments → Ghi nhận thanh toán
      - Chọn shop
      - Nhập số tiền
      - Chọn phương thức
      - Upload ảnh biên lai (optional)
  → OWNER/STAFF xác nhận
  → Trừ amount từ shop.currentDebt
  → Ghi log Payment
  → Gửi notification cho cửa hàng: "Đã nhận thanh toán {amount}"
```

## Flow 4: Đổi giá + broadcast

```
OWNER mở /admin/price-groups/[id]
  → Sửa giá 1 hoặc nhiều sản phẩm
  → Bấm "Lưu & thông báo"
  → Hệ thống:
      1. Update PriceGroupItem records
      2. Tạo Notification type=PRICE_CHANGE, target=PRICE_GROUP
      3. Socket.io emit "price-changed" cho tất cả users trong nhóm giá
  → Cửa hàng thấy badge "Giá mới" trên bảng giá
  → Mở bảng giá → thấy giá đã cập nhật
```

## Flow 5: Đơn mẫu (Order Template)

```
Cửa hàng đặt hàng xong → bấm "Lưu làm đơn mẫu"
  → Nhập tên: "Đơn thứ 2 hàng tuần"
  → Lưu items [{productId, quantity, note}]
  
Lần sau đặt:
  → Mở /shop/templates → chọn đơn mẫu
  → Xem lại items → sửa số lượng nếu cần
  → Bấm "Đặt hàng" → tạo Order mới với items từ template
  → Giá tính theo bảng giá HIỆN TẠI (không phải giá lúc lưu template)
```

## Flow 6: Giờ cut-off

```
Setting: cutoffTime = "20:00"

Trên trang đặt hàng:
  - Hiển thị: "Đặt trước 20:00 → giao sáng mai (17/03)"
  - Countdown timer tới 20:00
  - Sau 20:00: "Đặt ngay → giao sáng 18/03"

Khi tạo đơn:
  - now < cutoffTime → deliveryDate = tomorrow
  - now >= cutoffTime → deliveryDate = day after tomorrow
  - Nếu đặt thứ 7 sau cutoff → giao thứ 2 (skip chủ nhật — optional)
```

## Flow 7: Kiểm tra hạn mức nợ

```
Khi cửa hàng đặt hàng:
  remainingCredit = shop.creditLimit - shop.currentDebt
  
  if orderTotal > remainingCredit:
    CHẶN đơn hàng
    Hiển thị: "Vượt hạn mức nợ. Còn lại: {remainingCredit}. Vui lòng thanh toán trước."
  
  if shop.creditLimit == 0:
    Cho đặt không giới hạn (creditLimit=0 nghĩa là không giới hạn)
```

## Flow 8: In phiếu giao hàng

```
Xưởng mở /admin/orders/[id]
  → Bấm "In phiếu giao"
  → Hệ thống generate PDF:
      - Thông tin xưởng (từ Settings)
      - Thông tin cửa hàng
      - Danh sách sản phẩm + số lượng + giá
      - Tổng tiền
      - Ngày giao
      - Ghi chú
  → Mở print dialog hoặc download PDF
```
