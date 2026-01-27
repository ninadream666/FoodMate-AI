package com.fooddelivery.merchant.service;

import com.fooddelivery.merchant.dto.CreateMerchantRequest;
import com.fooddelivery.merchant.dto.CreateMenuItemRequest;
import com.fooddelivery.merchant.dto.MerchantDto;
import com.fooddelivery.merchant.dto.RealRestaurantDTO;
import com.fooddelivery.merchant.entity.Merchant;
import com.fooddelivery.merchant.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final MenuService menuService;

    @Transactional
    public MerchantDto createMerchant(Long userId, CreateMerchantRequest request) {
        // 适配 Repository: findByOwnerUserId 返回 List
        List<Merchant> existing = merchantRepository.findByOwnerUserId(userId);
        if (!existing.isEmpty()) {
            throw new RuntimeException("User already has a registered restaurant");
        }

        Merchant merchant = new Merchant();
        merchant.setOwnerUserId(userId);
        merchant.setName(request.getName());
        merchant.setAddress(request.getAddress());
        merchant.setEnableDynamicPricing(true);
        merchant.setSource("LOCAL");

        Merchant saved = merchantRepository.save(merchant);
        return mapToDto(saved);
    }

    public MerchantDto getMerchantByUserId(Long userId) {
        // 使用 OrderByIdAsc 确保返回顺序确定，始终返回 ID 最小的店铺（即最早创建的）
        List<Merchant> merchants = merchantRepository.findByOwnerUserIdOrderByIdAsc(userId);
        if (merchants.isEmpty()) {
            throw new RuntimeException("Merchant not found for user: " + userId);
        }
        // 暂时限制一个用户一个餐厅，取第一个
        return mapToDto(merchants.get(0));
    }

    public MerchantDto getMerchantById(Long merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new RuntimeException("Merchant not found: " + merchantId));
        return mapToDto(merchant);
    }

    /**
     * 通过任意 ID 获取商家（支持数字 ID 和外部 ID）
     */
    public Optional<MerchantDto> findByAnyId(String merchantId) {
        // 先尝试作为数字 ID 查询
        try {
            Long id = Long.parseLong(merchantId);
            Optional<Merchant> merchant = merchantRepository.findById(id);
            if (merchant.isPresent()) {
                return Optional.of(mapToDto(merchant.get()));
            }
        } catch (NumberFormatException ignored) {
            // 不是数字，继续按外部 ID 查询
        }

        // 按外部 ID 查询
        return merchantRepository.findByExternalId(merchantId)
                .map(this::mapToDto);
    }

    /**
     * 通过任意 ID 获取商家实体（支持数字 ID 和外部 ID）
     */
    public Optional<Merchant> findEntityByAnyId(String merchantId) {
        // 先尝试作为数字 ID 查询
        try {
            Long id = Long.parseLong(merchantId);
            Optional<Merchant> merchant = merchantRepository.findById(id);
            if (merchant.isPresent()) {
                return merchant;
            }
        } catch (NumberFormatException ignored) {
            // 不是数字，继续按外部 ID 查询
        }

        // 按外部 ID 查询
        return merchantRepository.findByExternalId(merchantId);
    }

    /**
     * 通过外部 ID 获取商家
     */
    public Optional<MerchantDto> findByExternalId(String externalId) {
        return merchantRepository.findByExternalId(externalId)
                .map(this::mapToDto);
    }

    /**
     * 导入真实餐厅（来自智能体/地图 API）
     * 自动根据菜系类型生成默认菜品
     */
    @Transactional
    public MerchantDto importRealRestaurant(RealRestaurantDTO dto) {
        // 检查是否已存在
        Optional<Merchant> existing = merchantRepository.findByExternalId(dto.getExternalId());
        if (existing.isPresent()) {
            // 已存在，返回现有数据
            return mapToDto(existing.get());
        }

        // 创建新商家
        Merchant merchant = new Merchant();
        merchant.setExternalId(dto.getExternalId());
        merchant.setName(dto.getName());
        merchant.setAddress(dto.getAddress());
        merchant.setLatitude(dto.getLatitude());
        merchant.setLongitude(dto.getLongitude());
        merchant.setImageUrl(dto.getImageUrl());
        merchant.setRating(dto.getRating());
        merchant.setCuisineType(dto.getCuisineType());
        merchant.setPhone(dto.getPhone());
        merchant.setDescription(dto.getDescription());
        merchant.setSource("AGENT"); // 标记来源为智能体
        merchant.setEnableDynamicPricing(true);

        Merchant saved = merchantRepository.save(merchant);

        // 自动生成默认菜品
        generateDefaultMenuItems(saved.getId(), dto.getCuisineType(), dto.getName());

        log.info("导入商家成功: {} (ID: {}, ExternalID: {}), 已自动生成菜品",
                saved.getName(), saved.getId(), saved.getExternalId());

        return mapToDto(saved);
    }

    /**
     * 根据菜系类型生成默认菜品
     */
    private void generateDefaultMenuItems(Long merchantId, String cuisineType, String merchantName) {
        List<MenuItemTemplate> templates = getMenuTemplatesByCuisine(cuisineType, merchantName);

        for (MenuItemTemplate template : templates) {
            CreateMenuItemRequest request = new CreateMenuItemRequest();
            request.setName(template.name);
            request.setPrice(template.price);
            request.setDescription(template.description);
            request.setCategory(template.category);
            request.setImageUrl(template.imageUrl);

            menuService.addMenuItem(merchantId, request);
        }

        log.info("为商家 {} 生成了 {} 个默认菜品", merchantId, templates.size());
    }

    /**
     * 菜品模板内部类
     */
    private static class MenuItemTemplate {
        String name;
        BigDecimal price;
        String description;
        String category;
        String imageUrl;

        MenuItemTemplate(String name, double price, String description, String category) {
            this.name = name;
            this.price = BigDecimal.valueOf(price);
            this.description = description;
            this.category = category;
            this.imageUrl = "https://via.placeholder.com/200x200.png?text=" + name;
        }
    }

    /**
     * 根据菜系类型获取菜品模板
     */
    private List<MenuItemTemplate> getMenuTemplatesByCuisine(String cuisineType, String merchantName) {
        List<MenuItemTemplate> templates = new ArrayList<>();
        String cuisine = cuisineType != null ? cuisineType.toLowerCase() : "";

        // 根据菜系/餐厅类型生成对应菜品
        if (cuisine.contains("火锅") || cuisine.contains("hotpot")) {
            templates.add(new MenuItemTemplate("招牌鸳鸯锅", 68.0, "一半麻辣一半清汤，满足不同口味", "锅底"));
            templates.add(new MenuItemTemplate("麻辣牛肉锅", 78.0, "精选牛肉，麻辣鲜香", "锅底"));
            templates.add(new MenuItemTemplate("肥牛卷", 38.0, "新鲜肥牛，入口即化", "涮菜"));
            templates.add(new MenuItemTemplate("毛肚", 42.0, "七上八下，脆嫩爽口", "涮菜"));
            templates.add(new MenuItemTemplate("鲜虾滑", 35.0, "手打虾滑，Q弹鲜美", "涮菜"));
            templates.add(new MenuItemTemplate("蔬菜拼盘", 28.0, "时令蔬菜，营养健康", "涮菜"));
        } else if (cuisine.contains("川菜") || cuisine.contains("sichuan")) {
            templates.add(new MenuItemTemplate("麻婆豆腐", 28.0, "麻辣鲜香，下饭神器", "热菜"));
            templates.add(new MenuItemTemplate("水煮牛肉", 58.0, "麻辣鲜嫩，肉质细腻", "热菜"));
            templates.add(new MenuItemTemplate("回锅肉", 38.0, "肥而不腻，香辣可口", "热菜"));
            templates.add(new MenuItemTemplate("宫保鸡丁", 35.0, "酸甜微辣，花生香脆", "热菜"));
            templates.add(new MenuItemTemplate("担担面", 18.0, "芝麻花生，麻辣鲜香", "主食"));
        } else if (cuisine.contains("粤菜") || cuisine.contains("cantonese") || cuisine.contains("茶餐厅")) {
            templates.add(new MenuItemTemplate("白切鸡", 48.0, "皮爽肉滑，原汁原味", "热菜"));
            templates.add(new MenuItemTemplate("叉烧饭", 28.0, "蜜汁叉烧，甜香四溢", "主食"));
            templates.add(new MenuItemTemplate("虾饺", 32.0, "晶莹剔透，鲜虾Q弹", "点心"));
            templates.add(new MenuItemTemplate("肠粉", 22.0, "滑嫩爽口，酱香浓郁", "点心"));
            templates.add(new MenuItemTemplate("煲仔饭", 35.0, "锅巴香脆，腊味浓郁", "主食"));
        } else if (cuisine.contains("日料") || cuisine.contains("日本") || cuisine.contains("寿司")
                || cuisine.contains("japanese")) {
            templates.add(new MenuItemTemplate("三文鱼刺身", 58.0, "新鲜三文鱼，入口即化", "刺身"));
            templates.add(new MenuItemTemplate("寿司拼盘", 68.0, "多种口味，精致美味", "寿司"));
            templates.add(new MenuItemTemplate("味噌拉面", 38.0, "浓郁汤底，面条劲道", "主食"));
            templates.add(new MenuItemTemplate("日式炸猪排", 42.0, "外酥里嫩，配特制酱汁", "热菜"));
            templates.add(new MenuItemTemplate("天妇罗", 45.0, "酥脆可口，海鲜蔬菜", "小吃"));
        } else if (cuisine.contains("韩") || cuisine.contains("korean") || cuisine.contains("烤肉")) {
            templates.add(new MenuItemTemplate("韩式烤五花肉", 68.0, "肥瘦相间，配蒜片生菜", "烤肉"));
            templates.add(new MenuItemTemplate("石锅拌饭", 32.0, "锅巴香脆，拌酱美味", "主食"));
            templates.add(new MenuItemTemplate("部队锅", 78.0, "丰富配料，鲜香可口", "锅类"));
            templates.add(new MenuItemTemplate("炸鸡", 48.0, "外酥里嫩，韩式调味", "小吃"));
            templates.add(new MenuItemTemplate("冷面", 28.0, "冰爽可口，酸甜开胃", "主食"));
        } else if (cuisine.contains("面") || cuisine.contains("noodle") || cuisine.contains("馄饨")) {
            templates.add(new MenuItemTemplate("红烧牛肉面", 28.0, "大块牛肉，汤鲜面劲道", "面食"));
            templates.add(new MenuItemTemplate("阳春面", 15.0, "清汤寡水，面条爽滑", "面食"));
            templates.add(new MenuItemTemplate("炸酱面", 22.0, "黄瓜丝配肉酱，经典美味", "面食"));
            templates.add(new MenuItemTemplate("鲜肉馄饨", 18.0, "皮薄馅大，鲜香可口", "小吃"));
            templates.add(new MenuItemTemplate("葱油拌面", 16.0, "葱香四溢，简单美味", "面食"));
        } else if (cuisine.contains("快餐") || cuisine.contains("汉堡") || cuisine.contains("炸鸡")
                || cuisine.contains("western")) {
            templates.add(new MenuItemTemplate("经典牛肉汉堡", 32.0, "100%纯牛肉饼，新鲜蔬菜", "汉堡"));
            templates.add(new MenuItemTemplate("香辣鸡腿堡", 28.0, "酥脆鸡腿，秘制酱料", "汉堡"));
            templates.add(new MenuItemTemplate("炸鸡套餐", 38.0, "外酥里嫩，配薯条可乐", "套餐"));
            templates.add(new MenuItemTemplate("薯条", 12.0, "金黄酥脆，撒盐调味", "小吃"));
            templates.add(new MenuItemTemplate("可乐", 8.0, "冰爽解渴", "饮品"));
        } else if (cuisine.contains("咖啡") || cuisine.contains("甜品") || cuisine.contains("奶茶")
                || cuisine.contains("饮品")) {
            templates.add(new MenuItemTemplate("美式咖啡", 22.0, "经典美式，香醇浓郁", "咖啡"));
            templates.add(new MenuItemTemplate("拿铁", 28.0, "丝滑奶泡，咖啡香气", "咖啡"));
            templates.add(new MenuItemTemplate("珍珠奶茶", 18.0, "Q弹珍珠，茶香奶香", "奶茶"));
            templates.add(new MenuItemTemplate("提拉米苏", 32.0, "意式经典，入口即化", "甜品"));
            templates.add(new MenuItemTemplate("芒果千层", 38.0, "新鲜芒果，层层奶油", "甜品"));
        } else if (cuisine.contains("烧烤") || cuisine.contains("bbq") || cuisine.contains("串")) {
            templates.add(new MenuItemTemplate("烤羊肉串", 6.0, "鲜嫩多汁，孜然飘香", "烤串"));
            templates.add(new MenuItemTemplate("烤牛肉串", 8.0, "精选牛肉，外焦里嫩", "烤串"));
            templates.add(new MenuItemTemplate("烤鸡翅", 8.0, "蜜汁烤制，香甜可口", "烤串"));
            templates.add(new MenuItemTemplate("烤茄子", 15.0, "蒜香浓郁，软糯入味", "烤蔬菜"));
            templates.add(new MenuItemTemplate("烤金针菇", 12.0, "鲜嫩爽口，酱香四溢", "烤蔬菜"));
        } else {
            // 默认菜品（通用餐厅）
            templates.add(new MenuItemTemplate("招牌套餐", 38.0, merchantName + "精选招牌菜品", "套餐"));
            templates.add(new MenuItemTemplate("今日特价", 28.0, "每日限量特价菜品", "特价"));
            templates.add(new MenuItemTemplate("经典小炒", 32.0, "家常小炒，美味可口", "热菜"));
            templates.add(new MenuItemTemplate("米饭", 3.0, "香喷喷的白米饭", "主食"));
            templates.add(new MenuItemTemplate("例汤", 12.0, "今日靓汤，营养健康", "汤品"));
        }

        return templates;
    }

    public boolean isMerchantOwner(Long merchantId, Long userId) {
        return merchantRepository.findByIdAndOwnerUserId(merchantId, userId).isPresent();
    }

    public List<MerchantDto> getAllActiveMerchants() {
        List<Merchant> merchants = merchantRepository.findByEnableDynamicPricing(true);
        return merchants.stream().map(this::mapToDto).toList();
    }

    /**
     * 将 Merchant 实体转换为 DTO（公开方法）
     */
    public MerchantDto toDto(Merchant merchant) {
        return mapToDto(merchant);
    }

    private MerchantDto mapToDto(Merchant merchant) {
        MerchantDto dto = new MerchantDto();
        dto.setId(merchant.getId());
        dto.setExternalId(merchant.getExternalId());
        dto.setOwnerUserId(merchant.getOwnerUserId());
        dto.setName(merchant.getName());
        dto.setAddress(merchant.getAddress());
        dto.setLatitude(merchant.getLatitude());
        dto.setLongitude(merchant.getLongitude());
        dto.setImageUrl(merchant.getImageUrl());
        dto.setRating(merchant.getRating());
        dto.setCuisineType(merchant.getCuisineType());
        dto.setPhone(merchant.getPhone());
        dto.setDescription(merchant.getDescription());
        dto.setSource(merchant.getSource());
        dto.setEnableDynamicPricing(merchant.getEnableDynamicPricing());
        dto.setEnableAutoApproval(merchant.getEnableAutoApproval());
        dto.setAutoApprovalThreshold(merchant.getAutoApprovalThreshold());
        return dto;
    }

    @Transactional
    public MerchantDto updateAutoApprovalSettings(Long merchantId, Boolean enable, Double threshold) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new RuntimeException("Merchant not found: " + merchantId));
        
        if (enable != null) {
            merchant.setEnableAutoApproval(enable);
        }
        
        if (threshold != null) {
            if (!Boolean.TRUE.equals(merchant.getEnableAutoApproval()) && !Boolean.TRUE.equals(enable)) {
                throw new RuntimeException("Cannot set threshold when auto approval is disabled");
            }
            if (threshold < 0 || threshold > 1.0) {
                throw new RuntimeException("Threshold must be between 0 and 1.0");
            }
            merchant.setAutoApprovalThreshold(threshold);
        }
        
        return mapToDto(merchantRepository.save(merchant));
    }
}