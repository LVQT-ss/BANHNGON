# AGENTS.md — BANHNGON

## Dự án
BANHNGON — Hệ thống quản lý đặt hàng B2B: Xưởng bánh → Cửa hàng.
Backend (NestJS + Prisma + PostgreSQL) và Frontend (Next.js + Tailwind + shadcn) tách riêng.

## Rules
- Đọc skill file TRƯỚC khi làm bất kỳ task nào
- Follow steps CHÍNH XÁC, không skip
- Chạy verify step SAU mỗi task
- Nếu không chắc → DỪNG và hỏi user

## Skills
- Khởi động dev: skills/01-start-dev.md
- Thêm API endpoint: skills/02-add-api-endpoint.md
- Thêm trang admin: skills/03-add-admin-page.md
- Thêm trang shop: skills/04-add-shop-page.md
- Database migration: skills/05-database-migration.md
- Chạy tests: skills/06-run-tests.md
- Lint + typecheck: skills/07-lint-typecheck.md
- Auto-fix lỗi: skills/08-auto-fix.md
- Safe commit: skills/09-safe-commit.md
- Kết nối API Frontend: skills/10-connect-api.md
- Deploy: skills/11-deploy.md
- Pre-commit check: skills/12-pre-commit-check.md

## Specs
- specs/01-rbac-permissions.md — Ma trận quyền chi tiết
- specs/02-business-flows.md — Luồng nghiệp vụ
- MASTER_PROMPT.md — Schema, endpoints, pages, seed data

## NEVER
- Sửa prisma/schema.prisma mà không chạy migrate
- Force push
- Commit file .env
- Xóa migration files
- Sửa file trong node_modules/
- Bỏ qua bước Verify
- Dùng `any` type trong TypeScript
- Commit code khi lint/typecheck fail
