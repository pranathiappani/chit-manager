package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.LoanDTO;
import com.chitmanager.backend.dto.LoanPaymentDTO;
import com.chitmanager.backend.models.Loan;
import com.chitmanager.backend.models.LoanPayment;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.repositories.LoanRepository;
import com.chitmanager.backend.repositories.LoanPaymentRepository;
import com.chitmanager.backend.repositories.MemberRepository;
import com.chitmanager.backend.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private LoanPaymentRepository loanPaymentRepository;

    @Transactional
    public LoanDTO recordLoan(LoanDTO dto) {
        String tenantId = SecurityUtils.getTenantId();
        Member member = memberRepository.findByTenantIdAndId(tenantId, dto.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        Loan loan = new Loan();
        loan.setTenantId(tenantId);
        loan.setMember(member);
        loan.setAmount(dto.getAmount());
        loan.setInterestRate(dto.getInterestRate());
        loan.setStartDate(dto.getStartDate());
        loan.setEndDate(dto.getEndDate());
        loan.setStatus("ACTIVE");
        loan.setRemarks(dto.getRemarks());
        loan.setInterestType(dto.getInterestType() != null ? dto.getInterestType() : "ACCUMULATED");

        if (dto.getEndDate() != null) {
            // If end date is supplied at creation, close it immediately
            closeLoanCalculations(loan, dto.getEndDate());
        }

        return mapToDTO(loanRepository.save(loan));
    }

    @Transactional
    public LoanDTO closeLoan(Long loanId, LocalDate endDate) {
        String tenantId = SecurityUtils.getTenantId();
        Loan loan = loanRepository.findByTenantIdAndId(tenantId, loanId)
                .orElseThrow(() -> new RuntimeException("Loan record not found"));

        if (!"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is already closed");
        }

        closeLoanCalculations(loan, endDate);
        return mapToDTO(loanRepository.save(loan));
    }

    @Transactional
    public LoanPaymentDTO recordLoanPayment(Long loanId, LoanPaymentDTO dto) {
        String tenantId = SecurityUtils.getTenantId();
        Loan loan = loanRepository.findByTenantIdAndId(tenantId, loanId)
                .orElseThrow(() -> new RuntimeException("Loan record not found"));

        if (!"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Cannot log payment on a closed loan");
        }

        LoanPayment payment = new LoanPayment();
        payment.setTenantId(tenantId);
        payment.setLoan(loan);
        payment.setAmount(dto.getAmount());
        payment.setPaymentDate(dto.getPaymentDate());
        payment.setPaymentType(dto.getPaymentType() != null ? dto.getPaymentType() : "INTEREST");
        payment.setRemarks(dto.getRemarks());

        LoanPayment saved = loanPaymentRepository.save(payment);
        return mapPaymentToDTO(saved);
    }

    public List<LoanPaymentDTO> getLoanPayments(Long loanId) {
        String tenantId = SecurityUtils.getTenantId();
        // verify ownership
        loanRepository.findByTenantIdAndId(tenantId, loanId)
                .orElseThrow(() -> new RuntimeException("Loan record not found"));

        return loanPaymentRepository.findByTenantIdAndLoanIdOrderByPaymentDateDesc(tenantId, loanId)
                .stream()
                .map(this::mapPaymentToDTO)
                .collect(Collectors.toList());
    }

    private void closeLoanCalculations(Loan loan, LocalDate endDate) {
        LocalDate startDate = loan.getStartDate();
        if (endDate.isBefore(startDate)) {
            throw new RuntimeException("End date cannot be before start date");
        }

        int years = endDate.getYear() - startDate.getYear();
        int months = endDate.getMonthValue() - startDate.getMonthValue();
        int days = endDate.getDayOfMonth() - startDate.getDayOfMonth();

        boolean isStartLastDay = startDate.getDayOfMonth() == startDate.lengthOfMonth();
        boolean isEndLastDay = endDate.getDayOfMonth() == endDate.lengthOfMonth();
        if (isStartLastDay && isEndLastDay) {
            days = 0;
        }

        double elapsedMonths = years * 12 + months;
        if (days == -1 || days == 0) {
            // Treated as full month/year cycle (e.g. May 28 to May 27 next year is 12 months)
        } else {
            elapsedMonths += (double) days / 30.0;
        }

        if (elapsedMonths < 0) {
            elapsedMonths = 0;
        }

        // Simple Interest Calculation: Interest = P * (R / 100) * (Months)
        BigDecimal interestRateFactor = loan.getInterestRate().divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
        BigDecimal timeFactor = new BigDecimal(Double.toString(elapsedMonths)).setScale(6, RoundingMode.HALF_UP);
        
        BigDecimal totalInterestExpected = loan.getAmount()
                .multiply(interestRateFactor)
                .multiply(timeFactor)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal alreadyCollected = BigDecimal.ZERO;

        if (loan.getId() != null) {
            alreadyCollected = loanPaymentRepository.findByTenantIdAndLoanId(loan.getTenantId(), loan.getId()).stream()
                    .filter(p -> "INTEREST".equals(p.getPaymentType()))
                    .map(LoanPayment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // Ensure calculated interest at closure is at least the interest already collected
        if (alreadyCollected.compareTo(totalInterestExpected) > 0) {
            totalInterestExpected = alreadyCollected;
        }

        BigDecimal remainingInterest = totalInterestExpected;

        if ("MONTHLY".equals(loan.getInterestType())) {
            remainingInterest = totalInterestExpected.subtract(alreadyCollected);
            if (remainingInterest.compareTo(BigDecimal.ZERO) < 0) {
                remainingInterest = BigDecimal.ZERO;
            }
        }

        BigDecimal totalRepayable = loan.getAmount().add(remainingInterest).setScale(2, RoundingMode.HALF_UP);

        loan.setEndDate(endDate);
        loan.setCalculatedInterest(totalInterestExpected); // historical ledger retains full interest earned
        loan.setTotalRepayableAmount(totalRepayable); // the actual cash payload required at closure
        loan.setStatus("CLOSED");

        // Record historical closure collections in ledger
        if (loan.getId() != null) {
            // Record principal payment
            LoanPayment principalPay = new LoanPayment();
            principalPay.setTenantId(loan.getTenantId());
            principalPay.setLoan(loan);
            principalPay.setAmount(loan.getAmount());
            principalPay.setPaymentDate(endDate);
            principalPay.setPaymentType("PRINCIPAL");
            principalPay.setRemarks("Principal repayment on closure");
            loanPaymentRepository.save(principalPay);

            // Record outstanding interest payment if any
            if ("MONTHLY".equals(loan.getInterestType())) {
                if (remainingInterest.compareTo(BigDecimal.ZERO) > 0) {
                    LoanPayment finalInterestPay = new LoanPayment();
                    finalInterestPay.setTenantId(loan.getTenantId());
                    finalInterestPay.setLoan(loan);
                    finalInterestPay.setAmount(remainingInterest);
                    finalInterestPay.setPaymentDate(endDate);
                    finalInterestPay.setPaymentType("INTEREST");
                    finalInterestPay.setRemarks("Outstanding interest repayment on closure");
                    loanPaymentRepository.save(finalInterestPay);
                }
            } else {
                // ACCUMULATED interest type logs full interest collection at closure
                if (totalInterestExpected.compareTo(BigDecimal.ZERO) > 0) {
                    LoanPayment finalInterestPay = new LoanPayment();
                    finalInterestPay.setTenantId(loan.getTenantId());
                    finalInterestPay.setLoan(loan);
                    finalInterestPay.setAmount(totalInterestExpected);
                    finalInterestPay.setPaymentDate(endDate);
                    finalInterestPay.setPaymentType("INTEREST");
                    finalInterestPay.setRemarks("Accumulated interest repayment on closure");
                    loanPaymentRepository.save(finalInterestPay);
                }
            }
        }
    }

    public List<LoanDTO> getAllLoans() {
        String tenantId = SecurityUtils.getTenantId();
        return loanRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private LoanDTO mapToDTO(Loan loan) {
        LoanDTO dto = new LoanDTO();
        dto.setId(loan.getId());
        dto.setMemberId(loan.getMember().getId());
        dto.setMemberName(loan.getMember().getName());
        dto.setAmount(loan.getAmount());
        dto.setInterestRate(loan.getInterestRate());
        dto.setStartDate(loan.getStartDate());
        dto.setEndDate(loan.getEndDate());
        dto.setStatus(loan.getStatus());
        dto.setCalculatedInterest(loan.getCalculatedInterest());
        dto.setTotalRepayableAmount(loan.getTotalRepayableAmount());
        dto.setRemarks(loan.getRemarks());
        dto.setInterestType(loan.getInterestType() != null ? loan.getInterestType() : "ACCUMULATED");

        if (loan.getId() != null) {
            BigDecimal collected = loanPaymentRepository.findByTenantIdAndLoanId(loan.getTenantId(), loan.getId()).stream()
                    .filter(p -> "INTEREST".equals(p.getPaymentType()))
                    .map(LoanPayment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setCollectedInterest(collected.setScale(2, RoundingMode.HALF_UP));
        } else {
            dto.setCollectedInterest(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }

        return dto;
    }

    @Transactional
    public void deleteLoan(Long id) {
        String tenantId = SecurityUtils.getTenantId();
        Loan loan = loanRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("Loan record not found"));

        loanPaymentRepository.deleteAll(loanPaymentRepository.findByTenantIdAndLoanId(tenantId, id));
        loanRepository.delete(loan);
    }

    private LoanPaymentDTO mapPaymentToDTO(LoanPayment p) {
        LoanPaymentDTO dto = new LoanPaymentDTO();
        dto.setId(p.getId());
        dto.setLoanId(p.getLoan().getId());
        dto.setAmount(p.getAmount());
        dto.setPaymentDate(p.getPaymentDate());
        dto.setPaymentType(p.getPaymentType());
        dto.setRemarks(p.getRemarks());
        return dto;
    }
}

