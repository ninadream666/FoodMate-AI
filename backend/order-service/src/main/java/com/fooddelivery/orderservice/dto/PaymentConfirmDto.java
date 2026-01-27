package com.fooddelivery.orderservice.dto;

import lombok.Data;
import java.math.BigDecimal;

/**
 * 支付确认请求 DTO
 * 用于模拟支付成功后，将支付信息同步到订单服务
 */
@Data
public class PaymentConfirmDto {

    /**
     * 支付方式
     * WECHAT - 微信支付
     * ALIPAY - 支付宝
     * CARD - 银行卡
     * CASH - 现金
     */
    private String paymentMethod;

    /**
     * 第三方支付交易号
     * 用于对账和查询
     */
    private String paymentTransactionId;

    /**
     * 支付渠道
     * APP - 手机APP
     * MINI_PROGRAM - 小程序
     * H5 - 手机网页
     * WEB - PC网页
     */
    private String paymentChannel;

    /**
     * 实际支付金额
     * 用于校验支付金额是否正确
     */
    private BigDecimal paidAmount;

    /**
     * 备注信息
     */
    private String remark;
}
