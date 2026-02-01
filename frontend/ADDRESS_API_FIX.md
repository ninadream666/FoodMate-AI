# 地址API修复报告

## 问题诊断

### 原始问题
- 无法新建收货地址、保存收货地址
- 前端显示403错误

### 根本原因
1. **API路径不匹配**: 前端使用 `/addresses` (复数)，后端实际是 `/address` (单数)
2. **Docker健康检查失败**: 容器中缺少curl命令，但服务实际运行正常
3. **服务配置正确**: user-service在8083端口正常运行，支持JWT认证

## 修复措施

### 1. 修复API路径 ✅
**文件**: `src/services/addressService.js`

修复前:
```javascript
// 错误的复数路径
return await api.get('users', '/addresses');
return await api.post('users', '/addresses', addressData);
```

修复后:
```javascript
// 正确的单数路径，匹配后端 @RequestMapping("/users/address")
return await api.get('users', '/address');
return await api.post('users', '/address', addressData);
```

### 2. 简化错误处理 ✅
移除了对profile-service的fallback尝试，因为:
- profile-service不支持地址管理
- 简化错误处理逻辑，提供更清晰的错误信息

### 3. 后端服务验证 ✅
**AddressController.java**:
- 路径: `/users/address`
- 支持所有CRUD操作
- JWT认证正常工作
- 方法映射:
  - `GET /users/address` → 获取地址列表
  - `POST /users/address` → 新增地址
  - `PUT /users/address/{id}` → 修改地址
  - `DELETE /users/address/{id}` → 删除地址
  - `PUT /users/address/{id}/default` → 设为默认

## API服务状态

### user-service (8083端口)
- 状态: ✅ 运行正常
- 健康检查: ✅ /actuator/health返回UP状态
- 数据库: ✅ PostgreSQL连接正常
- 服务发现: ✅ Eureka注册正常
- Redis: ✅ 连接正常

### Docker服务问题说明
- 显示"unhealthy"是因为容器内缺少curl命令
- 服务功能完全正常，只是健康检查命令执行失败
- 不影响API功能和业务逻辑

## 测试验证

### 前端配置
- API基础URL: `http://192.168.1.16:8083/api/users`
- 完整地址API: `http://192.168.1.16:8083/api/users/address`
- JWT认证: 通过Authorization header传递

### 预期结果
1. 获取地址列表: `GET /api/users/address`
2. 添加新地址: `POST /api/users/address`
3. 修改地址: `PUT /api/users/address/{id}`
4. 删除地址: `DELETE /api/users/address/{id}`
5. 设为默认: `PUT /api/users/address/{id}/default`

## 下一步测试建议

1. 重新启动应用进行测试
2. 登录用户账号
3. 进入地址管理界面
4. 测试新增、修改、删除地址功能
5. 检查控制台日志确认API调用成功

**修复完成时间**: 2026-02-01  
**状态**: 已修复，待测试验证