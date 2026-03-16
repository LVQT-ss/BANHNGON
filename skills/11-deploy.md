# Skill: Deploy

## Khi nào dùng
Khi cần deploy lên production hoặc staging.

## Pre-deploy checklist
- [ ] Tất cả tests pass
- [ ] Build thành công (cả Backend và Frontend)
- [ ] .env.production đã cấu hình đúng
- [ ] Database migrations đã chạy trên production
- [ ] Không có console.log debug

## Backend Deploy (Docker)
```
cd Backend
docker build -t banhngon-api .
docker compose -f docker-compose.prod.yml up -d
npx prisma migrate deploy
```

## Frontend Deploy (Vercel)
```
cd Frontend
vercel --prod
```
Hoặc push lên main → Vercel auto deploy.

## Verify sau deploy
```
curl https://api.banhngon.com/api/v1/health
curl https://banhngon.com/login
```

## Rollback nếu lỗi
```
# Backend
docker compose -f docker-compose.prod.yml down
git revert HEAD
docker build -t banhngon-api .
docker compose -f docker-compose.prod.yml up -d

# Frontend
vercel rollback
```
