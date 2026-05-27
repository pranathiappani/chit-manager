package com.chitmanager.backend.services;

import com.chitmanager.backend.models.ActualPayout;
import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.ChitStrategyType;
import com.chitmanager.backend.models.PayoutPlan;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class IncrementalContributionStrategy implements ChitProfitStrategy {

    @Override
    public ChitStrategyType getStrategyType() {
        return ChitStrategyType.INCREMENTAL_CONTRIBUTION;
    }

    @Override
    public BigDecimal calculateEstimatedProfit(ChitGroup chitGroup) {
        // Estimated Profit: durationMonths * totalAmount * (commissionPercentage / 100)
        if (chitGroup.getDurationMonths() == null || chitGroup.getCommissionPercentage() == null 
            || chitGroup.getTotalAmount() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal commissionRatio = chitGroup.getCommissionPercentage().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        
        BigDecimal expectedTotalProfit = chitGroup.getTotalAmount()
                .multiply(new BigDecimal(chitGroup.getDurationMonths()))
                .multiply(commissionRatio);
                
        return expectedTotalProfit.setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public ActualPayout calculatePayoutAdjustments(ChitGroup chitGroup, ActualPayout payout, List<PayoutPlan> plans, List<ActualPayout> existingPayouts) {
        int expectedPayoutsPerMonth = chitGroup.getExpectedPayoutsPerMonth() != null ? chitGroup.getExpectedPayoutsPerMonth() : 1;
        
        int slotConsumed = existingPayouts.size() + 1;
        int expectedMonthForThisSlot = (int) Math.ceil((double) slotConsumed / expectedPayoutsPerMonth);
        
        payout.setPayoutSequenceSlot(slotConsumed);
        payout.setPlannedPayoutAmount(payout.getPayoutAmount()); // Planned amount is flexible in this strategy usually
        
        BigDecimal adjustmentValue = chitGroup.getPayoutAdjustmentValue() != null ? chitGroup.getPayoutAdjustmentValue() : BigDecimal.ZERO;
        BigDecimal adjustmentProfit = BigDecimal.ZERO;
        
        int actualMonth = payout.getPayoutMonth();
        
        if (actualMonth < expectedMonthForThisSlot) {
            payout.setEarlyPayout(true);
            payout.setDelayedPayout(false);
            // Profit multiplier
            int monthsEarly = expectedMonthForThisSlot - actualMonth;
            adjustmentProfit = adjustmentValue.multiply(new BigDecimal(monthsEarly));
        } else if (actualMonth > expectedMonthForThisSlot) {
            payout.setEarlyPayout(false);
            payout.setDelayedPayout(true);
            // Loss multiplier
            int monthsDelayed = actualMonth - expectedMonthForThisSlot;
            adjustmentProfit = adjustmentValue.multiply(new BigDecimal(monthsDelayed)).negate();
        } else {
            payout.setEarlyPayout(false);
            payout.setDelayedPayout(false);
        }

        payout.setAdjustmentProfit(adjustmentProfit);
        
        // Standard profit for this payout: (usually Chit Amount - Payout Amount)
        if (chitGroup.getTotalAmount() != null && payout.getPayoutAmount() != null) {
            payout.setProfitAmount(chitGroup.getTotalAmount().subtract(payout.getPayoutAmount()));
        } else {
            payout.setProfitAmount(BigDecimal.ZERO);
        }
        
        return payout;
    }

    @Override
    public BigDecimal calculateFinalActualProfit(ChitGroup chitGroup, List<ActualPayout> payouts) {
        BigDecimal estimatedProfit = chitGroup.getEstimatedProfit() != null ? chitGroup.getEstimatedProfit() : calculateEstimatedProfit(chitGroup);
        
        BigDecimal totalAdjustments = BigDecimal.ZERO;
        for (ActualPayout p : payouts) {
            if (p.getAdjustmentProfit() != null) {
                totalAdjustments = totalAdjustments.add(p.getAdjustmentProfit());
            }
        }
        
        return estimatedProfit.add(totalAdjustments).setScale(2, RoundingMode.HALF_UP);
    }
}
