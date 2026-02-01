# 支付流程权限验证失败问题诊断和解决

## 问题现象
- 点击确认支付按钮时出现 "权限验证失败: 权限不足" 错误
- 错误发生在 OrderConfirmScreen.tsx:200 行
- 后端返回 403 状态码

## 问题原因分析

### 1. JWT Token验证失败
- 订单服务的 SecurityConfig 中，创建订单需要认证
- `createOrder` 方法需要从 Authentication 对象中提取 userId
- 如果token无效/过期/格式错误，认证失败导致403

### 2. 服务间JWT密钥不一致
- 用户服务生成token，订单服务验证token
- 如果使用不同的JWT密钥，会导致验证失败

### 3. 服务健康状态问题
- 多个Java服务显示 "unhealthy" 状态
- 可能影响服务间通信和认证

## 解决步骤

### 步骤1: 检查JWT Token状态
在前端添加token调试信息：

1. 在 OrderConfirmScreen.tsx 的 handlePay 方法中添加更详细的token调试：

```javascript
// 在现有的token检查代码后添加：
console.log('Token详细信息:', {
    token: token?.substring(0, 50) + '...',
    tokenParts: token?.split('.').length,
    tokenStartsWith: token?.startsWith('ey'),
    tokenLength: token?.length
});

// 尝试解析token内容（简单解析，不验证签名）
try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token payload:', {
            userId: payload.userId,
            username: payload.sub,
            role: payload.role,
            exp: payload.exp,
            expireTime: new Date(payload.exp * 1000),
            isExpired: Date.now() > payload.exp * 1000
        });
    }
} catch (e) {
    console.error('Token解析失败:', e);
}
```

### 步骤2: 验证后端服务状态
检查容器日志：
```bash
# 检查订单服务日志
docker logs food-platform-order-service --tail 50

# 检查用户服务日志
docker logs food-platform-user-service --tail 50

# 重启有问题的服务
docker-compose -f docker-compose.dev.yml restart order-service
docker-compose -f docker-compose.dev.yml restart user-service
```

### 步骤3: 测试API连接
使用有效token测试订单API：
```bash
# 首先获取token（通过应用登录后从日志获取）
# 然后测试订单接口
curl -X GET "http://192.168.1.16:8084/orders/my-orders" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 步骤4: 检查JWT配置
确保所有服务使用相同的JWT密钥配置（在 config-repo/application.yml 中）

### 步骤5: 临时解决方案
如果需要快速测试，可以临时修改订单服务的安全配置：

在 `backend/order-service/src/main/java/com/fooddelivery/orderservice/config/SecurityConfig.java` 中临时添加：
```java
// 临时允许创建订单用于测试
.requestMatchers(new AntPathRequestMatcher("/orders")).permitAll()
.requestMatchers(new AntPathRequestMatcher("/api/orders")).permitAll()
```

## 推荐的调试步骤
1. 先在前端添加token调试信息，确认token是否有效
2. 检查后端服务日志，查看具体的认证失败原因
3. 重启相关服务，确保配置正确加载
4. 如果问题持续，考虑重新登录获取新token

## 注意事项
- 不要在生产环境使用临时的 permitAll 配置
- 确保JWT密钥在所有服务中保持一致
- 定期检查服务健康状态