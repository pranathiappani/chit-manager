package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findAllByTenantId(String tenantId);
    Optional<Member> findByTenantIdAndId(String tenantId, Long id);
    void deleteByTenantId(String tenantId);
    long countByTenantId(String tenantId);
}
