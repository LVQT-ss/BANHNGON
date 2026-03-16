# Skill: Chạy Tests

## Khi nào dùng
Sau khi sửa code, trước khi commit, hoặc khi cần verify hệ thống hoạt động.

## Steps

### 1. Backend unit tests
```
cd Backend
npm run test
```
Expected: All tests pass

### 2. Backend build check
```
cd Backend
npm run build
```
Expected: 0 errors

### 3. Frontend typecheck
```
cd Frontend
npx tsc --noEmit
```
Expected: 0 errors

### 4. Frontend build
```
cd Frontend
npm run build
```
Expected: Build success

### 5. API smoke test
```
# Health
curl http://localhost:3001/api/v1/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0901000001","password":"Admin@123"}'
```
Expected: 200 với user data

## Output format
```
Backend tests:  PASS/FAIL (x/y passed)
Backend build:  PASS/FAIL
Frontend type:  PASS/FAIL
Frontend build: PASS/FAIL
API smoke:      PASS/FAIL
```
