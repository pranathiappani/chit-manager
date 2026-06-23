package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.ChitGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChitGroupRepository extends JpaRepository<ChitGroup, Long> {
    List<ChitGroup> findAllByTenantId(String tenantId);
    Optional<ChitGroup> findByTenantIdAndId(String tenantId, Long id);
    void deleteByTenantId(String tenantId);
}
