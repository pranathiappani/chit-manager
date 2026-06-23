package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    Optional<Tenant> findByUsername(String username);
    Optional<Tenant> findByTenantId(String tenantId);
}
