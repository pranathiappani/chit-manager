package com.chitmanager.backend.dto;

import lombok.Data;
import com.chitmanager.backend.models.PaymentMode;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LoanDTO {
    private Long id;
    private Long memberId;
    private String memberName;
    private BigDecimal amount;
    private BigDecimal interestRate;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String interestType; // ACCUMULATED, MONTHLY
    private BigDecimal collectedInterest; // total interest collected so far
    private BigDecimal calculatedInterest;
    private BigDecimal totalRepayableAmount;
    private String remarks;
    private PaymentMode paymentMode;
}
