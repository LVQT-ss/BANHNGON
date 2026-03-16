# Skill: Auto-fix lỗi lint/type

## Khi nào dùng
Khi lint hoặc typecheck fail sau khi viết code.

## Rules
- CHỈ fix lint warnings và type errors
- KHÔNG thay đổi business logic để fix type error
- Nếu fix cần thay đổi logic → DỪNG, hỏi user
- Max 3 attempts, nếu vẫn fail → DỪNG

## Steps

### 1. Đọc error message
Xem lỗi ở file nào, dòng nào, lỗi gì.

### 2. Phân loại lỗi

Tự fix được:
- Missing import → thêm import
- Unused variable → xóa hoặc dùng
- Wrong type → sửa type
- Formatting → chạy prettier

KHÔNG tự fix:
- Logic error → hỏi user
- Test failure → hỏi user
- Runtime error → hỏi user

### 3. Fix
Sửa MINIMAL change. Không refactor xung quanh.

### 4. Re-check
```
npm run lint:check && npx tsc --noEmit
```

### 5. Nếu vẫn fail
Attempt 2 → fix → re-check
Attempt 3 → fix → re-check
Sau 3 attempts → DỪNG, báo user kèm error log.

## Output format
```
Auto-fix attempt: 1/3
Errors fixed: 2 (missing-import, wrong-type)
Recheck: PASS/FAIL
```
