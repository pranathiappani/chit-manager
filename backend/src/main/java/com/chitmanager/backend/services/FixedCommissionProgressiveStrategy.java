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
public class FixedCommissionProgressiveStrategy implements ChitProfitStrategy {

    @Override
    public ChitStrategyType getStrategyType() {
        return ChitStrategyType.FIXED_COMMISSION_PROGRESSIVE;
    }

    @Override
    public BigDecimal calculateEstimatedProfit(ChitGroup chitGroup) {
        // Estimated Profit: (numberOfMembers) * (commissionPercentage / 100) * (chitAmount)
        if (chitGroup.getMemberCount() == null || chitGroup.getCommissionPercentage() == null || chitGroup.getTotalAmount() == null) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal commissionRatio = chitGroup.getCommissionPercentage().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        BigDecimal expectedTotalProfit = chitGroup.getTotalAmount()
                .multiply(commissionRatio)
                .multiply(new BigDecimal(chitGroup.getMemberCount()));
                
        return expectedTotalProfit.setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public ActualPayout calculatePayoutAdjustments(ChitGroup chitGroup, ActualPayout payout, List<PayoutPlan> plans, List<ActualPayout> existingPayouts) {
        // Find the slot to be consumed.
        // It's consumed sequentially based on existing payouts.
        int slotConsumed = existingPayouts.size() + 1; // 1-indexed
        
        // Ensure we don't exceed planned slots (edge case handling)
        if (slotConsumed > chitGroup.getDurationMonths()) {
            slotConsumed = chitGroup.getDurationMonths();
        }
        
        final int targetSlot = slotConsumed;
        PayoutPlan plannedSlot = plans.stream()
                .filter(p -> p.getMonthNumber() == targetSlot)
                .findFirst()
                .orElse(null);
                
        BigDecimal plannedAmount = (plannedSlot != null && plannedSlot.getPayoutAmount() != null) 
                ? plannedSlot.getPayoutAmount() 
                : chitGroup.getTotalAmount(); // fallback
                
        payout.setPayoutSequenceSlot(slotConsumed);
        payout.setPlannedPayoutAmount(plannedAmount);
        
        // Payout Slot Swap Profit:
        // Profit = Planned Amount for this slot - Actual Paid Amount
        BigDecimal adjustmentProfit = plannedAmount.subtract(payout.getPayoutAmount());
        payout.setAdjustmentProfit(adjustmentProfit);
        
        // Determine early/delayed based on payoutMonth vs expected slot
        // In Type 1, "early" vs "delayed" mostly just triggers the swap logic above.
        // We can just mark them for analytics.
        if (payout.getPayoutMonth() < slotConsumed) {
            payout.setEarlyPayout(true);
            payout.setDelayedPayout(false);
        } else if (payout.getPayoutMonth() > slotConsumed) {
            payout.setEarlyPayout(false);
            payout.setDelayedPayout(true);
        } else {
            payout.setEarlyPayout(false);
            payout.setDelayedPayout(false);
        }

        // Standard profit for this specific payout (not related to adjustment):
        // Total amount - Payout amount
        payout.setProfitAmount(chitGroup.getTotalAmount().subtract(payout.getPayoutAmount()));
        
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
