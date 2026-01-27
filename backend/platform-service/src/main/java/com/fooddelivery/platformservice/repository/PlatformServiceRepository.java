package com.fooddelivery.platformservice.repository;

import com.fooddelivery.platformservice.entity.PlatformService;
import com.fooddelivery.platformservice.entity.ServiceCategory;
import com.fooddelivery.platformservice.entity.ServiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformServiceRepository extends JpaRepository<PlatformService, Long> {

    /**
     * 根据服务编码查找
     */
    Optional<PlatformService> findByServiceCode(String serviceCode);

    /**
     * 查找所有启用的服务
     */
    List<PlatformService> findByStatusOrderBySortOrderAsc(ServiceStatus status);

    /**
     * 按类别查找启用的服务
     */
    List<PlatformService> findByCategoryAndStatusOrderBySortOrderAsc(ServiceCategory category, ServiceStatus status);

    /**
     * 查找所有强制订阅的服务
     */
    List<PlatformService> findByIsMandatoryTrueAndStatus(ServiceStatus status);

    /**
     * 查找所有可选服务（非强制）
     */
    List<PlatformService> findByIsMandatoryFalseAndStatusOrderBySortOrderAsc(ServiceStatus status);

    /**
     * 检查服务编码是否存在
     */
    boolean existsByServiceCode(String serviceCode);

    /**
     * 按类别统计启用的服务数量
     */
    @Query("SELECT ps.category, COUNT(ps) FROM PlatformService ps WHERE ps.status = :status GROUP BY ps.category")
    List<Object[]> countByCategory(@Param("status") ServiceStatus status);
}
