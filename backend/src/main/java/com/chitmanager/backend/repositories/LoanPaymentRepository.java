package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {
    List<LoanPayment> findByLoanIdOrderByPaymentDateDesc(Long loanId);
    List<LoanPayment> findByLoanId(Long loanId);
}
