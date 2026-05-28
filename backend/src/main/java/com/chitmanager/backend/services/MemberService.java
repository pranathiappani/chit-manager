package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.MemberDTO;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.repositories.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
        return memberRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public MemberDTO getMemberById(Long id) {
        Member member = memberRepository.findById(id).orElseThrow(() -> new RuntimeException("Member not found"));
        return mapToDTO(member);
    }

    public MemberDTO createMember(MemberDTO dto) {
        Member member = new Member();
        member.setName(dto.getName());
        member.setPhone(dto.getPhone());
        member.setAddress(dto.getAddress());
        member.setNominee(dto.getNominee());
        member.setGuarantor(dto.getGuarantor());
        member.setJoiningDate(dto.getJoiningDate());
        
        return mapToDTO(memberRepository.save(member));
    }

    public MemberDTO updateMember(Long id, MemberDTO dto) {
        Member member = memberRepository.findById(id).orElseThrow(() -> new RuntimeException("Member not found"));
        member.setName(dto.getName());
        member.setPhone(dto.getPhone());
        member.setAddress(dto.getAddress());
        member.setNominee(dto.getNominee());
        member.setGuarantor(dto.getGuarantor());
        
        return mapToDTO(memberRepository.save(member));
    }

    @Transactional
    public void deleteMember(Long id) {
        // 1. Delete all loan payments for this member's loans
        loanRepository.findByMemberId(id).forEach(loan -> {
            loanPaymentRepository.deleteAll(loanPaymentRepository.findByLoanId(loan.getId()));
        });
        
        // 2. Delete all loans for this member
        loanRepository.deleteAll(loanRepository.findByMemberId(id));
        
        // 3. Delete all collections for this member
        collectionRepository.deleteAll(collectionRepository.findByMemberId(id));
        
        // 4. Delete all actual payouts for this member
        actualPayoutRepository.deleteAll(actualPayoutRepository.findByMemberId(id));
        
        // 5. Delete all memberships for this member
        chitMemberRepository.deleteAll(chitMemberRepository.findByMemberId(id));
        
        // 6. Delete the member record itself
        memberRepository.deleteById(id);
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
