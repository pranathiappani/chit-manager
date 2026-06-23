package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.PayoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface PayoutPlanRepository extends JpaRepository<PayoutPlan, Long> {
    List<PayoutPlan> findByChitGroupIdOrderByMonthNumberAsc(Long chitGroupId);
    List<PayoutPlan> findByTenantIdAndChitGroupIdOrderByMonthNumberAsc(String tenantId, Long chitGroupId);
    Optional<PayoutPlan> findByTenantIdAndId(String tenantId, Long id);
    List<PayoutPlan> findAllByTenantId(String tenantId);
    void deleteByTenantId(String tenantId);
}
