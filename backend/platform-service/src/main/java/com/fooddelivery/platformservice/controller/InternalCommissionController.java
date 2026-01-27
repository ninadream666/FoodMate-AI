package com.fooddelivery.platformservice.controller;

import com.fooddelivery.platformservice.dto.CalculateCommissionRequest;
import com.fooddelivery.platformservice.dto.CalculateCommissionResponse;
import com.fooddelivery.platformservice.dto.CommissionRecordDTO;
import com.fooddelivery.platformservice.service.CommissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 内部接口 - 供其他微服务调用
 * 注意：生产环境应增加内部认证机制
 */
@RestController
@RequestMapping("/api/internal/commissions")
@RequiredArgsConstructor
@Tag(name = "内部接口-分成计算", description = "供订单服务等内部调用")
public class InternalCommissionController {

    private final CommissionService commissionService;

    @PostMapping("/calculate")
    @Operation(summary = "计算订单分成", description = "订单完成时调用，计算各项分成")
    public ResponseEntity<CalculateCommissionResponse> calculateCommission(
            @Valid @RequestBody CalculateCommissionRequest request) {
        CalculateCommissionResponse response = commissionService.calculateCommission(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refund/{orderId}")
    @Operation(summary = "退款回滚分成", description = "订单退款时调用，回滚分成记录")
    public ResponseEntity<Void> refundCommission(@PathVariable Long orderId) {
        commissionService.refundCommission(orderId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "获取订单分成详情")
    public ResponseEntity<List<CommissionRecordDTO>> getOrderCommissions(@PathVariable Long orderId) {
        List<CommissionRecordDTO> records = commissionService.getOrderCommissions(orderId);
        return ResponseEntity.ok(records);
    }
}
