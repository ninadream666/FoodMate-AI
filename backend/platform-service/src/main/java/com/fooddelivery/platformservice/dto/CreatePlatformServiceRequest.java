package com.fooddelivery.platformservice.dto;

import com.fooddelivery.platformservice.entity.BillingCycle;
import com.fooddelivery.platformservice.entity.FeeType;
import com.fooddelivery.platformservice.entity.ServiceCategory;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 创建平台服务请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePlatformServiceRequest {

    @NotBlank(message = "服务编码不能为空")
    @Size(max = 50, message = "服务编码最多50个字符")
    @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "服务编码必须以大写字母开头，只能包含大写字母、数字和下划线")
    private String serviceCode;

    @NotBlank(message = "服务名称不能为空")
    @Size(max = 100, message = "服务名称最多100个字符")
    private String serviceName;

    @NotNull(message = "服务类别不能为空")
    private ServiceCategory category;

    @Size(max = 500, message = "服务描述最多500个字符")
    private String description;

    @NotNull(message = "收费类型不能为空")
    private FeeType feeType;

    @NotNull(message = "费用值不能为空")
    @DecimalMin(value = "0", inclusive = false, message = "费用值必须大于0")
    private BigDecimal feeValue;

    private BillingCycle billingCycle;

    @DecimalMin(value = "0", message = "最低订单金额不能为负")
    private BigDecimal minOrderAmount;

    private Boolean isMandatory;

    private Integer sortOrder;
}
