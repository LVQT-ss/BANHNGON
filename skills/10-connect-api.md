# Skill: Kết nối Frontend ↔ Backend API

## Khi nào dùng
Khi cần gọi API từ Frontend tới Backend.

## Steps

### 1. Tạo API file
Tạo `Frontend/src/lib/api/{name}.api.ts`:
```typescript
import { apiClient } from './client';

export const {name}Api = {
  getAll: (params?: Record<string, any>) =>
    apiClient.get('/{name}', { params }).then(r => r.data.data),

  getById: (id: string) =>
    apiClient.get(`/{name}/${id}`).then(r => r.data.data),

  create: (data: Create{Name}Dto) =>
    apiClient.post('/{name}', data).then(r => r.data.data),

  update: (id: string, data: Update{Name}Dto) =>
    apiClient.patch(`/{name}/${id}`, data).then(r => r.data.data),

  delete: (id: string) =>
    apiClient.delete(`/{name}/${id}`).then(r => r.data.data),
};
```

### 2. Tạo types
Tạo `Frontend/src/types/{name}.ts`:
```typescript
export interface {Name} {
  id: string;
  // ... fields matching backend response
  createdAt: string;
  updatedAt: string;
}

export interface Create{Name}Dto {
  // ... fields for creation
}
```

### 3. Sử dụng trong component với React Query
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { {name}Api } from '@/lib/api/{name}.api';

// GET
const { data, isLoading } = useQuery({
  queryKey: ['{name}'],
  queryFn: () => {name}Api.getAll(),
});

// CREATE
const queryClient = useQueryClient();
const createMutation = useMutation({
  mutationFn: {name}Api.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['{name}'] }),
});
```

### 4. Verify
- Mở browser → Network tab
- Thực hiện action → kiểm tra API call đúng endpoint
- Kiểm tra response data hiển thị đúng trên UI

## KHÔNG ĐƯỢC
- Gọi API trực tiếp bằng fetch (dùng apiClient)
- Hardcode URL (dùng apiClient có baseURL)
- Bỏ qua error handling
- Dùng `any` cho response type
