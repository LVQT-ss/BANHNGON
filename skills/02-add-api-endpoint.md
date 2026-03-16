# Skill: Thêm API endpoint mới

## Khi nào dùng
Khi cần tạo endpoint REST API mới trong Backend.

## Input cần
- Tên module (ví dụ: "reviews")
- Endpoints cần tạo (ví dụ: GET /reviews, POST /reviews)
- Role nào được truy cập

## Steps

### 1. Tạo module structure
```
cd Backend
nest g module modules/{name}
nest g controller modules/{name}
nest g service modules/{name}
```

### 2. Tạo DTO
Tạo file `src/modules/{name}/dto/create-{name}.dto.ts`:
```typescript
import { IsString, IsInt, IsOptional } from 'class-validator';

export class Create{Name}Dto {
  @IsString()
  field: string;

  @IsInt()
  @IsOptional()
  optionalField?: number;
}
```

### 3. Thêm RBAC guard vào controller
```typescript
@Controller('{name}')
@UseGuards(JwtAuthGuard, RolesGuard)
export class {Name}Controller {
  @Get()
  @Roles(UserRole.OWNER, UserRole.FACTORY_STAFF)
  findAll() { ... }

  @Post()
  @Roles(UserRole.OWNER)
  create(@Body() dto: Create{Name}Dto) { ... }
}
```

### 4. Register trong AppModule
Mở `src/app.module.ts`, thêm `{Name}Module` vào imports.

### 5. Verify
```
npm run build
```
Expected: 0 errors

```
curl http://localhost:3001/api/v1/{name}
```
Expected: 200 hoặc 401 (nếu cần auth)

## KHÔNG ĐƯỢC
- Tạo file ngoài `src/modules/{name}/`
- Quên thêm vào AppModule
- Bỏ qua RBAC guard
