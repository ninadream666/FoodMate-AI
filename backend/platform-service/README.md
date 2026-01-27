# Platform Service - 平台服务模块

## 功能概述

平台服务模块负责管理外卖平台提供给商家的各类增值服务，订单分成的计算和记录，以及商家结算单的生成和管理。

### 核心功能

1. **平台服务管理**
   - 服务定义（基础服务、配送服务、流量服务、运营服务）
   - 服务上下线
   - 收费规则配置

2. **商家订阅管理**
   - 查看可用服务
   - 订阅/取消订阅服务
   - 强制服务自动订阅

3. **分成计算**
   - 订单完成时自动计算分成
   - 支持按比例和固定金额两种计费方式
   - 退款时自动回滚分成

4. **分成查询**
   - 分成记录列表（分页）
   - 分成汇总统计
   - 按服务类别统计

5. **结算单管理** ⭐ 新增
   - 自动/手动生成结算单（支持周结算/月结算）
   - 商家确认/提交异议
   - 超时自动确认（3天）
   - 管理员调整金额
   - 批量标记打款

## 技术栈

- Java 17
- Spring Boot 3.2
- Spring Data JPA
- PostgreSQL
- JWT 认证

## API 接口

### 商家端 - 平台服务

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/merchant/platform-services` | GET | 获取可用服务列表 |
| `/api/merchant/platform-services/subscriptions` | GET | 获取我的订阅 |
| `/api/merchant/platform-services/subscriptions` | POST | 订阅服务 |
| `/api/merchant/platform-services/subscriptions/{id}` | DELETE | 取消订阅 |
| `/api/merchant/commissions` | GET | 分成记录列表 |
| `/api/merchant/commissions/summary` | GET | 分成汇总 |

### 商家端 - 结算单 ⭐

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/merchant/settlements` | GET | 结算单列表 |
| `/api/merchant/settlements/{id}` | GET | 结算单详情（含分成明细） |
| `/api/merchant/settlements/{id}/commissions` | GET | 结算单内的分成记录 |
| `/api/merchant/settlements/{id}/confirm` | POST | 确认结算单 |
| `/api/merchant/settlements/{id}/dispute` | POST | 提交异议 |
| `/api/merchant/settlements/pending-count` | GET | 待确认数量 |

### 管理员端 - 平台服务

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/platform-services` | GET | 获取所有服务 |
| `/api/admin/platform-services` | POST | 创建服务 |
| `/api/admin/platform-services/{id}` | PUT | 更新服务 |
| `/api/admin/platform-services/{id}/toggle-status` | PATCH | 上线/下线 |

### 管理员端 - 结算单 ⭐

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/settlements` | GET | 所有结算单（支持状态筛选） |
| `/api/admin/settlements/{id}` | GET | 结算单详情 |
| `/api/admin/settlements/generate` | POST | 生成结算单 |
| `/api/admin/settlements/{id}/adjust` | POST | 调整金额 |
| `/api/admin/settlements/batch-pay` | POST | 批量标记已打款 |
| `/api/admin/settlements/{id}/cancel` | POST | 作废结算单 |
| `/api/admin/settlements/stats` | GET | 结算统计 |

### 内部接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/internal/commissions/calculate` | POST | 计算订单分成 |
| `/api/internal/commissions/refund/{orderId}` | POST | 退款回滚分成 |

## 快速开始

### 1. 数据库准备

执行 SQL 脚本：
```bash
psql -U postgres -d food_delivery -f scripts/03_platform_service_schema.sql
psql -U postgres -d food_delivery -f scripts/04_platform_service_seeds.sql
```

### 2. 配置环境变量

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=food_delivery
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_PUBLIC_KEY_PATH=../ed25519-public.pem
```

### 3. 启动服务

```bash
mvn spring-boot:run
```

或使用 Docker：
```bash
docker build -t platform-service .
docker run -p 8086:8086 platform-service
```

### 4. 访问 Swagger UI

http://localhost:8086/swagger-ui.html

## 目录结构

```
platform-service/
├── src/main/java/com/fooddelivery/platformservice/
│   ├── PlatformServiceApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   └── OpenApiConfig.java
│   ├── controller/
│   │   ├── MerchantPlatformServiceController.java
│   │   ├── MerchantCommissionController.java
│   │   ├── MerchantSettlementController.java    # ⭐ 新增
│   │   ├── AdminPlatformServiceController.java
│   │   ├── AdminSettlementController.java       # ⭐ 新增
│   │   ├── InternalCommissionController.java
│   │   └── HealthCheckController.java
│   ├── dto/
│   │   ├── PlatformServiceDTO.java
│   │   ├── SubscriptionDTO.java
│   │   ├── CommissionRecordDTO.java
│   │   ├── CommissionSummaryDTO.java
│   │   ├── MerchantSettlementDTO.java           # ⭐ 新增
│   │   ├── GenerateSettlementRequest.java       # ⭐ 新增
│   │   ├── AdjustSettlementRequest.java         # ⭐ 新增
│   │   └── ...
│   ├── entity/
│   │   ├── PlatformService.java
│   │   ├── MerchantServiceSubscription.java
│   │   ├── CommissionRecord.java
│   │   ├── MerchantSettlement.java              # ⭐ 新增
│   │   ├── SettlementStatus.java                # ⭐ 新增
│   │   ├── SettlementType.java                  # ⭐ 新增
│   │   └── 枚举类...
│   ├── repository/
│   │   ├── PlatformServiceRepository.java
│   │   ├── MerchantServiceSubscriptionRepository.java
│   │   ├── CommissionRecordRepository.java
│   │   └── MerchantSettlementRepository.java    # ⭐ 新增
│   ├── service/
│   │   ├── PlatformServiceService.java
│   │   ├── SubscriptionService.java
│   │   ├── CommissionService.java
│   │   ├── CommissionScheduler.java
│   │   ├── SettlementService.java               # ⭐ 新增
│   │   └── SettlementScheduler.java             # ⭐ 新增
│   └── ...
└── src/main/resources/
    └── application.yml
```

## 预设服务

| 服务编码 | 名称 | 类别 | 费用 | 强制 |
|---------|------|------|------|------|
| BASIC_TECH_FEE | 平台技术服务费 | 基础 | 3% | ✓ |
| PLATFORM_DELIVERY | 平台配送服务 | 配送 | 8% | |
| PRIORITY_DELIVERY | 优先配送 | 配送 | ¥2/单 | |
| PROMO_HOMEPAGE | 首页推荐位 | 流量 | ¥50/月 | |
| PROMO_SEARCH_TOP | 搜索置顶 | 流量 | ¥30/月 | |
| DATA_ANALYTICS | 经营数据报表 | 运营 | ¥20/月 | |

## 结算单状态流转 ⭐

```
PENDING_CONFIRM (待确认)
       ↓
  ┌────┴────┐
  ↓         ↓
CONFIRMED  DISPUTED (有异议)
(已确认)       ↓
  ↓       [管理员调整]
  ↓         ↓
  └────→ PENDING_CONFIRM
              ↓
         CONFIRMED
              ↓
            PAID (已打款)
```

| 状态 | 说明 |
|------|------|
| PENDING_CONFIRM | 待商家确认（3天内） |
| CONFIRMED | 商家已确认，等待打款 |
| DISPUTED | 商家有异议，需线下处理 |
| PAID | 已完成打款 |
| CANCELLED | 已作废 |

## 结算单生成流程

### 自动生成（定时任务）

1. **月结算**：每月1日凌晨2点，生成上月结算单
2. **周结算**：每周一凌晨2点，生成上周结算单（需配置启用）
3. **自动确认**：每天早上8点，确认超过3天未处理的结算单

### 手动生成

管理员可通过 `/api/admin/settlements/generate` 接口手动生成：
- 指定结算类型（周/月）
- 指定周期范围
- 指定商家（或为所有商家生成）

## 结算单号规则

格式：`ST{年月}{类型}{商家ID后3位}{序号}`

示例：
- 月结算：`ST202401M001001` — 2024年1月，月结算，商家001
- 周结算：`ST2024W03W001001` — 2024年第3周，周结算，商家001

## 配置项

```yaml
settlement:
  confirm-days: 3                      # 确认期限（天）
  default-type: MONTHLY                # 默认结算类型
  scheduler:
    enabled: true                      # 是否启用定时任务
    monthly-cron: "0 0 2 1 * *"       # 月结算触发时间
    weekly-cron: "0 0 2 * * MON"      # 周结算触发时间
    auto-confirm-cron: "0 0 8 * * *"  # 自动确认触发时间
```

## 注意事项

- 基础服务（BASIC）为强制订阅，商家不可取消
- 按月计费的服务不参与订单分成计算
- 分成记录冗余存储服务名称和费率，防止历史数据受服务修改影响
- 结算单生成后，关联的分成记录状态变为 SETTLED
- 作废结算单会解除分成记录关联，使其重新变为 PENDING 状态
- 商家提交异议后需线下联系客服处理
