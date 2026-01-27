# 营销服务 (Marketing Service) - 优惠券发放与组合算法

## 项目概述

营销服务是食品配送平台的核心模块，负责管理优惠券的发放、跟踪和优化使用。本服务实现了一个复杂的**优惠券组合算法**，能够计算用户订单的**最优优惠方案**。

## 核心功能

### 1. 优惠券模板管理
- 支持5种优惠券类型：
  - **折扣券** (DISCOUNT)：如打9折
  - **满减券** (THRESHOLD_REDUCTION)：满X元减Y元
  - **无门槛券** (NO_THRESHOLD)：直接减免Y元
  - **免运费券** (FREE_SHIPPING)：节省配送费
- 灵活的发放规则：最大发放量、有效期、启用/禁用状态
- 优惠券互斥管理：定义哪些优惠券不能同时使用
- 优惠券叠加规则：标记是否允许与其他券叠加

### 2. 用户优惠券管理
- 用户领券、使用、锁定、解锁等状态管理
- 有效期自动校验
- 订单级别的优惠券锁定机制（防止重复使用）

### 3. 最优组合算法（核心）
这是整个服务的**难点和亮点**。

#### 问题描述
当用户下单时，系统需要自动计算"用当前可用的优惠券，如何组合使用最省钱"。

这是一个**背包问题的变种**：
- 背包容量 = 订单金额
- 物品 = 用户可用的优惠券
- 物品价值 = 优惠金额
- 物品重量 = 使用某张券后减少的金额
- 目标 = 最大化总优惠金额，同时满足互斥约束

#### 算法步骤

**第一步：筛选（Filter）**
```
根据订单金额，筛选出所有满足使用条件的优惠券
- 满减券：必须订单 >= 门槛金额
- 折扣券：无门槛，但有最大优惠上限
- 无门槛券和免运费券：直接适用
```

**第二步：分类（Classify）**
```
将优惠券分为两类：
1. 可叠加的优惠券（stackable = true）
   - 这些券之间可以组合使用
   - 但要检查 exclusiveIds 互斥列表

2. 互斥的优惠券（stackable = false）
   - 这类券之间互相排斥，最多选一张
   - 可与某些可叠加券组合
```

**第三步：计算（Calculate）**
```
采用分支策略：

方案1：只使用可叠加的优惠券
  - 枚举所有可能的可叠加券组合（2^n）
  - 检查每个组合中的券是否存在互斥
  - 计算总优惠金额
  - 选择优惠最多的组合

方案2：选择一张互斥券 + 兼容的可叠加券
  - 对于每张互斥券：
    - 过滤出与其兼容的可叠加券
    - 使用方案1的算法在兼容券中找最优组合
    - 相加该互斥券的优惠 + 可叠加券的优惠

最终结果：比较方案1和所有方案2，返回优惠最多的方案
```

**复杂度分析：**
- 时间复杂度：O(n! × m) 其中 n = 互斥券数，m = 可叠加券数
- 对于实际应用（用户通常 < 10 张券），这是可接受的
- 可通过剪枝进一步优化

#### 代码实现位置
- 主算法：`CouponCombinationService.java`
  - `calculateBestCombination()`：入口方法
  - `filterEligibleCoupons()`：筛选
  - `findBestCombination()`：分类 + 计算
  - `findBestStackableCombination()`：贪心选择可叠加券

## API 接口

### 1. 发放优惠券
```
POST /api/coupons/issue

请求体：
{
  "couponTemplateId": 1,
  "userId": 1
}

响应：
{
  "code": 201,
  "message": "成功",
  "data": {
    "id": 1,
    "userId": 1,
    "couponTemplateId": 1,
    "status": "AVAILABLE",
    "expiresAt": "2025-01-14T23:59:59",
    ...
  }
}
```

**业务规则：**
1. 检查优惠券模板是否存在且启用
2. 检查是否在有效期内
3. 检查是否还有可用发放额度
4. 创建用户优惠券记录
5. 更新模板的已发放数量

### 2. 计算最优优惠券组合（核心）
```
POST /api/coupons/calculate-best

请求体：
{
  "userId": 1,
  "merchantId": 1,
  "orderTotal": 100.00,
  "items": [
    {
      "itemId": 1,
      "price": 50.00,
      "quantity": 2,
      "merchantId": 1
    }
  ]
}

响应：
{
  "code": 200,
  "message": "成功",
  "data": {
    "selectedCouponIds": [1, 2, 5],
    "originalPrice": 100.00,
    "totalDiscount": 30.00,
    "finalPrice": 70.00,
    "description": "优惠方案: 新用户优惠券, 满30减5, 免运费券 共优惠 30.00 元",
    "success": true
  }
}
```

### 3. 获取用户可用优惠券
```
GET /api/coupons/user/{userId}/available

响应：返回所有未使用且未过期的优惠券列表
```

### 4. 获取用户所有优惠券
```
GET /api/coupons/user/{userId}/all

响应：返回该用户的所有优惠券（包括已使用）
```

### 5. 验证优惠券组合有效性
```
POST /api/coupons/validate-combination

请求体：
[1, 2, 5]

响应：
{
  "code": 200,
  "message": "成功",
  "data": {
    "valid": true,
    "message": "优惠券组合有效"
  }
}
```

## 数据库设计

### coupon_templates 表
优惠券模板存储表

| 字段                    | 类型          | 说明                                                            |
| ----------------------- | ------------- | --------------------------------------------------------------- |
| id                      | BIGSERIAL     | 主键                                                            |
| name                    | VARCHAR(100)  | 优惠券名称                                                      |
| description             | VARCHAR(255)  | 描述                                                            |
| type                    | VARCHAR(20)   | 类型（DISCOUNT/THRESHOLD_REDUCTION/NO_THRESHOLD/FREE_SHIPPING） |
| min_order_amount        | DECIMAL(10,2) | 满X元                                                           |
| discount_value          | DECIMAL(10,2) | 优惠值                                                          |
| max_discount            | DECIMAL(10,2) | 最大优惠上限                                                    |
| total_quantity          | INTEGER       | 发放总量（0=无限）                                              |
| issued_quantity         | INTEGER       | 已发放数量                                                      |
| valid_from              | TIMESTAMP     | 有效期开始                                                      |
| valid_until             | TIMESTAMP     | 有效期结束                                                      |
| enabled                 | BOOLEAN       | 是否启用                                                        |
| stackable               | BOOLEAN       | 是否允许叠加                                                    |
| exclusive_ids           | TEXT          | 互斥券ID列表（JSON）                                            |
| applicable_merchant_ids | TEXT          | 适用商家列表（JSON）                                            |

### user_coupons 表
用户优惠券记录表

| 字段               | 类型        | 说明                                  |
| ------------------ | ----------- | ------------------------------------- |
| id                 | BIGSERIAL   | 主键                                  |
| user_id            | BIGINT      | 用户ID                                |
| coupon_template_id | BIGINT      | 模板ID                                |
| status             | VARCHAR(20) | 状态（AVAILABLE/LOCKED/USED/EXPIRED） |
| order_id           | BIGINT      | 关联订单ID（如果已使用/锁定）         |
| obtained_at        | TIMESTAMP   | 领取时间                              |
| used_at            | TIMESTAMP   | 使用时间                              |
| expires_at         | TIMESTAMP   | 过期时间                              |
| created_at         | TIMESTAMP   | 创建时间                              |
| updated_at         | TIMESTAMP   | 更新时间                              |

**关键索引：**
- user_id：快速查询用户的优惠券
- (user_id, status)：高效查询可用优惠券
- coupon_template_id：完整性约束

## 优惠券状态流转图

```
        ┌─────────────┐
        │  AVAILABLE  │  <-- 用户成功领券后的初始状态
        └──────┬──────┘
               │
         ┌─────┴─────┐
         │           │
    [订单提交]    [过期时间到]
         │           │
         ▼           ▼
      ┌─────┐    ┌────────┐
      │LOCKED│   │EXPIRED │  <- 最终态（无法再回到AVAILABLE）
      └──┬───┘   └────────┘
         │
    [订单支付成功]  或  [订单取消]
         │
    ┌────┴────┐
    │          │
    ▼          ▼
  ┌────┐   ┌──────────┐
  │USED│   │AVAILABLE │  <- 解锁返回可用
  └────┘   └──────────┘
```

## 示例场景

### 场景 1：单张优惠券
```
用户有可用优惠券：
- 无门槛券：直减10元
- 满30减5券（订单50元，满足）
- 免运费券：5元

订单金额：50元

计算过程：
1. 筛选：三张都可用（50 >= 30）
2. 分类：都是可叠加的
3. 计算：
   - 只用无门槛：优惠10元，最终40元
   - 只用满30减5：优惠5元，最终45元
   - 只用免运费：优惠5元，最终45元
   - 无门槛 + 满30减5：优惠15元，最终35元（最优！）
   - 无门槛 + 免运费：优惠15元，最终35元（最优！）
   - 满30减5 + 免运费：优惠10元，最终40元
   - 三张都用：优惠20元，最终30元（最优！）

结果：返回前三张优惠券的组合，共优惠20元
```

### 场景 2：互斥优惠券
```
用户有可用优惠券：
- 9折券（互斥，即 stackable=false）
- 满30减5（可叠加）
- 免运费（可叠加）

订单金额：100元

计算过程：
1. 筛选：三张都符合
2. 分类：
   - 互斥：[9折券]
   - 可叠加：[满30减5, 免运费]
3. 计算：
   方案1（不用9折券）：
   - 满30减5 + 免运费 = 10元优惠
   
   方案2（用9折券）：
   - 9折: 100 * 0.1 = 10元（但最多20元）
   - 与9折兼容的可叠加券：[满30减5, 免运费]
   - 用 满30减5 + 免运费：10元
   - 注意：9折 + 满30减5可能重复计算，需要谨慎
   
最终：选择优惠最多的方案
```

## 性能考虑

### 当前实现的优化
1. **数据库索引**：快速查询用户可用优惠券
2. **缓存机制**：（可选）缓存优惠券模板信息
3. **剪枝策略**：在组合枚举时排除无效组合

### 可进一步优化的方向
1. **动态规划加速**：使用 DP 表预计算最优子问题
2. **贪心策略**：先选择优惠最多的券，再尝试添加其他券
3. **缓存层**：Redis 缓存用户的可用优惠券和模板信息
4. **异步计算**：对于大量并发请求，使用消息队列异步处理

## 部署方式

### Docker 运行
```bash
# 构建镜像
docker build -t marketing-service:1.0 .

# 运行容器
docker run -d \
  --name marketing-service \
  -p 8082:8082 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres-db:5432/food_delivery_db \
  -e SPRING_DATASOURCE_USERNAME=dev \
  -e SPRING_DATASOURCE_PASSWORD=dev123 \
  marketing-service:1.0
```

### Docker Compose 运行
在 `docker-compose.dev.yml` 中已配置，直接：
```bash
docker-compose -f docker-compose.dev.yml up marketing-service
```

## API 文档
服务运行后，访问：
```
http://localhost:8082/swagger-ui.html
```

## 测试场景
数据库初始化脚本已创建5种优惠券和测试用户数据：

**测试用户：**
- alice (userId=1)：拥有新用户券、满30减5、满60减15、免运费券
- bob (userId=2)：拥有新用户券、满30减5、9折券

**测试优惠券：**
1. 新用户优惠券：NO_THRESHOLD，直减10元，1000份
2. 满30减5：THRESHOLD_REDUCTION，满30减5，500份
3. 满60减15：THRESHOLD_REDUCTION，满60减15，300份
4. 9折券：DISCOUNT（互斥），打9折，200份
5. 免运费券：FREE_SHIPPING，5元，100份

**推荐测试：**
```bash
# 1. 为 alice 计算订单100元的最优方案
POST /api/coupons/calculate-best
{
  "userId": 1,
  "orderTotal": 100.00
}

# 2. 为 alice 发放额外优惠券
POST /api/coupons/issue
{
  "couponTemplateId": 2,
  "userId": 1
}

# 3. 查看 alice 的所有可用优惠券
GET /api/coupons/user/1/available
```

## 已完成的功能清单

✅ 数据库设计与初始化
✅ 优惠券模板实体与仓储
✅ 用户优惠券实体与仓储
✅ 优惠券组合算法核心实现
✅ 优惠券发放服务
✅ 优惠券计算服务
✅ REST API 接口
✅ OpenAPI 文档
✅ Docker 容器化
✅ Logging 和错误处理

## 后续扩展计划

- [ ] 前端优惠券展示组件
- [ ] 优惠券管理后台（创建、修改、禁用优惠券）
- [ ] 优惠券使用统计和分析
- [ ] 规则引擎优化（更复杂的发放条件）
- [ ] 缓存优化（Redis 集成）
- [ ] 分布式锁（防止并发发放超额）
- [ ] 优惠券导出和批量操作

