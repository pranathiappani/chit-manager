package com.chitmanager.backend.services;

import com.chitmanager.backend.models.ActualPayout;
import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.ChitStrategyType;
import com.chitmanager.backend.models.PayoutPlan;

import java.math.BigDecimal;
import java.util.List;

public interface ChitProfitStrategy {
    ChitStrategyType getStrategyType();

    BigDecimal calculateEstimatedProfit(ChitGroup chitGroup);

    ActualPayout calculatePayoutAdjustments(ChitGroup chitGroup, ActualPayout payout, List<PayoutPlan> plans, List<ActualPayout> existingPayouts);

    BigDecimal calculateFinalActualProfit(ChitGroup chitGroup, List<ActualPayout> payouts);
}
