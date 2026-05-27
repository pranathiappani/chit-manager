package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.ActualPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActualPayoutRepository extends JpaRepository<ActualPayout, Long> {
    List<ActualPayout> findByChitGroupIdOrderByPayoutDateAsc(Long chitGroupId);
    List<ActualPayout> findByChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(Long chitGroupId);
    List<ActualPayout> findByMemberId(Long memberId);
}
