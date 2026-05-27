package com.chitmanager.backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "chit_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChitGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private Integer durationMonths;

    @Column(nullable = false)
    private Integer memberCount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyCollection;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChitGroupStatus status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private String startMonth;
    
    @OneToMany(mappedBy = "chitGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChitMember> members;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChitStrategyType strategyType;

    private BigDecimal commissionPercentage;

    private BigDecimal baseContribution;

    private BigDecimal postPayoutContribution;

    private BigDecimal payoutAdjustmentValue;

    private Integer expectedPayoutsPerMonth;

    private BigDecimal estimatedProfit;

    private BigDecimal actualProfit;

    private Boolean profitCalculated;
}
