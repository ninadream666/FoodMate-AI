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

## 真机连接测试

目录： C:\Users\用户名\AppData\Local\Android\Sdk\platform-tools
.\adb.exe pair <手机IP>:<端口号>
.\adb.exe connect <手机IP>:<端口号>

## 语音识别gguf模型文件初始化问题

USB连接测试：
在backend/static下运行python -m http.server 9099
执行adb reverse tcp:9099 tcp:9099

后续部署到服务器上另有方法。

```
FoodMate-AI
├─ backend
│  ├─ .env
│  ├─ .hf_cache
│  ├─ ai-pricing-service
│  │  ├─ app
│  │  │  ├─ clients.py
│  │  │  ├─ config.py
│  │  │  ├─ deepseek_agent.py
│  │  │  ├─ events.py
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
│  │                    │  ├─ JwtAuthenticationFilter.java
│  │                    │  └─ RateLimitFilter.java
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
│  │        │           │  └─ CouponController.java
│  │        │           ├─ dto
│  │        │           │  ├─ AdminIssueBatchRequest.java
│  │        │           │  ├─ AdminIssueCouponRequest.java
│  │        │           │  ├─ CalculateBestCouponRequest.java
│  │        │           │  ├─ CalculateBestCouponResponse.java
│  │        │           │  ├─ CouponStatsDTO.java
│  │        │           │  ├─ CouponTemplateDTO.java
│  │        │           │  ├─ CouponTypeStatsDTO.java
│  │        │           │  ├─ CouponUsageTrendDTO.java
│  │        │           │  ├─ CreateCouponTemplateRequest.java
│  │        │           │  ├─ IssueCouponRequest.java
│  │        │           │  ├─ OrderItemDTO.java
│  │        │           │  ├─ RollbackCouponRequest.java
│  │        │           │  ├─ UpdateCouponTemplateRequest.java
│  │        │           │  ├─ UseCouponRequest.java
│  │        │           │  └─ UserCouponDTO.java
│  │        │           ├─ entity
│  │        │           │  ├─ CouponStatus.java
│  │        │           │  ├─ CouponTemplate.java
│  │        │           │  ├─ CouponType.java
│  │        │           │  └─ UserCoupon.java
│  │        │           ├─ exception
│  │        │           │  ├─ BusinessException.java
│  │        │           │  └─ GlobalExceptionHandler.java
│  │        │           ├─ filter
│  │        │           │  └─ JwtAuthenticationFilter.java
│  │        │           ├─ MarketingServiceApplication.java
│  │        │           ├─ repository
│  │        │           │  ├─ CouponTemplateRepository.java
│  │        │           │  └─ UserCouponRepository.java
│  │        │           ├─ service
│  │        │           │  ├─ CouponCalculationService.java
│  │        │           │  ├─ CouponCombinationService.java
│  │        │           │  ├─ CouponIssueService.java
│  │        │           │  ├─ CouponStatisticsService.java
│  │        │           │  ├─ CouponStatsService.java
│  │        │           │  └─ CouponTemplateService.java
│  │        │           └─ util
│  │        │              └─ JwtUtil.java
│  │        └─ resources
│  │           └─ application.yml
│  ├─ maven-settings.xml
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
│  │        │           │  ├─ ImageProxyController.java
│  │        │           │  ├─ MenuController.java
│  │        │           │  ├─ MerchantController.java
│  │        │           │  ├─ MerchantInternalController.java
│  │        │           │  ├─ MerchantNotificationController.java
│  │        │           │  ├─ MerchantOrderController.java
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
│  ├─ nginx.conf
│  ├─ nutrivision-service
│  │  ├─ app
│  │  │  ├─ core
│  │  │  │  ├─ config.py
│  │  │  │  ├─ food_classifier.py
│  │  │  │  ├─ gpt_vision.py
│  │  │  │  └─ _init_.py
│  │  │  ├─ main.py
│  │  │  ├─ models
│  │  │  │  ├─ class_names.txt
│  │  │  │  ├─ schemas.py
│  │  │  │  └─ _init_.py
│  │  │  └─ _init_.py
│  │  ├─ Dockerfile
│  │  └─ requirements.txt
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
│  ├─ proxy_headers.conf
│  ├─ recommendation-service
│  │  ├─ .env
│  │  ├─ agent_orchestrator.py
│  │  ├─ app
│  │  │  ├─ agents
│  │  │  │  ├─ base_agent.py
│  │  │  │  ├─ collaborative_agent.py
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
│  │  │  │  ├─ ml_api.py
│  │  │  │  ├─ multi_agent_api.py
│  │  │  │  └─ __init__.py
│  │  │  ├─ config.py
│  │  │  ├─ main.py
│  │  │  ├─ ml
│  │  │  │  ├─ data_collector.py
│  │  │  │  ├─ ensemble_strategy.py
│  │  │  │  ├─ feature_engineering.py
│  │  │  │  ├─ foodcf_encoder.py
│  │  │  │  ├─ inference_engine.py
│  │  │  │  ├─ ncf_model.py
│  │  │  │  ├─ train_all.py
│  │  │  │  ├─ train_deepfm.py
│  │  │  │  ├─ train_foodcf_encoder.py
│  │  │  │  ├─ train_lightgbm.py
│  │  │  │  ├─ train_ncf.py
│  │  │  │  └─ __init__.py
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
│  │  ├─ ml_data
│  │  │  ├─ encoder_train.jsonl
│  │  │  ├─ ncf_training_data.jsonl
│  │  │  └─ training_samples.jsonl
│  │  ├─ models
│  │  │  ├─ foodcf_encoder
│  │  │  │  ├─ adapter_config.json
│  │  │  │  ├─ adapter_model.safetensors
│  │  │  │  ├─ added_tokens.json
│  │  │  │  ├─ config.json
│  │  │  │  ├─ encoder.ipynb
│  │  │  │  ├─ merges.txt
│  │  │  │  ├─ README.md
│  │  │  │  ├─ special_tokens_map.json
│  │  │  │  ├─ tokenizer_config.json
│  │  │  │  └─ vocab.json
│  │  │  └─ lightgbm_ranking.txt
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
│  ├─ static
│  │  └─ models
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
├─ docs
│  ├─ PPT展示_Marp.md
│  ├─ PPT展示内容.md
│  ├─ UI.md
│  ├─ 健康模拟.md
│  ├─ 协同过滤使用的大模型
│  ├─ 后端修改.md
│  ├─ 大模型与ML模型清单.md
│  ├─ 开题报告前准备工作.md
│  ├─ 性能优化.md
│  ├─ 数据库设计文档.md
│  ├─ 智能推荐部分增加协同过滤
│  ├─ 测试文档.md
│  ├─ 环境光感知.md
│  ├─ 网络性能优化与大流量保护.md
│  ├─ 项目完整结构文档.md
│  ├─ 项目管理报告.md
│  └─ 项目详细报告.md
├─ frontend
│  ├─ .bundle
│  │  └─ config
│  ├─ .eslintrc.js
│  ├─ .prettierrc.js
│  ├─ .watchmanconfig
│  ├─ ADDRESS_API_FIX.md
│  ├─ android
│  │  ├─ .kotlin
│  │  │  └─ sessions
│  │  ├─ app
│  │  │  ├─ .cxx
│  │  │  │  ├─ Debug
│  │  │  │  │  └─ 5c25502a
│  │  │  │  │     ├─ arm64-v8a
│  │  │  │  │     │  ├─ .cmake
│  │  │  │  │     │  │  └─ api
│  │  │  │  │     │  │     └─ v1
│  │  │  │  │     │  │        ├─ query
│  │  │  │  │     │  │        │  └─ client-agp
│  │  │  │  │     │  │        │     ├─ cache-v2
│  │  │  │  │     │  │        │     ├─ cmakeFiles-v1
│  │  │  │  │     │  │        │     └─ codemodel-v2
│  │  │  │  │     │  │        └─ reply
│  │  │  │  │     │  │           ├─ cache-v2-67402afee7cff3f93338.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-eb8f218f2331dac91564.json
│  │  │  │  │     │  │           ├─ codemodel-v2-d5bf6d2506aecae6748e.json
│  │  │  │  │     │  │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-AmbientLightSensor_autolinked_build-Debug-28dc3a9df46d185fc4fd.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-Debug-ce80e9411a44e7b5c4e7.json
│  │  │  │  │     │  │           ├─ directory-rnblurview_autolinked_build-Debug-2608b3bd9ea61b1892c2.json
│  │  │  │  │     │  │           ├─ directory-RNCNetInfoSpec_autolinked_build-Debug-06bfdf99ca84c18234f3.json
│  │  │  │  │     │  │           ├─ directory-RNImagePickerSpec_autolinked_build-Debug-95c0cba1ce00e080d0b6.json
│  │  │  │  │     │  │           ├─ directory-RNLlamaSpec_autolinked_build-Debug-309bb2ab8492df907922.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-Debug-6778232716d1a2c5d1e8.json
│  │  │  │  │     │  │           ├─ directory-RNVectorIconsSpec_autolinked_build-Debug-d192acf50a1f6d61d9b2.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-Debug-ee4679645502e7ade171.json
│  │  │  │  │     │  │           ├─ directory-VoskSpec_autolinked_build-Debug-33c2cba4e531b28ee8f8.json
│  │  │  │  │     │  │           ├─ index-2026-04-08T06-36-47-0823.json
│  │  │  │  │     │  │           ├─ target-appmodules-Debug-e2c458afeca872c36043.json
│  │  │  │  │     │  │           ├─ target-react_codegen_AmbientLightSensor-Debug-7c374f188934e4e028dc.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-Debug-9cdbb0bf2221d76a6de9.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnblurview-Debug-b8c24e25d3f3003496b4.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNCNetInfoSpec-Debug-20fe76a06629601d3986.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNImagePickerSpec-Debug-a9f71434d8c04861285a.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNLlamaSpec-Debug-548b9280bc2acc9e9cb6.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-Debug-76b0f28365f8820f9e90.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNVectorIconsSpec-Debug-2cd6afb95da8d1e50430.json
│  │  │  │  │     │  │           ├─ target-react_codegen_safeareacontext-Debug-fd893c6d08596ca1cf52.json
│  │  │  │  │     │  │           └─ target-react_codegen_VoskSpec-Debug-d1375d27ac45f43fcc74.json
│  │  │  │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  ├─ .ninja_log
│  │  │  │  │     │  ├─ additional_project_files.txt
│  │  │  │  │     │  ├─ android_gradle_build.json
│  │  │  │  │     │  ├─ android_gradle_build_mini.json
│  │  │  │  │     │  ├─ build.ninja
│  │  │  │  │     │  ├─ build_file_index.txt
│  │  │  │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │  ├─ 3.22.1-g37088a8-dirty
│  │  │  │  │     │  │  │  ├─ CMakeCCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeCXXCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeSystem.cmake
│  │  │  │  │     │  │  │  ├─ CompilerIdC
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.c
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.o
│  │  │  │  │     │  │  │  │  └─ tmp
│  │  │  │  │     │  │  │  └─ CompilerIdCXX
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.cpp
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.o
│  │  │  │  │     │  │  │     └─ tmp
│  │  │  │  │     │  │  ├─ appmodules.dir
│  │  │  │  │     │  │  │  └─ D_
│  │  │  │  │     │  │  │     └─ Homework
│  │  │  │  │     │  │  │        └─ FoodMate-AI
│  │  │  │  │     │  │  │           └─ frontend
│  │  │  │  │     │  │  │              └─ android
│  │  │  │  │     │  │  │                 └─ app
│  │  │  │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │  ├─ cmake.verify_globs
│  │  │  │  │     │  │  ├─ CMakeTmp
│  │  │  │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │  ├─ TargetDirectories.txt
│  │  │  │  │     │  │  ├─ VerifyGlobs.cmake
│  │  │  │  │     │  │  └─ _CMakeLTOTest-CXX
│  │  │  │  │     │  │     ├─ bin
│  │  │  │  │     │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  │     │  ├─ .ninja_log
│  │  │  │  │     │  │     │  ├─ build.ninja
│  │  │  │  │     │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │     │  │  ├─ boo.dir
│  │  │  │  │     │  │     │  │  │  └─ main.cpp.o
│  │  │  │  │     │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │     │  │  ├─ foo.dir
│  │  │  │  │     │  │     │  │  │  └─ foo.cpp.o
│  │  │  │  │     │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │     │  │  └─ TargetDirectories.txt
│  │  │  │  │     │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  │     │  └─ libfoo.a
│  │  │  │  │     │  │     └─ src
│  │  │  │  │     │  │        ├─ CMakeLists.txt
│  │  │  │  │     │  │        ├─ foo.cpp
│  │  │  │  │     │  │        └─ main.cpp
│  │  │  │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  ├─ compile_commands.json
│  │  │  │  │     │  ├─ metadata_generation_command.txt
│  │  │  │  │     │  ├─ prefab_config.json
│  │  │  │  │     │  └─ symbol_folder_index.txt
│  │  │  │  │     ├─ armeabi-v7a
│  │  │  │  │     │  ├─ .cmake
│  │  │  │  │     │  │  └─ api
│  │  │  │  │     │  │     └─ v1
│  │  │  │  │     │  │        ├─ query
│  │  │  │  │     │  │        │  └─ client-agp
│  │  │  │  │     │  │        │     ├─ cache-v2
│  │  │  │  │     │  │        │     ├─ cmakeFiles-v1
│  │  │  │  │     │  │        │     └─ codemodel-v2
│  │  │  │  │     │  │        └─ reply
│  │  │  │  │     │  │           ├─ cache-v2-2b4f02d2a286f789c93b.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-927f418bd0e4809c8eb9.json
│  │  │  │  │     │  │           ├─ codemodel-v2-6902834620966d54e49c.json
│  │  │  │  │     │  │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-AmbientLightSensor_autolinked_build-Debug-28dc3a9df46d185fc4fd.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-Debug-ce80e9411a44e7b5c4e7.json
│  │  │  │  │     │  │           ├─ directory-rnblurview_autolinked_build-Debug-2608b3bd9ea61b1892c2.json
│  │  │  │  │     │  │           ├─ directory-RNCNetInfoSpec_autolinked_build-Debug-06bfdf99ca84c18234f3.json
│  │  │  │  │     │  │           ├─ directory-RNImagePickerSpec_autolinked_build-Debug-95c0cba1ce00e080d0b6.json
│  │  │  │  │     │  │           ├─ directory-RNLlamaSpec_autolinked_build-Debug-309bb2ab8492df907922.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-Debug-6778232716d1a2c5d1e8.json
│  │  │  │  │     │  │           ├─ directory-RNVectorIconsSpec_autolinked_build-Debug-d192acf50a1f6d61d9b2.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-Debug-ee4679645502e7ade171.json
│  │  │  │  │     │  │           ├─ directory-VoskSpec_autolinked_build-Debug-33c2cba4e531b28ee8f8.json
│  │  │  │  │     │  │           ├─ index-2026-04-08T06-36-43-0455.json
│  │  │  │  │     │  │           ├─ target-appmodules-Debug-3d49b4d7c16bbf2b83bc.json
│  │  │  │  │     │  │           ├─ target-react_codegen_AmbientLightSensor-Debug-1893703895d873796f84.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-Debug-fd15119f7cd8c696abb1.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnblurview-Debug-0a2e063e819795665420.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNCNetInfoSpec-Debug-957ba4a5720d55393b02.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNImagePickerSpec-Debug-ccf8ca87f66b7c122edb.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNLlamaSpec-Debug-7bd88cdc72e5096064e5.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-Debug-68ca310858a3d14d4201.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNVectorIconsSpec-Debug-53375baa0229185d273b.json
│  │  │  │  │     │  │           ├─ target-react_codegen_safeareacontext-Debug-7f57e6a0f4bafdeaf8a6.json
│  │  │  │  │     │  │           └─ target-react_codegen_VoskSpec-Debug-7773b12486c6b2c11355.json
│  │  │  │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  ├─ .ninja_log
│  │  │  │  │     │  ├─ additional_project_files.txt
│  │  │  │  │     │  ├─ android_gradle_build.json
│  │  │  │  │     │  ├─ android_gradle_build_mini.json
│  │  │  │  │     │  ├─ build.ninja
│  │  │  │  │     │  ├─ build_file_index.txt
│  │  │  │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │  ├─ 3.22.1-g37088a8-dirty
│  │  │  │  │     │  │  │  ├─ CMakeCCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeCXXCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeSystem.cmake
│  │  │  │  │     │  │  │  ├─ CompilerIdC
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.c
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.o
│  │  │  │  │     │  │  │  │  └─ tmp
│  │  │  │  │     │  │  │  └─ CompilerIdCXX
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.cpp
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.o
│  │  │  │  │     │  │  │     └─ tmp
│  │  │  │  │     │  │  ├─ appmodules.dir
│  │  │  │  │     │  │  │  └─ D_
│  │  │  │  │     │  │  │     └─ Homework
│  │  │  │  │     │  │  │        └─ FoodMate-AI
│  │  │  │  │     │  │  │           └─ frontend
│  │  │  │  │     │  │  │              └─ android
│  │  │  │  │     │  │  │                 └─ app
│  │  │  │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │  ├─ cmake.verify_globs
│  │  │  │  │     │  │  ├─ CMakeTmp
│  │  │  │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │  ├─ TargetDirectories.txt
│  │  │  │  │     │  │  ├─ VerifyGlobs.cmake
│  │  │  │  │     │  │  └─ _CMakeLTOTest-CXX
│  │  │  │  │     │  │     ├─ bin
│  │  │  │  │     │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  │     │  ├─ .ninja_log
│  │  │  │  │     │  │     │  ├─ build.ninja
│  │  │  │  │     │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │     │  │  ├─ boo.dir
│  │  │  │  │     │  │     │  │  │  └─ main.cpp.o
│  │  │  │  │     │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │     │  │  ├─ foo.dir
│  │  │  │  │     │  │     │  │  │  └─ foo.cpp.o
│  │  │  │  │     │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │     │  │  └─ TargetDirectories.txt
│  │  │  │  │     │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  │     │  └─ libfoo.a
│  │  │  │  │     │  │     └─ src
│  │  │  │  │     │  │        ├─ CMakeLists.txt
│  │  │  │  │     │  │        ├─ foo.cpp
│  │  │  │  │     │  │        └─ main.cpp
│  │  │  │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  ├─ compile_commands.json
│  │  │  │  │     │  ├─ metadata_generation_command.txt
│  │  │  │  │     │  ├─ prefab_config.json
│  │  │  │  │     │  └─ symbol_folder_index.txt
│  │  │  │  │     ├─ hash_key.txt
│  │  │  │  │     ├─ prefab
│  │  │  │  │     │  ├─ arm64-v8a
│  │  │  │  │     │  │  └─ prefab
│  │  │  │  │     │  │     └─ lib
│  │  │  │  │     │  │        └─ aarch64-linux-android
│  │  │  │  │     │  │           └─ cmake
│  │  │  │  │     │  │              ├─ fbjni
│  │  │  │  │     │  │              │  ├─ fbjniConfig.cmake
│  │  │  │  │     │  │              │  └─ fbjniConfigVersion.cmake
│  │  │  │  │     │  │              ├─ hermes-engine
│  │  │  │  │     │  │              │  ├─ hermes-engineConfig.cmake
│  │  │  │  │     │  │              │  └─ hermes-engineConfigVersion.cmake
│  │  │  │  │     │  │              └─ ReactAndroid
│  │  │  │  │     │  │                 ├─ ReactAndroidConfig.cmake
│  │  │  │  │     │  │                 └─ ReactAndroidConfigVersion.cmake
│  │  │  │  │     │  ├─ armeabi-v7a
│  │  │  │  │     │  │  └─ prefab
│  │  │  │  │     │  │     └─ lib
│  │  │  │  │     │  │        └─ arm-linux-androideabi
│  │  │  │  │     │  │           └─ cmake
│  │  │  │  │     │  │              ├─ fbjni
│  │  │  │  │     │  │              │  ├─ fbjniConfig.cmake
│  │  │  │  │     │  │              │  └─ fbjniConfigVersion.cmake
│  │  │  │  │     │  │              ├─ hermes-engine
│  │  │  │  │     │  │              │  ├─ hermes-engineConfig.cmake
│  │  │  │  │     │  │              │  └─ hermes-engineConfigVersion.cmake
│  │  │  │  │     │  │              └─ ReactAndroid
│  │  │  │  │     │  │                 ├─ ReactAndroidConfig.cmake
│  │  │  │  │     │  │                 └─ ReactAndroidConfigVersion.cmake
│  │  │  │  │     │  ├─ x86
│  │  │  │  │     │  │  └─ prefab
│  │  │  │  │     │  │     └─ lib
│  │  │  │  │     │  │        └─ i686-linux-android
│  │  │  │  │     │  │           └─ cmake
│  │  │  │  │     │  │              ├─ fbjni
│  │  │  │  │     │  │              │  ├─ fbjniConfig.cmake
│  │  │  │  │     │  │              │  └─ fbjniConfigVersion.cmake
│  │  │  │  │     │  │              ├─ hermes-engine
│  │  │  │  │     │  │              │  ├─ hermes-engineConfig.cmake
│  │  │  │  │     │  │              │  └─ hermes-engineConfigVersion.cmake
│  │  │  │  │     │  │              └─ ReactAndroid
│  │  │  │  │     │  │                 ├─ ReactAndroidConfig.cmake
│  │  │  │  │     │  │                 └─ ReactAndroidConfigVersion.cmake
│  │  │  │  │     │  └─ x86_64
│  │  │  │  │     │     └─ prefab
│  │  │  │  │     │        └─ lib
│  │  │  │  │     │           └─ x86_64-linux-android
│  │  │  │  │     │              └─ cmake
│  │  │  │  │     │                 ├─ fbjni
│  │  │  │  │     │                 │  ├─ fbjniConfig.cmake
│  │  │  │  │     │                 │  └─ fbjniConfigVersion.cmake
│  │  │  │  │     │                 ├─ hermes-engine
│  │  │  │  │     │                 │  ├─ hermes-engineConfig.cmake
│  │  │  │  │     │                 │  └─ hermes-engineConfigVersion.cmake
│  │  │  │  │     │                 └─ ReactAndroid
│  │  │  │  │     │                    ├─ ReactAndroidConfig.cmake
│  │  │  │  │     │                    └─ ReactAndroidConfigVersion.cmake
│  │  │  │  │     ├─ x86
│  │  │  │  │     │  ├─ .cmake
│  │  │  │  │     │  │  └─ api
│  │  │  │  │     │  │     └─ v1
│  │  │  │  │     │  │        ├─ query
│  │  │  │  │     │  │        │  └─ client-agp
│  │  │  │  │     │  │        │     ├─ cache-v2
│  │  │  │  │     │  │        │     ├─ cmakeFiles-v1
│  │  │  │  │     │  │        │     └─ codemodel-v2
│  │  │  │  │     │  │        └─ reply
│  │  │  │  │     │  │           ├─ cache-v2-c024ed3f7eb85d17b8e8.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-936bf8c54c0da2d4042f.json
│  │  │  │  │     │  │           ├─ codemodel-v2-738004582356fdbadad7.json
│  │  │  │  │     │  │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-AmbientLightSensor_autolinked_build-Debug-28dc3a9df46d185fc4fd.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-Debug-ce80e9411a44e7b5c4e7.json
│  │  │  │  │     │  │           ├─ directory-rnblurview_autolinked_build-Debug-2608b3bd9ea61b1892c2.json
│  │  │  │  │     │  │           ├─ directory-RNCNetInfoSpec_autolinked_build-Debug-06bfdf99ca84c18234f3.json
│  │  │  │  │     │  │           ├─ directory-RNImagePickerSpec_autolinked_build-Debug-95c0cba1ce00e080d0b6.json
│  │  │  │  │     │  │           ├─ directory-RNLlamaSpec_autolinked_build-Debug-309bb2ab8492df907922.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-Debug-6778232716d1a2c5d1e8.json
│  │  │  │  │     │  │           ├─ directory-RNVectorIconsSpec_autolinked_build-Debug-d192acf50a1f6d61d9b2.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-Debug-ee4679645502e7ade171.json
│  │  │  │  │     │  │           ├─ directory-VoskSpec_autolinked_build-Debug-33c2cba4e531b28ee8f8.json
│  │  │  │  │     │  │           ├─ index-2026-04-08T06-36-51-0838.json
│  │  │  │  │     │  │           ├─ target-appmodules-Debug-a5c9b2ef9c98818210ec.json
│  │  │  │  │     │  │           ├─ target-react_codegen_AmbientLightSensor-Debug-7c374f188934e4e028dc.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-Debug-9cdbb0bf2221d76a6de9.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnblurview-Debug-b8c24e25d3f3003496b4.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNCNetInfoSpec-Debug-20fe76a06629601d3986.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNImagePickerSpec-Debug-a9f71434d8c04861285a.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNLlamaSpec-Debug-548b9280bc2acc9e9cb6.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-Debug-50e115b758fa60c2c196.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNVectorIconsSpec-Debug-2cd6afb95da8d1e50430.json
│  │  │  │  │     │  │           ├─ target-react_codegen_safeareacontext-Debug-7878f0f38a01d51f4eb2.json
│  │  │  │  │     │  │           └─ target-react_codegen_VoskSpec-Debug-d1375d27ac45f43fcc74.json
│  │  │  │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  ├─ .ninja_log
│  │  │  │  │     │  ├─ additional_project_files.txt
│  │  │  │  │     │  ├─ android_gradle_build.json
│  │  │  │  │     │  ├─ android_gradle_build_mini.json
│  │  │  │  │     │  ├─ build.ninja
│  │  │  │  │     │  ├─ build_file_index.txt
│  │  │  │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │  ├─ 3.22.1-g37088a8-dirty
│  │  │  │  │     │  │  │  ├─ CMakeCCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeCXXCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeSystem.cmake
│  │  │  │  │     │  │  │  ├─ CompilerIdC
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.c
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.o
│  │  │  │  │     │  │  │  │  └─ tmp
│  │  │  │  │     │  │  │  └─ CompilerIdCXX
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.cpp
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.o
│  │  │  │  │     │  │  │     └─ tmp
│  │  │  │  │     │  │  ├─ appmodules.dir
│  │  │  │  │     │  │  │  └─ D_
│  │  │  │  │     │  │  │     └─ Homework
│  │  │  │  │     │  │  │        └─ FoodMate-AI
│  │  │  │  │     │  │  │           └─ frontend
│  │  │  │  │     │  │  │              └─ android
│  │  │  │  │     │  │  │                 └─ app
│  │  │  │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │  ├─ cmake.verify_globs
│  │  │  │  │     │  │  ├─ CMakeTmp
│  │  │  │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │  ├─ TargetDirectories.txt
│  │  │  │  │     │  │  ├─ VerifyGlobs.cmake
│  │  │  │  │     │  │  └─ _CMakeLTOTest-CXX
│  │  │  │  │     │  │     ├─ bin
│  │  │  │  │     │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  │     │  ├─ .ninja_log
│  │  │  │  │     │  │     │  ├─ build.ninja
│  │  │  │  │     │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │     │  │  ├─ boo.dir
│  │  │  │  │     │  │     │  │  │  └─ main.cpp.o
│  │  │  │  │     │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │     │  │  ├─ foo.dir
│  │  │  │  │     │  │     │  │  │  └─ foo.cpp.o
│  │  │  │  │     │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │     │  │  └─ TargetDirectories.txt
│  │  │  │  │     │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  │     │  └─ libfoo.a
│  │  │  │  │     │  │     └─ src
│  │  │  │  │     │  │        ├─ CMakeLists.txt
│  │  │  │  │     │  │        ├─ foo.cpp
│  │  │  │  │     │  │        └─ main.cpp
│  │  │  │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  ├─ compile_commands.json
│  │  │  │  │     │  ├─ metadata_generation_command.txt
│  │  │  │  │     │  ├─ prefab_config.json
│  │  │  │  │     │  └─ symbol_folder_index.txt
│  │  │  │  │     └─ x86_64
│  │  │  │  │        ├─ .cmake
│  │  │  │  │        │  └─ api
│  │  │  │  │        │     └─ v1
│  │  │  │  │        │        ├─ query
│  │  │  │  │        │        │  └─ client-agp
│  │  │  │  │        │        │     ├─ cache-v2
│  │  │  │  │        │        │     ├─ cmakeFiles-v1
│  │  │  │  │        │        │     └─ codemodel-v2
│  │  │  │  │        │        └─ reply
│  │  │  │  │        │           ├─ cache-v2-6ca16d19e29fa22c3234.json
│  │  │  │  │        │           ├─ cmakeFiles-v1-8519b3c6d09007550090.json
│  │  │  │  │        │           ├─ codemodel-v2-12f97fbafd871cb487b5.json
│  │  │  │  │        │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │        │           ├─ directory-AmbientLightSensor_autolinked_build-Debug-28dc3a9df46d185fc4fd.json
│  │  │  │  │        │           ├─ directory-rnasyncstorage_autolinked_build-Debug-ce80e9411a44e7b5c4e7.json
│  │  │  │  │        │           ├─ directory-rnblurview_autolinked_build-Debug-2608b3bd9ea61b1892c2.json
│  │  │  │  │        │           ├─ directory-RNCNetInfoSpec_autolinked_build-Debug-06bfdf99ca84c18234f3.json
│  │  │  │  │        │           ├─ directory-RNImagePickerSpec_autolinked_build-Debug-95c0cba1ce00e080d0b6.json
│  │  │  │  │        │           ├─ directory-RNLlamaSpec_autolinked_build-Debug-309bb2ab8492df907922.json
│  │  │  │  │        │           ├─ directory-rnscreens_autolinked_build-Debug-6778232716d1a2c5d1e8.json
│  │  │  │  │        │           ├─ directory-RNVectorIconsSpec_autolinked_build-Debug-d192acf50a1f6d61d9b2.json
│  │  │  │  │        │           ├─ directory-safeareacontext_autolinked_build-Debug-ee4679645502e7ade171.json
│  │  │  │  │        │           ├─ directory-VoskSpec_autolinked_build-Debug-33c2cba4e531b28ee8f8.json
│  │  │  │  │        │           ├─ index-2026-04-08T06-36-56-0067.json
│  │  │  │  │        │           ├─ target-appmodules-Debug-6242e7fc38a824b87ff0.json
│  │  │  │  │        │           ├─ target-react_codegen_AmbientLightSensor-Debug-7c374f188934e4e028dc.json
│  │  │  │  │        │           ├─ target-react_codegen_rnasyncstorage-Debug-9cdbb0bf2221d76a6de9.json
│  │  │  │  │        │           ├─ target-react_codegen_rnblurview-Debug-b8c24e25d3f3003496b4.json
│  │  │  │  │        │           ├─ target-react_codegen_RNCNetInfoSpec-Debug-20fe76a06629601d3986.json
│  │  │  │  │        │           ├─ target-react_codegen_RNImagePickerSpec-Debug-a9f71434d8c04861285a.json
│  │  │  │  │        │           ├─ target-react_codegen_RNLlamaSpec-Debug-548b9280bc2acc9e9cb6.json
│  │  │  │  │        │           ├─ target-react_codegen_rnscreens-Debug-2f6cb08df84eb4306c8f.json
│  │  │  │  │        │           ├─ target-react_codegen_RNVectorIconsSpec-Debug-2cd6afb95da8d1e50430.json
│  │  │  │  │        │           ├─ target-react_codegen_safeareacontext-Debug-7850efaf742f4d438caf.json
│  │  │  │  │        │           └─ target-react_codegen_VoskSpec-Debug-d1375d27ac45f43fcc74.json
│  │  │  │  │        ├─ .ninja_deps
│  │  │  │  │        ├─ .ninja_log
│  │  │  │  │        ├─ additional_project_files.txt
│  │  │  │  │        ├─ android_gradle_build.json
│  │  │  │  │        ├─ android_gradle_build_mini.json
│  │  │  │  │        ├─ build.ninja
│  │  │  │  │        ├─ build_file_index.txt
│  │  │  │  │        ├─ CMakeCache.txt
│  │  │  │  │        ├─ CMakeFiles
│  │  │  │  │        │  ├─ 3.22.1-g37088a8-dirty
│  │  │  │  │        │  │  ├─ CMakeCCompiler.cmake
│  │  │  │  │        │  │  ├─ CMakeCXXCompiler.cmake
│  │  │  │  │        │  │  ├─ CMakeSystem.cmake
│  │  │  │  │        │  │  ├─ CompilerIdC
│  │  │  │  │        │  │  │  ├─ CMakeCCompilerId.c
│  │  │  │  │        │  │  │  ├─ CMakeCCompilerId.o
│  │  │  │  │        │  │  │  └─ tmp
│  │  │  │  │        │  │  └─ CompilerIdCXX
│  │  │  │  │        │  │     ├─ CMakeCXXCompilerId.cpp
│  │  │  │  │        │  │     ├─ CMakeCXXCompilerId.o
│  │  │  │  │        │  │     └─ tmp
│  │  │  │  │        │  ├─ appmodules.dir
│  │  │  │  │        │  │  └─ D_
│  │  │  │  │        │  │     └─ Homework
│  │  │  │  │        │  │        └─ FoodMate-AI
│  │  │  │  │        │  │           └─ frontend
│  │  │  │  │        │  │              └─ android
│  │  │  │  │        │  │                 └─ app
│  │  │  │  │        │  ├─ cmake.check_cache
│  │  │  │  │        │  ├─ cmake.verify_globs
│  │  │  │  │        │  ├─ CMakeTmp
│  │  │  │  │        │  ├─ rules.ninja
│  │  │  │  │        │  ├─ TargetDirectories.txt
│  │  │  │  │        │  ├─ VerifyGlobs.cmake
│  │  │  │  │        │  └─ _CMakeLTOTest-CXX
│  │  │  │  │        │     ├─ bin
│  │  │  │  │        │     │  ├─ .ninja_deps
│  │  │  │  │        │     │  ├─ .ninja_log
│  │  │  │  │        │     │  ├─ build.ninja
│  │  │  │  │        │     │  ├─ CMakeCache.txt
│  │  │  │  │        │     │  ├─ CMakeFiles
│  │  │  │  │        │     │  │  ├─ boo.dir
│  │  │  │  │        │     │  │  │  └─ main.cpp.o
│  │  │  │  │        │     │  │  ├─ cmake.check_cache
│  │  │  │  │        │     │  │  ├─ foo.dir
│  │  │  │  │        │     │  │  │  └─ foo.cpp.o
│  │  │  │  │        │     │  │  ├─ rules.ninja
│  │  │  │  │        │     │  │  └─ TargetDirectories.txt
│  │  │  │  │        │     │  ├─ cmake_install.cmake
│  │  │  │  │        │     │  └─ libfoo.a
│  │  │  │  │        │     └─ src
│  │  │  │  │        │        ├─ CMakeLists.txt
│  │  │  │  │        │        ├─ foo.cpp
│  │  │  │  │        │        └─ main.cpp
│  │  │  │  │        ├─ cmake_install.cmake
│  │  │  │  │        ├─ compile_commands.json
│  │  │  │  │        ├─ metadata_generation_command.txt
│  │  │  │  │        ├─ prefab_config.json
│  │  │  │  │        └─ symbol_folder_index.txt
│  │  │  │  ├─ RelWithDebInfo
│  │  │  │  │  └─ 273w544p
│  │  │  │  │     ├─ arm64-v8a
│  │  │  │  │     │  ├─ .cmake
│  │  │  │  │     │  │  └─ api
│  │  │  │  │     │  │     └─ v1
│  │  │  │  │     │  │        ├─ query
│  │  │  │  │     │  │        │  └─ client-agp
│  │  │  │  │     │  │        │     ├─ cache-v2
│  │  │  │  │     │  │        │     ├─ cmakeFiles-v1
│  │  │  │  │     │  │        │     └─ codemodel-v2
│  │  │  │  │     │  │        └─ reply
│  │  │  │  │     │  │           ├─ cache-v2-9e81aa391b7eec5031d3.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-66a84832b2954ecf2f7b.json
│  │  │  │  │     │  │           ├─ codemodel-v2-cb641768b9407e4fb480.json
│  │  │  │  │     │  │           ├─ directory-.-RelWithDebInfo-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-AmbientLightSensor_autolinked_build-RelWithDebInfo-28dc3a9df46d185fc4fd.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-RelWithDebInfo-ce80e9411a44e7b5c4e7.json
│  │  │  │  │     │  │           ├─ directory-rnblurview_autolinked_build-RelWithDebInfo-2608b3bd9ea61b1892c2.json
│  │  │  │  │     │  │           ├─ directory-RNCNetInfoSpec_autolinked_build-RelWithDebInfo-06bfdf99ca84c18234f3.json
│  │  │  │  │     │  │           ├─ directory-RNImagePickerSpec_autolinked_build-RelWithDebInfo-95c0cba1ce00e080d0b6.json
│  │  │  │  │     │  │           ├─ directory-RNLlamaSpec_autolinked_build-RelWithDebInfo-309bb2ab8492df907922.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-RelWithDebInfo-6778232716d1a2c5d1e8.json
│  │  │  │  │     │  │           ├─ directory-RNVectorIconsSpec_autolinked_build-RelWithDebInfo-d192acf50a1f6d61d9b2.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-RelWithDebInfo-ee4679645502e7ade171.json
│  │  │  │  │     │  │           ├─ directory-VoskSpec_autolinked_build-RelWithDebInfo-33c2cba4e531b28ee8f8.json
│  │  │  │  │     │  │           ├─ index-2026-04-08T06-38-52-0481.json
│  │  │  │  │     │  │           ├─ target-appmodules-RelWithDebInfo-197577a7c729855d8ba9.json
│  │  │  │  │     │  │           ├─ target-react_codegen_AmbientLightSensor-RelWithDebInfo-8f11fc89450eaac7aaa9.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-RelWithDebInfo-b648e0b1aa0e6be6a48a.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnblurview-RelWithDebInfo-169b6b0f541c5e595d2d.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNCNetInfoSpec-RelWithDebInfo-be119bfbddebe919adb3.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNImagePickerSpec-RelWithDebInfo-8dd0d09d0487936e3695.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNLlamaSpec-RelWithDebInfo-a070569d68b3660e2743.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-RelWithDebInfo-0f54b8b2ea241a0c06bc.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNVectorIconsSpec-RelWithDebInfo-131ed1f8f53d676a8a7c.json
│  │  │  │  │     │  │           ├─ target-react_codegen_safeareacontext-RelWithDebInfo-8fd3e0bda12ea9c1769b.json
│  │  │  │  │     │  │           └─ target-react_codegen_VoskSpec-RelWithDebInfo-598860c2a6fa292ff66e.json
│  │  │  │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  ├─ .ninja_log
│  │  │  │  │     │  ├─ additional_project_files.txt
│  │  │  │  │     │  ├─ android_gradle_build.json
│  │  │  │  │     │  ├─ android_gradle_build_mini.json
│  │  │  │  │     │  ├─ build.ninja
│  │  │  │  │     │  ├─ build_file_index.txt
│  │  │  │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │  ├─ 3.22.1-g37088a8-dirty
│  │  │  │  │     │  │  │  ├─ CMakeCCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeCXXCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeSystem.cmake
│  │  │  │  │     │  │  │  ├─ CompilerIdC
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.c
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.o
│  │  │  │  │     │  │  │  │  └─ tmp
│  │  │  │  │     │  │  │  └─ CompilerIdCXX
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.cpp
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.o
│  │  │  │  │     │  │  │     └─ tmp
│  │  │  │  │     │  │  ├─ appmodules.dir
│  │  │  │  │     │  │  │  ├─ D_
│  │  │  │  │     │  │  │  │  └─ Homework
│  │  │  │  │     │  │  │  │     └─ FoodMate-AI
│  │  │  │  │     │  │  │  │        └─ frontend
│  │  │  │  │     │  │  │  │           └─ android
│  │  │  │  │     │  │  │  │              └─ app
│  │  │  │  │     │  │  │  └─ OnLoad.cpp.o
│  │  │  │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │  ├─ cmake.verify_globs
│  │  │  │  │     │  │  ├─ CMakeTmp
│  │  │  │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │  ├─ TargetDirectories.txt
│  │  │  │  │     │  │  ├─ VerifyGlobs.cmake
│  │  │  │  │     │  │  └─ _CMakeLTOTest-CXX
│  │  │  │  │     │  │     ├─ bin
│  │  │  │  │     │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  │     │  ├─ .ninja_log
│  │  │  │  │     │  │     │  ├─ build.ninja
│  │  │  │  │     │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │     │  │  ├─ boo.dir
│  │  │  │  │     │  │     │  │  │  └─ main.cpp.o
│  │  │  │  │     │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │     │  │  ├─ foo.dir
│  │  │  │  │     │  │     │  │  │  └─ foo.cpp.o
│  │  │  │  │     │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │     │  │  └─ TargetDirectories.txt
│  │  │  │  │     │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  │     │  └─ libfoo.a
│  │  │  │  │     │  │     └─ src
│  │  │  │  │     │  │        ├─ CMakeLists.txt
│  │  │  │  │     │  │        ├─ foo.cpp
│  │  │  │  │     │  │        └─ main.cpp
│  │  │  │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  ├─ compile_commands.json
│  │  │  │  │     │  ├─ metadata_generation_command.txt
│  │  │  │  │     │  ├─ prefab_config.json
│  │  │  │  │     │  └─ symbol_folder_index.txt
│  │  │  │  │     ├─ armeabi-v7a
│  │  │  │  │     │  ├─ .cmake
│  │  │  │  │     │  │  └─ api
│  │  │  │  │     │  │     └─ v1
│  │  │  │  │     │  │        ├─ query
│  │  │  │  │     │  │        │  └─ client-agp
│  │  │  │  │     │  │        │     ├─ cache-v2
│  │  │  │  │     │  │        │     ├─ cmakeFiles-v1
│  │  │  │  │     │  │        │     └─ codemodel-v2
│  │  │  │  │     │  │        └─ reply
│  │  │  │  │     │  │           ├─ cache-v2-30fe6aa193480a265d77.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-c2a57b6589d64b891be7.json
│  │  │  │  │     │  │           ├─ codemodel-v2-044ca28d085f17fa1f06.json
│  │  │  │  │     │  │           ├─ directory-.-RelWithDebInfo-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-AmbientLightSensor_autolinked_build-RelWithDebInfo-28dc3a9df46d185fc4fd.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-RelWithDebInfo-ce80e9411a44e7b5c4e7.json
│  │  │  │  │     │  │           ├─ directory-rnblurview_autolinked_build-RelWithDebInfo-2608b3bd9ea61b1892c2.json
│  │  │  │  │     │  │           ├─ directory-RNCNetInfoSpec_autolinked_build-RelWithDebInfo-06bfdf99ca84c18234f3.json
│  │  │  │  │     │  │           ├─ directory-RNImagePickerSpec_autolinked_build-RelWithDebInfo-95c0cba1ce00e080d0b6.json
│  │  │  │  │     │  │           ├─ directory-RNLlamaSpec_autolinked_build-RelWithDebInfo-309bb2ab8492df907922.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-RelWithDebInfo-6778232716d1a2c5d1e8.json
│  │  │  │  │     │  │           ├─ directory-RNVectorIconsSpec_autolinked_build-RelWithDebInfo-d192acf50a1f6d61d9b2.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-RelWithDebInfo-ee4679645502e7ade171.json
│  │  │  │  │     │  │           ├─ directory-VoskSpec_autolinked_build-RelWithDebInfo-33c2cba4e531b28ee8f8.json
│  │  │  │  │     │  │           ├─ index-2026-04-08T06-39-13-0483.json
│  │  │  │  │     │  │           ├─ target-appmodules-RelWithDebInfo-67eb7c72dbd243691a76.json
│  │  │  │  │     │  │           ├─ target-react_codegen_AmbientLightSensor-RelWithDebInfo-e201a1575eb5662dcb09.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-RelWithDebInfo-d47a0b2a82e49b138ee2.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnblurview-RelWithDebInfo-6dc9d0105d2539be3d2e.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNCNetInfoSpec-RelWithDebInfo-2f8b4640b237fa4ecec5.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNImagePickerSpec-RelWithDebInfo-5b4f3ecd7da0a1ba8d8d.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNLlamaSpec-RelWithDebInfo-b032c2d75ec497261498.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-RelWithDebInfo-bb7faf7bfd991c34f0af.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNVectorIconsSpec-RelWithDebInfo-50b50c935f766db8c325.json
│  │  │  │  │     │  │           ├─ target-react_codegen_safeareacontext-RelWithDebInfo-988f4b35c32b2ce89fd2.json
│  │  │  │  │     │  │           └─ target-react_codegen_VoskSpec-RelWithDebInfo-e0c4bac120132cc4957f.json
│  │  │  │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  ├─ .ninja_log
│  │  │  │  │     │  ├─ additional_project_files.txt
│  │  │  │  │     │  ├─ android_gradle_build.json
│  │  │  │  │     │  ├─ android_gradle_build_mini.json
│  │  │  │  │     │  ├─ build.ninja
│  │  │  │  │     │  ├─ build_file_index.txt
│  │  │  │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │  ├─ 3.22.1-g37088a8-dirty
│  │  │  │  │     │  │  │  ├─ CMakeCCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeCXXCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeSystem.cmake
│  │  │  │  │     │  │  │  ├─ CompilerIdC
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.c
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.o
│  │  │  │  │     │  │  │  │  └─ tmp
│  │  │  │  │     │  │  │  └─ CompilerIdCXX
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.cpp
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.o
│  │  │  │  │     │  │  │     └─ tmp
│  │  │  │  │     │  │  ├─ appmodules.dir
│  │  │  │  │     │  │  │  ├─ D_
│  │  │  │  │     │  │  │  │  └─ Homework
│  │  │  │  │     │  │  │  │     └─ FoodMate-AI
│  │  │  │  │     │  │  │  │        └─ frontend
│  │  │  │  │     │  │  │  │           └─ android
│  │  │  │  │     │  │  │  │              └─ app
│  │  │  │  │     │  │  │  └─ OnLoad.cpp.o
│  │  │  │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │  ├─ cmake.verify_globs
│  │  │  │  │     │  │  ├─ CMakeTmp
│  │  │  │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │  ├─ TargetDirectories.txt
│  │  │  │  │     │  │  ├─ VerifyGlobs.cmake
│  │  │  │  │     │  │  └─ _CMakeLTOTest-CXX
│  │  │  │  │     │  │     ├─ bin
│  │  │  │  │     │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  │     │  ├─ .ninja_log
│  │  │  │  │     │  │     │  ├─ build.ninja
│  │  │  │  │     │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │     │  │  ├─ boo.dir
│  │  │  │  │     │  │     │  │  │  └─ main.cpp.o
│  │  │  │  │     │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │     │  │  ├─ foo.dir
│  │  │  │  │     │  │     │  │  │  └─ foo.cpp.o
│  │  │  │  │     │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │     │  │  └─ TargetDirectories.txt
│  │  │  │  │     │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  │     │  └─ libfoo.a
│  │  │  │  │     │  │     └─ src
│  │  │  │  │     │  │        ├─ CMakeLists.txt
│  │  │  │  │     │  │        ├─ foo.cpp
│  │  │  │  │     │  │        └─ main.cpp
│  │  │  │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  ├─ compile_commands.json
│  │  │  │  │     │  ├─ metadata_generation_command.txt
│  │  │  │  │     │  ├─ prefab_config.json
│  │  │  │  │     │  └─ symbol_folder_index.txt
│  │  │  │  │     ├─ hash_key.txt
│  │  │  │  │     ├─ prefab
│  │  │  │  │     │  ├─ arm64-v8a
│  │  │  │  │     │  │  └─ prefab
│  │  │  │  │     │  │     └─ lib
│  │  │  │  │     │  │        └─ aarch64-linux-android
│  │  │  │  │     │  │           └─ cmake
│  │  │  │  │     │  │              ├─ fbjni
│  │  │  │  │     │  │              │  ├─ fbjniConfig.cmake
│  │  │  │  │     │  │              │  └─ fbjniConfigVersion.cmake
│  │  │  │  │     │  │              ├─ hermes-engine
│  │  │  │  │     │  │              │  ├─ hermes-engineConfig.cmake
│  │  │  │  │     │  │              │  └─ hermes-engineConfigVersion.cmake
│  │  │  │  │     │  │              └─ ReactAndroid
│  │  │  │  │     │  │                 ├─ ReactAndroidConfig.cmake
│  │  │  │  │     │  │                 └─ ReactAndroidConfigVersion.cmake
│  │  │  │  │     │  ├─ armeabi-v7a
│  │  │  │  │     │  │  └─ prefab
│  │  │  │  │     │  │     └─ lib
│  │  │  │  │     │  │        └─ arm-linux-androideabi
│  │  │  │  │     │  │           └─ cmake
│  │  │  │  │     │  │              ├─ fbjni
│  │  │  │  │     │  │              │  ├─ fbjniConfig.cmake
│  │  │  │  │     │  │              │  └─ fbjniConfigVersion.cmake
│  │  │  │  │     │  │              ├─ hermes-engine
│  │  │  │  │     │  │              │  ├─ hermes-engineConfig.cmake
│  │  │  │  │     │  │              │  └─ hermes-engineConfigVersion.cmake
│  │  │  │  │     │  │              └─ ReactAndroid
│  │  │  │  │     │  │                 ├─ ReactAndroidConfig.cmake
│  │  │  │  │     │  │                 └─ ReactAndroidConfigVersion.cmake
│  │  │  │  │     │  ├─ x86
│  │  │  │  │     │  │  └─ prefab
│  │  │  │  │     │  │     └─ lib
│  │  │  │  │     │  │        └─ i686-linux-android
│  │  │  │  │     │  │           └─ cmake
│  │  │  │  │     │  │              ├─ fbjni
│  │  │  │  │     │  │              │  ├─ fbjniConfig.cmake
│  │  │  │  │     │  │              │  └─ fbjniConfigVersion.cmake
│  │  │  │  │     │  │              ├─ hermes-engine
│  │  │  │  │     │  │              │  ├─ hermes-engineConfig.cmake
│  │  │  │  │     │  │              │  └─ hermes-engineConfigVersion.cmake
│  │  │  │  │     │  │              └─ ReactAndroid
│  │  │  │  │     │  │                 ├─ ReactAndroidConfig.cmake
│  │  │  │  │     │  │                 └─ ReactAndroidConfigVersion.cmake
│  │  │  │  │     │  └─ x86_64
│  │  │  │  │     │     └─ prefab
│  │  │  │  │     │        └─ lib
│  │  │  │  │     │           └─ x86_64-linux-android
│  │  │  │  │     │              └─ cmake
│  │  │  │  │     │                 ├─ fbjni
│  │  │  │  │     │                 │  ├─ fbjniConfig.cmake
│  │  │  │  │     │                 │  └─ fbjniConfigVersion.cmake
│  │  │  │  │     │                 ├─ hermes-engine
│  │  │  │  │     │                 │  ├─ hermes-engineConfig.cmake
│  │  │  │  │     │                 │  └─ hermes-engineConfigVersion.cmake
│  │  │  │  │     │                 └─ ReactAndroid
│  │  │  │  │     │                    ├─ ReactAndroidConfig.cmake
│  │  │  │  │     │                    └─ ReactAndroidConfigVersion.cmake
│  │  │  │  │     ├─ x86
│  │  │  │  │     │  ├─ .cmake
│  │  │  │  │     │  │  └─ api
│  │  │  │  │     │  │     └─ v1
│  │  │  │  │     │  │        ├─ query
│  │  │  │  │     │  │        │  └─ client-agp
│  │  │  │  │     │  │        │     ├─ cache-v2
│  │  │  │  │     │  │        │     ├─ cmakeFiles-v1
│  │  │  │  │     │  │        │     └─ codemodel-v2
│  │  │  │  │     │  │        └─ reply
│  │  │  │  │     │  │           ├─ cache-v2-f26d205ce9f633de95fa.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-bf7cc7aea0de9c7641b1.json
│  │  │  │  │     │  │           ├─ codemodel-v2-1b15f3731dc6fa6e2c02.json
│  │  │  │  │     │  │           ├─ directory-.-RelWithDebInfo-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-AmbientLightSensor_autolinked_build-RelWithDebInfo-28dc3a9df46d185fc4fd.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-RelWithDebInfo-ce80e9411a44e7b5c4e7.json
│  │  │  │  │     │  │           ├─ directory-rnblurview_autolinked_build-RelWithDebInfo-2608b3bd9ea61b1892c2.json
│  │  │  │  │     │  │           ├─ directory-RNCNetInfoSpec_autolinked_build-RelWithDebInfo-06bfdf99ca84c18234f3.json
│  │  │  │  │     │  │           ├─ directory-RNImagePickerSpec_autolinked_build-RelWithDebInfo-95c0cba1ce00e080d0b6.json
│  │  │  │  │     │  │           ├─ directory-RNLlamaSpec_autolinked_build-RelWithDebInfo-309bb2ab8492df907922.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-RelWithDebInfo-6778232716d1a2c5d1e8.json
│  │  │  │  │     │  │           ├─ directory-RNVectorIconsSpec_autolinked_build-RelWithDebInfo-d192acf50a1f6d61d9b2.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-RelWithDebInfo-ee4679645502e7ade171.json
│  │  │  │  │     │  │           ├─ directory-VoskSpec_autolinked_build-RelWithDebInfo-33c2cba4e531b28ee8f8.json
│  │  │  │  │     │  │           ├─ index-2026-04-08T06-39-30-0774.json
│  │  │  │  │     │  │           ├─ target-appmodules-RelWithDebInfo-406c3e56ff44ecd950f1.json
│  │  │  │  │     │  │           ├─ target-react_codegen_AmbientLightSensor-RelWithDebInfo-8f11fc89450eaac7aaa9.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-RelWithDebInfo-b648e0b1aa0e6be6a48a.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnblurview-RelWithDebInfo-169b6b0f541c5e595d2d.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNCNetInfoSpec-RelWithDebInfo-be119bfbddebe919adb3.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNImagePickerSpec-RelWithDebInfo-8dd0d09d0487936e3695.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNLlamaSpec-RelWithDebInfo-a070569d68b3660e2743.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-RelWithDebInfo-90f36f50e1a4b950e354.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNVectorIconsSpec-RelWithDebInfo-131ed1f8f53d676a8a7c.json
│  │  │  │  │     │  │           ├─ target-react_codegen_safeareacontext-RelWithDebInfo-bf6a773a9ef4b828501a.json
│  │  │  │  │     │  │           └─ target-react_codegen_VoskSpec-RelWithDebInfo-598860c2a6fa292ff66e.json
│  │  │  │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  ├─ .ninja_log
│  │  │  │  │     │  ├─ additional_project_files.txt
│  │  │  │  │     │  ├─ android_gradle_build.json
│  │  │  │  │     │  ├─ android_gradle_build_mini.json
│  │  │  │  │     │  ├─ build.ninja
│  │  │  │  │     │  ├─ build_file_index.txt
│  │  │  │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │  ├─ 3.22.1-g37088a8-dirty
│  │  │  │  │     │  │  │  ├─ CMakeCCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeCXXCompiler.cmake
│  │  │  │  │     │  │  │  ├─ CMakeSystem.cmake
│  │  │  │  │     │  │  │  ├─ CompilerIdC
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.c
│  │  │  │  │     │  │  │  │  ├─ CMakeCCompilerId.o
│  │  │  │  │     │  │  │  │  └─ tmp
│  │  │  │  │     │  │  │  └─ CompilerIdCXX
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.cpp
│  │  │  │  │     │  │  │     ├─ CMakeCXXCompilerId.o
│  │  │  │  │     │  │  │     └─ tmp
│  │  │  │  │     │  │  ├─ appmodules.dir
│  │  │  │  │     │  │  │  ├─ D_
│  │  │  │  │     │  │  │  │  └─ Homework
│  │  │  │  │     │  │  │  │     └─ FoodMate-AI
│  │  │  │  │     │  │  │  │        └─ frontend
│  │  │  │  │     │  │  │  │           └─ android
│  │  │  │  │     │  │  │  │              └─ app
│  │  │  │  │     │  │  │  └─ OnLoad.cpp.o
│  │  │  │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │  ├─ cmake.verify_globs
│  │  │  │  │     │  │  ├─ CMakeTmp
│  │  │  │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │  ├─ TargetDirectories.txt
│  │  │  │  │     │  │  ├─ VerifyGlobs.cmake
│  │  │  │  │     │  │  └─ _CMakeLTOTest-CXX
│  │  │  │  │     │  │     ├─ bin
│  │  │  │  │     │  │     │  ├─ .ninja_deps
│  │  │  │  │     │  │     │  ├─ .ninja_log
│  │  │  │  │     │  │     │  ├─ build.ninja
│  │  │  │  │     │  │     │  ├─ CMakeCache.txt
│  │  │  │  │     │  │     │  ├─ CMakeFiles
│  │  │  │  │     │  │     │  │  ├─ boo.dir
│  │  │  │  │     │  │     │  │  │  └─ main.cpp.o
│  │  │  │  │     │  │     │  │  ├─ cmake.check_cache
│  │  │  │  │     │  │     │  │  ├─ foo.dir
│  │  │  │  │     │  │     │  │  │  └─ foo.cpp.o
│  │  │  │  │     │  │     │  │  ├─ rules.ninja
│  │  │  │  │     │  │     │  │  └─ TargetDirectories.txt
│  │  │  │  │     │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  │     │  └─ libfoo.a
│  │  │  │  │     │  │     └─ src
│  │  │  │  │     │  │        ├─ CMakeLists.txt
│  │  │  │  │     │  │        ├─ foo.cpp
│  │  │  │  │     │  │        └─ main.cpp
│  │  │  │  │     │  ├─ cmake_install.cmake
│  │  │  │  │     │  ├─ compile_commands.json
│  │  │  │  │     │  ├─ metadata_generation_command.txt
│  │  │  │  │     │  ├─ prefab_config.json
│  │  │  │  │     │  └─ symbol_folder_index.txt
│  │  │  │  │     └─ x86_64
│  │  │  │  │        ├─ .cmake
│  │  │  │  │        │  └─ api
│  │  │  │  │        │     └─ v1
│  │  │  │  │        │        ├─ query
│  │  │  │  │        │        │  └─ client-agp
│  │  │  │  │        │        │     ├─ cache-v2
│  │  │  │  │        │        │     ├─ cmakeFiles-v1
│  │  │  │  │        │        │     └─ codemodel-v2
│  │  │  │  │        │        └─ reply
│  │  │  │  │        │           ├─ cache-v2-21b6cc6d1f2eebdf69a8.json
│  │  │  │  │        │           ├─ cmakeFiles-v1-83e1721dd7b76c8d0a81.json
│  │  │  │  │        │           ├─ codemodel-v2-cca426b44a375bb40365.json
│  │  │  │  │        │           ├─ directory-.-RelWithDebInfo-d0094a50bb2071803777.json
│  │  │  │  │        │           ├─ directory-AmbientLightSensor_autolinked_build-RelWithDebInfo-28dc3a9df46d185fc4fd.json
│  │  │  │  │        │           ├─ directory-rnasyncstorage_autolinked_build-RelWithDebInfo-ce80e9411a44e7b5c4e7.json
│  │  │  │  │        │           ├─ directory-rnblurview_autolinked_build-RelWithDebInfo-2608b3bd9ea61b1892c2.json
│  │  │  │  │        │           ├─ directory-RNCNetInfoSpec_autolinked_build-RelWithDebInfo-06bfdf99ca84c18234f3.json
│  │  │  │  │        │           ├─ directory-RNImagePickerSpec_autolinked_build-RelWithDebInfo-95c0cba1ce00e080d0b6.json
│  │  │  │  │        │           ├─ directory-RNLlamaSpec_autolinked_build-RelWithDebInfo-309bb2ab8492df907922.json
│  │  │  │  │        │           ├─ directory-rnscreens_autolinked_build-RelWithDebInfo-6778232716d1a2c5d1e8.json
│  │  │  │  │        │           ├─ directory-RNVectorIconsSpec_autolinked_build-RelWithDebInfo-d192acf50a1f6d61d9b2.json
│  │  │  │  │        │           ├─ directory-safeareacontext_autolinked_build-RelWithDebInfo-ee4679645502e7ade171.json
│  │  │  │  │        │           ├─ directory-VoskSpec_autolinked_build-RelWithDebInfo-33c2cba4e531b28ee8f8.json
│  │  │  │  │        │           ├─ index-2026-04-08T06-39-47-0235.json
│  │  │  │  │        │           ├─ target-appmodules-RelWithDebInfo-fb288952dfcf1ccde638.json
│  │  │  │  │        │           ├─ target-react_codegen_AmbientLightSensor-RelWithDebInfo-8f11fc89450eaac7aaa9.json
│  │  │  │  │        │           ├─ target-react_codegen_rnasyncstorage-RelWithDebInfo-b648e0b1aa0e6be6a48a.json
│  │  │  │  │        │           ├─ target-react_codegen_rnblurview-RelWithDebInfo-169b6b0f541c5e595d2d.json
│  │  │  │  │        │           ├─ target-react_codegen_RNCNetInfoSpec-RelWithDebInfo-be119bfbddebe919adb3.json
│  │  │  │  │        │           ├─ target-react_codegen_RNImagePickerSpec-RelWithDebInfo-8dd0d09d0487936e3695.json
│  │  │  │  │        │           ├─ target-react_codegen_RNLlamaSpec-RelWithDebInfo-a070569d68b3660e2743.json
│  │  │  │  │        │           ├─ target-react_codegen_rnscreens-RelWithDebInfo-73e0f9d35acfdde89914.json
│  │  │  │  │        │           ├─ target-react_codegen_RNVectorIconsSpec-RelWithDebInfo-131ed1f8f53d676a8a7c.json
│  │  │  │  │        │           ├─ target-react_codegen_safeareacontext-RelWithDebInfo-69510a7c5468a4cea82f.json
│  │  │  │  │        │           └─ target-react_codegen_VoskSpec-RelWithDebInfo-598860c2a6fa292ff66e.json
│  │  │  │  │        ├─ .ninja_deps
│  │  │  │  │        ├─ .ninja_log
│  │  │  │  │        ├─ additional_project_files.txt
│  │  │  │  │        ├─ android_gradle_build.json
│  │  │  │  │        ├─ android_gradle_build_mini.json
│  │  │  │  │        ├─ build.ninja
│  │  │  │  │        ├─ build_file_index.txt
│  │  │  │  │        ├─ CMakeCache.txt
│  │  │  │  │        ├─ CMakeFiles
│  │  │  │  │        │  ├─ 3.22.1-g37088a8-dirty
│  │  │  │  │        │  │  ├─ CMakeCCompiler.cmake
│  │  │  │  │        │  │  ├─ CMakeCXXCompiler.cmake
│  │  │  │  │        │  │  ├─ CMakeSystem.cmake
│  │  │  │  │        │  │  ├─ CompilerIdC
│  │  │  │  │        │  │  │  ├─ CMakeCCompilerId.c
│  │  │  │  │        │  │  │  ├─ CMakeCCompilerId.o
│  │  │  │  │        │  │  │  └─ tmp
│  │  │  │  │        │  │  └─ CompilerIdCXX
│  │  │  │  │        │  │     ├─ CMakeCXXCompilerId.cpp
│  │  │  │  │        │  │     ├─ CMakeCXXCompilerId.o
│  │  │  │  │        │  │     └─ tmp
│  │  │  │  │        │  ├─ appmodules.dir
│  │  │  │  │        │  │  ├─ D_
│  │  │  │  │        │  │  │  └─ Homework
│  │  │  │  │        │  │  │     └─ FoodMate-AI
│  │  │  │  │        │  │  │        └─ frontend
│  │  │  │  │        │  │  │           └─ android
│  │  │  │  │        │  │  │              └─ app
│  │  │  │  │        │  │  └─ OnLoad.cpp.o
│  │  │  │  │        │  ├─ cmake.check_cache
│  │  │  │  │        │  ├─ cmake.verify_globs
│  │  │  │  │        │  ├─ CMakeTmp
│  │  │  │  │        │  ├─ rules.ninja
│  │  │  │  │        │  ├─ TargetDirectories.txt
│  │  │  │  │        │  ├─ VerifyGlobs.cmake
│  │  │  │  │        │  └─ _CMakeLTOTest-CXX
│  │  │  │  │        │     ├─ bin
│  │  │  │  │        │     │  ├─ .ninja_deps
│  │  │  │  │        │     │  ├─ .ninja_log
│  │  │  │  │        │     │  ├─ build.ninja
│  │  │  │  │        │     │  ├─ CMakeCache.txt
│  │  │  │  │        │     │  ├─ CMakeFiles
│  │  │  │  │        │     │  │  ├─ boo.dir
│  │  │  │  │        │     │  │  │  └─ main.cpp.o
│  │  │  │  │        │     │  │  ├─ cmake.check_cache
│  │  │  │  │        │     │  │  ├─ foo.dir
│  │  │  │  │        │     │  │  │  └─ foo.cpp.o
│  │  │  │  │        │     │  │  ├─ rules.ninja
│  │  │  │  │        │     │  │  └─ TargetDirectories.txt
│  │  │  │  │        │     │  ├─ cmake_install.cmake
│  │  │  │  │        │     │  └─ libfoo.a
│  │  │  │  │        │     └─ src
│  │  │  │  │        │        ├─ CMakeLists.txt
│  │  │  │  │        │        ├─ foo.cpp
│  │  │  │  │        │        └─ main.cpp
│  │  │  │  │        ├─ cmake_install.cmake
│  │  │  │  │        ├─ compile_commands.json
│  │  │  │  │        ├─ metadata_generation_command.txt
│  │  │  │  │        ├─ prefab_config.json
│  │  │  │  │        └─ symbol_folder_index.txt
│  │  │  │  └─ tools
│  │  │  │     ├─ debug
│  │  │  │     │  ├─ arm64-v8a
│  │  │  │     │  │  └─ compile_commands.json
│  │  │  │     │  ├─ armeabi-v7a
│  │  │  │     │  │  └─ compile_commands.json
│  │  │  │     │  ├─ x86
│  │  │  │     │  │  └─ compile_commands.json
│  │  │  │     │  └─ x86_64
│  │  │  │     │     └─ compile_commands.json
│  │  │  │     └─ release
│  │  │  │        ├─ arm64-v8a
│  │  │  │        │  └─ compile_commands.json
│  │  │  │        ├─ armeabi-v7a
│  │  │  │        │  └─ compile_commands.json
│  │  │  │        ├─ x86
│  │  │  │        │  └─ compile_commands.json
│  │  │  │        └─ x86_64
│  │  │  │           └─ compile_commands.json
│  │  │  ├─ build.gradle
│  │  │  ├─ debug.keystore
│  │  │  ├─ libs
│  │  │  │  └─ heytap-health-sdk.aar
│  │  │  ├─ proguard-rules.pro
│  │  │  └─ src
│  │  │     └─ main
│  │  │        ├─ AndroidManifest.xml
│  │  │        ├─ java
│  │  │        │  └─ com
│  │  │        │     └─ ninkynonkpinkyponk
│  │  │        │        └─ foodmateai
│  │  │        │           ├─ health
│  │  │        │           │  ├─ HealthDataTypes.kt
│  │  │        │           │  ├─ HeytapHealthManager.kt
│  │  │        │           │  ├─ HeytapHealthModule.kt
│  │  │        │           │  └─ HeytapHealthPackage.kt
│  │  │        │           ├─ MainActivity.kt
│  │  │        │           └─ MainApplication.kt
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
│  │  ├─ build.gradle
│  │  ├─ frontend
│  │  │  └─ android
│  │  │     └─ app
│  │  │        └─ libs
│  │  │           └─ heytap-health-sdk-2.1.7.aar
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
│  │  │  ├─ ActiveRecommendationModal.tsx
│  │  │  ├─ AdaptiveOverlay.tsx
│  │  │  ├─ CartBar.tsx
│  │  │  ├─ CartItem.tsx
│  │  │  ├─ DevModePanel.tsx
│  │  │  ├─ LocationDisplay.tsx
│  │  │  ├─ MenuListItem.tsx
│  │  │  ├─ merchant
│  │  │  │  ├─ MerchantHeader.tsx
│  │  │  │  └─ MerchantSidebar.tsx
│  │  │  ├─ MerchantLayout.tsx
│  │  │  ├─ NutriVisionLoading.tsx
│  │  │  ├─ OptimizedImage.tsx
│  │  │  ├─ RestaurantCard.tsx
│  │  │  ├─ StatusCapsule.tsx
│  │  │  ├─ VoiceEngineLoading.tsx
│  │  │  └─ WeatherAlertModal.tsx
│  │  ├─ config
│  │  │  ├─ imageDictionary.ts
│  │  │  └─ serviceConfig.js
│  │  ├─ hooks
│  │  │  ├─ useAmbientLight.ts
│  │  │  ├─ useAuth.tsx
│  │  │  ├─ useCoupons.js
│  │  │  ├─ useHealthContext.tsx
│  │  │  ├─ useNetworkStatus.ts
│  │  │  ├─ useOppoHealth.ts
│  │  │  └─ usePedometer.tsx
│  │  ├─ native
│  │  │  └─ HeytapHealthModule.ts
│  │  ├─ screens
│  │  │  ├─ AddressEditScreen.tsx
│  │  │  ├─ AddressListScreen.tsx
│  │  │  ├─ AdminDashboardScreen.tsx
│  │  │  ├─ BrowseHistoryScreen.tsx
│  │  │  ├─ CartScreen.tsx
│  │  │  ├─ FavoritesScreen.tsx
│  │  │  ├─ HealthDataScreen.tsx
│  │  │  ├─ HomeScreen.tsx
│  │  │  ├─ LocationDebugScreen.tsx
│  │  │  ├─ LoginScreen.tsx
│  │  │  ├─ merchant
│  │  │  │  ├─ MenuManagementScreen.tsx
│  │  │  │  ├─ MerchantDashboardScreen.tsx
│  │  │  │  ├─ MerchantOnboardingScreen.tsx
│  │  │  │  ├─ MerchantOrdersScreen.tsx
│  │  │  │  ├─ MerchantShopInfoScreen.tsx
│  │  │  │  ├─ RefundAuditScreen.tsx
│  │  │  │  ├─ ServiceMarketplaceScreen.tsx
│  │  │  │  ├─ SettlementDashboardScreen.tsx
│  │  │  │  └─ SmartPricingScreen.tsx
│  │  │  ├─ NutriVisionResultScreen.tsx
│  │  │  ├─ OrderConfirmScreen.tsx
│  │  │  ├─ OrderListScreen.tsx
│  │  │  ├─ OrderTrackingScreen.tsx
│  │  │  ├─ PaymentSuccessScreen.tsx
│  │  │  ├─ PrivacyPolicyScreen.tsx
│  │  │  ├─ ProfileScreen.tsx
│  │  │  ├─ RestaurantDetailScreen.tsx
│  │  │  ├─ SurveyScreen.tsx
│  │  │  └─ WalletScreen.tsx
│  │  ├─ services
│  │  │  ├─ addressService.js
│  │  │  ├─ aiPricingService.js
│  │  │  ├─ apiClient.js
│  │  │  ├─ apiErrorHandler.js
│  │  │  ├─ authService.js
│  │  │  ├─ edgeSynergyService.ts
│  │  │  ├─ index.js
│  │  │  ├─ locationService.js
│  │  │  ├─ merchantOrderService.js
│  │  │  ├─ merchantService.js
│  │  │  ├─ networkUtils.js
│  │  │  ├─ nutriVisionService.js
│  │  │  ├─ orderService.js
│  │  │  ├─ platformService.js
│  │  │  ├─ profileService.js
│  │  │  ├─ recommendationService.js
│  │  │  ├─ settlementService.js
│  │  │  ├─ userService.js
│  │  │  ├─ VoiceInferenceService.ts
│  │  │  ├─ walletService.js
│  │  │  └─ weatherService.ts
│  │  ├─ theme
│  │  │  └─ NordicTheme.ts
│  │  ├─ types
│  │  │  └─ coupon.ts
│  │  └─ utils
│  │     ├─ cacheUtils.js
│  │     └─ couponUtils.js
│  ├─ tsconfig.json
│  └─ __tests__
│     └─ App.test.tsx
├─ frontend_web
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ server.js
│  ├─ src
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
│  │  │  │  ├─ Marketing.jsx
│  │  │  │  ├─ Merchants.jsx
│  │  │  │  ├─ Orders.jsx
│  │  │  │  ├─ Services.jsx
│  │  │  │  ├─ Settlements.jsx
│  │  │  │  ├─ StatsTestPage.jsx
│  │  │  │  ├─ SystemMonitor.jsx
│  │  │  │  ├─ UserCredit.jsx
│  │  │  │  └─ Users.jsx
│  │  │  ├─ merchant
│  │  │  │  ├─ MenuManagement.jsx
│  │  │  │  ├─ MerchantLayout.jsx
│  │  │  │  ├─ MerchantOnboarding.jsx
│  │  │  │  ├─ MerchantOrders.jsx
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
│  └─ vite.config.js
├─ README.md
└─ tests
   ├─ acceptance
   │  ├─ test_customer_acceptance.py
   │  ├─ test_merchant_acceptance.py
   │  └─ test_system_acceptance.py
   ├─ integration
   │  ├─ database
   │  │  ├─ MongoIntegrationTest.java
   │  │  ├─ PostgresIntegrationTest.java
   │  │  └─ RedisIntegrationTest.java
   │  ├─ service-communication
   │  │  └─ OrderMerchantIntegrationTest.java
   │  ├─ test_mongo_integration.py
   │  ├─ test_postgres_integration.py
   │  ├─ test_rabbitmq_integration.py
   │  ├─ test_redis_integration.py
   │  └─ test_service_communication.py
   ├─ pom.xml
   ├─ result_acceptance.txt
   ├─ result_frontend.txt
   ├─ result_functional.txt
   ├─ result_integration.txt
   ├─ result_java.txt
   ├─ result_performance.txt
   ├─ result_python.txt
   ├─ result_security.txt
   ├─ run_tests.bat
   ├─ run_tests.sh
   ├─ system
   │  ├─ functional
   │  │  ├─ test_order_flow.py
   │  │  └─ test_user_flow.py
   │  ├─ performance
   │  │  ├─ locustfile.py
   │  │  └─ performance_config.yml
   │  └─ security
   │     ├─ test_authentication.py
   │     └─ test_input_validation.py
   ├─ unit
   │  ├─ backend
   │  │  ├─ ai-pricing-service
   │  │  │  └─ test_pricing_api.py
   │  │  ├─ marketing-service
   │  │  │  ├─ CouponCalculationServiceTest.java
   │  │  │  └─ CouponTemplateServiceTest.java
   │  │  ├─ merchant-service
   │  │  │  ├─ MenuServiceTest.java
   │  │  │  └─ MerchantServiceTest.java
   │  │  ├─ nutrivision-service
   │  │  │  └─ test_vision_api.py
   │  │  ├─ order-service
   │  │  │  └─ OrderServiceTest.java
   │  │  ├─ platform-service
   │  │  │  └─ CommissionServiceTest.java
   │  │  ├─ profile-service
   │  │  │  └─ UserProfileServiceTest.java
   │  │  ├─ recommendation-service
   │  │  │  ├─ test_mab_strategy.py
   │  │  │  └─ test_recommendation_api.py
   │  │  └─ user-service
   │  │     ├─ AddressServiceTest.java
   │  │     ├─ AuthServiceTest.java
   │  │     └─ CreditServiceTest.java
   │  └─ frontend
   │     ├─ hooks
   │     │  └─ useAuth.test.js
   │     └─ services
   │        ├─ authService.test.js
   │        ├─ networkUtils.test.js
   │        └─ orderService.test.js
   └─ 测试文档.md

```