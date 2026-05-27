package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {
    List<Collection> findByChitGroupIdAndForMonth(Long chitGroupId, Integer forMonth);
    List<Collection> findByChitGroupId(Long chitGroupId);
    List<Collection> findByMemberId(Long memberId);
}
