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
│  │  ├─ src
│  │  │  └─ main
│  │  │     └─ java
│  │  │        └─ com
│  │  │           └─ fooddelivery
│  │  │              └─ common
│  │  │                 ├─ annotation
│  │  │                 │  └─ ResilientService.java
│  │  │                 ├─ config
│  │  │                 │  ├─ CacheConfig.java
│  │  │                 │  ├─ FeignClientConfig.java
│  │  │                 │  ├─ ResilienceConfig.java
│  │  │                 │  └─ ServiceDiscoveryConfig.java
│  │  │                 ├─ constants
│  │  │                 │  └─ BusinessConstants.java
│  │  │                 ├─ dto
│  │  │                 │  ├─ ApiResponse.java
│  │  │                 │  └─ PageResponse.java
│  │  │                 ├─ enums
│  │  │                 │  ├─ OrderStatus.java
│  │  │                 │  ├─ PaymentMethod.java
│  │  │                 │  ├─ PaymentStatus.java
│  │  │                 │  └─ UserRole.java
│  │  │                 ├─ exception
│  │  │                 │  ├─ BusinessException.java
│  │  │                 │  └─ GlobalExceptionHandler.java
│  │  │                 ├─ filter
│  │  │                 │  └─ JwtAuthenticationFilter.java
│  │  │                 └─ util
│  │  │                    ├─ JwtUtil.java
│  │  │                    ├─ PageUtils.java
│  │  │                    ├─ RedisUtil.java
│  │  │                    └─ SecurityUtils.java
│  │  └─ target
│  │     ├─ classes
│  │     │  └─ com
│  │     │     └─ fooddelivery
│  │     │        └─ common
│  │     │           ├─ annotation
│  │     │           │  └─ ResilientService.class
│  │     │           ├─ config
│  │     │           │  ├─ CacheConfig.class
│  │     │           │  ├─ FeignClientConfig$1.class
│  │     │           │  ├─ FeignClientConfig.class
│  │     │           │  ├─ ResilienceConfig.class
│  │     │           │  └─ ServiceDiscoveryConfig.class
│  │     │           ├─ constants
│  │     │           │  ├─ BusinessConstants$API.class
│  │     │           │  ├─ BusinessConstants$CACHE.class
│  │     │           │  ├─ BusinessConstants$FILE.class
│  │     │           │  ├─ BusinessConstants$JWT.class
│  │     │           │  ├─ BusinessConstants$MARKETING.class
│  │     │           │  ├─ BusinessConstants$ORDER.class
│  │     │           │  ├─ BusinessConstants$PAGINATION.class
│  │     │           │  ├─ BusinessConstants$PAYMENT.class
│  │     │           │  └─ BusinessConstants.class
│  │     │           ├─ dto
│  │     │           │  ├─ ApiResponse.class
│  │     │           │  └─ PageResponse.class
│  │     │           ├─ enums
│  │     │           │  ├─ OrderStatus.class
│  │     │           │  ├─ PaymentMethod.class
│  │     │           │  ├─ PaymentStatus.class
│  │     │           │  └─ UserRole.class
│  │     │           ├─ exception
│  │     │           │  ├─ BusinessException.class
│  │     │           │  └─ GlobalExceptionHandler.class
│  │     │           ├─ filter
│  │     │           │  ├─ JwtAuthenticationFilter$JwtAuthenticationDetails.class
│  │     │           │  └─ JwtAuthenticationFilter.class
│  │     │           └─ util
│  │     │              ├─ JwtUtil.class
│  │     │              ├─ PageUtils.class
│  │     │              ├─ RedisUtil.class
│  │     │              └─ SecurityUtils.class
│  │     ├─ food-platform-common-1.0.0.jar
│  │     ├─ generated-sources
│  │     │  └─ annotations
│  │     ├─ maven-archiver
│  │     │  └─ pom.properties
│  │     └─ maven-status
│  │        └─ maven-compiler-plugin
│  │           └─ compile
│  │              └─ default-compile
│  │                 ├─ createdFiles.lst
│  │                 └─ inputFiles.lst
│  ├─ marketing-service
│  │  ├─ Dockerfile
│  │  ├─ marketing-service.iml
│  │  ├─ pom.xml
│  │  ├─ README.md
│  │  ├─ src
│  │  │  └─ main
│  │  │     ├─ java
│  │  │     │  └─ com
│  │  │     │     └─ fooddelivery
│  │  │     │        └─ marketingservice
│  │  │     │           ├─ config
│  │  │     │           │  ├─ AsyncConfig.java
│  │  │     │           │  ├─ OpenApiConfig.java
│  │  │     │           │  └─ SecurityConfig.java
│  │  │     │           ├─ controller
│  │  │     │           │  ├─ AdminCouponController.java
│  │  │     │           │  ├─ AdminMarketingController.java
│  │  │     │           │  ├─ CouponController.java
│  │  │     │           │  └─ SmartIssuanceController.java.bak
│  │  │     │           ├─ dto
│  │  │     │           │  ├─ AdminIssueBatchRequest.java
│  │  │     │           │  ├─ AdminIssueCouponRequest.java
│  │  │     │           │  ├─ AutoIssuanceRuleDTO.java.bak
│  │  │     │           │  ├─ CalculateBestCouponRequest.java
│  │  │     │           │  ├─ CalculateBestCouponResponse.java
│  │  │     │           │  ├─ CouponStatsDTO.java
│  │  │     │           │  ├─ CouponTemplateDTO.java
│  │  │     │           │  ├─ CouponTypeStatsDTO.java
│  │  │     │           │  ├─ CouponUsageTrendDTO.java
│  │  │     │           │  ├─ CreateAutoIssuanceRuleRequest.java.bak
│  │  │     │           │  ├─ CreateCouponTemplateRequest.java
│  │  │     │           │  ├─ IssueCouponRequest.java
│  │  │     │           │  ├─ OrderItemDTO.java
│  │  │     │           │  ├─ RollbackCouponRequest.java
│  │  │     │           │  ├─ UpdateCouponTemplateRequest.java
│  │  │     │           │  ├─ UseCouponRequest.java
│  │  │     │           │  ├─ UserCouponDTO.java
│  │  │     │           │  └─ UserEventTriggerRequest.java.bak
│  │  │     │           ├─ entity
│  │  │     │           │  ├─ AutoIssuanceHistory.java.bak
│  │  │     │           │  ├─ AutoIssuanceRule.java.bak
│  │  │     │           │  ├─ CouponStatus.java
│  │  │     │           │  ├─ CouponTemplate.java
│  │  │     │           │  ├─ CouponType.java
│  │  │     │           │  └─ UserCoupon.java
│  │  │     │           ├─ exception
│  │  │     │           │  ├─ BusinessException.java
│  │  │     │           │  └─ GlobalExceptionHandler.java
│  │  │     │           ├─ filter
│  │  │     │           │  └─ JwtAuthenticationFilter.java
│  │  │     │           ├─ integration
│  │  │     │           │  └─ UserServiceIntegration.java.bak
│  │  │     │           ├─ MarketingServiceApplication.java
│  │  │     │           ├─ repository
│  │  │     │           │  ├─ AutoIssuanceHistoryRepository.java.bak
│  │  │     │           │  ├─ AutoIssuanceRuleRepository.java.bak
│  │  │     │           │  ├─ CouponTemplateRepository.java
│  │  │     │           │  └─ UserCouponRepository.java
│  │  │     │           ├─ service
│  │  │     │           │  ├─ CouponCalculationService.java
│  │  │     │           │  ├─ CouponCombinationService.java
│  │  │     │           │  ├─ CouponIssueService.java
│  │  │     │           │  ├─ CouponStatisticsService.java
│  │  │     │           │  ├─ CouponStatsService.java
│  │  │     │           │  ├─ CouponTemplateService.java
│  │  │     │           │  └─ SmartIssuanceService.java.bak
│  │  │     │           └─ util
│  │  │     │              └─ JwtUtil.java
│  │  │     └─ resources
│  │  │        └─ application.yml
│  │  └─ target
│  │     ├─ classes
│  │     │  ├─ application.yml
│  │     │  └─ com
│  │     │     └─ fooddelivery
│  │     │        └─ marketingservice
│  │     │           ├─ config
│  │     │           │  ├─ AsyncConfig.class
│  │     │           │  ├─ OpenApiConfig.class
│  │     │           │  └─ SecurityConfig.class
│  │     │           ├─ controller
│  │     │           │  ├─ AdminCouponController.class
│  │     │           │  ├─ AdminMarketingController.class
│  │     │           │  ├─ CouponController.class
│  │     │           │  └─ SmartIssuanceController.java.bak
│  │     │           ├─ dto
│  │     │           │  ├─ AdminIssueBatchRequest.class
│  │     │           │  ├─ AdminIssueCouponRequest.class
│  │     │           │  ├─ AutoIssuanceRuleDTO.java.bak
│  │     │           │  ├─ CalculateBestCouponRequest$CalculateBestCouponRequestBuilder.class
│  │     │           │  ├─ CalculateBestCouponRequest.class
│  │     │           │  ├─ CalculateBestCouponResponse$CalculateBestCouponResponseBuilder.class
│  │     │           │  ├─ CalculateBestCouponResponse.class
│  │     │           │  ├─ CouponStatsDTO$CouponStatsDTOBuilder.class
│  │     │           │  ├─ CouponStatsDTO.class
│  │     │           │  ├─ CouponTemplateDTO$CouponTemplateDTOBuilder.class
│  │     │           │  ├─ CouponTemplateDTO.class
│  │     │           │  ├─ CouponTypeStatsDTO$CouponTypeStatsDTOBuilder.class
│  │     │           │  ├─ CouponTypeStatsDTO.class
│  │     │           │  ├─ CouponUsageTrendDTO$CouponUsageTrendDTOBuilder.class
│  │     │           │  ├─ CouponUsageTrendDTO.class
│  │     │           │  ├─ CreateAutoIssuanceRuleRequest.java.bak
│  │     │           │  ├─ CreateCouponTemplateRequest.class
│  │     │           │  ├─ IssueCouponRequest$IssueCouponRequestBuilder.class
│  │     │           │  ├─ IssueCouponRequest.class
│  │     │           │  ├─ OrderItemDTO$OrderItemDTOBuilder.class
│  │     │           │  ├─ OrderItemDTO.class
│  │     │           │  ├─ RollbackCouponRequest.class
│  │     │           │  ├─ UpdateCouponTemplateRequest.class
│  │     │           │  ├─ UseCouponRequest.class
│  │     │           │  ├─ UserCouponDTO$UserCouponDTOBuilder.class
│  │     │           │  ├─ UserCouponDTO.class
│  │     │           │  └─ UserEventTriggerRequest.java.bak
│  │     │           ├─ entity
│  │     │           │  ├─ AutoIssuanceHistory.java.bak
│  │     │           │  ├─ AutoIssuanceRule.java.bak
│  │     │           │  ├─ CouponStatus.class
│  │     │           │  ├─ CouponTemplate.class
│  │     │           │  ├─ CouponType.class
│  │     │           │  └─ UserCoupon.class
│  │     │           ├─ exception
│  │     │           │  ├─ BusinessException.class
│  │     │           │  └─ GlobalExceptionHandler.class
│  │     │           ├─ filter
│  │     │           │  └─ JwtAuthenticationFilter.class
│  │     │           ├─ integration
│  │     │           │  └─ UserServiceIntegration.java.bak
│  │     │           ├─ MarketingServiceApplication.class
│  │     │           ├─ repository
│  │     │           │  ├─ AutoIssuanceHistoryRepository.java.bak
│  │     │           │  ├─ AutoIssuanceRuleRepository.java.bak
│  │     │           │  ├─ CouponTemplateRepository.class
│  │     │           │  └─ UserCouponRepository.class
│  │     │           ├─ service
│  │     │           │  ├─ CouponCalculationService.class
│  │     │           │  ├─ CouponCombinationService$CombinationResult.class
│  │     │           │  ├─ CouponCombinationService$CouponOption.class
│  │     │           │  ├─ CouponCombinationService.class
│  │     │           │  ├─ CouponIssueService.class
│  │     │           │  ├─ CouponStatisticsService.class
│  │     │           │  ├─ CouponStatsService.class
│  │     │           │  ├─ CouponTemplateService.class
│  │     │           │  └─ SmartIssuanceService.java.bak
│  │     │           └─ util
│  │     │              └─ JwtUtil.class
│  │     ├─ generated-sources
│  │     │  └─ annotations
│  │     ├─ generated-test-sources
│  │     │  └─ test-annotations
│  │     └─ test-classes
│  ├─ merchant-service
│  │  ├─ Dockerfile
│  │  ├─ merchant-service.iml
│  │  ├─ pom.xml
│  │  ├─ src
│  │  │  └─ main
│  │  │     ├─ java
│  │  │     │  └─ com
│  │  │     │     └─ fooddelivery
│  │  │     │        └─ merchant
│  │  │     │           ├─ client
│  │  │     │           │  ├─ OrderServiceClient.java
│  │  │     │           │  └─ UserServiceClient.java
│  │  │     │           ├─ config
│  │  │     │           │  ├─ JpaConfig.java
│  │  │     │           │  ├─ RabbitMQConfig.java
│  │  │     │           │  └─ SecurityConfig.java
│  │  │     │           ├─ controller
│  │  │     │           │  ├─ AdminMerchantController.java
│  │  │     │           │  ├─ HealthCheckController.java
│  │  │     │           │  ├─ MenuController.java
│  │  │     │           │  ├─ MerchantController.java
│  │  │     │           │  ├─ MerchantInternalController.java
│  │  │     │           │  ├─ MerchantNotificationController.java
│  │  │     │           │  ├─ MerchantRefundController.java
│  │  │     │           │  └─ PriceChangeController.java
│  │  │     │           ├─ dto
│  │  │     │           │  ├─ BatchImportRequest.java
│  │  │     │           │  ├─ CreateMenuItemRequest.java
│  │  │     │           │  ├─ CreateMerchantRequest.java
│  │  │     │           │  ├─ MenuItemDto.java
│  │  │     │           │  ├─ MerchantDto.java
│  │  │     │           │  ├─ RealRestaurantDTO.java
│  │  │     │           │  └─ UpdateMenuItemRequest.java
│  │  │     │           ├─ entity
│  │  │     │           │  ├─ MenuItem.java
│  │  │     │           │  ├─ Merchant.java
│  │  │     │           │  ├─ MerchantNotification.java
│  │  │     │           │  └─ PriceChangeProposal.java
│  │  │     │           ├─ filter
│  │  │     │           │  └─ JwtAuthenticationFilter.java
│  │  │     │           ├─ MerchantServiceApplication.java
│  │  │     │           ├─ repository
│  │  │     │           │  ├─ MenuItemRepository.java
│  │  │     │           │  ├─ MerchantNotificationRepository.java
│  │  │     │           │  ├─ MerchantRepository.java
│  │  │     │           │  └─ PriceChangeProposalRepository.java
│  │  │     │           ├─ service
│  │  │     │           │  ├─ MenuService.java
│  │  │     │           │  ├─ MerchantRefundService.java
│  │  │     │           │  ├─ MerchantService.java
│  │  │     │           │  ├─ PriceProposalService.java
│  │  │     │           │  └─ PricingEventConsumer.java
│  │  │     │           └─ util
│  │  │     │              └─ JwtUtil.java
│  │  │     └─ resources
│  │  │        ├─ application.yml
│  │  │        └─ db
│  │  │           └─ migration
│  │  │              └─ V1.1__Add_audit_fields_to_merchants.sql
│  │  └─ target
│  │     ├─ classes
│  │     │  ├─ application.yml
│  │     │  ├─ com
│  │     │  │  └─ fooddelivery
│  │     │  │     └─ merchant
│  │     │  │        ├─ client
│  │     │  │        │  ├─ OrderServiceClient.class
│  │     │  │        │  └─ UserServiceClient.class
│  │     │  │        ├─ config
│  │     │  │        │  ├─ JpaConfig.class
│  │     │  │        │  ├─ RabbitMQConfig.class
│  │     │  │        │  └─ SecurityConfig.class
│  │     │  │        ├─ controller
│  │     │  │        │  ├─ AdminMerchantController.class
│  │     │  │        │  ├─ HealthCheckController.class
│  │     │  │        │  ├─ MenuController.class
│  │     │  │        │  ├─ MerchantController.class
│  │     │  │        │  ├─ MerchantInternalController.class
│  │     │  │        │  ├─ MerchantNotificationController.class
│  │     │  │        │  ├─ MerchantRefundController.class
│  │     │  │        │  └─ PriceChangeController.class
│  │     │  │        ├─ dto
│  │     │  │        │  ├─ BatchImportRequest.class
│  │     │  │        │  ├─ CreateMenuItemRequest.class
│  │     │  │        │  ├─ CreateMerchantRequest.class
│  │     │  │        │  ├─ MenuItemDto.class
│  │     │  │        │  ├─ MerchantDto.class
│  │     │  │        │  ├─ RealRestaurantDTO.class
│  │     │  │        │  └─ UpdateMenuItemRequest.class
│  │     │  │        ├─ entity
│  │     │  │        │  ├─ MenuItem.class
│  │     │  │        │  ├─ Merchant.class
│  │     │  │        │  ├─ MerchantNotification.class
│  │     │  │        │  └─ PriceChangeProposal.class
│  │     │  │        ├─ filter
│  │     │  │        │  └─ JwtAuthenticationFilter.class
│  │     │  │        ├─ MerchantServiceApplication.class
│  │     │  │        ├─ repository
│  │     │  │        │  ├─ MenuItemRepository.class
│  │     │  │        │  ├─ MerchantNotificationRepository.class
│  │     │  │        │  ├─ MerchantRepository.class
│  │     │  │        │  └─ PriceChangeProposalRepository.class
│  │     │  │        ├─ service
│  │     │  │        │  ├─ MenuService.class
│  │     │  │        │  ├─ MerchantRefundService.class
│  │     │  │        │  ├─ MerchantService$MenuItemTemplate.class
│  │     │  │        │  ├─ MerchantService.class
│  │     │  │        │  ├─ PriceProposalService.class
│  │     │  │        │  └─ PricingEventConsumer.class
│  │     │  │        └─ util
│  │     │  │           └─ JwtUtil.class
│  │     │  └─ db
│  │     │     └─ migration
│  │     │        └─ V1.1__Add_audit_fields_to_merchants.sql
│  │     ├─ generated-sources
│  │     │  └─ annotations
│  │     ├─ generated-test-sources
│  │     │  └─ test-annotations
│  │     ├─ maven-archiver
│  │     │  └─ pom.properties
│  │     ├─ maven-status
│  │     │  └─ maven-compiler-plugin
│  │     │     └─ compile
│  │     │        └─ default-compile
│  │     │           ├─ createdFiles.lst
│  │     │           └─ inputFiles.lst
│  │     ├─ merchant-service-0.0.1-SNAPSHOT.jar
│  │     ├─ merchant-service-0.0.1-SNAPSHOT.jar.original
│  │     └─ test-classes
│  ├─ nutrivision-service
│  │  ├─ app
│  │  │  ├─ core
│  │  │  │  ├─ config.py
│  │  │  │  ├─ gemini_vision.py
│  │  │  │  └─ _init_.py
│  │  │  ├─ main.py
│  │  │  ├─ models
│  │  │  │  ├─ schemas.py
│  │  │  │  └─ _init_.py
│  │  │  └─ _init_.py
│  │  ├─ Dockerfile
│  │  └─ requirements.txt
│  ├─ order-service
│  │  ├─ Dockerfile
│  │  ├─ order-service.iml
│  │  ├─ pom.xml
│  │  ├─ src
│  │  │  └─ main
│  │  │     ├─ java
│  │  │     │  └─ com
│  │  │     │     └─ fooddelivery
│  │  │     │        └─ orderservice
│  │  │     │           ├─ client
│  │  │     │           │  ├─ MerchantServiceClient.java
│  │  │     │           │  ├─ PlatformServiceClient.java
│  │  │     │           │  └─ UserServiceClient.java
│  │  │     │           ├─ config
│  │  │     │           │  ├─ RabbitMQConfig.java
│  │  │     │           │  └─ SecurityConfig.java
│  │  │     │           ├─ controller
│  │  │     │           │  ├─ AdminOrderController.java
│  │  │     │           │  ├─ OrderController.java
│  │  │     │           │  └─ OrderInternalController.java
│  │  │     │           ├─ dto
│  │  │     │           │  ├─ AdminOrderDto.java
│  │  │     │           │  ├─ CancelOrderDto.java
│  │  │     │           │  ├─ CreateOrderDto.java
│  │  │     │           │  ├─ ItemSalesStatsDto.java
│  │  │     │           │  ├─ MenuItemDto.java
│  │  │     │           │  ├─ OrderDetailDto.java
│  │  │     │           │  ├─ OrderItemDetailDto.java
│  │  │     │           │  ├─ PaymentConfirmDto.java
│  │  │     │           │  └─ RefundApprovalDto.java
│  │  │     │           ├─ entity
│  │  │     │           │  ├─ CancellationRecord.java
│  │  │     │           │  ├─ MenuItem.java
│  │  │     │           │  ├─ Order.java
│  │  │     │           │  ├─ OrderItem.java
│  │  │     │           │  └─ OrderStatusHistory.java
│  │  │     │           ├─ filter
│  │  │     │           │  └─ JwtAuthenticationFilter.java
│  │  │     │           ├─ OrderServiceApplication.java
│  │  │     │           ├─ repository
│  │  │     │           │  ├─ CancellationRecordRepository.java
│  │  │     │           │  ├─ MenuItemRepository.java
│  │  │     │           │  ├─ OrderRepository.java
│  │  │     │           │  └─ OrderStatusHistoryRepository.java
│  │  │     │           ├─ service
│  │  │     │           │  ├─ CancellationService.java
│  │  │     │           │  └─ OrderService.java
│  │  │     │           └─ util
│  │  │     │              └─ JwtUtil.java
│  │  │     └─ resources
│  │  │        └─ application.yml
│  │  └─ target
│  │     ├─ classes
│  │     │  ├─ application.yml
│  │     │  └─ com
│  │     │     └─ fooddelivery
│  │     │        └─ orderservice
│  │     │           ├─ client
│  │     │           │  ├─ MerchantServiceClient.class
│  │     │           │  ├─ PlatformServiceClient.class
│  │     │           │  └─ UserServiceClient.class
│  │     │           ├─ config
│  │     │           │  ├─ RabbitMQConfig.class
│  │     │           │  └─ SecurityConfig.class
│  │     │           ├─ controller
│  │     │           │  ├─ AdminOrderController.class
│  │     │           │  ├─ OrderController.class
│  │     │           │  └─ OrderInternalController.class
│  │     │           ├─ dto
│  │     │           │  ├─ AdminOrderDto$AdminOrderDtoBuilder.class
│  │     │           │  ├─ AdminOrderDto$OrderStatusInfo$OrderStatusInfoBuilder.class
│  │     │           │  ├─ AdminOrderDto$OrderStatusInfo.class
│  │     │           │  ├─ AdminOrderDto$PaymentMethodInfo$PaymentMethodInfoBuilder.class
│  │     │           │  ├─ AdminOrderDto$PaymentMethodInfo.class
│  │     │           │  ├─ AdminOrderDto.class
│  │     │           │  ├─ CancelOrderDto.class
│  │     │           │  ├─ CreateOrderDto$OrderItemDto.class
│  │     │           │  ├─ CreateOrderDto.class
│  │     │           │  ├─ ItemSalesStatsDto.class
│  │     │           │  ├─ MenuItemDto.class
│  │     │           │  ├─ OrderDetailDto.class
│  │     │           │  ├─ OrderItemDetailDto.class
│  │     │           │  ├─ PaymentConfirmDto.class
│  │     │           │  └─ RefundApprovalDto.class
│  │     │           ├─ entity
│  │     │           │  ├─ CancellationRecord.class
│  │     │           │  ├─ MenuItem.class
│  │     │           │  ├─ Order.class
│  │     │           │  ├─ OrderItem.class
│  │     │           │  └─ OrderStatusHistory.class
│  │     │           ├─ filter
│  │     │           │  └─ JwtAuthenticationFilter.class
│  │     │           ├─ OrderServiceApplication.class
│  │     │           ├─ repository
│  │     │           │  ├─ CancellationRecordRepository.class
│  │     │           │  ├─ MenuItemRepository.class
│  │     │           │  ├─ OrderRepository.class
│  │     │           │  └─ OrderStatusHistoryRepository.class
│  │     │           ├─ service
│  │     │           │  ├─ CancellationService.class
│  │     │           │  └─ OrderService.class
│  │     │           └─ util
│  │     │              └─ JwtUtil.class
│  │     ├─ generated-sources
│  │     │  └─ annotations
│  │     ├─ generated-test-sources
│  │     │  └─ test-annotations
│  │     ├─ maven-status
│  │     │  └─ maven-compiler-plugin
│  │     │     └─ compile
│  │     │        └─ default-compile
│  │     │           ├─ createdFiles.lst
│  │     │           └─ inputFiles.lst
│  │     └─ test-classes
│  ├─ platform-service
│  │  ├─ Dockerfile
│  │  ├─ platform-service.iml
│  │  ├─ pom.xml
│  │  ├─ README.md
│  │  ├─ src
│  │  │  └─ main
│  │  │     ├─ java
│  │  │     │  └─ com
│  │  │     │     └─ fooddelivery
│  │  │     │        └─ platformservice
│  │  │     │           ├─ config
│  │  │     │           │  ├─ OpenApiConfig.java
│  │  │     │           │  ├─ RestTemplateConfig.java
│  │  │     │           │  └─ SecurityConfig.java
│  │  │     │           ├─ controller
│  │  │     │           │  ├─ AdminDashboardController.java
│  │  │     │           │  ├─ AdminPlatformServiceController.java
│  │  │     │           │  ├─ AdminSettlementController.java
│  │  │     │           │  ├─ HealthCheckController.java
│  │  │     │           │  ├─ InternalCommissionController.java
│  │  │     │           │  ├─ MerchantCommissionController.java
│  │  │     │           │  ├─ MerchantPlatformServiceController.java
│  │  │     │           │  └─ MerchantSettlementController.java
│  │  │     │           ├─ dto
│  │  │     │           │  ├─ AdjustSettlementRequest.java
│  │  │     │           │  ├─ BatchPayRequest.java
│  │  │     │           │  ├─ CalculateCommissionRequest.java
│  │  │     │           │  ├─ CalculateCommissionResponse.java
│  │  │     │           │  ├─ CancelSubscriptionRequest.java
│  │  │     │           │  ├─ CommissionRecordDTO.java
│  │  │     │           │  ├─ CommissionSummaryDTO.java
│  │  │     │           │  ├─ ConfirmSettlementRequest.java
│  │  │     │           │  ├─ CreatePlatformServiceRequest.java
│  │  │     │           │  ├─ DashboardOverviewDTO.java
│  │  │     │           │  ├─ DisputeSettlementRequest.java
│  │  │     │           │  ├─ GenerateSettlementRequest.java
│  │  │     │           │  ├─ MerchantSettlementDTO.java
│  │  │     │           │  ├─ PlatformServiceDTO.java
│  │  │     │           │  ├─ PlatformStatsDTO.java
│  │  │     │           │  ├─ SettlementStatsDTO.java
│  │  │     │           │  ├─ SettlementTrendDTO.java
│  │  │     │           │  ├─ SubscribeServiceRequest.java
│  │  │     │           │  ├─ SubscriptionDTO.java
│  │  │     │           │  ├─ SystemHealthDTO.java
│  │  │     │           │  └─ UpdatePlatformServiceRequest.java
│  │  │     │           ├─ entity
│  │  │     │           │  ├─ BillingCycle.java
│  │  │     │           │  ├─ CommissionRecord.java
│  │  │     │           │  ├─ CommissionStatus.java
│  │  │     │           │  ├─ FeeType.java
│  │  │     │           │  ├─ MerchantServiceSubscription.java
│  │  │     │           │  ├─ MerchantSettlement.java
│  │  │     │           │  ├─ PlatformService.java
│  │  │     │           │  ├─ ServiceCategory.java
│  │  │     │           │  ├─ ServiceStatus.java
│  │  │     │           │  ├─ SettlementStatus.java
│  │  │     │           │  ├─ SettlementType.java
│  │  │     │           │  └─ SubscriptionStatus.java
│  │  │     │           ├─ exception
│  │  │     │           │  ├─ BusinessException.java
│  │  │     │           │  └─ GlobalExceptionHandler.java
│  │  │     │           ├─ filter
│  │  │     │           │  └─ JwtAuthenticationFilter.java
│  │  │     │           ├─ PlatformServiceApplication.java
│  │  │     │           ├─ repository
│  │  │     │           │  ├─ CommissionRecordRepository.java
│  │  │     │           │  ├─ MerchantEntity.java
│  │  │     │           │  ├─ MerchantQueryRepository.java
│  │  │     │           │  ├─ MerchantServiceSubscriptionRepository.java
│  │  │     │           │  ├─ MerchantSettlementRepository.java
│  │  │     │           │  └─ PlatformServiceRepository.java
│  │  │     │           ├─ service
│  │  │     │           │  ├─ CommissionScheduler.java
│  │  │     │           │  ├─ CommissionService.java
│  │  │     │           │  ├─ DashboardService.java
│  │  │     │           │  ├─ MerchantQueryService.java
│  │  │     │           │  ├─ PlatformServiceService.java
│  │  │     │           │  ├─ SettlementScheduler.java
│  │  │     │           │  ├─ SettlementService.java
│  │  │     │           │  ├─ SettlementStatisticsService.java
│  │  │     │           │  └─ SubscriptionService.java
│  │  │     │           └─ util
│  │  │     │              └─ JwtUtil.java
│  │  │     └─ resources
│  │  │        └─ application.yml
│  │  └─ target
│  │     ├─ classes
│  │     │  ├─ application.yml
│  │     │  └─ com
│  │     │     └─ fooddelivery
│  │     │        └─ platformservice
│  │     │           ├─ config
│  │     │           │  ├─ OpenApiConfig.class
│  │     │           │  ├─ RestTemplateConfig.class
│  │     │           │  └─ SecurityConfig.class
│  │     │           ├─ controller
│  │     │           │  ├─ AdminDashboardController.class
│  │     │           │  ├─ AdminPlatformServiceController.class
│  │     │           │  ├─ AdminSettlementController.class
│  │     │           │  ├─ HealthCheckController.class
│  │     │           │  ├─ InternalCommissionController.class
│  │     │           │  ├─ MerchantCommissionController.class
│  │     │           │  ├─ MerchantPlatformServiceController.class
│  │     │           │  └─ MerchantSettlementController.class
│  │     │           ├─ dto
│  │     │           │  ├─ AdjustSettlementRequest$AdjustSettlementRequestBuilder.class
│  │     │           │  ├─ AdjustSettlementRequest.class
│  │     │           │  ├─ BatchPayRequest$BatchPayRequestBuilder.class
│  │     │           │  ├─ BatchPayRequest.class
│  │     │           │  ├─ CalculateCommissionRequest$CalculateCommissionRequestBuilder.class
│  │     │           │  ├─ CalculateCommissionRequest.class
│  │     │           │  ├─ CalculateCommissionResponse$CalculateCommissionResponseBuilder.class
│  │     │           │  ├─ CalculateCommissionResponse$CommissionDetail$CommissionDetailBuilder.class
│  │     │           │  ├─ CalculateCommissionResponse$CommissionDetail.class
│  │     │           │  ├─ CalculateCommissionResponse.class
│  │     │           │  ├─ CancelSubscriptionRequest$CancelSubscriptionRequestBuilder.class
│  │     │           │  ├─ CancelSubscriptionRequest.class
│  │     │           │  ├─ CommissionRecordDTO$1.class
│  │     │           │  ├─ CommissionRecordDTO$CommissionRecordDTOBuilder.class
│  │     │           │  ├─ CommissionRecordDTO.class
│  │     │           │  ├─ CommissionSummaryDTO$CategoryCommissionDTO$CategoryCommissionDTOBuilder.class
│  │     │           │  ├─ CommissionSummaryDTO$CategoryCommissionDTO.class
│  │     │           │  ├─ CommissionSummaryDTO$CommissionSummaryDTOBuilder.class
│  │     │           │  ├─ CommissionSummaryDTO.class
│  │     │           │  ├─ ConfirmSettlementRequest$ConfirmSettlementRequestBuilder.class
│  │     │           │  ├─ ConfirmSettlementRequest.class
│  │     │           │  ├─ CreatePlatformServiceRequest$CreatePlatformServiceRequestBuilder.class
│  │     │           │  ├─ CreatePlatformServiceRequest.class
│  │     │           │  ├─ DashboardOverviewDTO$DailyStats$DailyStatsBuilder.class
│  │     │           │  ├─ DashboardOverviewDTO$DailyStats.class
│  │     │           │  ├─ DashboardOverviewDTO$DashboardOverviewDTOBuilder.class
│  │     │           │  ├─ DashboardOverviewDTO$MerchantRanking$MerchantRankingBuilder.class
│  │     │           │  ├─ DashboardOverviewDTO$MerchantRanking.class
│  │     │           │  ├─ DashboardOverviewDTO.class
│  │     │           │  ├─ DisputeSettlementRequest$DisputeSettlementRequestBuilder.class
│  │     │           │  ├─ DisputeSettlementRequest.class
│  │     │           │  ├─ GenerateSettlementRequest$GenerateSettlementRequestBuilder.class
│  │     │           │  ├─ GenerateSettlementRequest.class
│  │     │           │  ├─ MerchantSettlementDTO$1.class
│  │     │           │  ├─ MerchantSettlementDTO$MerchantSettlementDTOBuilder.class
│  │     │           │  ├─ MerchantSettlementDTO$ServiceCommissionSummary$ServiceCommissionSummaryBuilder.class
│  │     │           │  ├─ MerchantSettlementDTO$ServiceCommissionSummary.class
│  │     │           │  ├─ MerchantSettlementDTO.class
│  │     │           │  ├─ PlatformServiceDTO$1.class
│  │     │           │  ├─ PlatformServiceDTO$PlatformServiceDTOBuilder.class
│  │     │           │  ├─ PlatformServiceDTO.class
│  │     │           │  ├─ PlatformStatsDTO$PlatformStatsDTOBuilder.class
│  │     │           │  ├─ PlatformStatsDTO.class
│  │     │           │  ├─ SettlementStatsDTO$SettlementStatsDTOBuilder.class
│  │     │           │  ├─ SettlementStatsDTO.class
│  │     │           │  ├─ SettlementTrendDTO$SettlementTrendDTOBuilder.class
│  │     │           │  ├─ SettlementTrendDTO.class
│  │     │           │  ├─ SubscribeServiceRequest$SubscribeServiceRequestBuilder.class
│  │     │           │  ├─ SubscribeServiceRequest.class
│  │     │           │  ├─ SubscriptionDTO$1.class
│  │     │           │  ├─ SubscriptionDTO$SubscriptionDTOBuilder.class
│  │     │           │  ├─ SubscriptionDTO.class
│  │     │           │  ├─ SystemHealthDTO$ServiceHealth$ServiceHealthBuilder.class
│  │     │           │  ├─ SystemHealthDTO$ServiceHealth.class
│  │     │           │  ├─ SystemHealthDTO$SystemHealthDTOBuilder.class
│  │     │           │  ├─ SystemHealthDTO.class
│  │     │           │  ├─ UpdatePlatformServiceRequest$UpdatePlatformServiceRequestBuilder.class
│  │     │           │  └─ UpdatePlatformServiceRequest.class
│  │     │           ├─ entity
│  │     │           │  ├─ BillingCycle.class
│  │     │           │  ├─ CommissionRecord$CommissionRecordBuilder.class
│  │     │           │  ├─ CommissionRecord.class
│  │     │           │  ├─ CommissionStatus.class
│  │     │           │  ├─ FeeType.class
│  │     │           │  ├─ MerchantServiceSubscription$MerchantServiceSubscriptionBuilder.class
│  │     │           │  ├─ MerchantServiceSubscription.class
│  │     │           │  ├─ MerchantSettlement$MerchantSettlementBuilder.class
│  │     │           │  ├─ MerchantSettlement.class
│  │     │           │  ├─ PlatformService$PlatformServiceBuilder.class
│  │     │           │  ├─ PlatformService.class
│  │     │           │  ├─ ServiceCategory.class
│  │     │           │  ├─ ServiceStatus.class
│  │     │           │  ├─ SettlementStatus.class
│  │     │           │  ├─ SettlementType.class
│  │     │           │  └─ SubscriptionStatus.class
│  │     │           ├─ exception
│  │     │           │  ├─ BusinessException.class
│  │     │           │  ├─ GlobalExceptionHandler$ErrorResponse.class
│  │     │           │  └─ GlobalExceptionHandler.class
│  │     │           ├─ filter
│  │     │           │  ├─ JwtAuthenticationFilter$AuthenticatedUser.class
│  │     │           │  └─ JwtAuthenticationFilter.class
│  │     │           ├─ PlatformServiceApplication.class
│  │     │           ├─ repository
│  │     │           │  ├─ CommissionRecordRepository.class
│  │     │           │  ├─ MerchantEntity.class
│  │     │           │  ├─ MerchantQueryRepository.class
│  │     │           │  ├─ MerchantServiceSubscriptionRepository.class
│  │     │           │  ├─ MerchantSettlementRepository.class
│  │     │           │  └─ PlatformServiceRepository.class
│  │     │           ├─ service
│  │     │           │  ├─ CommissionScheduler.class
│  │     │           │  ├─ CommissionService$1.class
│  │     │           │  ├─ CommissionService.class
│  │     │           │  ├─ DashboardService.class
│  │     │           │  ├─ MerchantQueryService.class
│  │     │           │  ├─ PlatformServiceService.class
│  │     │           │  ├─ SettlementScheduler.class
│  │     │           │  ├─ SettlementService$1.class
│  │     │           │  ├─ SettlementService.class
│  │     │           │  ├─ SettlementStatisticsService.class
│  │     │           │  └─ SubscriptionService.class
│  │     │           └─ util
│  │     │              └─ JwtUtil.class
│  │     ├─ generated-sources
│  │     │  └─ annotations
│  │     ├─ generated-test-sources
│  │     │  └─ test-annotations
│  │     ├─ maven-archiver
│  │     │  └─ pom.properties
│  │     ├─ maven-status
│  │     │  └─ maven-compiler-plugin
│  │     │     └─ compile
│  │     │        └─ default-compile
│  │     │           ├─ createdFiles.lst
│  │     │           └─ inputFiles.lst
│  │     ├─ platform-service-1.0.0.jar
│  │     ├─ platform-service-1.0.0.jar.original
│  │     └─ test-classes
│  ├─ profile-service
│  │  ├─ Dockerfile
│  │  ├─ pom.xml
│  │  ├─ profile-service.iml
│  │  ├─ src
│  │  │  └─ main
│  │  │     ├─ java
│  │  │     │  └─ com
│  │  │     │     └─ fooddelivery
│  │  │     │        └─ profileservice
│  │  │     │           ├─ client
│  │  │     │           │  └─ OrderClient.java
│  │  │     │           ├─ config
│  │  │     │           │  ├─ FeignConfig.java
│  │  │     │           │  └─ SecurityConfig.java
│  │  │     │           ├─ controller
│  │  │     │           │  └─ UserProfileController.java
│  │  │     │           ├─ dto
│  │  │     │           │  ├─ OrderDto.java
│  │  │     │           │  ├─ OrderItemDto.java
│  │  │     │           │  └─ UserContextDto.java
│  │  │     │           ├─ entity
│  │  │     │           │  ├─ BrowseRecord.java
│  │  │     │           │  ├─ UserProfile.java
│  │  │     │           │  └─ UserStats.java
│  │  │     │           ├─ filter
│  │  │     │           │  └─ JwtAuthenticationFilter.java
│  │  │     │           ├─ ProfileServiceApplication.java
│  │  │     │           ├─ repository
│  │  │     │           │  └─ UserProfileRepository.java
│  │  │     │           ├─ service
│  │  │     │           │  └─ UserProfileService.java
│  │  │     │           └─ util
│  │  │     │              └─ JwtUtil.java
│  │  │     └─ resources
│  │  │        └─ application.yml
│  │  └─ target
│  │     ├─ classes
│  │     │  ├─ application.yml
│  │     │  └─ com
│  │     │     └─ fooddelivery
│  │     │        └─ profileservice
│  │     │           ├─ client
│  │     │           │  └─ OrderClient.class
│  │     │           ├─ config
│  │     │           │  ├─ FeignConfig$1.class
│  │     │           │  ├─ FeignConfig.class
│  │     │           │  └─ SecurityConfig.class
│  │     │           ├─ controller
│  │     │           │  └─ UserProfileController.class
│  │     │           ├─ dto
│  │     │           │  ├─ OrderDto.class
│  │     │           │  ├─ OrderItemDto.class
│  │     │           │  └─ UserContextDto.class
│  │     │           ├─ entity
│  │     │           │  ├─ BrowseRecord.class
│  │     │           │  ├─ UserProfile.class
│  │     │           │  └─ UserStats.class
│  │     │           ├─ filter
│  │     │           │  └─ JwtAuthenticationFilter.class
│  │     │           ├─ ProfileServiceApplication.class
│  │     │           ├─ repository
│  │     │           │  └─ UserProfileRepository.class
│  │     │           ├─ service
│  │     │           │  └─ UserProfileService.class
│  │     │           └─ util
│  │     │              └─ JwtUtil.class
│  │     ├─ generated-sources
│  │     │  └─ annotations
│  │     ├─ generated-test-sources
│  │     │  └─ test-annotations
│  │     └─ test-classes
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
│     ├─ target
│     │  ├─ classes
│     │  │  ├─ application.yml
│     │  │  └─ com
│     │  │     └─ fooddelivery
│     │  │        └─ userservice
│     │  │           ├─ config
│     │  │           │  ├─ CorsConfig.class
│     │  │           │  └─ SecurityConfig.class
│     │  │           ├─ controller
│     │  │           │  ├─ AddressController.class
│     │  │           │  ├─ AdminUserController.class
│     │  │           │  ├─ AuthController.class
│     │  │           │  ├─ CommonUsageDemoController.class
│     │  │           │  └─ UserController.class
│     │  │           ├─ dto
│     │  │           │  ├─ AddressDto.class
│     │  │           │  ├─ AuthRequest.class
│     │  │           │  ├─ AuthResponse$AuthResponseBuilder.class
│     │  │           │  ├─ AuthResponse.class
│     │  │           │  ├─ UpdateUserDto.class
│     │  │           │  ├─ UpdateUserStatusDTO.class
│     │  │           │  ├─ UserCreditDto.class
│     │  │           │  ├─ UserResponseDto.class
│     │  │           │  ├─ UserStatsDTO$UserStatsDTOBuilder.class
│     │  │           │  └─ UserStatsDTO.class
│     │  │           ├─ entity
│     │  │           │  ├─ Address.class
│     │  │           │  ├─ CancellationHistory.class
│     │  │           │  └─ User.class
│     │  │           ├─ filter
│     │  │           │  └─ JwtAuthenticationFilter.class
│     │  │           ├─ repository
│     │  │           │  ├─ AddressRepository.class
│     │  │           │  ├─ CancellationHistoryRepository.class
│     │  │           │  └─ UserRepository.class
│     │  │           ├─ service
│     │  │           │  ├─ AddressService.class
│     │  │           │  ├─ AuthService.class
│     │  │           │  ├─ CreditService.class
│     │  │           │  └─ CustomUserDetailsService.class
│     │  │           ├─ UserServiceApplication.class
│     │  │           └─ util
│     │  │              └─ JwtUtil.class
│     │  ├─ generated-sources
│     │  │  └─ annotations
│     │  └─ maven-status
│     │     └─ maven-compiler-plugin
│     │        └─ compile
│     │           └─ default-compile
│     │              ├─ createdFiles.lst
│     │              └─ inputFiles.lst
│     └─ user-service.iml
├─ frontend
│  ├─ .bundle
│  │  └─ config
│  ├─ .eslintrc.js
│  ├─ .prettierrc.js
│  ├─ .watchmanconfig
│  ├─ ADDRESS_API_FIX.md
│  ├─ android
│  │  ├─ .gradle
│  │  │  ├─ 8.13
│  │  │  │  ├─ checksums
│  │  │  │  │  ├─ checksums.lock
│  │  │  │  │  ├─ md5-checksums.bin
│  │  │  │  │  └─ sha1-checksums.bin
│  │  │  │  ├─ executionHistory
│  │  │  │  │  ├─ executionHistory.bin
│  │  │  │  │  └─ executionHistory.lock
│  │  │  │  ├─ expanded
│  │  │  │  │  └─ expanded.lock
│  │  │  │  ├─ fileChanges
│  │  │  │  │  └─ last-build.bin
│  │  │  │  ├─ fileHashes
│  │  │  │  │  ├─ fileHashes.bin
│  │  │  │  │  ├─ fileHashes.lock
│  │  │  │  │  └─ resourceHashesCache.bin
│  │  │  │  ├─ gc.properties
│  │  │  │  └─ vcsMetadata
│  │  │  ├─ buildOutputCleanup
│  │  │  │  ├─ buildOutputCleanup.lock
│  │  │  │  ├─ cache.properties
│  │  │  │  └─ outputFiles.bin
│  │  │  ├─ file-system.probe
│  │  │  ├─ noVersion
│  │  │  │  └─ buildLogic.lock
│  │  │  └─ vcs-1
│  │  │     └─ gc.properties
│  │  ├─ .kotlin
│  │  │  └─ sessions
│  │  ├─ app
│  │  │  ├─ .cxx
│  │  │  │  ├─ Debug
│  │  │  │  │  └─ 4l2o235r
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
│  │  │  │  │     │  │           ├─ cache-v2-8409cc813101c9adc327.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-6e194f6a7b5581891631.json
│  │  │  │  │     │  │           ├─ codemodel-v2-86e85296244ab6a6a4a3.json
│  │  │  │  │     │  │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-Debug-55a04f6f219d3deb2a20.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-Debug-a4e0ea570f902cb506eb.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-Debug-86be896f305891852d72.json
│  │  │  │  │     │  │           ├─ index-2026-02-01T03-42-17-0106.json
│  │  │  │  │     │  │           ├─ target-appmodules-Debug-0d9a2e649a813497bdf6.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-Debug-8f4321068a16ee9ce423.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-Debug-7d031a7386c2381c5c1f.json
│  │  │  │  │     │  │           └─ target-react_codegen_safeareacontext-Debug-fb14aa534290c2ede2e3.json
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
│  │  │  │  │     │  │  │  ├─ CMakeDetermineCompilerABI_C.bin
│  │  │  │  │     │  │  │  ├─ CMakeDetermineCompilerABI_CXX.bin
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
│  │  │  │  │     │  │  │  │  └─ FoodMate-AI
│  │  │  │  │     │  │  │  │     └─ frontend
│  │  │  │  │     │  │  │  │        └─ android
│  │  │  │  │     │  │  │  │           └─ app
│  │  │  │  │     │  │  │  │              └─ build
│  │  │  │  │     │  │  │  │                 └─ generated
│  │  │  │  │     │  │  │  │                    └─ autolinking
│  │  │  │  │     │  │  │  │                       └─ src
│  │  │  │  │     │  │  │  │                          └─ main
│  │  │  │  │     │  │  │  │                             └─ jni
│  │  │  │  │     │  │  │  │                                └─ autolinking.cpp.o
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
│  │  │  │  │     │  ├─ compile_commands.json.bin
│  │  │  │  │     │  ├─ configure_fingerprint.bin
│  │  │  │  │     │  ├─ metadata_generation_command.txt
│  │  │  │  │     │  ├─ prefab_config.json
│  │  │  │  │     │  ├─ rnasyncstorage_autolinked_build
│  │  │  │  │     │  │  ├─ CMakeFiles
│  │  │  │  │     │  │  │  └─ react_codegen_rnasyncstorage.dir
│  │  │  │  │     │  │  │     ├─ react
│  │  │  │  │     │  │  │     │  └─ renderer
│  │  │  │  │     │  │  │     │     └─ components
│  │  │  │  │     │  │  │     │        └─ rnasyncstorage
│  │  │  │  │     │  │  │     │           ├─ ComponentDescriptors.cpp.o
│  │  │  │  │     │  │  │     │           ├─ EventEmitters.cpp.o
│  │  │  │  │     │  │  │     │           ├─ Props.cpp.o
│  │  │  │  │     │  │  │     │           ├─ ShadowNodes.cpp.o
│  │  │  │  │     │  │  │     │           └─ States.cpp.o
│  │  │  │  │     │  │  │     └─ rnasyncstorage-generated.cpp.o
│  │  │  │  │     │  │  └─ cmake_install.cmake
│  │  │  │  │     │  ├─ rnscreens_autolinked_build
│  │  │  │  │     │  │  ├─ CMakeFiles
│  │  │  │  │     │  │  │  └─ react_codegen_rnscreens.dir
│  │  │  │  │     │  │  │     ├─ 36cf9f0e480aa05943db0b714b614b15
│  │  │  │  │     │  │  │     │  └─ cpp
│  │  │  │  │     │  │  │     │     └─ react
│  │  │  │  │     │  │  │     │        └─ renderer
│  │  │  │  │     │  │  │     │           └─ components
│  │  │  │  │     │  │  │     │              └─ rnscreens
│  │  │  │  │     │  │  │     │                 ├─ RNSBottomTabsAccessoryShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                 ├─ RNSScreenStackHeaderConfigShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                 ├─ RNSScreenStackHeaderConfigState.cpp.o
│  │  │  │  │     │  │  │     │                 ├─ RNSScreenStackHeaderSubviewShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                 └─ RNSScreenStackHeaderSubviewState.cpp.o
│  │  │  │  │     │  │  │     ├─ 37efc60afa889a82314e403b216e3176
│  │  │  │  │     │  │  │     │  └─ generated
│  │  │  │  │     │  │  │     │     └─ source
│  │  │  │  │     │  │  │     │        └─ codegen
│  │  │  │  │     │  │  │     │           └─ jni
│  │  │  │  │     │  │  │     │              └─ react
│  │  │  │  │     │  │  │     │                 └─ renderer
│  │  │  │  │     │  │  │     │                    └─ components
│  │  │  │  │     │  │  │     │                       └─ rnscreens
│  │  │  │  │     │  │  │     │                          └─ ShadowNodes.cpp.o
│  │  │  │  │     │  │  │     ├─ 748b873697020796c492ccd4c70f19d6
│  │  │  │  │     │  │  │     │  └─ source
│  │  │  │  │     │  │  │     │     └─ codegen
│  │  │  │  │     │  │  │     │        └─ jni
│  │  │  │  │     │  │  │     │           └─ react
│  │  │  │  │     │  │  │     │              └─ renderer
│  │  │  │  │     │  │  │     │                 └─ components
│  │  │  │  │     │  │  │     │                    └─ rnscreens
│  │  │  │  │     │  │  │     │                       ├─ ComponentDescriptors.cpp.o
│  │  │  │  │     │  │  │     │                       └─ EventEmitters.cpp.o
│  │  │  │  │     │  │  │     ├─ a2b3b09d970db5d34bce8cebe852fc36
│  │  │  │  │     │  │  │     │  └─ build
│  │  │  │  │     │  │  │     │     └─ generated
│  │  │  │  │     │  │  │     │        └─ source
│  │  │  │  │     │  │  │     │           └─ codegen
│  │  │  │  │     │  │  │     │              └─ jni
│  │  │  │  │     │  │  │     │                 └─ react
│  │  │  │  │     │  │  │     │                    └─ renderer
│  │  │  │  │     │  │  │     │                       └─ components
│  │  │  │  │     │  │  │     │                          └─ rnscreens
│  │  │  │  │     │  │  │     │                             ├─ Props.cpp.o
│  │  │  │  │     │  │  │     │                             └─ States.cpp.o
│  │  │  │  │     │  │  │     ├─ e49474591d9d791fd9363ed48959f8c5
│  │  │  │  │     │  │  │     │  └─ common
│  │  │  │  │     │  │  │     │     └─ cpp
│  │  │  │  │     │  │  │     │        └─ react
│  │  │  │  │     │  │  │     │           └─ renderer
│  │  │  │  │     │  │  │     │              └─ components
│  │  │  │  │     │  │  │     │                 └─ rnscreens
│  │  │  │  │     │  │  │     │                    ├─ RNSBottomTabsShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSBottomTabsState.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSFullWindowOverlayShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSModalScreenShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSSafeAreaViewShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSSafeAreaViewState.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenShadowNodeCommitHook.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenState.cpp.o
│  │  │  │  │     │  │  │     │                    └─ RNSSplitViewScreenShadowNode.cpp.o
│  │  │  │  │     │  │  │     └─ rnscreens.cpp.o
│  │  │  │  │     │  │  └─ cmake_install.cmake
│  │  │  │  │     │  ├─ safeareacontext_autolinked_build
│  │  │  │  │     │  │  ├─ CMakeFiles
│  │  │  │  │     │  │  │  └─ react_codegen_safeareacontext.dir
│  │  │  │  │     │  │  │     ├─ 0e49ac85b05e7ddf6375e1c436fc8aef
│  │  │  │  │     │  │  │     │  └─ renderer
│  │  │  │  │     │  │  │     │     └─ components
│  │  │  │  │     │  │  │     │        └─ safeareacontext
│  │  │  │  │     │  │  │     │           └─ RNCSafeAreaViewShadowNode.cpp.o
│  │  │  │  │     │  │  │     ├─ 124c7d4c3acd557c9f87c986e03dd632
│  │  │  │  │     │  │  │     │  └─ react
│  │  │  │  │     │  │  │     │     └─ renderer
│  │  │  │  │     │  │  │     │        └─ components
│  │  │  │  │     │  │  │     │           └─ safeareacontext
│  │  │  │  │     │  │  │     │              └─ ComponentDescriptors.cpp.o
│  │  │  │  │     │  │  │     ├─ 1972e20916359ea6d6ae1f8736cca32c
│  │  │  │  │     │  │  │     │  └─ codegen
│  │  │  │  │     │  │  │     │     └─ jni
│  │  │  │  │     │  │  │     │        └─ react
│  │  │  │  │     │  │  │     │           └─ renderer
│  │  │  │  │     │  │  │     │              └─ components
│  │  │  │  │     │  │  │     │                 └─ safeareacontext
│  │  │  │  │     │  │  │     │                    ├─ Props.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ ShadowNodes.cpp.o
│  │  │  │  │     │  │  │     │                    └─ States.cpp.o
│  │  │  │  │     │  │  │     ├─ 77420e23be139ecce1724dc0a5da06df
│  │  │  │  │     │  │  │     │  └─ build
│  │  │  │  │     │  │  │     │     └─ generated
│  │  │  │  │     │  │  │     │        └─ source
│  │  │  │  │     │  │  │     │           └─ codegen
│  │  │  │  │     │  │  │     │              └─ jni
│  │  │  │  │     │  │  │     │                 └─ safeareacontext-generated.cpp.o
│  │  │  │  │     │  │  │     ├─ d87e1821cdad3912734a481ac27bbb76
│  │  │  │  │     │  │  │     │  └─ jni
│  │  │  │  │     │  │  │     │     └─ react
│  │  │  │  │     │  │  │     │        └─ renderer
│  │  │  │  │     │  │  │     │           └─ components
│  │  │  │  │     │  │  │     │              └─ safeareacontext
│  │  │  │  │     │  │  │     │                 └─ EventEmitters.cpp.o
│  │  │  │  │     │  │  │     └─ fb5ac38f08ad5b7d4929cddea531befe
│  │  │  │  │     │  │  │        └─ react
│  │  │  │  │     │  │  │           └─ renderer
│  │  │  │  │     │  │  │              └─ components
│  │  │  │  │     │  │  │                 └─ safeareacontext
│  │  │  │  │     │  │  │                    └─ RNCSafeAreaViewState.cpp.o
│  │  │  │  │     │  │  └─ cmake_install.cmake
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
│  │  │  │  │     │  │           ├─ cache-v2-31f22a94d9fa1352bd83.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-1c0cb86361933e666284.json
│  │  │  │  │     │  │           ├─ codemodel-v2-7c548ad475b09b126a1d.json
│  │  │  │  │     │  │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-Debug-55a04f6f219d3deb2a20.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-Debug-a4e0ea570f902cb506eb.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-Debug-86be896f305891852d72.json
│  │  │  │  │     │  │           ├─ index-2026-02-01T03-42-56-0124.json
│  │  │  │  │     │  │           ├─ target-appmodules-Debug-c8c3855d7cdea395e5e9.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-Debug-8798adf7476171c18296.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-Debug-e0292b90d264a68d463b.json
│  │  │  │  │     │  │           └─ target-react_codegen_safeareacontext-Debug-c2b1a18404c7be1729f3.json
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
│  │  │  │  │     │  │  │  ├─ CMakeDetermineCompilerABI_C.bin
│  │  │  │  │     │  │  │  ├─ CMakeDetermineCompilerABI_CXX.bin
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
│  │  │  │  │     │  │  │  │  └─ FoodMate-AI
│  │  │  │  │     │  │  │  │     └─ frontend
│  │  │  │  │     │  │  │  │        └─ android
│  │  │  │  │     │  │  │  │           └─ app
│  │  │  │  │     │  │  │  │              └─ build
│  │  │  │  │     │  │  │  │                 └─ generated
│  │  │  │  │     │  │  │  │                    └─ autolinking
│  │  │  │  │     │  │  │  │                       └─ src
│  │  │  │  │     │  │  │  │                          └─ main
│  │  │  │  │     │  │  │  │                             └─ jni
│  │  │  │  │     │  │  │  │                                └─ autolinking.cpp.o
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
│  │  │  │  │     │  ├─ compile_commands.json.bin
│  │  │  │  │     │  ├─ configure_fingerprint.bin
│  │  │  │  │     │  ├─ metadata_generation_command.txt
│  │  │  │  │     │  ├─ prefab_config.json
│  │  │  │  │     │  ├─ rnasyncstorage_autolinked_build
│  │  │  │  │     │  │  ├─ CMakeFiles
│  │  │  │  │     │  │  │  └─ react_codegen_rnasyncstorage.dir
│  │  │  │  │     │  │  │     ├─ react
│  │  │  │  │     │  │  │     │  └─ renderer
│  │  │  │  │     │  │  │     │     └─ components
│  │  │  │  │     │  │  │     │        └─ rnasyncstorage
│  │  │  │  │     │  │  │     │           ├─ ComponentDescriptors.cpp.o
│  │  │  │  │     │  │  │     │           ├─ EventEmitters.cpp.o
│  │  │  │  │     │  │  │     │           ├─ Props.cpp.o
│  │  │  │  │     │  │  │     │           ├─ ShadowNodes.cpp.o
│  │  │  │  │     │  │  │     │           └─ States.cpp.o
│  │  │  │  │     │  │  │     └─ rnasyncstorage-generated.cpp.o
│  │  │  │  │     │  │  └─ cmake_install.cmake
│  │  │  │  │     │  ├─ rnscreens_autolinked_build
│  │  │  │  │     │  │  ├─ CMakeFiles
│  │  │  │  │     │  │  │  └─ react_codegen_rnscreens.dir
│  │  │  │  │     │  │  │     ├─ 31603061c81e473c9166c4093e20983a
│  │  │  │  │     │  │  │     │  └─ react
│  │  │  │  │     │  │  │     │     └─ renderer
│  │  │  │  │     │  │  │     │        └─ components
│  │  │  │  │     │  │  │     │           └─ rnscreens
│  │  │  │  │     │  │  │     │              ├─ RNSScreenStackHeaderConfigShadowNode.cpp.o
│  │  │  │  │     │  │  │     │              └─ RNSScreenStackHeaderSubviewShadowNode.cpp.o
│  │  │  │  │     │  │  │     ├─ 36cf9f0e480aa05943db0b714b614b15
│  │  │  │  │     │  │  │     │  └─ cpp
│  │  │  │  │     │  │  │     │     └─ react
│  │  │  │  │     │  │  │     │        └─ renderer
│  │  │  │  │     │  │  │     │           └─ components
│  │  │  │  │     │  │  │     │              └─ rnscreens
│  │  │  │  │     │  │  │     │                 ├─ RNSBottomTabsAccessoryShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                 ├─ RNSFullWindowOverlayShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                 ├─ RNSScreenShadowNodeCommitHook.cpp.o
│  │  │  │  │     │  │  │     │                 ├─ RNSScreenStackHeaderConfigState.cpp.o
│  │  │  │  │     │  │  │     │                 └─ RNSScreenStackHeaderSubviewState.cpp.o
│  │  │  │  │     │  │  │     ├─ 37efc60afa889a82314e403b216e3176
│  │  │  │  │     │  │  │     │  └─ generated
│  │  │  │  │     │  │  │     │     └─ source
│  │  │  │  │     │  │  │     │        └─ codegen
│  │  │  │  │     │  │  │     │           └─ jni
│  │  │  │  │     │  │  │     │              └─ react
│  │  │  │  │     │  │  │     │                 └─ renderer
│  │  │  │  │     │  │  │     │                    └─ components
│  │  │  │  │     │  │  │     │                       └─ rnscreens
│  │  │  │  │     │  │  │     │                          ├─ Props.cpp.o
│  │  │  │  │     │  │  │     │                          └─ States.cpp.o
│  │  │  │  │     │  │  │     ├─ 748b873697020796c492ccd4c70f19d6
│  │  │  │  │     │  │  │     │  └─ source
│  │  │  │  │     │  │  │     │     └─ codegen
│  │  │  │  │     │  │  │     │        └─ jni
│  │  │  │  │     │  │  │     │           └─ react
│  │  │  │  │     │  │  │     │              └─ renderer
│  │  │  │  │     │  │  │     │                 └─ components
│  │  │  │  │     │  │  │     │                    └─ rnscreens
│  │  │  │  │     │  │  │     │                       ├─ ComponentDescriptors.cpp.o
│  │  │  │  │     │  │  │     │                       ├─ EventEmitters.cpp.o
│  │  │  │  │     │  │  │     │                       └─ ShadowNodes.cpp.o
│  │  │  │  │     │  │  │     ├─ e49474591d9d791fd9363ed48959f8c5
│  │  │  │  │     │  │  │     │  └─ common
│  │  │  │  │     │  │  │     │     └─ cpp
│  │  │  │  │     │  │  │     │        └─ react
│  │  │  │  │     │  │  │     │           └─ renderer
│  │  │  │  │     │  │  │     │              └─ components
│  │  │  │  │     │  │  │     │                 └─ rnscreens
│  │  │  │  │     │  │  │     │                    ├─ RNSBottomTabsShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSBottomTabsState.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSModalScreenShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSSafeAreaViewShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSSafeAreaViewState.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenState.cpp.o
│  │  │  │  │     │  │  │     │                    └─ RNSSplitViewScreenShadowNode.cpp.o
│  │  │  │  │     │  │  │     └─ rnscreens.cpp.o
│  │  │  │  │     │  │  └─ cmake_install.cmake
│  │  │  │  │     │  ├─ safeareacontext_autolinked_build
│  │  │  │  │     │  │  ├─ CMakeFiles
│  │  │  │  │     │  │  │  └─ react_codegen_safeareacontext.dir
│  │  │  │  │     │  │  │     ├─ 0e49ac85b05e7ddf6375e1c436fc8aef
│  │  │  │  │     │  │  │     │  └─ renderer
│  │  │  │  │     │  │  │     │     └─ components
│  │  │  │  │     │  │  │     │        └─ safeareacontext
│  │  │  │  │     │  │  │     │           └─ RNCSafeAreaViewShadowNode.cpp.o
│  │  │  │  │     │  │  │     ├─ 124c7d4c3acd557c9f87c986e03dd632
│  │  │  │  │     │  │  │     │  └─ react
│  │  │  │  │     │  │  │     │     └─ renderer
│  │  │  │  │     │  │  │     │        └─ components
│  │  │  │  │     │  │  │     │           └─ safeareacontext
│  │  │  │  │     │  │  │     │              └─ ComponentDescriptors.cpp.o
│  │  │  │  │     │  │  │     ├─ 1972e20916359ea6d6ae1f8736cca32c
│  │  │  │  │     │  │  │     │  └─ codegen
│  │  │  │  │     │  │  │     │     └─ jni
│  │  │  │  │     │  │  │     │        └─ react
│  │  │  │  │     │  │  │     │           └─ renderer
│  │  │  │  │     │  │  │     │              └─ components
│  │  │  │  │     │  │  │     │                 └─ safeareacontext
│  │  │  │  │     │  │  │     │                    ├─ Props.cpp.o
│  │  │  │  │     │  │  │     │                    └─ States.cpp.o
│  │  │  │  │     │  │  │     ├─ 77420e23be139ecce1724dc0a5da06df
│  │  │  │  │     │  │  │     │  └─ build
│  │  │  │  │     │  │  │     │     └─ generated
│  │  │  │  │     │  │  │     │        └─ source
│  │  │  │  │     │  │  │     │           └─ codegen
│  │  │  │  │     │  │  │     │              └─ jni
│  │  │  │  │     │  │  │     │                 └─ safeareacontext-generated.cpp.o
│  │  │  │  │     │  │  │     ├─ d87e1821cdad3912734a481ac27bbb76
│  │  │  │  │     │  │  │     │  └─ jni
│  │  │  │  │     │  │  │     │     └─ react
│  │  │  │  │     │  │  │     │        └─ renderer
│  │  │  │  │     │  │  │     │           └─ components
│  │  │  │  │     │  │  │     │              └─ safeareacontext
│  │  │  │  │     │  │  │     │                 ├─ EventEmitters.cpp.o
│  │  │  │  │     │  │  │     │                 └─ ShadowNodes.cpp.o
│  │  │  │  │     │  │  │     └─ fb5ac38f08ad5b7d4929cddea531befe
│  │  │  │  │     │  │  │        └─ react
│  │  │  │  │     │  │  │           └─ renderer
│  │  │  │  │     │  │  │              └─ components
│  │  │  │  │     │  │  │                 └─ safeareacontext
│  │  │  │  │     │  │  │                    └─ RNCSafeAreaViewState.cpp.o
│  │  │  │  │     │  │  └─ cmake_install.cmake
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
│  │  │  │  │     │  │           ├─ cache-v2-fa333b71df56bade2089.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-6278fe6bcd7a23876659.json
│  │  │  │  │     │  │           ├─ codemodel-v2-8d86b10953b1b1f034bf.json
│  │  │  │  │     │  │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-Debug-55a04f6f219d3deb2a20.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-Debug-a4e0ea570f902cb506eb.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-Debug-86be896f305891852d72.json
│  │  │  │  │     │  │           ├─ index-2026-02-01T03-43-16-0836.json
│  │  │  │  │     │  │           ├─ target-appmodules-Debug-81a1cfea7864345f6244.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-Debug-8f4321068a16ee9ce423.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-Debug-8ac750d0522a975b4ca9.json
│  │  │  │  │     │  │           └─ target-react_codegen_safeareacontext-Debug-b177917cfeac7ee73551.json
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
│  │  │  │  │     │  │  │  ├─ CMakeDetermineCompilerABI_C.bin
│  │  │  │  │     │  │  │  ├─ CMakeDetermineCompilerABI_CXX.bin
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
│  │  │  │  │     │  │  │  │  └─ FoodMate-AI
│  │  │  │  │     │  │  │  │     └─ frontend
│  │  │  │  │     │  │  │  │        └─ android
│  │  │  │  │     │  │  │  │           └─ app
│  │  │  │  │     │  │  │  │              └─ build
│  │  │  │  │     │  │  │  │                 └─ generated
│  │  │  │  │     │  │  │  │                    └─ autolinking
│  │  │  │  │     │  │  │  │                       └─ src
│  │  │  │  │     │  │  │  │                          └─ main
│  │  │  │  │     │  │  │  │                             └─ jni
│  │  │  │  │     │  │  │  │                                └─ autolinking.cpp.o
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
│  │  │  │  │     │  ├─ compile_commands.json.bin
│  │  │  │  │     │  ├─ configure_fingerprint.bin
│  │  │  │  │     │  ├─ metadata_generation_command.txt
│  │  │  │  │     │  ├─ prefab_config.json
│  │  │  │  │     │  ├─ rnasyncstorage_autolinked_build
│  │  │  │  │     │  │  ├─ CMakeFiles
│  │  │  │  │     │  │  │  └─ react_codegen_rnasyncstorage.dir
│  │  │  │  │     │  │  │     ├─ react
│  │  │  │  │     │  │  │     │  └─ renderer
│  │  │  │  │     │  │  │     │     └─ components
│  │  │  │  │     │  │  │     │        └─ rnasyncstorage
│  │  │  │  │     │  │  │     │           ├─ ComponentDescriptors.cpp.o
│  │  │  │  │     │  │  │     │           ├─ EventEmitters.cpp.o
│  │  │  │  │     │  │  │     │           ├─ Props.cpp.o
│  │  │  │  │     │  │  │     │           ├─ ShadowNodes.cpp.o
│  │  │  │  │     │  │  │     │           └─ States.cpp.o
│  │  │  │  │     │  │  │     └─ rnasyncstorage-generated.cpp.o
│  │  │  │  │     │  │  └─ cmake_install.cmake
│  │  │  │  │     │  ├─ rnscreens_autolinked_build
│  │  │  │  │     │  │  ├─ CMakeFiles
│  │  │  │  │     │  │  │  └─ react_codegen_rnscreens.dir
│  │  │  │  │     │  │  │     ├─ 2f8244017a17c707b12caa3e19beb35e
│  │  │  │  │     │  │  │     │  └─ react-native-screens
│  │  │  │  │     │  │  │     │     └─ common
│  │  │  │  │     │  │  │     │        └─ cpp
│  │  │  │  │     │  │  │     │           └─ react
│  │  │  │  │     │  │  │     │              └─ renderer
│  │  │  │  │     │  │  │     │                 └─ components
│  │  │  │  │     │  │  │     │                    └─ rnscreens
│  │  │  │  │     │  │  │     │                       └─ RNSScreenState.cpp.o
│  │  │  │  │     │  │  │     ├─ 36cf9f0e480aa05943db0b714b614b15
│  │  │  │  │     │  │  │     │  └─ cpp
│  │  │  │  │     │  │  │     │     └─ react
│  │  │  │  │     │  │  │     │        └─ renderer
│  │  │  │  │     │  │  │     │           └─ components
│  │  │  │  │     │  │  │     │              └─ rnscreens
│  │  │  │  │     │  │  │     │                 └─ RNSScreenStackHeaderSubviewShadowNode.cpp.o
│  │  │  │  │     │  │  │     ├─ 37efc60afa889a82314e403b216e3176
│  │  │  │  │     │  │  │     │  └─ generated
│  │  │  │  │     │  │  │     │     └─ source
│  │  │  │  │     │  │  │     │        └─ codegen
│  │  │  │  │     │  │  │     │           └─ jni
│  │  │  │  │     │  │  │     │              └─ react
│  │  │  │  │     │  │  │     │                 └─ renderer
│  │  │  │  │     │  │  │     │                    └─ components
│  │  │  │  │     │  │  │     │                       └─ rnscreens
│  │  │  │  │     │  │  │     │                          └─ EventEmitters.cpp.o
│  │  │  │  │     │  │  │     ├─ 748b873697020796c492ccd4c70f19d6
│  │  │  │  │     │  │  │     │  └─ source
│  │  │  │  │     │  │  │     │     └─ codegen
│  │  │  │  │     │  │  │     │        └─ jni
│  │  │  │  │     │  │  │     │           └─ react
│  │  │  │  │     │  │  │     │              └─ renderer
│  │  │  │  │     │  │  │     │                 └─ components
│  │  │  │  │     │  │  │     │                    └─ rnscreens
│  │  │  │  │     │  │  │     │                       └─ ComponentDescriptors.cpp.o
│  │  │  │  │     │  │  │     ├─ a2b3b09d970db5d34bce8cebe852fc36
│  │  │  │  │     │  │  │     │  └─ build
│  │  │  │  │     │  │  │     │     └─ generated
│  │  │  │  │     │  │  │     │        └─ source
│  │  │  │  │     │  │  │     │           └─ codegen
│  │  │  │  │     │  │  │     │              └─ jni
│  │  │  │  │     │  │  │     │                 └─ react
│  │  │  │  │     │  │  │     │                    └─ renderer
│  │  │  │  │     │  │  │     │                       └─ components
│  │  │  │  │     │  │  │     │                          └─ rnscreens
│  │  │  │  │     │  │  │     │                             ├─ Props.cpp.o
│  │  │  │  │     │  │  │     │                             ├─ ShadowNodes.cpp.o
│  │  │  │  │     │  │  │     │                             └─ States.cpp.o
│  │  │  │  │     │  │  │     ├─ e49474591d9d791fd9363ed48959f8c5
│  │  │  │  │     │  │  │     │  └─ common
│  │  │  │  │     │  │  │     │     └─ cpp
│  │  │  │  │     │  │  │     │        └─ react
│  │  │  │  │     │  │  │     │           └─ renderer
│  │  │  │  │     │  │  │     │              └─ components
│  │  │  │  │     │  │  │     │                 └─ rnscreens
│  │  │  │  │     │  │  │     │                    ├─ RNSBottomTabsAccessoryShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSBottomTabsShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSBottomTabsState.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSFullWindowOverlayShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSModalScreenShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSSafeAreaViewShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSSafeAreaViewState.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenShadowNodeCommitHook.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenStackHeaderConfigShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenStackHeaderConfigState.cpp.o
│  │  │  │  │     │  │  │     │                    ├─ RNSScreenStackHeaderSubviewState.cpp.o
│  │  │  │  │     │  │  │     │                    └─ RNSSplitViewScreenShadowNode.cpp.o
│  │  │  │  │     │  │  │     └─ rnscreens.cpp.o
│  │  │  │  │     │  │  └─ cmake_install.cmake
│  │  │  │  │     │  ├─ safeareacontext_autolinked_build
│  │  │  │  │     │  │  ├─ CMakeFiles
│  │  │  │  │     │  │  │  └─ react_codegen_safeareacontext.dir
│  │  │  │  │     │  │  │     ├─ 1972e20916359ea6d6ae1f8736cca32c
│  │  │  │  │     │  │  │     │  └─ codegen
│  │  │  │  │     │  │  │     │     └─ jni
│  │  │  │  │     │  │  │     │        └─ react
│  │  │  │  │     │  │  │     │           └─ renderer
│  │  │  │  │     │  │  │     │              └─ components
│  │  │  │  │     │  │  │     │                 └─ safeareacontext
│  │  │  │  │     │  │  │     │                    ├─ EventEmitters.cpp.o
│  │  │  │  │     │  │  │     │                    └─ ShadowNodes.cpp.o
│  │  │  │  │     │  │  │     ├─ 2f9bb41d55fe77c9720d4f6eee646df5
│  │  │  │  │     │  │  │     │  └─ cpp
│  │  │  │  │     │  │  │     │     └─ react
│  │  │  │  │     │  │  │     │        └─ renderer
│  │  │  │  │     │  │  │     │           └─ components
│  │  │  │  │     │  │  │     │              └─ safeareacontext
│  │  │  │  │     │  │  │     │                 ├─ RNCSafeAreaViewShadowNode.cpp.o
│  │  │  │  │     │  │  │     │                 └─ RNCSafeAreaViewState.cpp.o
│  │  │  │  │     │  │  │     ├─ c859ef8839fd5c0de912ccff18512963
│  │  │  │  │     │  │  │     │  └─ source
│  │  │  │  │     │  │  │     │     └─ codegen
│  │  │  │  │     │  │  │     │        └─ jni
│  │  │  │  │     │  │  │     │           └─ react
│  │  │  │  │     │  │  │     │              └─ renderer
│  │  │  │  │     │  │  │     │                 └─ components
│  │  │  │  │     │  │  │     │                    └─ safeareacontext
│  │  │  │  │     │  │  │     │                       ├─ Props.cpp.o
│  │  │  │  │     │  │  │     │                       └─ States.cpp.o
│  │  │  │  │     │  │  │     ├─ d87e1821cdad3912734a481ac27bbb76
│  │  │  │  │     │  │  │     │  └─ jni
│  │  │  │  │     │  │  │     │     └─ react
│  │  │  │  │     │  │  │     │        └─ renderer
│  │  │  │  │     │  │  │     │           └─ components
│  │  │  │  │     │  │  │     │              └─ safeareacontext
│  │  │  │  │     │  │  │     │                 └─ ComponentDescriptors.cpp.o
│  │  │  │  │     │  │  │     └─ fc2eb9754eff2ed3ca0e6e372fe87281
│  │  │  │  │     │  │  │        └─ android
│  │  │  │  │     │  │  │           └─ build
│  │  │  │  │     │  │  │              └─ generated
│  │  │  │  │     │  │  │                 └─ source
│  │  │  │  │     │  │  │                    └─ codegen
│  │  │  │  │     │  │  │                       └─ jni
│  │  │  │  │     │  │  │                          └─ safeareacontext-generated.cpp.o
│  │  │  │  │     │  │  └─ cmake_install.cmake
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
│  │  │  │  │        │           ├─ cache-v2-067f13558d9052d87b41.json
│  │  │  │  │        │           ├─ cmakeFiles-v1-65c194e1f212d8eb3d16.json
│  │  │  │  │        │           ├─ codemodel-v2-fe7510cbf17c1316ebcf.json
│  │  │  │  │        │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │        │           ├─ directory-rnasyncstorage_autolinked_build-Debug-55a04f6f219d3deb2a20.json
│  │  │  │  │        │           ├─ directory-rnscreens_autolinked_build-Debug-a4e0ea570f902cb506eb.json
│  │  │  │  │        │           ├─ directory-safeareacontext_autolinked_build-Debug-86be896f305891852d72.json
│  │  │  │  │        │           ├─ index-2026-02-01T03-43-38-0691.json
│  │  │  │  │        │           ├─ target-appmodules-Debug-493445c06ea1093cd425.json
│  │  │  │  │        │           ├─ target-react_codegen_rnasyncstorage-Debug-8f4321068a16ee9ce423.json
│  │  │  │  │        │           ├─ target-react_codegen_rnscreens-Debug-0dbfa9ffd0b51e96de7d.json
│  │  │  │  │        │           └─ target-react_codegen_safeareacontext-Debug-a2e29eb7088444c1397c.json
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
│  │  │  │  │        │  │  ├─ CMakeDetermineCompilerABI_C.bin
│  │  │  │  │        │  │  ├─ CMakeDetermineCompilerABI_CXX.bin
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
│  │  │  │  │        │  │  │  └─ FoodMate-AI
│  │  │  │  │        │  │  │     └─ frontend
│  │  │  │  │        │  │  │        └─ android
│  │  │  │  │        │  │  │           └─ app
│  │  │  │  │        │  │  │              └─ build
│  │  │  │  │        │  │  │                 └─ generated
│  │  │  │  │        │  │  │                    └─ autolinking
│  │  │  │  │        │  │  │                       └─ src
│  │  │  │  │        │  │  │                          └─ main
│  │  │  │  │        │  │  │                             └─ jni
│  │  │  │  │        │  │  │                                └─ autolinking.cpp.o
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
│  │  │  │  │        ├─ compile_commands.json.bin
│  │  │  │  │        ├─ configure_fingerprint.bin
│  │  │  │  │        ├─ metadata_generation_command.txt
│  │  │  │  │        ├─ prefab_config.json
│  │  │  │  │        ├─ rnasyncstorage_autolinked_build
│  │  │  │  │        │  ├─ CMakeFiles
│  │  │  │  │        │  │  └─ react_codegen_rnasyncstorage.dir
│  │  │  │  │        │  │     ├─ react
│  │  │  │  │        │  │     │  └─ renderer
│  │  │  │  │        │  │     │     └─ components
│  │  │  │  │        │  │     │        └─ rnasyncstorage
│  │  │  │  │        │  │     │           ├─ ComponentDescriptors.cpp.o
│  │  │  │  │        │  │     │           ├─ EventEmitters.cpp.o
│  │  │  │  │        │  │     │           ├─ Props.cpp.o
│  │  │  │  │        │  │     │           ├─ ShadowNodes.cpp.o
│  │  │  │  │        │  │     │           └─ States.cpp.o
│  │  │  │  │        │  │     └─ rnasyncstorage-generated.cpp.o
│  │  │  │  │        │  └─ cmake_install.cmake
│  │  │  │  │        ├─ rnscreens_autolinked_build
│  │  │  │  │        │  ├─ CMakeFiles
│  │  │  │  │        │  │  └─ react_codegen_rnscreens.dir
│  │  │  │  │        │  │     ├─ 36cf9f0e480aa05943db0b714b614b15
│  │  │  │  │        │  │     │  └─ cpp
│  │  │  │  │        │  │     │     └─ react
│  │  │  │  │        │  │     │        └─ renderer
│  │  │  │  │        │  │     │           └─ components
│  │  │  │  │        │  │     │              └─ rnscreens
│  │  │  │  │        │  │     │                 ├─ RNSScreenStackHeaderConfigShadowNode.cpp.o
│  │  │  │  │        │  │     │                 └─ RNSScreenStackHeaderSubviewShadowNode.cpp.o
│  │  │  │  │        │  │     ├─ 37efc60afa889a82314e403b216e3176
│  │  │  │  │        │  │     │  └─ generated
│  │  │  │  │        │  │     │     └─ source
│  │  │  │  │        │  │     │        └─ codegen
│  │  │  │  │        │  │     │           └─ jni
│  │  │  │  │        │  │     │              └─ react
│  │  │  │  │        │  │     │                 └─ renderer
│  │  │  │  │        │  │     │                    └─ components
│  │  │  │  │        │  │     │                       └─ rnscreens
│  │  │  │  │        │  │     │                          ├─ EventEmitters.cpp.o
│  │  │  │  │        │  │     │                          └─ ShadowNodes.cpp.o
│  │  │  │  │        │  │     ├─ 748b873697020796c492ccd4c70f19d6
│  │  │  │  │        │  │     │  └─ source
│  │  │  │  │        │  │     │     └─ codegen
│  │  │  │  │        │  │     │        └─ jni
│  │  │  │  │        │  │     │           └─ react
│  │  │  │  │        │  │     │              └─ renderer
│  │  │  │  │        │  │     │                 └─ components
│  │  │  │  │        │  │     │                    └─ rnscreens
│  │  │  │  │        │  │     │                       └─ ComponentDescriptors.cpp.o
│  │  │  │  │        │  │     ├─ a2b3b09d970db5d34bce8cebe852fc36
│  │  │  │  │        │  │     │  └─ build
│  │  │  │  │        │  │     │     └─ generated
│  │  │  │  │        │  │     │        └─ source
│  │  │  │  │        │  │     │           └─ codegen
│  │  │  │  │        │  │     │              └─ jni
│  │  │  │  │        │  │     │                 └─ react
│  │  │  │  │        │  │     │                    └─ renderer
│  │  │  │  │        │  │     │                       └─ components
│  │  │  │  │        │  │     │                          └─ rnscreens
│  │  │  │  │        │  │     │                             ├─ Props.cpp.o
│  │  │  │  │        │  │     │                             └─ States.cpp.o
│  │  │  │  │        │  │     ├─ e49474591d9d791fd9363ed48959f8c5
│  │  │  │  │        │  │     │  └─ common
│  │  │  │  │        │  │     │     └─ cpp
│  │  │  │  │        │  │     │        └─ react
│  │  │  │  │        │  │     │           └─ renderer
│  │  │  │  │        │  │     │              └─ components
│  │  │  │  │        │  │     │                 └─ rnscreens
│  │  │  │  │        │  │     │                    ├─ RNSBottomTabsAccessoryShadowNode.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSBottomTabsShadowNode.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSBottomTabsState.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSFullWindowOverlayShadowNode.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSModalScreenShadowNode.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSSafeAreaViewShadowNode.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSSafeAreaViewState.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSScreenShadowNode.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSScreenShadowNodeCommitHook.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSScreenStackHeaderConfigState.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSScreenStackHeaderSubviewState.cpp.o
│  │  │  │  │        │  │     │                    ├─ RNSScreenState.cpp.o
│  │  │  │  │        │  │     │                    └─ RNSSplitViewScreenShadowNode.cpp.o
│  │  │  │  │        │  │     └─ rnscreens.cpp.o
│  │  │  │  │        │  └─ cmake_install.cmake
│  │  │  │  │        ├─ safeareacontext_autolinked_build
│  │  │  │  │        │  ├─ CMakeFiles
│  │  │  │  │        │  │  └─ react_codegen_safeareacontext.dir
│  │  │  │  │        │  │     ├─ 1972e20916359ea6d6ae1f8736cca32c
│  │  │  │  │        │  │     │  └─ codegen
│  │  │  │  │        │  │     │     └─ jni
│  │  │  │  │        │  │     │        └─ react
│  │  │  │  │        │  │     │           └─ renderer
│  │  │  │  │        │  │     │              └─ components
│  │  │  │  │        │  │     │                 └─ safeareacontext
│  │  │  │  │        │  │     │                    ├─ EventEmitters.cpp.o
│  │  │  │  │        │  │     │                    └─ ShadowNodes.cpp.o
│  │  │  │  │        │  │     ├─ 2f9bb41d55fe77c9720d4f6eee646df5
│  │  │  │  │        │  │     │  └─ cpp
│  │  │  │  │        │  │     │     └─ react
│  │  │  │  │        │  │     │        └─ renderer
│  │  │  │  │        │  │     │           └─ components
│  │  │  │  │        │  │     │              └─ safeareacontext
│  │  │  │  │        │  │     │                 └─ RNCSafeAreaViewState.cpp.o
│  │  │  │  │        │  │     ├─ c859ef8839fd5c0de912ccff18512963
│  │  │  │  │        │  │     │  └─ source
│  │  │  │  │        │  │     │     └─ codegen
│  │  │  │  │        │  │     │        └─ jni
│  │  │  │  │        │  │     │           └─ react
│  │  │  │  │        │  │     │              └─ renderer
│  │  │  │  │        │  │     │                 └─ components
│  │  │  │  │        │  │     │                    └─ safeareacontext
│  │  │  │  │        │  │     │                       ├─ Props.cpp.o
│  │  │  │  │        │  │     │                       └─ States.cpp.o
│  │  │  │  │        │  │     ├─ d87e1821cdad3912734a481ac27bbb76
│  │  │  │  │        │  │     │  └─ jni
│  │  │  │  │        │  │     │     └─ react
│  │  │  │  │        │  │     │        └─ renderer
│  │  │  │  │        │  │     │           └─ components
│  │  │  │  │        │  │     │              └─ safeareacontext
│  │  │  │  │        │  │     │                 └─ ComponentDescriptors.cpp.o
│  │  │  │  │        │  │     ├─ fb5ac38f08ad5b7d4929cddea531befe
│  │  │  │  │        │  │     │  └─ react
│  │  │  │  │        │  │     │     └─ renderer
│  │  │  │  │        │  │     │        └─ components
│  │  │  │  │        │  │     │           └─ safeareacontext
│  │  │  │  │        │  │     │              └─ RNCSafeAreaViewShadowNode.cpp.o
│  │  │  │  │        │  │     └─ fc2eb9754eff2ed3ca0e6e372fe87281
│  │  │  │  │        │  │        └─ android
│  │  │  │  │        │  │           └─ build
│  │  │  │  │        │  │              └─ generated
│  │  │  │  │        │  │                 └─ source
│  │  │  │  │        │  │                    └─ codegen
│  │  │  │  │        │  │                       └─ jni
│  │  │  │  │        │  │                          └─ safeareacontext-generated.cpp.o
│  │  │  │  │        │  └─ cmake_install.cmake
│  │  │  │  │        └─ symbol_folder_index.txt
│  │  │  │  └─ tools
│  │  │  │     └─ debug
│  │  │  │        ├─ arm64-v8a
│  │  │  │        │  └─ compile_commands.json
│  │  │  │        ├─ armeabi-v7a
│  │  │  │        │  └─ compile_commands.json
│  │  │  │        ├─ x86
│  │  │  │        │  └─ compile_commands.json
│  │  │  │        └─ x86_64
│  │  │  │           └─ compile_commands.json
│  │  │  ├─ build
│  │  │  │  ├─ generated
│  │  │  │  │  ├─ ap_generated_sources
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ out
│  │  │  │  │  ├─ autolinking
│  │  │  │  │  │  └─ src
│  │  │  │  │  │     └─ main
│  │  │  │  │  │        ├─ java
│  │  │  │  │  │        │  └─ com
│  │  │  │  │  │        │     └─ facebook
│  │  │  │  │  │        │        └─ react
│  │  │  │  │  │        │           ├─ PackageList.java
│  │  │  │  │  │        │           └─ ReactNativeApplicationEntryPoint.java
│  │  │  │  │  │        └─ jni
│  │  │  │  │  │           ├─ Android-autolinking.cmake
│  │  │  │  │  │           ├─ autolinking.cpp
│  │  │  │  │  │           └─ autolinking.h
│  │  │  │  │  ├─ res
│  │  │  │  │  │  ├─ pngs
│  │  │  │  │  │  │  └─ debug
│  │  │  │  │  │  └─ resValues
│  │  │  │  │  │     └─ debug
│  │  │  │  │  │        └─ values
│  │  │  │  │  │           └─ gradleResValues.xml
│  │  │  │  │  └─ source
│  │  │  │  │     └─ buildConfig
│  │  │  │  │        └─ debug
│  │  │  │  │           └─ com
│  │  │  │  │              └─ nutrivisionmobile
│  │  │  │  │                 └─ BuildConfig.java
│  │  │  │  ├─ intermediates
│  │  │  │  │  ├─ aar_metadata_check
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ checkDebugAarMetadata
│  │  │  │  │  ├─ annotation_processor_list
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ javaPreCompileDebug
│  │  │  │  │  │        └─ annotationProcessors.json
│  │  │  │  │  ├─ apk_ide_redirect_file
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ createDebugApkListingFileRedirect
│  │  │  │  │  │        └─ redirect.txt
│  │  │  │  │  ├─ app_metadata
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ writeDebugAppMetadata
│  │  │  │  │  │        └─ app-metadata.properties
│  │  │  │  │  ├─ assets
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugAssets
│  │  │  │  │  ├─ compatible_screen_manifest
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ createDebugCompatibleScreenManifests
│  │  │  │  │  │        └─ output-metadata.json
│  │  │  │  │  ├─ compile_and_runtime_not_namespaced_r_class_jar
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugResources
│  │  │  │  │  │        └─ R.jar
│  │  │  │  │  ├─ compressed_assets
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ compressDebugAssets
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ cxx
│  │  │  │  │  │  └─ Debug
│  │  │  │  │  │     └─ 4l2o235r
│  │  │  │  │  │        ├─ logs
│  │  │  │  │  │        │  ├─ arm64-v8a
│  │  │  │  │  │        │  │  ├─ build_command_targets.bat
│  │  │  │  │  │        │  │  ├─ build_model.json
│  │  │  │  │  │        │  │  ├─ build_stderr_targets.txt
│  │  │  │  │  │        │  │  ├─ build_stdout_targets.txt
│  │  │  │  │  │        │  │  ├─ configure_command.bat
│  │  │  │  │  │        │  │  ├─ configure_stderr.txt
│  │  │  │  │  │        │  │  ├─ configure_stdout.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1085_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_145_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1490_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1728_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1940_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_2162_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_2399_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_3013_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_3261_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_405_timing.txt
│  │  │  │  │  │        │  │  ├─ metadata_generation_record.json
│  │  │  │  │  │        │  │  ├─ prefab_command.bat
│  │  │  │  │  │        │  │  ├─ prefab_stderr.txt
│  │  │  │  │  │        │  │  └─ prefab_stdout.txt
│  │  │  │  │  │        │  ├─ armeabi-v7a
│  │  │  │  │  │        │  │  ├─ build_command_targets.bat
│  │  │  │  │  │        │  │  ├─ build_model.json
│  │  │  │  │  │        │  │  ├─ build_stderr_targets.txt
│  │  │  │  │  │        │  │  ├─ build_stdout_targets.txt
│  │  │  │  │  │        │  │  ├─ configure_command.bat
│  │  │  │  │  │        │  │  ├─ configure_stderr.txt
│  │  │  │  │  │        │  │  ├─ configure_stdout.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1089_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_148_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1490_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1728_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1940_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_2175_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_2394_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_3026_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_3254_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_405_timing.txt
│  │  │  │  │  │        │  │  ├─ metadata_generation_record.json
│  │  │  │  │  │        │  │  ├─ prefab_command.bat
│  │  │  │  │  │        │  │  ├─ prefab_stderr.txt
│  │  │  │  │  │        │  │  └─ prefab_stdout.txt
│  │  │  │  │  │        │  ├─ x86
│  │  │  │  │  │        │  │  ├─ build_command_targets.bat
│  │  │  │  │  │        │  │  ├─ build_model.json
│  │  │  │  │  │        │  │  ├─ build_stderr_targets.txt
│  │  │  │  │  │        │  │  ├─ build_stdout_targets.txt
│  │  │  │  │  │        │  │  ├─ configure_command.bat
│  │  │  │  │  │        │  │  ├─ configure_stderr.txt
│  │  │  │  │  │        │  │  ├─ configure_stdout.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1098_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_148_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1492_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1728_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_1951_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_2175_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_2393_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_3012_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_3251_timing.txt
│  │  │  │  │  │        │  │  ├─ generate_cxx_metadata_406_timing.txt
│  │  │  │  │  │        │  │  ├─ metadata_generation_record.json
│  │  │  │  │  │        │  │  ├─ prefab_command.bat
│  │  │  │  │  │        │  │  ├─ prefab_stderr.txt
│  │  │  │  │  │        │  │  └─ prefab_stdout.txt
│  │  │  │  │  │        │  └─ x86_64
│  │  │  │  │  │        │     ├─ build_command_targets.bat
│  │  │  │  │  │        │     ├─ build_model.json
│  │  │  │  │  │        │     ├─ build_stderr_targets.txt
│  │  │  │  │  │        │     ├─ build_stdout_targets.txt
│  │  │  │  │  │        │     ├─ configure_command.bat
│  │  │  │  │  │        │     ├─ configure_stderr.txt
│  │  │  │  │  │        │     ├─ configure_stdout.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_1086_timing.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_1492_timing.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_150_timing.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_1728_timing.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_1951_timing.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_2170_timing.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_2393_timing.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_3012_timing.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_3251_timing.txt
│  │  │  │  │  │        │     ├─ generate_cxx_metadata_406_timing.txt
│  │  │  │  │  │        │     ├─ metadata_generation_record.json
│  │  │  │  │  │        │     ├─ prefab_command.bat
│  │  │  │  │  │        │     ├─ prefab_stderr.txt
│  │  │  │  │  │        │     └─ prefab_stdout.txt
│  │  │  │  │  │        └─ obj
│  │  │  │  │  │           ├─ arm64-v8a
│  │  │  │  │  │           │  ├─ libappmodules.so
│  │  │  │  │  │           │  ├─ libc++_shared.so
│  │  │  │  │  │           │  ├─ libfbjni.so
│  │  │  │  │  │           │  ├─ libjsi.so
│  │  │  │  │  │           │  ├─ libreactnative.so
│  │  │  │  │  │           │  ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │           │  └─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │           ├─ armeabi-v7a
│  │  │  │  │  │           │  ├─ libappmodules.so
│  │  │  │  │  │           │  ├─ libc++_shared.so
│  │  │  │  │  │           │  ├─ libfbjni.so
│  │  │  │  │  │           │  ├─ libjsi.so
│  │  │  │  │  │           │  ├─ libreactnative.so
│  │  │  │  │  │           │  ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │           │  └─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │           ├─ x86
│  │  │  │  │  │           │  ├─ libappmodules.so
│  │  │  │  │  │           │  ├─ libc++_shared.so
│  │  │  │  │  │           │  ├─ libfbjni.so
│  │  │  │  │  │           │  ├─ libjsi.so
│  │  │  │  │  │           │  ├─ libreactnative.so
│  │  │  │  │  │           │  ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │           │  └─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │           └─ x86_64
│  │  │  │  │  │              ├─ libappmodules.so
│  │  │  │  │  │              ├─ libc++_shared.so
│  │  │  │  │  │              ├─ libfbjni.so
│  │  │  │  │  │              ├─ libjsi.so
│  │  │  │  │  │              ├─ libreactnative.so
│  │  │  │  │  │              ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │              └─ libreact_codegen_safeareacontext.so
│  │  │  │  │  ├─ data_binding_layout_info_type_merge
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugResources
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ data_binding_layout_info_type_package
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ packageDebugResources
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ desugar_graph
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  │           ├─ currentProject
│  │  │  │  │  │           │  ├─ dirs_bucket_0
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ dirs_bucket_1
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ dirs_bucket_2
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ dirs_bucket_3
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ dirs_bucket_4
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ dirs_bucket_5
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ dirs_bucket_6
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ dirs_bucket_7
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ jar_18218e7a9e7f88fa61f888954e1938d0d5141862fa4b559bdfd8f199b88b0c34_bucket_0
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ jar_18218e7a9e7f88fa61f888954e1938d0d5141862fa4b559bdfd8f199b88b0c34_bucket_1
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ jar_18218e7a9e7f88fa61f888954e1938d0d5141862fa4b559bdfd8f199b88b0c34_bucket_2
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ jar_18218e7a9e7f88fa61f888954e1938d0d5141862fa4b559bdfd8f199b88b0c34_bucket_3
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ jar_18218e7a9e7f88fa61f888954e1938d0d5141862fa4b559bdfd8f199b88b0c34_bucket_4
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ jar_18218e7a9e7f88fa61f888954e1938d0d5141862fa4b559bdfd8f199b88b0c34_bucket_5
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  ├─ jar_18218e7a9e7f88fa61f888954e1938d0d5141862fa4b559bdfd8f199b88b0c34_bucket_6
│  │  │  │  │  │           │  │  └─ graph.bin
│  │  │  │  │  │           │  └─ jar_18218e7a9e7f88fa61f888954e1938d0d5141862fa4b559bdfd8f199b88b0c34_bucket_7
│  │  │  │  │  │           │     └─ graph.bin
│  │  │  │  │  │           ├─ externalLibs
│  │  │  │  │  │           ├─ mixedScopes
│  │  │  │  │  │           └─ otherProjects
│  │  │  │  │  ├─ dex
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     ├─ mergeExtDexDebug
│  │  │  │  │  │     │  ├─ classes.dex
│  │  │  │  │  │     │  └─ classes2.dex
│  │  │  │  │  │     ├─ mergeLibDexDebug
│  │  │  │  │  │     │  ├─ 0
│  │  │  │  │  │     │  ├─ 1
│  │  │  │  │  │     │  │  └─ classes.dex
│  │  │  │  │  │     │  ├─ 10
│  │  │  │  │  │     │  │  └─ classes.dex
│  │  │  │  │  │     │  ├─ 11
│  │  │  │  │  │     │  ├─ 12
│  │  │  │  │  │     │  ├─ 13
│  │  │  │  │  │     │  ├─ 14
│  │  │  │  │  │     │  │  └─ classes.dex
│  │  │  │  │  │     │  ├─ 15
│  │  │  │  │  │     │  │  └─ classes.dex
│  │  │  │  │  │     │  ├─ 2
│  │  │  │  │  │     │  │  └─ classes.dex
│  │  │  │  │  │     │  ├─ 3
│  │  │  │  │  │     │  │  └─ classes.dex
│  │  │  │  │  │     │  ├─ 4
│  │  │  │  │  │     │  ├─ 5
│  │  │  │  │  │     │  ├─ 6
│  │  │  │  │  │     │  │  └─ classes.dex
│  │  │  │  │  │     │  ├─ 7
│  │  │  │  │  │     │  │  └─ classes.dex
│  │  │  │  │  │     │  ├─ 8
│  │  │  │  │  │     │  └─ 9
│  │  │  │  │  │     │     └─ classes.dex
│  │  │  │  │  │     └─ mergeProjectDexDebug
│  │  │  │  │  │        ├─ 0
│  │  │  │  │  │        │  └─ classes.dex
│  │  │  │  │  │        ├─ 1
│  │  │  │  │  │        ├─ 10
│  │  │  │  │  │        ├─ 11
│  │  │  │  │  │        ├─ 12
│  │  │  │  │  │        ├─ 13
│  │  │  │  │  │        ├─ 14
│  │  │  │  │  │        │  └─ classes.dex
│  │  │  │  │  │        ├─ 15
│  │  │  │  │  │        ├─ 2
│  │  │  │  │  │        ├─ 3
│  │  │  │  │  │        ├─ 4
│  │  │  │  │  │        ├─ 5
│  │  │  │  │  │        ├─ 6
│  │  │  │  │  │        ├─ 7
│  │  │  │  │  │        │  └─ classes.dex
│  │  │  │  │  │        ├─ 8
│  │  │  │  │  │        └─ 9
│  │  │  │  │  ├─ dex_archive_input_jar_hashes
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ dex_number_of_buckets_file
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ duplicate_classes_check
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ checkDebugDuplicateClasses
│  │  │  │  │  ├─ external_file_lib_dex_archives
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ desugarDebugFileDependencies
│  │  │  │  │  ├─ external_libs_dex_archive
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ external_libs_dex_archive_with_artifact_transforms
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ global_synthetics_dex
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugGlobalSynthetics
│  │  │  │  │  ├─ global_synthetics_external_lib
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ global_synthetics_external_libs_artifact_transform
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ global_synthetics_file_lib
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ desugarDebugFileDependencies
│  │  │  │  │  ├─ global_synthetics_mixed_scope
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ global_synthetics_project
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ global_synthetics_subproject
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ incremental
│  │  │  │  │  │  ├─ debug
│  │  │  │  │  │  │  ├─ mergeDebugResources
│  │  │  │  │  │  │  │  ├─ compile-file-map.properties
│  │  │  │  │  │  │  │  ├─ merged.dir
│  │  │  │  │  │  │  │  │  ├─ values
│  │  │  │  │  │  │  │  │  │  └─ values.xml
│  │  │  │  │  │  │  │  │  ├─ values-af
│  │  │  │  │  │  │  │  │  │  └─ values-af.xml
│  │  │  │  │  │  │  │  │  ├─ values-am
│  │  │  │  │  │  │  │  │  │  └─ values-am.xml
│  │  │  │  │  │  │  │  │  ├─ values-ar
│  │  │  │  │  │  │  │  │  │  └─ values-ar.xml
│  │  │  │  │  │  │  │  │  ├─ values-as
│  │  │  │  │  │  │  │  │  │  └─ values-as.xml
│  │  │  │  │  │  │  │  │  ├─ values-az
│  │  │  │  │  │  │  │  │  │  └─ values-az.xml
│  │  │  │  │  │  │  │  │  ├─ values-b+es+419
│  │  │  │  │  │  │  │  │  │  └─ values-b+es+419.xml
│  │  │  │  │  │  │  │  │  ├─ values-b+sr+Latn
│  │  │  │  │  │  │  │  │  │  └─ values-b+sr+Latn.xml
│  │  │  │  │  │  │  │  │  ├─ values-be
│  │  │  │  │  │  │  │  │  │  └─ values-be.xml
│  │  │  │  │  │  │  │  │  ├─ values-bg
│  │  │  │  │  │  │  │  │  │  └─ values-bg.xml
│  │  │  │  │  │  │  │  │  ├─ values-bn
│  │  │  │  │  │  │  │  │  │  └─ values-bn.xml
│  │  │  │  │  │  │  │  │  ├─ values-bs
│  │  │  │  │  │  │  │  │  │  └─ values-bs.xml
│  │  │  │  │  │  │  │  │  ├─ values-ca
│  │  │  │  │  │  │  │  │  │  └─ values-ca.xml
│  │  │  │  │  │  │  │  │  ├─ values-cs
│  │  │  │  │  │  │  │  │  │  └─ values-cs.xml
│  │  │  │  │  │  │  │  │  ├─ values-da
│  │  │  │  │  │  │  │  │  │  └─ values-da.xml
│  │  │  │  │  │  │  │  │  ├─ values-de
│  │  │  │  │  │  │  │  │  │  └─ values-de.xml
│  │  │  │  │  │  │  │  │  ├─ values-el
│  │  │  │  │  │  │  │  │  │  └─ values-el.xml
│  │  │  │  │  │  │  │  │  ├─ values-en-rAU
│  │  │  │  │  │  │  │  │  │  └─ values-en-rAU.xml
│  │  │  │  │  │  │  │  │  ├─ values-en-rCA
│  │  │  │  │  │  │  │  │  │  └─ values-en-rCA.xml
│  │  │  │  │  │  │  │  │  ├─ values-en-rGB
│  │  │  │  │  │  │  │  │  │  └─ values-en-rGB.xml
│  │  │  │  │  │  │  │  │  ├─ values-en-rIN
│  │  │  │  │  │  │  │  │  │  └─ values-en-rIN.xml
│  │  │  │  │  │  │  │  │  ├─ values-en-rXC
│  │  │  │  │  │  │  │  │  │  └─ values-en-rXC.xml
│  │  │  │  │  │  │  │  │  ├─ values-es
│  │  │  │  │  │  │  │  │  │  └─ values-es.xml
│  │  │  │  │  │  │  │  │  ├─ values-es-rES
│  │  │  │  │  │  │  │  │  │  └─ values-es-rES.xml
│  │  │  │  │  │  │  │  │  ├─ values-es-rUS
│  │  │  │  │  │  │  │  │  │  └─ values-es-rUS.xml
│  │  │  │  │  │  │  │  │  ├─ values-et
│  │  │  │  │  │  │  │  │  │  └─ values-et.xml
│  │  │  │  │  │  │  │  │  ├─ values-eu
│  │  │  │  │  │  │  │  │  │  └─ values-eu.xml
│  │  │  │  │  │  │  │  │  ├─ values-fa
│  │  │  │  │  │  │  │  │  │  └─ values-fa.xml
│  │  │  │  │  │  │  │  │  ├─ values-fi
│  │  │  │  │  │  │  │  │  │  └─ values-fi.xml
│  │  │  │  │  │  │  │  │  ├─ values-fr
│  │  │  │  │  │  │  │  │  │  └─ values-fr.xml
│  │  │  │  │  │  │  │  │  ├─ values-fr-rCA
│  │  │  │  │  │  │  │  │  │  └─ values-fr-rCA.xml
│  │  │  │  │  │  │  │  │  ├─ values-gl
│  │  │  │  │  │  │  │  │  │  └─ values-gl.xml
│  │  │  │  │  │  │  │  │  ├─ values-gu
│  │  │  │  │  │  │  │  │  │  └─ values-gu.xml
│  │  │  │  │  │  │  │  │  ├─ values-h320dp-port-v13
│  │  │  │  │  │  │  │  │  │  └─ values-h320dp-port-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-h360dp-land-v13
│  │  │  │  │  │  │  │  │  │  └─ values-h360dp-land-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-h480dp-land-v13
│  │  │  │  │  │  │  │  │  │  └─ values-h480dp-land-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-h480dp-v13
│  │  │  │  │  │  │  │  │  │  └─ values-h480dp-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-h550dp-port-v13
│  │  │  │  │  │  │  │  │  │  └─ values-h550dp-port-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-h720dp-v13
│  │  │  │  │  │  │  │  │  │  └─ values-h720dp-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-hdpi-v4
│  │  │  │  │  │  │  │  │  │  └─ values-hdpi-v4.xml
│  │  │  │  │  │  │  │  │  ├─ values-hi
│  │  │  │  │  │  │  │  │  │  └─ values-hi.xml
│  │  │  │  │  │  │  │  │  ├─ values-hr
│  │  │  │  │  │  │  │  │  │  └─ values-hr.xml
│  │  │  │  │  │  │  │  │  ├─ values-hu
│  │  │  │  │  │  │  │  │  │  └─ values-hu.xml
│  │  │  │  │  │  │  │  │  ├─ values-hy
│  │  │  │  │  │  │  │  │  │  └─ values-hy.xml
│  │  │  │  │  │  │  │  │  ├─ values-in
│  │  │  │  │  │  │  │  │  │  └─ values-in.xml
│  │  │  │  │  │  │  │  │  ├─ values-is
│  │  │  │  │  │  │  │  │  │  └─ values-is.xml
│  │  │  │  │  │  │  │  │  ├─ values-it
│  │  │  │  │  │  │  │  │  │  └─ values-it.xml
│  │  │  │  │  │  │  │  │  ├─ values-iw
│  │  │  │  │  │  │  │  │  │  └─ values-iw.xml
│  │  │  │  │  │  │  │  │  ├─ values-ja
│  │  │  │  │  │  │  │  │  │  └─ values-ja.xml
│  │  │  │  │  │  │  │  │  ├─ values-ka
│  │  │  │  │  │  │  │  │  │  └─ values-ka.xml
│  │  │  │  │  │  │  │  │  ├─ values-kk
│  │  │  │  │  │  │  │  │  │  └─ values-kk.xml
│  │  │  │  │  │  │  │  │  ├─ values-km
│  │  │  │  │  │  │  │  │  │  └─ values-km.xml
│  │  │  │  │  │  │  │  │  ├─ values-kn
│  │  │  │  │  │  │  │  │  │  └─ values-kn.xml
│  │  │  │  │  │  │  │  │  ├─ values-ko
│  │  │  │  │  │  │  │  │  │  └─ values-ko.xml
│  │  │  │  │  │  │  │  │  ├─ values-ky
│  │  │  │  │  │  │  │  │  │  └─ values-ky.xml
│  │  │  │  │  │  │  │  │  ├─ values-land
│  │  │  │  │  │  │  │  │  │  └─ values-land.xml
│  │  │  │  │  │  │  │  │  ├─ values-large-v4
│  │  │  │  │  │  │  │  │  │  └─ values-large-v4.xml
│  │  │  │  │  │  │  │  │  ├─ values-ldltr-v21
│  │  │  │  │  │  │  │  │  │  └─ values-ldltr-v21.xml
│  │  │  │  │  │  │  │  │  ├─ values-ldrtl-v17
│  │  │  │  │  │  │  │  │  │  └─ values-ldrtl-v17.xml
│  │  │  │  │  │  │  │  │  ├─ values-lo
│  │  │  │  │  │  │  │  │  │  └─ values-lo.xml
│  │  │  │  │  │  │  │  │  ├─ values-lt
│  │  │  │  │  │  │  │  │  │  └─ values-lt.xml
│  │  │  │  │  │  │  │  │  ├─ values-lv
│  │  │  │  │  │  │  │  │  │  └─ values-lv.xml
│  │  │  │  │  │  │  │  │  ├─ values-mk
│  │  │  │  │  │  │  │  │  │  └─ values-mk.xml
│  │  │  │  │  │  │  │  │  ├─ values-ml
│  │  │  │  │  │  │  │  │  │  └─ values-ml.xml
│  │  │  │  │  │  │  │  │  ├─ values-mn
│  │  │  │  │  │  │  │  │  │  └─ values-mn.xml
│  │  │  │  │  │  │  │  │  ├─ values-mr
│  │  │  │  │  │  │  │  │  │  └─ values-mr.xml
│  │  │  │  │  │  │  │  │  ├─ values-ms
│  │  │  │  │  │  │  │  │  │  └─ values-ms.xml
│  │  │  │  │  │  │  │  │  ├─ values-my
│  │  │  │  │  │  │  │  │  │  └─ values-my.xml
│  │  │  │  │  │  │  │  │  ├─ values-nb
│  │  │  │  │  │  │  │  │  │  └─ values-nb.xml
│  │  │  │  │  │  │  │  │  ├─ values-ne
│  │  │  │  │  │  │  │  │  │  └─ values-ne.xml
│  │  │  │  │  │  │  │  │  ├─ values-night-v8
│  │  │  │  │  │  │  │  │  │  └─ values-night-v8.xml
│  │  │  │  │  │  │  │  │  ├─ values-nl
│  │  │  │  │  │  │  │  │  │  └─ values-nl.xml
│  │  │  │  │  │  │  │  │  ├─ values-or
│  │  │  │  │  │  │  │  │  │  └─ values-or.xml
│  │  │  │  │  │  │  │  │  ├─ values-pa
│  │  │  │  │  │  │  │  │  │  └─ values-pa.xml
│  │  │  │  │  │  │  │  │  ├─ values-pl
│  │  │  │  │  │  │  │  │  │  └─ values-pl.xml
│  │  │  │  │  │  │  │  │  ├─ values-port
│  │  │  │  │  │  │  │  │  │  └─ values-port.xml
│  │  │  │  │  │  │  │  │  ├─ values-pt
│  │  │  │  │  │  │  │  │  │  └─ values-pt.xml
│  │  │  │  │  │  │  │  │  ├─ values-pt-rBR
│  │  │  │  │  │  │  │  │  │  └─ values-pt-rBR.xml
│  │  │  │  │  │  │  │  │  ├─ values-pt-rPT
│  │  │  │  │  │  │  │  │  │  └─ values-pt-rPT.xml
│  │  │  │  │  │  │  │  │  ├─ values-ro
│  │  │  │  │  │  │  │  │  │  └─ values-ro.xml
│  │  │  │  │  │  │  │  │  ├─ values-ru
│  │  │  │  │  │  │  │  │  │  └─ values-ru.xml
│  │  │  │  │  │  │  │  │  ├─ values-si
│  │  │  │  │  │  │  │  │  │  └─ values-si.xml
│  │  │  │  │  │  │  │  │  ├─ values-sk
│  │  │  │  │  │  │  │  │  │  └─ values-sk.xml
│  │  │  │  │  │  │  │  │  ├─ values-sl
│  │  │  │  │  │  │  │  │  │  └─ values-sl.xml
│  │  │  │  │  │  │  │  │  ├─ values-sq
│  │  │  │  │  │  │  │  │  │  └─ values-sq.xml
│  │  │  │  │  │  │  │  │  ├─ values-sr
│  │  │  │  │  │  │  │  │  │  └─ values-sr.xml
│  │  │  │  │  │  │  │  │  ├─ values-sv
│  │  │  │  │  │  │  │  │  │  └─ values-sv.xml
│  │  │  │  │  │  │  │  │  ├─ values-sw
│  │  │  │  │  │  │  │  │  │  └─ values-sw.xml
│  │  │  │  │  │  │  │  │  ├─ values-sw600dp-v13
│  │  │  │  │  │  │  │  │  │  └─ values-sw600dp-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-ta
│  │  │  │  │  │  │  │  │  │  └─ values-ta.xml
│  │  │  │  │  │  │  │  │  ├─ values-te
│  │  │  │  │  │  │  │  │  │  └─ values-te.xml
│  │  │  │  │  │  │  │  │  ├─ values-th
│  │  │  │  │  │  │  │  │  │  └─ values-th.xml
│  │  │  │  │  │  │  │  │  ├─ values-tl
│  │  │  │  │  │  │  │  │  │  └─ values-tl.xml
│  │  │  │  │  │  │  │  │  ├─ values-tr
│  │  │  │  │  │  │  │  │  │  └─ values-tr.xml
│  │  │  │  │  │  │  │  │  ├─ values-uk
│  │  │  │  │  │  │  │  │  │  └─ values-uk.xml
│  │  │  │  │  │  │  │  │  ├─ values-ur
│  │  │  │  │  │  │  │  │  │  └─ values-ur.xml
│  │  │  │  │  │  │  │  │  ├─ values-uz
│  │  │  │  │  │  │  │  │  │  └─ values-uz.xml
│  │  │  │  │  │  │  │  │  ├─ values-v16
│  │  │  │  │  │  │  │  │  │  └─ values-v16.xml
│  │  │  │  │  │  │  │  │  ├─ values-v17
│  │  │  │  │  │  │  │  │  │  └─ values-v17.xml
│  │  │  │  │  │  │  │  │  ├─ values-v18
│  │  │  │  │  │  │  │  │  │  └─ values-v18.xml
│  │  │  │  │  │  │  │  │  ├─ values-v21
│  │  │  │  │  │  │  │  │  │  └─ values-v21.xml
│  │  │  │  │  │  │  │  │  ├─ values-v22
│  │  │  │  │  │  │  │  │  │  └─ values-v22.xml
│  │  │  │  │  │  │  │  │  ├─ values-v23
│  │  │  │  │  │  │  │  │  │  └─ values-v23.xml
│  │  │  │  │  │  │  │  │  ├─ values-v24
│  │  │  │  │  │  │  │  │  │  └─ values-v24.xml
│  │  │  │  │  │  │  │  │  ├─ values-v25
│  │  │  │  │  │  │  │  │  │  └─ values-v25.xml
│  │  │  │  │  │  │  │  │  ├─ values-v26
│  │  │  │  │  │  │  │  │  │  └─ values-v26.xml
│  │  │  │  │  │  │  │  │  ├─ values-v28
│  │  │  │  │  │  │  │  │  │  └─ values-v28.xml
│  │  │  │  │  │  │  │  │  ├─ values-v31
│  │  │  │  │  │  │  │  │  │  └─ values-v31.xml
│  │  │  │  │  │  │  │  │  ├─ values-v34
│  │  │  │  │  │  │  │  │  │  └─ values-v34.xml
│  │  │  │  │  │  │  │  │  ├─ values-v35
│  │  │  │  │  │  │  │  │  │  └─ values-v35.xml
│  │  │  │  │  │  │  │  │  ├─ values-vi
│  │  │  │  │  │  │  │  │  │  └─ values-vi.xml
│  │  │  │  │  │  │  │  │  ├─ values-w320dp-land-v13
│  │  │  │  │  │  │  │  │  │  └─ values-w320dp-land-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-w360dp-port-v13
│  │  │  │  │  │  │  │  │  │  └─ values-w360dp-port-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-w400dp-port-v13
│  │  │  │  │  │  │  │  │  │  └─ values-w400dp-port-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-w600dp-land-v13
│  │  │  │  │  │  │  │  │  │  └─ values-w600dp-land-v13.xml
│  │  │  │  │  │  │  │  │  ├─ values-watch-v20
│  │  │  │  │  │  │  │  │  │  └─ values-watch-v20.xml
│  │  │  │  │  │  │  │  │  ├─ values-watch-v21
│  │  │  │  │  │  │  │  │  │  └─ values-watch-v21.xml
│  │  │  │  │  │  │  │  │  ├─ values-xlarge-v4
│  │  │  │  │  │  │  │  │  │  └─ values-xlarge-v4.xml
│  │  │  │  │  │  │  │  │  ├─ values-zh-rCN
│  │  │  │  │  │  │  │  │  │  └─ values-zh-rCN.xml
│  │  │  │  │  │  │  │  │  ├─ values-zh-rHK
│  │  │  │  │  │  │  │  │  │  └─ values-zh-rHK.xml
│  │  │  │  │  │  │  │  │  ├─ values-zh-rTW
│  │  │  │  │  │  │  │  │  │  └─ values-zh-rTW.xml
│  │  │  │  │  │  │  │  │  └─ values-zu
│  │  │  │  │  │  │  │  │     └─ values-zu.xml
│  │  │  │  │  │  │  │  ├─ merger.xml
│  │  │  │  │  │  │  │  └─ stripped.dir
│  │  │  │  │  │  │  └─ packageDebugResources
│  │  │  │  │  │  │     ├─ compile-file-map.properties
│  │  │  │  │  │  │     ├─ merged.dir
│  │  │  │  │  │  │     │  └─ values
│  │  │  │  │  │  │     │     └─ values.xml
│  │  │  │  │  │  │     ├─ merger.xml
│  │  │  │  │  │  │     └─ stripped.dir
│  │  │  │  │  │  ├─ debug-mergeJavaRes
│  │  │  │  │  │  │  ├─ merge-state
│  │  │  │  │  │  │  └─ zip-cache
│  │  │  │  │  │  │     ├─ ++qGlEnteyBbRP_XWBJAVQ==
│  │  │  │  │  │  │     ├─ +qL6tE+qaLQVyUhq69f8XA==
│  │  │  │  │  │  │     ├─ 0MnsPgYVfCuF36UxvCHIDg==
│  │  │  │  │  │  │     ├─ 0SNabl1qzrHoZvd799WCAg==
│  │  │  │  │  │  │     ├─ 1ibjtKKaMwLpUG2Qzrrepg==
│  │  │  │  │  │  │     ├─ 284k3mWRGNMhu1fZkKo5SA==
│  │  │  │  │  │  │     ├─ 2yIkNZEzjYmXn3+WTbO_iA==
│  │  │  │  │  │  │     ├─ 36ZC4gJCSQUe+7oePOdA0A==
│  │  │  │  │  │  │     ├─ 3dbZOrHJeeBbCYZP6zGxYw==
│  │  │  │  │  │  │     ├─ 3IGYFb1mAiF2w6XEqgLdtA==
│  │  │  │  │  │  │     ├─ 3QbnuqLFTU3wqueJat_Y4A==
│  │  │  │  │  │  │     ├─ 3UuM4zaNL6Yo5zTM+Vi73g==
│  │  │  │  │  │  │     ├─ 3XmmO9KvRGFzjzKt9VVdFw==
│  │  │  │  │  │  │     ├─ 4VsfEArvgDYAfg5kqbWJ0Q==
│  │  │  │  │  │  │     ├─ 4w8tDHadPqdaNtutxw0tsg==
│  │  │  │  │  │  │     ├─ 51Ff+0xZ1waD909Su30YAA==
│  │  │  │  │  │  │     ├─ 54cs9yXT8rMUA6aFIHvBXA==
│  │  │  │  │  │  │     ├─ 5Lmzt9ejF7jdGcENX+igXg==
│  │  │  │  │  │  │     ├─ 7nyHQBkAkEbR0s3gUuP5uQ==
│  │  │  │  │  │  │     ├─ 7O5gPPwndpzdwpKr9Obawg==
│  │  │  │  │  │  │     ├─ 8xo4epyQfTAWSWVSt1J7aA==
│  │  │  │  │  │  │     ├─ A3YAElgVxOiK452rshuFzA==
│  │  │  │  │  │  │     ├─ AlMr9FdBzPBoMQtff4AhVA==
│  │  │  │  │  │  │     ├─ apTvum3RLV3tRwbn6kfMSw==
│  │  │  │  │  │  │     ├─ BE3y9S0+XgVnnGIBaeBJdA==
│  │  │  │  │  │  │     ├─ BGlBj__Q3ZCNrI4Dcdknjw==
│  │  │  │  │  │  │     ├─ bHGJcLoRNviRloVW2ZTEjw==
│  │  │  │  │  │  │     ├─ Bj3EBRi4qTOX4CnAta3txg==
│  │  │  │  │  │  │     ├─ BLJESkpA9V3yMHbb_jH_YA==
│  │  │  │  │  │  │     ├─ bzBSHG6gGsDoWgTZ4MOFYQ==
│  │  │  │  │  │  │     ├─ C9aYZcXeUESBzCsoOe70wg==
│  │  │  │  │  │  │     ├─ CLSoVcbyJ9Neds3ec659VQ==
│  │  │  │  │  │  │     ├─ cYp_1wRzw4VbDibB_twrwA==
│  │  │  │  │  │  │     ├─ DHDELM9DvJlncJfiBhegMw==
│  │  │  │  │  │  │     ├─ dHrypikG3NRB2b68m5dIQw==
│  │  │  │  │  │  │     ├─ dvHcuqWucLJo77m7u6kYkA==
│  │  │  │  │  │  │     ├─ DwKbvw6pXCQc102Q3HDl0A==
│  │  │  │  │  │  │     ├─ EYWJPyNwx1MvHsMg7t1N1w==
│  │  │  │  │  │  │     ├─ fgzErCVgZgcQB1vSDUhR8w==
│  │  │  │  │  │  │     ├─ FqHlr+pFi+ULieZcplcy8A==
│  │  │  │  │  │  │     ├─ G2ure6+tXb7JN7By+2iEJg==
│  │  │  │  │  │  │     ├─ G8y7Kf0Lp0Harnzfgrc9uA==
│  │  │  │  │  │  │     ├─ GIpezu215xR++GNQ+OBLbQ==
│  │  │  │  │  │  │     ├─ gjNlx_PIhq3Y1jrWXaLZqQ==
│  │  │  │  │  │  │     ├─ gnWmafyuTF3AScXp1baM2g==
│  │  │  │  │  │  │     ├─ h51KpICoLvPPqSmFQ3SDPg==
│  │  │  │  │  │  │     ├─ hO3gclNZHqiPkn6TM_HCyA==
│  │  │  │  │  │  │     ├─ IxpMyPSbLzrcbFzLOrDLww==
│  │  │  │  │  │  │     ├─ I_0ROBSi4q1gnzwQF8wy3g==
│  │  │  │  │  │  │     ├─ j9Mu9E+E1Ks1ORBk_5j9GQ==
│  │  │  │  │  │  │     ├─ l4RlNe_cZT2ATkg4Qi1FeA==
│  │  │  │  │  │  │     ├─ L_zYIhmqQ2crbSjaHmnEtA==
│  │  │  │  │  │  │     ├─ mDP3TdfLPGJYyodeoDNC_A==
│  │  │  │  │  │  │     ├─ Mp8eCxSRHMtUs2q8+X8Ncg==
│  │  │  │  │  │  │     ├─ mwhUnvgCX+STIz6mP9nA8A==
│  │  │  │  │  │  │     ├─ N5PwqE+HtJ5IXbyR7lx5sQ==
│  │  │  │  │  │  │     ├─ N6IEHZZ+A1xmg5c1r2I_nw==
│  │  │  │  │  │  │     ├─ o+N8cKLSviZhJ6F6nx_lNw==
│  │  │  │  │  │  │     ├─ oIfbns8LpE5uoANB3CPiEg==
│  │  │  │  │  │  │     ├─ oMIt4YI2WwlaKraP8w4P9w==
│  │  │  │  │  │  │     ├─ OPv38DJ8Zbs0_DRUWlt8Zg==
│  │  │  │  │  │  │     ├─ OrMMwiD73iqiWgAt5kKDng==
│  │  │  │  │  │  │     ├─ OxgnOGx9or0PnYCiuzGFVQ==
│  │  │  │  │  │  │     ├─ p+DOz+x+CzlCh_XxUgCyCA==
│  │  │  │  │  │  │     ├─ PFdI1CnLqOmOoYv7x1b3JA==
│  │  │  │  │  │  │     ├─ PFs1U_PAvUqfrHJjErXGag==
│  │  │  │  │  │  │     ├─ PKLmMxK9KY29tsSIUKDCJg==
│  │  │  │  │  │  │     ├─ po+W3NDeBPNEkT5ZWy5aaA==
│  │  │  │  │  │  │     ├─ pROsjMKwMUk+wg83Nn08TQ==
│  │  │  │  │  │  │     ├─ q6kz4oyVIk2Kgr45oIlaTQ==
│  │  │  │  │  │  │     ├─ qC+gXTuVYDoU08HNUP9sGQ==
│  │  │  │  │  │  │     ├─ qdAq95B3+LWAbSmB2X_x3Q==
│  │  │  │  │  │  │     ├─ qf9QkZmGIAzSdNpqjlRSkQ==
│  │  │  │  │  │  │     ├─ qlOMoy20xpwxokuLeHW9pQ==
│  │  │  │  │  │  │     ├─ QtgaGjYNhO3Q1vlHV5GUdQ==
│  │  │  │  │  │  │     ├─ RN8yXJLyPUCSxkXi2+XIIg==
│  │  │  │  │  │  │     ├─ RvtSgdr7uePtN5PtY7jvPg==
│  │  │  │  │  │  │     ├─ rwPHiWRAIDT_I+CbGUrmmA==
│  │  │  │  │  │  │     ├─ S9nF1gxC2McbdhQLRlTxrg==
│  │  │  │  │  │  │     ├─ sETWESVo2rOS6ausrSQWUg==
│  │  │  │  │  │  │     ├─ SFbvz2AcR8jyt9XEPLvyAg==
│  │  │  │  │  │  │     ├─ sGaxkiIuWJSfOt4aeaqTsA==
│  │  │  │  │  │  │     ├─ sqec1+ep3ohjIVPAthD+hA==
│  │  │  │  │  │  │     ├─ sv0PqIwT4VO2uYvQ689EBA==
│  │  │  │  │  │  │     ├─ TohVLuD64ElAVzsyYACURA==
│  │  │  │  │  │  │     ├─ TOmjFOqiN9k1z7NKzPUrVg==
│  │  │  │  │  │  │     ├─ tRImI6iN0NIrxf9vb6oWZw==
│  │  │  │  │  │  │     ├─ TVMGFufYHGjP6bUWIiAtNg==
│  │  │  │  │  │  │     ├─ u4xZoxBIV+SRQfMNDAFaTA==
│  │  │  │  │  │  │     ├─ U8wCroXQ2vvumaMnIBzANQ==
│  │  │  │  │  │  │     ├─ uo9b94d9ntg7W8KhVarGbQ==
│  │  │  │  │  │  │     ├─ v9YmU7d72Bo_o3qCplbFFQ==
│  │  │  │  │  │  │     ├─ vaQiWVre8cbBTxgSlz1F0g==
│  │  │  │  │  │  │     ├─ vE0VXKn+6zmMfzD33FLiZw==
│  │  │  │  │  │  │     ├─ VyYHn9Gowb7gQimyYk0t1w==
│  │  │  │  │  │  │     ├─ wSNE615tZUrfVvv7iOa0lg==
│  │  │  │  │  │  │     ├─ XdOhJL9cG_I24nRTtRegmw==
│  │  │  │  │  │  │     ├─ yGUXU06aywJopws6PTxh6w==
│  │  │  │  │  │  │     ├─ YpVfE6qc2iJcsqd6Nsuk0g==
│  │  │  │  │  │  │     ├─ z3q5f9wwyNegAziTj0IT9Q==
│  │  │  │  │  │  │     ├─ _fv9BQRQ7YYZUuIKtHqZhg==
│  │  │  │  │  │  │     └─ _u59FF37jVqqBNRTU5Hy+A==
│  │  │  │  │  │  ├─ mergeDebugAssets
│  │  │  │  │  │  │  └─ merger.xml
│  │  │  │  │  │  ├─ mergeDebugJniLibFolders
│  │  │  │  │  │  │  └─ merger.xml
│  │  │  │  │  │  ├─ mergeDebugShaders
│  │  │  │  │  │  │  └─ merger.xml
│  │  │  │  │  │  └─ packageDebug
│  │  │  │  │  │     └─ tmp
│  │  │  │  │  │        └─ debug
│  │  │  │  │  │           ├─ dex-renamer-state.txt
│  │  │  │  │  │           └─ zip-cache
│  │  │  │  │  │              ├─ androidResources
│  │  │  │  │  │              └─ javaResources0
│  │  │  │  │  ├─ javac
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ compileDebugJavaWithJavac
│  │  │  │  │  │        └─ classes
│  │  │  │  │  │           └─ com
│  │  │  │  │  │              ├─ facebook
│  │  │  │  │  │              │  └─ react
│  │  │  │  │  │              │     ├─ PackageList.class
│  │  │  │  │  │              │     └─ ReactNativeApplicationEntryPoint.class
│  │  │  │  │  │              └─ nutrivisionmobile
│  │  │  │  │  │                 └─ BuildConfig.class
│  │  │  │  │  ├─ java_res
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugJavaRes
│  │  │  │  │  │        └─ out
│  │  │  │  │  │           ├─ com
│  │  │  │  │  │           │  └─ nutrivisionmobile
│  │  │  │  │  │           └─ META-INF
│  │  │  │  │  │              └─ app_debug.kotlin_module
│  │  │  │  │  ├─ linked_resources_binary_format
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugResources
│  │  │  │  │  │        ├─ linked-resources-binary-format-debug.ap_
│  │  │  │  │  │        └─ output-metadata.json
│  │  │  │  │  ├─ local_only_symbol_list
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ parseDebugLocalResources
│  │  │  │  │  │        └─ R-def.txt
│  │  │  │  │  ├─ manifest_merge_blame_file
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugMainManifest
│  │  │  │  │  │        └─ manifest-merger-blame-debug-report.txt
│  │  │  │  │  ├─ merged_java_res
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugJavaResource
│  │  │  │  │  │        └─ base.jar
│  │  │  │  │  ├─ merged_jni_libs
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugJniLibFolders
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ merged_manifest
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugMainManifest
│  │  │  │  │  │        └─ AndroidManifest.xml
│  │  │  │  │  ├─ merged_manifests
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugManifest
│  │  │  │  │  │        ├─ AndroidManifest.xml
│  │  │  │  │  │        └─ output-metadata.json
│  │  │  │  │  ├─ merged_native_libs
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugNativeLibs
│  │  │  │  │  │        └─ out
│  │  │  │  │  │           └─ lib
│  │  │  │  │  │              ├─ arm64-v8a
│  │  │  │  │  │              │  ├─ libappmodules.so
│  │  │  │  │  │              │  ├─ libc++_shared.so
│  │  │  │  │  │              │  ├─ libfbjni.so
│  │  │  │  │  │              │  ├─ libhermestooling.so
│  │  │  │  │  │              │  ├─ libhermesvm.so
│  │  │  │  │  │              │  ├─ libimagepipeline.so
│  │  │  │  │  │              │  ├─ libjsi.so
│  │  │  │  │  │              │  ├─ libnative-filters.so
│  │  │  │  │  │              │  ├─ libnative-imagetranscoder.so
│  │  │  │  │  │              │  ├─ libreactnative.so
│  │  │  │  │  │              │  ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │              │  ├─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │              │  └─ librnscreens.so
│  │  │  │  │  │              ├─ armeabi-v7a
│  │  │  │  │  │              │  ├─ libappmodules.so
│  │  │  │  │  │              │  ├─ libc++_shared.so
│  │  │  │  │  │              │  ├─ libfbjni.so
│  │  │  │  │  │              │  ├─ libhermestooling.so
│  │  │  │  │  │              │  ├─ libhermesvm.so
│  │  │  │  │  │              │  ├─ libimagepipeline.so
│  │  │  │  │  │              │  ├─ libjsi.so
│  │  │  │  │  │              │  ├─ libnative-filters.so
│  │  │  │  │  │              │  ├─ libnative-imagetranscoder.so
│  │  │  │  │  │              │  ├─ libreactnative.so
│  │  │  │  │  │              │  ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │              │  ├─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │              │  └─ librnscreens.so
│  │  │  │  │  │              ├─ x86
│  │  │  │  │  │              │  ├─ libappmodules.so
│  │  │  │  │  │              │  ├─ libc++_shared.so
│  │  │  │  │  │              │  ├─ libfbjni.so
│  │  │  │  │  │              │  ├─ libhermestooling.so
│  │  │  │  │  │              │  ├─ libhermesvm.so
│  │  │  │  │  │              │  ├─ libimagepipeline.so
│  │  │  │  │  │              │  ├─ libjsi.so
│  │  │  │  │  │              │  ├─ libnative-filters.so
│  │  │  │  │  │              │  ├─ libnative-imagetranscoder.so
│  │  │  │  │  │              │  ├─ libreactnative.so
│  │  │  │  │  │              │  ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │              │  ├─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │              │  └─ librnscreens.so
│  │  │  │  │  │              └─ x86_64
│  │  │  │  │  │                 ├─ libappmodules.so
│  │  │  │  │  │                 ├─ libc++_shared.so
│  │  │  │  │  │                 ├─ libfbjni.so
│  │  │  │  │  │                 ├─ libhermestooling.so
│  │  │  │  │  │                 ├─ libhermesvm.so
│  │  │  │  │  │                 ├─ libimagepipeline.so
│  │  │  │  │  │                 ├─ libjsi.so
│  │  │  │  │  │                 ├─ libnative-filters.so
│  │  │  │  │  │                 ├─ libnative-imagetranscoder.so
│  │  │  │  │  │                 ├─ libreactnative.so
│  │  │  │  │  │                 ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │                 ├─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │                 └─ librnscreens.so
│  │  │  │  │  ├─ merged_res
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugResources
│  │  │  │  │  │        ├─ drawable_ic_launcher_background.xml.flat
│  │  │  │  │  │        ├─ drawable_ic_launcher_foreground.xml.flat
│  │  │  │  │  │        ├─ drawable_rn_edit_text_material.xml.flat
│  │  │  │  │  │        ├─ mipmap-anydpi-v26_ic_launcher.xml.flat
│  │  │  │  │  │        ├─ mipmap-anydpi-v26_ic_launcher_round.xml.flat
│  │  │  │  │  │        ├─ mipmap-hdpi_ic_launcher.png.flat
│  │  │  │  │  │        ├─ mipmap-hdpi_ic_launcher_round.png.flat
│  │  │  │  │  │        ├─ mipmap-mdpi_ic_launcher.png.flat
│  │  │  │  │  │        ├─ mipmap-mdpi_ic_launcher_round.png.flat
│  │  │  │  │  │        ├─ mipmap-xhdpi_ic_launcher.png.flat
│  │  │  │  │  │        ├─ mipmap-xhdpi_ic_launcher_round.png.flat
│  │  │  │  │  │        ├─ mipmap-xxhdpi_ic_launcher.png.flat
│  │  │  │  │  │        ├─ mipmap-xxhdpi_ic_launcher_round.png.flat
│  │  │  │  │  │        ├─ mipmap-xxxhdpi_ic_launcher.png.flat
│  │  │  │  │  │        ├─ mipmap-xxxhdpi_ic_launcher_round.png.flat
│  │  │  │  │  │        ├─ values-af_values-af.arsc.flat
│  │  │  │  │  │        ├─ values-am_values-am.arsc.flat
│  │  │  │  │  │        ├─ values-ar_values-ar.arsc.flat
│  │  │  │  │  │        ├─ values-as_values-as.arsc.flat
│  │  │  │  │  │        ├─ values-az_values-az.arsc.flat
│  │  │  │  │  │        ├─ values-b+es+419_values-b+es+419.arsc.flat
│  │  │  │  │  │        ├─ values-b+sr+Latn_values-b+sr+Latn.arsc.flat
│  │  │  │  │  │        ├─ values-be_values-be.arsc.flat
│  │  │  │  │  │        ├─ values-bg_values-bg.arsc.flat
│  │  │  │  │  │        ├─ values-bn_values-bn.arsc.flat
│  │  │  │  │  │        ├─ values-bs_values-bs.arsc.flat
│  │  │  │  │  │        ├─ values-ca_values-ca.arsc.flat
│  │  │  │  │  │        ├─ values-cs_values-cs.arsc.flat
│  │  │  │  │  │        ├─ values-da_values-da.arsc.flat
│  │  │  │  │  │        ├─ values-de_values-de.arsc.flat
│  │  │  │  │  │        ├─ values-el_values-el.arsc.flat
│  │  │  │  │  │        ├─ values-en-rAU_values-en-rAU.arsc.flat
│  │  │  │  │  │        ├─ values-en-rCA_values-en-rCA.arsc.flat
│  │  │  │  │  │        ├─ values-en-rGB_values-en-rGB.arsc.flat
│  │  │  │  │  │        ├─ values-en-rIN_values-en-rIN.arsc.flat
│  │  │  │  │  │        ├─ values-en-rXC_values-en-rXC.arsc.flat
│  │  │  │  │  │        ├─ values-es-rES_values-es-rES.arsc.flat
│  │  │  │  │  │        ├─ values-es-rUS_values-es-rUS.arsc.flat
│  │  │  │  │  │        ├─ values-es_values-es.arsc.flat
│  │  │  │  │  │        ├─ values-et_values-et.arsc.flat
│  │  │  │  │  │        ├─ values-eu_values-eu.arsc.flat
│  │  │  │  │  │        ├─ values-fa_values-fa.arsc.flat
│  │  │  │  │  │        ├─ values-fi_values-fi.arsc.flat
│  │  │  │  │  │        ├─ values-fr-rCA_values-fr-rCA.arsc.flat
│  │  │  │  │  │        ├─ values-fr_values-fr.arsc.flat
│  │  │  │  │  │        ├─ values-gl_values-gl.arsc.flat
│  │  │  │  │  │        ├─ values-gu_values-gu.arsc.flat
│  │  │  │  │  │        ├─ values-h320dp-port-v13_values-h320dp-port-v13.arsc.flat
│  │  │  │  │  │        ├─ values-h360dp-land-v13_values-h360dp-land-v13.arsc.flat
│  │  │  │  │  │        ├─ values-h480dp-land-v13_values-h480dp-land-v13.arsc.flat
│  │  │  │  │  │        ├─ values-h480dp-v13_values-h480dp-v13.arsc.flat
│  │  │  │  │  │        ├─ values-h550dp-port-v13_values-h550dp-port-v13.arsc.flat
│  │  │  │  │  │        ├─ values-h720dp-v13_values-h720dp-v13.arsc.flat
│  │  │  │  │  │        ├─ values-hdpi-v4_values-hdpi-v4.arsc.flat
│  │  │  │  │  │        ├─ values-hi_values-hi.arsc.flat
│  │  │  │  │  │        ├─ values-hr_values-hr.arsc.flat
│  │  │  │  │  │        ├─ values-hu_values-hu.arsc.flat
│  │  │  │  │  │        ├─ values-hy_values-hy.arsc.flat
│  │  │  │  │  │        ├─ values-in_values-in.arsc.flat
│  │  │  │  │  │        ├─ values-is_values-is.arsc.flat
│  │  │  │  │  │        ├─ values-it_values-it.arsc.flat
│  │  │  │  │  │        ├─ values-iw_values-iw.arsc.flat
│  │  │  │  │  │        ├─ values-ja_values-ja.arsc.flat
│  │  │  │  │  │        ├─ values-ka_values-ka.arsc.flat
│  │  │  │  │  │        ├─ values-kk_values-kk.arsc.flat
│  │  │  │  │  │        ├─ values-km_values-km.arsc.flat
│  │  │  │  │  │        ├─ values-kn_values-kn.arsc.flat
│  │  │  │  │  │        ├─ values-ko_values-ko.arsc.flat
│  │  │  │  │  │        ├─ values-ky_values-ky.arsc.flat
│  │  │  │  │  │        ├─ values-land_values-land.arsc.flat
│  │  │  │  │  │        ├─ values-large-v4_values-large-v4.arsc.flat
│  │  │  │  │  │        ├─ values-ldltr-v21_values-ldltr-v21.arsc.flat
│  │  │  │  │  │        ├─ values-ldrtl-v17_values-ldrtl-v17.arsc.flat
│  │  │  │  │  │        ├─ values-lo_values-lo.arsc.flat
│  │  │  │  │  │        ├─ values-lt_values-lt.arsc.flat
│  │  │  │  │  │        ├─ values-lv_values-lv.arsc.flat
│  │  │  │  │  │        ├─ values-mk_values-mk.arsc.flat
│  │  │  │  │  │        ├─ values-ml_values-ml.arsc.flat
│  │  │  │  │  │        ├─ values-mn_values-mn.arsc.flat
│  │  │  │  │  │        ├─ values-mr_values-mr.arsc.flat
│  │  │  │  │  │        ├─ values-ms_values-ms.arsc.flat
│  │  │  │  │  │        ├─ values-my_values-my.arsc.flat
│  │  │  │  │  │        ├─ values-nb_values-nb.arsc.flat
│  │  │  │  │  │        ├─ values-ne_values-ne.arsc.flat
│  │  │  │  │  │        ├─ values-night-v8_values-night-v8.arsc.flat
│  │  │  │  │  │        ├─ values-nl_values-nl.arsc.flat
│  │  │  │  │  │        ├─ values-or_values-or.arsc.flat
│  │  │  │  │  │        ├─ values-pa_values-pa.arsc.flat
│  │  │  │  │  │        ├─ values-pl_values-pl.arsc.flat
│  │  │  │  │  │        ├─ values-port_values-port.arsc.flat
│  │  │  │  │  │        ├─ values-pt-rBR_values-pt-rBR.arsc.flat
│  │  │  │  │  │        ├─ values-pt-rPT_values-pt-rPT.arsc.flat
│  │  │  │  │  │        ├─ values-pt_values-pt.arsc.flat
│  │  │  │  │  │        ├─ values-ro_values-ro.arsc.flat
│  │  │  │  │  │        ├─ values-ru_values-ru.arsc.flat
│  │  │  │  │  │        ├─ values-si_values-si.arsc.flat
│  │  │  │  │  │        ├─ values-sk_values-sk.arsc.flat
│  │  │  │  │  │        ├─ values-sl_values-sl.arsc.flat
│  │  │  │  │  │        ├─ values-sq_values-sq.arsc.flat
│  │  │  │  │  │        ├─ values-sr_values-sr.arsc.flat
│  │  │  │  │  │        ├─ values-sv_values-sv.arsc.flat
│  │  │  │  │  │        ├─ values-sw600dp-v13_values-sw600dp-v13.arsc.flat
│  │  │  │  │  │        ├─ values-sw_values-sw.arsc.flat
│  │  │  │  │  │        ├─ values-ta_values-ta.arsc.flat
│  │  │  │  │  │        ├─ values-te_values-te.arsc.flat
│  │  │  │  │  │        ├─ values-th_values-th.arsc.flat
│  │  │  │  │  │        ├─ values-tl_values-tl.arsc.flat
│  │  │  │  │  │        ├─ values-tr_values-tr.arsc.flat
│  │  │  │  │  │        ├─ values-uk_values-uk.arsc.flat
│  │  │  │  │  │        ├─ values-ur_values-ur.arsc.flat
│  │  │  │  │  │        ├─ values-uz_values-uz.arsc.flat
│  │  │  │  │  │        ├─ values-v16_values-v16.arsc.flat
│  │  │  │  │  │        ├─ values-v17_values-v17.arsc.flat
│  │  │  │  │  │        ├─ values-v18_values-v18.arsc.flat
│  │  │  │  │  │        ├─ values-v21_values-v21.arsc.flat
│  │  │  │  │  │        ├─ values-v22_values-v22.arsc.flat
│  │  │  │  │  │        ├─ values-v23_values-v23.arsc.flat
│  │  │  │  │  │        ├─ values-v24_values-v24.arsc.flat
│  │  │  │  │  │        ├─ values-v25_values-v25.arsc.flat
│  │  │  │  │  │        ├─ values-v26_values-v26.arsc.flat
│  │  │  │  │  │        ├─ values-v28_values-v28.arsc.flat
│  │  │  │  │  │        ├─ values-v31_values-v31.arsc.flat
│  │  │  │  │  │        ├─ values-v34_values-v34.arsc.flat
│  │  │  │  │  │        ├─ values-v35_values-v35.arsc.flat
│  │  │  │  │  │        ├─ values-vi_values-vi.arsc.flat
│  │  │  │  │  │        ├─ values-w320dp-land-v13_values-w320dp-land-v13.arsc.flat
│  │  │  │  │  │        ├─ values-w360dp-port-v13_values-w360dp-port-v13.arsc.flat
│  │  │  │  │  │        ├─ values-w400dp-port-v13_values-w400dp-port-v13.arsc.flat
│  │  │  │  │  │        ├─ values-w600dp-land-v13_values-w600dp-land-v13.arsc.flat
│  │  │  │  │  │        ├─ values-watch-v20_values-watch-v20.arsc.flat
│  │  │  │  │  │        ├─ values-watch-v21_values-watch-v21.arsc.flat
│  │  │  │  │  │        ├─ values-xlarge-v4_values-xlarge-v4.arsc.flat
│  │  │  │  │  │        ├─ values-zh-rCN_values-zh-rCN.arsc.flat
│  │  │  │  │  │        ├─ values-zh-rHK_values-zh-rHK.arsc.flat
│  │  │  │  │  │        ├─ values-zh-rTW_values-zh-rTW.arsc.flat
│  │  │  │  │  │        ├─ values-zu_values-zu.arsc.flat
│  │  │  │  │  │        └─ values_values.arsc.flat
│  │  │  │  │  ├─ merged_res_blame_folder
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugResources
│  │  │  │  │  │        └─ out
│  │  │  │  │  │           ├─ multi-v2
│  │  │  │  │  │           │  ├─ mergeDebugResources.json
│  │  │  │  │  │           │  ├─ values-af.json
│  │  │  │  │  │           │  ├─ values-am.json
│  │  │  │  │  │           │  ├─ values-ar.json
│  │  │  │  │  │           │  ├─ values-as.json
│  │  │  │  │  │           │  ├─ values-az.json
│  │  │  │  │  │           │  ├─ values-b+es+419.json
│  │  │  │  │  │           │  ├─ values-b+sr+Latn.json
│  │  │  │  │  │           │  ├─ values-be.json
│  │  │  │  │  │           │  ├─ values-bg.json
│  │  │  │  │  │           │  ├─ values-bn.json
│  │  │  │  │  │           │  ├─ values-bs.json
│  │  │  │  │  │           │  ├─ values-ca.json
│  │  │  │  │  │           │  ├─ values-cs.json
│  │  │  │  │  │           │  ├─ values-da.json
│  │  │  │  │  │           │  ├─ values-de.json
│  │  │  │  │  │           │  ├─ values-el.json
│  │  │  │  │  │           │  ├─ values-en-rAU.json
│  │  │  │  │  │           │  ├─ values-en-rCA.json
│  │  │  │  │  │           │  ├─ values-en-rGB.json
│  │  │  │  │  │           │  ├─ values-en-rIN.json
│  │  │  │  │  │           │  ├─ values-en-rXC.json
│  │  │  │  │  │           │  ├─ values-es-rES.json
│  │  │  │  │  │           │  ├─ values-es-rUS.json
│  │  │  │  │  │           │  ├─ values-es.json
│  │  │  │  │  │           │  ├─ values-et.json
│  │  │  │  │  │           │  ├─ values-eu.json
│  │  │  │  │  │           │  ├─ values-fa.json
│  │  │  │  │  │           │  ├─ values-fi.json
│  │  │  │  │  │           │  ├─ values-fr-rCA.json
│  │  │  │  │  │           │  ├─ values-fr.json
│  │  │  │  │  │           │  ├─ values-gl.json
│  │  │  │  │  │           │  ├─ values-gu.json
│  │  │  │  │  │           │  ├─ values-h320dp-port-v13.json
│  │  │  │  │  │           │  ├─ values-h360dp-land-v13.json
│  │  │  │  │  │           │  ├─ values-h480dp-land-v13.json
│  │  │  │  │  │           │  ├─ values-h480dp-v13.json
│  │  │  │  │  │           │  ├─ values-h550dp-port-v13.json
│  │  │  │  │  │           │  ├─ values-h720dp-v13.json
│  │  │  │  │  │           │  ├─ values-hdpi-v4.json
│  │  │  │  │  │           │  ├─ values-hi.json
│  │  │  │  │  │           │  ├─ values-hr.json
│  │  │  │  │  │           │  ├─ values-hu.json
│  │  │  │  │  │           │  ├─ values-hy.json
│  │  │  │  │  │           │  ├─ values-in.json
│  │  │  │  │  │           │  ├─ values-is.json
│  │  │  │  │  │           │  ├─ values-it.json
│  │  │  │  │  │           │  ├─ values-iw.json
│  │  │  │  │  │           │  ├─ values-ja.json
│  │  │  │  │  │           │  ├─ values-ka.json
│  │  │  │  │  │           │  ├─ values-kk.json
│  │  │  │  │  │           │  ├─ values-km.json
│  │  │  │  │  │           │  ├─ values-kn.json
│  │  │  │  │  │           │  ├─ values-ko.json
│  │  │  │  │  │           │  ├─ values-ky.json
│  │  │  │  │  │           │  ├─ values-land.json
│  │  │  │  │  │           │  ├─ values-large-v4.json
│  │  │  │  │  │           │  ├─ values-ldltr-v21.json
│  │  │  │  │  │           │  ├─ values-ldrtl-v17.json
│  │  │  │  │  │           │  ├─ values-lo.json
│  │  │  │  │  │           │  ├─ values-lt.json
│  │  │  │  │  │           │  ├─ values-lv.json
│  │  │  │  │  │           │  ├─ values-mk.json
│  │  │  │  │  │           │  ├─ values-ml.json
│  │  │  │  │  │           │  ├─ values-mn.json
│  │  │  │  │  │           │  ├─ values-mr.json
│  │  │  │  │  │           │  ├─ values-ms.json
│  │  │  │  │  │           │  ├─ values-my.json
│  │  │  │  │  │           │  ├─ values-nb.json
│  │  │  │  │  │           │  ├─ values-ne.json
│  │  │  │  │  │           │  ├─ values-night-v8.json
│  │  │  │  │  │           │  ├─ values-nl.json
│  │  │  │  │  │           │  ├─ values-or.json
│  │  │  │  │  │           │  ├─ values-pa.json
│  │  │  │  │  │           │  ├─ values-pl.json
│  │  │  │  │  │           │  ├─ values-port.json
│  │  │  │  │  │           │  ├─ values-pt-rBR.json
│  │  │  │  │  │           │  ├─ values-pt-rPT.json
│  │  │  │  │  │           │  ├─ values-pt.json
│  │  │  │  │  │           │  ├─ values-ro.json
│  │  │  │  │  │           │  ├─ values-ru.json
│  │  │  │  │  │           │  ├─ values-si.json
│  │  │  │  │  │           │  ├─ values-sk.json
│  │  │  │  │  │           │  ├─ values-sl.json
│  │  │  │  │  │           │  ├─ values-sq.json
│  │  │  │  │  │           │  ├─ values-sr.json
│  │  │  │  │  │           │  ├─ values-sv.json
│  │  │  │  │  │           │  ├─ values-sw.json
│  │  │  │  │  │           │  ├─ values-sw600dp-v13.json
│  │  │  │  │  │           │  ├─ values-ta.json
│  │  │  │  │  │           │  ├─ values-te.json
│  │  │  │  │  │           │  ├─ values-th.json
│  │  │  │  │  │           │  ├─ values-tl.json
│  │  │  │  │  │           │  ├─ values-tr.json
│  │  │  │  │  │           │  ├─ values-uk.json
│  │  │  │  │  │           │  ├─ values-ur.json
│  │  │  │  │  │           │  ├─ values-uz.json
│  │  │  │  │  │           │  ├─ values-v16.json
│  │  │  │  │  │           │  ├─ values-v17.json
│  │  │  │  │  │           │  ├─ values-v18.json
│  │  │  │  │  │           │  ├─ values-v21.json
│  │  │  │  │  │           │  ├─ values-v22.json
│  │  │  │  │  │           │  ├─ values-v23.json
│  │  │  │  │  │           │  ├─ values-v24.json
│  │  │  │  │  │           │  ├─ values-v25.json
│  │  │  │  │  │           │  ├─ values-v26.json
│  │  │  │  │  │           │  ├─ values-v28.json
│  │  │  │  │  │           │  ├─ values-v31.json
│  │  │  │  │  │           │  ├─ values-v34.json
│  │  │  │  │  │           │  ├─ values-v35.json
│  │  │  │  │  │           │  ├─ values-vi.json
│  │  │  │  │  │           │  ├─ values-w320dp-land-v13.json
│  │  │  │  │  │           │  ├─ values-w360dp-port-v13.json
│  │  │  │  │  │           │  ├─ values-w400dp-port-v13.json
│  │  │  │  │  │           │  ├─ values-w600dp-land-v13.json
│  │  │  │  │  │           │  ├─ values-watch-v20.json
│  │  │  │  │  │           │  ├─ values-watch-v21.json
│  │  │  │  │  │           │  ├─ values-xlarge-v4.json
│  │  │  │  │  │           │  ├─ values-zh-rCN.json
│  │  │  │  │  │           │  ├─ values-zh-rHK.json
│  │  │  │  │  │           │  ├─ values-zh-rTW.json
│  │  │  │  │  │           │  ├─ values-zu.json
│  │  │  │  │  │           │  └─ values.json
│  │  │  │  │  │           └─ single
│  │  │  │  │  │              └─ mergeDebugResources.json
│  │  │  │  │  ├─ merged_shaders
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugShaders
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ merged_test_only_native_libs
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mergeDebugNativeLibs
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ mixed_scope_dex_archive
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ navigation_json
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ extractDeepLinksDebug
│  │  │  │  │  │        └─ navigation.json
│  │  │  │  │  ├─ nested_resources_validation_report
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ generateDebugResources
│  │  │  │  │  │        └─ nestedResourcesValidationReport.txt
│  │  │  │  │  ├─ packaged_manifests
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugManifestForPackage
│  │  │  │  │  │        ├─ AndroidManifest.xml
│  │  │  │  │  │        └─ output-metadata.json
│  │  │  │  │  ├─ packaged_res
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ packageDebugResources
│  │  │  │  │  │        ├─ drawable
│  │  │  │  │  │        │  ├─ ic_launcher_background.xml
│  │  │  │  │  │        │  ├─ ic_launcher_foreground.xml
│  │  │  │  │  │        │  └─ rn_edit_text_material.xml
│  │  │  │  │  │        ├─ mipmap-anydpi-v26
│  │  │  │  │  │        │  ├─ ic_launcher.xml
│  │  │  │  │  │        │  └─ ic_launcher_round.xml
│  │  │  │  │  │        ├─ mipmap-hdpi-v4
│  │  │  │  │  │        │  ├─ ic_launcher.png
│  │  │  │  │  │        │  └─ ic_launcher_round.png
│  │  │  │  │  │        ├─ mipmap-mdpi-v4
│  │  │  │  │  │        │  ├─ ic_launcher.png
│  │  │  │  │  │        │  └─ ic_launcher_round.png
│  │  │  │  │  │        ├─ mipmap-xhdpi-v4
│  │  │  │  │  │        │  ├─ ic_launcher.png
│  │  │  │  │  │        │  └─ ic_launcher_round.png
│  │  │  │  │  │        ├─ mipmap-xxhdpi-v4
│  │  │  │  │  │        │  ├─ ic_launcher.png
│  │  │  │  │  │        │  └─ ic_launcher_round.png
│  │  │  │  │  │        ├─ mipmap-xxxhdpi-v4
│  │  │  │  │  │        │  ├─ ic_launcher.png
│  │  │  │  │  │        │  └─ ic_launcher_round.png
│  │  │  │  │  │        └─ values
│  │  │  │  │  │           └─ values.xml
│  │  │  │  │  ├─ project_dex_archive
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  │           ├─ 0dbfe6351d7321d2a80b0f9af808e494ececd12cb0070b6d5f7d82d8985ea2bf_0.jar
│  │  │  │  │  │           ├─ 0dbfe6351d7321d2a80b0f9af808e494ececd12cb0070b6d5f7d82d8985ea2bf_1.jar
│  │  │  │  │  │           ├─ 0dbfe6351d7321d2a80b0f9af808e494ececd12cb0070b6d5f7d82d8985ea2bf_2.jar
│  │  │  │  │  │           ├─ 0dbfe6351d7321d2a80b0f9af808e494ececd12cb0070b6d5f7d82d8985ea2bf_3.jar
│  │  │  │  │  │           ├─ 0dbfe6351d7321d2a80b0f9af808e494ececd12cb0070b6d5f7d82d8985ea2bf_4.jar
│  │  │  │  │  │           ├─ 0dbfe6351d7321d2a80b0f9af808e494ececd12cb0070b6d5f7d82d8985ea2bf_5.jar
│  │  │  │  │  │           ├─ 0dbfe6351d7321d2a80b0f9af808e494ececd12cb0070b6d5f7d82d8985ea2bf_6.jar
│  │  │  │  │  │           ├─ 0dbfe6351d7321d2a80b0f9af808e494ececd12cb0070b6d5f7d82d8985ea2bf_7.jar
│  │  │  │  │  │           └─ com
│  │  │  │  │  │              ├─ facebook
│  │  │  │  │  │              │  └─ react
│  │  │  │  │  │              │     ├─ PackageList.dex
│  │  │  │  │  │              │     └─ ReactNativeApplicationEntryPoint.dex
│  │  │  │  │  │              └─ nutrivisionmobile
│  │  │  │  │  │                 ├─ BuildConfig.dex
│  │  │  │  │  │                 ├─ MainActivity.dex
│  │  │  │  │  │                 └─ MainApplication.dex
│  │  │  │  │  ├─ runtime_symbol_list
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugResources
│  │  │  │  │  │        └─ R.txt
│  │  │  │  │  ├─ signing_config_versions
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ writeDebugSigningConfigVersions
│  │  │  │  │  │        └─ signing-config-versions.json
│  │  │  │  │  ├─ source_set_path_map
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ mapDebugSourceSetPaths
│  │  │  │  │  │        └─ file-map.txt
│  │  │  │  │  ├─ stable_resource_ids_file
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugResources
│  │  │  │  │  │        └─ stableIds.txt
│  │  │  │  │  ├─ stripped_native_libs
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ stripDebugDebugSymbols
│  │  │  │  │  │        └─ out
│  │  │  │  │  │           └─ lib
│  │  │  │  │  │              ├─ arm64-v8a
│  │  │  │  │  │              │  ├─ libappmodules.so
│  │  │  │  │  │              │  ├─ libc++_shared.so
│  │  │  │  │  │              │  ├─ libfbjni.so
│  │  │  │  │  │              │  ├─ libhermestooling.so
│  │  │  │  │  │              │  ├─ libhermesvm.so
│  │  │  │  │  │              │  ├─ libimagepipeline.so
│  │  │  │  │  │              │  ├─ libjsi.so
│  │  │  │  │  │              │  ├─ libnative-filters.so
│  │  │  │  │  │              │  ├─ libnative-imagetranscoder.so
│  │  │  │  │  │              │  ├─ libreactnative.so
│  │  │  │  │  │              │  ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │              │  ├─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │              │  └─ librnscreens.so
│  │  │  │  │  │              ├─ armeabi-v7a
│  │  │  │  │  │              │  ├─ libappmodules.so
│  │  │  │  │  │              │  ├─ libc++_shared.so
│  │  │  │  │  │              │  ├─ libfbjni.so
│  │  │  │  │  │              │  ├─ libhermestooling.so
│  │  │  │  │  │              │  ├─ libhermesvm.so
│  │  │  │  │  │              │  ├─ libimagepipeline.so
│  │  │  │  │  │              │  ├─ libjsi.so
│  │  │  │  │  │              │  ├─ libnative-filters.so
│  │  │  │  │  │              │  ├─ libnative-imagetranscoder.so
│  │  │  │  │  │              │  ├─ libreactnative.so
│  │  │  │  │  │              │  ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │              │  ├─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │              │  └─ librnscreens.so
│  │  │  │  │  │              ├─ x86
│  │  │  │  │  │              │  ├─ libappmodules.so
│  │  │  │  │  │              │  ├─ libc++_shared.so
│  │  │  │  │  │              │  ├─ libfbjni.so
│  │  │  │  │  │              │  ├─ libhermestooling.so
│  │  │  │  │  │              │  ├─ libhermesvm.so
│  │  │  │  │  │              │  ├─ libimagepipeline.so
│  │  │  │  │  │              │  ├─ libjsi.so
│  │  │  │  │  │              │  ├─ libnative-filters.so
│  │  │  │  │  │              │  ├─ libnative-imagetranscoder.so
│  │  │  │  │  │              │  ├─ libreactnative.so
│  │  │  │  │  │              │  ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │              │  ├─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │              │  └─ librnscreens.so
│  │  │  │  │  │              └─ x86_64
│  │  │  │  │  │                 ├─ libappmodules.so
│  │  │  │  │  │                 ├─ libc++_shared.so
│  │  │  │  │  │                 ├─ libfbjni.so
│  │  │  │  │  │                 ├─ libhermestooling.so
│  │  │  │  │  │                 ├─ libhermesvm.so
│  │  │  │  │  │                 ├─ libimagepipeline.so
│  │  │  │  │  │                 ├─ libjsi.so
│  │  │  │  │  │                 ├─ libnative-filters.so
│  │  │  │  │  │                 ├─ libnative-imagetranscoder.so
│  │  │  │  │  │                 ├─ libreactnative.so
│  │  │  │  │  │                 ├─ libreact_codegen_rnscreens.so
│  │  │  │  │  │                 ├─ libreact_codegen_safeareacontext.so
│  │  │  │  │  │                 └─ librnscreens.so
│  │  │  │  │  ├─ sub_project_dex_archive
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ dexBuilderDebug
│  │  │  │  │  │        └─ out
│  │  │  │  │  ├─ symbol_list_with_package_name
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     └─ processDebugResources
│  │  │  │  │  │        └─ package-aware-r.txt
│  │  │  │  │  └─ validate_signing_config
│  │  │  │  │     └─ debug
│  │  │  │  │        └─ validateSigningDebug
│  │  │  │  ├─ kotlin
│  │  │  │  │  └─ compileDebugKotlin
│  │  │  │  │     ├─ cacheable
│  │  │  │  │     │  ├─ caches-jvm
│  │  │  │  │     │  │  ├─ inputs
│  │  │  │  │     │  │  │  ├─ source-to-output.tab
│  │  │  │  │     │  │  │  ├─ source-to-output.tab.keystream
│  │  │  │  │     │  │  │  ├─ source-to-output.tab.keystream.len
│  │  │  │  │     │  │  │  ├─ source-to-output.tab.len
│  │  │  │  │     │  │  │  ├─ source-to-output.tab.values.at
│  │  │  │  │     │  │  │  ├─ source-to-output.tab_i
│  │  │  │  │     │  │  │  └─ source-to-output.tab_i.len
│  │  │  │  │     │  │  ├─ jvm
│  │  │  │  │     │  │  │  └─ kotlin
│  │  │  │  │     │  │  │     ├─ class-attributes.tab
│  │  │  │  │     │  │  │     ├─ class-attributes.tab.keystream
│  │  │  │  │     │  │  │     ├─ class-attributes.tab.keystream.len
│  │  │  │  │     │  │  │     ├─ class-attributes.tab.len
│  │  │  │  │     │  │  │     ├─ class-attributes.tab.values.at
│  │  │  │  │     │  │  │     ├─ class-attributes.tab_i
│  │  │  │  │     │  │  │     ├─ class-attributes.tab_i.len
│  │  │  │  │     │  │  │     ├─ class-fq-name-to-source.tab
│  │  │  │  │     │  │  │     ├─ class-fq-name-to-source.tab.keystream
│  │  │  │  │     │  │  │     ├─ class-fq-name-to-source.tab.keystream.len
│  │  │  │  │     │  │  │     ├─ class-fq-name-to-source.tab.len
│  │  │  │  │     │  │  │     ├─ class-fq-name-to-source.tab.values.at
│  │  │  │  │     │  │  │     ├─ class-fq-name-to-source.tab_i
│  │  │  │  │     │  │  │     ├─ class-fq-name-to-source.tab_i.len
│  │  │  │  │     │  │  │     ├─ internal-name-to-source.tab
│  │  │  │  │     │  │  │     ├─ internal-name-to-source.tab.keystream
│  │  │  │  │     │  │  │     ├─ internal-name-to-source.tab.keystream.len
│  │  │  │  │     │  │  │     ├─ internal-name-to-source.tab.len
│  │  │  │  │     │  │  │     ├─ internal-name-to-source.tab.values.at
│  │  │  │  │     │  │  │     ├─ internal-name-to-source.tab_i
│  │  │  │  │     │  │  │     ├─ internal-name-to-source.tab_i.len
│  │  │  │  │     │  │  │     ├─ proto.tab
│  │  │  │  │     │  │  │     ├─ proto.tab.keystream
│  │  │  │  │     │  │  │     ├─ proto.tab.keystream.len
│  │  │  │  │     │  │  │     ├─ proto.tab.len
│  │  │  │  │     │  │  │     ├─ proto.tab.values.at
│  │  │  │  │     │  │  │     ├─ proto.tab_i
│  │  │  │  │     │  │  │     ├─ proto.tab_i.len
│  │  │  │  │     │  │  │     ├─ source-to-classes.tab
│  │  │  │  │     │  │  │     ├─ source-to-classes.tab.keystream
│  │  │  │  │     │  │  │     ├─ source-to-classes.tab.keystream.len
│  │  │  │  │     │  │  │     ├─ source-to-classes.tab.len
│  │  │  │  │     │  │  │     ├─ source-to-classes.tab.values.at
│  │  │  │  │     │  │  │     ├─ source-to-classes.tab_i
│  │  │  │  │     │  │  │     ├─ source-to-classes.tab_i.len
│  │  │  │  │     │  │  │     ├─ subtypes.tab
│  │  │  │  │     │  │  │     ├─ subtypes.tab.keystream
│  │  │  │  │     │  │  │     ├─ subtypes.tab.keystream.len
│  │  │  │  │     │  │  │     ├─ subtypes.tab.len
│  │  │  │  │     │  │  │     ├─ subtypes.tab.values.at
│  │  │  │  │     │  │  │     ├─ subtypes.tab_i
│  │  │  │  │     │  │  │     ├─ subtypes.tab_i.len
│  │  │  │  │     │  │  │     ├─ supertypes.tab
│  │  │  │  │     │  │  │     ├─ supertypes.tab.keystream
│  │  │  │  │     │  │  │     ├─ supertypes.tab.keystream.len
│  │  │  │  │     │  │  │     ├─ supertypes.tab.len
│  │  │  │  │     │  │  │     ├─ supertypes.tab.values.at
│  │  │  │  │     │  │  │     ├─ supertypes.tab_i
│  │  │  │  │     │  │  │     └─ supertypes.tab_i.len
│  │  │  │  │     │  │  └─ lookups
│  │  │  │  │     │  │     ├─ counters.tab
│  │  │  │  │     │  │     ├─ file-to-id.tab
│  │  │  │  │     │  │     ├─ file-to-id.tab.keystream
│  │  │  │  │     │  │     ├─ file-to-id.tab.keystream.len
│  │  │  │  │     │  │     ├─ file-to-id.tab.len
│  │  │  │  │     │  │     ├─ file-to-id.tab.values.at
│  │  │  │  │     │  │     ├─ file-to-id.tab_i
│  │  │  │  │     │  │     ├─ file-to-id.tab_i.len
│  │  │  │  │     │  │     ├─ id-to-file.tab
│  │  │  │  │     │  │     ├─ id-to-file.tab.keystream
│  │  │  │  │     │  │     ├─ id-to-file.tab.keystream.len
│  │  │  │  │     │  │     ├─ id-to-file.tab.len
│  │  │  │  │     │  │     ├─ id-to-file.tab.values.at
│  │  │  │  │     │  │     ├─ id-to-file.tab_i
│  │  │  │  │     │  │     ├─ id-to-file.tab_i.len
│  │  │  │  │     │  │     ├─ lookups.tab
│  │  │  │  │     │  │     ├─ lookups.tab.keystream
│  │  │  │  │     │  │     ├─ lookups.tab.keystream.len
│  │  │  │  │     │  │     ├─ lookups.tab.len
│  │  │  │  │     │  │     ├─ lookups.tab.values.at
│  │  │  │  │     │  │     ├─ lookups.tab_i
│  │  │  │  │     │  │     └─ lookups.tab_i.len
│  │  │  │  │     │  └─ last-build.bin
│  │  │  │  │     ├─ classpath-snapshot
│  │  │  │  │     │  └─ shrunk-classpath-snapshot.bin
│  │  │  │  │     └─ local-state
│  │  │  │  │        └─ build-history.bin
│  │  │  │  ├─ outputs
│  │  │  │  │  ├─ apk
│  │  │  │  │  │  └─ debug
│  │  │  │  │  │     ├─ app-debug.apk
│  │  │  │  │  │     └─ output-metadata.json
│  │  │  │  │  └─ logs
│  │  │  │  │     └─ manifest-merger-debug-report.txt
│  │  │  │  └─ tmp
│  │  │  │     ├─ compileDebugJavaWithJavac
│  │  │  │     │  ├─ compileTransaction
│  │  │  │     │  │  ├─ backup-dir
│  │  │  │     │  │  └─ stash-dir
│  │  │  │     │  └─ previous-compilation-data.bin
│  │  │  │     └─ kotlin-classes
│  │  │  │        └─ debug
│  │  │  │           ├─ com
│  │  │  │           │  └─ nutrivisionmobile
│  │  │  │           │     ├─ MainActivity.class
│  │  │  │           │     └─ MainApplication.class
│  │  │  │           └─ META-INF
│  │  │  │              └─ app_debug.kotlin_module
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
│  │  ├─ services
│  │  │  ├─ addressService.js
│  │  │  ├─ admin
│  │  │  ├─ aiPricingService.js
│  │  │  ├─ apiClient.js
│  │  │  ├─ apiErrorHandler.js
│  │  │  ├─ authService.js
│  │  │  ├─ index.js
│  │  │  ├─ locationService.js
│  │  │  ├─ merchantOrderService.js
│  │  │  ├─ merchantService.js
│  │  │  ├─ networkUtils.js
│  │  │  ├─ orderService.js
│  │  │  ├─ platformService.js
│  │  │  ├─ profileService.js
│  │  │  ├─ recommendationService.js
│  │  │  ├─ settlementService.js
│  │  │  ├─ userService.js
│  │  │  └─ walletService.js
│  │  ├─ types
│  │  │  └─ coupon.ts
│  │  └─ utils
│  │     └─ couponUtils.js
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
└─ README.md

```