package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {
    List<Collection> findByChitGroupIdAndForMonth(Long chitGroupId, Integer forMonth);
    List<Collection> findByChitGroupId(Long chitGroupId);
    List<Collection> findByMemberId(Long memberId);
    List<Collection> findByTenantIdAndChitGroupIdAndForMonth(String tenantId, Long chitGroupId, Integer forMonth);
    List<Collection> findByTenantIdAndChitGroupId(String tenantId, Long chitGroupId);
    List<Collection> findByTenantIdAndMemberId(String tenantId, Long memberId);
    List<Collection> findAllByTenantId(String tenantId);
    Optional<Collection> findByTenantIdAndId(String tenantId, Long id);
    void deleteByTenantId(String tenantId);
}
