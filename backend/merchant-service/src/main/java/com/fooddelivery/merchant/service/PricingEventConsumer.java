package com.fooddelivery.merchant.service;

import com.fooddelivery.merchant.dto.UpdateMenuItemRequest;
import com.fooddelivery.merchant.entity.Merchant;
import com.fooddelivery.merchant.entity.MenuItem;
import com.fooddelivery.merchant.entity.MerchantNotification;
import com.fooddelivery.merchant.entity.PriceChangeProposal;
import com.fooddelivery.merchant.repository.MerchantNotificationRepository;
import com.fooddelivery.merchant.repository.MerchantRepository;
import com.fooddelivery.merchant.repository.MenuItemRepository;
import com.fooddelivery.merchant.repository.PriceChangeProposalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PricingEventConsumer {

    private final MenuService menuService;
    private final PriceChangeProposalRepository proposalRepository;
    private final MerchantNotificationRepository notificationRepository;
    private final MenuItemRepository menuItemRepository;
    private final MerchantRepository merchantRepository;

    @RabbitListener(queues = "merchant.pricing.updates")
    public void handlePricingEvent(Map<String, Object> message, @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        log.info("Received Pricing Event: {} with key {}", message, routingKey);

        try {
            Long merchantId = Long.valueOf(message.get("merchantId").toString());
            Long menuItemId = Long.valueOf(message.get("menuItemId").toString());
            Long proposalId = Long.valueOf(message.get("proposalId").toString());
            BigDecimal newPrice = new BigDecimal(message.get("newPrice").toString());
            String reason = (String) message.getOrDefault("reason", "AI Strategy");

            // 获取详情用于通知
            Optional<MenuItem> menuItemOpt = menuItemRepository.findById(menuItemId);
            Optional<Merchant> merchantOpt = merchantRepository.findById(merchantId);
            
            String itemName = menuItemOpt.map(MenuItem::getName).orElse("Unknown Item");
            String merchantName = merchantOpt.map(Merchant::getName).orElse("Unknown Merchant");
            // 获取旧价格 (在更新前)
            BigDecimal oldPrice = menuItemOpt.map(MenuItem::getPrice).orElse(BigDecimal.ZERO);

            // 判断是自动还是手动
            if (routingKey.contains("auto")) {
                // 自动通过：直接改价
                log.info("Auto-applying price change for item {}", menuItemId);
                UpdateMenuItemRequest request = new UpdateMenuItemRequest();
                request.setPrice(newPrice);
                menuService.updateMenuItem(menuItemId, request);
                
                // 记录 proposal
                saveProposal(proposalId, merchantId, menuItemId, newPrice, reason, "AUTO_APPLIED");

                // --- 发送通知：已自动调整 ---
                String content = String.format("【%s】的菜品【%s】价格已自动调整：%.2f -> %.2f。原因：%s", 
                        merchantName, itemName, oldPrice, newPrice, reason);
                createNotification(merchantId, "价格自动调整通知", content);

            } else {
                // 需要手动审批：存入数据库
                log.info("Saving manual approval task for item {}", menuItemId);
                saveProposal(proposalId, merchantId, menuItemId, newPrice, reason, "PENDING");

                // --- [新增] 发送通知：待审批 ---
                String content = String.format("AI 建议调整【%s】的价格：%.2f -> %.2f。原因：%s。请前往审批。", 
                        itemName, oldPrice, newPrice, reason);
                createNotification(merchantId, "价格调整建议待审批", content);
            }

        } catch (Exception e) {
            log.error("Error processing pricing event", e);
        }
    }

    private void saveProposal(Long externalId, Long merchantId, Long menuItemId, BigDecimal newPrice, String reason, String status) {
        PriceChangeProposal proposal = new PriceChangeProposal();
        proposal.setExternalProposalId(externalId);
        proposal.setMerchantId(merchantId);
        proposal.setMenuItemId(menuItemId);
        proposal.setSuggestedPrice(newPrice);
        
        // 获取当前价格
        Optional<MenuItem> menuItemOpt = menuItemRepository.findById(menuItemId);
        BigDecimal currentPrice = menuItemOpt.map(MenuItem::getPrice).orElse(BigDecimal.ZERO);
        proposal.setCurrentPrice(currentPrice); 
        
        proposal.setReason(reason);
        proposal.setStatus(status);
        proposalRepository.save(proposal);
    }

    // 通用通知方法，支持自定义标题和内容
    private void createNotification(Long merchantId, String title, String content) {
        MerchantNotification notification = new MerchantNotification();
        notification.setMerchantId(merchantId);
        notification.setTitle(title);
        notification.setType("PRICE_UPDATE");
        
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        // 在内容前加上时间戳
        notification.setContent(time + " " + content);
        
        notificationRepository.save(notification);
        log.info("Notification created for merchant {}", merchantId);
    }
}