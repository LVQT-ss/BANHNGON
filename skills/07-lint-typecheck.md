# Skill: Lint + Typecheck

## Khi nào dùng
Sau khi viết code, trước khi test, trước khi commit.

## Steps

### Backend
```
cd Backend
npm run lint:check
npx tsc --noEmit
```

### Frontend
```
cd Frontend
npm run lint
npx tsc --noEmit
```

## Expected
- lint: 0 errors (warnings OK)
- typecheck: 0 errors

## Nếu có lỗi
Xem skill 08-auto-fix.md
