package com.fooddelivery.marketingservice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 平台批量发放优惠券请求
 * 用于管理员批量发放同一优惠券给多个用户
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "平台管理员批量发放优惠券请求")
public class AdminIssueBatchRequest {

    @Schema(description = "优惠券模板ID", example = "1")
    private Long couponTemplateId;

    @Schema(description = "接收优惠券的用户ID列表", example = "[1, 2, 3]")
    private List<Long> userIds;

    @Schema(description = "发放备注", example = "活动促销赠送")
    private String remark;
}
