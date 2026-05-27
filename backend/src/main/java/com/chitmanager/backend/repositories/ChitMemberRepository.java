package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.ChitMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChitMemberRepository extends JpaRepository<ChitMember, Long> {
    List<ChitMember> findByChitGroupId(Long chitGroupId);
    List<ChitMember> findByMemberId(Long memberId);
}
