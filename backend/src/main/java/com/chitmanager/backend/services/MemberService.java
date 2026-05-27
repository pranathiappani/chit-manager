package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.MemberDTO;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.repositories.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MemberService {

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

    public void deleteMember(Long id) {
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
