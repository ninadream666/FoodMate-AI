package com.fooddelivery.common.constants;

/**
 * 业务常量
 */
public class BusinessConstants {

    /**
     * JWT相关常量
     */
    public static class JWT {
        public static final String HEADER_NAME = "Authorization";
        public static final String TOKEN_PREFIX = "Bearer ";
        public static final String CLAIM_USER_ID = "userId";
        public static final String CLAIM_ROLE = "role";
        public static final String CLAIM_USERNAME = "username";
    }

    /**
     * 分页相关常量
     */
    public static class PAGINATION {
        public static final int DEFAULT_PAGE = 0;
        public static final int DEFAULT_SIZE = 10;
        public static final int MAX_SIZE = 100;
    }

    /**
     * 缓存相关常量
     */
    public static class CACHE {
        public static final String USER_CACHE = "users";
        public static final String MERCHANT_CACHE = "merchants";
        public static final String ORDER_CACHE = "orders";
        public static final String MENU_CACHE = "menu_items";
        public static final int DEFAULT_TTL_MINUTES = 30;
    }

    /**
     * API相关常量
     */
    public static class API {
        public static final String SUCCESS_CODE = "SUCCESS";
        public static final String ERROR_CODE = "ERROR";
        public static final String SUCCESS_MESSAGE = "操作成功";
        public static final String ERROR_MESSAGE = "操作失败";
    }

    /**
     * 订单相关常量
     */
    public static class ORDER {
        public static final String ORDER_ID_PREFIX = "ORD";
        public static final int MIN_ORDER_AMOUNT = 1; // 最小订单金额（分）
        public static final int MAX_ORDER_ITEMS = 50; // 最大商品数量
    }

    /**
     * 支付相关常量
     */
    public static class PAYMENT {
        public static final int PAYMENT_TIMEOUT_MINUTES = 30; // 支付超时时间
        public static final String PAYMENT_CALLBACK_PATH = "/api/payment/callback";
    }

    /**
     * 营销相关常量
     */
    public static class MARKETING {
        public static final int MAX_COUPON_PER_USER = 10; // 用户最大优惠券数量
        public static final int COUPON_CODE_LENGTH = 8; // 优惠券码长度
    }

    /**
     * 文件上传相关常量
     */
    public static class FILE {
        public static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        public static final String[] ALLOWED_IMAGE_TYPES = { "jpg", "jpeg", "png", "gif" };
        public static final String UPLOAD_PATH = "/uploads/";
    }
}