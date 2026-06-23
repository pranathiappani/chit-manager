package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.PayoutDTO;
import com.chitmanager.backend.dto.PayoutPlanDTO;
import com.chitmanager.backend.dto.PayoutSummaryDTO;
import com.chitmanager.backend.models.ActualPayout;
import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.models.ChitMember;
import com.chitmanager.backend.models.PayoutPlan;
import com.chitmanager.backend.repositories.ActualPayoutRepository;
import com.chitmanager.backend.repositories.ChitGroupRepository;
import com.chitmanager.backend.repositories.MemberRepository;
import com.chitmanager.backend.repositories.PayoutPlanRepository;
import com.chitmanager.backend.repositories.ChitMemberRepository;
import com.chitmanager.backend.security.SecurityUtils;
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
    private ChitMemberRepository chitMemberRepository;

    @Autowired
    private ProfitCalculationService profitCalculationService;

    @Transactional
    public PayoutDTO recordPayout(PayoutDTO dto) {
        String tenantId = SecurityUtils.getTenantId();
        ChitGroup chitGroup = chitGroupRepository.findByTenantIdAndId(tenantId, dto.getChitGroupId())
                .orElseThrow(() -> new RuntimeException("Chit group not found"));
        
        Member member = memberRepository.findByTenantIdAndId(tenantId, dto.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        ActualPayout payout = new ActualPayout();
        payout.setTenantId(tenantId);
        payout.setChitGroup(chitGroup);
        payout.setMember(member);
        payout.setPayoutMonth(dto.getPayoutMonth());
        payout.setPayoutAmount(dto.getPayoutAmount());
        
        payout.setPayoutDate(dto.getPayoutDate());
        payout.setRemarks(dto.getRemarks());

        if (dto.getChitMemberId() != null) {
            ChitMember chitMember = chitMemberRepository.findByTenantIdAndId(tenantId, dto.getChitMemberId())
                    .orElseThrow(() -> new RuntimeException("Chit member slot not found"));
            payout.setChitMember(chitMember);
        }
        
        List<PayoutPlan> plans = payoutPlanRepository.findByTenantIdAndChitGroupIdOrderByMonthNumberAsc(tenantId, dto.getChitGroupId());
        List<ActualPayout> existingPayouts = actualPayoutRepository.findByTenantIdAndChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(tenantId, dto.getChitGroupId());
        
        ChitProfitStrategy strategy = profitCalculationService.getStrategy(chitGroup.getStrategyType());
        payout = strategy.calculatePayoutAdjustments(chitGroup, payout, plans, existingPayouts);

        return mapToDTO(actualPayoutRepository.save(payout));
    }

    @Transactional
    public void completeChit(Long chitGroupId) {
        String tenantId = SecurityUtils.getTenantId();
        ChitGroup chitGroup = chitGroupRepository.findByTenantIdAndId(tenantId, chitGroupId)
                .orElseThrow(() -> new RuntimeException("Chit group not found"));
                
        List<ActualPayout> payouts = actualPayoutRepository.findByTenantIdAndChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(tenantId, chitGroupId);
        ChitProfitStrategy strategy = profitCalculationService.getStrategy(chitGroup.getStrategyType());
        
        BigDecimal actualProfit = strategy.calculateFinalActualProfit(chitGroup, payouts);
        
        chitGroup.setActualProfit(actualProfit);
        chitGroup.setProfitCalculated(true);
        chitGroup.setStatus(com.chitmanager.backend.models.ChitGroupStatus.COMPLETED); // Assuming COMPLETED enum value exists
        
        chitGroupRepository.save(chitGroup);
    }

    public List<PayoutDTO> getPayoutsForChit(Long chitGroupId) {
        String tenantId = SecurityUtils.getTenantId();
        return actualPayoutRepository.findByTenantIdAndChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(tenantId, chitGroupId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    /**
     * Core logic for the Dynamic Payout Balancing Engine.
     * Evaluates total expected payouts vs actual payouts, decoupling from rigid monthly assumptions.
     */
    public PayoutSummaryDTO getPayoutSummary(Long chitGroupId) {
        String tenantId = SecurityUtils.getTenantId();
        ChitGroup chitGroup = chitGroupRepository.findByTenantIdAndId(tenantId, chitGroupId)
                .orElseThrow(() -> new RuntimeException("Chit group not found"));

        List<PayoutPlan> plans = payoutPlanRepository.findByTenantIdAndChitGroupIdOrderByMonthNumberAsc(tenantId, chitGroupId);
        List<ActualPayout> actualPayouts = actualPayoutRepository.findByTenantIdAndChitGroupIdOrderByPayoutMonthAscPayoutSequenceSlotAsc(tenantId, chitGroupId);

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
        String tenantId = SecurityUtils.getTenantId();
        ChitGroup chitGroup = chitGroupRepository.findByTenantIdAndId(tenantId, chitGroupId)
                .orElseThrow(() -> new RuntimeException("Chit group not found"));

        // Delete existing and set new
        List<PayoutPlan> existingPlans = payoutPlanRepository.findByTenantIdAndChitGroupIdOrderByMonthNumberAsc(tenantId, chitGroupId);
        payoutPlanRepository.deleteAll(existingPlans);

        List<PayoutPlan> newPlans = planDtos.stream().map(dto -> {
            PayoutPlan plan = new PayoutPlan();
            plan.setTenantId(tenantId);
            plan.setChitGroup(chitGroup);
            plan.setMonthNumber(dto.getMonthNumber());
            plan.setPayoutAmount(dto.getPayoutAmount());
            plan.setExpectedPayoutCount(dto.getExpectedPayoutCount());
            return plan;
        }).collect(Collectors.toList());

        payoutPlanRepository.saveAll(newPlans);
    }

    public List<PayoutPlanDTO> getPayoutPlansForChit(Long chitGroupId) {
        String tenantId = SecurityUtils.getTenantId();
        return payoutPlanRepository.findByTenantIdAndChitGroupIdOrderByMonthNumberAsc(tenantId, chitGroupId)
                .stream().map(plan -> {
                    PayoutPlanDTO dto = new PayoutPlanDTO();
                    dto.setMonthNumber(plan.getMonthNumber());
                    dto.setPayoutAmount(plan.getPayoutAmount());
                    dto.setExpectedPayoutCount(plan.getExpectedPayoutCount());
                    return dto;
                }).collect(Collectors.toList());
    }

    @Transactional
    public void deletePayout(Long id) {
        String tenantId = SecurityUtils.getTenantId();
        ActualPayout payout = actualPayoutRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("Payout record not found"));
        actualPayoutRepository.delete(payout);
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
        dto.setChitMemberId(payout.getChitMember() != null ? payout.getChitMember().getId() : null);
        return dto;
    }
}
