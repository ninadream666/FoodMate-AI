package com.fooddelivery.common.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * 分页工具类
 */
public class PageUtils {

    /**
     * 默认页大小
     */
    public static final int DEFAULT_PAGE_SIZE = 10;

    /**
     * 最大页大小
     */
    public static final int MAX_PAGE_SIZE = 100;

    /**
     * 创建分页对象
     */
    public static Pageable createPageable(Integer page, Integer size) {
        return createPageable(page, size, null);
    }

    /**
     * 创建带排序的分页对象
     */
    public static Pageable createPageable(Integer page, Integer size, Sort sort) {
        // 处理空值和边界值
        page = (page == null || page < 0) ? 0 : page;
        size = (size == null || size <= 0) ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);

        if (sort != null) {
            return PageRequest.of(page, size, sort);
        } else {
            return PageRequest.of(page, size);
        }
    }

    /**
     * 创建按ID倒序的分页对象
     */
    public static Pageable createPageableWithIdDesc(Integer page, Integer size) {
        return createPageable(page, size, Sort.by(Sort.Direction.DESC, "id"));
    }

    /**
     * 创建按创建时间倒序的分页对象
     */
    public static Pageable createPageableWithCreateTimeDesc(Integer page, Integer size) {
        return createPageable(page, size, Sort.by(Sort.Direction.DESC, "createTime"));
    }

    /**
     * 创建按更新时间倒序的分页对象
     */
    public static Pageable createPageableWithUpdateTimeDesc(Integer page, Integer size) {
        return createPageable(page, size, Sort.by(Sort.Direction.DESC, "updateTime"));
    }

    /**
     * 验证页码参数
     */
    public static void validatePageParams(Integer page, Integer size) {
        if (page != null && page < 0) {
            throw new IllegalArgumentException("页码不能小于0");
        }
        if (size != null && size <= 0) {
            throw new IllegalArgumentException("页大小必须大于0");
        }
        if (size != null && size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("页大小不能超过" + MAX_PAGE_SIZE);
        }
    }
}