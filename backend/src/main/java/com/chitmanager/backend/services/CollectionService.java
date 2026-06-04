package com.chitmanager.backend.services;

import com.chitmanager.backend.dto.CollectionDTO;
import com.chitmanager.backend.models.ChitGroup;
import com.chitmanager.backend.models.Collection;
import com.chitmanager.backend.models.Member;
import com.chitmanager.backend.repositories.ChitGroupRepository;
import com.chitmanager.backend.repositories.CollectionRepository;
import com.chitmanager.backend.repositories.MemberRepository;
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

    @Transactional
    public CollectionDTO recordCollection(CollectionDTO dto) {
        ChitGroup chitGroup = chitGroupRepository.findById(dto.getChitGroupId())
                .orElseThrow(() -> new RuntimeException("Chit group not found"));

        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        Collection collection = new Collection();
        if (dto.getId() != null) {
            collection = collectionRepository.findById(dto.getId())
                    .orElseThrow(() -> new RuntimeException("Collection record not found"));
        } else {
            collection.setChitGroup(chitGroup);
            collection.setMember(member);
            collection.setForMonth(dto.getForMonth());
        }

        collection.setAmountPaid(dto.getAmountPaid());
        collection.setStatus(dto.getStatus());
        collection.setPaymentDate(dto.getPaymentDate());
        collection.setRemarks(dto.getRemarks());

        return mapToDTO(collectionRepository.save(collection));
    }

    public List<CollectionDTO> getCollectionsForChitAndMonth(Long chitGroupId, Integer forMonth) {
        return collectionRepository.findByChitGroupIdAndForMonth(chitGroupId, forMonth)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<CollectionDTO> getCollectionsForChit(Long chitGroupId) {
        return collectionRepository.findByChitGroupId(chitGroupId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<CollectionDTO> getCollectionsForMember(Long memberId) {
        return collectionRepository.findByMemberId(memberId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public void deleteCollection(Long id) {
        if (!collectionRepository.existsById(id)) {
            throw new RuntimeException("Collection record not found");
        }
        collectionRepository.deleteById(id);
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
        return dto;
    }
}
