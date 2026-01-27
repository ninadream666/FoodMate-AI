package com.fooddelivery.merchant.dto;

import lombok.Data;
import java.util.List;

/**
 * 批量导入请求 DTO
 */
@Data
public class BatchImportRequest {
    private List<RealRestaurantDTO> restaurants;
}
