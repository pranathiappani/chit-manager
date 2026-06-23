package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findAllByOrderByCreatedAtDesc();
    List<Loan> findByMemberId(Long memberId);
    List<Loan> findAllByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<Loan> findByTenantIdAndMemberId(String tenantId, Long memberId);
    Optional<Loan> findByTenantIdAndId(String tenantId, Long id);
    void deleteByTenantId(String tenantId);
}
