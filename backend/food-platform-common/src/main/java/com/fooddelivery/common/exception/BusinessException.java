package com.fooddelivery.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 业务异常基类
 */
@Getter
public class BusinessException extends RuntimeException {

    private final HttpStatus httpStatus;
    private final String errorCode;

    public BusinessException(String message) {
        super(message);
        this.httpStatus = HttpStatus.BAD_REQUEST;
        this.errorCode = "BUSINESS_ERROR";
    }

    public BusinessException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
        this.errorCode = "BUSINESS_ERROR";
    }

    public BusinessException(String message, String errorCode) {
        super(message);
        this.httpStatus = HttpStatus.BAD_REQUEST;
        this.errorCode = errorCode;
    }

    public BusinessException(String message, HttpStatus httpStatus, String errorCode) {
        super(message);
        this.httpStatus = httpStatus;
        this.errorCode = errorCode;
    }
}