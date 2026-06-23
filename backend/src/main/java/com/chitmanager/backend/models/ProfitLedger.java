package com.chitmanager.backend.models;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "profit_ledger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfitLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private String tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chit_group_id")
    private ChitGroup chitGroup;

    private Integer monthNumber;

    private BigDecimal expectedProfit;

    private BigDecimal adjustmentProfit;

    private BigDecimal finalProfit;

    private Integer expectedPayouts;

    private Integer actualPayouts;

    private Integer payoutDifference;

    @Enumerated(EnumType.STRING)
    private ProfitStatus profitStatus;
}
