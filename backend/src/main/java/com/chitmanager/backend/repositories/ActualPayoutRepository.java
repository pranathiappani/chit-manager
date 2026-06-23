package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.ActualPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface ActualPayoutRepository extends JpaRepository<ActualPayout, Long> {
    List<ActualPayout> findByChitGroupIdOrderByPayoutDateAsc(Long chitGroupId);
    List<ActualPayout> findByChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(Long chitGroupId);
    List<ActualPayout> findByMemberId(Long memberId);
    List<ActualPayout> findByTenantIdAndChitGroupIdOrderByPayoutDateAsc(String tenantId, Long chitGroupId);
    List<ActualPayout> findByTenantIdAndChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(String tenantId, Long chitGroupId);
    List<ActualPayout> findByTenantIdAndMemberId(String tenantId, Long memberId);
    Optional<ActualPayout> findByTenantIdAndId(String tenantId, Long id);
    List<ActualPayout> findAllByTenantId(String tenantId);
    void deleteByTenantId(String tenantId);
}
