package com.fooddelivery.platformservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 确认结算单请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmSettlementRequest {
    
    // 可以扩展添加确认备注等字段
    private String remark;
}
