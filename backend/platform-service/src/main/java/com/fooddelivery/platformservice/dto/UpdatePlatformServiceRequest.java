package com.fooddelivery.platformservice.dto;

import com.fooddelivery.platformservice.entity.BillingCycle;
import com.fooddelivery.platformservice.entity.FeeType;
import com.fooddelivery.platformservice.entity.ServiceCategory;
import com.fooddelivery.platformservice.entity.ServiceStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 更新平台服务请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePlatformServiceRequest {

    @Size(max = 100, message = "服务名称最多100个字符")
    private String serviceName;

    private ServiceCategory category;

    @Size(max = 500, message = "服务描述最多500个字符")
    private String description;

    private FeeType feeType;

    @DecimalMin(value = "0", inclusive = false, message = "费用值必须大于0")
    private BigDecimal feeValue;

    private BillingCycle billingCycle;

    @DecimalMin(value = "0", message = "最低订单金额不能为负")
    private BigDecimal minOrderAmount;

    private Boolean isMandatory;

    private ServiceStatus status;

    private Integer sortOrder;
}
