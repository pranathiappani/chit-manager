package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.PayoutDTO;
import com.chitmanager.backend.dto.PayoutPlanDTO;
import com.chitmanager.backend.dto.PayoutSummaryDTO;
import com.chitmanager.backend.models.ActualPayout;
import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.models.PayoutPlan;
import com.chitmanager.backend.repositories.ActualPayoutRepository;
import com.chitmanager.backend.repositories.ChitGroupRepository;
import com.chitmanager.backend.repositories.MemberRepository;
import com.chitmanager.backend.repositories.PayoutPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PayoutService {

    @Autowired
    private ActualPayoutRepository actualPayoutRepository;

    @Autowired
    private PayoutPlanRepository payoutPlanRepository;

    @Autowired
    private ChitGroupRepository chitGroupRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private ProfitCalculationService profitCalculationService;

    @Transactional
    public PayoutDTO recordPayout(PayoutDTO dto) {
        ChitGroup chitGroup = chitGroupRepository.findById(dto.getChitGroupId())
                .orElseThrow(() -> new RuntimeException("Chit group not found"));
        
        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        ActualPayout payout = new ActualPayout();
        payout.setChitGroup(chitGroup);
        payout.setMember(member);
        payout.setPayoutMonth(dto.getPayoutMonth());
        payout.setPayoutAmount(dto.getPayoutAmount());
        
        payout.setPayoutDate(dto.getPayoutDate());
        payout.setRemarks(dto.getRemarks());
        
        List<PayoutPlan> plans = payoutPlanRepository.findByChitGroupIdOrderByMonthNumberAsc(dto.getChitGroupId());
        List<ActualPayout> existingPayouts = actualPayoutRepository.findByChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(dto.getChitGroupId());
        
        ChitProfitStrategy strategy = profitCalculationService.getStrategy(chitGroup.getStrategyType());
        payout = strategy.calculatePayoutAdjustments(chitGroup, payout, plans, existingPayouts);

        return mapToDTO(actualPayoutRepository.save(payout));
    }

    @Transactional
    public void completeChit(Long chitGroupId) {
        ChitGroup chitGroup = chitGroupRepository.findById(chitGroupId)
                .orElseThrow(() -> new RuntimeException("Chit group not found"));
                
        List<ActualPayout> payouts = actualPayoutRepository.findByChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(chitGroupId);
        ChitProfitStrategy strategy = profitCalculationService.getStrategy(chitGroup.getStrategyType());
        
        BigDecimal actualProfit = strategy.calculateFinalActualProfit(chitGroup, payouts);
        
        chitGroup.setActualProfit(actualProfit);
        chitGroup.setProfitCalculated(true);
        chitGroup.setStatus(com.chitmanager.backend.models.ChitGroupStatus.COMPLETED); // Assuming COMPLETED enum value exists
        
        chitGroupRepository.save(chitGroup);
    }

    public List<PayoutDTO> getPayoutsForChit(Long chitGroupId) {
        return actualPayoutRepository.findByChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(chitGroupId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    /**
     * Core logic for the Dynamic Payout Balancing Engine.
     * Evaluates total expected payouts vs actual payouts, decoupling from rigid monthly assumptions.
     */
    public PayoutSummaryDTO getPayoutSummary(Long chitGroupId) {
        ChitGroup chitGroup = chitGroupRepository.findById(chitGroupId)
                .orElseThrow(() -> new RuntimeException("Chit group not found"));

        List<PayoutPlan> plans = payoutPlanRepository.findByChitGroupIdOrderByMonthNumberAsc(chitGroupId);
        List<ActualPayout> actualPayouts = actualPayoutRepository.findByChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(chitGroupId);

        int totalExpected = plans.stream().mapToInt(PayoutPlan::getExpectedPayoutCount).sum();
        int completed = actualPayouts.size();
        
        // If there's no plan defined yet, default expected payouts to member count or 1 per month
        if (totalExpected == 0) {
            // Assume 1 payout per month for the duration if not explicitly planned
            totalExpected = chitGroup.getDurationMonths(); 
        }

        int remaining = Math.max(0, totalExpected - completed);

        BigDecimal totalProfit = actualPayouts.stream()
                .map(ActualPayout::getProfitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int earlyCount = (int) actualPayouts.stream().filter(p -> Boolean.TRUE.equals(p.getEarlyPayout())).count();
        int delayedCount = (int) actualPayouts.stream().filter(p -> Boolean.TRUE.equals(p.getDelayedPayout())).count();

        BigDecimal earlyAdj = actualPayouts.stream()
                .filter(p -> Boolean.TRUE.equals(p.getEarlyPayout()))
                .map(p -> p.getAdjustmentProfit() != null ? p.getAdjustmentProfit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal delayedAdj = actualPayouts.stream()
                .filter(p -> Boolean.TRUE.equals(p.getDelayedPayout()))
                .map(p -> p.getAdjustmentProfit() != null ? p.getAdjustmentProfit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        PayoutSummaryDTO summary = new PayoutSummaryDTO();
        summary.setChitGroupId(chitGroupId);
        summary.setTotalExpectedPayouts(totalExpected);
        summary.setCompletedPayouts(completed);
        summary.setRemainingPayouts(remaining);
        summary.setTotalProfit(totalProfit);
        summary.setEarlyPayoutsCount(earlyCount);
        summary.setDelayedPayoutsCount(delayedCount);
        summary.setTotalEarlyAdjustment(earlyAdj);
        summary.setTotalDelayedAdjustment(delayedAdj);

        return summary;
    }

    @Transactional
    public void setupExpectedPayoutPlan(Long chitGroupId, List<PayoutPlanDTO> planDtos) {
        ChitGroup chitGroup = chitGroupRepository.findById(chitGroupId)
                .orElseThrow(() -> new RuntimeException("Chit group not found"));

        // Delete existing and set new
        List<PayoutPlan> existingPlans = payoutPlanRepository.findByChitGroupIdOrderByMonthNumberAsc(chitGroupId);
        payoutPlanRepository.deleteAll(existingPlans);

        List<PayoutPlan> newPlans = planDtos.stream().map(dto -> {
            PayoutPlan plan = new PayoutPlan();
            plan.setChitGroup(chitGroup);
            plan.setMonthNumber(dto.getMonthNumber());
            plan.setPayoutAmount(dto.getPayoutAmount());
            plan.setExpectedPayoutCount(dto.getExpectedPayoutCount());
            return plan;
        }).collect(Collectors.toList());

        payoutPlanRepository.saveAll(newPlans);
    }

    public List<PayoutPlanDTO> getPayoutPlansForChit(Long chitGroupId) {
        return payoutPlanRepository.findByChitGroupIdOrderByMonthNumberAsc(chitGroupId)
                .stream().map(plan -> {
                    PayoutPlanDTO dto = new PayoutPlanDTO();
                    dto.setMonthNumber(plan.getMonthNumber());
                    dto.setPayoutAmount(plan.getPayoutAmount());
                    dto.setExpectedPayoutCount(plan.getExpectedPayoutCount());
                    return dto;
                }).collect(Collectors.toList());
    }

    private PayoutDTO mapToDTO(ActualPayout payout) {
        PayoutDTO dto = new PayoutDTO();
        dto.setId(payout.getId());
        dto.setChitGroupId(payout.getChitGroup().getId());
        dto.setMemberId(payout.getMember().getId());
        dto.setMemberName(payout.getMember().getName());
        dto.setPayoutMonth(payout.getPayoutMonth());
        dto.setPayoutAmount(payout.getPayoutAmount());
        dto.setProfitAmount(payout.getProfitAmount());
        dto.setPayoutDate(payout.getPayoutDate());
        dto.setRemarks(payout.getRemarks());
        return dto;
    }
}
