package com.chitmanager.backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.chitmanager.backend.security.CryptoConverter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "loans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private String tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate; // Monthly percentage rate

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @Column(nullable = false)
    private String status; // ACTIVE, CLOSED

    @Column(name = "interest_type", nullable = true, length = 50)
    private String interestType = "ACCUMULATED"; // ACCUMULATED, MONTHLY

    @Column(precision = 15, scale = 2)
    private BigDecimal calculatedInterest;

    @Column(precision = 15, scale = 2)
    private BigDecimal totalRepayableAmount;

    @Convert(converter = CryptoConverter.class)
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = true)
    private PaymentMode paymentMode;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
