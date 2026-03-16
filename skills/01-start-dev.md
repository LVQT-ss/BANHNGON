# Skill: Khởi động môi trường dev

## Khi nào dùng
Khi cần chạy BANHNGON locally lần đầu hoặc sau khi restart máy.

## Steps

### 1. Start database
```
cd Backend
docker compose up -d
```
Chờ 5 giây rồi kiểm tra:
```
docker exec banhngon_postgres pg_isready -U postgres
```
Expected: "accepting connections"

### 2. Start Backend (port 3001)
```
cd Backend
npm run start:dev
```
Verify:
```
curl http://localhost:3001/api/v1/health
```
Expected: `{"status":"ok"}`

### 3. Start Frontend (port 3000)
```
cd Frontend
npm run dev
```
Verify: Mở browser http://localhost:3000/login

## Troubleshooting
- Port 3001 bị chiếm → `lsof -i :3001` rồi kill process
- Prisma client lỗi → `cd Backend && npx prisma generate`
- Database trống → `cd Backend && npx tsx prisma/seed.ts`
