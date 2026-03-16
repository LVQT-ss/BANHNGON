# Skill: Safe Commit

## Khi nào dùng
Khi code đã pass lint + typecheck + test và sẵn sàng commit.

## Pre-commit checklist
- [ ] `npm run lint:check` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run test` → all pass
- [ ] `git diff --cached --name-only` → KHÔNG có .env files
- [ ] KHÔNG có console.log (trừ logger)
- [ ] KHÔNG có hardcoded secrets

## Commit message format
```
type(scope): description

Types:
  feat     — tính năng mới
  fix      — sửa bug
  docs     — chỉ sửa docs
  style    — formatting, không thay đổi logic
  refactor — refactor code
  test     — thêm/sửa tests
  chore    — build, deps, config

Scope: products, orders, auth, shops, payments, admin, shop-portal

Examples:
  feat(orders): add order creation with credit limit check
  fix(payments): correct debt calculation on payment confirm
  feat(admin): add shop management page with CRUD
```

## Steps

### 1. Stage files
```
git add -A
```

### 2. Review staged files
```
git diff --cached --stat
```
Kiểm tra không có file không mong muốn.

### 3. Commit
```
git commit -m "type(scope): description"
```

### 4. Push
```
git push -u origin {branch-name}
```

## KHÔNG ĐƯỢC
- Commit khi lint/typecheck/test fail
- Force push
- Push trực tiếp lên main
- Commit file .env hoặc secrets
