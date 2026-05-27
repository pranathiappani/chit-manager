package com.chitmanager.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PayoutSummaryDTO {
    private Long chitGroupId;
    private Integer totalExpectedPayouts;
    private Integer completedPayouts;
    private Integer remainingPayouts;
    private BigDecimal totalProfit;
    private Integer earlyPayoutsCount;
    private Integer delayedPayoutsCount;
    private BigDecimal totalEarlyAdjustment;
    private BigDecimal totalDelayedAdjustment;
}
