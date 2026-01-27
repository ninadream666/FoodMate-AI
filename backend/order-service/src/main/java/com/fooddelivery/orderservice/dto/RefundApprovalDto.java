package com.fooddelivery.orderservice.dto;

import lombok.Data;

@Data
public class RefundApprovalDto {
    private Long orderId;
    private Boolean approved;      // true=同意, false=拒绝
    private String rejectReason;   // 拒绝原因（可选）
}
