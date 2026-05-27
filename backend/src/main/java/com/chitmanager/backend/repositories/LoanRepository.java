package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findAllByOrderByCreatedAtDesc();
    List<Loan> findByMemberId(Long memberId);
}
