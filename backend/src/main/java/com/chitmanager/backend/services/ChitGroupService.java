package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.ChitGroupDTO;
import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.ChitGroupStatus;
import com.chitmanager.backend.models.ChitMember;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.repositories.ChitGroupRepository;
import com.chitmanager.backend.repositories.ChitMemberRepository;
import com.chitmanager.backend.repositories.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    public List<Member> getChitGroupMembers(Long chitGroupId) {
        List<ChitMember> chitMembers = chitMemberRepository.findByChitGroupId(chitGroupId);
        return chitMembers.stream().map(ChitMember::getMember).collect(Collectors.toList());
    }

    @Transactional
    public void deleteChitGroup(Long id) {
        // Find and delete the chit group. Assuming database handles cascades or there are no connected rows yet.
        // In a strict prod environment we would manually delete child entities (Payouts, Collections, Memberships) first.
        chitGroupRepository.deleteById(id);
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
        return dto;
    }
}
