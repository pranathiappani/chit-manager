package com.chitmanager.backend.dto;

import com.chitmanager.backend.models.ChitGroupStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ChitGroupDTO {
    private Long id;
    private String name;
    private BigDecimal totalAmount;
    private Integer durationMonths;
    private Integer memberCount;
    private BigDecimal monthlyCollection;
    private ChitGroupStatus status;
    private LocalDateTime createdAt;
    private String startMonth;
    private com.chitmanager.backend.models.ChitStrategyType strategyType;
    private BigDecimal commissionPercentage;
    private BigDecimal baseContribution;
    private BigDecimal postPayoutContribution;
    private BigDecimal payoutAdjustmentValue;
    private BigDecimal estimatedProfit;
    private BigDecimal actualProfit;
    private Boolean profitCalculated;
    private List<PayoutPlanDTO> payoutPlans;
}
