package com.fooddelivery.userservice.service;

import com.fooddelivery.userservice.dto.AddressDto;
import com.fooddelivery.userservice.entity.Address;
import com.fooddelivery.userservice.entity.User;
import com.fooddelivery.userservice.repository.AddressRepository;
import com.fooddelivery.userservice.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    // 新增地址
    @Transactional
    public AddressDto addAddress(String username, AddressDto dto) {
        // 校验必填项
        if (dto.getCity() == null || dto.getCity().trim().isEmpty()) {
            throw new IllegalArgumentException("城市不能为空");
        }
        if (dto.getStreet() == null || dto.getStreet().trim().isEmpty()) {
            throw new IllegalArgumentException("街道/小区不能为空");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = new Address();
        address.setUser(user);
        address.setCity(dto.getCity());
        address.setStreet(dto.getStreet());
        address.setDetail(dto.getDetail());

        // 2自动处理默认地址逻辑：如果是第一条地址，自动设为默认
        long count = addressRepository.countByUserId(user.getId());
        address.setIsDefault(count == 0);

        Address saved = addressRepository.save(address);
        return convertToDto(saved);
    }

    // 获取列表
    public List<AddressDto> getUserAddresses(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 使用Repository的排序方法，确保默认地址在第一位
        return addressRepository.findByUserIdOrderByIsDefaultDescIdDesc(user.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 修改地址
    @Transactional
    public AddressDto updateAddress(String username, Long addressId, AddressDto dto) {
        Address address = getAddressAndCheckOwner(username, addressId);

        if (dto.getCity() != null && !dto.getCity().trim().isEmpty()) address.setCity(dto.getCity());
        if (dto.getStreet() != null && !dto.getStreet().trim().isEmpty()) address.setStreet(dto.getStreet());
        if (dto.getDetail() != null) address.setDetail(dto.getDetail());

        Address saved = addressRepository.save(address);
        return convertToDto(saved);
    }

    // 删除地址
    @Transactional
    public void deleteAddress(String username, Long addressId) {
        Address address = getAddressAndCheckOwner(username, addressId);
        User user = address.getUser();
        boolean wasDefault = address.getIsDefault();

        addressRepository.delete(address);

        // 如果删除的是默认地址，且还有其他地址，自动顺延最新的为默认
        if (wasDefault) {
            addressRepository.findFirstByUserIdAndIsDefaultFalseOrderByCreatedAtDesc(user.getId())
                    .ifPresent(nextDefault -> {
                        nextDefault.setIsDefault(true);
                        addressRepository.save(nextDefault);
                    });
        }
    }

    // 设为默认
    @Transactional
    public void setDefaultAddress(String username, Long addressId) {
        Address targetAddress = getAddressAndCheckOwner(username, addressId);
        User user = targetAddress.getUser();

        // 找到该用户当前的默认地址，取消默认
        addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                .ifPresent(oldDefault -> {
                    oldDefault.setIsDefault(false);
                    addressRepository.save(oldDefault);
                });

        // 设置新的默认地址
        targetAddress.setIsDefault(true);
        addressRepository.save(targetAddress);
    }

    // 查询地址并校验归属权
    private Address getAddressAndCheckOwner(String username, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        
        if (!address.getUser().getUsername().equals(username)) {
            throw new RuntimeException("Permission denied: Not your address");
        }
        return address;
    }

    private AddressDto convertToDto(Address address) {
        AddressDto dto = new AddressDto();
        dto.setId(address.getId());
        dto.setCity(address.getCity());
        dto.setStreet(address.getStreet());
        dto.setDetail(address.getDetail());
        dto.setIsDefault(address.getIsDefault());
        return dto;
    }
}