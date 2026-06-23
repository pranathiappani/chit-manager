package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {
    List<LoanPayment> findByLoanIdOrderByPaymentDateDesc(Long loanId);
    List<LoanPayment> findByLoanId(Long loanId);
    List<LoanPayment> findByTenantIdAndLoanIdOrderByPaymentDateDesc(String tenantId, Long loanId);
    List<LoanPayment> findByTenantIdAndLoanId(String tenantId, Long loanId);
    Optional<LoanPayment> findByTenantIdAndId(String tenantId, Long id);
    List<LoanPayment> findAllByTenantId(String tenantId);
    void deleteByTenantId(String tenantId);
}
