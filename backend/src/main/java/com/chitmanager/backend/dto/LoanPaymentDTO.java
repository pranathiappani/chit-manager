package com.chitmanager.backend.dto;

import lombok.Data;
import com.chitmanager.backend.models.PaymentMode;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LoanPaymentDTO {
    private Long id;
    private Long loanId;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String paymentType; // INTEREST, PRINCIPAL
    private String remarks;
    private PaymentMode paymentMode;
}
