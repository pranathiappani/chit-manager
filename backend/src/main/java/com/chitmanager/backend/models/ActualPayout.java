package com.chitmanager.backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import com.chitmanager.backend.security.CryptoConverter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "actual_payouts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActualPayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chit_group_id", nullable = false)
    private ChitGroup chitGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chit_member_id")
    private ChitMember chitMember;

    @Column(nullable = false)
    private Integer payoutMonth;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal payoutAmount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal profitAmount;

    @Column(nullable = false)
    private LocalDate payoutDate;

    @Convert(converter = CryptoConverter.class)
    private String remarks;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private Integer payoutSequenceSlot;

    private BigDecimal plannedPayoutAmount;

    private BigDecimal adjustmentProfit;

    private Boolean earlyPayout;

    private Boolean delayedPayout;
}
