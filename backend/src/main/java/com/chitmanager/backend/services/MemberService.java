package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.MemberDTO;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.repositories.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.chitmanager.backend.security.SecurityUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MemberService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private LoanPaymentRepository loanPaymentRepository;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private ActualPayoutRepository actualPayoutRepository;

    @Autowired
    private ChitMemberRepository chitMemberRepository;

    @Autowired
    private MemberRepository memberRepository;

    public List<MemberDTO> getAllMembers() {
        String tenantId = SecurityUtils.getTenantId();
        return memberRepository.findAllByTenantId(tenantId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public MemberDTO getMemberById(Long id) {
        String tenantId = SecurityUtils.getTenantId();
        Member member = memberRepository.findByTenantIdAndId(tenantId, id).orElseThrow(() -> new RuntimeException("Member not found"));
        return mapToDTO(member);
    }

    public MemberDTO createMember(MemberDTO dto) {
        String tenantId = SecurityUtils.getTenantId();
        Member member = new Member();
        member.setTenantId(tenantId);
        member.setName(dto.getName());
        member.setPhone(dto.getPhone());
        member.setAddress(dto.getAddress());
        member.setNominee(dto.getNominee());
        member.setGuarantor(dto.getGuarantor());
        member.setJoiningDate(dto.getJoiningDate());
        
        return mapToDTO(memberRepository.save(member));
    }

    public MemberDTO updateMember(Long id, MemberDTO dto) {
        String tenantId = SecurityUtils.getTenantId();
        Member member = memberRepository.findByTenantIdAndId(tenantId, id).orElseThrow(() -> new RuntimeException("Member not found"));
        member.setName(dto.getName());
        member.setPhone(dto.getPhone());
        member.setAddress(dto.getAddress());
        member.setNominee(dto.getNominee());
        member.setGuarantor(dto.getGuarantor());
        
        return mapToDTO(memberRepository.save(member));
    }

    @Transactional
    public void deleteMember(Long id) {
        String tenantId = SecurityUtils.getTenantId();
        Member member = memberRepository.findByTenantIdAndId(tenantId, id).orElseThrow(() -> new RuntimeException("Member not found"));

        // 1. Delete all loan payments for this member's loans
        loanRepository.findByTenantIdAndMemberId(tenantId, id).forEach(loan -> {
            loanPaymentRepository.deleteAll(loanPaymentRepository.findByTenantIdAndLoanId(tenantId, loan.getId()));
        });
        
        // 2. Delete all loans for this member
        loanRepository.deleteAll(loanRepository.findByTenantIdAndMemberId(tenantId, id));
        
        // 3. Delete all collections for this member
        collectionRepository.deleteAll(collectionRepository.findByTenantIdAndMemberId(tenantId, id));
        
        // 4. Delete all actual payouts for this member
        actualPayoutRepository.deleteAll(actualPayoutRepository.findByTenantIdAndMemberId(tenantId, id));
        
        // 5. Delete all memberships for this member
        chitMemberRepository.deleteAll(chitMemberRepository.findByTenantIdAndMemberId(tenantId, id));
        
        // 6. Delete the member record itself
        memberRepository.delete(member);
    }

    public com.chitmanager.backend.dto.MemberDetailsDTO getMemberDetails(Long id) {
        String tenantId = SecurityUtils.getTenantId();
        Member member = memberRepository.findByTenantIdAndId(tenantId, id).orElseThrow(() -> new RuntimeException("Member not found"));
        
        List<com.chitmanager.backend.dto.ChitGroupDTO> chits = chitMemberRepository.findByTenantIdAndMemberId(tenantId, id).stream()
                .map(cm -> {
                    com.chitmanager.backend.models.ChitGroup cg = cm.getChitGroup();
                    com.chitmanager.backend.dto.ChitGroupDTO dto = new com.chitmanager.backend.dto.ChitGroupDTO();
                    dto.setId(cg.getId());
                    dto.setName(cg.getName());
                    dto.setTotalAmount(cg.getTotalAmount());
                    dto.setDurationMonths(cg.getDurationMonths());
                    dto.setMemberCount(cg.getMemberCount());
                    dto.setMonthlyCollection(cg.getMonthlyCollection());
                    dto.setStatus(cg.getStatus());
                    dto.setStartMonth(cg.getStartMonth());
                    dto.setStrategyType(cg.getStrategyType());
                    dto.setCommissionPercentage(cg.getCommissionPercentage());
                    dto.setBaseContribution(cg.getBaseContribution());
                    dto.setPostPayoutContribution(cg.getPostPayoutContribution());
                    dto.setPayoutAdjustmentValue(cg.getPayoutAdjustmentValue());
                    dto.setEstimatedProfit(cg.getEstimatedProfit());
                    dto.setActualProfit(cg.getActualProfit());
                    dto.setProfitCalculated(cg.getProfitCalculated());
                    dto.setCreatedAt(cg.getCreatedAt());
                    return dto;
                }).collect(Collectors.toList());

        List<com.chitmanager.backend.dto.LoanDTO> loans = loanRepository.findByTenantIdAndMemberId(tenantId, id).stream()
                .map(loan -> {
                    com.chitmanager.backend.dto.LoanDTO dto = new com.chitmanager.backend.dto.LoanDTO();
                    dto.setId(loan.getId());
                    dto.setMemberId(loan.getMember().getId());
                    dto.setMemberName(loan.getMember().getName());
                    dto.setAmount(loan.getAmount());
                    dto.setInterestRate(loan.getInterestRate());
                    dto.setStartDate(loan.getStartDate());
                    dto.setEndDate(loan.getEndDate());
                    dto.setStatus(loan.getStatus());
                    dto.setCalculatedInterest(loan.getCalculatedInterest());
                    dto.setTotalRepayableAmount(loan.getTotalRepayableAmount());
                    dto.setRemarks(loan.getRemarks());
                    dto.setInterestType(loan.getInterestType() != null ? loan.getInterestType() : "ACCUMULATED");

                    if (loan.getId() != null) {
                        java.math.BigDecimal collected = loanPaymentRepository.findByTenantIdAndLoanId(tenantId, loan.getId()).stream()
                                .filter(p -> "INTEREST".equals(p.getPaymentType()))
                                .map(com.chitmanager.backend.models.LoanPayment::getAmount)
                                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                        dto.setCollectedInterest(collected.setScale(2, java.math.RoundingMode.HALF_UP));
                    } else {
                        dto.setCollectedInterest(java.math.BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP));
                    }

                    return dto;
                }).collect(Collectors.toList());

        com.chitmanager.backend.dto.MemberDetailsDTO details = new com.chitmanager.backend.dto.MemberDetailsDTO();
        details.setMember(mapToDTO(member));
        details.setChits(chits);
        details.setLoans(loans);
        
        return details;
    }

    private MemberDTO mapToDTO(Member member) {
        MemberDTO dto = new MemberDTO();
        dto.setId(member.getId());
        dto.setName(member.getName());
        dto.setPhone(member.getPhone());
        dto.setAddress(member.getAddress());
        dto.setNominee(member.getNominee());
        dto.setGuarantor(member.getGuarantor());
        dto.setJoiningDate(member.getJoiningDate());
        dto.setCreatedAt(member.getCreatedAt());
        return dto;
    }
}
