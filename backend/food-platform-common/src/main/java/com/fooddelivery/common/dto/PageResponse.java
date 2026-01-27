package com.fooddelivery.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 统一分页响应对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content; // 当前页数据
    private int page; // 当前页码（从0开始）
    private int size; // 每页大小
    private long totalElements; // 总记录数
    private int totalPages; // 总页数
    private boolean first; // 是否为第一页
    private boolean last; // 是否为最后一页
    private boolean hasNext; // 是否有下一页
    private boolean hasPrevious; // 是否有上一页

    /**
     * 从Spring Data Page对象创建PageResponse
     */
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious());
    }

    /**
     * 创建空的分页响应
     */
    public static <T> PageResponse<T> empty(int page, int size) {
        return new PageResponse<>(
                List.of(),
                page,
                size,
                0L,
                0,
                true,
                true,
                false,
                false);
    }
}