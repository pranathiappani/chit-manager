package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.PayoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayoutPlanRepository extends JpaRepository<PayoutPlan, Long> {
    List<PayoutPlan> findByChitGroupIdOrderByMonthNumberAsc(Long chitGroupId);
}
