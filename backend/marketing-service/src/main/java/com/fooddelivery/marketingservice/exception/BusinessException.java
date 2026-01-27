package com.fooddelivery.marketingservice.exception;

import org.springframework.http.HttpStatus;

/**
 * 业务错误异常，携带 HTTP 状态码和错误信息
 */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
