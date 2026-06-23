package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.ChitMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface ChitMemberRepository extends JpaRepository<ChitMember, Long> {
    List<ChitMember> findByChitGroupId(Long chitGroupId);
    List<ChitMember> findByMemberId(Long memberId);
    List<ChitMember> findByTenantIdAndChitGroupId(String tenantId, Long chitGroupId);
    List<ChitMember> findByTenantIdAndMemberId(String tenantId, Long memberId);
    Optional<ChitMember> findByTenantIdAndId(String tenantId, Long id);
    List<ChitMember> findAllByTenantId(String tenantId);
    void deleteByTenantId(String tenantId);
}
