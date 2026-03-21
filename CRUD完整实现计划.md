# CRUD 完整实现计划

## 当前状态

所有 API 都只实现了 GET 和 POST 方法，缺少 PUT（更新）和 DELETE（删除）方法。

## 已完成

✅ `/api/configs` - 已添加 PUT 和 DELETE  
✅ `/api/roles` - 已添加 PUT 和 DELETE  
✅ `/api/changelogs` - 已添加 PUT 和 DELETE

## 待完成

需要为以下 API 添加 PUT 和 DELETE 方法：

1. ❌ `/api/users` - 用户管理
2. ❌ `/api/notifications` - 通知管理  
3. ❌ `/api/logs` - 日志管理（只需要 DELETE，不需要 PUT）
4. ❌ `/api/files` - 文件管理（只需要 DELETE，不需要 PUT）

## 实现模式

### API 路由模式
```typescript
// PUT - 更新
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  const result = await updateXxx(id, data);
  return NextResponse.json({ success: true, data: result });
}

// DELETE - 删除
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await deleteXxx(parseInt(id));
  return NextResponse.json({ success: true });
}
```

### Service 层模式
```typescript
export async function updateXxx(id: number, data: any) {
  return await prisma.xxx.update({
    where: { id },
    data
  });
}

export async function deleteXxx(id: number) {
  return await prisma.xxx.delete({
    where: { id }
  });
}
```

### 前端组件模式
```typescript
// 更新
const response = await fetch('/api/xxx', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: xxx.id, ...values })
});

// 删除
const response = await fetch(`/api/xxx?id=${id}`, {
  method: 'DELETE'
});
```

## 优先级

1. **高优先级**: users, notifications（用户经常使用）
2. **中优先级**: logs, files（管理功能）

## 注意事项

1. 日志表（sys_log）通常只需要查询和删除，不需要更新
2. 文件表（tbl_file）通常只需要查询和删除，不需要更新
3. 所有删除操作都应该有确认提示
4. 更新操作需要表单验证
