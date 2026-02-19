# 开发指南

开发中遇到问题，可能再次出现或在对方那里出现，解决方案记在这里。以后要改README再说

## Backend

这里放后端，和原来的结构一样，正常开发，注意端口不要与前端用的冲突。

## Frontend

这里放前端，新的代码放在src下，原代码在src_frontend_web。改一部分就放一部分到src，然后测试，以免直接修改出现混乱。

- 前端配置问题：

1. Android Studio下载最新版即可，虚拟设备模拟器选择Pixel 7，API 34， Google play store。
2. 因自动初始化的框架无法正常连接，所以修改了android的部分配置，尽量不要修改。
3. 如果连接有问题，可创建android/local.properties，写上本地的Android\Sdk的路径。例如：

```bash
sdk.dir=C\:\\Users\\用户名\\AppData\\Local\\Android\\Sdk
```

- 前端测试方法：

1. VS Code控制台中打开终端，运行：npx react-native start --port 端口号
2. 打开新的终端（上一个不关），运行：npx react-native run-android --port 端口号
3. 如果出现问题（我跑通了，应该不会吧），可修改配置后，运行下列命令重试：

```bash
cd android
./gradlew clean
cd ..
```

- 前端使用的端口建议：8001~8082之间。因为后端微服务从8083开始往后加，延续之前的端口设置比较方便。

## git版本控制及其他建议

1. 每次开发前，拉取github上的新代码，合并后再修改。
2. 每次开发后，如果测试成功，就上传到各自分支并提pr，合并到main。
3. 建议开发完新功能就立即写前端测试。
4. 端口等具体的配置选择尽量新增或者修改靠后的内容，尽量不要修改已完成的部分。


```
FoodMate-AI
├─ backend
│  ├─ .env
│  ├─ ai-pricing-service
│  │  ├─ app
│  │  │  ├─ clients.py
│  │  │  ├─ config.py
│  │  │  ├─ events.py
│  │  │  ├─ gemini_agent.py
│  │  │  ├─ main.py
│  │  │  └─ models.py
│  │  ├─ Dockerfile
│  │  └─ requirements.txt
│  ├─ api-tests.http
│  ├─ config-repo
│  │  └─ application.yml
│  ├─ docker-compose.dev.yml
│  ├─ ed25519-private.pem
│  ├─ ed25519-public.pem
│  ├─ food-platform-common
│  │  ├─ food-platform-common.iml
│  │  ├─ pom.xml
│  │  ├─ README.md
│  │  └─ src
│  │     └─ main
│  │        └─ java
│  │           └─ com
│  │              └─ fooddelivery
│  │                 └─ common
│  │                    ├─ annotation
│  │                    │  └─ ResilientService.java
│  │                    ├─ config
│  │                    │  ├─ CacheConfig.java
│  │                    │  ├─ FeignClientConfig.java
│  │                    │  ├─ ResilienceConfig.java
│  │                    │  └─ ServiceDiscoveryConfig.java
│  │                    ├─ constants
│  │                    │  └─ BusinessConstants.java
│  │                    ├─ dto
│  │                    │  ├─ ApiResponse.java
│  │                    │  └─ PageResponse.java
│  │                    ├─ enums
│  │                    │  ├─ OrderStatus.java
│  │                    │  ├─ PaymentMethod.java
│  │                    │  ├─ PaymentStatus.java
│  │                    │  └─ UserRole.java
│  │                    ├─ exception
│  │                    │  ├─ BusinessException.java
│  │                    │  └─ GlobalExceptionHandler.java
│  │                    ├─ filter
│  │                    │  └─ JwtAuthenticationFilter.java
│  │                    └─ util
│  │                       ├─ JwtUtil.java
│  │                       ├─ PageUtils.java
│  │                       ├─ RedisUtil.java
│  │                       └─ SecurityUtils.java
│  ├─ marketing-service
│  │  ├─ Dockerfile
│  │  ├─ marketing-service.iml
│  │  ├─ pom.xml
│  │  ├─ README.md
│  │  └─ src
│  │     └─ main
│  │        ├─ java
│  │        │  └─ com
│  │        │     └─ fooddelivery
│  │        │        └─ marketingservice
│  │        │           ├─ config
│  │        │           │  ├─ AsyncConfig.java
│  │        │           │  ├─ OpenApiConfig.java
│  │        │           │  └─ SecurityConfig.java
│  │        │           ├─ controller
│  │        │           │  ├─ AdminCouponController.java
│  │        │           │  ├─ AdminMarketingController.java
│  │        │           │  ├─ CouponController.java
│  │        │           │  └─ SmartIssuanceController.java.bak
│  │        │           ├─ dto
│  │        │           │  ├─ AdminIssueBatchRequest.java
│  │        │           │  ├─ AdminIssueCouponRequest.java
│  │        │           │  ├─ AutoIssuanceRuleDTO.java.bak
│  │        │           │  ├─ CalculateBestCouponRequest.java
│  │        │           │  ├─ CalculateBestCouponResponse.java
│  │        │           │  ├─ CouponStatsDTO.java
│  │        │           │  ├─ CouponTemplateDTO.java
│  │        │           │  ├─ CouponTypeStatsDTO.java
│  │        │           │  ├─ CouponUsageTrendDTO.java
│  │        │           │  ├─ CreateAutoIssuanceRuleRequest.java.bak
│  │        │           │  ├─ CreateCouponTemplateRequest.java
│  │        │           │  ├─ IssueCouponRequest.java
│  │        │           │  ├─ OrderItemDTO.java
│  │        │           │  ├─ RollbackCouponRequest.java
│  │        │           │  ├─ UpdateCouponTemplateRequest.java
│  │        │           │  ├─ UseCouponRequest.java
│  │        │           │  ├─ UserCouponDTO.java
│  │        │           │  └─ UserEventTriggerRequest.java.bak
│  │        │           ├─ entity
│  │        │           │  ├─ AutoIssuanceHistory.java.bak
│  │        │           │  ├─ AutoIssuanceRule.java.bak
│  │        │           │  ├─ CouponStatus.java
│  │        │           │  ├─ CouponTemplate.java
│  │        │           │  ├─ CouponType.java
│  │        │           │  └─ UserCoupon.java
│  │        │           ├─ exception
│  │        │           │  ├─ BusinessException.java
│  │        │           │  └─ GlobalExceptionHandler.java
│  │        │           ├─ filter
│  │        │           │  └─ JwtAuthenticationFilter.java
│  │        │           ├─ integration
│  │        │           │  └─ UserServiceIntegration.java.bak
│  │        │           ├─ MarketingServiceApplication.java
│  │        │           ├─ repository
│  │        │           │  ├─ AutoIssuanceHistoryRepository.java.bak
│  │        │           │  ├─ AutoIssuanceRuleRepository.java.bak
│  │        │           │  ├─ CouponTemplateRepository.java
│  │        │           │  └─ UserCouponRepository.java
│  │        │           ├─ service
│  │        │           │  ├─ CouponCalculationService.java
│  │        │           │  ├─ CouponCombinationService.java
│  │        │           │  ├─ CouponIssueService.java
│  │        │           │  ├─ CouponStatisticsService.java
│  │        │           │  ├─ CouponStatsService.java
│  │        │           │  ├─ CouponTemplateService.java
│  │        │           │  └─ SmartIssuanceService.java.bak
│  │        │           └─ util
│  │        │              └─ JwtUtil.java
│  │        └─ resources
│  │           └─ application.yml
│  ├─ merchant-service
│  │  ├─ Dockerfile
│  │  ├─ merchant-service.iml
│  │  ├─ pom.xml
│  │  └─ src
│  │     └─ main
│  │        ├─ java
│  │        │  └─ com
│  │        │     └─ fooddelivery
│  │        │        └─ merchant
│  │        │           ├─ client
│  │        │           │  ├─ OrderServiceClient.java
│  │        │           │  └─ UserServiceClient.java
│  │        │           ├─ config
│  │        │           │  ├─ JpaConfig.java
│  │        │           │  ├─ RabbitMQConfig.java
│  │        │           │  └─ SecurityConfig.java
│  │        │           ├─ controller
│  │        │           │  ├─ AdminMerchantController.java
│  │        │           │  ├─ HealthCheckController.java
│  │        │           │  ├─ MenuController.java
│  │        │           │  ├─ MerchantController.java
│  │        │           │  ├─ MerchantInternalController.java
│  │        │           │  ├─ MerchantNotificationController.java
│  │        │           │  ├─ MerchantRefundController.java
│  │        │           │  └─ PriceChangeController.java
│  │        │           ├─ dto
│  │        │           │  ├─ BatchImportRequest.java
│  │        │           │  ├─ CreateMenuItemRequest.java
│  │        │           │  ├─ CreateMerchantRequest.java
│  │        │           │  ├─ MenuItemDto.java
│  │        │           │  ├─ MerchantDto.java
│  │        │           │  ├─ RealRestaurantDTO.java
│  │        │           │  └─ UpdateMenuItemRequest.java
│  │        │           ├─ entity
│  │        │           │  ├─ MenuItem.java
│  │        │           │  ├─ Merchant.java
│  │        │           │  ├─ MerchantNotification.java
│  │        │           │  └─ PriceChangeProposal.java
│  │        │           ├─ filter
│  │        │           │  └─ JwtAuthenticationFilter.java
│  │        │           ├─ MerchantServiceApplication.java
│  │        │           ├─ repository
│  │        │           │  ├─ MenuItemRepository.java
│  │        │           │  ├─ MerchantNotificationRepository.java
│  │        │           │  ├─ MerchantRepository.java
│  │        │           │  └─ PriceChangeProposalRepository.java
│  │        │           ├─ service
│  │        │           │  ├─ MenuService.java
│  │        │           │  ├─ MerchantRefundService.java
│  │        │           │  ├─ MerchantService.java
│  │        │           │  ├─ PriceProposalService.java
│  │        │           │  └─ PricingEventConsumer.java
│  │        │           └─ util
│  │        │              └─ JwtUtil.java
│  │        └─ resources
│  │           ├─ application.yml
│  │           └─ db
│  │              └─ migration
│  │                 └─ V1.1__Add_audit_fields_to_merchants.sql
│  ├─ order-service
│  │  ├─ Dockerfile
│  │  ├─ order-service.iml
│  │  ├─ pom.xml
│  │  └─ src
│  │     └─ main
│  │        ├─ java
│  │        │  └─ com
│  │        │     └─ fooddelivery
│  │        │        └─ orderservice
│  │        │           ├─ client
│  │        │           │  ├─ MerchantServiceClient.java
│  │        │           │  ├─ PlatformServiceClient.java
│  │        │           │  └─ UserServiceClient.java
│  │        │           ├─ config
│  │        │           │  ├─ RabbitMQConfig.java
│  │        │           │  └─ SecurityConfig.java
│  │        │           ├─ controller
│  │        │           │  ├─ AdminOrderController.java
│  │        │           │  ├─ OrderController.java
│  │        │           │  └─ OrderInternalController.java
│  │        │           ├─ dto
│  │        │           │  ├─ AdminOrderDto.java
│  │        │           │  ├─ CancelOrderDto.java
│  │        │           │  ├─ CreateOrderDto.java
│  │        │           │  ├─ ItemSalesStatsDto.java
│  │        │           │  ├─ MenuItemDto.java
│  │        │           │  ├─ OrderDetailDto.java
│  │        │           │  ├─ OrderItemDetailDto.java
│  │        │           │  ├─ PaymentConfirmDto.java
│  │        │           │  └─ RefundApprovalDto.java
│  │        │           ├─ entity
│  │        │           │  ├─ CancellationRecord.java
│  │        │           │  ├─ MenuItem.java
│  │        │           │  ├─ Order.java
│  │        │           │  ├─ OrderItem.java
│  │        │           │  └─ OrderStatusHistory.java
│  │        │           ├─ filter
│  │        │           │  └─ JwtAuthenticationFilter.java
│  │        │           ├─ OrderServiceApplication.java
│  │        │           ├─ repository
│  │        │           │  ├─ CancellationRecordRepository.java
│  │        │           │  ├─ MenuItemRepository.java
│  │        │           │  ├─ OrderRepository.java
│  │        │           │  └─ OrderStatusHistoryRepository.java
│  │        │           ├─ service
│  │        │           │  ├─ CancellationService.java
│  │        │           │  └─ OrderService.java
│  │        │           └─ util
│  │        │              └─ JwtUtil.java
│  │        └─ resources
│  │           └─ application.yml
│  ├─ platform-service
│  │  ├─ Dockerfile
│  │  ├─ platform-service.iml
│  │  ├─ pom.xml
│  │  ├─ README.md
│  │  └─ src
│  │     └─ main
│  │        ├─ java
│  │        │  └─ com
│  │        │     └─ fooddelivery
│  │        │        └─ platformservice
│  │        │           ├─ config
│  │        │           │  ├─ OpenApiConfig.java
│  │        │           │  ├─ RestTemplateConfig.java
│  │        │           │  └─ SecurityConfig.java
│  │        │           ├─ controller
│  │        │           │  ├─ AdminDashboardController.java
│  │        │           │  ├─ AdminPlatformServiceController.java
│  │        │           │  ├─ AdminSettlementController.java
│  │        │           │  ├─ HealthCheckController.java
│  │        │           │  ├─ InternalCommissionController.java
│  │        │           │  ├─ MerchantCommissionController.java
│  │        │           │  ├─ MerchantPlatformServiceController.java
│  │        │           │  └─ MerchantSettlementController.java
│  │        │           ├─ dto
│  │        │           │  ├─ AdjustSettlementRequest.java
│  │        │           │  ├─ BatchPayRequest.java
│  │        │           │  ├─ CalculateCommissionRequest.java
│  │        │           │  ├─ CalculateCommissionResponse.java
│  │        │           │  ├─ CancelSubscriptionRequest.java
│  │        │           │  ├─ CommissionRecordDTO.java
│  │        │           │  ├─ CommissionSummaryDTO.java
│  │        │           │  ├─ ConfirmSettlementRequest.java
│  │        │           │  ├─ CreatePlatformServiceRequest.java
│  │        │           │  ├─ DashboardOverviewDTO.java
│  │        │           │  ├─ DisputeSettlementRequest.java
│  │        │           │  ├─ GenerateSettlementRequest.java
│  │        │           │  ├─ MerchantSettlementDTO.java
│  │        │           │  ├─ PlatformServiceDTO.java
│  │        │           │  ├─ PlatformStatsDTO.java
│  │        │           │  ├─ SettlementStatsDTO.java
│  │        │           │  ├─ SettlementTrendDTO.java
│  │        │           │  ├─ SubscribeServiceRequest.java
│  │        │           │  ├─ SubscriptionDTO.java
│  │        │           │  ├─ SystemHealthDTO.java
│  │        │           │  └─ UpdatePlatformServiceRequest.java
│  │        │           ├─ entity
│  │        │           │  ├─ BillingCycle.java
│  │        │           │  ├─ CommissionRecord.java
│  │        │           │  ├─ CommissionStatus.java
│  │        │           │  ├─ FeeType.java
│  │        │           │  ├─ MerchantServiceSubscription.java
│  │        │           │  ├─ MerchantSettlement.java
│  │        │           │  ├─ PlatformService.java
│  │        │           │  ├─ ServiceCategory.java
│  │        │           │  ├─ ServiceStatus.java
│  │        │           │  ├─ SettlementStatus.java
│  │        │           │  ├─ SettlementType.java
│  │        │           │  └─ SubscriptionStatus.java
│  │        │           ├─ exception
│  │        │           │  ├─ BusinessException.java
│  │        │           │  └─ GlobalExceptionHandler.java
│  │        │           ├─ filter
│  │        │           │  └─ JwtAuthenticationFilter.java
│  │        │           ├─ PlatformServiceApplication.java
│  │        │           ├─ repository
│  │        │           │  ├─ CommissionRecordRepository.java
│  │        │           │  ├─ MerchantEntity.java
│  │        │           │  ├─ MerchantQueryRepository.java
│  │        │           │  ├─ MerchantServiceSubscriptionRepository.java
│  │        │           │  ├─ MerchantSettlementRepository.java
│  │        │           │  └─ PlatformServiceRepository.java
│  │        │           ├─ service
│  │        │           │  ├─ CommissionScheduler.java
│  │        │           │  ├─ CommissionService.java
│  │        │           │  ├─ DashboardService.java
│  │        │           │  ├─ MerchantQueryService.java
│  │        │           │  ├─ PlatformServiceService.java
│  │        │           │  ├─ SettlementScheduler.java
│  │        │           │  ├─ SettlementService.java
│  │        │           │  ├─ SettlementStatisticsService.java
│  │        │           │  └─ SubscriptionService.java
│  │        │           └─ util
│  │        │              └─ JwtUtil.java
│  │        └─ resources
│  │           └─ application.yml
│  ├─ profile-service
│  │  ├─ Dockerfile
│  │  ├─ pom.xml
│  │  ├─ profile-service.iml
│  │  └─ src
│  │     └─ main
│  │        ├─ java
│  │        │  └─ com
│  │        │     └─ fooddelivery
│  │        │        └─ profileservice
│  │        │           ├─ client
│  │        │           │  └─ OrderClient.java
│  │        │           ├─ config
│  │        │           │  ├─ FeignConfig.java
│  │        │           │  └─ SecurityConfig.java
│  │        │           ├─ controller
│  │        │           │  └─ UserProfileController.java
│  │        │           ├─ dto
│  │        │           │  ├─ OrderDto.java
│  │        │           │  ├─ OrderItemDto.java
│  │        │           │  └─ UserContextDto.java
│  │        │           ├─ entity
│  │        │           │  ├─ BrowseRecord.java
│  │        │           │  ├─ UserProfile.java
│  │        │           │  └─ UserStats.java
│  │        │           ├─ filter
│  │        │           │  └─ JwtAuthenticationFilter.java
│  │        │           ├─ ProfileServiceApplication.java
│  │        │           ├─ repository
│  │        │           │  └─ UserProfileRepository.java
│  │        │           ├─ service
│  │        │           │  └─ UserProfileService.java
│  │        │           └─ util
│  │        │              └─ JwtUtil.java
│  │        └─ resources
│  │           └─ application.yml
│  ├─ recommendation-service
│  │  ├─ .env
│  │  ├─ agent_orchestrator.py
│  │  ├─ app
│  │  │  ├─ agents
│  │  │  │  ├─ base_agent.py
│  │  │  │  ├─ context_agent.py
│  │  │  │  ├─ decision_agent.py
│  │  │  │  ├─ langgraph_orchestrator.py
│  │  │  │  ├─ parallel_orchestrator.py
│  │  │  │  ├─ profiler_agent.py
│  │  │  │  ├─ reasoning_agent.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ api
│  │  │  │  ├─ auth_api.py
│  │  │  │  ├─ health.py
│  │  │  │  ├─ mcp_api.py
│  │  │  │  ├─ multi_agent_api.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ config.py
│  │  │  ├─ main.py
│  │  │  ├─ models
│  │  │  │  ├─ schemas.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ services
│  │  │  │  ├─ amap_poi_service.py
│  │  │  │  ├─ api_monitor.py
│  │  │  │  ├─ external_api.py
│  │  │  │  ├─ jwt_service.py
│  │  │  │  ├─ mcp_integrated_service.py
│  │  │  │  ├─ multi_agent_recommendation_service.py
│  │  │  │  └─ profile_service_client.py
│  │  │  └─ __init__.py
│  │  ├─ Dockerfile
│  │  ├─ enhanced_mcp_server.py
│  │  ├─ mcp_http_server.py
│  │  ├─ README.md
│  │  └─ requirements.txt
│  ├─ scripts
│  │  ├─ 01_schema.sql
│  │  ├─ 02_seeds.sql
│  │  ├─ 03_platform_service_schema.sql
│  │  ├─ 04_platform_service_seeds.sql
│  │  ├─ 05_add_payment_fields.sql
│  │  ├─ 06_add_external_id.sql
│  │  ├─ 07_orders_merchant_id_to_string.sql
│  │  ├─ 08_generate_menu_items_for_imported_merchants.sql.skip
│  │  ├─ 10_create_ai_pricing_db.sql
│  │  ├─ 11_init_ai_pricing_data.sql
│  │  ├─ 12_more_pricing_data.sql
│  │  ├─ 13_add_merchant_auto_approval.sql
│  │  ├─ 14_more_pricing_data_v2.sql
│  │  └─ 15_smart_issuance_tables.sql
│  └─ user-service
│     ├─ Dockerfile
│     ├─ pom.xml
│     ├─ src
│     │  └─ main
│     │     ├─ java
│     │     │  └─ com
│     │     │     └─ fooddelivery
│     │     │        └─ userservice
│     │     │           ├─ config
│     │     │           │  ├─ CorsConfig.java
│     │     │           │  └─ SecurityConfig.java
│     │     │           ├─ controller
│     │     │           │  ├─ AddressController.java
│     │     │           │  ├─ AdminUserController.java
│     │     │           │  ├─ AuthController.java
│     │     │           │  ├─ CommonUsageDemoController.java
│     │     │           │  └─ UserController.java
│     │     │           ├─ dto
│     │     │           │  ├─ AddressDto.java
│     │     │           │  ├─ AuthRequest.java
│     │     │           │  ├─ AuthResponse.java
│     │     │           │  ├─ UpdateUserDto.java
│     │     │           │  ├─ UpdateUserStatusDTO.java
│     │     │           │  ├─ UserCreditDto.java
│     │     │           │  ├─ UserResponseDto.java
│     │     │           │  └─ UserStatsDTO.java
│     │     │           ├─ entity
│     │     │           │  ├─ Address.java
│     │     │           │  ├─ CancellationHistory.java
│     │     │           │  └─ User.java
│     │     │           ├─ filter
│     │     │           │  └─ JwtAuthenticationFilter.java
│     │     │           ├─ repository
│     │     │           │  ├─ AddressRepository.java
│     │     │           │  ├─ CancellationHistoryRepository.java
│     │     │           │  └─ UserRepository.java
│     │     │           ├─ service
│     │     │           │  ├─ AddressService.java
│     │     │           │  ├─ AuthService.java
│     │     │           │  ├─ CreditService.java
│     │     │           │  └─ CustomUserDetailsService.java
│     │     │           ├─ UserServiceApplication.java
│     │     │           └─ util
│     │     │              └─ JwtUtil.java
│     │     └─ resources
│     │        └─ application.yml
│     └─ user-service.iml
├─ debug_auth_issue.md
├─ frontend
│  ├─ .bundle
│  │  └─ config
│  ├─ .eslintrc.js
│  ├─ .prettierrc.js
│  ├─ .watchmanconfig
│  ├─ ADDRESS_API_FIX.md
│  ├─ android
│  │  ├─ app
│  │  │  ├─ build.gradle
│  │  │  ├─ debug.keystore
│  │  │  ├─ proguard-rules.pro
│  │  │  └─ src
│  │  │     └─ main
│  │  │        ├─ AndroidManifest.xml
│  │  │        ├─ java
│  │  │        │  └─ com
│  │  │        │     └─ nutrivisionmobile
│  │  │        │        ├─ MainActivity.kt
│  │  │        │        └─ MainApplication.kt
│  │  │        └─ res
│  │  │           ├─ drawable
│  │  │           │  ├─ ic_launcher_background.xml
│  │  │           │  ├─ ic_launcher_foreground.xml
│  │  │           │  └─ rn_edit_text_material.xml
│  │  │           ├─ mipmap-anydpi-v26
│  │  │           │  ├─ ic_launcher.xml
│  │  │           │  └─ ic_launcher_round.xml
│  │  │           ├─ mipmap-hdpi
│  │  │           │  ├─ ic_launcher.png
│  │  │           │  └─ ic_launcher_round.png
│  │  │           ├─ mipmap-mdpi
│  │  │           │  ├─ ic_launcher.png
│  │  │           │  └─ ic_launcher_round.png
│  │  │           ├─ mipmap-xhdpi
│  │  │           │  ├─ ic_launcher.png
│  │  │           │  └─ ic_launcher_round.png
│  │  │           ├─ mipmap-xxhdpi
│  │  │           │  ├─ ic_launcher.png
│  │  │           │  └─ ic_launcher_round.png
│  │  │           ├─ mipmap-xxxhdpi
│  │  │           │  ├─ ic_launcher.png
│  │  │           │  └─ ic_launcher_round.png
│  │  │           └─ values
│  │  │              ├─ strings.xml
│  │  │              └─ styles.xml
│  │  ├─ build
│  │  │  ├─ generated
│  │  │  │  └─ autolinking
│  │  │  │     ├─ autolinking.json
│  │  │  │     ├─ package-lock.json.sha
│  │  │  │     └─ package.json.sha
│  │  │  └─ reports
│  │  │     └─ problems
│  │  │        └─ problems-report.html
│  │  ├─ build.gradle
│  │  ├─ gradle
│  │  │  └─ wrapper
│  │  │     ├─ gradle-wrapper.jar
│  │  │     └─ gradle-wrapper.properties
│  │  ├─ gradle.properties
│  │  ├─ gradlew
│  │  ├─ gradlew.bat
│  │  ├─ local.properties
│  │  └─ settings.gradle
│  ├─ app.json
│  ├─ App.tsx
│  ├─ babel.config.js
│  ├─ Gemfile
│  ├─ index.js
│  ├─ ios
│  │  ├─ .xcode.env
│  │  ├─ NutriVisionMobile
│  │  │  ├─ AppDelegate.swift
│  │  │  ├─ Images.xcassets
│  │  │  │  ├─ AppIcon.appiconset
│  │  │  │  │  └─ Contents.json
│  │  │  │  └─ Contents.json
│  │  │  ├─ Info.plist
│  │  │  ├─ LaunchScreen.storyboard
│  │  │  └─ PrivacyInfo.xcprivacy
│  │  ├─ NutriVisionMobile.xcodeproj
│  │  │  ├─ project.pbxproj
│  │  │  └─ xcshareddata
│  │  │     └─ xcschemes
│  │  │        └─ NutriVisionMobile.xcscheme
│  │  └─ Podfile
│  ├─ jest.config.js
│  ├─ metro.config.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ src
│  │  ├─ components
│  │  │  ├─ admin
│  │  │  ├─ CartBar.tsx
│  │  │  ├─ CartItem.tsx
│  │  │  ├─ LocationDisplay.tsx
│  │  │  ├─ MenuListItem.tsx
│  │  │  ├─ merchant
│  │  │  │  ├─ MerchantHeader.tsx
│  │  │  │  └─ MerchantSidebar.tsx
│  │  │  ├─ MerchantLayout.tsx
│  │  │  └─ RestaurantCard.tsx
│  │  ├─ config
│  │  │  └─ serviceConfig.js
│  │  ├─ hooks
│  │  │  ├─ useAuth.tsx
│  │  │  └─ useCoupons.js
│  │  ├─ README.md
│  │  ├─ screens
│  │  │  ├─ AddressEditScreen.tsx
│  │  │  ├─ AddressListScreen.tsx
│  │  │  ├─ admin
│  │  │  ├─ AdminDashboardScreen.tsx
│  │  │  ├─ CartScreen.tsx
│  │  │  ├─ HomeScreen.tsx
│  │  │  ├─ LocationDebugScreen.tsx
│  │  │  ├─ LoginScreen.tsx
│  │  │  ├─ merchant
│  │  │  │  ├─ MenuManagementScreen.tsx
│  │  │  │  ├─ MerchantDashboardScreen.tsx
│  │  │  │  ├─ MerchantOnboardingScreen.tsx
│  │  │  │  ├─ MerchantShopInfoScreen.tsx
│  │  │  │  ├─ RefundAuditScreen.tsx
│  │  │  │  ├─ ServiceMarketplaceScreen.tsx
│  │  │  │  ├─ SettlementDashboardScreen.tsx
│  │  │  │  └─ SmartPricingScreen.tsx
│  │  │  ├─ OrderConfirmScreen.tsx
│  │  │  ├─ OrderListScreen.tsx
│  │  │  ├─ OrderTrackingScreen.tsx
│  │  │  ├─ PaymentSuccessScreen.tsx
│  │  │  ├─ ProfileScreen.tsx
│  │  │  ├─ RestaurantDetailScreen.tsx
│  │  │  ├─ SurveyScreen.tsx
│  │  │  └─ WalletScreen.tsx
│  │  └─ services
│  │     ├─ addressService.js
│  │     ├─ aiPricingService.js
│  │     ├─ apiClient.js
│  │     ├─ authService.js
│  │     ├─ merchantOrderService.js
│  │     ├─ merchantService.js
│  │     ├─ orderService.js
│  │     ├─ platformService.js
│  │     ├─ profileService.js
│  │     ├─ recommendationService.js
│  │     ├─ settlementService.js
│  │     └─ walletService.js
│  ├─ src_frontend_web
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ components
│  │  │  ├─ admin
│  │  │  │  ├─ AdminLayout.jsx
│  │  │  │  ├─ ApiTestPanel.jsx
│  │  │  │  ├─ Header.jsx
│  │  │  │  └─ Sidebar.jsx
│  │  │  └─ merchant
│  │  │     ├─ MerchantHeader.jsx
│  │  │     └─ MerchantSidebar.jsx
│  │  ├─ config
│  │  │  └─ adminConfig.js
│  │  ├─ docs
│  │  │  └─ 统计数据架构分析.md
│  │  ├─ hooks
│  │  │  ├─ useAuth.jsx
│  │  │  └─ useCoupons.js
│  │  ├─ index.css
│  │  ├─ main.jsx
│  │  ├─ pages
│  │  │  ├─ admin
│  │  │  │  ├─ AdminLogin.jsx
│  │  │  │  ├─ Commissions.jsx
│  │  │  │  ├─ Dashboard.jsx
│  │  │  │  ├─ DashboardModern.jsx
│  │  │  │  ├─ DashboardNew.jsx
│  │  │  │  ├─ Marketing.jsx
│  │  │  │  ├─ Merchants.jsx
│  │  │  │  ├─ Orders.jsx
│  │  │  │  ├─ Services.jsx
│  │  │  │  ├─ ServicesNew.jsx
│  │  │  │  ├─ Settlements.jsx
│  │  │  │  ├─ SettlementsNew.jsx
│  │  │  │  ├─ StatsTestPage.jsx
│  │  │  │  ├─ SystemMonitor.jsx
│  │  │  │  ├─ UserCredit.jsx
│  │  │  │  └─ Users.jsx
│  │  │  ├─ merchant
│  │  │  │  ├─ MenuManagement.jsx
│  │  │  │  ├─ MerchantLayout.jsx
│  │  │  │  ├─ MerchantOnboarding.jsx
│  │  │  │  ├─ MerchantShopInfo.jsx
│  │  │  │  ├─ RefundAudit.jsx
│  │  │  │  ├─ ServiceMarketplace.jsx
│  │  │  │  ├─ SettlementDashboard.jsx
│  │  │  │  └─ SmartPricing.jsx
│  │  │  └─ user
│  │  │     ├─ Address.jsx
│  │  │     ├─ Cart.jsx
│  │  │     ├─ Home.jsx
│  │  │     ├─ Login.jsx
│  │  │     ├─ MyOrders.jsx
│  │  │     ├─ OrderConfirm.jsx
│  │  │     ├─ OrderTracking.jsx
│  │  │     ├─ PaymentSuccess.jsx
│  │  │     ├─ Profile.jsx
│  │  │     ├─ RestaurantDetail.jsx
│  │  │     ├─ Survey.jsx
│  │  │     └─ Wallet.jsx
│  │  ├─ services
│  │  │  ├─ addressService.js
│  │  │  ├─ admin
│  │  │  │  ├─ apiConfig.js
│  │  │  │  ├─ apiTester.js
│  │  │  │  ├─ authService.js
│  │  │  │  ├─ dashboardService.js
│  │  │  │  ├─ index.js
│  │  │  │  ├─ marketingService.js
│  │  │  │  ├─ merchantService.js
│  │  │  │  ├─ orderService.js
│  │  │  │  ├─ orderStatsService.js
│  │  │  │  ├─ platformService.js
│  │  │  │  ├─ settlementService.js
│  │  │  │  ├─ systemService.js
│  │  │  │  └─ userService.js
│  │  │  ├─ aiPricingService.js
│  │  │  ├─ apiClient.js
│  │  │  ├─ authService.js
│  │  │  ├─ index.js
│  │  │  ├─ merchantOrderService.js
│  │  │  ├─ merchantService.js
│  │  │  ├─ orderService.js
│  │  │  ├─ platformService.js
│  │  │  ├─ profileService.js
│  │  │  ├─ recommendationService.js
│  │  │  ├─ settlementService.js
│  │  │  ├─ userService.js
│  │  │  └─ walletService.js
│  │  ├─ types
│  │  │  ├─ admin.js
│  │  │  └─ coupon.ts
│  │  └─ utils
│  │     ├─ apiDiagnostic.js
│  │     ├─ apiTest.js
│  │     ├─ apiTester.js
│  │     ├─ couponIssueDebug.js
│  │     ├─ couponUtils.js
│  │     ├─ debugApiConnection.js
│  │     ├─ debugAuth.js
│  │     ├─ debugMarketingApi.js
│  │     ├─ fieldMapper.js
│  │     ├─ frontendTester.js
│  │     ├─ pageUpdater.js
│  │     ├─ quickDiagnostic.js
│  │     ├─ simpleMarketingTest.js
│  │     ├─ statsApiChecker.js
│  │     ├─ statsDebugger.js
│  │     └─ testMarketingFeatures.js
│  ├─ tsconfig.json
│  └─ __tests__
│     └─ App.test.tsx
├─ PLAN.md
└─ README.md

```