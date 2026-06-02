package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.ChitGroupDTO;
import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.ChitGroupStatus;
import com.chitmanager.backend.models.ChitMember;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
public class ChitGroupService {

    @Autowired
    private ChitGroupRepository chitGroupRepository;
    
    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private ChitMemberRepository chitMemberRepository;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private ActualPayoutRepository actualPayoutRepository;

    @Autowired
    private PayoutPlanRepository payoutPlanRepository;

    @Autowired
    private ProfitCalculationService profitCalculationService;

    public List<ChitGroupDTO> getAllChitGroups() {
        return chitGroupRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public ChitGroupDTO getChitGroupById(Long id) {
        ChitGroup chitGroup = chitGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chit group not found"));
        return mapToDTO(chitGroup);
    }

    @Transactional
    public ChitGroupDTO createChitGroup(ChitGroupDTO dto) {
        ChitGroup chitGroup = new ChitGroup();
        chitGroup.setName(dto.getName());
        chitGroup.setTotalAmount(dto.getTotalAmount());
        chitGroup.setDurationMonths(dto.getDurationMonths());
        chitGroup.setMemberCount(dto.getMemberCount());
        chitGroup.setMonthlyCollection(dto.getMonthlyCollection() != null ? dto.getMonthlyCollection() : java.math.BigDecimal.ZERO);
        chitGroup.setStatus(ChitGroupStatus.ACTIVE);
        chitGroup.setStartMonth(dto.getStartMonth());
        
        chitGroup.setStrategyType(dto.getStrategyType() != null ? dto.getStrategyType() : com.chitmanager.backend.models.ChitStrategyType.FIXED_COMMISSION_PROGRESSIVE);
        chitGroup.setCommissionPercentage(dto.getCommissionPercentage());
        chitGroup.setBaseContribution(dto.getBaseContribution());
        chitGroup.setPostPayoutContribution(dto.getPostPayoutContribution());
        chitGroup.setPayoutAdjustmentValue(dto.getPayoutAdjustmentValue());
        chitGroup.setExpectedPayoutsPerMonth(1); // default
        
        ChitProfitStrategy strategy = profitCalculationService.getStrategy(chitGroup.getStrategyType());
        chitGroup.setEstimatedProfit(strategy.calculateEstimatedProfit(chitGroup));
        chitGroup.setProfitCalculated(false);
        
        return mapToDTO(chitGroupRepository.save(chitGroup));
    }

    @Transactional
    public void addMemberToChitGroup(Long chitGroupId, Long memberId) {
        ChitGroup chitGroup = chitGroupRepository.findById(chitGroupId)
                .orElseThrow(() -> new RuntimeException("Chit group not found"));
                
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        ChitMember chitMember = new ChitMember();
        chitMember.setChitGroup(chitGroup);
        chitMember.setMember(member);
        
        chitMemberRepository.save(chitMember);
    }

    @Transactional
    public void removeMemberFromChitGroup(Long chitGroupId, Long memberId) {
        List<ChitMember> memberships = chitMemberRepository.findByChitGroupId(chitGroupId);
        ChitMember target = memberships.stream()
                .filter(cm -> cm.getMember().getId().equals(memberId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Member assignment not found in this chit group"));
                
        chitMemberRepository.delete(target);
    }

    public List<Member> getChitGroupMembers(Long chitGroupId) {
        List<ChitMember> chitMembers = chitMemberRepository.findByChitGroupId(chitGroupId);
        return chitMembers.stream().map(ChitMember::getMember).collect(Collectors.toList());
    }

    @Transactional
    public void deleteChitGroup(Long id) {
        // 1. Delete all collections belonging to this chit group
        collectionRepository.deleteAll(collectionRepository.findByChitGroupId(id));
        
        // 2. Delete all actual payouts belonging to this chit group
        actualPayoutRepository.deleteAll(actualPayoutRepository.findByChitGroupIdOrderByPayoutDateAsc(id));
        
        // 3. Delete all expected payout plans belonging to this chit group
        payoutPlanRepository.deleteAll(payoutPlanRepository.findByChitGroupIdOrderByMonthNumberAsc(id));
        
        // 4. Delete all member associations belonging to this chit group
        chitMemberRepository.deleteAll(chitMemberRepository.findByChitGroupId(id));
        
        // 5. Delete the chit group itself
        chitGroupRepository.deleteById(id);
    }

    public Map<String, Object> getPendingDues(Long chitGroupId) {
        ChitGroup chitGroup = chitGroupRepository.findById(chitGroupId)
                .orElseThrow(() -> new RuntimeException("Chit group not found"));

        List<Member> members = getChitGroupMembers(chitGroupId);
        List<com.chitmanager.backend.models.ActualPayout> payouts = actualPayoutRepository.findByChitGroupIdOrderByPayoutDateAsc(chitGroupId);
        List<com.chitmanager.backend.models.Collection> collections = collectionRepository.findByChitGroupId(chitGroupId);

        // Determine current month index based on calendar time
        int currentMonth = 1;
        try {
            String startMonthStr = chitGroup.getStartMonth(); // e.g. "2026-05"
            if (startMonthStr != null && startMonthStr.contains("-")) {
                String[] parts = startMonthStr.split("-");
                int startYear = Integer.parseInt(parts[0]);
                int startMonthNum = Integer.parseInt(parts[1]);

                java.time.LocalDate now = java.time.LocalDate.now();
                int currentYear = now.getYear();
                int currentMonthNum = now.getMonthValue();

                int elapsed = (currentYear - startYear) * 12 + (currentMonthNum - startMonthNum) + 1;
                currentMonth = Math.min(Math.max(1, elapsed), chitGroup.getDurationMonths());
            }
        } catch (Exception e) {
            // fallback to max payout month or 1
            currentMonth = payouts.stream()
                    .mapToInt(com.chitmanager.backend.models.ActualPayout::getPayoutMonth)
                    .max()
                    .orElse(1);
        }

        List<Map<String, Object>> membersPending = new ArrayList<>();
        BigDecimal totalChitPendingAmount = BigDecimal.ZERO;

        for (Member member : members) {
            // Find when this member got paid
            Integer payoutMonth = null;
            for (com.chitmanager.backend.models.ActualPayout p : payouts) {
                if (p.getMember().getId().equals(member.getId())) {
                    payoutMonth = p.getPayoutMonth();
                    break;
                }
            }

            List<Map<String, Object>> pendingMonths = new ArrayList<>();
            BigDecimal memberPendingAmount = BigDecimal.ZERO;

            for (int m = 1; m <= currentMonth; m++) {
                final int monthNum = m;
                // Check if paid
                boolean isPaid = collections.stream()
                        .anyMatch(c -> c.getMember().getId().equals(member.getId()) 
                                && c.getForMonth() == monthNum 
                                && "PAID".equals(c.getStatus().toString()));

                if (!isPaid) {
                    BigDecimal amountDue = BigDecimal.ZERO;
                    if (com.chitmanager.backend.models.ChitStrategyType.FIXED_COMMISSION_PROGRESSIVE.equals(chitGroup.getStrategyType())) {
                        amountDue = chitGroup.getMonthlyCollection();
                    } else {
                        // INCREMENTAL_CONTRIBUTION
                        if (payoutMonth != null && monthNum > payoutMonth) {
                            amountDue = chitGroup.getPostPayoutContribution();
                        } else {
                            amountDue = chitGroup.getBaseContribution();
                        }
                    }

                    Map<String, Object> monthInfo = new HashMap<>();
                    monthInfo.put("monthNumber", monthNum);
                    monthInfo.put("amountDue", amountDue);
                    pendingMonths.add(monthInfo);

                    memberPendingAmount = memberPendingAmount.add(amountDue);
                }
            }

            if (!pendingMonths.isEmpty()) {
                Map<String, Object> memberInfo = new HashMap<>();
                memberInfo.put("memberId", member.getId());
                memberInfo.put("memberName", member.getName());
                memberInfo.put("memberPhone", member.getPhone());
                memberInfo.put("pendingMonths", pendingMonths);
                memberInfo.put("totalPending", memberPendingAmount);
                membersPending.add(memberInfo);

                totalChitPendingAmount = totalChitPendingAmount.add(memberPendingAmount);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("chitGroupId", chitGroupId);
        response.put("chitGroupName", chitGroup.getName());
        response.put("currentMonth", currentMonth);
        response.put("totalPendingAmount", totalChitPendingAmount);
        response.put("membersPending", membersPending);

        return response;
    }

    private ChitGroupDTO mapToDTO(ChitGroup chitGroup) {
        ChitGroupDTO dto = new ChitGroupDTO();
        dto.setId(chitGroup.getId());
        dto.setName(chitGroup.getName());
        dto.setTotalAmount(chitGroup.getTotalAmount());
        dto.setDurationMonths(chitGroup.getDurationMonths());
        dto.setMemberCount(chitGroup.getMemberCount());
        dto.setMonthlyCollection(chitGroup.getMonthlyCollection());
        dto.setStatus(chitGroup.getStatus());
        dto.setCreatedAt(chitGroup.getCreatedAt());
        dto.setStartMonth(chitGroup.getStartMonth());
        dto.setStrategyType(chitGroup.getStrategyType());
        dto.setCommissionPercentage(chitGroup.getCommissionPercentage());
        dto.setBaseContribution(chitGroup.getBaseContribution());
        dto.setPostPayoutContribution(chitGroup.getPostPayoutContribution());
        dto.setPayoutAdjustmentValue(chitGroup.getPayoutAdjustmentValue());
        dto.setEstimatedProfit(chitGroup.getEstimatedProfit());
        dto.setActualProfit(chitGroup.getActualProfit());
        dto.setProfitCalculated(chitGroup.getProfitCalculated());
        dto.setAssignedMemberCount(chitMemberRepository.findByChitGroupId(chitGroup.getId()).size());
        return dto;
    }
}
