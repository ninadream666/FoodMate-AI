package com.fooddelivery.userservice.controller;

import com.fooddelivery.userservice.dto.AddressDto;
import com.fooddelivery.userservice.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/address")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    // 新增地址
    @PostMapping
    public ResponseEntity<AddressDto> addAddress(@RequestBody AddressDto dto) {
        String username = getCurrentUsername();
        return ResponseEntity.ok(addressService.addAddress(username, dto));
    }

    // 获取我的地址列表
    @GetMapping
    public ResponseEntity<List<AddressDto>> getMyAddresses() {
        String username = getCurrentUsername();
        return ResponseEntity.ok(addressService.getUserAddresses(username));
    }

    // 修改地址信息
    @PutMapping("/{id}")
    public ResponseEntity<AddressDto> updateAddress(@PathVariable Long id, @RequestBody AddressDto dto) {
        String username = getCurrentUsername();
        return ResponseEntity.ok(addressService.updateAddress(username, id, dto));
    }

    // 删除地址
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        String username = getCurrentUsername();
        addressService.deleteAddress(username, id);
        return ResponseEntity.ok().build();
    }

    // 设为默认地址
    @PutMapping("/{id}/default")
    public ResponseEntity<Void> setDefaultAddress(@PathVariable Long id) {
        String username = getCurrentUsername();
        addressService.setDefaultAddress(username, id);
        return ResponseEntity.ok().build();
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}