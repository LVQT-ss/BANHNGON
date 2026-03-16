# Skill: Pre-commit Quality Check

## Khi nào dùng
LUÔN chạy TRƯỚC mỗi commit. Đây là gate bắt buộc.

## Checklist (chạy theo thứ tự)

### 1. Lint
```
cd Backend && npm run lint:check
cd Frontend && npm run lint
```
MUST: 0 errors

### 2. Typecheck
```
cd Backend && npx tsc --noEmit
cd Frontend && npx tsc --noEmit
```
MUST: 0 errors

### 3. Tests
```
cd Backend && npm run test
```
MUST: all pass

### 4. Build
```
cd Backend && npm run build
cd Frontend && npm run build
```
MUST: success

### 5. Security scan
```
git diff --cached --name-only
```
MUST NOT contain: .env, *.pem, *.key, passwords, API keys

## Nếu bất kỳ step nào FAIL
1. Chạy skill 08-auto-fix.md (nếu là lint/type error)
2. Nếu test fail → sửa code hoặc test → chạy lại
3. Nếu vẫn fail sau 3 attempts → DỪNG, báo user

## Output format
```
Pre-commit check:
  lint:      ✅ PASS / ❌ FAIL
  typecheck: ✅ PASS / ❌ FAIL
  tests:     ✅ PASS (x/y) / ❌ FAIL
  build:     ✅ PASS / ❌ FAIL
  security:  ✅ PASS / ❌ FAIL
  
  RESULT: READY TO COMMIT / BLOCKED
```
