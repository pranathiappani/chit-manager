package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.CollectionDTO;
import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.Collection;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.models.ChitMember;
import com.chitmanager.backend.repositories.ChitGroupRepository;
import com.chitmanager.backend.repositories.CollectionRepository;
import com.chitmanager.backend.repositories.MemberRepository;
import com.chitmanager.backend.repositories.ChitMemberRepository;
import com.chitmanager.backend.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CollectionService {

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private ChitGroupRepository chitGroupRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private ChitMemberRepository chitMemberRepository;

    @Transactional
    public CollectionDTO recordCollection(CollectionDTO dto) {
        String tenantId = SecurityUtils.getTenantId();
        ChitGroup chitGroup = chitGroupRepository.findByTenantIdAndId(tenantId, dto.getChitGroupId())
                .orElseThrow(() -> new RuntimeException("Chit group not found"));

        Member member = memberRepository.findByTenantIdAndId(tenantId, dto.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        Collection collection = new Collection();
        if (dto.getId() != null) {
            collection = collectionRepository.findByTenantIdAndId(tenantId, dto.getId())
                    .orElseThrow(() -> new RuntimeException("Collection record not found"));
        } else {
            collection.setTenantId(tenantId);
            collection.setChitGroup(chitGroup);
            collection.setMember(member);
            collection.setForMonth(dto.getForMonth());
        }

        if (dto.getChitMemberId() != null) {
            ChitMember chitMember = chitMemberRepository.findByTenantIdAndId(tenantId, dto.getChitMemberId())
                    .orElseThrow(() -> new RuntimeException("Chit member slot not found"));
            collection.setChitMember(chitMember);
        }

        collection.setAmountPaid(dto.getAmountPaid());
        collection.setStatus(dto.getStatus());
        collection.setPaymentDate(dto.getPaymentDate());
        collection.setRemarks(dto.getRemarks());

        return mapToDTO(collectionRepository.save(collection));
    }

    public List<CollectionDTO> getCollectionsForChitAndMonth(Long chitGroupId, Integer forMonth) {
        String tenantId = SecurityUtils.getTenantId();
        return collectionRepository.findByTenantIdAndChitGroupIdAndForMonth(tenantId, chitGroupId, forMonth)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<CollectionDTO> getCollectionsForChit(Long chitGroupId) {
        String tenantId = SecurityUtils.getTenantId();
        return collectionRepository.findByTenantIdAndChitGroupId(tenantId, chitGroupId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<CollectionDTO> getCollectionsForMember(Long memberId) {
        String tenantId = SecurityUtils.getTenantId();
        return collectionRepository.findByTenantIdAndMemberId(tenantId, memberId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public void deleteCollection(Long id) {
        String tenantId = SecurityUtils.getTenantId();
        Collection collection = collectionRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("Collection record not found"));
        collectionRepository.delete(collection);
    }

    private CollectionDTO mapToDTO(Collection collection) {
        CollectionDTO dto = new CollectionDTO();
        dto.setId(collection.getId());
        dto.setChitGroupId(collection.getChitGroup().getId());
        dto.setMemberId(collection.getMember().getId());
        dto.setMemberName(collection.getMember().getName());
        dto.setForMonth(collection.getForMonth());
        dto.setAmountPaid(collection.getAmountPaid());
        dto.setStatus(collection.getStatus());
        dto.setPaymentDate(collection.getPaymentDate());
        dto.setRemarks(collection.getRemarks());
        dto.setChitMemberId(collection.getChitMember() != null ? collection.getChitMember().getId() : null);
        return dto;
    }
}
