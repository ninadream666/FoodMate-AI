package com.fooddelivery.merchant.service;

import com.fooddelivery.merchant.dto.CreateMenuItemRequest;
import com.fooddelivery.merchant.dto.MenuItemDto;
import com.fooddelivery.merchant.dto.UpdateMenuItemRequest;
import com.fooddelivery.merchant.entity.MenuItem;
import com.fooddelivery.merchant.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;

    @Transactional
    public MenuItemDto addMenuItem(Long merchantId, CreateMenuItemRequest request) {
        MenuItem item = new MenuItem();
        item.setMerchantId(merchantId);
        item.setName(request.getName());
        item.setPrice(request.getPrice());
        item.setDescription(request.getDescription());
        item.setImageUrl(request.getImageUrl());
        item.setCategory(request.getCategory());
        item.setIsAvailable(true);
        item.setBasePrice(request.getPrice());
        
        MenuItem saved = menuItemRepository.save(item);
        return mapToDto(saved);
    }

    @Transactional
    public MenuItemDto updateMenuItem(Long itemId, UpdateMenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        if (request.getName() != null) item.setName(request.getName());
        if (request.getPrice() != null) {
            item.setPrice(request.getPrice());
            item.setBasePrice(request.getPrice());
        }
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getImageUrl() != null) item.setImageUrl(request.getImageUrl());
        if (request.getCategory() != null) item.setCategory(request.getCategory());
        if (request.getIsAvailable() != null) item.setIsAvailable(request.getIsAvailable());

        MenuItem saved = menuItemRepository.save(item);
        return mapToDto(saved);
    }
    
    @Transactional
    public void deleteMenuItem(Long itemId) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));
        // 软删除
        item.setIsAvailable(false);
        menuItemRepository.save(item);
    }

    // 商家视图：查看所有
    public List<MenuItemDto> getMerchantMenu(Long merchantId) {
        return menuItemRepository.findByMerchantId(merchantId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // 顾客视图：仅查看上架商品
    public List<MenuItemDto> getPublicMenu(Long merchantId) {
        return menuItemRepository.findByMerchantIdAndIsAvailableTrue(merchantId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private MenuItemDto mapToDto(MenuItem item) {
        MenuItemDto dto = new MenuItemDto();
        dto.setId(item.getId());
        dto.setMerchantId(item.getMerchantId());
        dto.setName(item.getName());
        dto.setPrice(item.getPrice());
        dto.setDescription(item.getDescription());
        dto.setImageUrl(item.getImageUrl());
        dto.setCategory(item.getCategory());
        dto.setIsAvailable(item.getIsAvailable());
        return dto;
    }
}