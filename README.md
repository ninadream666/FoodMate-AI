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


```
FoodMate-AI
├─ .claude
│  └─ settings.local.json
├─ backend
│  ├─ .env
│  ├─ .hf_cache
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
│  │     └─ classes
│  │        ├─ application.yml
│  │        └─ com
│  │           └─ fooddelivery
│  │              └─ marketingservice
│  │                 ├─ config
│  │                 │  ├─ AsyncConfig.class
│  │                 │  ├─ OpenApiConfig.class
│  │                 │  └─ SecurityConfig.class
│  │                 ├─ controller
│  │                 │  ├─ AdminCouponController.class
│  │                 │  ├─ AdminMarketingController.class
│  │                 │  ├─ CouponController.class
│  │                 │  └─ SmartIssuanceController.java.bak
│  │                 ├─ dto
│  │                 │  ├─ AdminIssueBatchRequest.class
│  │                 │  ├─ AdminIssueCouponRequest.class
│  │                 │  ├─ AutoIssuanceRuleDTO.java.bak
│  │                 │  ├─ CalculateBestCouponRequest$CalculateBestCouponRequestBuilder.class
│  │                 │  ├─ CalculateBestCouponRequest.class
│  │                 │  ├─ CalculateBestCouponResponse$CalculateBestCouponResponseBuilder.class
│  │                 │  ├─ CalculateBestCouponResponse.class
│  │                 │  ├─ CouponStatsDTO$CouponStatsDTOBuilder.class
│  │                 │  ├─ CouponStatsDTO.class
│  │                 │  ├─ CouponTemplateDTO$CouponTemplateDTOBuilder.class
│  │                 │  ├─ CouponTemplateDTO.class
│  │                 │  ├─ CouponTypeStatsDTO$CouponTypeStatsDTOBuilder.class
│  │                 │  ├─ CouponTypeStatsDTO.class
│  │                 │  ├─ CouponUsageTrendDTO$CouponUsageTrendDTOBuilder.class
│  │                 │  ├─ CouponUsageTrendDTO.class
│  │                 │  ├─ CreateAutoIssuanceRuleRequest.java.bak
│  │                 │  ├─ CreateCouponTemplateRequest.class
│  │                 │  ├─ IssueCouponRequest$IssueCouponRequestBuilder.class
│  │                 │  ├─ IssueCouponRequest.class
│  │                 │  ├─ OrderItemDTO$OrderItemDTOBuilder.class
│  │                 │  ├─ OrderItemDTO.class
│  │                 │  ├─ RollbackCouponRequest.class
│  │                 │  ├─ UpdateCouponTemplateRequest.class
│  │                 │  ├─ UseCouponRequest.class
│  │                 │  ├─ UserCouponDTO$UserCouponDTOBuilder.class
│  │                 │  ├─ UserCouponDTO.class
│  │                 │  └─ UserEventTriggerRequest.java.bak
│  │                 ├─ entity
│  │                 │  ├─ AutoIssuanceHistory.java.bak
│  │                 │  ├─ AutoIssuanceRule.java.bak
│  │                 │  ├─ CouponStatus.class
│  │                 │  ├─ CouponTemplate.class
│  │                 │  ├─ CouponType.class
│  │                 │  └─ UserCoupon.class
│  │                 ├─ exception
│  │                 │  ├─ BusinessException.class
│  │                 │  └─ GlobalExceptionHandler.class
│  │                 ├─ filter
│  │                 │  └─ JwtAuthenticationFilter.class
│  │                 ├─ integration
│  │                 │  └─ UserServiceIntegration.java.bak
│  │                 ├─ MarketingServiceApplication.class
│  │                 ├─ repository
│  │                 │  ├─ AutoIssuanceHistoryRepository.java.bak
│  │                 │  ├─ AutoIssuanceRuleRepository.java.bak
│  │                 │  ├─ CouponTemplateRepository.class
│  │                 │  └─ UserCouponRepository.class
│  │                 ├─ service
│  │                 │  ├─ CouponCalculationService.class
│  │                 │  ├─ CouponCombinationService$CombinationResult.class
│  │                 │  ├─ CouponCombinationService$CouponOption.class
│  │                 │  ├─ CouponCombinationService.class
│  │                 │  ├─ CouponIssueService.class
│  │                 │  ├─ CouponStatisticsService.class
│  │                 │  ├─ CouponStatsService.class
│  │                 │  ├─ CouponTemplateService.class
│  │                 │  └─ SmartIssuanceService.java.bak
│  │                 └─ util
│  │                    └─ JwtUtil.class
│  ├─ maven-settings.xml
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
│  │     ├─ maven-archiver
│  │     │  └─ pom.properties
│  │     ├─ maven-status
│  │     │  └─ maven-compiler-plugin
│  │     │     └─ compile
│  │     │        └─ default-compile
│  │     │           ├─ createdFiles.lst
│  │     │           └─ inputFiles.lst
│  │     ├─ merchant-service-0.0.1-SNAPSHOT.jar
│  │     └─ merchant-service-0.0.1-SNAPSHOT.jar.original
│  ├─ nutrivision-service
│  │  ├─ app
│  │  │  ├─ core
│  │  │  │  ├─ config.py
│  │  │  │  ├─ food_classifier.py
│  │  │  │  ├─ gemini_vision.py
│  │  │  │  └─ _init_.py
│  │  │  ├─ main.py
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
│  │     └─ maven-status
│  │        └─ maven-compiler-plugin
│  │           └─ compile
│  │              └─ default-compile
│  │                 ├─ createdFiles.lst
│  │                 └─ inputFiles.lst
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
│  │     │           │  ├─ MerchantSettlementDTO$MerchantSettlementDTOBuilder.class
│  │     │           │  ├─ MerchantSettlementDTO$ServiceCommissionSummary$ServiceCommissionSummaryBuilder.class
│  │     │           │  ├─ MerchantSettlementDTO$ServiceCommissionSummary.class
│  │     │           │  ├─ MerchantSettlementDTO.class
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
│  │     │           │  ├─ CommissionService.class
│  │     │           │  ├─ DashboardService.class
│  │     │           │  ├─ MerchantQueryService.class
│  │     │           │  ├─ PlatformServiceService.class
│  │     │           │  ├─ SettlementScheduler.class
│  │     │           │  ├─ SettlementService.class
│  │     │           │  ├─ SettlementStatisticsService.class
│  │     │           │  └─ SubscriptionService.class
│  │     │           └─ util
│  │     │              └─ JwtUtil.class
│  │     ├─ maven-archiver
│  │     │  └─ pom.properties
│  │     ├─ maven-status
│  │     │  └─ maven-compiler-plugin
│  │     │     └─ compile
│  │     │        └─ default-compile
│  │     │           ├─ createdFiles.lst
│  │     │           └─ inputFiles.lst
│  │     ├─ platform-service-1.0.0.jar
│  │     └─ platform-service-1.0.0.jar.original
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
│  │     └─ classes
│  │        ├─ application.yml
│  │        └─ com
│  │           └─ fooddelivery
│  │              └─ profileservice
│  │                 ├─ client
│  │                 │  └─ OrderClient.class
│  │                 ├─ config
│  │                 │  ├─ FeignConfig$1.class
│  │                 │  ├─ FeignConfig.class
│  │                 │  └─ SecurityConfig.class
│  │                 ├─ controller
│  │                 │  └─ UserProfileController.class
│  │                 ├─ dto
│  │                 │  ├─ OrderDto.class
│  │                 │  ├─ OrderItemDto.class
│  │                 │  └─ UserContextDto.class
│  │                 ├─ entity
│  │                 │  ├─ BrowseRecord.class
│  │                 │  ├─ UserProfile.class
│  │                 │  └─ UserStats.class
│  │                 ├─ filter
│  │                 │  └─ JwtAuthenticationFilter.class
│  │                 ├─ ProfileServiceApplication.class
│  │                 ├─ repository
│  │                 │  └─ UserProfileRepository.class
│  │                 ├─ service
│  │                 │  └─ UserProfileService.class
│  │                 └─ util
│  │                    └─ JwtUtil.class
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
│     │  └─ maven-status
│     │     └─ maven-compiler-plugin
│     │        └─ compile
│     │           └─ default-compile
│     │              ├─ createdFiles.lst
│     │              └─ inputFiles.lst
│     └─ user-service.iml
├─ docs
│  ├─ PPT展示_Marp.md
│  ├─ PPT展示内容.md
│  ├─ UI.md
│  ├─ 协同过滤使用的大模型
│  ├─ 开题报告前准备工作.md
│  ├─ 性能优化.md
│  ├─ 数据库设计文档.md
│  ├─ 智能推荐部分增加协同过滤
│  ├─ 环境光感知.md
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
│  │  ├─ .gradle
│  │  │  ├─ 8.13
│  │  │  │  ├─ checksums
│  │  │  │  │  └─ checksums.lock
│  │  │  │  ├─ executionHistory
│  │  │  │  │  └─ executionHistory.lock
│  │  │  │  ├─ expanded
│  │  │  │  ├─ fileChanges
│  │  │  │  ├─ fileHashes
│  │  │  │  │  └─ fileHashes.lock
│  │  │  │  └─ gc.properties
│  │  │  ├─ buildOutputCleanup
│  │  │  │  ├─ buildOutputCleanup.lock
│  │  │  │  └─ cache.properties
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
│  │  │  │  │     │  │           ├─ cache-v2-e6760a6874a01920526c.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-d56489155c935cb578af.json
│  │  │  │  │     │  │           ├─ codemodel-v2-25632fb39a0293bfae1a.json
│  │  │  │  │     │  │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-Debug-ce80e9411a44e7b5c4e7.json
│  │  │  │  │     │  │           ├─ directory-rnblurview_autolinked_build-Debug-2608b3bd9ea61b1892c2.json
│  │  │  │  │     │  │           ├─ directory-RNImagePickerSpec_autolinked_build-Debug-95c0cba1ce00e080d0b6.json
│  │  │  │  │     │  │           ├─ directory-RNLlamaSpec_autolinked_build-Debug-309bb2ab8492df907922.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-Debug-6778232716d1a2c5d1e8.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-Debug-ee4679645502e7ade171.json
│  │  │  │  │     │  │           ├─ directory-VoskSpec_autolinked_build-Debug-33c2cba4e531b28ee8f8.json
│  │  │  │  │     │  │           ├─ index-2026-03-27T04-29-47-0176.json
│  │  │  │  │     │  │           ├─ target-appmodules-Debug-70956eca6f4bddc05e8c.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-Debug-9cdbb0bf2221d76a6de9.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnblurview-Debug-b8c24e25d3f3003496b4.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNImagePickerSpec-Debug-a9f71434d8c04861285a.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNLlamaSpec-Debug-548b9280bc2acc9e9cb6.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-Debug-76b0f28365f8820f9e90.json
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
│  │  │  │  │     │  │           ├─ cache-v2-cf0dbb953f1e602d6186.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-a0f892f3439eebbc03f1.json
│  │  │  │  │     │  │           ├─ codemodel-v2-00e6f4750363b8ab2710.json
│  │  │  │  │     │  │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-Debug-ce80e9411a44e7b5c4e7.json
│  │  │  │  │     │  │           ├─ directory-rnblurview_autolinked_build-Debug-2608b3bd9ea61b1892c2.json
│  │  │  │  │     │  │           ├─ directory-RNImagePickerSpec_autolinked_build-Debug-95c0cba1ce00e080d0b6.json
│  │  │  │  │     │  │           ├─ directory-RNLlamaSpec_autolinked_build-Debug-309bb2ab8492df907922.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-Debug-6778232716d1a2c5d1e8.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-Debug-ee4679645502e7ade171.json
│  │  │  │  │     │  │           ├─ directory-VoskSpec_autolinked_build-Debug-33c2cba4e531b28ee8f8.json
│  │  │  │  │     │  │           ├─ index-2026-03-27T04-30-17-0112.json
│  │  │  │  │     │  │           ├─ target-appmodules-Debug-96b186785f44c5e293d7.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-Debug-fd15119f7cd8c696abb1.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnblurview-Debug-0a2e063e819795665420.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNImagePickerSpec-Debug-ccf8ca87f66b7c122edb.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNLlamaSpec-Debug-7bd88cdc72e5096064e5.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-Debug-68ca310858a3d14d4201.json
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
│  │  │  │  │     │  │           ├─ cache-v2-82a4c62605f96a4793c3.json
│  │  │  │  │     │  │           ├─ cmakeFiles-v1-86b2ec7fae3e8fbb6fb1.json
│  │  │  │  │     │  │           ├─ codemodel-v2-ea5130bc3d747050a711.json
│  │  │  │  │     │  │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │     │  │           ├─ directory-rnasyncstorage_autolinked_build-Debug-ce80e9411a44e7b5c4e7.json
│  │  │  │  │     │  │           ├─ directory-rnblurview_autolinked_build-Debug-2608b3bd9ea61b1892c2.json
│  │  │  │  │     │  │           ├─ directory-RNImagePickerSpec_autolinked_build-Debug-95c0cba1ce00e080d0b6.json
│  │  │  │  │     │  │           ├─ directory-RNLlamaSpec_autolinked_build-Debug-309bb2ab8492df907922.json
│  │  │  │  │     │  │           ├─ directory-rnscreens_autolinked_build-Debug-6778232716d1a2c5d1e8.json
│  │  │  │  │     │  │           ├─ directory-safeareacontext_autolinked_build-Debug-ee4679645502e7ade171.json
│  │  │  │  │     │  │           ├─ directory-VoskSpec_autolinked_build-Debug-33c2cba4e531b28ee8f8.json
│  │  │  │  │     │  │           ├─ index-2026-03-27T04-30-37-0024.json
│  │  │  │  │     │  │           ├─ target-appmodules-Debug-d1a277c601a0bf818ebf.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnasyncstorage-Debug-9cdbb0bf2221d76a6de9.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnblurview-Debug-b8c24e25d3f3003496b4.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNImagePickerSpec-Debug-a9f71434d8c04861285a.json
│  │  │  │  │     │  │           ├─ target-react_codegen_RNLlamaSpec-Debug-548b9280bc2acc9e9cb6.json
│  │  │  │  │     │  │           ├─ target-react_codegen_rnscreens-Debug-50e115b758fa60c2c196.json
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
│  │  │  │  │        │           ├─ cache-v2-675ae5f6c9d318ee82f3.json
│  │  │  │  │        │           ├─ cmakeFiles-v1-bb29e0e4d23dea279a4d.json
│  │  │  │  │        │           ├─ codemodel-v2-c953ade9543fa3c5bac4.json
│  │  │  │  │        │           ├─ directory-.-Debug-d0094a50bb2071803777.json
│  │  │  │  │        │           ├─ directory-rnasyncstorage_autolinked_build-Debug-ce80e9411a44e7b5c4e7.json
│  │  │  │  │        │           ├─ directory-rnblurview_autolinked_build-Debug-2608b3bd9ea61b1892c2.json
│  │  │  │  │        │           ├─ directory-RNImagePickerSpec_autolinked_build-Debug-95c0cba1ce00e080d0b6.json
│  │  │  │  │        │           ├─ directory-RNLlamaSpec_autolinked_build-Debug-309bb2ab8492df907922.json
│  │  │  │  │        │           ├─ directory-rnscreens_autolinked_build-Debug-6778232716d1a2c5d1e8.json
│  │  │  │  │        │           ├─ directory-safeareacontext_autolinked_build-Debug-ee4679645502e7ade171.json
│  │  │  │  │        │           ├─ directory-VoskSpec_autolinked_build-Debug-33c2cba4e531b28ee8f8.json
│  │  │  │  │        │           ├─ index-2026-03-27T04-30-53-0318.json
│  │  │  │  │        │           ├─ target-appmodules-Debug-3e4cbb61653c3313897f.json
│  │  │  │  │        │           ├─ target-react_codegen_rnasyncstorage-Debug-9cdbb0bf2221d76a6de9.json
│  │  │  │  │        │           ├─ target-react_codegen_rnblurview-Debug-b8c24e25d3f3003496b4.json
│  │  │  │  │        │           ├─ target-react_codegen_RNImagePickerSpec-Debug-a9f71434d8c04861285a.json
│  │  │  │  │        │           ├─ target-react_codegen_RNLlamaSpec-Debug-548b9280bc2acc9e9cb6.json
│  │  │  │  │        │           ├─ target-react_codegen_rnscreens-Debug-2f6cb08df84eb4306c8f.json
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
│  │  │  │     └─ debug
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
│  │  │  └─ project.pbxproj
│  │  └─ Podfile
│  ├─ jest.config.js
│  ├─ metro.config.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ src
│  │  ├─ components
│  │  │  ├─ ActiveRecommendationModal.tsx
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
│  │  │  └─ WeatherAlertModal.tsx
│  │  ├─ config
│  │  │  └─ serviceConfig.js
│  │  ├─ hooks
│  │  │  ├─ useAmbientLight.ts
│  │  │  ├─ useAuth.tsx
│  │  │  ├─ useCoupons.js
│  │  │  ├─ useHealthContext.tsx
│  │  │  ├─ useOppoHealth.ts
│  │  │  └─ usePedometer.tsx
│  │  ├─ native
│  │  │  └─ HeytapHealthModule.ts
│  │  ├─ README.md
│  │  ├─ screens
│  │  │  ├─ AddressEditScreen.tsx
│  │  │  ├─ AddressListScreen.tsx
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
│  │  │  ├─ NutriVisionResultScreen.tsx
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
│  ├─ App.css
│  ├─ App.jsx
│  ├─ assets
│  │  └─ react.svg
│  ├─ components
│  │  ├─ admin
│  │  │  ├─ AdminLayout.jsx
│  │  │  ├─ ApiTestPanel.jsx
│  │  │  ├─ Header.jsx
│  │  │  └─ Sidebar.jsx
│  │  └─ merchant
│  │     ├─ MerchantHeader.jsx
│  │     └─ MerchantSidebar.jsx
│  ├─ config
│  │  └─ adminConfig.js
│  ├─ docs
│  │  └─ 统计数据架构分析.md
│  ├─ hooks
│  │  ├─ useAuth.jsx
│  │  └─ useCoupons.js
│  ├─ index.css
│  ├─ main.jsx
│  ├─ pages
│  │  ├─ admin
│  │  │  ├─ AdminLogin.jsx
│  │  │  ├─ Commissions.jsx
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ DashboardModern.jsx
│  │  │  ├─ DashboardNew.jsx
│  │  │  ├─ Marketing.jsx
│  │  │  ├─ Merchants.jsx
│  │  │  ├─ Orders.jsx
│  │  │  ├─ Services.jsx
│  │  │  ├─ ServicesNew.jsx
│  │  │  ├─ Settlements.jsx
│  │  │  ├─ SettlementsNew.jsx
│  │  │  ├─ StatsTestPage.jsx
│  │  │  ├─ SystemMonitor.jsx
│  │  │  ├─ UserCredit.jsx
│  │  │  └─ Users.jsx
│  │  ├─ merchant
│  │  │  ├─ MenuManagement.jsx
│  │  │  ├─ MerchantLayout.jsx
│  │  │  ├─ MerchantOnboarding.jsx
│  │  │  ├─ MerchantShopInfo.jsx
│  │  │  ├─ RefundAudit.jsx
│  │  │  ├─ ServiceMarketplace.jsx
│  │  │  ├─ SettlementDashboard.jsx
│  │  │  └─ SmartPricing.jsx
│  │  └─ user
│  │     ├─ Address.jsx
│  │     ├─ Cart.jsx
│  │     ├─ Home.jsx
│  │     ├─ Login.jsx
│  │     ├─ MyOrders.jsx
│  │     ├─ OrderConfirm.jsx
│  │     ├─ OrderTracking.jsx
│  │     ├─ PaymentSuccess.jsx
│  │     ├─ Profile.jsx
│  │     ├─ RestaurantDetail.jsx
│  │     ├─ Survey.jsx
│  │     └─ Wallet.jsx
│  ├─ services
│  │  ├─ addressService.js
│  │  ├─ admin
│  │  │  ├─ apiConfig.js
│  │  │  ├─ apiTester.js
│  │  │  ├─ authService.js
│  │  │  ├─ dashboardService.js
│  │  │  ├─ index.js
│  │  │  ├─ marketingService.js
│  │  │  ├─ merchantService.js
│  │  │  ├─ orderService.js
│  │  │  ├─ orderStatsService.js
│  │  │  ├─ platformService.js
│  │  │  ├─ settlementService.js
│  │  │  ├─ systemService.js
│  │  │  └─ userService.js
│  │  ├─ aiPricingService.js
│  │  ├─ apiClient.js
│  │  ├─ authService.js
│  │  ├─ index.js
│  │  ├─ merchantOrderService.js
│  │  ├─ merchantService.js
│  │  ├─ orderService.js
│  │  ├─ platformService.js
│  │  ├─ profileService.js
│  │  ├─ recommendationService.js
│  │  ├─ settlementService.js
│  │  ├─ userService.js
│  │  └─ walletService.js
│  ├─ types
│  │  ├─ admin.js
│  │  └─ coupon.ts
│  └─ utils
│     ├─ apiDiagnostic.js
│     ├─ apiTest.js
│     ├─ apiTester.js
│     ├─ couponIssueDebug.js
│     ├─ couponUtils.js
│     ├─ debugApiConnection.js
│     ├─ debugAuth.js
│     ├─ debugMarketingApi.js
│     ├─ fieldMapper.js
│     ├─ frontendTester.js
│     ├─ pageUpdater.js
│     ├─ quickDiagnostic.js
│     ├─ simpleMarketingTest.js
│     ├─ statsApiChecker.js
│     ├─ statsDebugger.js
│     └─ testMarketingFeatures.js
├─ README.md
└─ src_frontend_web

```