package com.chitmanager.backend.repositories;

import com.chitmanager.backend.models.ChitGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChitGroupRepository extends JpaRepository<ChitGroup, Long> {
}
