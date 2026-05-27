package com.chitmanager.backend.services;

import com.chitmanager.backend.models.ChitStrategyType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProfitCalculationService {

    private final Map<ChitStrategyType, ChitProfitStrategy> strategies;

    @Autowired
    public ProfitCalculationService(List<ChitProfitStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(ChitProfitStrategy::getStrategyType, s -> s));
    }

    public ChitProfitStrategy getStrategy(ChitStrategyType type) {
        ChitProfitStrategy strategy = strategies.get(type);
        if (strategy == null) {
            // Default to Fixed Commission if null or CUSTOM is selected without explicit implementation
            return strategies.get(ChitStrategyType.FIXED_COMMISSION_PROGRESSIVE);
        }
        return strategy;
    }
}
